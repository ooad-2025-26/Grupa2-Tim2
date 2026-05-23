import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  Tezina, 
  Uloga, 
  TipObavijesti, 
  EscapeRoom, 
  Termin, 
  Rezervacija, 
  Recenzija, 
  Podrska, 
  Obavijest, 
  ApplicationUser 
} from "./src/types";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

// Helper structure for persistence
interface DatabaseSchema {
  users: ApplicationUser[];
  escapeRooms: EscapeRoom[];
  termini: Termin[];
  rezervacije: Rezervacija[];
  recenzije: Recenzija[];
  podrske: Podrska[];
  obavijesti: Obavijest[];
}

// Initial seed data
const getInitialData = (): DatabaseSchema => {
  const users: ApplicationUser[] = [
    { id: "u-1", userName: "admin", email: "admin@escaperoom.ba", ime: "Adnan", prezime: "Adminović", uloga: Uloga.Administrator },
    { id: "u-2", userName: "worker", email: "worker@escaperoom.ba", ime: "Zlatko", prezime: "Zaposlenik", uloga: Uloga.Zaposlenik },
    { id: "u-3", userName: "user", email: "korisnik@escaperoom.ba", ime: "Nedim", prezime: "Korisnik", uloga: Uloga.Korisnik }
  ];
  const escapeRooms: EscapeRoom[] = [
    {
      roomID: 1,
      naziv: "The Murder Case",
      opis: "Istražite misteriozno ubistvo i pronađite posljednji dokaz prije nego vrijeme istekne. Ovo je naša najteža detektivska soba koja zahtijeva vrhunski fokus i logiku.",
      tezina: Tezina.Tesko,
      kapacitet: 6,
      cijena: 80.0
    },
    {
      roomID: 2,
      naziv: "Locked Classroom",
      opis: "Zaključani ste u staroj učionici punoj skrivenih poruka i tajnih prolaza. Nađite tragove koje je profesor sakrio i pobjegnite na vrijeme.",
      tezina: Tezina.Lako,
      kapacitet: 5,
      cijena: 70.0
    },
    {
      roomID: 3,
      naziv: "Outbreak Lab",
      opis: "Opasan eksperiment je pošao po zlu u laboratoriji. Vaš tim mora pronaći sastojke i napraviti antivirus prije širenja zaraze.",
      tezina: Tezina.Tesko,
      kapacitet: 6,
      cijena: 90.0
    },
    {
      roomID: 4,
      naziv: "Magic Academy",
      opis: "Zakoračite u drevnu akademiju magije. Otkrijte zabranjene čarolije i pronađite skriveni artefakt u magičnoj učionici.",
      tezina: Tezina.Srednje,
      kapacitet: 7,
      cijena: 95.0
    },
    {
      roomID: 5,
      naziv: "Haunted House",
      opis: "Zakoračite u napuštenu kuću punu mračnih tajni, jezivih paranormalnih fenomena i neočekivanih tajnih prolaza.",
      tezina: Tezina.Srednje,
      kapacitet: 6,
      cijena: 100.0
    }
  ];

  const obavijesti: Obavijest[] = [
    {
      obavijestID: 1,
      naslov: "Vikend Akcija: -20% na The Murder Case!",
      sadrzaj: "Ovaj vikend sve rezervacije za našu najzahtjevniju sobu 'The Murder Case' ostvaruju popust od 20%. Popust se obračunava prilikom dolaska.",
      datum: new Date().toISOString().split("T")[0],
      tipObavijesti: TipObavijesti.Promocija
    },
    {
      obavijestID: 2,
      naslov: "Otvaranje nove sobe: Haunted House",
      sadrzaj: "S ponosom najavljujemo našu najnoviju horror sobu 'Haunted House'. Soba je opremljena najsavremenijim zvučnim i vizuelnim efektima. Rezervacije su otvorene!",
      datum: new Date(Date.now() - 48 * 3600 * 1000).toISOString().split("T")[0],
      tipObavijesti: TipObavijesti.Info
    },
    {
      obavijestID: 3,
      naslov: "Promocija - Magic Academy",
      sadrzaj: "Osjetite čari magije u našoj specijalnoj sobi 'Magic Academy'. Idealno za ljubitelje fantastike i kreativnih logičkih zagonetki.",
      datum: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
      tipObavijesti: TipObavijesti.Info
    }
  ];

  // Auto-generate some term termine (time slots) for today and next 7 days for each room
  const termini: Termin[] = [];
  let terminCounter = 1;

  const times = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
  
  for (let i = 0; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    escapeRooms.forEach(room => {
      times.forEach(time => {
        // Random availability: seed some booked slots, but leave most available
        const rand = Math.random();
        termini.push({
          terminID: terminCounter++,
          datum: dateStr,
          vrijeme: time,
          dostupnost: rand > 0.35, // 65% chance available
          roomID: room.roomID
        });
      });
    });
  }

  const recenzije: Recenzija[] = [
    {
      recenzijaID: 1,
      ocjena: 5,
      komentar: "Nevjerovatna atmosfera! Alkatraz nas je potpuno oduševio. Izletjeli smo u zadnjoj minuti, zagonetke su skroz smislene.",
      datum: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
      korisnikID: "u-3",
      roomID: 1
    },
    {
      recenzijaID: 2,
      ocjena: 4,
      komentar: "Dizajn faraonove sobe je vrhunski! Baš se osjeća egpatski duh. Jedna zagonetka je bila malo nejasna, ali sve u svemu preporučujem svima.",
      datum: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
      korisnikID: "u-3",
      roomID: 2
    },
    {
      recenzijaID: 3,
      ocjena: 5,
      komentar: "Izvrsno za početnike! Dovela sam djecu na Sherlocka i svi smo se super zabavili. Osoblje je iznimno ljubazno i susretljivo.",
      datum: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split("T")[0],
      korisnikID: "u-3",
      roomID: 3
    }
  ];

  const rezervacije: Rezervacija[] = [
    {
      rezervacijaID: 1,
      datumKreiranja: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      status: "Odobreno",
      brojOsoba: 4,
      korisnikID: "u-3",
      terminID: 3 // Today at some slot
    }
  ];

  // Mark terminID 3 as unavailable because it is booked
  const termToBook = termini.find(t => t.terminID === 3);
  if (termToBook) {
    termToBook.dostupnost = false;
  }

  const podrske: Podrska[] = [
    {
      porukaID: 1,
      email: "korisnik@escaperoom.ba",
      datum: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      naslovPoruke: "Upit za timbilding",
      sadrzaj: "Pozdrav, željeli bismo rezervisati sve sobe u istom terminu za našu firmu (oko 20 ljudi). Da li nudite neki popust na količinu i kako možemo izvršiti uplatu preko žiro računa? Hvala unaprijed.",
      korisnikID: "u-3"
    }
  ];

  return {
    users,
    escapeRooms,
    termini,
    rezervacije,
    recenzije,
    podrske,
    obavijesti
  };
};

// Database state
let db: DatabaseSchema;

// Synchronous db helper
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(content);
    } else {
      db = getInitialData();
      saveDB();
    }
  } catch (error) {
    console.error("Greška pri učitavanju baze podataka. Učitavam početne podatke.", error);
    db = getInitialData();
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Greška pri spašavanju baze podataka:", error);
  }
}

// Initialize database
loadDB();

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), "wwwroot")));

  // --- API RUTI ZA KORISNIKE (Users / Auth) ---
  app.post("/api/auth/login", (req, res) => {
    const { userName } = req.body;
    if (!userName) {
      return res.status(400).json({ error: "Korisničko ime je obavezno." });
    }
    const user = db.users.find(u => u.userName.toLowerCase() === userName.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "Korisnik sa tim korisničkim imenom nije pronađen." });
    }
    res.json(user);
  });

  app.post("/api/auth/register", (req, res) => {
    const { userName, email, ime, prezime, uloga } = req.body;
    if (!userName || !email || !ime || !prezime) {
      return res.status(400).json({ error: "Sva polja su obavezna." });
    }

    const exists = db.users.find(u => u.userName.toLowerCase() === userName.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "Korisnik s tim korisničkim imenom ili emailom već postoji." });
    }

    const newUser: ApplicationUser = {
      id: `u-${Date.now()}`,
      userName,
      email,
      ime,
      prezime,
      uloga: uloga || Uloga.Korisnik
    };

    db.users.push(newUser);
    saveDB();
    res.status(201).json(newUser);
  });

  app.get("/api/users", (req, res) => {
    res.json(db.users);
  });

  // Update user role
  app.put("/api/users/:id/role", (req, res) => {
    const { id } = req.params;
    const { uloga } = req.body;
    const user = db.users.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: "Korisnik nije pronađen." });
    user.uloga = uloga as Uloga;
    saveDB();
    res.json(user);
  });

  // Admin add a custom user/employee directly
  app.post("/api/users/add", (req, res) => {
    const { userName, email, ime, prezime, uloga } = req.body;
    if (!userName || !email || !ime || !prezime || !uloga) {
      return res.status(400).json({ error: "Sva polja su obavezna." });
    }
    const exists = db.users.find(u => u.userName.toLowerCase() === userName.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "Korisnik sa tim korisničkim imenom ili emailom već postoji." });
    }
    const newUser: ApplicationUser = {
      id: `u-${Date.now()}`,
      userName,
      email,
      ime,
      prezime,
      uloga: uloga as Uloga
    };
    db.users.push(newUser);
    saveDB();
    res.status(201).json(newUser);
  });

  // --- API RUTI ZA ESCAPE ROOMS ---
  app.get("/api/escape-rooms", (req, res) => {
    res.json(db.escapeRooms);
  });

  app.get("/api/escape-rooms/:id", (req, res) => {
    const roomID = parseInt(req.params.id);
    const room = db.escapeRooms.find(r => r.roomID === roomID);
    if (!room) return res.status(404).json({ error: "Soba nije pronađena." });
    res.json(room);
  });

  app.post("/api/escape-rooms", (req, res) => {
    const { naziv, opis, tezina, kapacitet, cijena } = req.body;
    if (!naziv || !opis || !tezina || !kapacitet || !cijena) {
      return res.status(400).json({ error: "Sva polja su obavezna." });
    }
    const roomID = db.escapeRooms.length > 0 ? Math.max(...db.escapeRooms.map(r => r.roomID)) + 1 : 1;
    const newRoom: EscapeRoom = {
      roomID,
      naziv,
      opis,
      tezina,
      kapacitet: parseInt(kapacitet),
      cijena: parseFloat(cijena)
    };
    db.escapeRooms.push(newRoom);

    // Auto generate some time slots for the new room as well
    const times = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
    let terminCounter = db.termini.length > 0 ? Math.max(...db.termini.map(t => t.terminID)) + 1 : 1;
    for (let i = 0; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      times.forEach(time => {
        db.termini.push({
          terminID: terminCounter++,
          datum: dateStr,
          vrijeme: time,
          dostupnost: true,
          roomID: newRoom.roomID
        });
      });
    }

    saveDB();
    res.status(201).json(newRoom);
  });

  app.put("/api/escape-rooms/:id", (req, res) => {
    const roomID = parseInt(req.params.id);
    const index = db.escapeRooms.findIndex(r => r.roomID === roomID);
    if (index === -1) return res.status(404).json({ error: "Soba nije pronađena." });

    const { naziv, opis, tezina, kapacitet, cijena } = req.body;
    db.escapeRooms[index] = {
      ...db.escapeRooms[index],
      naziv: naziv || db.escapeRooms[index].naziv,
      opis: opis || db.escapeRooms[index].opis,
      tezina: tezina || db.escapeRooms[index].tezina,
      kapacitet: kapacitet ? parseInt(kapacitet) : db.escapeRooms[index].kapacitet,
      cijena: cijena ? parseFloat(cijena) : db.escapeRooms[index].cijena
    };
    saveDB();
    res.json(db.escapeRooms[index]);
  });

  app.delete("/api/escape-rooms/:id", (req, res) => {
    const roomID = parseInt(req.params.id);
    db.escapeRooms = db.escapeRooms.filter(r => r.roomID !== roomID);
    db.termini = db.termini.filter(t => t.roomID !== roomID);
    saveDB();
    res.json({ message: "Soba i njezini termini su uspješno obrisani." });
  });

  // --- API RUTI ZA TERMINI ---
  app.get("/api/termini", (req, res) => {
    const { roomID, datum } = req.query;
    let filtered = db.termini;

    if (roomID) {
      filtered = filtered.filter(t => t.roomID === parseInt(roomID as string));
    }
    if (datum) {
      filtered = filtered.filter(t => t.datum === datum);
    }

    const populated = filtered.map(t => ({
      ...t,
      escapeRoom: db.escapeRooms.find(r => r.roomID === t.roomID)
    }));

    res.json(populated);
  });

  app.post("/api/termini", (req, res) => {
    const { roomID, datum, vrijeme } = req.body;
    if (!roomID || !datum || !vrijeme) {
      return res.status(400).json({ error: "Sva polja su obavezna." });
    }
    
    // Check if slot already exists
    const exists = db.termini.find(t => t.roomID === parseInt(roomID) && t.datum === datum && t.vrijeme === vrijeme);
    if (exists) {
      return res.status(400).json({ error: "Termin u tom vremenu već postoji." });
    }

    const terminID = db.termini.length > 0 ? Math.max(...db.termini.map(t => t.terminID)) + 1 : 1;
    const newTermin: Termin = {
      terminID,
      datum,
      vrijeme,
      dostupnost: true,
      roomID: parseInt(roomID)
    };

    db.termini.push(newTermin);
    saveDB();
    res.status(201).json({
      ...newTermin,
      escapeRoom: db.escapeRooms.find(r => r.roomID === newTermin.roomID)
    });
  });

  app.put("/api/termini/:id/toggle", (req, res) => {
    const terminID = parseInt(req.params.id);
    const index = db.termini.findIndex(t => t.terminID === terminID);
    if (index === -1) return res.status(404).json({ error: "Termin nije pronađen." });

    db.termini[index].dostupnost = !db.termini[index].dostupnost;
    saveDB();
    res.json(db.termini[index]);
  });

  app.delete("/api/termini/:id", (req, res) => {
    const terminID = parseInt(req.params.id);
    db.termini = db.termini.filter(t => t.terminID !== terminID);
    saveDB();
    res.json({ message: "Termin je uspješno obrisan." });
  });

  // --- API RUTI ZA REZERVACIJE ---
  app.get("/api/rezervacije", (req, res) => {
    const { korisnikID } = req.query;
    let list = db.rezervacije;

    if (korisnikID) {
      list = list.filter(r => r.korisnikID === korisnikID);
    }

    const populated = list.map(r => {
      const termin = db.termini.find(t => t.terminID === r.terminID);
      const room = termin ? db.escapeRooms.find(er => er.roomID === termin.roomID) : undefined;
      const user = db.users.find(u => u.id === r.korisnikID);

      return {
        ...r,
        korisnik: user,
        termin: termin ? {
          ...termin,
          escapeRoom: room
        } : undefined
      };
    });

    res.json(populated);
  });

  app.post("/api/rezervacije", (req, res) => {
    const { terminID, korisnikID, brojOsoba } = req.body;
    if (!terminID || !korisnikID || !brojOsoba) {
      return res.status(400).json({ error: "Nedostaju podaci za kreiranje rezervacije." });
    }

    const terminIndex = db.termini.findIndex(t => t.terminID === parseInt(terminID));
    if (terminIndex === -1) {
      return res.status(404).json({ error: "Odabrani termin ne postoji." });
    }

    if (!db.termini[terminIndex].dostupnost) {
      return res.status(400).json({ error: "Odabrani termin je već rezervisan i nije dostupan." });
    }

    // Set terminavailability to false
    db.termini[terminIndex].dostupnost = false;

    const rezervacijaID = db.rezervacije.length > 0 ? Math.max(...db.rezervacije.map(r => r.rezervacijaID)) + 1 : 1;
    const newRezervacija: Rezervacija = {
      rezervacijaID,
      datumKreiranja: new Date().toISOString(),
      status: "Na čekanju", // Initial state
      brojOsoba: parseInt(brojOsoba),
      korisnikID,
      terminID: parseInt(terminID)
    };

    db.rezervacije.unshift(newRezervacija); // Add to beginning
    saveDB();

    // Populate for response
    const resUser = db.users.find(u => u.id === korisnikID);
    const resTermin = db.termini.find(t => t.terminID === parseInt(terminID));
    const resRoom = resTermin ? db.escapeRooms.find(er => er.roomID === resTermin.roomID) : undefined;

    res.status(201).json({
      ...newRezervacija,
      korisnik: resUser,
      termin: resTermin ? {
        ...resTermin,
        escapeRoom: resRoom
      } : undefined
    });
  });

  app.put("/api/rezervacije/:id/status", (req, res) => {
    const rezervacijaID = parseInt(req.params.id);
    const { status } = req.body; // e.g. "Odobreno", "Otkazano", "Na čekanju"
    
    if (!status) {
      return res.status(400).json({ error: "Status je obavezan." });
    }

    const index = db.rezervacije.findIndex(r => r.rezervacijaID === rezervacijaID);
    if (index === -1) return res.status(404).json({ error: "Rezervacija nije pronađena." });

    const prevStatus = db.rezervacije[index].status;
    db.rezervacije[index].status = status;

    // If status is changed to "Otkazano", we should release the termin
    if (status === "Otkazano") {
      const termID = db.rezervacije[index].terminID;
      const termIdx = db.termini.findIndex(t => t.terminID === termID);
      if (termIdx !== -1) {
        db.termini[termIdx].dostupnost = true;
      }
    } else if (prevStatus === "Otkazano" && status !== "Otkazano") {
      // If we are restoring from Otkazano, book the termin again
      const termID = db.rezervacije[index].terminID;
      const termIdx = db.termini.findIndex(t => t.terminID === termID);
      if (termIdx !== -1) {
        db.termini[termIdx].dostupnost = false;
      }
    }

    saveDB();

    const populated = {
      ...db.rezervacije[index],
      korisnik: db.users.find(u => u.id === db.rezervacije[index].korisnikID),
      termin: db.termini.find(t => t.terminID === db.rezervacije[index].terminID)
    };

    res.json(populated);
  });

  // --- API RUTI ZA RECENZIJE ---
  app.get("/api/recenzije", (req, res) => {
    const { roomID } = req.query;
    let list = db.recenzije;

    if (roomID) {
      list = list.filter(r => r.roomID === parseInt(roomID as string));
    }

    const populated = list.map(r => ({
      ...r,
      korisnik: db.users.find(u => u.id === r.korisnikID),
      escapeRoom: db.escapeRooms.find(er => er.roomID === r.roomID)
    }));

    res.json(populated);
  });

  app.post("/api/recenzije", (req, res) => {
    const { roomID, korisnikID, ocjena, komentar } = req.body;
    if (!roomID || !korisnikID || !ocjena) {
      return res.status(400).json({ error: "Nedostaju podaci za kreiranje recenzije." });
    }

    const recenzijaID = db.recenzije.length > 0 ? Math.max(...db.recenzije.map(r => r.recenzijaID)) + 1 : 1;
    const newRecenzija: Recenzija = {
      recenzijaID,
      ocjena: parseFloat(ocjena),
      komentar: komentar || "",
      datum: new Date().toISOString().split("T")[0],
      korisnikID,
      roomID: parseInt(roomID)
    };

    db.recenzije.unshift(newRecenzija);
    saveDB();

    res.status(201).json({
      ...newRecenzija,
      korisnik: db.users.find(u => u.id === korisnikID),
      escapeRoom: db.escapeRooms.find(er => er.roomID === parseInt(roomID))
    });
  });

  // --- API RUTI ZA PODRSKU (Contact Support) ---
  app.get("/api/podrska", (req, res) => {
    const populated = db.podrske.map(p => ({
      ...p,
      korisnik: p.korisnikID ? db.users.find(u => u.id === p.korisnikID) : undefined
    }));
    res.json(populated);
  });

  app.post("/api/podrska", (req, res) => {
    const { email, naslovPoruke, sadrzaj, korisnikID } = req.body;
    if (!email || !naslovPoruke || !sadrzaj) {
      return res.status(400).json({ error: "Sva polja su obavezna." });
    }

    const porukaID = db.podrske.length > 0 ? Math.max(...db.podrske.map(p => p.porukaID)) + 1 : 1;
    const newPodrska: Podrska = {
      porukaID,
      email,
      datum: new Date().toISOString(),
      naslovPoruke,
      sadrzaj,
      korisnikID: korisnikID || undefined
    };

    db.podrske.unshift(newPodrska);
    saveDB();

    res.status(201).json({
      ...newPodrska,
      korisnik: korisnikID ? db.users.find(u => u.id === korisnikID) : undefined
    });
  });

  // --- API RUTI ZA OBAVIJESTI ---
  app.get("/api/obavijesti", (req, res) => {
    // Return sorted by date descending
    const sorted = [...db.obavijesti].sort((a,b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
    res.json(sorted);
  });

  app.post("/api/obavijesti", (req, res) => {
    const { naslov, sadrzaj, tipObavijesti } = req.body;
    if (!naslov || !sadrzaj || !tipObavijesti) {
      return res.status(400).json({ error: "Sva polja su obavezna." });
    }

    const obavijestID = db.obavijesti.length > 0 ? Math.max(...db.obavijesti.map(o => o.obavijestID)) + 1 : 1;
    const newObavijest: Obavijest = {
      obavijestID,
      naslov,
      sadrzaj,
      datum: new Date().toISOString().split("T")[0],
      tipObavijesti
    };

    db.obavijesti.unshift(newObavijest);
    saveDB();
    res.status(201).json(newObavijest);
  });

  app.delete("/api/obavijesti/:id", (req, res) => {
    const obavijestID = parseInt(req.params.id);
    db.obavijesti = db.obavijesti.filter(o => o.obavijestID !== obavijestID);
    saveDB();
    res.json({ message: "Obavijest je uspješno obrisana." });
  });

  // --- VITE MIDDLEWARE ZA FRONTEND ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server vrti na portu ${PORT} (http://localhost:${PORT})`);
  });
}

startServer().catch(err => {
  console.error("Greška pri pokretanju servera:", err);
});
