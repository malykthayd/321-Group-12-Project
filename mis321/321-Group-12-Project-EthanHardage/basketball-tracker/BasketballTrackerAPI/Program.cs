using Microsoft.EntityFrameworkCore;
using BasketballTrackerAPI.Data;
using BasketballTrackerAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add Entity Framework with SQLite
builder.Services.AddDbContext<BasketballTrackerContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Use CORS
app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

// Seed default exercises if none exist
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<BasketballTrackerContext>();
    context.Database.Migrate();
    if (!context.Exercises.Any())
    {
        var now = DateTime.UtcNow;
        var defaults = new List<Exercise>
        {
            new Exercise { Name = "Bench Press", Category = "Upper Body", CreatedAt = now, UpdatedAt = now },
            new Exercise { Name = "Squat", Category = "Lower Body", CreatedAt = now, UpdatedAt = now },
            new Exercise { Name = "Deadlift", Category = "Lower Body", CreatedAt = now, UpdatedAt = now },
            new Exercise { Name = "Rows", Category = "Upper Body", CreatedAt = now, UpdatedAt = now },
            new Exercise { Name = "Curls", Category = "Upper Body", CreatedAt = now, UpdatedAt = now },
            new Exercise { Name = "Incline Bench Press", Category = "Upper Body", CreatedAt = now, UpdatedAt = now },
            new Exercise { Name = "Flys", Category = "Upper Body", CreatedAt = now, UpdatedAt = now },
            new Exercise { Name = "Leg Press", Category = "Lower Body", CreatedAt = now, UpdatedAt = now }
        };
        context.Exercises.AddRange(defaults);
        context.SaveChanges();
    }
}

app.Run();
