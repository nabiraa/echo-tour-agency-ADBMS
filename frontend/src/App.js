import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import {
  Sparkles, Ticket, Mic2, BarChart3, Settings, ShieldCheck, User,
  Globe, Users, TrendingUp, ChevronDown, ChevronUp, X, CheckCircle,
  XCircle, LockKeyhole, Loader2, RefreshCw, Trash2, PenLine, Plus,
  MapPin, Calendar, Music, DollarSign, AlertTriangle, Star
} from "lucide-react";

const BASE_URL = "http://localhost:5000";
const MOCK_USER_ID = "6a24a2dc7091b2a6ef7d580f";

// ─── Utility helpers ────────────────────────────────────────────────────────

const fmt = {
  date: (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  money: (n) => "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0 }),
  short: (id) => String(id).slice(0, 8) + "…",
};

const STATUS_STYLES = {
  Upcoming:  "bg-violet-500/20 text-violet-300 border border-violet-500/30",
  Ongoing:   "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  Completed: "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30",
  Scheduled: "bg-sky-500/20 text-sky-300 border border-sky-500/30",
  "Sold Out":"bg-rose-500/20 text-rose-300 border border-rose-500/30",
  Cancelled: "bg-red-800/20 text-red-400 border border-red-800/30",
  Confirmed: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  Refunded:  "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30",
};

const Badge = ({ label }) => (
  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[label] || "bg-white/10 text-white/60"}`}>
    {label}
  </span>
);

// ─── Toast System ────────────────────────────────────────────────────────────

const ToastContainer = ({ toasts, dismiss }) => (
  <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl text-sm font-medium transition-all duration-300 ${
          t.type === "success"
            ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
            : "bg-red-950/80 border-red-500/40 text-red-300"
        }`}
        style={{ animation: "slideInRight 0.3s ease" }}
      >
        {t.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
        <span>{t.message}</span>
        <button onClick={() => dismiss(t.id)} className="ml-2 opacity-60 hover:opacity-100">
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

// ─── Loading Skeleton ────────────────────────────────────────────────────────

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-white/8 rounded-xl ${className}`} />
);

// ─── Booking Modal ────────────────────────────────────────────────────────────

const BookingModal = ({ data, userRole, onClose, showToast, onSuccess }) => {
  const { tour, concert } = data;
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    setLoading(true);
    try {
      // seat assignment
      const payload = {
        userId: MOCK_USER_ID,
        seatCategory: "Standing" 
      };

      await axios.post(
        `${BASE_URL}/api/tours/${tour._id}/concerts/${concert.concertId}/book`,
        payload
      );

      showToast("Ticket Booked! Enjoy the show!", "success");
      if (typeof onSuccess === "function") onSuccess();
      onClose();
    } catch (err) {
      showToast(err?.response?.data?.message || "Booking failed. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Banner Header */}
        <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-8 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white bg-black/20 hover:bg-black/40 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
          <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm mb-3 inline-block">
            Checkout Confirmation
          </span>
          <h3 className="text-xl font-black leading-tight tracking-tight">{tour?.title}</h3>
          <p className="text-white/70 text-sm mt-1">{tour?.artist?.name}</p>
        </div>

        {/* Content Details */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 bg-white/3 border border-white/5 rounded-xl p-3.5">
              <MapPin size={16} className="text-violet-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Venue Location</p>
                <p className="text-sm text-white font-semibold mt-0.5">{concert?.venue?.name}</p>
                <p className="text-xs text-white/60">{concert?.venue?.city}, {concert?.venue?.country}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/3 border border-white/5 rounded-xl p-3.5">
              <Calendar size={16} className="text-violet-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Event Date & Time</p>
                <p className="text-sm text-white font-semibold mt-0.5">{fmt.date(concert?.date)}</p>
              </div>
            </div>

            {/* Flat Single Ticket Tier Display */}
            <div className="flex items-center justify-between bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
              <div>
                <p className="text-xs text-violet-300 font-bold uppercase tracking-wider">Ticket Tier</p>
                <p className="text-base font-black text-white mt-0.5">General Admission</p>
              </div>
              <p className="text-2xl font-black text-emerald-400">{fmt.money(concert?.ticketPrice)}</p>
            </div>
          </div>

          {/* Action Footer Button */}
          <button
            onClick={handleBook}
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-violet-600/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Processing Transaction...</>
            ) : (
              <><Ticket size={16} /> Purchase Pass</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── TAB 1: HOME ─────────────────────────────────────────────────────────────

const HomeTab = ({ tours, toursLoading, setActiveTab, userRole }) => {
  const featured = tours[0];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/60 via-black to-rose-950/30 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(ellipse at 20% 50%, rgb(124,58,237,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgb(232,121,160,0.3) 0%, transparent 50%)"
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-28 md:py-40">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-violet-300 text-xs font-semibold uppercase tracking-widest mb-8">
            <Sparkles size={12} /> World Tour Management Platform
          </div>
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-none tracking-tight"
            style={{ textShadow: "0 0 80px rgba(139,92,246,0.4)" }}
          >
            THE WORLD IS<br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
              YOUR STAGE
            </span>
          </h1>
          <p className="text-white/50 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
            Manage global K-pop tours, book concerts, and track live analytics — all in one place.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => setActiveTab("tickets")}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3.5 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/40 cursor-pointer"
            >
              Explore Tours
            </button>
            <div className="relative group">
              <button
                onClick={() => userRole === "manager" && setActiveTab("insights")}
                className={`border border-white/20 text-white font-bold px-8 py-3.5 rounded-full transition-all duration-200 hover:scale-105 hover:border-white/40 cursor-pointer ${userRole !== "manager" ? "opacity-40" : "hover:bg-white/5"}`}
              >
                View Analytics
              </button>
              {userRole !== "manager" && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 text-white/70 text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Manager access required
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className="border-y border-white/5 py-3 overflow-hidden bg-black/40">
        <div className="flex whitespace-nowrap" style={{ animation: "marquee 30s linear infinite" }}>
          {[1, 2].map((i) => (
            <span key={i} className="text-violet-400/50 text-xs font-semibold uppercase tracking-widest px-4">
              TOKYO DOME • LOS ANGELES MEMORIAL COLISEUM • WEMBLEY STADIUM • MADISON SQUARE GARDEN • OLYMPIC STADIUM SEOUL • SINGAPORE NATIONAL STADIUM • SYDNEY OLYMPIC PARK • BERLIN OLYMPIASTADION •&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/5">
        {[
          { icon: Globe, label: "Tours Active", value: "2" },
          { icon: Users, label: "Total Seats", value: "132,500" },
          { icon: TrendingUp, label: "Revenue Tracked", value: "₩ Live" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-black/60 flex flex-col items-center justify-center py-8 gap-1">
            <Icon size={18} className="text-violet-400 mb-1" />
            <span className="text-2xl md:text-3xl font-black text-white">{value}</span>
            <span className="text-white/40 text-xs uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      {/* Featured Tour */}
      <div className="px-6 py-12 max-w-4xl mx-auto">
        <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-4">Featured Tour</p>
        {toursLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : featured ? (
          <div className="bg-white/4 border border-white/10 rounded-3xl p-8 hover:border-violet-500/30 transition-all duration-300">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-black text-white mb-1">{featured.title}</h2>
                <p className="text-rose-400 font-semibold">{featured.artist?.name}
                  <span className="text-white/30 font-normal"> · {featured.year}</span>
                </p>
              </div>
              <Badge label={featured.status} />
            </div>
            <div className="grid gap-3">
              {featured.concerts?.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-white/4 rounded-2xl px-5 py-3.5 border border-white/8 flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
                      <Calendar size={16} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{fmt.date(c.date)}</p>
                      <p className="text-white/40 text-xs">{c.venue?.name}, {c.venue?.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${c.ticketPrice}</p>
                    <p className="text-white/40 text-xs">{c.availableTickets?.toLocaleString()} left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-white/30 text-center py-12">No tours found.</p>
        )}
      </div>
    </div>
  );
};

// ─── TAB 2: TICKET OFFICE ────────────────────────────────────────────────────

const TicketOfficeTab = ({ tours, toursLoading, userRole, showToast, setBookingModal }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    tours.filter((t) =>
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.artist?.name?.toLowerCase().includes(search.toLowerCase())
    ), [tours, search]);

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white mb-1">Ticket Office</h2>
        <p className="text-white/40">Browse and book concert tickets</p>
      </div>

      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Search tours or artists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        )}
      </div>

      {toursLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Ticket size={40} className="mx-auto mb-3 opacity-30" />
          <p>No tours match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tour) => (
            <div key={tour._id} className="bg-white/4 border border-white/10 rounded-3xl p-6 hover:border-violet-500/30 hover:bg-white/6 transition-all duration-300 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-3">
                  <h3 className="text-lg font-bold text-white leading-tight mb-1">{tour.title}</h3>
                  <p className="text-rose-400 text-sm font-semibold">{tour.artist?.name}</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {tour.artist?.type === "group" ? "👥 Group" : "🎤 Soloist"} · {tour.year}
                  </p>
                </div>
                <Badge label={tour.status} />
              </div>

              <div className="flex-1 space-y-3 mt-4">
                {tour.concerts?.map((c, i) => {
                  // const capacity = c.venue?.capacity || 1;
                  // const pct = Math.max(0, Math.min(100, (c.availableTickets / capacity) * 100));
                  const soldOut = c.availableTickets === 0 || c.status === "Sold Out";

                  return (
                    <div key={i} className="bg-white/4 rounded-2xl p-4 border border-white/8">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white text-sm font-semibold">{fmt.date(c.date)}</p>
                          <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {c.venue?.name}, {c.venue?.city}
                          </p>
                        </div>
                        <p className="text-violet-300 font-bold text-sm">${c.ticketPrice}</p>
                      </div>

                      {/* SEAT QUANTITY TEXT VIEW */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs mb-4">
                        <span className="text-white/40">Seats available</span>
                        <span className="text-violet-400 font-bold font-mono">
                          {c.availableTickets?.toLocaleString()} 
                        </span>
                      </div>

                      <button
                        disabled={soldOut}
                        onClick={() => !soldOut && setBookingModal({ tour, concert: c })}
                        className={`w-full py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                          soldOut
                            ? "bg-white/5 text-red-400 border border-red-500/20 cursor-not-allowed"
                            : "bg-violet-600 hover:bg-violet-500 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/30"
                        }`}
                      >
                        {soldOut ? "Sold Out" : "Book Now"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TAB 3: ARTIST HUB ───────────────────────────────────────────────────────

const ArtistHubTab = ({ tours, toursLoading }) => {
  const [openArtist, setOpenArtist] = useState(null);
  const [openTour, setOpenTour] = useState(null);

  const artistMap = useMemo(() => {
    const map = {};
    tours.forEach((tour) => {
      const a = tour.artist;
      if (!a) return;
      const id = a._id;
      if (!map[id]) map[id] = { artist: a, tours: [] };
      map[id].tours.push(tour);
    });
    return Object.values(map);
  }, [tours]);

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white mb-1">Artist Hub</h2>
        <p className="text-white/40">Explore artist profiles and tour setlists</p>
      </div>

      {toursLoading ? (
        <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : artistMap.length === 0 ? (
        <p className="text-white/30 text-center py-20">No artists found.</p>
      ) : (
        <div className="space-y-4">
          {artistMap.map(({ artist, tours: artistTours }) => {
            const isOpen = openArtist === artist._id;
            return (
              <div key={artist._id} className="bg-white/4 border border-white/10 rounded-3xl overflow-hidden hover:border-violet-500/20 transition-all duration-300">
                {/* Collapsed Header */}
                <button
                  onClick={() => setOpenArtist(isOpen ? null : artist._id)}
                  className="w-full flex items-center justify-between p-6 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-rose-500 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                      {artist.name?.[0]}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{artist.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-rose-400 text-xs font-semibold capitalize">{artist.type}</span>
                        <span className="text-white/30 text-xs">·</span>
                        <span className="text-white/40 text-xs">{artist.agency}</span>
                        {artist.debutYear && (
                          <>
                            <span className="text-white/30 text-xs">·</span>
                            <span className="text-white/40 text-xs">Debut {artist.debutYear}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-white/30 transition-transform duration-300" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <ChevronDown size={20} />
                  </div>
                </button>

                {/* Expanded Content */}
                <div
                  className="overflow-hidden transition-all duration-500"
                  style={{ maxHeight: isOpen ? "2000px" : "0px" }}
                >
                  <div className="px-6 pb-6 space-y-5 border-t border-white/5 pt-5">
                    {/* Members */}
                    {artist.type === "group" && artist.members?.length > 0 && (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-2">Members</p>
                        <div className="flex flex-wrap gap-2">
                          {artist.members.map((m) => (
                            <span key={m} className="bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs px-3 py-1 rounded-full font-medium">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {artist.description && (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-2">About</p>
                        <p className="text-white/60 text-sm leading-relaxed">{artist.description}</p>
                      </div>
                    )}

                    {/* Tours */}
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">Tours ({artistTours.length})</p>
                      <div className="space-y-3">
                        {artistTours.map((tour) => (
                          <div key={tour._id} className="bg-white/4 rounded-2xl overflow-hidden border border-white/8">
                            <button
                              onClick={() => setOpenTour(openTour === tour._id ? null : tour._id)}
                              className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-white font-semibold text-sm">{tour.title}</span>
                                <span className="text-white/30 text-xs">{tour.year}</span>
                                <Badge label={tour.status} />
                              </div>
                              {openTour === tour._id ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                            </button>

                            {openTour === tour._id && (
                              <div className="px-5 pb-4 space-y-3 border-t border-white/5 pt-3">
                                {tour.concerts?.map((c, i) => (
                                  <div key={i} className="bg-white/4 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <p className="text-white text-sm font-semibold">{fmt.date(c.date)}</p>
                                        <p className="text-white/40 text-xs">{c.venue?.name}, {c.venue?.city}</p>
                                      </div>
                                      <Badge label={c.status} />
                                    </div>
                                    {c.setlist?.length > 0 && (
                                      <div>
                                        <p className="text-white/30 text-xs uppercase tracking-widest mb-2 flex items-center gap-1">
                                          <Music size={10} /> Setlist
                                        </p>
                                        <ol className="space-y-1">
                                          {c.setlist.map((song, si) => (
                                            <li key={si} className="flex items-center gap-2 text-violet-300 text-xs">
                                              <span className="text-white/20 w-4 text-right">{si + 1}.</span>
                                              {song}
                                            </li>
                                          ))}
                                        </ol>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── LOCK SCREEN ─────────────────────────────────────────────────────────────

const LockScreen = ({ setUserRole }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
    <div className="w-20 h-20 bg-violet-600/10 border border-violet-500/20 rounded-3xl flex items-center justify-center mb-6">
      <LockKeyhole size={36} className="text-violet-400" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">Manager Access Only</h2>
    <p className="text-white/40 text-sm max-w-xs mb-8">
      Switch to Agency Manager mode using the session switcher in the top right.
    </p>
    <button
      onClick={() => setUserRole("manager")}
      className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/30 cursor-pointer"
    >
      Switch to Manager
    </button>
  </div>
);

// ─── TAB 4: MANAGER INSIGHTS ─────────────────────────────────────────────────

const ManagerInsightsTab = ({ userRole, setUserRole, showToast, fetchTours }) => {
  const [analytics, setAnalytics] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const axiosConfig = useMemo(() => ({ headers: { "x-user-role": userRole } }), [userRole]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, tRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/admin/analytics`, axiosConfig),
        axios.get(`${BASE_URL}/api/admin/tickets`, axiosConfig),
      ]);
      setAnalytics(aRes.data.data || []);
      setTickets(tRes.data.data || []);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to load analytics.", "error");
    } finally {
      setLoading(false);
    }
  }, [axiosConfig, showToast]);

  useEffect(() => { if (userRole === "manager") fetchData(); }, [userRole, fetchData]);

  const handleRefund = async (ticketId) => {
    if (!window.confirm("Confirm full refund for ticket? ")) return;
    try {
      await axios.delete(`${BASE_URL}/api/admin/tickets/${ticketId}`, axiosConfig);
      showToast("Ticket refunded and seat restored.", "success");

      // 1. Refresh the main tour state so available tickets & capacity counts update instantly!
      if (typeof fetchTours === "function") {
        fetchTours();
      // } else {
      //   // Fallback context refresh if called within isolated tab props
      //   window.location.reload(); 
      }

      fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || "Refund failed.", "error");
    }
  };

  if (userRole !== "manager") return <LockScreen setUserRole={setUserRole} />;

  const totalRevenue = analytics.reduce((s, r) => s + (r.totalRevenue || 0), 0);
  const totalSold = analytics.reduce((s, r) => s + (r.totalTicketsSold || 0), 0);

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-white mb-1">Manager Insights</h2>
          <p className="text-white/40">Live revenue and attendance analytics</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-4 py-2 rounded-full text-sm transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: "Tours Tracked", value: analytics.length, icon: Globe },
          { label: "Total Revenue", value: fmt.money(totalRevenue), icon: DollarSign },
          { label: "Tickets Sold", value: totalSold.toLocaleString(), icon: Ticket },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white/4 border border-white/10 rounded-2xl p-6 hover:border-violet-500/20 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-violet-600/20 rounded-xl flex items-center justify-center">
                <Icon size={16} className="text-violet-400" />
              </div>
              <span className="text-white/50 text-sm">{label}</span>
            </div>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <p className="text-3xl font-black text-white">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Analytics Table */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-white mb-4">Tour Revenue Breakdown</h3>
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-900/80 backdrop-blur border-b border-white/10">
                  {["Tour", "Artist", "Status", "Concerts", "Tickets Sold", "Revenue", "Remaining"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-white/40 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-white/30">
                    <Loader2 size={20} className="animate-spin mx-auto" />
                  </td></tr>
                ) : analytics.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-white/30">No analytics data.</td></tr>
                ) : analytics.map((row, i) => (
                  <tr key={row._id} className={i % 2 === 0 ? "bg-white/2" : ""}>
                    <td className="px-5 py-4 text-white font-semibold text-sm">{row.tourTitle}</td>
                    <td className="px-5 py-4 text-rose-400 text-sm">{row.artistId?.name || "—"}</td>
                    <td className="px-5 py-4"><Badge label={row.tourStatus} /></td>
                    <td className="px-5 py-4 text-white/60 text-sm">{row.concertCount}</td>
                    <td className="px-5 py-4 text-white/60 text-sm">{row.totalTicketsSold}</td>
                    <td className="px-5 py-4 text-emerald-400 font-bold text-sm">{fmt.money(row.totalRevenue)}</td>
                    <td className="px-5 py-4 text-white/60 text-sm">{(row.totalRemainingTickets || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ticket Receipts */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">All Ticket Receipts</h3>
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-900/80 backdrop-blur border-b border-white/10">
                  {["Ticket ID", "Customer", "Tour", "Concert ID", "Category", "Date", "Amount", "Status", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-white/40 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-white/30">
                    <Loader2 size={20} className="animate-spin mx-auto" />
                  </td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-white/30">No tickets yet.</td></tr>
                ) : tickets.map((t, i) => (
                  <tr key={t._id} className={i % 2 === 0 ? "bg-white/2" : ""}>
                    <td className="px-4 py-3.5 text-white/50 font-mono text-xs">{fmt.short(t._id)}</td>
                    <td className="px-4 py-3.5 text-white text-sm">{t.user?.username || "—"}</td>
                    <td className="px-4 py-3.5 text-white/70 text-sm">{t.tour?.title || "—"}</td>
                    <td className="px-4 py-3.5 text-white/50 font-mono text-xs">{fmt.short(t.concertId)}</td>
                    <td className="px-4 py-3.5 text-violet-300 text-sm">{t.seatCategory}</td>
                    <td className="px-4 py-3.5 text-white/50 text-xs">{fmt.date(t.purchaseDate)}</td>
                    <td className="px-4 py-3.5 text-emerald-400 font-bold text-sm">{fmt.money(t.totalPaid)}</td>
                    <td className="px-4 py-3.5"><Badge label={t.status} /></td>
                    <td className="px-4 py-3.5">
                      {t.status === "Confirmed" ? (
                        <button
                          onClick={() => handleRefund(t._id)}
                          className="text-xs border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 px-3 py-1 rounded-full transition-all cursor-pointer"
                        >
                          Refund
                        </button>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TAB 5: CONTROL PANEL ────────────────────────────────────────────────────

const ControlPanelTab = ({ userRole, setUserRole, showToast, tours, fetchTours }) => {
  const axiosConfig = useMemo(() => ({ headers: { "x-user-role": userRole } }), [userRole]);

  // Add Tour form state
  const [form, setForm] = useState({ 
    title: "", 
    year: new Date().getFullYear(), 
    artist: "", 
    status: "Upcoming",
    concerts: [{ 
      date: "", venue: "", ticketPrice: 0, availableTickets: 0, status: "Scheduled", setlist: []
    }] 
  });
  const [formLoading, setFormLoading] = useState(false);

  // Helper to quickly handle nested data changes inside the concert array object
  const handleConcertChange = (field, value) => {
    setForm((p) => {
      const updatedConcerts = [...p.concerts];
      updatedConcerts[0] = { ...updatedConcerts[0], [field]: value };
      return { ...p, concerts: updatedConcerts };
    });
  };

  // Helper to handle text/comma separation for setlist generation inside the form
  const handleSetlistChange = (textValue) => {
    const songsArray = textValue.split(",").map(song => song.trim()).filter(Boolean);
    setForm((p) => {
      const updatedConcerts = [...p.concerts];
      updatedConcerts[0] = { ...updatedConcerts[0], setlist: songsArray };
      return { ...p, concerts: updatedConcerts };
    });
  };

  // Edit state per tour
  const [editingStatus, setEditingStatus] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleCreate = async () => {
    if (!form.title || !form.artist) {
      showToast("Tour title and Artist ID are required.", "error");
      return;
    }
    if (!form.concerts[0].venue) {
      showToast("A valid Venue ObjectId is required for the initial concert stop.", "error");
      return;
    }
    if (!form.concerts[0].date) {
      showToast("Please pick a valid concert date.", "error");
      return;
    }

    setFormLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/tours`, form, axiosConfig);
      showToast("Tour created successfully with embedded concert stops! 🎉", "success");
      
      // Reset state completely back to an empty template structure
      setForm({
        title: "",
        year: new Date().getFullYear(),
        artist: "",
        status: "Upcoming",
        concerts: [{ venue: "", date: "", ticketPrice: 150, availableTickets: 20000, status: "Scheduled", setlist: [] }]
      });
      fetchTours();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to create tour.", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusSave = async (tourId) => {
    const newStatus = editingStatus[tourId]?.value;
    if (!newStatus) return;
    try {
      await axios.patch(`${BASE_URL}/api/tours/${tourId}`, { status: newStatus }, axiosConfig);
      showToast("Tour status updated.", "success");
      setEditingStatus((prev) => ({ ...prev, [tourId]: undefined }));
      fetchTours();
    } catch (err) {
      showToast(err?.response?.data?.message || "Update failed.", "error");
    }
  };

  const handleDelete = async (tourId) => {
    try {
      await axios.delete(`${BASE_URL}/api/tours/${tourId}`, axiosConfig);
      showToast("Tour deleted.", "success");
      setConfirmDelete(null);
      fetchTours();
    } catch (err) {
      showToast(err?.response?.data?.message || "Delete failed.", "error");
    }
  };

  if (userRole !== "manager") return <LockScreen setUserRole={setUserRole} />;

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white mb-1">Control Panel</h2>
        <p className="text-white/40">Full CRUD management for tours and records</p>
      </div>

      {/* Add New Tour */}
      {/* Add New Tour Form UI Layout */}
      <div className="bg-white/4 border border-white/10 rounded-3xl p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-violet-600/20 rounded-xl flex items-center justify-center">
            <Plus size={16} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Add New Tour</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Metadata Rows */}
          <div>
            <label className="block text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Tour Title</label>
            <input
              type="text"
              placeholder="e.g. DOMINATE World Tour"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Tour Year</label>
            <input
              type="number"
              placeholder="2026"
              value={form.year}
              onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Artist Object ID</label>
            <input
              type="text"
              placeholder="Paste MongoDB Artist ID string here"
              value={form.artist}
              onChange={(e) => setForm((p) => ({ ...p, artist: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Overall Tour Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 transition-all text-sm cursor-pointer"
            >
              {["Upcoming", "Ongoing", "Completed"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 🎫 NESTED CONCERT SUB-DOCUMENT ROW CONFIGURATION */}
          <div className="md:col-span-2 border-t border-white/5 pt-5 mt-2">
            <h4 className="text-violet-400 text-sm font-bold uppercase tracking-wider mb-4">Initial Concert Stop Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Venue Object ID</label>
                <input
                  type="text"
                  placeholder="Paste MongoDB Venue ID string here"
                  value={form.concerts[0].venue}
                  onChange={(e) => handleConcertChange("venue", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Concert Show Date</label>
                <input
                  type="datetime-local"
                  value={form.concerts[0].date}
                  onChange={(e) => handleConcertChange("date", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 transition-all text-sm cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Ticket Price ($)</label>
                <input
                  type="number"
                  value={form.concerts[0].ticketPrice}
                  onChange={(e) => handleConcertChange("ticketPrice", Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Total Tickets / Capacity Available</label>
                <input
                  type="number"
                  value={form.concerts[0].availableTickets}
                  onChange={(e) => handleConcertChange("availableTickets", Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 transition-all text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">Setlist (Comma separated songs)</label>
                <input
                  type="text"
                  placeholder="Song A, Song B, Song C"
                  onChange={(e) => handleSetlistChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={formLoading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/30 cursor-pointer flex items-center gap-2"
        >
          {formLoading ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : <><Plus size={15} /> Create Tour</>}
        </button>
      </div>

      {/* Manage Existing Tours */}
      <div className="bg-white/4 border border-white/10 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-rose-600/20 rounded-xl flex items-center justify-center">
            <PenLine size={16} className="text-rose-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Manage Existing Tours</h3>
        </div>

        {tours.length === 0 ? (
          <p className="text-white/30 text-center py-8">No tours to manage.</p>
        ) : (
          <div className="space-y-3">
            {tours.map((tour) => (
              <div key={tour._id} className="bg-white/4 border border-white/8 rounded-2xl p-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-white font-bold">{tour.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-rose-400 text-sm">{tour.artist?.name}</p>
                      <span className="text-white/20">·</span>
                      <p className="text-white/40 text-sm">{tour.year}</p>
                      <Badge label={tour.status} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Edit Status */}
                    {editingStatus[tour._id] ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingStatus[tour._id].value}
                          onChange={(e) => setEditingStatus((p) => ({ ...p, [tour._id]: { value: e.target.value } }))}
                          className="bg-zinc-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer"
                        >
                          {["Upcoming", "Ongoing", "Completed"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleStatusSave(tour._id)}
                          className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingStatus((p) => ({ ...p, [tour._id]: undefined }))}
                          className="text-white/30 hover:text-white/60 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingStatus((p) => ({ ...p, [tour._id]: { value: tour.status } }))}
                        className="text-xs border border-violet-500/40 text-violet-400 hover:bg-violet-500/10 px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1"
                      >
                        <PenLine size={11} /> Edit Status
                      </button>
                    )}

                    {/* Delete */}
                    {confirmDelete === tour._id ? (
                      <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-xl px-3 py-1.5">
                        <AlertTriangle size={12} className="text-red-400" />
                        <span className="text-red-300 text-xs">Sure?</span>
                        <button
                          onClick={() => handleDelete(tour._id)}
                          className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-white/40 hover:text-white/70 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(tour._id)}
                        className="text-xs border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ROOT APP COMPONENT ───────────────────────────────────────────────────────

export default function App() {
  const [userRole, setUserRole] = useState("customer");
  const [activeTab, setActiveTab] = useState("home");
  const [tours, setTours] = useState([]);
  const [toursLoading, setToursLoading] = useState(false);
  const [bookingModal, setBookingModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const axiosConfig = useMemo(() => ({ headers: { "x-user-role": userRole } }), [userRole]);

  const showToast = useCallback((message, type = "success") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchTours = useCallback(async () => {
    setToursLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/tours`, axiosConfig);
      setTours(res.data.data || []);
    } catch {
      showToast("Could not load tours from server.", "error");
    } finally {
      setToursLoading(false);
    }
  }, [axiosConfig, showToast]);

  useEffect(() => { fetchTours(); }, [fetchTours]);

  const TABS = [
    { id: "home",     label: "Home",             icon: Sparkles  },
    { id: "tickets",  label: "Ticket Office",    icon: Ticket    },
    { id: "artists",  label: "Artist Hub",       icon: Mic2      },
    { id: "insights", label: "Manager Insights", icon: BarChart3 },
    { id: "panel",    label: "Control Panel",    icon: Settings  },
  ];

  return (
    <>
      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080810; font-family: 'DM Sans', sans-serif; color: white; }
        h1,h2,h3,h4,h5 { font-family: 'Syne', sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 2px; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .bg-white\/3 { background: rgba(255,255,255,0.03); }
        .bg-white\/4 { background: rgba(255,255,255,0.04); }
        .bg-white\/6 { background: rgba(255,255,255,0.06); }
        .bg-white\/8 { background: rgba(255,255,255,0.08); }
        .border-white\/8 { border-color: rgba(255,255,255,0.08); }
      `}</style>

      <div className="min-h-screen" style={{ background: "#080810" }}>

        {/* ── HEADER ── */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/8">
          <div className="flex items-center justify-between px-6 h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-black tracking-tighter"
                style={{
                  fontFamily: "Syne, sans-serif",
                  background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ECHO
              </span>
              <span className="text-white/20 text-xs font-medium hidden sm:block">WORLD TOUR MGMT</span>
            </div>

            {/* Session Switcher */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="appearance-none bg-white/8 hover:bg-white/12 border border-white/12 text-white text-sm font-medium pl-9 pr-8 py-2 rounded-full focus:outline-none focus:border-violet-500/50 transition-all cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <option value="customer">Fan Mode</option>
                  <option value="manager">Agency Manager</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {userRole === "manager"
                    ? <ShieldCheck size={14} className="text-emerald-400" />
                    : <User size={14} className="text-violet-400" />
                  }
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={12} className="text-white/40" />
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${userRole === "manager" ? "bg-emerald-400 shadow-lg shadow-emerald-400/50" : "bg-violet-400 shadow-lg shadow-violet-400/50"}`} />
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex border-t border-white/5 overflow-x-auto scrollbar-none">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border-b-2 ${
                  activeTab === id
                    ? "text-violet-400 border-violet-400"
                    : "text-white/40 border-transparent hover:text-white/70 hover:border-white/20"
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main style={{ paddingTop: "112px" }}>
          {activeTab === "home" && (
            <HomeTab
              tours={tours}
              toursLoading={toursLoading}
              setActiveTab={setActiveTab}
              userRole={userRole}
            />
          )}
          {activeTab === "tickets" && (
            <TicketOfficeTab
              tours={tours}
              toursLoading={toursLoading}
              userRole={userRole}
              showToast={showToast}
              setBookingModal={setBookingModal}
            />
          )}
          {activeTab === "artists" && (
            <ArtistHubTab tours={tours} toursLoading={toursLoading} />
          )}
          {activeTab === "insights" && (
            <ManagerInsightsTab
              userRole={userRole}
              setUserRole={setUserRole}
              showToast={showToast}
              fetchTours={fetchTours}
            />
          )}
          {activeTab === "panel" && (
            <ControlPanelTab
              userRole={userRole}
              setUserRole={setUserRole}
              showToast={showToast}
              tours={tours}
              fetchTours={fetchTours}
            />
          )}
        </main>

        {/* ── BOOKING MODAL ── */}
        {bookingModal && (
          <BookingModal
            data={bookingModal}
            userRole={userRole}
            onClose={() => setBookingModal(null)}
            showToast={showToast}
            onSuccess={fetchTours}
          />
        )}

        {/* ── TOASTS ── */}
        <ToastContainer toasts={toasts} dismiss={dismissToast} />
      </div>
    </>
  );
}