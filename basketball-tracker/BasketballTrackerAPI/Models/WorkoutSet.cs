using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace BasketballTrackerAPI.Models
{
    public class WorkoutSet
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int WorkoutId { get; set; }

        [ForeignKey(nameof(WorkoutId))]
        [JsonIgnore]
        public Workout? Workout { get; set; }

        [Required]
        public int ExerciseId { get; set; }

        [ForeignKey(nameof(ExerciseId))]
        public Exercise? Exercise { get; set; }

        [Required]
        public int SetNumber { get; set; }

        [Required]
        public int Reps { get; set; }

        [Required]
        public double Weight { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
