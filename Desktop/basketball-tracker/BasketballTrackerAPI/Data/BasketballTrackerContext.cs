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
        public DbSet<Lift> Lifts { get; set; }
        public DbSet<LiftHistory> LiftHistories { get; set; }

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

            // Configure Lift entity
            modelBuilder.Entity<Lift>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ExerciseName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Weight).IsRequired().HasColumnType("decimal(10,2)");
                entity.Property(e => e.Reps).IsRequired();
                entity.Property(e => e.Sets).IsRequired();
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.UpdatedAt).IsRequired();
                
                // Foreign key relationship
                entity.HasOne(e => e.Player)
                      .WithMany()
                      .HasForeignKey(e => e.PlayerId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure LiftHistory entity
            modelBuilder.Entity<LiftHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ExerciseName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Weight).IsRequired().HasColumnType("decimal(10,2)");
                entity.Property(e => e.Reps).IsRequired();
                entity.Property(e => e.Sets).IsRequired();
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.WorkoutDate).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                
                // Foreign key relationship
                entity.HasOne(e => e.Player)
                      .WithMany()
                      .HasForeignKey(e => e.PlayerId)
                      .OnDelete(DeleteBehavior.Cascade);
                
                // Create index for efficient querying by player and exercise
                entity.HasIndex(e => new { e.PlayerId, e.ExerciseName, e.WorkoutDate });
            });
        }
    }
}
