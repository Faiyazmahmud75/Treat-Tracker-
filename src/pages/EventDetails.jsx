import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { uploadImage } from '../utils/uploadImage';
import {
  Plus,
  X,
  Camera,
  Utensils,
  CheckCircle2,
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Trophy,
  UploadCloud,
  Eye,
  AlertCircle,
  Maximize2
} from 'lucide-react';

export default function EventDetails() {
  const { eventId } = useParams();
  const { currentUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [treats, setTreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Lightbox modal for previewing any image
  const [lightboxImage, setLightboxImage] = useState(null);

  // Edit Event State
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCount, setEditCount] = useState('');
  const [editStory, setEditStory] = useState('');
  const [editSponsorPhoto, setEditSponsorPhoto] = useState(null);

  // Edit Treat Log State
  const [isEditLogFormOpen, setIsEditLogFormOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editLogDate, setEditLogDate] = useState('');
  const [editLogOccasion, setEditLogOccasion] = useState('');
  const [editLogMemory, setEditLogMemory] = useState('');
  const [editExistingPhotos, setEditExistingPhotos] = useState([]); // array of URLs
  const [editNewPhotos, setEditNewPhotos] = useState([]); // array of new File objects

  // Log Treat Form State (Multiple Images)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [occasion, setOccasion] = useState('');
  const [memory, setMemory] = useState('');
  const [photos, setPhotos] = useState([]); // array of File objects
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const fetchEventAndTreats = async () => {
    try {
      // 1. Fetch Event Details
      const eventDoc = await getDoc(doc(db, "treatEvents", eventId));
      if (eventDoc.exists()) {
        const eventData = { id: eventDoc.id, ...eventDoc.data() };
        setEvent(eventData);
        setEditTitle(eventData.title);
        setEditCount(eventData.count);
        setEditStory(eventData.story || '');
      } else {
        console.error("Event not found");
      }

      // 2. Fetch Treat Logs for this event
      const q = query(
        collection(db, "treatLogs"),
        where("eventId", "==", eventId)
      );
      const snap = await getDocs(q);
      const fetchedTreats = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Sort by date descending
      fetchedTreats.sort((a, b) => new Date(b.date) - new Date(a.date));

      setTreats(fetchedTreats);
    } catch (err) {
      console.error("Error fetching event details", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract all images for a treat (supporting both photoUrls array and legacy photoUrl)
  const getTreatPhotos = (treat) => {
    if (treat.photoUrls && Array.isArray(treat.photoUrls) && treat.photoUrls.length > 0) {
      return treat.photoUrls;
    }
    if (treat.photoUrl) {
      return [treat.photoUrl];
    }
    return [];
  };

  // Aggregate all gallery images for this event
  const galleryImages = treats.flatMap(t => getTreatPhotos(t));

  useEffect(() => {
    fetchEventAndTreats();
  }, [eventId]);

  // Slideshow auto-advance
  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % galleryImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [galleryImages.length]);

  // Synchronize authenticated user's updated profile picture & name with event doc
  useEffect(() => {
    if (event && currentUser && event.winnerId === currentUser.uid) {
      const needsPhotoSync = currentUser.photoURL && event.winnerPhoto !== currentUser.photoURL;
      const needsNameSync = currentUser.name && event.winnerName !== currentUser.name;
      if (needsPhotoSync || needsNameSync) {
        updateDoc(doc(db, "treatEvents", eventId), {
          ...(needsPhotoSync ? { winnerPhoto: currentUser.photoURL } : {}),
          ...(needsNameSync ? { winnerName: currentUser.name } : {})
        }).catch(err => console.warn("Auto-sync profile to event doc:", err));
      }
    }
  }, [event, currentUser, eventId]);

  // File selection for new treat log
  const handlePhotoSelect = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...newFiles]);
    }
  };

  const removeSelectedPhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // File selection for editing treat log
  const handleEditPhotoSelect = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setEditNewPhotos(prev => [...prev, ...newFiles]);
    }
  };

  const removeEditNewPhoto = (index) => {
    setEditNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeEditExistingPhoto = (urlToRemove) => {
    setEditExistingPhotos(prev => prev.filter(url => url !== urlToRemove));
  };

  // Submit new treat log with multiple images
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!occasion || !date) return alert("Occasion and Date are required!");

    setUploading(true);
    const uploadedUrls = [];

    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        setUploadProgress(`Uploading photo ${i + 1} of ${photos.length}...`);
        const url = await uploadImage(photos[i]);
        if (url) {
          uploadedUrls.push(url);
        }
      }
    }

    try {
      await addDoc(collection(db, "treatLogs"), {
        eventId: event.id,
        eventTitle: event.title,
        receiverId: event.winnerId,
        receiverName: (currentUser && event.winnerId === currentUser.uid && currentUser.name) ? currentUser.name : (event.winnerName || "Winner"),
        receiverPhoto: (currentUser && event.winnerId === currentUser.uid && currentUser.photoURL) ? currentUser.photoURL : (event.winnerPhoto || ""),
        giverName: event.sponsorName,
        giverPhoto: event.sponsorPhoto,
        date,
        occasion,
        memory,
        photoUrl: uploadedUrls[0] || null, // Legacy backwards compatibility
        photoUrls: uploadedUrls,           // Multiple photos support
        createdAt: serverTimestamp()
      });

      setIsFormOpen(false);
      setOccasion('');
      setMemory('');
      setPhotos([]);
      setUploadProgress('');
      fetchEventAndTreats();
    } catch (err) {
      console.error("Error adding treat log", err);
      alert("Failed to save feast log. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  // Submit Edit Event
  const handleEdit = async (e) => {
    e.preventDefault();
    setUploading(true);

    const updatedData = {
      title: editTitle,
      count: parseInt(editCount, 10),
      story: editStory
    };

    if (editSponsorPhoto) {
      const uploaded = await uploadImage(editSponsorPhoto);
      if (uploaded) {
        updatedData.sponsorPhoto = uploaded;
      }
    }

    try {
      await updateDoc(doc(db, "treatEvents", eventId), updatedData);
      setIsEditFormOpen(false);
      setEditSponsorPhoto(null);
      fetchEventAndTreats();
    } catch (err) {
      console.error("Error updating event", err);
    } finally {
      setUploading(false);
    }
  };

  // Handle Event Deletion
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this event? All treat logs will remain in ledger history.")) {
      try {
        await deleteDoc(doc(db, "treatEvents", eventId));
        navigate("/dashboard");
      } catch (err) {
        console.error("Error deleting event", err);
      }
    }
  };

  // Open Edit Treat Log Modal
  const openEditLogForm = (log) => {
    setEditingLogId(log.id);
    setEditLogDate(log.date);
    setEditLogOccasion(log.occasion);
    setEditLogMemory(log.memory || '');
    setEditExistingPhotos(getTreatPhotos(log));
    setEditNewPhotos([]);
    setIsEditLogFormOpen(true);
  };

  // Submit Edit Treat Log
  const handleEditLog = async (e) => {
    e.preventDefault();
    setUploading(true);

    const newlyUploadedUrls = [];
    if (editNewPhotos.length > 0) {
      for (let i = 0; i < editNewPhotos.length; i++) {
        setUploadProgress(`Uploading photo ${i + 1} of ${editNewPhotos.length}...`);
        const url = await uploadImage(editNewPhotos[i]);
        if (url) newlyUploadedUrls.push(url);
      }
    }

    const finalPhotoUrls = [...editExistingPhotos, ...newlyUploadedUrls];

    const updatedData = {
      date: editLogDate,
      occasion: editLogOccasion,
      memory: editLogMemory,
      photoUrl: finalPhotoUrls[0] || null, // legacy field
      photoUrls: finalPhotoUrls           // multiple photos array
    };

    try {
      await updateDoc(doc(db, "treatLogs", editingLogId), updatedData);
      setIsEditLogFormOpen(false);
      setEditNewPhotos([]);
      setEditExistingPhotos([]);
      fetchEventAndTreats();
    } catch (err) {
      console.error("Error updating treat log", err);
      alert("Failed to update treat log. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  // Delete Individual Treat Log
  const handleDeleteLog = async (logId) => {
    if (window.confirm("Delete this treat entry from the ledger?")) {
      try {
        await deleteDoc(doc(db, "treatLogs", logId));
        fetchEventAndTreats();
      } catch (err) {
        console.error("Error deleting treat log", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Event Details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4">
        <AlertCircle size={48} className="text-orange-500 mb-4" />
        <h2 className="text-3xl font-black uppercase italic tracking-tight mb-2">Event Not Found</h2>
        <p className="text-gray-400 text-sm mb-6">This treat event does not exist or has been removed.</p>
        <Link to={currentUser ? "/dashboard" : "/"} className="px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold text-xs uppercase tracking-wider">
          {currentUser ? "Return to Dashboard" : "Return to Home"}
        </Link>
      </div>
    );
  }

  const completedCount = treats.length;
  const targetPlates = event.count;
  const progressPercent = Math.min(100, Math.round((completedCount / targetPlates) * 100));
  const isSettled = completedCount >= targetPlates;
  const isWinner = currentUser && event.winnerId === currentUser.uid;

  // Dynamically synchronized winner photo and name
  const winnerPhoto = (isWinner && currentUser?.photoURL)
    ? currentUser.photoURL
    : (event.winnerPhoto || currentUser?.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=winner');
  const winnerName = (isWinner && currentUser?.name)
    ? currentUser.name
    : (event.winnerName || 'Winner');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500/30 relative overflow-hidden font-sans">
      {/* Ambient Lighting Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-orange-500/15 via-amber-500/5 to-transparent blur-[150px] pointer-events-none -z-0" />
      <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-orange-600/5 blur-[160px] pointer-events-none -z-0" />

      {/* ========================================================================= */}
      {/* DYNAMIC HERO BANNER WITH AMBIENT GALLERY SLIDER                           */}
      {/* ========================================================================= */}
      <header className="relative pt-24 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[55vh] flex flex-col justify-end border-b border-white/10">
        {/* Gallery Image Crossfade Background - Lightened overlay for better visual vibrance */}
        {galleryImages.length > 0 ? (
          <div className="absolute inset-0 -z-0">
            {galleryImages.map((img, idx) => (
              <img
                key={`${img}-${idx}`}
                src={img}
                alt="Event cover"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-75 scale-105' : 'opacity-0 scale-100'
                  } transition-transform ease-out duration-[6000ms]`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/45 to-black/15" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/40 via-[#0a0a0a]/75 to-[#0a0a0a] -z-0" />
        )}

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          {/* Top Breadcrumb & Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <Link
              to={currentUser ? "/dashboard" : "/"}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer shadow-md"
            >
              <ArrowLeft size={14} /> {currentUser ? "Back to Dashboard" : "Back to Home"}
            </Link>

            {isSettled ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                <CheckCircle2 size={14} /> Debt Fully Settled ({completedCount}/{targetPlates})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 backdrop-blur-md">
                <Clock size={14} /> {targetPlates - completedCount} Treats Remaining
              </span>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-5 max-w-3xl">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase italic text-white leading-[1.05] drop-shadow-lg">
                {event.title}
              </h1>

              {/* Sports Style Head-to-Head Showdown Card */}
              <div className="relative rounded-[2rem] bg-gradient-to-r from-amber-500/15 via-white/[0.04] to-orange-500/15 border border-white/15 p-4 sm:p-5 backdrop-blur-2xl shadow-[0_20px_45px_rgba(0,0,0,0.6)] overflow-hidden">
                {/* Subtle arena background pattern */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                  {/* Fighter 1: The Winner / Champion */}
                  <div className="flex items-center gap-3.5 w-full sm:w-auto flex-1 bg-black/40 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-white/5 sm:border-none">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_25px_rgba(251,191,36,0.4)]">
                        <img
                          src={winnerPhoto}
                          alt={winnerName}
                          className="w-full h-full rounded-[14px] sm:rounded-[22px] object-cover bg-neutral-900 border-2 border-black"
                        />
                      </div>
                      {/* Trophy Badge */}
                      <div
                        className="absolute -top-2 -right-2 bg-gradient-to-tr from-amber-400 to-yellow-300 text-black p-1.5 rounded-full shadow-lg border-2 border-[#0a0a0a]"
                        title="Victor & Feast Champion"
                      >
                        <Trophy size={14} className="fill-black text-black" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-500/25 text-amber-300 border border-amber-500/40">
                        ★Treat Winner
                      </div>
                      <h2 className="text-lg sm:text-xl font-black uppercase italic tracking-tight text-white line-clamp-1 drop-shadow-sm">
                        {winnerName}
                      </h2>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {isWinner ? 'You (Victorious)' : 'Feast Winner'}
                      </p>
                    </div>
                  </div>

                  {/* Sports "VS" Arena Emblem */}
                  <div className="shrink-0 flex items-center justify-center my-0.5 sm:my-0">
                    <div className="relative group">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-neutral-900 via-black to-neutral-900 border-2 border-orange-500/60 shadow-[0_0_25px_rgba(249,115,22,0.45)] flex items-center justify-center transform group-hover:scale-105 transition-transform">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 font-black italic tracking-tighter text-base sm:text-lg drop-shadow">
                          VS
                        </span>
                      </div>
                      <div className="absolute -inset-1 rounded-2xl border border-orange-500/20 animate-pulse pointer-events-none" />
                    </div>
                  </div>

                  {/* Fighter 2: The Sponsor / Debtor */}
                  <div className="flex items-center justify-start sm:justify-end gap-3.5 w-full sm:w-auto flex-1 sm:text-right bg-black/40 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-white/5 sm:border-none flex-row-reverse sm:flex-row">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-white/10 text-gray-300 border border-white/20">
                        The Sponsor
                      </div>
                      <h2 className="text-lg sm:text-xl font-black uppercase italic tracking-tight text-white line-clamp-1 drop-shadow-sm">
                        {event.sponsorName}
                      </h2>
                      <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                        Owes {Math.max(0, targetPlates - completedCount)} {Math.max(0, targetPlates - completedCount) === 1 ? 'Treat' : 'Treats'}
                      </p>
                    </div>

                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-tr from-neutral-700 via-neutral-600 to-neutral-800 shadow-md">
                        <img
                          src={event.sponsorPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'}
                          alt={event.sponsorName}
                          className="w-full h-full rounded-[14px] sm:rounded-[22px] object-cover bg-neutral-900 border-2 border-black"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Story / Lore */}
              {event.story && (
                <p className="text-sm sm:text-base text-gray-300 italic font-medium max-w-2xl pt-1">
                  “{event.story}”
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {!currentUser && (
              <div className="flex items-center gap-3">
                <button
                  onClick={loginWithGoogle}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(249,115,22,0.4)] cursor-pointer active:scale-95"
                >
                  <Trophy size={16} /> Sign In to Join Showdowns
                </button>
              </div>
            )}

            {isWinner && (
              <div className="flex flex-wrap items-center gap-3">
                {!isSettled && (
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest transition-all transform hover:-translate-y-0.5 shadow-[0_0_30px_rgba(249,115,22,0.5)] cursor-pointer"
                  >
                    <Plus size={16} /> Log Feast
                  </button>
                )}

                <button
                  onClick={() => setIsEditFormOpen(true)}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer shadow-md"
                  title="Edit Event Details"
                >
                  <Edit3 size={17} />
                </button>

                <button
                  onClick={handleDelete}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-300 hover:text-red-400 transition-all cursor-pointer shadow-md"
                  title="Delete Event"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN BODY                                                                 */}
      {/* ========================================================================= */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ========================================================================= */}
        {/* PROGRESS METRICS SECTION                                                  */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {/* Card 1: Percentage & Visual Plate Pills */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                Settlement Progress
              </span>
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="text-4xl sm:text-5xl font-black italic tracking-tight text-white">
                  {progressPercent}%
                </h3>
                <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400">
                  {isSettled ? "Honored in Full" : "In Progress"}
                </span>
              </div>
            </div>

            {/* Segmented plate pills */}
            <div className="pt-2">
              <div className="flex gap-1.5 overflow-x-auto py-1">
                {[...Array(targetPlates)].map((_, i) => (
                  <div
                    key={i}
                    title={`Plate #${i + 1}: ${i < completedCount ? 'Claimed' : 'Pending'}`}
                    className={`h-3 flex-1 min-w-[12px] rounded-full transition-all duration-300 ${i < completedCount
                      ? 'bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.6)]'
                      : 'bg-white/10'
                      }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">
                <span>{completedCount} Claimed</span>
                <span>{targetPlates} Total</span>
              </div>
            </div>
          </div>

          {/* Card 2: Status */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 block mb-1">
              Feasts Settled
            </span>
            <h3 className="text-3xl sm:text-4xl font-black italic tracking-tight text-white mb-2">
              {completedCount} <span className="text-gray-500 text-2xl font-bold">/</span> {targetPlates}{' '}
              <span className="text-lg font-black text-amber-400 uppercase tracking-widest">
                {targetPlates === 1 ? 'Meal' : 'Meals'}
              </span>
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Documented with authentic photos and memories.
            </p>
          </div>

          {/* Card 3: Remaining Debts */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-orange-400 block mb-1">
              Pending Collections
            </span>
            <h3 className="text-3xl sm:text-4xl font-black italic tracking-tight text-orange-400 mb-2">
              {Math.max(0, targetPlates - completedCount)}{' '}
              <span className="text-lg font-black text-white uppercase tracking-widest">
                {Math.max(0, targetPlates - completedCount) === 1 ? 'Treat Owed' : 'Treats Owed'}
              </span>
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              {isSettled
                ? 'All debts have been gracefully served and celebrated!'
                : `${event.sponsorName} still owes you ${Math.max(0, targetPlates - completedCount)} feasts.`}
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* EVENT PHOTO GALLERY PREVIEW                                               */}
        {/* ========================================================================= */}
        {galleryImages.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-white flex items-center gap-2.5">
                  <Camera size={22} className="text-orange-500" />
                  Event Gallery
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Visual memories collected across all feasts for this debt ({galleryImages.length} photos)
                </p>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
              {galleryImages.map((img, idx) => (
                <div
                  key={`${img}-${idx}`}
                  onClick={() => setLightboxImage(img)}
                  className="group relative shrink-0 w-48 sm:w-60 h-48 sm:h-60 rounded-3xl overflow-hidden border border-white/10 cursor-pointer shadow-lg snap-start"
                >
                  <img
                    src={img}
                    alt={`Feast memory ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md">
                      <Maximize2 size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* FEAST TIMELINE / LOGS LIST                                                */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-white flex items-center gap-2.5">
                <Utensils size={24} className="text-orange-500" />
                The Feast Ledger
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Detailed timeline of settled treats and shared memories
              </p>
            </div>

            {isWinner && !isSettled && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)]"
              >
                <Plus size={15} /> Log Next Feast
              </button>
            )}
          </div>

          {treats.length === 0 ? (
            <div className="py-20 px-6 rounded-[2.5rem] bg-white/[0.02] border border-dashed border-white/15 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-4">
                <Utensils size={30} />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tight text-white mb-2">
                No Treats Logged Yet
              </h3>
              <p className="text-xs text-gray-400 mb-6 font-medium leading-relaxed">
                When {event.sponsorName} serves your promised feast, record the restaurant, the memories, and upload multiple photos!
              </p>
              {isWinner && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:scale-105 transition-all cursor-pointer"
                >
                  Log Feast #1
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {treats.map((treat, index) => {
                const logPhotos = getTreatPhotos(treat);

                return (
                  <div
                    key={treat.id}
                    className="group rounded-[2rem] bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-orange-500/30 p-6 sm:p-8 backdrop-blur-xl transition-all shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      {/* Left: Stamp Number & Content */}
                      <div className="flex items-start gap-4 sm:gap-6 flex-1">
                        {/* Feast Index Stamp */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-neutral-800 to-black border border-white/10 text-orange-400 flex flex-col items-center justify-center font-black shrink-0 shadow-inner">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Feast</span>
                          <span className="text-xl sm:text-2xl leading-none italic">#{treats.length - index}</span>
                        </div>

                        {/* Title, Date & Memory */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white group-hover:text-orange-400 transition-colors">
                              {treat.occasion}
                            </h3>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/20">
                              <Calendar size={12} /> {treat.date}
                            </span>
                          </div>

                          {treat.memory && (
                            <p className="text-xs sm:text-sm text-gray-300 italic font-medium leading-relaxed bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                              “{treat.memory}”
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Controls (Edit / Delete) */}
                      {isWinner && (
                        <div className="flex items-center gap-2 self-end lg:self-start shrink-0">
                          <button
                            onClick={() => openEditLogForm(treat)}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                            title="Edit Treat Log"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(treat.id)}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                            title="Delete Treat Log"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Multiple Images Grid for this Treat */}
                    {logPhotos.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                          <Camera size={13} className="text-orange-400" />
                          <span>Photos ({logPhotos.length})</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {logPhotos.map((photoUrl, pIdx) => (
                            <div
                              key={`${photoUrl}-${pIdx}`}
                              onClick={() => setLightboxImage(photoUrl)}
                              className="group/thumb relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 cursor-pointer shadow-md"
                            >
                              <img
                                src={photoUrl}
                                alt={`Feast photo ${pIdx + 1}`}
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye size={18} className="text-white drop-shadow" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ========================================================================= */}
      {/* LOG FEAST MODAL (WITH MULTIPLE IMAGE UPLOAD)                               */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-white/15 w-full max-w-2xl rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative my-8">
            <button
              onClick={() => {
                setIsFormOpen(false);
                setPhotos([]);
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
                <Utensils size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase italic text-white">
                  Log Feast
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Record a feast settled by {event.sponsorName}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    When did it happen?*
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Where was it? (Occasion/Place)*
                  </label>
                  <input
                    type="text"
                    required
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="e.g. Sultan's Dine, Dhanmondi"
                    className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Memory Note / Banter (Optional)
                </label>
                <textarea
                  rows="2"
                  value={memory}
                  onChange={(e) => setMemory(e.target.value)}
                  placeholder="How was the food? Any funny moments or spicy confessions?"
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              {/* Multiple Photos Upload Zone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Feast Photos (Multiple Allowed)
                  </label>
                  <span className="text-[11px] font-bold text-orange-400">
                    {photos.length} {photos.length === 1 ? 'photo' : 'photos'} selected
                  </span>
                </div>

                {/* Dropzone */}
                <div className="relative group border-2 border-dashed border-white/15 hover:border-orange-500/50 rounded-2xl p-6 text-center hover:bg-orange-500/[0.02] transition-all cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <UploadCloud className="mx-auto text-gray-400 group-hover:text-orange-400 transition-colors mb-2" size={32} />
                  <p className="text-xs font-bold text-gray-300 group-hover:text-orange-400">
                    Click or drag & drop to choose multiple photos
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Select food plates, group selfies, receipt or funny moments
                  </p>
                </div>

                {/* Selected Photos Preview Thumbnails */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                    {photos.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-white/10 h-20 bg-neutral-900"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload preview ${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeSelectedPhoto(idx)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white p-1 rounded-full transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {uploadProgress && (
                <div className="p-3 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-bold flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                  <span>{uploadProgress}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {uploading ? 'Uploading & Saving...' : 'Save Feast Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT TREAT LOG MODAL (WITH MULTIPLE IMAGE MANAGEMENT)                      */}
      {/* ========================================================================= */}
      {isEditLogFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-white/15 w-full max-w-2xl rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative my-8">
            <button
              onClick={() => setIsEditLogFormOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
                <Edit3 size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase italic text-white">
                  Edit Feast Log
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Update date, restaurant, notes, or photo gallery
                </p>
              </div>
            </div>

            <form onSubmit={handleEditLog} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    When did it happen?*
                  </label>
                  <input
                    type="date"
                    required
                    value={editLogDate}
                    onChange={(e) => setEditLogDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Where was it?*
                  </label>
                  <input
                    type="text"
                    required
                    value={editLogOccasion}
                    onChange={(e) => setEditLogOccasion(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Memory Note
                </label>
                <textarea
                  rows="2"
                  value={editLogMemory}
                  onChange={(e) => setEditLogMemory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              {/* Existing Photos Management */}
              {editExistingPhotos.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 block">
                    Current Photos (Click X to remove)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {editExistingPhotos.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 h-20 bg-neutral-900">
                        <img src={url} alt={`Existing ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeEditExistingPhoto(url)}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors cursor-pointer"
                          title="Delete photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add More Photos */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 block">
                  Add More Photos
                </label>
                <div className="relative group border-2 border-dashed border-white/15 hover:border-orange-500/50 rounded-2xl p-5 text-center hover:bg-orange-500/[0.02] transition-all cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditPhotoSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <UploadCloud className="mx-auto text-gray-400 group-hover:text-orange-400 transition-colors mb-1" size={28} />
                  <p className="text-xs font-bold text-gray-300 group-hover:text-orange-400">
                    Upload additional photos
                  </p>
                </div>

                {editNewPhotos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                    {editNewPhotos.map((file, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-orange-500/50 h-20 bg-neutral-900">
                        <img src={URL.createObjectURL(file)} alt={`New ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeEditNewPhoto(idx)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white p-1 rounded-full transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {uploadProgress && (
                <div className="p-3 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-bold flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                  <span>{uploadProgress}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditLogFormOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {uploading ? 'Saving Updates...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT EVENT MODAL                                                          */}
      {/* ========================================================================= */}
      {isEditFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-white/15 w-full max-w-xl rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative my-8">
            <button
              onClick={() => setIsEditFormOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
                <Edit3 size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase italic text-white">
                  Edit Event
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  Update treat title, goal count, or backstory
                </p>
              </div>
            </div>

            <form onSubmit={handleEdit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Treat Title*
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Treat Count (Minimum {completedCount})*
                </label>
                <input
                  type="number"
                  required
                  min={completedCount}
                  value={editCount}
                  onChange={(e) => setEditCount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Treat Story / Lore
                </label>
                <textarea
                  rows="2"
                  value={editStory}
                  onChange={(e) => setEditStory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-semibold text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">
                  Update Sponsor Avatar (Optional)
                </label>
                <div className="relative group border-2 border-dashed border-white/15 hover:border-orange-500/50 rounded-2xl p-6 text-center hover:bg-orange-500/[0.02] transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditSponsorPhoto(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  {editSponsorPhoto ? (
                    <div className="text-orange-400 font-bold flex flex-col items-center gap-2">
                      <CheckCircle2 size={28} />
                      <span className="text-xs">{editSponsorPhoto.name}</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="mx-auto text-gray-400 group-hover:text-orange-400 transition-colors mb-2" size={28} />
                      <p className="text-xs font-bold text-gray-300 group-hover:text-orange-400">
                        Upload new photo to replace sponsor picture
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditFormOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_25px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {uploading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX FULLSCREEN IMAGE PREVIEW                                         */}
      {/* ========================================================================= */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 p-3 rounded-full transition-colors cursor-pointer shadow-lg"
          >
            <X size={24} />
          </button>
          <img
            src={lightboxImage}
            alt="Full size feast"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
