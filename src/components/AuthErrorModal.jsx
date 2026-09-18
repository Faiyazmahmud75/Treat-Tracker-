import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink, X, ShieldAlert } from 'lucide-react';

export default function AuthErrorModal({ error, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const handleCopy = () => {
    if (error.domain) {
      navigator.clipboard.writeText(error.domain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isDomainError = error.type === 'UNAUTHORIZED_DOMAIN';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#141414] border border-orange-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(249,115,22,0.25)] text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Icon & Heading */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 text-orange-400">
            {isDomainError ? <ShieldAlert size={26} /> : <AlertTriangle size={26} />}
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight">{error.title || 'Authentication Notice'}</h3>
            <p className="text-xs text-orange-400/80 font-bold uppercase tracking-wider mt-0.5">
              {isDomainError ? 'Firebase Security Configuration' : 'Sign In Assistance'}
            </p>
          </div>
        </div>

        {/* Explanation Message */}
        <p className="text-gray-300 text-sm leading-relaxed mb-6">
          {error.message}
        </p>

        {/* Domain Copy Box for UNAUTHORIZED_DOMAIN */}
        {isDomainError && error.domain && (
          <div className="mb-6 space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 block">
              Domain to authorize:
            </label>
            <div className="flex items-center justify-between gap-3 bg-black/60 border border-white/10 rounded-2xl px-4 py-3">
              <span className="font-mono text-sm text-orange-300 select-all truncate">
                {error.domain}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check size={14} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy
                  </>
                )}
              </button>
            </div>

            {/* Quick Resolution Steps */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-300 space-y-2">
              <p className="font-black text-white uppercase tracking-wider text-[10px]">How to fix in 30 seconds:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-gray-400">
                <li>Go to <strong className="text-white">Firebase Console</strong> → Select your project</li>
                <li>Navigate to <strong className="text-white">Authentication</strong> → <strong className="text-white">Settings</strong> tab</li>
                <li>Scroll down to <strong className="text-white">Authorized domains</strong></li>
                <li>Click <strong className="text-white">Add domain</strong> and paste <code className="text-orange-300 font-mono">{error.domain}</code></li>
              </ol>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {isDomainError && (
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
            >
              Open Firebase Console <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Got It, Close
          </button>
        </div>
      </div>
    </div>
  );
}
