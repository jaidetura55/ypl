
import React, { useState, useEffect } from 'react';
import AdminPanel from './components/AdminPanel';

const AdminSplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing Secure Kernel...');

  useEffect(() => {
    const stages = [
      { p: 20, s: 'Loading Encrypted Assets...' },
      { p: 45, s: 'Establishing Secure Handshake...' },
      { p: 70, s: 'Verifying Admin Privileges...' },
      { p: 90, s: 'Finalizing Console Interface...' },
      { p: 100, s: 'Ready' }
    ];

    let currentStage = 0;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 800);
          return 100;
        }
        
        const nextP = p + 2;
        if (currentStage < stages.length && nextP >= stages[currentStage].p) {
          setStatus(stages[currentStage].s);
          currentStage++;
        }
        return nextP;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
      
      <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(79,70,229,0.3)] animate-pulse">
        <i className="fa-solid fa-shield-halved text-4xl text-white"></i>
      </div>
      
      <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">
        YoungPapi <span className="text-indigo-500">Console</span>
      </h1>
      <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mb-10">{status}</p>
      
      <div className="w-64 h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
        <div 
          className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] transition-all duration-100 ease-linear" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="mt-6 flex items-center gap-2">
        <span className="text-[9px] font-mono text-indigo-500/50 uppercase tracking-widest">Security Level: Maximum</span>
      </div>
    </div>
  );
};

const AdminLandingPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020617] justify-center items-center p-8 text-center overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-slate-800/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
            <div className="w-28 h-28 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl transform hover:rotate-6 transition-transform duration-500">
                <i className="fa-solid fa-user-gear text-5xl text-white"></i>
            </div>
            
            <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">
                Management <span className="text-indigo-500">Gateway</span>
            </h1>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.2em] mb-12 max-w-md leading-relaxed">
                Authorized Personnel Only. <br/>
                <span className="text-slate-600 text-xs">Accessing this system without permission is strictly prohibited.</span>
            </p>
            
            <div className="w-full max-w-xs space-y-4">
                <button 
                    onClick={onEnter} 
                    className="group w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-[0_20px_40px_rgba(79,70,229,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    <span>Enter Console</span>
                    <i className="fa-solid fa-arrow-right transition-transform group-hover:translate-x-1"></i>
                </button>
                
                <div className="pt-8 flex items-center justify-center gap-6 opacity-40">
                    <i className="fa-solid fa-lock text-white text-xl"></i>
                    <i className="fa-solid fa-server text-white text-xl"></i>
                    <i className="fa-solid fa-database text-white text-xl"></i>
                </div>
            </div>
        </div>
        
        <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-[9px] font-mono text-slate-700 uppercase tracking-[0.5em]">YoungPapi OS v4.2.0 // Secure Node</p>
        </div>
    </div>
  );
};

export const AdminApp: React.FC = () => {
  const [appState, setAppState] = useState<'splash' | 'landing' | 'login'>('splash');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dynamically determine the API base URL
  const getApiBase = () => {
      return ''; // Use relative paths
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
        const response = await fetch(`/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            if (data.user.role === 'admin') {
                setIsAuthenticated(true);
            } else {
                alert('Access Denied: You do not have administrator privileges.');
            }
        } else {
            alert(data.message || 'Login Failed: Invalid credentials.');
        }
    } catch (error) {
        console.error("Login connection error:", error);
        alert(`Connection Error: Unable to reach backend. Ensure your Node.js server is running.`);
    } finally {
        setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return <AdminPanel onExit={() => setIsAuthenticated(false)} />;
  }

  if (appState === 'splash') {
    return <AdminSplashScreen onComplete={() => setAppState('landing')} />;
  }

  if (appState === 'landing') {
    return <AdminLandingPage onEnter={() => setAppState('login')} />;
  }

  return (
    <div className="h-full w-full bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <button 
        onClick={() => setAppState('landing')}
        className="absolute top-8 left-8 z-20 text-slate-500 hover:text-white transition-colors flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest"
      >
        <i className="fa-solid fa-chevron-left"></i>
        <span>Back</span>
      </button>

      <div className="absolute inset-0 bg-slate-950/50 pointer-events-none"></div>
      {/* Decorative Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl shadow-xl mb-6 transform rotate-3">
             <i className="fa-solid fa-shield-halved text-4xl text-white"></i>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
            YoungPapi <span className="text-indigo-500">Console</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Secure Management Gateway</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Admin Identity</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <i className="fa-solid fa-user-shield"></i>
                    </div>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 font-bold placeholder:text-slate-700 transition-colors" 
                        placeholder="Username or Email" 
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Secure Passkey</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <i className="fa-solid fa-key"></i>
                    </div>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 font-bold placeholder:text-slate-700 transition-colors" 
                        placeholder="••••••••" 
                        required
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full py-4.5 bg-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                  <>
                    <span>Initialize Session</span>
                    <i className="fa-solid fa-arrow-right-long text-xs"></i>
                  </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-2">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Environment Status</span>
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-mono text-emerald-500/80">{window.location.hostname}</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
