using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BasketballTrackerAPI.Data;
using BasketballTrackerAPI.Models;

namespace BasketballTrackerAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlayerController : ControllerBase
    {
        private readonly BasketballTrackerContext _context;

        public PlayerController(BasketballTrackerContext context)
        {
            _context = context;
        }

        // GET: api/Player
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Player>>> GetPlayers()
        {
            return await _context.Players.ToListAsync();
        }

        // GET: api/Player/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Player>> GetPlayer(int id)
        {
            var player = await _context.Players.FirstOrDefaultAsync(p => p.Id == id);

            if (player == null)
            {
                return NotFound();
            }

            return player;
        }

        // GET: api/Player/email/test@example.com
        [HttpGet("email/{email}")]
        public async Task<ActionResult<Player>> GetPlayerByEmail(string email)
        {
            var player = await _context.Players.FirstOrDefaultAsync(p => p.Email == email);

            if (player == null)
            {
                return NotFound();
            }

            return player;
        }

        // POST: api/Player (Registration)
        [HttpPost]
        public async Task<ActionResult<Player>> PostPlayer(Player player)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if player with email already exists
            var existingPlayer = await _context.Players.FirstOrDefaultAsync(p => p.Email == player.Email);
            if (existingPlayer != null)
            {
                return Conflict("Player with this email already exists.");
            }

            player.CreatedAt = DateTime.UtcNow;
            player.UpdatedAt = DateTime.UtcNow;

            _context.Players.Add(player);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetPlayer", new { id = player.Id }, player);
        }

        // PUT: api/Player/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPlayer(int id, Player player)
        {
            if (id != player.Id)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if player with email already exists (excluding current player)
            var existingPlayer = await _context.Players.FirstOrDefaultAsync(p => p.Email == player.Email && p.Id != id);
            if (existingPlayer != null)
            {
                return Conflict("Player with this email already exists.");
            }

            player.UpdatedAt = DateTime.UtcNow;

            _context.Entry(player).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PlayerExists(id))
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

        // DELETE: api/Player/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlayer(int id)
        {
            var player = await _context.Players.FindAsync(id);
            if (player == null)
            {
                return NotFound();
            }

            _context.Players.Remove(player);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Player/reset-ids
        [HttpPost("reset-ids")]
        public async Task<IActionResult> ResetPlayerIds()
        {
            try
            {
                // Delete all players
                var players = await _context.Players.ToListAsync();
                _context.Players.RemoveRange(players);
                await _context.SaveChangesAsync();
                
                // Reset the auto-increment sequence
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM sqlite_sequence WHERE name = 'Players';");
                
                return Ok(new { message = "Player IDs reset successfully. Next player will have ID: 1" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        private bool PlayerExists(int id)
        {
            return _context.Players.Any(e => e.Id == id);
        }
    }
}
