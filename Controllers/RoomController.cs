using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Task6.Data;

namespace Task6.Controllers
{
    public class RoomController : Controller
    {
        private readonly EscapeRoomDbContext _context;

        public RoomController(EscapeRoomDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var rooms = await _context.EscapeRooms.Include(r => r.Recenzije).ToListAsync();
            return View(rooms);
        }
    }
}
