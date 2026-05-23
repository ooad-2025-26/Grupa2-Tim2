import React, { useState, useEffect, FormEvent } from "react";
import { EscapeRoom, Tezina, Termin, Podrska } from "../types";
import { KeyRound, Plus, Trash2, Edit3, Save, Calendar, Clock, Contact, Mail, AlertTriangle, Users2, Check } from "lucide-react";

interface ManageRoomsProps {
  escapeRooms: EscapeRoom[];
  onAddRoom: (data: any) => Promise<any>;
  onEditRoom: (id: number, data: any) => Promise<any>;
  onDeleteRoom: (id: number) => Promise<any>;
  supportTickets: Podrska[];
}

export default function ManageRooms({
  escapeRooms,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  supportTickets
}: ManageRoomsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"rooms" | "termini" | "support">("rooms");

  // Room states
  const [editingRoomID, setEditingRoomID] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [naziv, setNaziv] = useState("");
  const [opis, setOpis] = useState("");
  const [tezina, setTezina] = useState<Tezina>(Tezina.Srednje);
  const [kapacitet, setKapacitet] = useState(6);
  const [cijena, setCijena] = useState(80);
  const [error, setError] = useState("");

  // Edit form states
  const [editNaziv, setEditNaziv] = useState("");
  const [editOpis, setEditOpis] = useState("");
  const [editTezina, setEditTezina] = useState<Tezina>(Tezina.Srednje);
  const [editKapacitet, setEditKapacitet] = useState(6);
  const [editCijena, setEditCijena] = useState(80);

  // Termin generator states
  const [selectedRoomID, setSelectedRoomID] = useState<number>(escapeRooms[0]?.roomID || 1);
  const [terminDate, setTerminDate] = useState("");
  const [terminTime, setTerminTime] = useState("18:00");
  const [generatedTermini, setGeneratedTermini] = useState<Termin[]>([]);
  const [terminError, setTerminError] = useState("");
  const [terminSuccess, setTerminSuccess] = useState("");

  useEffect(() => {
    if (escapeRooms.length > 0 && !selectedRoomID) {
      setSelectedRoomID(escapeRooms[0].roomID);
    }
    setTerminDate(new Date().toISOString().split("T")[0]);
  }, [escapeRooms]);

  // Load all terms to manage
  const loadActiveTermini = () => {
    fetch(`/api/termini`)
      .then((res) => res.json())
      .then((data) => setGeneratedTermini(data))
      .catch((err) => console.error("Greška pri učitavanju termina:", err));
  };

  useEffect(() => {
    if (activeSubTab === "termini") {
      loadActiveTermini();
    }
  }, [activeSubTab]);

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!naziv || !opis) {
      setError("Naziv i opis su obavezni.");
      return;
    }

    try {
      const res = await onAddRoom({ naziv, opis, tezina, kapacitet, cijena });
      if (res.error) {
        setError(res.error);
      } else {
        setNaziv("");
        setOpis("");
        setTezina(Tezina.Srednje);
        setKapacitet(6);
        setCijena(80);
        setShowAddForm(false);
      }
    } catch (err: any) {
      setError(err.message || "Došlo je do greške.");
    }
  };

  const handleStartEdit = (room: EscapeRoom) => {
    setEditingRoomID(room.roomID);
    setEditNaziv(room.naziv);
    setEditOpis(room.opis);
    setEditTezina(room.tezina);
    setEditKapacitet(room.kapacitet);
    setEditCijena(room.cijena);
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const res = await onEditRoom(id, {
        naziv: editNaziv,
        opis: editOpis,
        tezina: editTezina,
        kapacitet: editKapacitet,
        cijena: editCijena
      });
      if (res.error) {
        alert(res.error);
      } else {
        setEditingRoomID(null);
      }
    } catch (err: any) {
      alert(err.message || "Došlo je do greške pri uređivanju.");
    }
  };

  const handleCreateTermin = async (e: FormEvent) => {
    e.preventDefault();
    setTerminError("");
    setTerminSuccess("");

    if (!selectedRoomID || !terminDate || !terminTime) {
      setTerminError("Sva polja su obavezna.");
      return;
    }

    try {
      const res = await fetch("/api/termini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomID: selectedRoomID,
          datum: terminDate,
          vrijeme: terminTime
        })
      });

      const data = await res.json();
      if (data.error) {
        setTerminError(data.error);
      } else {
        setTerminSuccess(`Uspješno kreiran termin u ${terminTime} za sobu.`);
        loadActiveTermini();
      }
    } catch (err: any) {
      setTerminError(err.message || "Došlo je do greške pri spašavanju termina.");
    }
  };

  const handleToggleAvailability = async (id: number) => {
    try {
      await fetch(`/api/termini/${id}/toggle`, { method: "PUT" });
      loadActiveTermini();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTermin = async (id: number) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovaj termin?")) return;
    try {
      await fetch(`/api/termini/${id}`, { method: "DELETE" });
      loadActiveTermini();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-6">
      
      {/* Sub menu tabs */}
      <div className="flex border-b border-slate-800 pb-3 mb-6 space-x-1 sm:space-x-2 overflow-x-auto">
        <button
          id="btn-admin-sub-rooms"
          onClick={() => setActiveSubTab("rooms")}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "rooms"
              ? "bg-amber-500 text-slate-950 shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Konfiguracija Soba ({escapeRooms.length})
        </button>
        <button
          id="btn-admin-sub-termini"
          onClick={() => setActiveSubTab("termini")}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "termini"
              ? "bg-amber-500 text-slate-950 shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Generator Termina
        </button>
        <button
          id="btn-admin-sub-support"
          onClick={() => setActiveSubTab("support")}
          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "support"
              ? "bg-amber-500 text-slate-950 shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Upiti Korisnika ({supportTickets.length})
        </button>
      </div>

      {/* RENDER TAB 1: ESCAPE ROOMS CRUD */}
      {activeSubTab === "rooms" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Pregled i dodavanje escape room soba</h3>
              <p className="text-[10px] text-slate-400">Kreirajte, uredite ili obrišite sobe. Promjene se spremaju direktno.</p>
            </div>
            
            {!showAddForm && (
              <button
                id="btn-show-add-room-form"
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md text-xs cursor-pointer shadow transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Dodaj novu sobu</span>
              </button>
            )}
          </div>

          {/* Add Room Inline Form */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="bg-slate-950 border border-slate-800/80 p-5 rounded-lg space-y-4">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide">Dodavanje nove sobe</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Naziv sobe</label>
                  <input
                    id="add-room-naziv"
                    type="text"
                    required
                    placeholder="npr. Misterija Titanika"
                    value={naziv}
                    onChange={(e) => setNaziv(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Težina</label>
                  <select
                    id="add-room-tezina"
                    value={tezina}
                    onChange={(e) => setTezina(e.target.value as Tezina)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value={Tezina.Lako}>Lako</option>
                    <option value={Tezina.Srednje}>Srednje</option>
                    <option value={Tezina.Tesko}>Teško</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Kratki opis (do 300 karaktera)</label>
                <textarea
                  id="add-room-opis"
                  required
                  rows={2}
                  maxLength={300}
                  placeholder="Zabavan avanturistički rezime sobe za posjetitelje..."
                  value={opis}
                  onChange={(e) => setOpis(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Kapacitet igrača</label>
                  <input
                    id="add-room-kapacitet"
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={kapacitet}
                    onChange={(e) => setKapacitet(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Cijena (u KM)</label>
                  <input
                    id="add-room-cijena"
                    type="number"
                    min={0}
                    step={5}
                    required
                    value={cijena}
                    onChange={(e) => setCijena(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {error && <p className="text-[10px] text-red-400 font-medium">{error}</p>}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800/40">
                <button
                  id="btn-cancel-add-room"
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-1.5 bg-transparent hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs rounded font-medium cursor-pointer"
                >
                  Otkaži
                </button>
                <button
                  id="btn-submit-add-room"
                  type="submit"
                  className="px-5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded cursor-pointer"
                >
                  Spremi Sobu
                </button>
              </div>
            </form>
          )}

          {/* Sobe Grid / List */}
          <div className="space-y-3">
            {escapeRooms.map((room) => {
              const isEditing = editingRoomID === room.roomID;
              return (
                <div 
                  id={`admin-room-row-${room.roomID}`}
                  key={room.roomID} 
                  className={`p-4 bg-slate-950/40 border rounded-lg transition-colors ${
                    isEditing ? "border-amber-500/50 bg-slate-950" : "border-slate-800/80 hover:border-slate-850"
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input
                          id={`edit-room-name-${room.roomID}`}
                          type="text"
                          value={editNaziv}
                          onChange={(e) => setEditNaziv(e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-slate-100 rounded px-2 py-1 text-xs"
                        />
                        <select
                          id={`edit-room-difficulty-${room.roomID}`}
                          value={editTezina}
                          onChange={(e) => setEditTezina(e.target.value as Tezina)}
                          className="bg-slate-900 border border-slate-800 text-slate-100 rounded px-2 py-1 text-xs"
                        >
                          <option value={Tezina.Lako}>Lako</option>
                          <option value={Tezina.Srednje}>Srednje</option>
                          <option value={Tezina.Tesko}>Teško</option>
                        </select>
                      </div>

                      <textarea
                        id={`edit-room-desc-${room.roomID}`}
                        rows={2}
                        value={editOpis}
                        onChange={(e) => setEditOpis(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded p-2 text-xs"
                      />

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input
                          id={`edit-room-cap-${room.roomID}`}
                          type="number"
                          placeholder="Maksimalni igrači"
                          value={editKapacitet}
                          onChange={(e) => setEditKapacitet(parseInt(e.target.value))}
                          className="bg-slate-900 border border-slate-800 text-slate-100 rounded px-2 py-1 text-xs"
                        />
                        <input
                          id={`edit-room-price-${room.roomID}`}
                          type="number"
                          placeholder="Početna cijena u KM"
                          value={editCijena}
                          onChange={(e) => setEditCijena(parseInt(e.target.value))}
                          className="bg-slate-900 border border-slate-800 text-slate-100 rounded px-2 py-1 text-xs"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          id={`btn-cancel-room-edit-${room.roomID}`}
                          onClick={() => setEditingRoomID(null)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-700 text-xs rounded cursor-pointer"
                        >
                          Otkaži
                        </button>
                        <button
                          id={`btn-save-room-edit-${room.roomID}`}
                          onClick={() => handleSaveEdit(room.roomID)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded cursor-pointer flex items-center space-x-0.5"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>Spremi</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-xs text-slate-100">{room.naziv}</h4>
                          <span className="text-[8px] font-mono font-bold uppercase py-0.5 px-1.5 bg-slate-800 text-slate-400 rounded">
                            {room.tezina} ID: {room.roomID}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{room.opis}</p>
                        <div className="flex items-center space-x-4 mt-2 text-[10px] text-slate-500 font-medium">
                          <span>Max kapacitet: <strong className="text-slate-300">{room.kapacitet}</strong></span>
                          <span>|</span>
                          <span>Cijena po igri: <strong className="text-amber-500">{room.cijena} KM</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        <button
                          id={`btn-start-edit-${room.roomID}`}
                          onClick={() => handleStartEdit(room)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 rounded transition-colors cursor-pointer"
                          title="Uredi sobu"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`btn-delete-room-${room.roomID}`}
                          onClick={() => {
                            if (confirm(`Jeste li sigurni da želite obrisati sobu "${room.naziv}"? Svi njeni termini i rezervacije će nestati!`)) {
                              onDeleteRoom(room.roomID);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 rounded transition-colors cursor-pointer"
                          title="Izbriši sobu"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* RENDER TAB 2: TERMIN BUILDER */}
      {activeSubTab === "termini" && (
        <div className="space-y-6">
          <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/60">
            <h3 className="text-sm font-bold text-slate-250 mb-2">Kreirajte pojedinačne termine</h3>
            <p className="text-[10px] text-slate-400 leading-normal">
              Odaberite sobu, datum posjete i vrijeme. Termin će automatski biti ponuđen klijentima prilikom rezervisanja.
            </p>

            <form onSubmit={handleCreateTermin} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Escape room soba</label>
                <select
                  id="termin-room-select"
                  value={selectedRoomID}
                  onChange={(e) => setSelectedRoomID(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 text-xs cursor-pointer focus:outline-none"
                >
                  {escapeRooms.map(r => (
                    <option key={r.roomID} value={r.roomID}>{r.naziv}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Datum</label>
                <input
                  id="termin-date-input"
                  type="date"
                  required
                  value={terminDate}
                  onChange={(e) => setTerminDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Vrijeme (HH:MM)</label>
                <input
                  id="termin-time-input"
                  type="text"
                  required
                  placeholder="npr. 18:30"
                  value={terminTime}
                  onChange={(e) => setTerminTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  id="btn-save-custom-termin"
                  type="submit"
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs cursor-pointer shadow transition-colors"
                >
                  Spasi Termin
                </button>
              </div>
            </form>

            {terminError && <p className="text-[10px] text-red-400 font-medium mt-2">{terminError}</p>}
            {terminSuccess && <p className="text-[10px] text-green-400 font-medium mt-2">{terminSuccess}</p>}
          </div>

          {/* List of active generated hours */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-3">Postojeća satnica u sistemu</h4>
            
            <div className="bg-slate-950/60 rounded-lg border border-slate-800 divide-y divide-slate-800/60 max-h-96 overflow-y-auto custom-scrollbar">
              {generatedTermini.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Učitavanje ili nema kreiranih termina...
                </div>
              ) : (
                generatedTermini.map((t) => (
                  <div key={t.terminID} className="p-3 flex items-center justify-between text-xs hover:bg-slate-950/20 transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-amber-500 font-mono font-bold">
                        {t.vrijeme}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200 block text-xs">{t.escapeRoom?.naziv}</span>
                        <span className="text-[9px] text-slate-500">{t.datum}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        id={`btn-toggle-termin-${t.terminID}`}
                        onClick={() => handleToggleAvailability(t.terminID)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all border ${
                          t.dostupnost
                            ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                        }`}
                        title="Kliknite za izmjenu dostupnosti ručno"
                      >
                        {t.dostupnost ? "DOSTUPNO" : "REZERVISANO"}
                      </button>

                      <button
                        id={`btn-delete-termin-${t.terminID}`}
                        onClick={() => handleDeleteTermin(t.terminID)}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded cursor-pointer transition-colors"
                        title="Ukloni termin"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 3: CONTACT SUPPORT VIEWER */}
      {activeSubTab === "support" && (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-250">Upiti posjetitelja i tehnička podrška</h3>
            <p className="text-[10px] text-slate-400">Poruke pristižu direktno sa kontakt formi. Odgovorite im putem navedenog emaila.</p>
          </div>

          <div className="space-y-3">
            {supportTickets.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/40 p-4 rounded border border-slate-850">
                Trenutno nema otvorenih upita u helpdesku.
              </div>
            ) : (
              supportTickets.map((t) => (
                <div 
                  id={`support-ticket-row-${t.porukaID}`}
                  key={t.porukaID} 
                  className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 hover:border-slate-800 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">{t.naslovPoruke}</h4>
                      <a 
                        href={`mailto:${t.email}`}
                        className="text-[10px] text-amber-500 hover:underline flex items-center space-x-1 mt-0.5"
                      >
                        <Mail className="h-3 w-3 mr-0.5" />
                        <span>{t.email}</span>
                      </a>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(t.datum).toLocaleDateString("bs-BA")} {new Date(t.datum).toLocaleTimeString("bs-BA", {hour: "2-digit", minute: "2-digit"})}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed italic bg-slate-900/50 p-2.5 rounded border border-slate-850/60">
                    &ldquo;{t.sadrzaj}&rdquo;
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
