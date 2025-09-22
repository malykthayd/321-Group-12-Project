using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BasketballTrackerAPI.Data;
using BasketballTrackerAPI.Models;

namespace BasketballTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WorkoutSetController : ControllerBase
    {
        private readonly BasketballTrackerContext _context;

        public WorkoutSetController(BasketballTrackerContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WorkoutSet>>> GetWorkoutSets([FromQuery] int? workoutId)
        {
            var query = _context.WorkoutSets.Include(ws => ws.Exercise).AsQueryable();
            if (workoutId.HasValue)
            {
                query = query.Where(ws => ws.WorkoutId == workoutId.Value);
            }
            return await query.OrderBy(ws => ws.WorkoutId).ThenBy(ws => ws.SetNumber).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WorkoutSet>> GetWorkoutSet(int id)
        {
            var set = await _context.WorkoutSets.Include(ws => ws.Exercise).FirstOrDefaultAsync(ws => ws.Id == id);
            if (set == null) return NotFound();
            return set;
        }

        [HttpPost]
        public async Task<ActionResult<WorkoutSet>> PostWorkoutSet(WorkoutSet set)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // validate foreign keys
            var workoutExists = await _context.Workouts.AnyAsync(w => w.Id == set.WorkoutId);
            if (!workoutExists) return BadRequest("Invalid WorkoutId");
            var exerciseExists = await _context.Exercises.AnyAsync(e => e.Id == set.ExerciseId);
            if (!exerciseExists) return BadRequest("Invalid ExerciseId");

            set.CreatedAt = DateTime.UtcNow;
            set.UpdatedAt = DateTime.UtcNow;

            _context.WorkoutSets.Add(set);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetWorkoutSet), new { id = set.Id }, set);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutWorkoutSet(int id, WorkoutSet set)
        {
            if (id != set.Id) return BadRequest();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            set.UpdatedAt = DateTime.UtcNow;
            _context.Entry(set).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorkoutSet(int id)
        {
            var set = await _context.WorkoutSets.FindAsync(id);
            if (set == null) return NotFound();
            _context.WorkoutSets.Remove(set);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
