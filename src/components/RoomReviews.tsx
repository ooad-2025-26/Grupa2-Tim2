import React, { useState, FormEvent } from "react";
import { Recenzija, ApplicationUser } from "../types";
import { Star, MessageSquareCode, Send, Calendar } from "lucide-react";

interface RoomReviewsProps {
  roomID: number;
  reviews: Recenzija[];
  currentUser: ApplicationUser | null;
  onAddReview: (data: { roomID: number; ocjena: number; komentar: string }) => Promise<any>;
}

export default function RoomReviews({
  roomID,
  reviews,
  currentUser,
  onAddReview
}: RoomReviewsProps) {
  const [ocjena, setOcjena] = useState(5);
  const [komentar, setKomentar] = useState("");
  const [hoverOcjena, setHoverOcjena] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filteredReviews = reviews.filter(r => r.roomID === roomID);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError("");
    setSubmitting(true);

    try {
      await onAddReview({
        roomID,
        ocjena,
        komentar: komentar.trim()
      });
      setKomentar("");
      setOcjena(5);
    } catch (err: any) {
      setError(err.message || "Greška pri objavi recenzije.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm mt-6">
      <div className="flex items-center space-x-1.5 mb-5 border-b border-slate-800 pb-3">
        <MessageSquareCode className="h-4 w-4 text-amber-500" />
        <h3 className="font-bold text-sm text-slate-100">
          Recenzije posjetitelja ({filteredReviews.length})
        </h3>
      </div>

      {/* Review List */}
      <div className="space-y-4 max-h-72 overflow-y-auto mb-6 pr-1 custom-scrollbar">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 font-medium">
            Još nema recenzija za ovu sobu. Budite prvi koji će podijeliti svoje iskustvo!
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div 
              key={rev.recenzijaID} 
              className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/80 hover:border-slate-800 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-bold text-slate-100 block leading-tight">
                    {rev.korisnik ? `${rev.korisnik.ime} ${rev.korisnik.prezime}` : "Gost Korisnik"}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center space-x-0.5 mt-0.5">
                    <Calendar className="h-3 w-3 mr-0.5" />
                    <span>{rev.datum}</span>
                  </span>
                </div>

                {/* Stars container */}
                <div className="flex items-center space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < rev.ocjena 
                          ? "text-amber-500 fill-amber-500" 
                          : "text-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed italic pr-2">
                &ldquo;{rev.komentar}&rdquo;
              </p>
            </div>
          ))
        )}
      </div>

      {/* Leave a review section */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="border-t border-slate-800/80 pt-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
            Napišite svoju recenziju
          </h4>

          {/* Interactive Rating Builder */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Vaša Ocjena
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  id={`btn-star-rating-${star}`}
                  key={star}
                  type="button"
                  onClick={() => setOcjena(star)}
                  onMouseEnter={() => setHoverOcjena(star)}
                  onMouseLeave={() => setHoverOcjena(null)}
                  className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      star <= (hoverOcjena !== null ? hoverOcjena : ocjena)
                        ? "text-amber-500 fill-amber-500"
                        : "text-slate-700"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs text-slate-400 font-bold ml-2">
                ({hoverOcjena !== null ? hoverOcjena : ocjena}/5 Zvjezdica)
              </span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Vaš komentar i utisci
            </label>
            <textarea
              id="txt-review-comment"
              required
              rows={3}
              placeholder="Opišite atmosferu, težinu zagonetki i rad osoblja..."
              value={komentar}
              onChange={(e) => setKomentar(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-[10px] text-red-400 font-medium">{error}</p>
          )}

          <div className="flex justify-end">
            <button
              id="btn-submit-review"
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-1 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold font-sans cursor-pointer transition-colors shadow-md"
            >
              <Send className="h-3 w-3" />
              <span>{submitting ? "Slanje..." : "Objavi recenziju"}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-950/40 border border-slate-800/85 rounded-lg p-3.5 text-center text-xs text-slate-400">
          Morate se <span className="text-amber-500 font-bold font-mono">prijaviti</span> na vrhu stranice kako biste napisali recenziju.
        </div>
      )}
    </div>
  );
}
