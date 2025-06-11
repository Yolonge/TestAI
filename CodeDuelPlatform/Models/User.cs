using System.ComponentModel.DataAnnotations;

namespace CodeDuelPlatform.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Username { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        public string PasswordHash { get; set; }
        
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;
        
        public int TotalWins { get; set; } = 0;
        
        public int TotalLosses { get; set; } = 0;
        
        public int Rating { get; set; } = 1000;
        
        public bool IsSearchingOpponent { get; set; } = false;
        
        // Навигационное свойство для дуэлей, где пользователь был первым участником
        public ICollection<Duel> DuelsAsFirstUser { get; set; }
        
        // Навигационное свойство для дуэлей, где пользователь был вторым участником
        public ICollection<Duel> DuelsAsSecondUser { get; set; }
    }
} 