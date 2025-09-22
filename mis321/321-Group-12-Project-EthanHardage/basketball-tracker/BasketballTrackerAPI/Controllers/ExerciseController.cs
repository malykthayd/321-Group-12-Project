using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BasketballTrackerAPI.Data;
using BasketballTrackerAPI.Models;

namespace BasketballTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExerciseController : ControllerBase
    {
        private readonly BasketballTrackerContext _context;

        public ExerciseController(BasketballTrackerContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Exercise>>> GetExercises()
        {
            return await _context.Exercises.OrderBy(e => e.Name).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Exercise>> GetExercise(int id)
        {
            var exercise = await _context.Exercises.FindAsync(id);
            if (exercise == null) return NotFound();
            return exercise;
        }

        [HttpPost]
        public async Task<ActionResult<Exercise>> PostExercise(Exercise exercise)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            exercise.CreatedAt = DateTime.UtcNow;
            exercise.UpdatedAt = DateTime.UtcNow;
            _context.Exercises.Add(exercise);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetExercise), new { id = exercise.Id }, exercise);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutExercise(int id, Exercise exercise)
        {
            if (id != exercise.Id) return BadRequest();
            if (!ModelState.IsValid) return BadRequest(ModelState);
            exercise.UpdatedAt = DateTime.UtcNow;
            _context.Entry(exercise).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExercise(int id)
        {
            var exercise = await _context.Exercises.FindAsync(id);
            if (exercise == null) return NotFound();
            _context.Exercises.Remove(exercise);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
