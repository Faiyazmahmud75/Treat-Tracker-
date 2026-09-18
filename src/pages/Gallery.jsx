import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { Search, X, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Gallery() {
  const [treats, setTreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const q = query(
          collection(db, "treatLogs"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const galleryItems = [];

        snap.docs.forEach(d => {
          const data = d.data();
          const photos = (data.photoUrls && Array.isArray(data.photoUrls) && data.photoUrls.length > 0)
            ? data.photoUrls
            : (data.photoUrl ? [data.photoUrl] : []);

          photos.forEach((url, pIdx) => {
            galleryItems.push({
              id: `${d.id}-${pIdx}`,
              eventId: data.eventId,
              eventTitle: data.eventTitle,
              receiverName: data.receiverName,
              receiverPhoto: data.receiverPhoto,
              giverName: data.giverName,
              giverPhoto: data.giverPhoto,
              occasion: data.occasion,
              memory: data.memory,
              date: data.date,
              photoUrl: url
            });
          });
        });

        setTreats(galleryItems);
      } catch (err) {
        console.error("Error fetching gallery", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredTreats = treats.filter(t =>
    t.receiverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.giverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.occasion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.memory?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500/30 relative overflow-hidden font-sans">
      {/* Ambient Lighting Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent blur-[140px] pointer-events-none" />

      <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-widest mb-4">
            <Trophy size={14} /> Hall of Fame
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight uppercase italic mb-4">
            The Feast Legacy
          </h1>
          <p className="text-gray-400 font-medium max-w-2xl mx-auto text-sm sm:text-base">
            Every debt paid in full. A visual record of the friendship, the rivalry, and the legendary kacchi feasts.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by restaurant, person, or memory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 py-3.5 pl-11 pr-10 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none transition-all font-semibold text-white placeholder-gray-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-24 text-gray-500 font-black uppercase tracking-widest text-xs animate-pulse">
            Loading Feast Memories...
          </div>
        ) : filteredTreats.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/15 max-w-lg mx-auto">
            <p className="text-gray-400 font-bold text-sm">
              No photos found. {searchTerm && "Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredTreats.map((treat) => (
              <div
                key={treat.id}
                onClick={() => setLightboxImage(treat.photoUrl)}
                className="break-inside-avoid bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden shadow-lg hover:border-orange-500/40 transition-all group relative cursor-pointer"
              >
                <img
                  src={treat.photoUrl}
                  alt={treat.occasion}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={treat.receiverPhoto || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                      alt={treat.receiverName}
                      className="w-6 h-6 rounded-full border border-white/30 object-cover"
                    />
                    <span className="text-white text-xs font-bold">{treat.receiverName}</span>
                    {treat.giverName && (
                      <span className="text-gray-400 text-xs font-medium">sponsored by {treat.giverName}</span>
                    )}
                  </div>
                  <div className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-1">
                    {treat.eventTitle}
                  </div>
                  <h3 className="text-white font-black tracking-tight italic text-lg">{treat.occasion}</h3>
                  {treat.memory && (
                    <p className="text-white/80 text-xs mt-1 line-clamp-2 italic font-normal">“{treat.memory}”</p>
                  )}
                  {treat.eventId && (
                    <Link
                      to={`/event/${treat.eventId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-white uppercase tracking-wider"
                    >
                      View Event Ledger →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
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
