using System;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using LinqToDB;
using System.Collections.Generic;
using System.IO;
using DbUp;
using System.Security.Claims;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;

namespace MyApp;

// Native AOT requires ahead-of-time declaration of types to be serialized to JSON.
// Instead of the JIT compiling serialization code at runtime, the compiler generates it at build time.
// Ref: https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/source-generation
[JsonSerializable(typeof(HealthResponse))]
[JsonSerializable(typeof(User))]
[JsonSerializable(typeof(List<User>))]
[JsonSerializable(typeof(RegisterRequest))]
[JsonSerializable(typeof(RegisterResponse))]
[JsonSerializable(typeof(LoginRequest))]
[JsonSerializable(typeof(LoginResponse))]
internal partial class AppJsonContext : JsonSerializerContext { }

// Ref: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record
public readonly record struct HealthResponse(string Status, string Message);
public readonly record struct RegisterRequest(string Email, string Password);
public readonly record struct RegisterResponse(string Status, string Message);
public readonly record struct LoginRequest(string Email, string Password);
public readonly record struct LoginResponse(string Status, string Token);

public class Program
{
    public static void Main(string[] args)
    {
        // CreateSlimBuilder: minimal builder that trims out middleware not needed for Native AOT.
        // Ref: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-8.0#createslimbuilder
        var builder = WebApplication.CreateSlimBuilder(args);

        // Load the connection string from environment variables (must be injected via Docker Compose)
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("Error: ConnectionStrings__DefaultConnection environment variable is not set!");

        // Run DbUp Migrations
        var upgrader = DbUp.DeployChanges.To
            .MySqlDatabase(connectionString)
            .WithScriptsFromFileSystem(Path.Combine(AppContext.BaseDirectory, "Scripts"))
            .LogToConsole()
            .Build();

        if (upgrader.IsUpgradeRequired())
        {
            var result = upgrader.PerformUpgrade();
            if (!result.Successful)
            {
                Console.WriteLine($"DB Upgrade Failed: {result.Error}");
                return; // fail fast
            }
            Console.WriteLine("DB Upgrade Success");
        }

        // Configure JWT (JSON Web Token)
        // CRITICAL NOTE: The secret string used for HmacSha256 MUST be at least 32 characters (256-bit) long!
        var rawKey = builder.Configuration["Jwt:Key"] ?? "okrandom-must-be-at-least-32-chars-long-or-it-will-crash!";
        var jwtKey = Encoding.ASCII.GetBytes(rawKey);

        // Tell the system: The default Authentication and Challenge schemes will use the Bearer Token standard.
        builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            // STRICT HTTPS FLAG: Toggle this securely across environments via AppSettings or Env variables (.env)!
            // Example: Inject `Jwt__RequireHttps=false` during Docker Prod testing locally. Default is false if omitted.
            options.RequireHttpsMetadata = builder.Configuration.GetValue<bool>("Jwt:RequireHttps", false); 
            
            // Save the Token code in HttpContext so the system can easily extract token info later.
            options.SaveToken = true;
            
            // TOKEN DECODING "GATEKEEPER" RULES:
            options.TokenValidationParameters = new TokenValidationParameters
            {
                // RULE 1: MUST we verify the signature matches? -> YES (To prevent token forgery)
                ValidateIssuerSigningKey = true,
                
                // Use the original jwtKey provided for the gatekeeper to compare against.
                IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
                
                // RULE 2: Check the Token Issuer Domain and Target Audience Domain?
                // Temporarily disabled (false) because our API runs on a single platform. If the signature matches, open the door!
                ValidateIssuer = false,
                ValidateAudience = false
            };
        });

        builder.Services.AddAuthorization();

        // Configure Linq2db to allow Native AOT to use MariaDB connection.
        builder.Services.AddTransient<AppDbContext>(sp => new AppDbContext(connectionString));

        // Register the JSON serialization context for AOT - ensures explicit serialization without reflection magic.
        // Ref: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/native-aot?view=aspnetcore-8.0#the-web-api-native-aot-template
        builder.Services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonContext.Default);
        });

        var app = builder.Build();

        app.UseAuthentication();
        app.UseAuthorization();

        // Minimal API routing.
        // Ref: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/route-handlers?view=aspnetcore-8.0
        app.MapGet("/", () => new HealthResponse("ok", "MyApp API is running"));

        app.MapGet("/users", async (AppDbContext db) => await db.Users.ToListAsync()).RequireAuthorization();

        app.MapPost("/login", async (LoginRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return Microsoft.AspNetCore.Http.Results.BadRequest(new LoginResponse("error", "Email and Password are required."));

            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Microsoft.AspNetCore.Http.Results.Unauthorized();

            // Generate JWT Token
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity([new Claim(ClaimTypes.Email, user.Email)]),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(jwtKey), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwtString = tokenHandler.WriteToken(token);

            return Microsoft.AspNetCore.Http.Results.Ok(new LoginResponse("ok", jwtString));
        });

        app.MapPost("/register", async (RegisterRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return Microsoft.AspNetCore.Http.Results.BadRequest(new RegisterResponse("error", "Email and Password are required."));

            var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            if (existingUser != null)
                return Microsoft.AspNetCore.Http.Results.Conflict(new RegisterResponse("error", "Email already exists."));

            var hash = BCrypt.Net.BCrypt.HashPassword(req.Password);
            var newUser = new User
            {
                Id = Guid.NewGuid(),
                Email = req.Email,
                PasswordHash = hash
            };

            await db.InsertAsync(newUser);
            return Microsoft.AspNetCore.Http.Results.Created($"/users/{newUser.Id}", new RegisterResponse("ok", "User registered successfully."));
        });

        app.Run();
    }
}
