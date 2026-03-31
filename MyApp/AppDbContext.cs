using System;
using LinqToDB;
using LinqToDB.Data;
using LinqToDB.DataProvider.MySql;
using LinqToDB.Mapping;

namespace MyApp;

// Replaced EF Core DbContext with LinqToDB DataConnection
public class AppDbContext : DataConnection
{
    public AppDbContext(string connectionString) : base(ProviderName.MySqlConnector, connectionString)
    {
    }

    public ITable<User> Users => this.GetTable<User>();
}

// Represents the 'Users' table in the MariaDB database
[Table(Name = "Users")]
public class User
{
    [PrimaryKey]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column(Name = "Email"), NotNull]
    public string Email { get; set; } = string.Empty;

    [Column(Name = "PasswordHash"), NotNull]
    public string PasswordHash { get; set; } = string.Empty;
}
