using CodeDuelPlatform.Data;
using CodeDuelPlatform.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CodeDuelPlatform.Services
{
    public class UserService
    {
        private readonly ApplicationDbContext _context;

        public UserService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Регистрирует нового пользователя
        /// </summary>
        public async Task<User> RegisterUserAsync(string username, string email, string password)
        {
            // Проверяем, не существует ли пользователь с таким именем или email
            if (await _context.Users.AnyAsync(u => u.Username == username))
                throw new Exception("Пользователь с таким именем уже существует");

            if (await _context.Users.AnyAsync(u => u.Email == email))
                throw new Exception("Пользователь с таким email уже существует");

            // Создаем хеш пароля
            string passwordHash = HashPassword(password);

            // Создаем нового пользователя
            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = passwordHash,
                RegistrationDate = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }

        /// <summary>
        /// Аутентифицирует пользователя
        /// </summary>
        public async Task<(User user, bool isAdmin)> AuthenticateUserAsync(string usernameOrEmail, string password)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == usernameOrEmail || u.Email == usernameOrEmail);

            if (user == null)
                return (null, false);

            string passwordHash = HashPassword(password);
            if (user.PasswordHash != passwordHash)
                return (null, false);

            // Проверка на админа (хардкод для admin/admin)
            bool isAdmin = user.Username == "admin";

            return (user, isAdmin);
        }

        /// <summary>
        /// Получает пользователя по ID
        /// </summary>
        public async Task<User> GetUserByIdAsync(int userId)
        {
            return await _context.Users.FindAsync(userId);
        }

        /// <summary>
        /// Обновляет статус поиска оппонента
        /// </summary>
        public async Task UpdateSearchStatusAsync(int userId, bool isSearching)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new Exception($"Пользователь с ID {userId} не найден");

            user.IsSearchingOpponent = isSearching;
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Получает запрос всех пользователей для таблицы лидеров
        /// </summary>
        public async Task<IQueryable<User>> GetAllUsersQueryForLeaderboardAsync()
        {
            return _context.Users
                .OrderByDescending(u => u.Rating);
        }

        /// <summary>
        /// Получает топ пользователей по рейтингу
        /// </summary>
        public async Task<List<User>> GetTopUsersByRatingAsync(int count)
        {
            return await _context.Users
                .OrderByDescending(u => u.Rating)
                .Take(count)
                .ToListAsync();
        }

        /// <summary>
        /// Обновляет рейтинг пользователя
        /// </summary>
        public async Task UpdateUserRatingAsync(int userId, int newRating)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new Exception("Пользователь не найден");

            user.Rating = newRating;
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Получает список пользователей, ищущих оппонентов
        /// </summary>
        /// <returns>Список пользователей</returns>
        public async Task<List<User>> GetUsersSearchingOpponentsAsync()
        {
            return await _context.Users
                .Where(u => u.IsSearchingOpponent)
                .OrderBy(u => u.RegistrationDate) // Сортируем по времени, сначала обрабатываем тех, кто ждет дольше
                .ToListAsync();
        }

        /// <summary>
        /// Хеширует пароль
        /// </summary>
        private string HashPassword(string password)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }
} 