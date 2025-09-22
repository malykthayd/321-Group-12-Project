using System.ComponentModel.DataAnnotations;

namespace BasketballTrackerAPI.Models
{
    public class Player
    {
        public int Id { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(20)]
        public string Position { get; set; } = string.Empty;
        
        public string? PhotoUrl { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Computed property for full name
        public string FullName => $"{FirstName} {LastName}";
    }
}
