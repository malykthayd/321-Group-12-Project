using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BasketballTrackerAPI.Data;
using BasketballTrackerAPI.Models;

namespace BasketballTrackerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LiftController : ControllerBase
    {
        private readonly BasketballTrackerContext _context;

        public LiftController(BasketballTrackerContext context)
        {
            _context = context;
        }

        // GET: api/Lift/exercises
        [HttpGet("exercises")]
        public IActionResult GetExercises()
        {
            var exercises = new[]
            {
                "Bench Press",
                "Squat",
                "Deadlift", 
                "Row",
                "Curl",
                "Pull Ups"
            };
            return Ok(exercises);
        }

        // GET: api/Lift
        [HttpGet]
        public async Task<IActionResult> GetLifts()
        {
            var lifts = await _context.Lifts
                .Include(l => l.Player)
                .ToListAsync();
            return Ok(lifts);
        }

        // GET: api/Lift/player/{playerId}
        [HttpGet("player/{playerId}")]
        public async Task<IActionResult> GetLiftsByPlayer(int playerId)
        {
            var lifts = await _context.Lifts
                .Include(l => l.Player)
                .Where(l => l.PlayerId == playerId)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
            return Ok(lifts);
        }

        // POST: api/Lift
        [HttpPost]
        public async Task<IActionResult> CreateLift([FromBody] Lift lift)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if player exists
            var player = await _context.Players.FindAsync(lift.PlayerId);
            if (player == null)
            {
                return BadRequest("Player not found");
            }

            lift.CreatedAt = DateTime.UtcNow;
            lift.UpdatedAt = DateTime.UtcNow;

            _context.Lifts.Add(lift);
            await _context.SaveChangesAsync();

            // Also add to history
            var history = new LiftHistory
            {
                PlayerId = lift.PlayerId,
                ExerciseName = lift.ExerciseName,
                Weight = lift.Weight,
                Reps = lift.Reps,
                Sets = lift.Sets,
                Notes = lift.Notes,
                WorkoutDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _context.LiftHistories.Add(history);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLift), new { id = lift.Id }, lift);
        }

        // GET: api/Lift/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetLift(int id)
        {
            var lift = await _context.Lifts
                .Include(l => l.Player)
                .FirstOrDefaultAsync(l => l.Id == id);
            
            if (lift == null)
            {
                return NotFound();
            }
            
            return Ok(lift);
        }

        // GET: api/Lift/history/player/{playerId}
        [HttpGet("history/player/{playerId}")]
        public async Task<IActionResult> GetLiftHistory(int playerId)
        {
            var history = await _context.LiftHistories
                .Include(lh => lh.Player)
                .Where(lh => lh.PlayerId == playerId)
                .OrderByDescending(lh => lh.WorkoutDate)
                .ToListAsync();
            
            return Ok(history);
        }
    }
}