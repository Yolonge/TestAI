using CodeDuelPlatform.Extensions;
using CodeDuelPlatform.Extensions.Models.Pagination;
using CodeDuelPlatform.Models;
using CodeDuelPlatform.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace CodeDuelPlatform.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly AuthService _authService;

        public UsersController(UserService userService, AuthService authService)
        {
            _userService = userService;
            _authService = authService;
        }

        /// <summary>
        /// Регистрирует нового пользователя
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var user = await _userService.RegisterUserAsync(model.Username, model.Email, model.Password);
                return Ok(new { Id = user.Id, Username = user.Username, Email = user.Email });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        /// <summary>
        /// Аутентифицирует пользователя
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userService.AuthenticateUserAsync(model.UsernameOrEmail, model.Password);
            if (user == null)
                return Unauthorized(new { Message = "Неверное имя пользователя или пароль" });

            // Генерируем JWT токен для пользователя
            string token = _authService.GenerateJwtToken(user);

            // Возвращаем информацию о пользователе с токеном
            return Ok(new { 
                Id = user.Id, 
                Username = user.Username, 
                Email = user.Email,
                Token = token 
            });
        }

        /// <summary>
        /// Получает профиль текущего пользователя
        /// </summary>
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
            var user = await _userService.GetUserByIdAsync(userId);
            
            if (user == null)
                return NotFound(new { Message = "Пользователь не найден" });

            return Ok(new 
            { 
                Id = user.Id, 
                Username = user.Username, 
                Email = user.Email,
                Rating = user.Rating,
                TotalWins = user.TotalWins,
                TotalLosses = user.TotalLosses
            });
        }

        /// <summary>
        /// Получает топ пользователей по рейтингу
        /// </summary>
        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard([FromQuery] PaginationParams paginationParams, [FromQuery] SortParams? sortParams = null)
        {
            var usersQuery = await _userService.GetAllUsersQueryForLeaderboardAsync();
            
            var logger = HttpContext.RequestServices.GetRequiredService<ILogger<UsersController>>();
            var paginatedUsers = usersQuery.AsPaginated(paginationParams, sortParams, logger);
            
            var result = paginatedUsers.Items.Select(u => new 
            {
                Id = u.Id,
                Username = u.Username,
                Rating = u.Rating,
                TotalWins = u.TotalWins,
                TotalLosses = u.TotalLosses
            });
            
            return Ok(new
            {
                items = result,
                paginationParams = paginatedUsers.PaginationParams,
                totalPages = paginatedUsers.TotalPages,
                hasNextPage = paginatedUsers.HasNextPage,
                hasPreveiwPage = paginatedUsers.HasPreveiwPage
            });
        }
        
        /// <summary>
        /// Проверяет существование пользователя по ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            
            if (user == null)
                return NotFound(new { Message = $"Пользователь с ID {id} не найден" });

            return Ok(new 
            { 
                Id = user.Id, 
                Username = user.Username
            });
        }
    }

    public class RegisterModel
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginModel
    {
        public string UsernameOrEmail { get; set; }
        public string Password { get; set; }
    }
} 