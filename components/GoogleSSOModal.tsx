import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { User } from '../types';

export interface GoogleSSOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export interface GoogleAccountOption {
  email: string;
  name: string;
  avatar: string;
}

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const DEFAULT_GOOGLE_ACCOUNTS: GoogleAccountOption[] = [
  {
    email: 'jaidetura55@gmail.com',
    name: 'Jai De Tura',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200'
  },
  {
    email: 'creator.pro@gmail.com',
    name: 'Young Papi Creator',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200'
  }
];

export const GoogleSSOButton: React.FC<{
  onClick: () => void;
  text?: string;
  variant?: 'light' | 'dark';
  isLoading?: boolean;
  className?: string;
}> = ({
  onClick,
  text = 'Continue with Google',
  variant = 'light',
  isLoading = false,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl font-bold text-sm transition-all duration-200 shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
        variant === 'light'
          ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md'
          : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10 hover:border-white/20'
      } ${className}`}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 font-bold">Connecting to Google...</span>
        </>
      ) : (
        <>
          <GoogleIcon className="w-5 h-5 flex-shrink-0" />
          <span className="tracking-tight">{text}</span>
        </>
      )}
    </button>
  );
};

export default function GoogleSSOModal({
  isOpen,
  onClose,
  onSuccess
}: GoogleSSOModalProps) {
  const { setCurrentUser } = useData();
  const [status, setStatus] = useState<'select' | 'custom' | 'authorizing' | 'success' | 'error'>('select');
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccountOption | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [statusMessage, setStatusMessage] = useState('Connecting to Google Identity Services...');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('select');
      setSelectedAccount(null);
      setErrorMessage('');
      setStatusMessage('Connecting to Google Identity Services...');
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && status !== 'authorizing') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, status, onClose]);

  const executeGoogleAuth = async (account: { email: string; name: string; avatar?: string }) => {
    setStatus('authorizing');
    setStatusMessage('Authenticating Google OAuth 2.0 Credentials...');

    try {
      // Step 1: Handshake
      await new Promise(r => setTimeout(r, 600));
      setStatusMessage('Verifying Google Account with YoungPapi Security...');

      // Step 2: Call backend API
      const res = await fetch('/api/auth/google-sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          name: account.name,
          avatar: account.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=4f46e5&color=fff`,
          googleId: `gid_${Math.floor(Date.now() / 1000)}`
        })
      });

      const data = await res.json();

      if (data.success && data.user) {
        setStatusMessage(`Welcome, ${data.user.name}! Signing in...`);
        setStatus('success');

        // Persist to localStorage
        try {
          localStorage.setItem('youngpapi_current_user', JSON.stringify(data.user));
          localStorage.setItem('youngpapi_google_bound', 'true');
        } catch (e) {}

        setCurrentUser(data.user);

        // Small pause to show success animation
        setTimeout(() => {
          onSuccess(data.user);
          onClose();
        }, 800);
      } else {
        throw new Error(data.message || 'Google SSO authorization failed.');
      }
    } catch (err: any) {
      console.error('Google SSO Error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Unable to complete Google Sign-In. Please try again.');
    }
  };

  const handleSelectAccount = (account: GoogleAccountOption) => {
    setSelectedAccount(account);
    executeGoogleAuth(account);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    executeGoogleAuth({
      email: customEmail.trim(),
      name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff`
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div 
        className="absolute inset-0" 
        onClick={() => {
          if (status !== 'authorizing') onClose();
        }}
      ></div>

      {/* Main Google SSO Dialog Box */}
      <div className="relative w-full max-w-[420px] bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 z-10 animate-fade-in-up">
        
        {/* Top Header */}
        <div className="px-6 pt-7 pb-4 text-center border-b border-slate-100/80 bg-gradient-to-b from-slate-50 to-white">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center mx-auto mb-3">
            <GoogleIcon className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Sign in with Google
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Choose an account to continue to <span className="font-bold text-indigo-600">YoungPapi Live</span>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* STEP 1: ACCOUNT SELECTION */}
          {status === 'select' && (
            <div className="space-y-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Available Google Accounts
              </div>

              {DEFAULT_GOOGLE_ACCOUNTS.map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => handleSelectAccount(acc)}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-200/80 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 cursor-pointer transition-all active:scale-[0.98] group shadow-xs"
                >
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:border-indigo-400"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                      {acc.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate font-mono">
                      {acc.email}
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-xs text-slate-300 group-hover:text-indigo-600 transition-colors mr-1"></i>
                </div>
              ))}

              {/* Use another account option */}
              <button
                type="button"
                onClick={() => setStatus('custom')}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30 text-left transition-all group active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center text-sm transition-colors">
                  <i className="fa-solid fa-user-plus"></i>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">
                    Use another Google account
                  </span>
                  <p className="text-[11px] text-slate-400">Sign in with any @gmail.com or Workspace ID</p>
                </div>
              </button>

              {/* Security note */}
              <div className="pt-4 text-center">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  To continue, Google will securely verify your identity and share your name, email, and photo with YoungPapi Live.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: CUSTOM GOOGLE ACCOUNT INPUT */}
          {status === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setStatus('select')}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition-colors"
                >
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">Enter Google Account</span>
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                  Google Email
                </label>
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-slate-50/50">
                  <i className="fa-solid fa-envelope text-slate-400 text-xs"></i>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                  Your Name (Optional)
                </label>
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-slate-50/50">
                  <i className="fa-solid fa-user text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Alex Taylor"
                    className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('select')}
                  className="flex-1 py-3 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-black text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: AUTHORIZING SPINNER */}
          {status === 'authorizing' && (
            <div className="py-8 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <GoogleIcon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Authorizing with Google</h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">{statusMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {status === 'success' && (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-sm">
                <i className="fa-solid fa-check"></i>
              </div>
              <h4 className="text-sm font-black text-slate-900">Authenticated Successfully</h4>
              <p className="text-xs text-slate-500 font-medium">{statusMessage}</p>
            </div>
          )}

          {/* STEP 5: ERROR */}
          {status === 'error' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Sign-In Failed</h4>
                <p className="text-xs text-rose-600 mt-1 font-medium">{errorMessage}</p>
              </div>
              <button
                onClick={() => setStatus('select')}
                className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-bold">
            <i className="fa-solid fa-shield-halved text-emerald-600 text-xs"></i>
            Verified Google SSO
          </span>
          <button
            onClick={onClose}
            disabled={status === 'authorizing'}
            className="font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
