import React, { useState, FormEvent } from "react";
import { Obavijest, TipObavijesti, ApplicationUser, Uloga } from "../types";
import { Bell, Key, Plus, Trash2, Calendar, Sparkles, AlertCircle } from "lucide-react";

interface ObavijestiListProps {
  obavijesti: Obavijest[];
  currentUser: ApplicationUser | null;
  onAddObavijest: (data: { naslov: string; sadrzaj: string; tipObavijesti: TipObavijesti }) => Promise<any>;
  onDeleteObavijest: (id: number) => Promise<any>;
}

export default function ObavijestiList({
  obavijesti,
  currentUser,
  onAddObavijest,
  onDeleteObavijest
}: ObavijestiListProps) {
  const [showForm, setShowForm] = useState(false);
  const [naslov, setNaslov] = useState("");
  const [sadrzaj, setSadrzaj] = useState("");
  const [tip, setTip] = useState<TipObavijesti>(TipObavijesti.Info);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!naslov || !sadrzaj) return;
    setError("");

    try {
      const res = await onAddObavijest({ naslov, sadrzaj, tipObavijesti: tip });
      if (res.error) {
        setError(res.error);
      } else {
        setNaslov("");
        setSadrzaj("");
        setTip(TipObavijesti.Info);
        setShowForm(false);
      }
    } catch (err: any) {
      setError(err.message || "Došlo je do greške.");
    }
  };

  const getTipBadgeStyle = (tipo: TipObavijesti) => {
    switch (tipo) {
      case TipObavijesti.Promocija:
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case TipObavijesti.Upozorenje:
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case TipObavijesti.Info:
      default:
        return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
    }
  };

  const isAdmin = currentUser?.uloga === Uloga.Administrator;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-5">
      <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
        <div className="flex items-center space-x-1.5">
          <Bell className="h-4 w-4 text-amber-500" />
          <h3 className="font-bold text-sm text-slate-100">
            Aktuelne Novosti & Obavijesti ({obavijesti.length})
          </h3>
        </div>

        {isAdmin && !showForm && (
          <button
            id="btn-show-news-form"
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-1 px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-bold cursor-pointer transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Napiši vijest</span>
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 bg-slate-950 p-4 border border-slate-800 rounded-lg space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wide text-amber-500">Kreiranje nove objave</h4>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <input
                id="news-naslov"
                type="text"
                required
                placeholder="Naslov vijesti..."
                value={naslov}
                onChange={(e) => setNaslov(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <select
                id="news-tip"
                value={tip}
                onChange={(e) => setTip(e.target.value as TipObavijesti)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value={TipObavijesti.Info}>Info</option>
                <option value={TipObavijesti.Promocija}>Promocija</option>
                <option value={TipObavijesti.Upozorenje}>Upozorenje</option>
              </select>
            </div>
          </div>

          <div>
            <textarea
              id="news-sadrzaj"
              required
              rows={3}
              placeholder="Sadržaj i detalji obavijesti..."
              value={sadrzaj}
              onChange={(e) => setSadrzaj(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none/y"
            />
          </div>

          {error && <p className="text-[10px] text-red-400">{error}</p>}

          <div className="flex justify-end space-x-2 pt-1 border-t border-slate-850/60">
            <button
              id="btn-cancel-news"
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1 bg-transparent hover:bg-slate-905 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded font-medium cursor-pointer"
            >
              Otkaži
            </button>
            <button
              id="btn-submit-news"
              type="submit"
              className="px-4 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded cursor-pointer"
            >
              Objavi
            </button>
          </div>
        </form>
      )}

      {/* Announcements Scroller */}
      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
        {obavijesti.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Trenutno nema objavljenih obavijesti.
          </div>
        ) : (
          obavijesti.map((o) => (
            <div 
              id={`news-row-${o.obavijestID}`}
              key={o.obavijestID} 
              className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800 hover:border-slate-800/80 transition-colors"
            >
              <div className="flex justify-between items-start gap-1 pb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${getTipBadgeStyle(o.tipObavijesti)}`}>
                    {o.tipObavijesti}
                  </span>
                  <h4 className="font-bold text-xs text-slate-100 leading-tight">
                    {o.naslov}
                  </h4>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[9px] text-slate-500 flex items-center space-x-1 font-semibold">
                    <Calendar className="h-3 w-3 mr-0.5" />
                    <span>{o.datum}</span>
                  </span>

                  {isAdmin && (
                    <button
                      id={`btn-delete-news-${o.obavijestID}`}
                      onClick={() => {
                        if (confirm("Jeste li sigurni da želite obrisati ovu obavijest?")) {
                          onDeleteObavijest(o.obavijestID);
                        }
                      }}
                      className="p-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 hover:text-red-400 rounded text-slate-500 transition-colors cursor-pointer"
                      title="Izbriši obavijest"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pr-1 font-serif whitespace-pre-wrap">
                {o.sadrzaj}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
