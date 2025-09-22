using System.ComponentModel.DataAnnotations;

namespace BasketballTrackerAPI.Models
{
    public class Lift
    {
        public int Id { get; set; }
        
        [Required]
        public int PlayerId { get; set; }
        
        [Required]
        [StringLength(50)]
        public string ExerciseName { get; set; } = string.Empty;
        
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Weight must be a positive number")]
        public double Weight { get; set; }
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Reps must be at least 1")]
        public int Reps { get; set; }
        
        [Range(1, int.MaxValue, ErrorMessage = "Sets must be at least 1")]
        public int Sets { get; set; } = 1;
        
        public string? Notes { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public Player? Player { get; set; }
        
        // Computed property for one-rep max estimation (using Epley formula)
        public double EstimatedOneRepMax => Weight * (1 + (Reps / 30.0));
    }
}
