import React, { useState, useEffect, FormEvent } from "react";
import { EscapeRoom, Termin, ApplicationUser } from "../types";
import { Calendar, Clock, Users, ShieldAlert, Sparkles, AlertCircle, ShoppingBag } from "lucide-react";

interface BookingModalProps {
  room: EscapeRoom;
  currentUser: ApplicationUser | null;
  onBook: (data: { terminID: number; brojOsoba: number }) => Promise<any>;
  onClose: () => void;
  onOpenUserModal: () => void;
}

export default function BookingModal({
  room,
  currentUser,
  onBook,
  onClose,
  onOpenUserModal
}: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [termini, setTermini] = useState<Termin[]>([]);
  const [selectedTerminID, setSelectedTerminID] = useState<number | null>(null);
  const [brojOsoba, setBrojOsoba] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Available dates for booking: today and the next 7 days
  const [availableDates, setAvailableDates] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const dates = [];
    const days = ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"];
    
    for (let i = 0; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      
      let dayLabel = days[d.getDay()];
      if (i === 0) dayLabel = "Danas";
      else if (i === 1) dayLabel = "Sutra";

      const formattedLabel = `${dayLabel} (${d.getDate()}.${d.getMonth() + 1}.)`;
      dates.push({ label: formattedLabel, value: dateStr });
    }
    
    setAvailableDates(dates);
    setSelectedDate(dates[0].value);
  }, []);

  // Fetch / Get terms for the selected date and room
  useEffect(() => {
    if (!selectedDate) return;
    
    setLoading(true);
    setSelectedTerminID(null);
    setError("");

    fetch(`/api/termini?roomID=${room.roomID}&datum=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        setTermini(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Greška pri dohvaćanju slobodnih termina.");
        setLoading(false);
      });
  }, [selectedDate, room.roomID]);

  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Morate biti prijavljeni da biste izvršili rezervaciju.");
      return;
    }
    if (!selectedTerminID) {
      setError("Molimo vas da odaberete termin.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await onBook({
        terminID: selectedTerminID,
        brojOsoba
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Došlo je do greške pri rezervaciji.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="booking-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div id="booking-modal-card" className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl my-8">
        
        {/* Banner header styled after selected room */}
        <div className="bg-slate-950 px-6 py-5 border-b border-slate-800/80 relative">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-amber-500 tracking-widest block mb-0.5">Rezervacijski Čarobnjak</span>
              <h3 className="text-base font-bold text-slate-100">{room.naziv}</h3>
            </div>
            
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="h-6 w-6 rounded bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-12 w-12 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm">Rezervacija uspješno evidentirana!</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed px-4">
                  Vaš upit za termin je poslan. Rezervacija je trenutno u statusu <span className="text-amber-500 font-bold font-mono">Na čekanju</span>. Osoblje će je odobriti u najkraćem roku. Detalje možete pratiti na tabu &ldquo;Moje Rezervacije&rdquo;.
                </p>
              </div>
              <button
                id="btn-success-ok"
                onClick={onClose}
                className="px-6 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-md shadow-amber-500/10"
              >
                U redu, zatvori
              </button>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              
              {/* Step 1: Select Date */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center">
                  <Calendar className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                  <span>KORAK 1: Odaberite Datum posjete</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableDates.map((item) => (
                    <button
                      id={`date-selector-${item.value}`}
                      key={item.value}
                      type="button"
                      onClick={() => setSelectedDate(item.value)}
                      className={`py-2 px-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
                        selectedDate === item.value
                          ? "bg-amber-500 border-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950/80"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Time Slots display */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center">
                  <Clock className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                  <span>KORAK 2: Odaberite slobodan sat</span>
                </label>
                
                {loading ? (
                  <div className="text-center py-6 text-xs text-slate-500 font-medium">
                    Učitavanje dostupnih satnica...
                  </div>
                ) : (
                  <div>
                    {termini.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400 bg-slate-950/40 border border-slate-800 rounded-lg">
                        Nema konfigurisanih termina za odabrani datum.
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {termini.map((t) => (
                          <button
                            id={`termin-slot-${t.terminID}`}
                            key={t.terminID}
                            type="button"
                            disabled={!t.dostupnost}
                            onClick={() => {
                              setSelectedTerminID(t.terminID);
                              setError("");
                            }}
                            className={`py-2 px-1.5 rounded text-xs font-bold font-mono border transition-all text-center ${
                              !t.dostupnost
                                ? "bg-slate-950 border-slate-800 text-slate-600 line-through cursor-not-allowed"
                                : selectedTerminID === t.terminID
                                ? "bg-amber-500 border-amber-500 text-slate-950 shadow-md"
                                : "bg-slate-850 border-slate-800 text-slate-200 hover:border-amber-500/40 cursor-pointer"
                            }`}
                          >
                            {t.vrijeme}
                            <span className="block text-[8px] font-sans font-normal mt-0.5 opacity-80 leading-3">
                              {t.dostupnost ? "Slobodno" : "Zauzeto"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Players and pricing details */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center">
                    <Users className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                    <span>Broj igrača</span>
                  </label>
                  <select
                    id="select-num-players"
                    value={brojOsoba}
                    onChange={(e) => setBrojOsoba(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {[...Array(Math.min(room.kapacitet, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i + 1 === 1 ? "Osoba" : i + 1 < 5 ? "Osobe" : "Osoba"}
                      </option>
                    ))}
                  </select>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    Kapacitet sobe: maks. {room.kapacitet} igrača.
                  </span>
                </div>

                <div className="bg-slate-950/60 rounded border border-slate-800/80 p-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Cijena po igri:</span>
                    <span className="text-sm font-extrabold text-amber-400">{room.cijena} KM</span>
                  </div>
                  <div className="text-[9px] text-slate-400 leading-normal mt-1 border-t border-slate-800 pb-0 pt-1">
                    Cjelokupni iznos se plaća na lokaciji prije ulaska u sobu. Potvrđivanje je obavezno.
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-[10px] text-red-400 bg-red-950/20 border border-red-950/50 p-2 rounded flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Booking CTAs */}
              <div className="border-t border-slate-800 pt-5 flex justify-between items-center">
                {!currentUser ? (
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 leading-tight">Morate biti prijavljeni na sistem.</p>
                    <button
                      id="btn-modal-login-trigger"
                      type="button"
                      onClick={onOpenUserModal}
                      className="text-[10px] font-bold text-amber-500 underline hover:text-amber-400 cursor-pointer text-left leading-3"
                    >
                      Kliknite ovdje da se prijavite
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 leading-tight">
                    <span>Rezerviše:</span>
                    <span className="font-bold text-amber-500 uppercase">{currentUser.userName}</span>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    id="btn-cancel-booking-flow"
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 bg-transparent hover:bg-slate-850 text-slate-350 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Odustani
                  </button>
                  
                  <button
                    id="btn-confirm-booking-flow"
                    type="submit"
                    disabled={loading || !currentUser || !selectedTerminID}
                    className="px-5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow-md transition-all shadow-amber-500/10 flex items-center space-x-1"
                  >
                    <span>{loading ? "Potvrđivanje..." : "Potvrdi Rezervaciju"}</span>
                  </button>
                </div>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
