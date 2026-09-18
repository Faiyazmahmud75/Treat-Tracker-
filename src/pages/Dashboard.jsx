import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImage } from '../utils/uploadImage';
import {
  Plus,
  X,
  Camera,
  Trophy,
  CheckCircle2,
  Lock,
  Edit3,
  Search,
  Utensils,
  Award,
  Clock,
  User,
  Flame,
  ChevronRight,
  UploadCloud,
  AlertCircle
} from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';

const AVATAR_PRESETS = [
  { id: '1', label: 'Feast Hunter', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300' },
  { id: '2', label: 'Biryani King', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300' },
  { id: '3', label: 'Sweet Tooth', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300' },
  { id: '4', label: 'Kacchi Master', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300' },
  { id: '5', label: 'Gourmet Pro', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=300' },
  { id: '6', label: 'Midnight Feaster', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300' },
];

const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-Binary',
  'Prefer not to say'
];

export default function Dashboard() {
  const { currentUser, updateUserProfile } = useAuth();
  const [events, setEvents] = useState([]);
  const [treatLogs, setTreatLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'completed'

  // Event creation form modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [count, setCount] = useState('');
  const [story, setStory] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorAvatar, setSponsorAvatar] = useState(null);
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Profile update modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileGender, setProfileGender] = useState('Male');
  const [profilePhotoURL, setProfilePhotoURL] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileFavoriteTreat, setProfileFavoriteTreat] = useState('');
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Fetch events and treat logs for current user
  const fetchDashboardData = async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch Treat Events where currentUser is the winner
      const eventQuery = query(
        collection(db, "treatEvents"),
        where("winnerId", "==", currentUser.uid)
      );
      const eventSnap = await getDocs(eventQuery);
      const fetchedEvents = eventSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort client-side
      fetchedEvents.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setEvents(fetchedEvents);

      // 2. Fetch Treat Logs to compute claimed treats
      try {
        const logsQuery = query(
          collection(db, "treatLogs"),
          where("receiverId", "==", currentUser.uid)
        );
        const logSnap = await getDocs(logsQuery);
        const fetchedLogs = logSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTreatLogs(fetchedLogs);
      } catch (logErr) {
        console.warn("Could not query treatLogs by receiverId, attempting fallback fetch", logErr);
      }
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  // Sync profile form when opening modal or when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileGender(currentUser.gender || 'Prefer not to say');
      setProfilePhotoURL(currentUser.photoURL || '');
      setProfileBio(currentUser.bio || '');
      setProfileFavoriteTreat(currentUser.favoriteTreat || '');
    }
  }, [currentUser, isProfileModalOpen]);

  // Handle Event Creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!title || !count || !sponsorName) {
      alert("Title, Count, and Sponsor Name are required!");
      return;
    }

    setCreatingEvent(true);
    let avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200';

    if (sponsorAvatar) {
      const uploaded = await uploadImage(sponsorAvatar);
      if (uploaded) avatarUrl = uploaded;
    }

    try {
      await addDoc(collection(db, "treatEvents"), {
        title,
        count: parseInt(count, 10),
        story,
        winnerId: currentUser.uid,
        winnerName: currentUser.name || "Anonymous Winner",
        winnerPhoto: currentUser.photoURL || "",
        sponsorName,
        sponsorPhoto: avatarUrl,
        createdAt: serverTimestamp()
      });

      setIsEventModalOpen(false);
      setTitle('');
      setCount('');
      setStory('');
      setSponsorName('');
      setSponsorAvatar(null);
      fetchDashboardData();
    } catch (err) {
      console.error("Error creating event", err);
      alert("Failed to create event. Please try again.");
    } finally {
      setCreatingEvent(false);
    }
  };

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      let finalPhotoURL = profilePhotoURL;

      if (profileAvatarFile) {
        const uploaded = await uploadImage(profileAvatarFile);
        if (uploaded) {
          finalPhotoURL = uploaded;
        } else {
          throw new Error("Failed to upload avatar image. Please check your network or try another picture.");
        }
      }

      await updateUserProfile({
        name: profileName.trim(),
        gender: profileGender,
        photoURL: finalPhotoURL,
        bio: profileBio.trim(),
        favoriteTreat: profileFavoriteTreat.trim()
      });

      setProfilePhotoURL(finalPhotoURL);
      setProfileAvatarFile(null);
      setProfileSuccessMsg("Profile updated successfully!");

      setTimeout(() => {
        setIsProfileModalOpen(false);
        setProfileSuccessMsg('');
      }, 1200);
    } catch (err) {
      console.error("Error updating profile:", err);
      setProfileErrorMsg(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Claimed treats map by event ID
  const claimedCountByEvent = {};
  treatLogs.forEach(log => {
    if (log.eventId) {
      claimedCountByEvent[log.eventId] = (claimedCountByEvent[log.eventId] || 0) + 1;
    }
  });

  // KPI Calculations
  const totalEvents = events.length;
  const totalTreatsPromised = events.reduce((sum, ev) => sum + (parseInt(ev.count, 10) || 0), 0);
  const totalTreatsClaimed = events.reduce((sum, ev) => {
    const claimed = claimedCountByEvent[ev.id] || 0;
    return sum + Math.min(claimed, parseInt(ev.count, 10) || 0);
  }, 0);
  const totalTreatsPending = Math.max(0, totalTreatsPromised - totalTreatsClaimed);

  // Filtered Events
  const filteredEvents = events.filter(ev => {
    const claimed = claimedCountByEvent[ev.id] || 0;
    const isCompleted = claimed >= (parseInt(ev.count, 10) || 0);

    if (statusFilter === 'active' && isCompleted) return false;
    if (statusFilter === 'completed' && !isCompleted) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title?.toLowerCase().includes(q);
      const matchSponsor = ev.sponsorName?.toLowerCase().includes(q);
      const matchStory = ev.story?.toLowerCase().includes(q);
      return matchTitle || matchSponsor || matchStory;
    }
    return true;
  });

  if (!currentUser) {
    return <Navigate to="/" />;
  }

  const avatarDisplay = currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500/30 relative overflow-hidden font-sans">
      {/* Ambient Lighting Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-orange-600/5 blur-[150px] pointer-events-none" />

      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* ========================================================================= */}
        {/* USER PROFILE HERO BANNER                                                  */}
        {/* ========================================================================= */}
        <div className="relative rounded-[2.5rem] bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-2xl p-6 sm:p-8 md:p-10 mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Subtle glow watermark */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Left: Avatar & Identity details */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar with status indicator */}
              <div className="relative group cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-orange-500 via-amber-400 to-yellow-300 shadow-[0_0_30px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] transition-all">
                  <img
                    src={avatarDisplay}
                    alt={currentUser.name || "User Avatar"}
                    className="w-full h-full rounded-full object-cover bg-neutral-900 border-2 border-black"
                  />
                </div>
                {/* Camera hover badge */}
                <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Camera size={22} className="text-white drop-shadow" />
                </div>
                <div className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-[#0a0a0a]" title="Active Treat Hunter" />
              </div>

              {/* Text metadata */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase italic text-white drop-shadow-sm">
                    {currentUser.name || 'Gourmet Member'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Trophy size={12} /> Feast Master
                  </span>
                </div>

                {/* Badges: Gender & Email */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {/* Email Pill (Read Only) */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 font-medium">
                    <Lock size={12} className="text-orange-400" />
                    <span>{currentUser.email}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest pl-1 font-bold">Read-Only</span>
                  </div>

                  {/* Gender Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 font-medium">
                    <User size={12} className="text-amber-400" />
                    <span>Gender: <strong className="text-white font-semibold">{currentUser.gender || 'Prefer not to say'}</strong></span>
                  </div>

                  {/* Favorite Treat Pill */}
                  {currentUser.favoriteTreat && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 font-medium">
                      <Utensils size={12} className="text-orange-400" />
                      <span>Fav: <strong>{currentUser.favoriteTreat}</strong></span>
                    </div>
                  )}
                </div>

                {/* Bio / Motto */}
                <p className="text-sm text-gray-400 max-w-xl italic font-normal pt-1">
                  {currentUser.bio ? `"${currentUser.bio}"` : "“No bet is complete without a biryani celebration.”"}
                </p>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-2 lg:pt-0">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all transform hover:-translate-y-0.5 shadow-lg cursor-pointer"
              >
                <Edit3 size={15} className="text-orange-400" />
                Edit Profile
              </button>

              <button
                onClick={() => setIsEventModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest transition-all transform hover:-translate-y-0.5 shadow-[0_0_30px_-5px_rgba(249,115,22,0.6)] cursor-pointer"
              >
                <Plus size={16} />
                Create Event
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KPI METRICS OVERVIEW                                                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {/* Card 1: Total Events */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="flex items-center justify-between text-gray-400 mb-4">
              <span className="text-[11px] font-black uppercase tracking-widest">Events Won</span>
              <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400">
                <Trophy size={18} />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black italic tracking-tight text-white mb-1">
              {totalEvents}
            </div>
            <span className="text-xs text-gray-500 font-medium">Contests in your record</span>
          </div>

          {/* Card 2: Total Treats Promised */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between text-gray-400 mb-4">
              <span className="text-[11px] font-black uppercase tracking-widest">Treats Won</span>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
                <Award size={18} />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black italic tracking-tight text-amber-400 mb-1">
              {totalTreatsPromised}
            </div>
            <span className="text-xs text-gray-500 font-medium">Total meals on line</span>
          </div>

          {/* Card 3: Treats Claimed */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-green-500/30 transition-all">
            <div className="flex items-center justify-between text-gray-400 mb-4">
              <span className="text-[11px] font-black uppercase tracking-widest">Claimed Feasts</span>
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black italic tracking-tight text-emerald-400 mb-1">
              {totalTreatsClaimed}
            </div>
            <span className="text-xs text-gray-500 font-medium">Recorded with memories</span>
          </div>

          {/* Card 4: Pending Treats */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="flex items-center justify-between text-gray-400 mb-4">
              <span className="text-[11px] font-black uppercase tracking-widest">Debts Pending</span>
              <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400">
                <Clock size={18} />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black italic tracking-tight text-orange-500 mb-1">
              {totalTreatsPending}
            </div>
            <span className="text-xs text-gray-500 font-medium">Awaiting redemption</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EVENTS LEDGER SECTION HEADER & CONTROLS                                  */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
              <Flame className="text-orange-500" size={28} />
              Your Treat Ledger
            </h2>
            <p className="text-sm text-gray-400 font-medium mt-1">
              Track outstanding debts, feast progress, and relive the victories.
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search event or sponsor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-semibold placeholder-gray-500 text-white focus:outline-none focus:border-orange-500/60 focus:bg-white/10 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All ({events.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === 'completed'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Settled
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EVENTS LIST                                                               */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Loading Treat Ledger...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 px-6 rounded-[2.5rem] bg-white/[0.02] border border-dashed border-white/15 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-white mb-2">
              {searchQuery ? "No matching events found" : "No Treat Events Yet"}
            </h3>
            <p className="text-sm text-gray-400 mb-6 font-medium">
              {searchQuery
                ? `No events match "${searchQuery}". Clear your search or try another query.`
                : "Did someone lose a bet or promise you a feast? Record the event and start tracking your treats!"}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_30px_rgba(249,115,22,0.4)] cursor-pointer"
              >
                Record Your First Treat
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const claimed = claimedCountByEvent[event.id] || 0;
              const total = parseInt(event.count, 10) || 1;
              const percentage = Math.min(100, Math.round((claimed / total) * 100));
              const isSettled = claimed >= total;

              return (
                <Link
                  to={`/event/${event.id}`}
                  key={event.id}
                  className="group relative rounded-[2rem] bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-orange-500/40 p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 shadow-[0_15px_35px_rgba(0,0,0,0.3)] flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Treat Count Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                        <Utensils size={13} /> {event.count} {event.count === 1 ? 'Treat' : 'Treats'}
                      </span>
                      {isSettled ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 size={12} /> Settled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Clock size={12} /> {total - claimed} Remaining
                        </span>
                      )}
                    </div>

                    {/* Event Title */}
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white group-hover:text-orange-400 transition-colors line-clamp-2 mb-2">
                      {event.title}
                    </h3>

                    {/* Story / Note preview */}
                    {event.story ? (
                      <p className="text-xs text-gray-400 line-clamp-2 italic font-normal mb-5">
                        "{event.story}"
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 italic font-normal mb-5">
                        Honor of the feast is at stake.
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mb-6">
                      <div className="flex justify-between text-[11px] font-bold text-gray-400">
                        <span>Claim Progress</span>
                        <span className="text-white">{claimed} of {total} treats</span>
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
                      <div className="flex -space-x-2">
                        <img
                          src={(event.winnerId === currentUser.uid && currentUser.photoURL) ? currentUser.photoURL : (event.winnerPhoto || avatarDisplay)}
                          alt={event.winnerName}
                          className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] object-cover bg-neutral-800"
                          title={`Winner: ${event.winnerId === currentUser.uid ? (currentUser.name || 'You') : (event.winnerName || 'You')}`}
                        />
                        <img
                          src={event.sponsorPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'}
                          alt={event.sponsorName}
                          className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] object-cover bg-neutral-800"
                          title={`Sponsor: ${event.sponsorName}`}
                        />
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-400 font-medium">Sponsor: </span>
                        <span className="text-white font-bold">{event.sponsorName}</span>
                      </div>
                    </div>

                    <div className="text-gray-400 group-hover:text-orange-400 group-hover:translate-x-1 transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* PROFILE UPDATE MODAL                                                      */}
      {/* ========================================================================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-white/15 w-full max-w-xl rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative my-8">
            {/* Close Button */}
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase italic text-white">
                  Update Profile
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Customize your treat identity and public persona
                </p>
              </div>
            </div>

            {/* Notifications */}
            {profileSuccessMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{profileSuccessMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Profile Picture Section */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 block">
                  Profile Picture
                </label>

                <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-orange-500 shrink-0 shadow-md">
                    <img
                      src={
                        profileAvatarFile
                          ? URL.createObjectURL(profileAvatarFile)
                          : profilePhotoURL || avatarDisplay
                      }
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-all">
                        <UploadCloud size={14} /> Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setProfileAvatarFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {profileAvatarFile && (
                        <button
                          type="button"
                          onClick={() => setProfileAvatarFile(null)}
                          className="text-xs text-gray-400 hover:text-white px-2 py-1 cursor-pointer"
                        >
                          Clear File
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Supports JPG, PNG or WebP. Or pick a preset below:
                    </p>
                  </div>
                </div>

                {/* Avatar Presets */}
                <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 pr-1 shrink-0">Presets:</span>
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setProfilePhotoURL(preset.url);
                        setProfileAvatarFile(null);
                      }}
                      title={preset.label}
                      className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        profilePhotoURL === preset.url && !profileAvatarFile
                          ? 'border-orange-500 scale-110'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Full Name*
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              {/* Email Field (Read Only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Email Address
                  </label>
                  <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                    <Lock size={10} className="text-orange-400" /> Read Only (Google Account)
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={currentUser.email || ''}
                    className="w-full bg-white/[0.02] border border-white/10 p-3.5 pr-10 rounded-2xl text-gray-400 font-semibold text-sm cursor-not-allowed select-all"
                  />
                  <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>

              {/* Gender Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Gender
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setProfileGender(g)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                        profileGender === g
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Favorite Treat / Restaurant */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Favorite Treat / Feast Spot
                </label>
                <input
                  type="text"
                  value={profileFavoriteTreat}
                  onChange={(e) => setProfileFavoriteTreat(e.target.value)}
                  placeholder="e.g. Grand Nawab Kacchi, Sultan's Dine, Beef Tehari"
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              {/* Bio / Motto */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Treat Motto / Bio
                </label>
                <textarea
                  rows="2"
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Share your philosophy on food debts and celebrations..."
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE NEW EVENT MODAL                                                    */}
      {/* ========================================================================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-white/15 w-full max-w-2xl rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative my-8">
            <button
              onClick={() => setIsEventModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight uppercase italic text-white">
                  New Treat Event
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Record a contest, bet, or debt won in your honor
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Treat Title*
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., The 8-Match Kacchi Debt"
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Treat Count*
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="e.g., 5"
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Sponsor Name* (The Loser)
                </label>
                <input
                  type="text"
                  required
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="e.g., Sajib Hasnat"
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Treat Story (Optional)
                </label>
                <textarea
                  rows="2"
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Why are they treating you? How did they lose the bet?"
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Sponsor Avatar (Optional)
                </label>
                <div className="relative group border-2 border-dashed border-white/15 hover:border-orange-500/50 rounded-2xl p-6 text-center hover:bg-orange-500/[0.03] transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSponsorAvatar(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  {sponsorAvatar ? (
                    <div className="text-orange-400 font-bold flex flex-col items-center gap-2">
                      <CheckCircle2 size={28} />
                      <span className="text-xs">{sponsorAvatar.name}</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="mx-auto text-gray-400 group-hover:text-orange-400 transition-colors mb-2" size={28} />
                      <p className="text-xs font-bold text-gray-400 group-hover:text-orange-400">
                        Upload their photo (PNG / JPG)
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(249,115,22,0.4)] flex justify-center items-center gap-2 cursor-pointer"
                >
                  {creatingEvent ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Event...
                    </>
                  ) : (
                    'Publish Treat Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
