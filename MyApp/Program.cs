using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace MyApp;

// Native AOT requires ahead-of-time declaration of types to be serialized to JSON.
// Instead of the JIT compiling serialization code at runtime, the compiler generates it at build time.
// Ref: https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/source-generation
[JsonSerializable(typeof(HealthResponse))]
internal partial class AppJsonContext : JsonSerializerContext { }

// Ref: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record
public readonly record struct HealthResponse(string Status, string Message);

public class Program
{
    public static void Main(string[] args)
    {
        // CreateSlimBuilder: minimal builder that trims out middleware not needed for Native AOT.
        // Ref: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-8.0#createslimbuilder
        var builder = WebApplication.CreateSlimBuilder(args);

        // Register the JSON serialization context for AOT - ensures explicit serialization without reflection magic.
        // Ref: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/native-aot?view=aspnetcore-8.0#the-web-api-native-aot-template
        builder.Services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonContext.Default);
        });

        var app = builder.Build();

        // Minimal API routing.
        // Ref: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/route-handlers?view=aspnetcore-8.0
        app.MapGet("/", () => new HealthResponse("ok", "MyApp API is running"));

        app.Run();
    }
}
