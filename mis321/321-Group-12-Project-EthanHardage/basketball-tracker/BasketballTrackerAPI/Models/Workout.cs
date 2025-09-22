using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BasketballTrackerAPI.Models
{
    public class Workout
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PlayerId { get; set; }

        [ForeignKey(nameof(PlayerId))]
        public Player? Player { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [MaxLength(200)]
        public string? Notes { get; set; }

        public ICollection<WorkoutSet> Sets { get; set; } = new List<WorkoutSet>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
