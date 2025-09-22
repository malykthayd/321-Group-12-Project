using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BasketballTrackerAPI.Data;
using BasketballTrackerAPI.Models;

namespace BasketballTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WorkoutController : ControllerBase
    {
        private readonly BasketballTrackerContext _context;

        public WorkoutController(BasketballTrackerContext context)
        {
            _context = context;
        }

        // GET: api/Workout
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Workout>>> GetWorkouts([FromQuery] int? playerId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var query = _context.Workouts
                .Include(w => w.Sets)
                .ThenInclude(s => s.Exercise)
                .AsQueryable();

            if (playerId.HasValue)
            {
                query = query.Where(w => w.PlayerId == playerId.Value);
            }
            if (startDate.HasValue)
            {
                query = query.Where(w => w.Date >= startDate.Value.Date);
            }
            if (endDate.HasValue)
            {
                query = query.Where(w => w.Date <= endDate.Value.Date);
            }

            return await query
                .OrderByDescending(w => w.Date)
                .ToListAsync();
        }

        // GET: api/Workout/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Workout>> GetWorkout(int id)
        {
            var workout = await _context.Workouts
                .Include(w => w.Sets)
                .ThenInclude(s => s.Exercise)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (workout == null)
            {
                return NotFound();
            }

            return workout;
        }

        // POST: api/Workout
        [HttpPost]
        public async Task<ActionResult<Workout>> PostWorkout(Workout workout)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // validate player
            var playerExists = await _context.Players.AnyAsync(p => p.Id == workout.PlayerId);
            if (!playerExists) return BadRequest("Invalid PlayerId");

            workout.CreatedAt = DateTime.UtcNow;
            workout.UpdatedAt = DateTime.UtcNow;

            // Detach nested sets, save workout first
            var sets = workout.Sets?.ToList() ?? new List<WorkoutSet>();
            workout.Sets = new List<WorkoutSet>();

            _context.Workouts.Add(workout);
            await _context.SaveChangesAsync();

            // Save sets
            foreach (var set in sets)
            {
                set.WorkoutId = workout.Id;
                set.CreatedAt = DateTime.UtcNow;
                set.UpdatedAt = DateTime.UtcNow;
                _context.WorkoutSets.Add(set);
            }
            await _context.SaveChangesAsync();

            // reload with sets
            await _context.Entry(workout).Collection(w => w.Sets).LoadAsync();
            foreach (var s in workout.Sets)
            {
                await _context.Entry(s).Reference(x => x.Exercise).LoadAsync();
            }

            return CreatedAtAction(nameof(GetWorkout), new { id = workout.Id }, workout);
        }

        // PUT: api/Workout/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutWorkout(int id, Workout workout)
        {
            if (id != workout.Id) return BadRequest();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            workout.UpdatedAt = DateTime.UtcNow;
            _context.Entry(workout).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Workouts.AnyAsync(w => w.Id == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Workout/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkout(int id)
        {
            var workout = await _context.Workouts.FindAsync(id);
            if (workout == null) return NotFound();
            _context.Workouts.Remove(workout);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
