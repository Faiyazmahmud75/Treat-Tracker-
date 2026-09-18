import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', showText = true, className = '', to = '/' }) {
  const sizeMap = {
    xs: {
      img: 'w-6 h-6',
      title: 'text-base',
      badge: 'text-[8px] px-1 py-0.2'
    },
    sm: {
      img: 'w-8 h-8',
      title: 'text-lg',
      badge: 'text-[9px] px-1.5 py-0.5'
    },
    md: {
      img: 'w-10 h-10',
      title: 'text-xl',
      badge: 'text-[10px] px-2 py-0.5'
    },
    lg: {
      img: 'w-14 h-14',
      title: 'text-3xl',
      badge: 'text-xs px-2.5 py-1'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Brand Icon Emblem */}
      <div className="relative shrink-0">
        <div className={`${currentSize.img} rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all transform group-hover:scale-105 duration-300`}>
          <img
            src="/logo.png"
            alt="Treat Tracker"
            className="w-full h-full object-cover rounded-[10px] bg-black"
          />
        </div>
        {/* Ambient glow behind icon */}
        <div className="absolute -inset-1 bg-orange-500/30 rounded-xl blur-sm opacity-50 group-hover:opacity-100 transition-opacity -z-10" />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`${currentSize.title} font-black italic tracking-tighter text-white drop-shadow-sm`}>
              Treat<span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400">Tracker</span>
            </span>
            <span className={`${currentSize.badge} font-black uppercase tracking-widest rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 hidden sm:inline-block`}>
              LEDGER
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="transition-transform active:scale-95">
        {content}
      </Link>
    );
  }

  return content;
}
