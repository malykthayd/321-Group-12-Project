using Microsoft.EntityFrameworkCore;
using BasketballTrackerAPI.Models;

namespace BasketballTrackerAPI.Data
{
    public class BasketballTrackerContext : DbContext
    {
        public BasketballTrackerContext(DbContextOptions<BasketballTrackerContext> options) : base(options)
        {
        }

        public DbSet<Player> Players { get; set; }
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<Workout> Workouts { get; set; }
        public DbSet<WorkoutSet> WorkoutSets { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Player entity (consolidated User + Player)
            modelBuilder.Entity<Player>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Position).IsRequired().HasMaxLength(20);
                entity.Property(e => e.PhotoUrl).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
                
                // Create unique index on email
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Exercise configuration
            modelBuilder.Entity<Exercise>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Category).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
            });

            // Workout configuration
            modelBuilder.Entity<Workout>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Date).IsRequired();
                entity.Property(e => e.Notes).HasMaxLength(200);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                entity.HasOne(w => w.Player)
                      .WithMany()
                      .HasForeignKey(w => w.PlayerId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // WorkoutSet configuration
            modelBuilder.Entity<WorkoutSet>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.SetNumber).IsRequired();
                entity.Property(e => e.Reps).IsRequired();
                entity.Property(e => e.Weight).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();

                entity.HasOne(ws => ws.Workout)
                      .WithMany(w => w.Sets)
                      .HasForeignKey(ws => ws.WorkoutId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ws => ws.Exercise)
                      .WithMany()
                      .HasForeignKey(ws => ws.ExerciseId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
