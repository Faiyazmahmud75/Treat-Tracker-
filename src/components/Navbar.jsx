import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  Images, 
  Home as HomeIcon,
  Loader2 
} from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  const { currentUser, loginWithGoogle, logout, isLoggingIn } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu whenever the active route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo */}
          <div className="flex items-center shrink-0 min-w-0 pr-2">
            <Logo size="responsive" />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${
                isActive('/') 
                  ? 'bg-white/10 text-orange-400 shadow-inner' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>
            <Link
              to="/gallery"
              className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${
                isActive('/gallery') 
                  ? 'bg-white/10 text-orange-400 shadow-inner' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Gallery
            </Link>
            {currentUser && (
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${
                  isActive('/dashboard') 
                    ? 'bg-white/10 text-orange-400 shadow-inner' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center gap-3 pl-4 border-l border-white/15">
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-white/5 border border-white/10 hover:border-orange-500/40 text-white hover:text-orange-400 transition-all group"
                  title="Go to Dashboard"
                >
                  <img
                    src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid || 'user'}`}
                    alt={currentUser.name || 'User Profile'}
                    className="w-7 h-7 rounded-full border border-white/20 object-cover bg-neutral-800"
                  />
                  <span className="text-xs font-black tracking-tight max-w-[120px] truncate">
                    {currentUser.name?.split(' ')[0] || 'Profile'}
                  </span>
                </Link>
                <button 
                  onClick={logout} 
                  className="text-white/60 hover:text-red-400 p-2 rounded-full hover:bg-white/10 transition-colors"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={loginWithGoogle} 
                disabled={isLoggingIn}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(249,115,22,0.35)] disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Signing In...
                  </>
                ) : (
                  <>
                    <LogIn size={16} /> Sign In
                  </>
                )}
              </button>
            )}
          </div>

          {/* Mobile Right Controls: Compact Sign In + Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {currentUser ? (
              <Link 
                to="/dashboard" 
                className="flex items-center p-0.5 rounded-full border border-orange-500/50 hover:scale-105 transition-transform"
                title="Dashboard"
              >
                <img
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid || 'user'}`}
                  alt="Profile"
                  className="w-7 h-7 rounded-full object-cover bg-neutral-800"
                />
              </Link>
            ) : (
              <button 
                onClick={loginWithGoogle} 
                disabled={isLoggingIn}
                className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-orange-500 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <LogIn size={13} />
                )}
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={20} className="text-orange-400" /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Overlay & Menu */}
      {mobileOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 top-16 sm:top-20 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-down Panel */}
          <div className="relative z-50 bg-[#0d0d0d]/95 backdrop-blur-2xl border-b border-white/15 px-5 py-6 shadow-2xl space-y-4 animate-fadeIn">
            
            {/* User Profile Card (if logged in) */}
            {currentUser && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid || 'user'}`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border border-orange-500/50 object-cover bg-neutral-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{currentUser.email}</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">
                  Active
                </span>
              </div>
            )}

            {/* Nav Links */}
            <div className="space-y-1.5">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all ${
                  isActive('/') 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                <HomeIcon size={18} /> Home
              </Link>

              <Link
                to="/gallery"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all ${
                  isActive('/gallery') 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Images size={18} /> Gallery
              </Link>

              {currentUser && (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all ${
                    isActive('/dashboard') 
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-white/10">
              {currentUser ? (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-black uppercase tracking-widest transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    loginWithGoogle();
                  }}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn size={16} /> Sign In with Google
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}
