import React, { useState, useEffect, FormEvent } from "react";
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
} from "./types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<ApplicationUser | null>(null);
  
  // App data states
  const [escapeRooms, setEscapeRooms] = useState<EscapeRoom[]>([]);
  const [reviews, setReviews] = useState<Recenzija[]>([]);
  const [reservations, setReservations] = useState<Rezervacija[]>([]);
  const [obavijesti, setObavijesti] = useState<Obavijest[]>([]);
  const [supportTickets, setSupportTickets] = useState<Podrska[]>([]);
  const [allUsers, setAllUsers] = useState<ApplicationUser[]>([]);

  // Selection & UI states
  const [selectedRoom, setSelectedRoom] = useState<EscapeRoom | null>(null);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [roomStartIndex, setRoomStartIndex] = useState(0);

  // Authentication Modal States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Admin and personal panel states
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'rezervacije' | 'sobe' | 'podrska' | 'obavijesti' | 'korisnici'>('rezervacije');
  const [showMyBookings, setShowMyBookings] = useState(false);

  // Forms state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginError, setLoginError] = useState("");

  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerIme, setRegisterIme] = useState("");
  const [registerPrezime, setRegisterPrezime] = useState("");
  const [registerRole, setRegisterRole] = useState<Uloga>(Uloga.Korisnik);
  const [registerError, setRegisterError] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [codeError, setCodeError] = useState("");

  // Booking inside room modal state
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingSize, setBookingSize] = useState(2);
  const [bookingSlots, setBookingSlots] = useState<Termin[]>([]);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Review inside room modal state
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");

  // Contact support form state
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState("");

  // Admin New Room state
  const [newRoomNaziv, setNewRoomNaziv] = useState("");
  const [newRoomOpis, setNewRoomOpis] = useState("");
  const [newRoomTezina, setNewRoomTezina] = useState<Tezina>(Tezina.Srednje);
  const [newRoomKapacitet, setNewRoomKapacitet] = useState(6);
  const [newRoomCijena, setNewRoomCijena] = useState(80);

  // Admin New Announcement state
  const [newObavijestNaslov, setNewObavijestNaslov] = useState("");
  const [newObavijestSadrzaj, setNewObavijestSadrzaj] = useState("");
  const [newObavijestTip, setNewObavijestTip] = useState<TipObavijesti>(TipObavijesti.Info);

  // Admin Manage Users / Add User states
  const [adminAddUsername, setAdminAddUsername] = useState("");
  const [adminAddEmail, setAdminAddEmail] = useState("");
  const [adminAddIme, setAdminAddIme] = useState("");
  const [adminAddPrezime, setAdminAddPrezime] = useState("");
  const [adminAddRole, setAdminAddRole] = useState<Uloga>(Uloga.Zaposlenik);
  const [adminAddError, setAdminAddError] = useState("");
  const [adminAddSuccess, setAdminAddSuccess] = useState(false);

  // Flashlight Mouse/Touch Tracking Effect
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (window.TouchEvent && e instanceof TouchEvent && e.touches && e.touches[0]) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      document.documentElement.style.setProperty("--x", `${clientX}px`);
      document.documentElement.style.setProperty("--y", `${clientY}px`);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      const roomsRes = await fetch("/api/escape-rooms");
      const roomsData = await roomsRes.json();
      setEscapeRooms(roomsData);

      const reviewsRes = await fetch("/api/recenzije");
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData);

      const obavRes = await fetch("/api/obavijesti");
      const obavData = await obavRes.json();
      setObavijesti(obavData);

      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      setAllUsers(usersData);

      const supportRes = await fetch("/api/podrska");
      const supportData = await supportRes.json();
      setSupportTickets(supportData);

      const reserRes = await fetch("/api/rezervacije");
      const reserData = await reserRes.json();
      setReservations(reserData);
    } catch (err) {
      console.error("Greška pri učitavanju podataka:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch available slots when bookingDate or selectedRoom changes
  useEffect(() => {
    if (!selectedRoom || !bookingDate) {
      setBookingSlots([]);
      return;
    }
    const fetchSlots = async () => {
      try {
        const res = await fetch(`/api/termini?roomID=${selectedRoom.roomID}&datum=${bookingDate}`);
        const data = await res.json();
        setBookingSlots(data);
        setBookingTime(""); // reset
      } catch (err) {
        console.error("Greška pri učitavanju termina:", err);
      }
    };
    fetchSlots();
  }, [bookingDate, selectedRoom]);

  // Auth Operations
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginUsername) {
      setLoginError("Korisničko ime je obavezno.");
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: loginUsername })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        setShowLoginModal(false);
        setLoginUsername("");
        // Load contact email
        setContactEmail(data.email);
        fetchData();
      } else {
        setLoginError(data.error || "Prijava neuspješna.");
      }
    } catch (err) {
      setLoginError("Došlo je do greške na serveru.");
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    if (!registerUsername || !registerEmail || !registerIme || !registerPrezime) {
      setRegisterError("Sva polja su obavezna.");
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: registerUsername,
          email: registerEmail,
          ime: registerIme,
          prezime: registerPrezime,
          uloga: registerRole
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        setShowRegisterModal(false);
        // Clear fields
        setRegisterUsername("");
        setRegisterEmail("");
        setRegisterIme("");
        setRegisterPrezime("");
        setContactEmail(data.email);
        fetchData();
      } else {
        setRegisterError(data.error || "Registracija neuspješna.");
      }
    } catch (err) {
      setRegisterError("Korisnik već postoji ili su krivi podaci.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowAdminPanel(false);
    setShowMyBookings(false);
    setContactEmail("");
  };

  // Booking submit
  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBookingError("");
    setBookingSuccess(false);

    if (!currentUser) {
      setBookingError("Morate biti prijavljeni da biste izvršili rezervaciju.");
      return;
    }
    if (!bookingTime) {
      setBookingError("Molimo odaberite termin.");
      return;
    }

    try {
      const res = await fetch("/api/rezervacije", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminID: parseInt(bookingTime),
          korisnikID: currentUser.id,
          brojOsoba: bookingSize
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBookingSuccess(true);
        setBookingDate("");
        setBookingTime("");
        fetchData();
      } else {
        setBookingError(data.error || "Rezervacija nije uspjela.");
      }
    } catch (err) {
      setBookingError("Sistem trenutno nije dostupan.");
    }
  };

  // Review submit
  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedRoom) return;

    try {
      const res = await fetch("/api/recenzije", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomID: selectedRoom.roomID,
          korisnikID: currentUser.id,
          ocjena: newReviewRating,
          komentar: newReviewComment
        })
      });
      if (res.ok) {
        setNewReviewComment("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Support Submission
  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setContactError("");
    setContactSuccess(false);

    if (!contactEmail || !contactSubject || !contactMessage) {
      setContactError("Sva polja u kontakt formi su obavezna.");
      return;
    }

    try {
      const res = await fetch("/api/podrska", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contactEmail,
          naslovPoruke: contactSubject,
          sadrzaj: contactMessage,
          korisnikID: currentUser?.id
        })
      });
      if (res.ok) {
        setContactSuccess(true);
        setContactSubject("");
        setContactMessage("");
        fetchData();
      } else {
        const d = await res.json();
        setContactError(d.error || "Slanje upita neuspješno.");
      }
    } catch (err) {
      setContactError("Konekcija sa serverom prekinuta.");
    }
  };

  // Admin Methods
  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/rezervacije/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRoomNaziv || !newRoomOpis) return;
    try {
      const res = await fetch("/api/escape-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naziv: newRoomNaziv,
          opis: newRoomOpis,
          tezina: newRoomTezina,
          kapacitet: newRoomKapacitet,
          cijena: newRoomCijena
        })
      });
      if (res.ok) {
        setNewRoomNaziv("");
        setNewRoomOpis("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovu sobu i sve njezine termine?")) return;
    try {
      const res = await fetch(`/api/escape-rooms/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddObavijest = async (e: FormEvent) => {
    e.preventDefault();
    if (!newObavijestNaslov || !newObavijestSadrzaj) return;
    try {
      const res = await fetch("/api/obavijesti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naslov: newObavijestNaslov,
          sadrzaj: newObavijestSadrzaj,
          tipObavijesti: newObavijestTip
        })
      });
      if (res.ok) {
        setNewObavijestNaslov("");
        setNewObavijestSadrzaj("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteObavijest = async (id: number) => {
    if (!confirm("Obrisati obavijest?")) return;
    try {
      const res = await fetch(`/api/obavijesti/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminAddUser = async (e: FormEvent) => {
    e.preventDefault();
    setAdminAddError("");
    setAdminAddSuccess(false);
    try {
      const res = await fetch("/api/users/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: adminAddUsername,
          email: adminAddEmail,
          ime: adminAddIme,
          prezime: adminAddPrezime,
          uloga: adminAddRole
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminAddError(data.error || "Greška pri dodavanju korisnika.");
      } else {
        setAdminAddSuccess(true);
        setAdminAddUsername("");
        setAdminAddEmail("");
        setAdminAddIme("");
        setAdminAddPrezime("");
        setAdminAddRole(Uloga.Zaposlenik);
        fetchData();
      }
    } catch (err) {
      setAdminAddError("Mrežna greška.");
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: Uloga) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uloga: newRole })
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Greška pri promjeni uloge.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helpers
  const getRoomImagePath = (id: number) => {
    switch(id) {
      case 1: return "/images/murder1.webp";
      case 2: return "/images/classroom1.jpg";
      case 3: return "/images/lab1.jpg";
      case 4: return "/images/magic1.jpeg";
      case 5: return "/images/haunted1.jpg";
      default: return "/images/classroom.jpeg";
    }
  };

  const getFilteredEscapeRooms = () => escapeRooms;

  const getAverageRating = (roomId: number) => {
    const rReviews = reviews.filter(r => r.roomID === roomId);
    if (rReviews.length === 0) return 4.8; // original static template averages
    const sum = rReviews.reduce((acc, c) => acc + c.ocjena, 0);
    return parseFloat((sum / rReviews.length).toFixed(1));
  };

  const getReviewCount = (roomId: number) => {
    const rReviews = reviews.filter(r => r.roomID === roomId);
    // Add default review offset to match design stats
    return rReviews.length + (roomId === 1 ? 23 : roomId === 2 ? 18 : roomId === 3 ? 31 : roomId === 4 ? 22 : 21);
  };

  return (
    <>
      {/* FLASHLIGHT INTRO */}
      <div className="flashlight-intro">
        <div className="flashlight-dark"></div>
        <div className="flashlight-glow"></div>
        <div className="loading-text">
          PRONALAZAK POSLJEDNJEG KLJUČA...
        </div>
      </div>

      {/* HERO & HOME CONTAINER */}
      <section className="hero">
        <nav className="navbar" id="mainNavbar">
          <div className="logo" style={{ cursor: "pointer" }} onClick={() => { setShowAdminPanel(false); setShowMyBookings(false); }}>
            <h2>THE LAST <span>key</span></h2>
          </div>

          <ul className="nav-links">
            <li><a href="#about" onClick={() => { setShowAdminPanel(false); setShowMyBookings(false); }}>O NAMA</a></li>
            <li><a href="#rooms" onClick={() => { setShowAdminPanel(false); setShowMyBookings(false); }}>SOBE</a></li>
            <li><a href="#contact" onClick={() => { setShowAdminPanel(false); setShowMyBookings(false); }}>KONTAKT I PODRŠKA</a></li>
            <li><a href="#faq" onClick={() => { setShowAdminPanel(false); setShowMyBookings(false); }}>ČESTA PITANJA</a></li>
          </ul>

          <div className="nav-buttons">
            {currentUser ? (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ color: "#233D4D", fontWeight: 700, fontSize: "14px", background: "rgba(255,255,255,0.6)", padding: "6px 14px", borderRadius: "20px" }}>
                  👤 {currentUser.ime} ({currentUser.uloga})
                </span>
                {currentUser.uloga === Uloga.Korisnik && (
                  <button onClick={() => { setShowMyBookings(!showMyBookings); setShowAdminPanel(false); }} className="btn-login" style={{ cursor: "pointer", background: "white" }}>
                    {showMyBookings ? "Glavna Stranica" : "Moje Rezervacije"}
                  </button>
                )}
                {currentUser.uloga !== Uloga.Korisnik && (
                  <button onClick={() => { setShowAdminPanel(!showAdminPanel); setShowMyBookings(false); }} className="btn-login" style={{ cursor: "pointer", background: "white" }}>
                    {showAdminPanel ? "Glavna Stranica" : "Admin Panel"}
                  </button>
                )}
                <button onClick={handleLogout} className="btn-register" style={{ cursor: "pointer" }}>
                  Odjava
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setShowLoginModal(true)} className="btn-login" style={{ cursor: "pointer", background: "transparent" }}>Prijava</button>
                <button onClick={() => setShowRegisterModal(true)} className="btn-register" style={{ cursor: "pointer", border: "none" }}>Registracija</button>
              </>
            )}
          </div>
        </nav>

        {/* HERO CONTENT */}
        {!showAdminPanel && !showMyBookings && (
          <div className="hero-content">
            <p className="subtitle">DOBRODOŠLI U</p>
            <h1>
              THE LAST <span>key</span>
            </h1>
            <p className="description">
              Otkrijte naše aktivne sobe i započnite avanturu klikom na dugme ispod.
            </p>
            <div className="hero-buttons">
              <a href="#rooms" className="btn-orange">Istraži Sobe</a>
            </div>
          </div>
        )}
      </section>

      {/* ADMIN CONTROL PANEL SECTION */}
      {showAdminPanel && currentUser && (currentUser.uloga === Uloga.Administrator || currentUser.uloga === Uloga.Zaposlenik) && (
        <section className="about-section" style={{ background: "#F5FBE6", color: "#233D4D" }}>
          <div className="about-content" style={{ maxWidth: "1200px" }}>
            <p className="about-subtitle" style={{ color: "#FE7F2D" }}>UPRAVLJAČKI KOLEKTIV</p>
            <h2 className="about-title" style={{ fontSize: "38px", color: "#233D4D" }}>ADMINISTRATORSKI PANEL</h2>
            
            <div style={{ display: "flex", gap: "10px", margin: "25px 0", flexWrap: "wrap" }}>
              <button onClick={() => setAdminActiveTab('rezervacije')} style={{ padding: "10px 20px", borderRadius: "20px", border: "none", cursor: "pointer", background: adminActiveTab === 'rezervacije' ? '#FE7F2D' : '#e0e0e0', color: adminActiveTab === 'rezervacije' ? 'white' : '#233D4D', fontWeight: 600 }}>
                Rezervacije Posjetitelja ({reservations.length})
              </button>
              {currentUser.uloga === Uloga.Administrator && (
                <button onClick={() => setAdminActiveTab('sobe')} style={{ padding: "10px 20px", borderRadius: "20px", border: "none", cursor: "pointer", background: adminActiveTab === 'sobe' ? '#FE7F2D' : '#e0e0e0', color: adminActiveTab === 'sobe' ? 'white' : '#233D4D', fontWeight: 600 }}>
                  Upravljanje Sobama ({escapeRooms.length})
                </button>
              )}
              <button onClick={() => setAdminActiveTab('podrska')} style={{ padding: "10px 20px", borderRadius: "20px", border: "none", cursor: "pointer", background: adminActiveTab === 'podrska' ? '#FE7F2D' : '#e0e0e0', color: adminActiveTab === 'podrska' ? 'white' : '#233D4D', fontWeight: 600 }}>
                Poruke Korisnika ({supportTickets.length})
              </button>
              <button onClick={() => setAdminActiveTab('obavijesti')} style={{ padding: "10px 20px", borderRadius: "20px", border: "none", cursor: "pointer", background: adminActiveTab === 'obavijesti' ? '#FE7F2D' : '#e0e0e0', color: adminActiveTab === 'obavijesti' ? 'white' : '#233D4D', fontWeight: 600 }}>
                Upravljanje Obavijestima ({obavijesti.length})
              </button>
              {currentUser.uloga === Uloga.Administrator && (
                <button onClick={() => setAdminActiveTab('korisnici')} style={{ padding: "10px 20px", borderRadius: "20px", border: "none", cursor: "pointer", background: adminActiveTab === 'korisnici' ? '#FE7F2D' : '#e0e0e0', color: adminActiveTab === 'korisnici' ? 'white' : '#233D4D', fontWeight: 600 }}>
                  Upravljanje Korisnicima ({allUsers.length})
                </button>
              )}
            </div>

            {/* TAB 1: RESERVATIONS MASTER */}
            {adminActiveTab === 'rezervacije' && (
              <div style={{ background: "white", padding: "25px", borderRadius: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)", overflowX: "auto" }}>
                <h3 style={{ marginBottom: "15px", color: "#233D4D" }}>Sve Rezervacije Termina</h3>
                {reservations.length === 0 ? (
                  <p>Trenutno nema rezervacija u sistemu.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textLeft: "left" }}>
                    <thead>
                      <tr style={{ background: "#f2f2f2", borderBottom: "2px solid #e0e0e0" }}>
                        <th style={{ padding: "12px" }}>Klijent</th>
                        <th style={{ padding: "12px" }}>Soba</th>
                        <th style={{ padding: "12px" }}>Datum & Vrijeme</th>
                        <th style={{ padding: "12px" }}>Broj Osoba</th>
                        <th style={{ padding: "12px" }}>Status</th>
                        <th style={{ padding: "12px", textRight: "right" }}>Akcije</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((res) => {
                        const clientName = res.korisnik ? `${res.korisnik.ime} ${res.korisnik.prezime}` : "Gost";
                        const clientEmail = res.korisnik ? res.korisnik.email : "Nepoznato";
                        return (
                          <tr key={res.rezervacijaID} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "12px" }}>
                              <strong style={{ display: "block" }}>{clientName}</strong>
                              <span style={{ fontSize: "11px", color: "#666" }}>{clientEmail}</span>
                            </td>
                            <td style={{ padding: "12px" }}>
                              {res.termin?.escapeRoom?.naziv || "Učitavanje..."}
                            </td>
                            <td style={{ padding: "12px" }}>
                              {res.termin?.datum} u <strong>{res.termin?.vrijeme} h</strong>
                            </td>
                            <td style={{ padding: "12px" }}>{res.brojOsoba} osobe</td>
                            <td style={{ padding: "12px" }}>
                              <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", 
                                background: res.status === "Odobreno" ? "#d4edda" : res.status === "Otkazano" ? "#f8d7da" : "#fff3cd",
                                color: res.status === "Odobreno" ? "#155724" : res.status === "Otkazano" ? "#721c24" : "#856404"
                              }}>
                                {res.status}
                              </span>
                            </td>
                            <td style={{ padding: "12px", textAlign: "right" }}>
                              {res.status !== "Odobreno" && (
                                <button onClick={() => handleUpdateStatus(res.rezervacijaID, "Odobreno")} style={{ padding: "5px 10px", marginRight: "5px", background: "#d4edda", border: "1px dashed #155724", borderRadius: "5px", cursor: "pointer", color: "#155724", fontWeight: "bold" }}>
                                  Odobri
                                </button>
                              )}
                              {res.status !== "Otkazano" && (
                                <button onClick={() => handleUpdateStatus(res.rezervacijaID, "Otkazano")} style={{ padding: "5px 10px", background: "#f8d7da", border: "1px dashed #721c24", borderRadius: "5px", cursor: "pointer", color: "#721c24", fontWeight: "bold" }}>
                                  Otkaži
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB 2: ROOM MANAGEMENT */}
            {adminActiveTab === 'sobe' && currentUser.uloga === Uloga.Administrator && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                {/* Add new room */}
                <div style={{ background: "white", padding: "25px", borderRadius: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ marginBottom: "15px", color: "#233D4D" }}>Kreiraj Novu Sobu</h3>
                  <form onSubmit={handleAddRoom} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Naziv Sobe</label>
                    <input type="text" value={newRoomNaziv} onChange={(e) => setNewRoomNaziv(e.target.value)} placeholder="Unesite naziv" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} required />
                    
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Opis i specifikacije sobe</label>
                    <textarea value={newRoomOpis} onChange={(e) => setNewRoomOpis(e.target.value)} placeholder="Opišite sobu..." rows={4} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc", resize: "none" }} required />
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Težina</label>
                        <select value={newRoomTezina} onChange={(e) => setNewRoomTezina(e.target.value as Tezina)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}>
                          <option value="Lako">Lako</option>
                          <option value="Srednje">Srednje</option>
                          <option value="Tesko">Teško</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Kapacitet</label>
                        <input type="number" value={newRoomKapacitet} onChange={(e) => setNewRoomKapacitet(parseInt(e.target.value))} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} min={2} required />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Cijena (KM)</label>
                        <input type="number" value={newRoomCijena} onChange={(e) => setNewRoomCijena(parseFloat(e.target.value))} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} min={10} required />
                      </div>
                    </div>

                    <button type="submit" style={{ padding: "12px", background: "#FE7F2D", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}>
                      Kreiraj Sobu i Generiši Termine
                    </button>
                  </form>
                </div>

                {/* Existing rooms list */}
                <div style={{ background: "white", padding: "25px", borderRadius: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ marginBottom: "15px", color: "#233D4D" }}>Pregled Aktivnih Soba</h3>
                  {escapeRooms.map((room) => (
                    <div key={room.roomID} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #eee" }}>
                      <div>
                        <strong style={{ color: "#233D4D" }}>{room.naziv}</strong>
                        <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                          Težina: {room.tezina} • Kapacitet: {room.kapacitet} • Cijena: {room.cijena} KM
                        </div>
                      </div>
                      <button onClick={() => handleDeleteRoom(room.roomID)} style={{ background: "#f8d7da", color: "#721c24", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                        Ukloni
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CONTACT SUPPORT TICKETS */}
            {adminActiveTab === 'podrska' && (
              <div style={{ background: "white", padding: "25px", borderRadius: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
                <h3 style={{ marginBottom: "15px", color: "#233D4D" }}>Sanduče Primljenih Poruka</h3>
                {supportTickets.length === 0 ? (
                  <p>Nemate novih poruka u sandučetu.</p>
                ) : (
                  <div>
                    {supportTickets.map((ticket) => {
                      const userDetails = ticket.korisnik ? `${ticket.korisnik.ime} ${ticket.korisnik.prezime}` : "Neregistrovani Posjetitelj";
                      return (
                        <div key={ticket.porukaID} style={{ border: "1px solid #eee", borderRadius: "10px", padding: "15px", marginBottom: "12px", background: "#fafafa" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <strong>📩 {ticket.naslovPoruke}</strong>
                            <span style={{ fontSize: "11px", color: "#666" }}>{new Date(ticket.datum).toLocaleDateString()}</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "#333", margin: "8px 0", whiteSpace: "pre-line" }}>{ticket.sadrzaj}</p>
                          <div style={{ fontSize: "11px", color: "#555", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                            Od: <strong>{userDetails}</strong> ({ticket.email})
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PUBLISH ANNOUNCEMENTS */}
            {adminActiveTab === 'obavijesti' && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                {/* Publish announcement */}
                <div style={{ background: "white", padding: "25px", borderRadius: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ marginBottom: "15px", color: "#233D4D" }}>Objavi Novu Vijest ili Promociju</h3>
                  <form onSubmit={handleAddObavijest} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Naslov Obavijesti</label>
                    <input type="text" value={newObavijestNaslov} onChange={(e) => setNewObavijestNaslov(e.target.value)} placeholder="Unesite naslov" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} required />
                    
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Sadržaj obavještenja</label>
                    <textarea value={newObavijestSadrzaj} onChange={(e) => setNewObavijestSadrzaj(e.target.value)} placeholder="Unesite detalje..." rows={4} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc", resize: "none" }} required />
                    
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Značka (Tip Obavijesti)</label>
                    <select value={newObavijestTip} onChange={(e) => setNewObavijestTip(e.target.value as TipObavijesti)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}>
                      <option value="Info">Info</option>
                      <option value="Promocija">Promocija</option>
                      <option value="Upozorenje">Upozorenje</option>
                    </select>

                    <button type="submit" style={{ padding: "12px", background: "#FE7F2D", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}>
                      Objavi na Početnoj Stranici
                    </button>
                  </form>
                </div>

                {/* News preview & Delete */}
                <div style={{ background: "white", padding: "25px", borderRadius: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ marginBottom: "15px", color: "#233D4D" }}>Historija Objava</h3>
                  {obavijesti.map((ob) => (
                    <div key={ob.obavijestID} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px", background: "#eee", textTransform: "uppercase" }}>
                          {ob.tipObavijesti}
                        </span>
                        <button onClick={() => handleDeleteObavijest(ob.obavijestID)} style={{ background: "transparent", color: "#d62828", border: "none", cursor: "pointer", fontSize: "12px" }}>
                          Ukloni
                        </button>
                      </div>
                      <h4 style={{ margin: "5px 0", color: "#233D4D" }}>{ob.naslov}</h4>
                      <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>{ob.sadrzaj}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: MANAGE USERS */}
            {adminActiveTab === 'korisnici' && currentUser.uloga === Uloga.Administrator && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "30px", marginTop: "15px" }}>
                {/* Save employees directly */}
                <div style={{ background: "white", padding: "25px", borderRadius: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
                  <h3 style={{ marginBottom: "15px", color: "#233D4D" }}>Dodaj Novog Zaposlenika / Korisnika</h3>
                  <form onSubmit={handleAdminAddUser} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Korisničko Ime (Username)</label>
                    <input type="text" value={adminAddUsername} onChange={(e) => setAdminAddUsername(e.target.value)} placeholder="npr. zlatko_zaposlenik" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} required />
                    
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Email Adresa</label>
                    <input type="email" value={adminAddEmail} onChange={(e) => setAdminAddEmail(e.target.value)} placeholder="ime@escaperoom.ba" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} required />
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Ime</label>
                        <input type="text" value={adminAddIme} onChange={(e) => setAdminAddIme(e.target.value)} placeholder="Unesite ime" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} required />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Prezime</label>
                        <input type="text" value={adminAddPrezime} onChange={(e) => setAdminAddPrezime(e.target.value)} placeholder="Unesite prezime" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} required />
                      </div>
                    </div>
                    
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Dodijeli Ulogu</label>
                    <select value={adminAddRole} onChange={(e) => setAdminAddRole(e.target.value as Uloga)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc", background: "white" }}>
                      <option value="Korisnik">Korisnik (Igrač)</option>
                      <option value="Zaposlenik">Zaposlenik (Uposlenik)</option>
                      <option value="Administrator">Administrator (Sistem)</option>
                    </select>

                    {adminAddError && (
                      <p style={{ color: "red", fontSize: "12px", margin: "5px 0" }}>{adminAddError}</p>
                    )}

                    {adminAddSuccess && (
                      <p style={{ color: "green", fontSize: "12px", margin: "5px 0", fontWeight: "bold" }}>✓ Korisnik uspješno kreiran!</p>
                    )}

                    <button type="submit" style={{ padding: "12px", background: "#FE7F2D", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}>
                      Dodaj Korisnika
                    </button>
                  </form>
                </div>

                {/* Users table */}
                <div style={{ background: "white", padding: "25px", borderRadius: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)", overflowX: "auto" }}>
                  <h3 style={{ marginBottom: "15px", color: "#233D4D" }}>Svi Korisnici u Sistemu</h3>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f2f2f2", borderBottom: "2px solid #e0e0e0" }}>
                        <th style={{ padding: "12px" }}>Korisnik</th>
                        <th style={{ padding: "12px" }}>Email</th>
                        <th style={{ padding: "12px" }}>Uloga</th>
                        <th style={{ padding: "12px", textAlign: "right" }}>Promijeni Ulogu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "12px" }}>
                            <strong>{u.ime} {u.prezime}</strong>
                            <div style={{ fontSize: "11px", color: "#666" }}>@{u.userName}</div>
                          </td>
                          <td style={{ padding: "12px", fontSize: "13px" }}>{u.email}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ 
                              padding: "4px 8px", 
                              borderRadius: "4px", 
                              fontSize: "11px", 
                              fontWeight: "bold", 
                              background: u.uloga === Uloga.Administrator ? "#f8d7da" : u.uloga === Uloga.Zaposlenik ? "#fff3cd" : "#d1ecf1",
                              color: u.uloga === Uloga.Administrator ? "#721c24" : u.uloga === Uloga.Zaposlenik ? "#856404" : "#0c5460"
                            }}>
                              {u.uloga}
                            </span>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <select 
                              value={u.uloga} 
                              disabled={u.id === currentUser.id}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value as Uloga)} 
                              style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc", background: "white", fontSize: "12px" }}
                            >
                              <option value="Korisnik">Korisnik</option>
                              <option value="Zaposlenik">Zaposlenik</option>
                              <option value="Administrator">Administrator</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ marginTop: "30px", textLeft: "right" }}>
              <button onClick={() => setShowAdminPanel(false)} className="btn-register" style={{ cursor: "pointer", padding: "14px 40px", border: "none" }}>
                Zatvori panel i vrati se na Početnu
              </button>
            </div>
          </div>
        </section>
      )}

      {/* PERSONAL BOOKINGS SCREEN FOR USER */}
      {showMyBookings && currentUser && (
        <section className="about-section" style={{ background: "#F5FBE6", color: "#233D4D" }}>
          <div className="about-content" style={{ maxWidth: "1100px" }}>
            <p className="about-subtitle" style={{ color: "#FE7F2D" }}>ISTORIJA REZERVACIJA</p>
            <h2 className="about-title" style={{ fontSize: "38px", color: "#233D4D" }}>VAŠE REZERVACIJE KOJE STE PRIMILI</h2>
            
            <div style={{ background: "white", padding: "25px", borderRadius: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)", marginTop: "20px" }}>
              {reservations.filter(r => r.korisnikID === currentUser.id).length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px" }}>
                  <h3>Nemate zabilježenih rezervacija.</h3>
                  <p>Izaberite neku od naših soba i rezervišite termin!</p>
                  <button onClick={() => setShowMyBookings(false)} className="btn-register" style={{ cursor: "pointer", border: "none", marginTop: "15px" }}>
                     Istraži Sobe
                  </button>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textLeft: "left" }}>
                  <thead>
                    <tr style={{ background: "#f2f2f2", borderBottom: "2px solid #e0e0e0" }}>
                      <th style={{ padding: "12px" }}>Soba</th>
                      <th style={{ padding: "12px" }}>Datum & Vrijeme</th>
                      <th style={{ padding: "12px" }}>Kapacitet (Osoba)</th>
                      <th style={{ padding: "12px" }}>Status Rezervacije</th>
                      <th style={{ padding: "12px", textRight: "right" }}>Akcije</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.filter(r => r.korisnikID === currentUser.id).map((res) => (
                      <tr key={res.rezervacijaID} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "12px", fontWeight: "bold" }}>
                          {res.termin?.escapeRoom?.naziv || "Naziv sobe"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {res.termin?.datum} u {res.termin?.vrijeme} h
                        </td>
                        <td style={{ padding: "12px" }}><strong>{res.brojOsoba}</strong> osobe</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", 
                            background: res.status === "Odobreno" ? "#d4edda" : res.status === "Otkazano" ? "#f8d7da" : "#fff3cd",
                            color: res.status === "Odobreno" ? "#155724" : res.status === "Otkazano" ? "#721c24" : "#856404"
                          }}>
                            {res.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          {res.status !== "Otkazano" ? (
                            <button onClick={() => {
                              if (confirm("Jeste li sigurni da želite OTKAZATI ovu rezervaciju? Slobodni termin se deblokira.")) {
                                handleUpdateStatus(res.rezervacijaID, "Otkazano");
                              }
                            }} style={{ padding: "6px 12px", background: "transparent", border: "1px solid #721c24", color: "#721c24", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                              Otkaži Termin
                            </button>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#666", fontStyle: "italic" }}>Termin Otkazan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: "30px" }}>
              <button onClick={() => setShowMyBookings(false)} className="btn-register" style={{ cursor: "pointer", border: "none", padding: "14px 45px" }}>
                Povratak na Početnu Stranicu
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CORE SECTIONS FOR PUBLIC WEB */}
      {!showAdminPanel && !showMyBookings && (
        <>
          {/* O NAMA (ABOUT) SECTION */}
          <section id="about" className="about-section">
            <div className="about-content">
              <p className="about-subtitle">O NAMA</p>
              <h2 className="about-title">
                THE LAST KEY <br />
                SARAJEVO
              </h2>
              <p className="about-text">
                The Last Key Sarajevo otvoren je 2023. godine sa ciljem da ljubiteljima
                misterije, adrenalina i timskog duha pruži potpuno novo escape room iskustvo.
                Inspirisani svjetskim escape konceptima, kreirali smo prostor u kojem svaka
                soba priča jedinstvenu priču i pretvara igrače u glavne junake avanture.
              </p>
              <p className="about-text">
                Tokom protekle dvije godine kroz naše sobe prošlo je više od 5000 igrača,
                uključujući prijateljske grupe, porodice, turiste, kompanije i studentske
                organizacije. Posebno smo ponosni na team building događaje koji okupljaju
                timove kroz saradnju, logiku i zabavu.
              </p>
              <p className="about-text">
                Naš cilj nije samo igra, već stvaranje iskustva koje se pamti.
                Od misterioznih istraga i laboratorijskih eksperimenata do magičnih akademija,
                svaka avantura osmišljena je tako da testira kreativnost, komunikaciju i
                snalažljivost igrača pod pritiskom vremena.
              </p>
            </div>
          </section>

          {/* OBAVIJESTI / PROMOCIJE SECTION (Dynamic notification bulletin layout) */}
          {obavijesti.length > 0 && (
            <section style={{ padding: "40px 70px", background: "#fcfef7", borderTop: "2px dashed #ececec" }}>
              <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <p style={{ color: "#FE7F2D", fontWeight: 800, fontSize: "14px", letterSpacing: "2.5px" }}>AKTUELNOSTI</p>
                <h2 style={{ fontSize: "32px", color: "#233D4D", fontWeight: 900, marginBottom: "25px" }}>NOVOSTI & PROMOCIJE</h2>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "25px" }}>
                  {obavijesti.map((ob) => (
                    <div key={ob.obavijestID} style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #eee", boxShadow: "0 6px 15px rgba(0,0,0,0.03)" }}>
                      <span style={{ fontSize: "9px", fontWeight: "bold", padding: "2px 8px", borderRadius: "4px", background: ob.tipObavijesti === "Promocija" ? "#fff3cd" : ob.tipObavijesti === "Upozorenje" ? "#f8d7da" : "#e0f2fe", color: ob.tipObavijesti === "Promocija" ? "#856404" : ob.tipObavijesti === "Upozorenje" ? "#721c24" : "#0369a1", textTransform: "uppercase" }}>
                        {ob.tipObavijesti}
                      </span>
                      <h3 style={{ fontSize: "18px", color: "#233D4D", marginTop: "10px", marginBottom: "8px", fontWeight: "bold" }}>{ob.naslov}</h3>
                      <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.5" }}>{ob.sadrzaj}</p>
                      <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f2f2f2", marginTop: "12px", paddingTop: "8px", fontSize: "11px", color: "#888" }}>
                        Objavljeno: {ob.datum}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SOBE (ROOMS) SECTION */}
          <section id="rooms" className="rooms-section">
            <div className="rooms-content">
              <p className="rooms-subtitle">AKTIVNE SOBE</p>
              <h2 className="rooms-hover-title">Istraži naše misterije</h2>
              <p className="rooms-text">
                Zakoračite u svijet zagonetki, tajni i adrenalina. Svaka soba krije novu priču koju morate otkriti.
              </p>

              {/* ESCAPE ROOM CARDS WITH SLIDER/CAROUSEL (SOLID DESIGN) */}
              <div className="escape-slider-wrapper" style={{ position: "relative", width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {getFilteredEscapeRooms().length > 4 && roomStartIndex > 0 && (
                  <button onClick={() => setRoomStartIndex(prev => Math.max(0, prev - 1))} className="slider-arrow prev" style={{
                    position: "absolute",
                    left: "-25px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 200,
                    background: "#FE7F2D",
                    color: "white",
                    border: "none",
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: "24px",
                    fontWeight: "bold",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#233D4D"; e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FE7F2D"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
                  title="Prethodne Sobe"
                  >
                    &#8592;
                  </button>
                )}

                <div className="escape-cards" style={{ display: "flex", gap: "20px", flexWrap: "nowrap", justifyContent: "flex-start" }}>
                  {escapeRooms.length === 0 ? (
                    <p style={{ color: "white", padding: "30px", textAlignment: "center" }}>Sobe se generišu ili se učitavaju...</p>
                  ) : (
                    getFilteredEscapeRooms().slice(roomStartIndex, roomStartIndex + 4).map((room) => {
                      return (
                        <div key={room.roomID} className="escape-card" style={{ width: "23%", minWidth: "250px", flexShrink: 0, boxSizing: "border-box" }}>
                          <div className="card-image">
                            <img src={getRoomImagePath(room.roomID)} alt={room.naziv} referrerPolicy="no-referrer" />
                          </div>
                          <div className="card-content">
                            <h3>{room.naziv}</h3>
                            <p style={{ minHeight: "65px", fontSize: "13px" }}>{room.opis.substring(0, 110)}...</p>
                            <div className="card-info">
                              <span>👥 2-{room.kapacitet}</span>
                              <span>⏱ 60 min</span>
                              <span> {getAverageRating(room.roomID)} ★</span>
                            </div>
                            <button onClick={() => { setSelectedRoom(room); setBookingSuccess(false); setBookingError(""); }} className="card-btn murder-btn" style={{ border: "none", cursor: "pointer", display: "inline-block", width: "100%", textLeft: "center" }}>
                              Pregled sobe
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {getFilteredEscapeRooms().length > 4 && roomStartIndex + 4 < getFilteredEscapeRooms().length && (
                  <button onClick={() => setRoomStartIndex(prev => Math.min(getFilteredEscapeRooms().length - 4, prev + 1))} className="slider-arrow next" style={{
                    position: "absolute",
                    right: "-25px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 200,
                    background: "#FE7F2D",
                    color: "white",
                    border: "none",
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: "24px",
                    fontWeight: "bold",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#233D4D"; e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#FE7F2D"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
                  title="Sljedeće Sobe"
                  >
                    &#8594;
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ČESTA PITANJA (FAQ) SECTION */}
          <section id="faq" className="faq-section">
            <div className="faq-container">
              <p className="faq-subtitle font-bold">ČESTA PITANJA</p>
              <h2 className="faq-title font-bold">Sve što trebate znati prije rezervacije</h2>
              <p className="faq-text">
                Pronađite odgovore na najčešća pitanja vezana za rezervacije, trajanje igara, broj igrača i pravila escape room iskustva.
              </p>

              <div className="faq-wrapper">
                {[
                  {
                    q: "Koliko traje jedna escape room igra?",
                    a: "Većina naših escape room avantura traje između 45 i 80 minuta, zavisno od odabrane sobe. Preporučljivo je planirati ukupno 1.5 sat zbog uvodnih i zaključnih razgovora."
                  },
                  {
                    q: "Da li je potrebna prethodna rezervacija?",
                    a: "Da. Rezervacija termina je strogo obavezna kako bismo osigurali dostupnost sobe i pripremili cjelokupno misteriozno iskustvo za vaš pobjednički tim."
                  },
                  {
                    q: "Koliko igrača može učestvovati?",
                    a: "Broj igrača zavisi od sobe, ali većina naših fantastičnih avantura podržava između 2 i 7 učesnika u jednom odabranom terminu."
                  },
                  {
                    q: "Šta ako zakasnimo na rezervisani termin?",
                    a: "Preporučujemo dolazak najmanje 10 minuta ranije. Veća kašnjenja se ne mogu nadoknaditi i samim tim mogu drastično skratiti trajanje vaše igre."
                  },
                  {
                    q: "Da li su sobe prilagođene početnicima?",
                    a: "Naravno. Imamo sobe različitih nivoa težina — od onih prilagođenih porodicama i djeci (poput Locked Classroom), do naprednih izazova za iskusne timove."
                  }
                ].map((item, index) => {
                  const isOpen = activeFAQ === index;
                  return (
                    <div className={`faq-item ${isOpen ? 'active' : ''}`} key={index}>
                      <button onClick={() => setActiveFAQ(isOpen ? null : index)} className="faq-question">
                        {item.q}
                        <span>{isOpen ? '−' : '+'}</span>
                      </button>
                      <div className="faq-answer">
                        <p>{item.a}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* KONTAKT I PODRŠKA SECTION */}
          <section id="contact" className="contact-section">
            <div className="contact-container" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px" }}>
              <div>
                <p className="contact-subtitle">KONTAKT I PODRŠKA</p>
                <h2 className="contact-title">Posjetite nas u srcu Sarajeva</h2>
                <p className="contact-text">
                  Ukoliko imate bilo kakva pitanja, trebate tehničku podršku ili želite dodatne informacije o našim uslugama, naš tim vam je uvijek na raspolaganju.
                </p>
                
                <div className="contact-wrapper" style={{ marginTop: "20px" }}>
                  <div className="contact-left">
                    <div className="contact-card">
                      <h3>📍 Adresa</h3>
                      <p>Kralja Tvrtka 6</p>
                      <p>Sarajevo, Bosna i Hercegovina</p>
                    </div>

                    <div className="contact-card">
                      <h3>📧 Kontakt</h3>
                      <p>📞 +387 61 234 567</p>
                      <p>✉ support@thelastkey.ba</p>
                    </div>
                  </div>

                  <div className="map-container">
                    <img src="/images/mapa.png" alt="Mapa" referrerPolicy="no-referrer" />
                    <div className="map-pin">📍</div>
                  </div>
                </div>
              </div>

              {/* Dynamic Interactive Mailer form with premium high-contrast dark-teal brand color container */}
              <div style={{ background: "#215E61", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "24px", padding: "35px", boxShadow: "0 15px 35px rgba(0,0,0,0.25)", textAlign: "left" }}>
                <h3 style={{ color: "white", fontSize: "22px", fontWeight: "bold", marginBottom: "8px" }}>Kontaktirajte Podršku</h3>
                <p style={{ color: "#E0E6ED", fontSize: "14px", marginBottom: "20px" }}>Imate pitanje ili trebate tehničku pomoć? Pošaljite nam poruku i odgovorit ćemo u najkraćem roku.</p>
                
                {contactSuccess ? (
                  <div style={{ padding: "20px", background: "rgba(40,167,69,0.15)", border: "1px solid #28a745", borderRadius: "12px" }}>
                    <p style={{ color: "#d4edda", margin: 0, fontWeight: "bold", fontSize: "14px" }}>
                      ✓ Vaš upit je uspješno poslan u naš sistem! Odgovorit ćemo vam u roku od maksimalno 2 sata.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                      <div>
                        <label style={{ display: "block", color: "white", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", fontWeight: "bold" }}>Vaša Email Adresa</label>
                        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@adresa.ba" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white" }} required />
                      </div>
                      <div>
                        <label style={{ display: "block", color: "white", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", fontWeight: "bold" }}>Predmet Upita</label>
                        <input type="text" value={contactSubject} onChange={(e) => setContactSubject(e.target.value)} placeholder="npr. Tehnička podrška / Opšte pitanje" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white" }} required />
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ display: "block", color: "white", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", fontWeight: "bold" }}>Sadržaj Poruke</label>
                      <textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} placeholder="Napišite detaljno Vašu poruku..." rows={4} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", resize: "none" }} required />
                    </div>

                    {contactError && (
                      <div style={{ padding: "8px", color: "#f8d7da", fontSize: "12px", background: "rgba(220,53,69,0.15)", borderRadius: "6px" }}>
                        {contactError}
                      </div>
                    )}

                    <button type="submit" style={{ padding: "14px", background: "#FE7F2D", color: "white", fontWeight: "bold", border: "none", borderRadius: "10px", cursor: "pointer", textTransform: "uppercase", fontSize: "13px", marginTop: "10px" }}>
                      Pošalji Upit Podršci
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* BACK TO TOP */}
      <a href="#" className="back-to-top">↑</a>

      {/* DYNAMIC ROOM DETAILS POPUP MODAL (REPLACES ALL STATIC MODALS) */}
      {selectedRoom && (
        <div className="room-modal show-room-modal" onClick={(e) => { if (e.target === e.currentTarget) setSelectedRoom(null); }} style={{ display: "flex", justifyContent: "center", alignItems: "center", overflowY: "auto", position: "fixed", inset: 0, padding: "20px", zIndex: 99999 }}>
          <div className="room-modal-box" style={{ maxWidth: "1000px", position: "relative" }}>
            <span className="close-room" onClick={() => setSelectedRoom(null)} style={{ position: "absolute", top: "15px", right: "20px", fontSize: "36px", cursor: "pointer", zIndex: 9999, color: "#FE7F2D", textShadow: "0 2px 4px rgba(0,0,0,0.5)", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", borderRadius: "50%" }}>
              &times;
            </span>

            {/* HEADER ROOM IMAGE */}
            <div className="room-image">
              <img src={getRoomImagePath(selectedRoom.roomID)} alt={selectedRoom.naziv} referrerPolicy="no-referrer" />
              <div className="room-overlay">
                <h2>{selectedRoom.naziv}</h2>
                <p>Misterija • Timski rad • Adrenalin i Logičke zagonetke</p>
              </div>
            </div>

            {/* SPLIT LAYOUT Grid */}
            <div className="room-details">
              <div className="room-info-modern">
                <div className="modern-info-card">
                  <div className="modern-icon">🕵️</div>
                  <div>
                    <h4>Nivo Težine</h4>
                    <p>{selectedRoom.tezina === Tezina.Tesko ? "10/10" : selectedRoom.tezina === Tezina.Srednje ? "7/10" : "4/10"}</p>
                  </div>
                </div>

                <div className="modern-info-card">
                  <div className="modern-icon">⏳</div>
                  <div>
                    <h4>Trajanje Sati</h4>
                    <p>60 min</p>
                  </div>
                </div>

                <div className="modern-info-card">
                  <div className="modern-icon">👥</div>
                  <div>
                    <h4>Članova Tima</h4>
                    <p>2 – {selectedRoom.kapacitet} igrača</p>
                  </div>
                </div>
              </div>

              <div className="room-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "25px", marginTop: "20px" }}>
                {/* LEFT BLOCK: BOOKING & SUMMARY */}
                <div className="room-left">
                  <div className="room-description modern-box">
                    <h3>Opis i Misija</h3>
                    <p>{selectedRoom.opis}</p>
                    <p style={{ marginTop: "10px", fontWeight: "bold", color: "#FE7F2D" }}>
                      Cijena: {selectedRoom.cijena} KM po odigranoj igri
                    </p>
                  </div>

                  <div className="reservation-box modern-box" style={{ marginTop: "20px" }}>
                    <div className="reservation-top">
                      <h3>Rezervacija termina</h3>
                      <span>📅</span>
                    </div>

                    {bookingSuccess ? (
                      <div style={{ padding: "20px", background: "rgba(40, 167, 69, 0.15)", borderRadius: "10px", marginTop: "15px", color: "green", fontWeight: "bold" }}>
                        🎉 Rezervacija uspješno evidentirana! Vaš termin je blokiran. Status možete provjeriti na Vašem profilu.
                      </div>
                    ) : (
                      <form onSubmit={handleBookingSubmit} className="reservation-form">
                        {!currentUser ? (
                          <div style={{ textAlign: "center", padding: "10px 0" }}>
                            <p style={{ fontSize: "12px", color: "#555" }}>
                              Da biste rezervisali termin, najprije se prijavite sa Vašim korisničkim računom.
                            </p>
                            <button type="button" onClick={() => { setShowLoginModal(true); setSelectedRoom(null); }} style={{ margin: "10px auto", padding: "8px 20px", background: "#FE7F2D", color: "white", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "bold" }}>
                              Prijavi Se Ovdje
                            </button>
                          </div>
                        ) : (
                          <>
                            <input type="text" value={`${currentUser.ime} ${currentUser.prezime}`} readOnly style={{ opacity: 0.7 }} />
                            <input type="email" value={currentUser.email} readOnly style={{ opacity: 0.7 }} />
                            
                            <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", margin: "10px 0 2px" }}>Izaberi Datum</label>
                            <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} min={new Date().toISOString().split("T")[0]} style={{ width: "100%" }} required />
                            
                            {bookingDate && (
                              <>
                                <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", margin: "10px 0 2px" }}>Izaberi Slobodan Sat</label>
                                {bookingSlots.length === 0 ? (
                                  <p style={{ fontSize: "12px", color: "#666", fontStyle: "italic" }}>Učitavanje slobodnih termina za odabrani dan...</p>
                                ) : (
                                  <select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "10px", margin: "5px 0" }} required>
                                    <option value="">-- Izaberite slobodan sat --</option>
                                    {bookingSlots.map((slot) => (
                                      <option key={slot.terminID} value={slot.terminID} disabled={!slot.dostupnost}>
                                        {slot.vrijeme} h {slot.dostupnost ? "(Dostupan)" : "(Zauzet/Bukiran)"}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </>
                            )}

                            <label style={{ fontSize: "11px", fontWeight: "bold", display: "block", margin: "10px 0 2px" }}>Igrača unutar tima (Broj klijenta)</label>
                            <input type="number" value={bookingSize} onChange={(e) => setBookingSize(parseInt(e.target.value))} min={2} max={selectedRoom.kapacitet} required style={{ width: "100%" }} />

                            {bookingError && (
                              <p style={{ color: "red", fontSize: "12px", margin: "5px 0" }}>{bookingError}</p>
                            )}

                            <div className="reservation-note">
                              ℹ Nakon unosa, termin se trenutno zaključava i spremni ste za avanturu.
                            </div>

                            <button type="submit" style={{ cursor: "pointer" }}>
                              Rezerviši termin
                            </button>
                          </>
                        )}
                      </form>
                    )}
                  </div>
                </div>

                {/* RIGHT BLOCK: REVIEWS & GENERAL FEEDBACK */}
                <div className="room-right">
                  <div className="average-rating-modern">
                    <div className="rating-left">
                      <h2>{getAverageRating(selectedRoom.roomID)}</h2>
                      <p>Ocjena sobe</p>
                    </div>
                    <div className="rating-right">
                      ⭐⭐⭐⭐⭐
                      <span>{getReviewCount(selectedRoom.roomID)} recenzije posjetitelja</span>
                    </div>
                  </div>

                  {/* CUSTOM TIMELINE REVIEW CARDS LIST */}
                  <div className="reviews-section" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    <h3>Iskustva igrača</h3>

                    {/* NEW REVIEW COMPOSER FOR LOGGED IN CLIENTS */}
                    {currentUser && (
                      <form onSubmit={handleReviewSubmit} style={{ background: "#eaeaea", padding: "15px", borderRadius: "14px", marginBottom: "15px" }}>
                        <h4 style={{ margin: "0 0 10px", color: "#233D4D", fontSize: "13px", fontWeight: "bold" }}>Ostavite Vašu recenziju</h4>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "bold" }}>Ocjena:</span>
                          <select value={newReviewRating} onChange={(e) => setNewReviewRating(parseInt(e.target.value))} style={{ padding: "4px", borderRadius: "5px" }}>
                            <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                            <option value={4}>⭐⭐⭐⭐ (4)</option>
                            <option value={3}>⭐⭐⭐ (3)</option>
                            <option value={2}>⭐⭐ (2)</option>
                            <option value={1}>⭐ (1)</option>
                          </select>
                        </div>
                        <textarea value={newReviewComment} onChange={(e) => setNewReviewComment(e.target.value)} placeholder="Unesite Vaš iskreni komentar..." rows={2} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "12px", resize: "none" }} required />
                        <button type="submit" style={{ padding: "6px 15px", marginTop: "5px", background: "#FE7F2D", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>
                          Podijeli Komentar
                        </button>
                      </form>
                    )}

                    {/* Dynamic list */}
                    {reviews.filter(r => r.roomID === selectedRoom.roomID).length === 0 ? (
                      <p style={{ fontStyle: "italic", fontSize: "12px", color: "#666" }}>Ostali posjetitelji su ocijenili ovu sobu visoko. Budite prvi koji će unijeti novi komentar!</p>
                    ) : (
                      reviews.filter(r => r.roomID === selectedRoom.roomID).map((rev) => {
                        const writerName = rev.korisnik ? `${rev.korisnik.ime} ${rev.korisnik.prezime.substring(0,1)}.` : "Anonimno";
                        return (
                          <div key={rev.recenzijaID} className="review-card modern-review">
                            <div className="review-header">
                              <div className="review-user">
                                <div className="review-avatar">
                                  {rev.korisnik ? rev.korisnik.ime.substring(0, 2).toUpperCase() : "AN"}
                                </div>
                                <div>
                                  <h4>{writerName}</h4>
                                  <span>{rev.datum}</span>
                                </div>
                              </div>
                              <div className="review-stars">
                                {"⭐".repeat(Math.round(rev.ocjena))}
                              </div>
                            </div>
                            <p>{rev.komentar}</p>
                          </div>
                        );
                      })
                    )}

                    {/* Ported template static feedback mockups */}
                    {selectedRoom.roomID === 1 && (
                      <div className="review-card modern-review">
                        <div className="review-header">
                          <div className="review-user">
                            <div className="review-avatar">AK</div>
                            <div>
                              <h4>Amar K.</h4>
                              <span>Prije 2 dana</span>
                            </div>
                          </div>
                          <div className="review-stars">⭐⭐⭐⭐⭐</div>
                        </div>
                        <p>Najbolja escape room soba koju smo igrali. Atmosfera je brutalna i stvarno imate osjećaj kao da ste u pravoj istrazi.</p>
                      </div>
                    )}
                    {selectedRoom.roomID === 2 && (
                      <div className="review-card modern-review">
                        <div className="review-header">
                          <div className="review-user">
                            <div className="review-avatar">LM</div>
                            <div>
                              <h4>Lejla M.</h4>
                              <span>Prije 3 dana</span>
                            </div>
                          </div>
                          <div className="review-stars">⭐⭐⭐⭐⭐</div>
                        </div>
                        <p>Previše detalja i odlični puzzle-i. Vrijeme nam je bukvalno proletilo!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="login-modal show-login" id="loginModal">
          <div className="login-box">
            <span className="close-login" onClick={() => setShowLoginModal(false)}>
              &times;
            </span>
            <h2>Prijava u kabinet</h2>
            <p className="login-subtext">Prijavite se koristeći Vaše registrovano korisničko ime.</p>
            
            <form onSubmit={handleLoginSubmit}>
              <div className="input-group">
                <label>Korisničko Ime (Nalog)</label>
                <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="npr. 'user' za Nedima ili 'admin'" required />
                <span style={{ fontSize: "10px", marginTop: "4px", color: "#666", display: "block" }}>
                  💡 Testni nalozi: <strong>admin</strong>, <strong>worker</strong>, ili <strong>user</strong>
                </span>
              </div>
              
              {loginError && (
                <p style={{ color: "red", fontSize: "12px", margin: "10px 0" }}>{loginError}</p>
              )}

              <button type="submit" className="login-submit">
                Završi prijavu
              </button>

              <button type="button" onClick={() => { setShowLoginModal(false); setShowForgotModal(true); }} className="forgot-password" style={{ display: "block", margin: "15px auto 0", background: "none", border: "none", color: "#FE7F2D", cursor: "pointer", fontWeight: "bold" }}>
                Zaboravljena lozinka?
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER MODAL */}
      {showRegisterModal && (
        <div className="register-modal show-register">
          <div className="register-box">
            <span className="close-register" onClick={() => setShowRegisterModal(false)}>
              &times;
            </span>
            <h2>Kreirajte Profil</h2>
            <p className="register-subtext">Otključajte direktne rezervacije i istoriju igranja.</p>
            
            <form onSubmit={handleRegisterSubmit}>
              <div className="input-group">
                <label>Korisničko Ime (Username)</label>
                <input type="text" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} placeholder="npr. emir_sarajevo" required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="input-group">
                  <label>Ime</label>
                  <input type="text" value={registerIme} onChange={(e) => setRegisterIme(e.target.value)} placeholder="Unesite ime" required />
                </div>
                <div className="input-group">
                  <label>Prezime</label>
                  <input type="text" value={registerPrezime} onChange={(e) => setRegisterPrezime(e.target.value)} placeholder="Unesite prezime" required />
                </div>
              </div>
              <div className="input-group">
                <label>Email Adresa</label>
                <input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="ime@example.com" required />
              </div>

              {registerError && (
                <p style={{ color: "red", fontSize: "12px", margin: "10px 0" }}>{registerError}</p>
              )}

              <button type="submit" className="register-submit">
                Dovrši Registraciju
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="forgot-modal show-forgot">
          <div className="forgot-box">
            <span className="close-forgot" onClick={() => setShowForgotModal(false)}>
              &times;
            </span>
            <h2>Resetovanje lozinke</h2>
            <p>Unesite e-mail adresu povezanu sa vašim računom.</p>
            
            <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Email adresa" required />
            <button onClick={() => { if (forgotEmail) { setShowCodeModal(true); setShowForgotModal(false); } }}>
              Pošalji kod za resetovanje
            </button>
          </div>
        </div>
      )}

      {/* VERIFICATION CODE MODAL */}
      {showCodeModal && (
        <div className="forgot-modal show-forgot">
          <div className="forgot-box">
            <h2>Verifikacija Kodom</h2>
            <p>Unesite verifikacijski kod koji smo poslali na Vaš email.</p>
            
            <input type="text" value={forgotCode} onChange={(e) => { setForgotCode(e.target.value); setCodeError(""); }} placeholder="Unesite kod" />
            
            {codeError && (
              <p style={{ color: "#d62828", fontSize: "14px", marginBottom: "16px" }}>
                Kod nije ispravan (pokušajte '123456').
              </p>
            )}

            <button onClick={() => {
              if (forgotCode === "123456") {
                alert("Lozinka je uspješno resetovana! Prijavite se sa Vašim nalogom.");
                setShowCodeModal(false);
                setShowLoginModal(true);
              } else {
                setCodeError("Netačan kod.");
              }
            }}>
              Potvrdi kod
            </button>

            <button onClick={() => alert("Kod je ponovo poslan.")} className="resend-btn" style={{ background: "none", border: "none", color: "#FE7F2D", cursor: "pointer", display: "block", marginTop: "15px", width: "100%", fontWeight: "bold" }}>
              Pošalji kod ponovo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
