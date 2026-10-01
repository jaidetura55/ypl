
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { COUNTRIES } from '../constants';
import GoogleSSOModal, { GoogleSSOButton } from './GoogleSSOModal';

interface RegistrationPageProps {
  onBack: () => void;
  onComplete: () => void;
}

const RegistrationPage: React.FC<RegistrationPageProps> = ({ onBack, onComplete }) => {
  const { setCurrentUser } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    realName: '',
    nickname: '',
    dob: '',
    country: 'ID', // Default Indonesia
    email: '',
    phone: '',
    biodata: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!formData.realName || !formData.nickname || !formData.email || !formData.password || !formData.confirmPassword || !formData.dob) {
        alert("Please fill in all required fields.");
        setIsLoading(false);
        return;
    }

    if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match. Please try again.");
        setIsLoading(false);
        return;
    }

    // Simulate Registration
    setTimeout(() => {
        const newUser = {
            id: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
            name: formData.nickname,
            avatar: 'https://picsum.photos/200',
            email: formData.email,
            bio: formData.biodata,
            dob: formData.dob,
            country: formData.country,
            age: new Date().getFullYear() - new Date(formData.dob).getFullYear(),
            level: 1,
            diamonds: 0,
            beans: 0,
            salary: 0,
            totalSpending: 0,
            followers: 0,
            following: 0,
            isVerified: false,
            status: 'active',
            isPublicProfile: true
        };
        
        setCurrentUser(newUser as any);
        alert("Registration Successful! Welcome to YoungPapi Live.");
        onComplete();
        setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[55] bg-slate-900 flex flex-col overflow-hidden">
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
                <h1 className="text-2xl font-black text-white tracking-tight">Create Account</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Join the community</p>
            </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 overflow-y-auto px-6 pb-safe custom-scrollbar relative z-10 max-w-md w-full mx-auto">
            {/* Quick Google SSO Sign Up */}
            <div className="mt-2 mb-4 space-y-2">
              <GoogleSSOButton
                onClick={() => setIsGoogleModalOpen(true)}
                text="Sign up with Google"
                variant="light"
              />
              <p className="text-[10px] text-center text-slate-400 font-medium">
                Skip the form and sign up instantly with 1-click Google SSO
              </p>
            </div>

            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative bg-slate-900 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Or register manually
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pb-8">
                
                {/* Real Name */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Real Name</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-500 transition-colors">
                        <i className="fa-regular fa-id-card text-slate-500"></i>
                        <input 
                            type="text" 
                            name="realName"
                            value={formData.realName}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="bg-transparent w-full text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Nickname */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Nickname (Username)</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-500 transition-colors">
                        <i className="fa-solid fa-user text-slate-500"></i>
                        <input 
                            type="text" 
                            name="nickname"
                            value={formData.nickname}
                            onChange={handleChange}
                            placeholder="CoolStreamer99"
                            className="bg-transparent w-full text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Date of Birth</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-500 transition-colors">
                        <i className="fa-solid fa-cake-candles text-slate-500"></i>
                        <input 
                            type="date" 
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            className="bg-transparent w-full text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Country (ASEAN)</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-500 transition-colors">
                        <i className="fa-solid fa-earth-asia text-slate-500"></i>
                        <select 
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="bg-transparent w-full text-white text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                        >
                            {COUNTRIES.map(country => (
                                <option key={country.code} value={country.code} className="bg-slate-800 text-white">
                                    {country.flag} {country.name} ({country.code})
                                </option>
                            ))}
                        </select>
                        <i className="fa-solid fa-chevron-down text-slate-500 text-xs ml-auto"></i>
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-500 transition-colors">
                        <i className="fa-solid fa-envelope text-slate-500"></i>
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="bg-transparent w-full text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-500 transition-colors">
                        <i className="fa-solid fa-phone text-slate-500"></i>
                        <input 
                            type="tel" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 234 567 890"
                            className="bg-transparent w-full text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Biodata */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Biodata</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 focus-within:border-indigo-500 transition-colors">
                        <textarea 
                            name="biodata"
                            value={formData.biodata}
                            onChange={handleChange}
                            placeholder="Tell us about yourself..."
                            rows={3}
                            className="bg-transparent w-full text-white text-sm font-medium placeholder:text-slate-600 focus:outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Password</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-500 transition-colors relative">
                        <i className="fa-solid fa-lock text-slate-500"></i>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="bg-transparent w-full text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none pr-8"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-500 transition-colors relative">
                        <i className="fa-solid fa-lock text-slate-500"></i>
                        <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="bg-transparent w-full text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none pr-8"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 text-slate-500 hover:text-white transition-colors"
                        >
                             <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 pb-8">
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                Complete Registration <i className="fa-solid fa-arrow-right"></i>
                            </>
                        )}
                    </button>
                    <p className="text-center text-[10px] text-slate-500 mt-4 px-4 leading-relaxed">
                        By registering, you agree to YoungPapi Live's <span className="text-indigo-400 underline">Terms of Service</span> and <span className="text-indigo-400 underline">Privacy Policy</span>.
                    </p>
                </div>
            </form>
        </div>

        {/* Google SSO Modal */}
        <GoogleSSOModal
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          onSuccess={() => {
            onComplete();
          }}
        />
    </div>
  );
};

export default RegistrationPage;
