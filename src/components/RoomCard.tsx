import React from "react";
import { EscapeRoom, Tezina } from "../types";
import { Users, Coins, Flame, Star } from "lucide-react";

interface RoomCardProps {
  key?: React.Key;
  room: EscapeRoom;
  averageRating: number;
  reviewCount: number;
  onSelect: (room: EscapeRoom) => void;
}

export default function RoomCard({
  room,
  averageRating,
  reviewCount,
  onSelect
}: RoomCardProps) {
  
  // Custom difficulty style generator
  const getTezinaBadge = (tezina: Tezina) => {
    switch (tezina) {
      case Tezina.Lako:
        return {
          label: "Lako",
          color: "bg-green-500/15 text-green-400 border-green-500/30",
          dots: "●○○"
        };
      case Tezina.Srednje:
        return {
          label: "Srednje",
          color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          dots: "●●○"
        };
      case Tezina.Tesko:
        return {
          label: "Teško",
          color: "bg-red-500/15 text-red-500 border-red-500/30",
          dots: "●●●"
        };
    }
  };

  const badge = getTezinaBadge(room.tezina);

  // Choose a nice gradient background representing room themes
  const getThemeGradient = (roomId: number) => {
    switch (roomId % 4) {
      case 1: // Alkatraz
        return "from-slate-800 to-indigo-950";
      case 2: // Faraon
        return "from-amber-950/40 to-yellow-950/20";
      case 3: // Sherlock
        return "from-teal-950/40 to-slate-900";
      case 4: // Horror
      default:
        return "from-rose-950/40 to-zinc-950";
    }
  };

  return (
    <div 
      id={`room-card-${room.roomID}`}
      className={`relative group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-amber-500/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col`}
    >
      {/* Visual Thumbnail Frame */}
      <div className={`h-40 bg-gradient-to-br ${getThemeGradient(room.roomID)} relative p-4 flex flex-col justify-between border-b border-slate-800/80`}>
        {/* Row 1: Badges */}
        <div className="flex justify-between items-start">
          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${badge.color}`}>
            {badge.label} <span className="ml-1 font-mono tracking-tight">{badge.dots}</span>
          </span>
          <span className="bg-slate-950/70 backdrop-blur-md text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 flex items-center space-x-0.5">
            <Coins className="h-3 w-3 mr-0.5" />
            <span>{room.cijena} KM</span>
          </span>
        </div>

        {/* Big ambient room indicator */}
        <div className="absolute right-3 bottom-1 text-slate-700/10 group-hover:text-amber-500/5 text-7xl font-black font-mono select-none transition-colors">
          0{room.roomID}
        </div>

        {/* Row 2: Stars and capacity */}
        <div className="flex justify-between items-end z-10">
          <div className="flex items-center space-x-1 bg-slate-950/65 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-zinc-100">
            <Users className="h-3 w-3 text-amber-500 mr-0.5" />
            <span>Do {room.kapacitet} igrača</span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950/65 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px]">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span className="font-bold text-slate-100">{averageRating > 0 ? averageRating.toFixed(1) : "Nema"}</span>
            {reviewCount > 0 && <span className="text-slate-400">({reviewCount})</span>}
          </div>
        </div>
      </div>

      {/* Details Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition-colors">
            {room.naziv}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
            {room.opis}
          </p>
        </div>

        <button
          id={`btn-select-room-${room.roomID}`}
          onClick={() => onSelect(room)}
          className="w-full py-1.5 bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 border border-slate-700 group-hover:border-transparent text-xs font-semibold rounded-lg text-slate-200 transition-all duration-300 cursor-pointer flex items-center justify-center space-x-1"
        >
          <span>Prikaz detalja i Rezervacija</span>
        </button>
      </div>
    </div>
  );
}
