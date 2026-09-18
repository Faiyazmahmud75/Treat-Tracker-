import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  ArrowRight, 
  Loader2, 
  Utensils, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Calendar 
} from 'lucide-react';

export default function Home() {
  const { currentUser, loginWithGoogle, isLoggingIn } = useAuth();
  const [recentEvents, setRecentEvents] = useState([]);
  const [claimedCounts, setClaimedCounts] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentEvents = async () => {
      try {
        setLoadingEvents(true);
        // 1. Fetch public treat events
        const snap = await getDocs(collection(db, "treatEvents"));
        const eventsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Sort descending by creation date (handles timestamps, ISO strings, or numbers)
        eventsList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis 
            ? a.createdAt.toMillis() 
            : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.createdAt?.toMillis 
            ? b.createdAt.toMillis() 
            : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA;
        });

        // 2. Fetch treat logs to calculate claimed counts per event
        try {
          const logsSnap = await getDocs(collection(db, "treatLogs"));
          const counts = {};
          logsSnap.docs.forEach(d => {
            const data = d.data();
            if (data.eventId) {
              counts[data.eventId] = (counts[data.eventId] || 0) + 1;
            }
          });
          setClaimedCounts(counts);
        } catch (err) {
          console.warn("Could not fetch treat counts:", err);
        }

        setRecentEvents(eventsList.slice(0, 6));
      } catch (err) {
        console.error("Error fetching recent events", err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchRecentEvents();
  }, []);

  const handleLogin = async () => {
    const user = await loginWithGoogle();
    if (user) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-sans selection:bg-orange-500/30">
      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Thematic Feast Background Image */}
        <div className="absolute inset-0 opacity-65">
          <img 
            src="/hero-bg.jpg" 
            alt="Opulent Feast Banquet" 
            className="w-full h-full object-cover animate-slow-zoom" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/50 via-[#0a0a0a]/80 to-[#0a0a0a]"></div>
          {/* Subtle glowing ambient orb */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Brand Logo Emblem */}
          <div className="relative mb-6 group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 shadow-[0_0_50px_rgba(249,115,22,0.45)] group-hover:shadow-[0_0_70px_rgba(249,115,22,0.65)] transition-all transform group-hover:scale-105 duration-500">
              <img src="/logo.png" alt="Treat Tracker Logo" className="w-full h-full object-cover rounded-[14px] sm:rounded-[22px] bg-black" />
            </div>
            <div className="absolute -inset-2 bg-orange-500/20 rounded-3xl blur-xl pointer-events-none group-hover:bg-orange-500/40 transition-colors" />
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-orange-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-8 shadow-2xl">
            <Trophy size={14} className="text-orange-500" /> Global Treat Ledger
          </div>
          
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.9] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 drop-shadow-sm">
            TREAT <br className="md:hidden" /> TRACKER
          </h1>
          
          <p className="text-gray-400 text-xs sm:text-sm md:text-xl max-w-2xl mx-auto leading-relaxed font-medium mb-10 sm:mb-12 px-2">
            Debts must be paid, honor must be served. Record your kacchi feasts, track who owes who, and immortalize your memories in the Hall of Fame. 
          </p>

          {!currentUser ? (
            <button 
              onClick={handleLogin} 
              disabled={isLoggingIn}
              className="group relative bg-orange-500 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-full font-black uppercase text-xs sm:text-sm tracking-widest transition-all transform hover:-translate-y-1 shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)] hover:shadow-[0_0_60px_-15px_rgba(249,115,22,0.7)] flex items-center gap-3 overflow-hidden active:scale-95 disabled:opacity-60"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                {isLoggingIn ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Connecting...
                  </>
                ) : (
                  <>
                    <Users size={18} /> Join the Platform
                  </>
                )}
              </span>
            </button>
          ) : (
            <Link to="/dashboard" className="group relative bg-white text-black px-10 py-5 rounded-full font-black uppercase tracking-widest transition-all transform hover:-translate-y-1 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-gray-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center gap-3">Go to Dashboard <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></span>
            </Link>
          )}
        </div>
      </header>

      {/* Recent Treat Events Section */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-black uppercase tracking-widest mb-3">
              <Flame size={13} className="text-orange-500" /> Live Challenges & Debts
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-white">
              Recent Treat Events
            </h2>
            <p className="text-gray-400 font-medium text-xs sm:text-sm mt-2">
              Public food bets, showdowns, and feast milestones on the ledger.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/gallery" 
              className="text-white/80 hover:text-white font-bold text-xs tracking-widest uppercase flex items-center gap-2 transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-full"
            >
              Feast Gallery <ArrowRight size={14} />
            </Link>
            {currentUser && (
              <Link
                to="/dashboard"
                className="text-black bg-white hover:bg-orange-400 hover:text-white font-black text-xs tracking-widest uppercase flex items-center gap-2 transition-all px-5 py-3 rounded-full shadow-lg"
              >
                My Dashboard <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {loadingEvents ? (
          <div className="py-24 border border-white/10 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-xl flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Recent Events...</p>
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="col-span-full py-20 px-6 border border-white/10 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-xl text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-4">
              <Utensils size={28} />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-white mb-2">
              No Events Yet
            </h3>
            <p className="text-gray-400 text-xs mb-6 font-medium leading-relaxed">
              No treat showdowns have been logged yet. Be the first to wager a feast!
            </p>
            {!currentUser ? (
              <button
                onClick={handleLogin}
                className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest shadow-lg transition-colors"
              >
                Sign In to Create Event
              </button>
            ) : (
              <Link
                to="/dashboard"
                className="inline-block px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest shadow-lg transition-colors"
              >
                Create Event on Dashboard
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentEvents.map((event) => {
              const claimed = claimedCounts[event.id] || 0;
              const total = parseInt(event.count, 10) || 1;
              const percentage = Math.min(100, Math.round((claimed / total) * 100));
              const isSettled = claimed >= total;

              return (
                <Link
                  to={`/event/${event.id}`}
                  key={event.id}
                  className="group relative rounded-[2.2rem] bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-orange-500/40 p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex flex-col justify-between overflow-hidden"
                >
                  {/* Subtle ambient corner glow */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/20 transition-colors" />

                  <div>
                    {/* Top Row: Treat Count Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        <Utensils size={13} /> {event.count || 1} {(parseInt(event.count, 10) || 1) === 1 ? 'Treat' : 'Treats'}
                      </span>
                      {isSettled ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={12} /> Settled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Clock size={12} /> {Math.max(0, total - claimed)} Left
                        </span>
                      )}
                    </div>

                    {/* Event Title */}
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white group-hover:text-orange-400 transition-colors line-clamp-2 mb-2 leading-snug">
                      {event.title}
                    </h3>

                    {/* Story / Motivation */}
                    <p className="text-xs text-gray-400 line-clamp-2 italic font-normal mb-6 leading-relaxed">
                      "{event.story || 'Honor of the feast is at stake. May the tastiest meal settle the score.'}"
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-2 mb-6 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-gray-400 uppercase tracking-wider text-[10px]">Progress</span>
                        <span className="text-orange-400 font-mono">{claimed} / {total} ({percentage}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSettled
                              ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                              : 'bg-gradient-to-r from-orange-500 to-amber-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Matchup Details */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-3">
                        <img
                          src={event.winnerPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${event.winnerName || 'winner'}`}
                          alt={event.winnerName || 'Winner'}
                          className="w-9 h-9 rounded-full border-2 border-black object-cover bg-neutral-800"
                          title={`Winner: ${event.winnerName || 'Champion'}`}
                        />
                        <img
                          src={event.sponsorPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${event.sponsorName || 'sponsor'}`}
                          alt={event.sponsorName || 'Sponsor'}
                          className="w-9 h-9 rounded-full border-2 border-black object-cover bg-neutral-800"
                          title={`Sponsor: ${event.sponsorName || 'Treat Provider'}`}
                        />
                      </div>
                      <div className="text-[11px] leading-tight">
                        <p className="font-bold text-white truncate max-w-[120px]">{event.winnerName || 'Winner'}</p>
                        <p className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">vs {event.sponsorName || 'Sponsor'}</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-orange-400 group-hover:translate-x-1 transition-transform">
                      View <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
