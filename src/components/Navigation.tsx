import { Uloga, ApplicationUser } from "../types";
import { KeyRound, ShieldAlert, LogIn, Sparkles, User, LogOut, Bell, HelpCircle, Calendar, Home, DoorOpen } from "lucide-react";

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: ApplicationUser | null;
  onLogout: () => void;
  onOpenUserModal: () => void;
}

export default function Navigation({
  currentTab,
  setCurrentTab,
  currentUser,
  onLogout,
  onOpenUserModal
}: NavigationProps) {
  
  const navItems = [
    { id: "home", label: "Naslovnica", icon: Home },
    { id: "rooms", label: "Sobe", icon: DoorOpen },
  ];

  if (currentUser) {
    navItems.push({ id: "my-bookings", label: "Moje Rezervacije", icon: Calendar });
    navItems.push({ id: "support", label: "Podrška", icon: HelpCircle });
    
    if (currentUser.uloga === Uloga.Administrator) {
      navItems.push({ id: "admin", label: "Admin Panel", icon: KeyRound });
    } else if (currentUser.uloga === Uloga.Zaposlenik) {
      navItems.push({ id: "worker", label: "Radni Panel", icon: ShieldAlert });
    }
  }

  return (
    <header id="app-header" className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        
        {/* Brand/Logo */}
        <div 
          onClick={() => setCurrentTab("home")} 
          className="flex items-center space-x-2 cursor-pointer group"
        >
          <div className="h-9 w-9 bg-amber-500 rounded-lg flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 group-hover:bg-amber-400 transition-colors">
            HR
          </div>
          <span className="font-bold tracking-tight text-lg sm:text-lg text-slate-100 group-hover:text-amber-400 transition-colors">
            Hour<span className="text-amber-500 font-extrabold">Escape</span>
          </span>
        </div>

        {/* Tab Navigation */}
        <nav className="hidden md:flex space-x-1 h-full items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                id={`nav-${item.id}`}
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-150 ${
                  isActive 
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10" 
                    : "text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile/Compact trigger & Auth Controls */}
        <div className="flex items-center space-x-3">
          {/* User selector indicator */}
          {currentUser ? (
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
              <div className="flex flex-col items-end text-right">
                <span className="text-[11px] font-semibold text-slate-100 leading-3">
                  {currentUser.ime} {currentUser.prezime}
                </span>
                <span className="text-[9px] font-bold text-amber-500 tracking-wider leading-3 uppercase">
                  {currentUser.uloga}
                </span>
              </div>
              <button
                id="btn-logout"
                title="Odjavi se"
                onClick={onLogout}
                className="p-1 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors text-slate-400 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="btn-auth-trigger"
              onClick={onOpenUserModal}
              className="flex items-center space-x-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-md text-xs font-semibold cursor-pointer shadow-md shadow-amber-500/15 transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Prijavi Se</span>
            </button>
          )}

          {/* Quick Context Switcher Button for Testing */}
          <button
            id="btn-switch-accounts-help"
            onClick={onOpenUserModal}
            className="p-1.5 text-xs font-semibold italic text-slate-400 bg-slate-800 border border-slate-700 hover:border-amber-500 hover:text-amber-500 rounded cursor-pointer hidden sm:block"
            title="Brza promjena uloge za testiranje"
          >
            Promijeni ulogu
          </button>
        </div>
      </div>

      {/* Mobile nav rail bottom on small screens */}
      <div className="md:hidden flex bg-slate-950 border-t border-slate-800 justify-around py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              id={`nav-mobile-${item.id}`}
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                isActive 
                  ? "text-amber-500 font-semibold" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
