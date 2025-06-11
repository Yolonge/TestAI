using Microsoft.EntityFrameworkCore;
using CodeDuelPlatform.Models;
using CodeDuelPlatform.Models.Enums;

namespace CodeDuelPlatform.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
            : base(options)
        {
        }
        
        public DbSet<User> Users { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Duel> Duels { get; set; }
        public DbSet<DuelQuestion> DuelQuestions { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Настройка связей между сущностями
            
            // Связь между User и Duel для FirstUser
            modelBuilder.Entity<Duel>()
                .HasOne(d => d.FirstUser)
                .WithMany(u => u.DuelsAsFirstUser)
                .HasForeignKey(d => d.FirstUserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Связь между User и Duel для SecondUser
            modelBuilder.Entity<Duel>()
                .HasOne(d => d.SecondUser)
                .WithMany(u => u.DuelsAsSecondUser)
                .HasForeignKey(d => d.SecondUserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Связь между User и Duel для Winner
            modelBuilder.Entity<Duel>()
                .HasOne(d => d.Winner)
                .WithMany()
                .HasForeignKey(d => d.WinnerId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);
                
            // Настройка уникальности username
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();
                
            // Настройка уникальности email
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
                
            // Настройка для модели Question
            modelBuilder.Entity<Question>()
                .HasIndex(q => q.QuestionType);
                
            // Создаем составной индекс по типу вопроса и категории для быстрого поиска
            modelBuilder.Entity<Question>()
                .HasIndex(q => new { q.QuestionType, q.Category });
                
            // Создаем частичные индексы для каждого типа вопросов для оптимизации
            modelBuilder.Entity<Question>()
                .HasIndex(q => q.Id)
                .HasFilter($"\"QuestionType\" = {(int)QuestionType.TextInput}")
                .HasDatabaseName("IX_Questions_TextInput");
                
            modelBuilder.Entity<Question>()
                .HasIndex(q => q.Id)
                .HasFilter($"\"QuestionType\" = {(int)QuestionType.MultipleChoice}")
                .HasDatabaseName("IX_Questions_MultipleChoice");
                
            modelBuilder.Entity<Question>()
                .HasIndex(q => q.Id)
                .HasFilter($"\"QuestionType\" = {(int)QuestionType.FillBlanks}")
                .HasDatabaseName("IX_Questions_FillBlanks");
                
            // Создаем GIN индекс для Options (JSONB) - помогает с поиском
            modelBuilder.Entity<Question>()
                .HasIndex(q => q.Options)
                .HasMethod("GIN")
                .HasDatabaseName("IX_Questions_Options_GIN");
                
            // Создаем GIN индекс для BlanksData (JSONB)
            modelBuilder.Entity<Question>()
                .HasIndex(q => q.BlanksData)
                .HasMethod("GIN")
                .HasDatabaseName("IX_Questions_BlanksData_GIN");
        }
    }
} 