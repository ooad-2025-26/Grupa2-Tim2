import React, { useState, FormEvent } from "react";
import { Uloga, ApplicationUser } from "../types";
import { ShieldCheck, User, Users, Lock, LogIn, Sparkles, Building2, UserPlus, Mail } from "lucide-react";

interface UserSelectorProps {
  onSelectUser: (user: ApplicationUser) => void;
  onRegisterUser: (data: { userName: string; email: string; ime: string; prezime: string; uloga: Uloga }) => Promise<any>;
  allUsers: ApplicationUser[];
  onClose: () => void;
  currentUser: ApplicationUser | null;
}

export default function UserSelector({
  onSelectUser,
  onRegisterUser,
  allUsers,
  onClose,
  currentUser
}: UserSelectorProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Registration form state
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  const [uloga, setUloga] = useState<Uloga>(Uloga.Korisnik);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  // Manual username search login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess(false);

    if (!userName || !email || !ime || !prezime) {
      setRegError("Sva polja su obavezna.");
      return;
    }

    try {
      const res = await onRegisterUser({
        userName: userName.trim().toLowerCase(),
        email: email.trim(),
        ime: ime.trim(),
        prezime: prezime.trim(),
        uloga
      });
      if (res.error) {
        setRegError(res.error);
      } else {
        setRegSuccess(true);
        // Clear inputs
        setUserName("");
        setEmail("");
        setIme("");
        setPrezime("");
        // Select the newly registered user
        onSelectUser(res);
        onClose();
      }
    } catch (err: any) {
      setRegError(err.message || "Greška pri registraciji.");
    }
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!loginUsername) return;

    const matched = allUsers.find(
      u => u.userName.toLowerCase() === loginUsername.trim().toLowerCase()
    );

    if (matched) {
      onSelectUser(matched);
      onClose();
    } else {
      setLoginError("Korisničko ime nije pronađeno. Isprobajte 'admin', 'worker' ili 'user' ispod.");
    }
  };

  // Helper colors for the pre-seeded account buttons
  const getRoleBadgeColor = (role: Uloga) => {
    switch (role) {
      case Uloga.Administrator: return "bg-red-500/20 text-red-400 border border-red-500/30";
      case Uloga.Zaposlenik: return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      default: return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    }
  };

  return (
    <div id="user-selector-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div id="user-selector-card" className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950">
          <button
            id="tab-sim-login"
            onClick={() => { setActiveTab("login"); setLoginError(""); }}
            className={`flex-1 py-3 text-center text-xs font-bold tracking-wider cursor-pointer uppercase border-b-2 transition-all ${
              activeTab === "login" 
                ? "border-amber-500 text-amber-500 bg-slate-900/40" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Prijava / Simulacija
          </button>
          <button
            id="tab-sim-register"
            onClick={() => { setActiveTab("register"); setRegError(""); }}
            className={`flex-1 py-3 text-center text-xs font-bold tracking-wider cursor-pointer uppercase border-b-2 transition-all ${
              activeTab === "register" 
                ? "border-amber-500 text-amber-500 bg-slate-900/40" 
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Novi Korisnik
          </button>
        </div>

        <div className="p-6">
          {activeTab === "login" ? (
            <div>
              <div className="mb-5 text-center">
                <h3 className="text-sm font-semibold text-slate-200">Simulacija uloga za provjeru</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pošto je ovo studentski projekat, omogućili smo jedan klik za prijavu sa sistemskim ulogama. Kliknite na ulogu kako biste testirali različite poglede.
                </p>
              </div>

              {/* Predefined Quick Session Buttons */}
              <div className="space-y-2 mb-6">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block mb-1">Brzi izbor:</span>
                
                {allUsers.map((u) => (
                  <button
                    id={`quick-login-${u.userName}`}
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      currentUser?.id === u.id 
                        ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                        : "bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="h-7 w-7 rounded bg-slate-700/50 flex items-center justify-center text-slate-300">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{u.ime} {u.prezime}</div>
                        <div className="text-[10px] text-slate-400">username: <span className="font-mono text-amber-400">{u.userName}</span></div>
                      </div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getRoleBadgeColor(u.uloga)}`}>
                      {u.uloga}
                    </span>
                  </button>
                ))}
              </div>

              {/* Manual Login Input Form */}
              <form onSubmit={handleLoginSubmit} className="border-t border-slate-800/60 pt-4">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block mb-2">Ili se prijavite korisničkim imenom:</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LogIn className="h-3.5 w-3.5" />
                  </div>
                  <input
                    id="input-login-username"
                    type="text"
                    required
                    placeholder="Unesite korisničko ime..."
                    value={loginUsername}
                    onChange={(e) => { setLoginUsername(e.target.value); setLoginError(""); }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    id="submit-login-manual"
                    type="submit"
                    className="absolute right-1.5 top-1 bottom-1 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded text-[10px] text-slate-300 cursor-pointer"
                  >
                    Kreni
                  </button>
                </div>
                {loginError && (
                  <p className="text-[10px] text-red-400 mt-2 font-medium">{loginError}</p>
                )}
              </form>
            </div>
          ) : (
            // Register Panel
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Korisničko Ime
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">@</span>
                  <input
                    id="reg-username"
                    type="text"
                    required
                    placeholder="npr. harun99"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    Ime
                  </label>
                  <input
                    id="reg-ime"
                    type="text"
                    required
                    placeholder="Harun"
                    value={ime}
                    onChange={(e) => setIme(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    Prezime
                  </label>
                  <input
                    id="reg-prezime"
                    type="text"
                    required
                    placeholder="Kurtović"
                    value={prezime}
                    onChange={(e) => setPrezime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Email adresa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="ime@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Uloga u sistemu (Testna simulacija)
                </label>
                <select
                  id="reg-uloga"
                  value={uloga}
                  onChange={(e) => setUloga(e.target.value as Uloga)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  <option value={Uloga.Korisnik}>Korisnik (User)</option>
                  <option value={Uloga.Zaposlenik}>Zaposlenik (Worker)</option>
                  <option value={Uloga.Administrator}>Administrator</option>
                </select>
                <p className="text-[9px] text-slate-400 mt-1">
                  Nakon kreiranja profil će biti dodat u bazu, a Vi ćete automatski biti prijavljeni u toj ulozi.
                </p>
              </div>

              {regError && (
                <div className="text-[10px] text-red-400 font-medium bg-red-500/10 border border-red-500/25 p-2 rounded">
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="text-[10px] text-green-400 font-medium bg-green-500/10 border border-green-500/25 p-2 rounded">
                  Uspješna registracija! Prijava u toku...
                </div>
              )}

              <button
                id="btn-submit-registration"
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-md transition-all uppercase tracking-wide mt-2"
              >
                Registruj se i Prijavi
              </button>
            </form>
          )}

          {/* Close Button / Cancel */}
          <div className="mt-5 pt-3 border-t border-slate-800/50 flex justify-end">
            <button
              id="btn-close-selector"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Zatvori prozor
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
