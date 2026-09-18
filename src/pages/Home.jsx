import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, googleProvider, signInWithPopup, db } from '../firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Trophy, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  const { currentUser } = useAuth();
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const q = query(collection(db, "treatLogs"), orderBy("createdAt", "desc"), limit(4));
        const snap = await getDocs(q);
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRecentLogs(logs);
      } catch (err) {
        console.error("Error fetching recent treats", err);
      }
    };
    fetchRecent();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-sans selection:bg-orange-500/30">
      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-60">
          <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000" alt="Feast Background" className="w-full h-full object-cover animate-slow-zoom" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 via-[#0a0a0a]/80 to-[#0a0a0a]"></div>
          {/* Subtle glowing orb */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none"></div>
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
          
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.9] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 drop-shadow-sm">
            TREAT <br className="md:hidden" /> TRACKER
          </h1>
          
          <p className="text-gray-400 text-sm md:text-xl max-w-2xl mx-auto leading-relaxed font-medium mb-12">
            Debts must be paid, honor must be served. Record your kacchi feasts, track who owes who, and immortalize your memories in the Hall of Fame. 
          </p>

          {!currentUser ? (
            <button onClick={handleLogin} className="group relative bg-orange-500 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest transition-all transform hover:-translate-y-1 shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)] hover:shadow-[0_0_60px_-15px_rgba(249,115,22,0.7)] flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center gap-3"><Users size={20} /> Join the Platform</span>
            </button>
          ) : (
            <Link to="/dashboard" className="group relative bg-white text-black px-10 py-5 rounded-full font-black uppercase tracking-widest transition-all transform hover:-translate-y-1 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-gray-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center gap-3">Go to Dashboard <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></span>
            </Link>
          )}
        </div>
      </header>

      {/* Recent Activity */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Recent Feasts</h2>
            <p className="text-gray-500 font-bold mt-2">The latest settled debts.</p>
          </div>
          <Link to="/gallery" className="group text-orange-500 hover:text-orange-400 font-black text-sm tracking-widest uppercase flex items-center gap-2 transition-colors bg-orange-500/10 px-6 py-3 rounded-full">
            View Gallery <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {recentLogs.length === 0 ? (
            <div className="col-span-full py-20 border border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-xl text-center">
              <p className="text-gray-500 font-bold tracking-widest uppercase">No public treats recorded yet.</p>
            </div>
          ) : (
            recentLogs.map((log) => (
              <Link to={`/event/${log.eventId}`} key={log.id} className="group relative h-[400px] rounded-[2.5rem] overflow-hidden block transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.2)]">
                {/* Background Image Cover */}
                <div className="absolute inset-0 bg-gray-900">
                  <img 
                    src={log.photoUrl || 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=800'} 
                    alt="Feast" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  {/* Glassmorphism Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 transition-opacity group-hover:opacity-100"></div>
                </div>

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-8 z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex -space-x-3">
                      <img src={log.giverPhoto || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full border-2 border-black object-cover" title={`Giver: ${log.giverName}`} />
                      <img src={log.receiverPhoto || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full border-2 border-black object-cover" title={`Receiver: ${log.receiverName}`} />
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                      {new Date(log.date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                    <div className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 drop-shadow-md">{log.eventTitle}</div>
                    <h3 className="text-2xl font-black tracking-tight italic mb-3 text-white leading-tight drop-shadow-lg">{log.occasion}</h3>
                    {log.memory && (
                      <p className="text-sm text-gray-300 line-clamp-2 italic font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        "{log.memory}"
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
