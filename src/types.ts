export enum Tezina {
  Lako = "Lako",
  Srednje = "Srednje",
  Tesko = "Tesko"
}

export enum Uloga {
  Korisnik = "Korisnik",
  Administrator = "Administrator",
  Zaposlenik = "Zaposlenik"
}

export enum TipObavijesti {
  Info = "Info",
  Upozorenje = "Upozorenje",
  Promocija = "Promocija"
}

export interface ApplicationUser {
  id: string;
  userName: string;
  email: string;
  ime: string;
  prezime: string;
  uloga: Uloga;
}

export interface EscapeRoom {
  roomID: number;
  naziv: string;
  opis: string;
  tezina: Tezina;
  kapacitet: number;
  cijena: number;
}

export interface Termin {
  terminID: number;
  datum: string; // YYYY-MM-DD
  vrijeme: string; // e.g., "18:00"
  dostupnost: boolean;
  roomID: number;
  escapeRoom?: EscapeRoom;
}

export interface Rezervacija {
  rezervacijaID: number;
  datumKreiranja: string;
  status: 'Na čekanju' | 'Odobreno' | 'Otkazano' | string; // Boolean in C# but we make it descriptive string: "Aktivan"/"Odobren"/"Otkazan" since C# Status can represent active/completed
  brojOsoba: number;
  korisnikID: string;
  korisnik?: ApplicationUser;
  terminID: number;
  termin?: Termin;
}

export interface Recenzija {
  recenzijaID: number;
  ocjena: number; // 1-5
  komentar: string;
  datum: string;
  korisnikID: string;
  korisnik?: ApplicationUser;
  roomID: number;
  escapeRoom?: EscapeRoom;
}

export interface Podrska {
  porukaID: number;
  email: string;
  datum: string;
  sadrzaj: string;
  naslovPoruke: string;
  korisnikID?: string;
  korisnik?: ApplicationUser;
}

export interface Obavijest {
  obavijestID: number;
  naslov: string;
  sadrzaj: string;
  datum: string;
  tipObavijesti: TipObavijesti;
}
