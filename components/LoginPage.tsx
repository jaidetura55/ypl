import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import GoogleSSOModal, { GoogleSSOButton } from './GoogleSSOModal';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack, onLoginSuccess }) => {
  const { setCurrentUser } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password })
        });
        
        const data = await res.json();
        
        if (data.success) {
            setCurrentUser(data.user);
            try {
              localStorage.setItem('youngpapi_current_user', JSON.stringify(data.user));
            } catch (e) {}
            onLoginSuccess();
        } else {
            setError(data.message || 'Invalid credentials.');
        }
    } catch (err) {
        setError('Connection error. Please check if the backend is online.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[55] bg-slate-900 flex flex-col overflow-y-auto no-scrollbar">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-20%] w-[400px] h-[400px] bg-indigo-600/20 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-pink-600/10 blur-[80px] rounded-full"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 px-6 pt-8 pb-4 flex items-center gap-4">
            <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors backdrop-blur-md"
            >
                <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Login to continue</p>
            </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 px-6 pt-4 pb-8 z-10 max-w-md w-full mx-auto">
            
            {/* Google SSO Primary Login Option */}
            <div className="mb-6 space-y-2">
              <GoogleSSOButton
                onClick={() => setIsGoogleModalOpen(true)}
                text="Continue with Google"
                variant="light"
              />
              <p className="text-[10px] text-center text-slate-400 font-medium">
                Instant 1-click access with your verified Google account
              </p>
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative bg-slate-900 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Or continue with email
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:border-indigo-500 transition-colors">
                        <i className="fa-solid fa-envelope text-slate-500"></i>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="bg-transparent w-full text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Password</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:border-indigo-500 transition-colors">
                        <i className="fa-solid fa-lock text-slate-500"></i>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="bg-transparent w-full text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none"
                            required
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Logging In...
                        </>
                    ) : (
                        <>
                            Login with Email <i className="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                        </>
                    )}
                </button>
            </form>
            
            <div className="mt-8 text-center space-y-3">
                <button 
                  onClick={() => alert("Demo credentials:\nEmail: linda@live.com\nPassword: linda123\n\nOr click 'Continue with Google' for instant access.")} 
                  className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors"
                >
                    Demo credentials / Help
                </button>
            </div>
        </div>

        {/* Google SSO Modal */}
        <GoogleSSOModal
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          onSuccess={() => {
            onLoginSuccess();
          }}
        />
    </div>
  );
};

export default LoginPage;
