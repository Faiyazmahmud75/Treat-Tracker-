import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, googleProvider, signInWithPopup, signOut } from '../firebase';
import { LogIn, LogOut } from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  const { currentUser } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          <div className="flex items-center">
            <Logo size="md" />
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/gallery" className="text-white/80 hover:text-white font-bold text-sm tracking-wide uppercase transition-colors">
              Gallery
            </Link>
            {currentUser ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/20">
                <Link to="/dashboard" className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors">
                  <img
                    src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid || 'user'}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border border-white/20 object-cover bg-neutral-800"
                  />
                  <span className="text-sm font-bold hidden sm:block">{currentUser.name?.split(' ')[0] || 'Profile'}</span>
                </Link>
                <button onClick={handleLogout} className="text-white/70 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/10">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="ml-4 flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all">
                <LogIn size={16} /> Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
