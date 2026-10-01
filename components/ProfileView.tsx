
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { User, HistoryItem, Transaction } from '../types';
import WalletTopupModal from './WalletTopupModal';
import DailyCheckInModal from './DailyCheckInModal';
import { COUNTRIES } from '../constants';
import ApplyHostModal from './ApplyHostModal';
import ApplyAgencyModal from './ApplyAgencyModal';
import AboutModal from './AboutModal';

interface ProfileViewProps {
  onBack: () => void;
  onSettings: () => void;
  onLogout: () => void;
  onHistory?: () => void;
  onAdmin?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&h=250',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&h=250',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&h=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&h=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&h=250',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&h=250',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&h=250'
];

export default function ProfileView({ onBack, onSettings, onLogout, onHistory, onAdmin }: ProfileViewProps) {
  const { currentUser, updateUser, logout, fetchTransactionHistory } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(currentUser);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showBeansModal, setShowBeansModal] = useState(false);
  const [showDailyCheckInModal, setShowDailyCheckInModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showApplyHostModal, setShowApplyHostModal] = useState(false);
  const [showApplyAgencyModal, setShowApplyAgencyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [hostStatus, setHostStatus] = useState<string | null>(null);
  const [agencyStatus, setAgencyStatus] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    try {
      const hostData = localStorage.getItem('youngpapi_host_application');
      if (hostData) {
        const parsed = JSON.parse(hostData);
        setHostStatus(parsed.status === 'approved' ? 'Verified Host' : 'Under Review');
      } else {
        setHostStatus(null);
      }
      const agencyData = localStorage.getItem('youngpapi_agency_application');
      if (agencyData) {
        const parsed = JSON.parse(agencyData);
        setAgencyStatus(parsed.status === 'approved' ? 'Certified Agency' : 'Under Review');
      } else {
        setAgencyStatus(null);
      }
    } catch (e) {}
  }, [showApplyHostModal, showApplyAgencyModal]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    updateUser(currentUser.id, {
      ...editedUser,
      username: currentUser.username,
      country: editedUser.country || currentUser.country || 'ID'
    });
    setIsEditing(false);
    showToast("Profile & country updated successfully!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image under 5MB");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditedUser(prev => ({ ...prev, avatar: base64 }));
      updateUser(currentUser.id, { avatar: base64 });
      setUploadingAvatar(false);
      setShowAvatarModal(false);
      showToast("Profile picture updated!");
    };
    reader.onerror = () => {
      setUploadingAvatar(false);
      alert("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (presetUrl: string) => {
    setEditedUser(prev => ({ ...prev, avatar: presetUrl }));
    updateUser(currentUser.id, { avatar: presetUrl });
    setShowAvatarModal(false);
    showToast("Profile picture updated!");
  };

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleAIGenerateAvatar = async (styleVariant: string = 'modern') => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedUser.name || currentUser.name,
          bio: editedUser.bio || currentUser.bio,
          style: styleVariant
        })
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data && data.avatarUrl) {
        setEditedUser(prev => ({ ...prev, avatar: data.avatarUrl }));
        updateUser(currentUser.id, { avatar: data.avatarUrl });
        setShowAvatarModal(false);
        showToast("AI Avatar updated successfully!");
      } else {
        throw new Error('No avatar received');
      }
    } catch (err) {
      console.warn('AI Avatar generation network fallback:', err);
      const fallbackSeed = `papi-${encodeURIComponent((editedUser.name || currentUser.name).replace(/[^a-zA-Z0-9]/g, ''))}-${Date.now()}`;
      const fallbackUrl = `https://api.dicebear.com/9.x/lorelei/svg?seed=${fallbackSeed}&backgroundColor=6366f1,ec4899,8b5cf6,3b82f6&backgroundType=gradientLinear`;
      setEditedUser(prev => ({ ...prev, avatar: fallbackUrl }));
      updateUser(currentUser.id, { avatar: fallbackUrl });
      setShowAvatarModal(false);
      showToast("AI Avatar generated!");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const openHistory = async () => {
    setIsLoadingHistory(true);
    setShowHistoryModal(true);
    try {
      const history = await fetchTransactionHistory();
      setTransactions(history);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCleanExit = () => {
    try {
      localStorage.removeItem('youngpapi_current_user');
      localStorage.removeItem('youngpapi_google_bound');
      sessionStorage.clear();
    } catch (e) {}
    logout();
    setShowLogoutModal(false);
    onLogout();
  };

  const currentDisplayUsername = currentUser.username || currentUser.name.toLowerCase().replace(/[^a-z0-9_]/g, '');

  return (
    <div className="flex flex-col h-full max-h-full bg-slate-50 relative overflow-hidden">
      {/* Hidden File Input for Avatar Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 text-xs font-bold flex items-center gap-2 animate-bounce">
          <i className="fa-solid fa-circle-check text-emerald-400 text-sm"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (isEditing) {
                setEditedUser({ ...currentUser });
                setIsEditing(false);
              } else {
                onBack();
              }
            }} 
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
            title={isEditing ? "Back (Cancel)" : "Back to Browse"}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          {!isEditing && (
            <button onClick={onSettings} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100">
              <i className="fa-solid fa-cog"></i>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            {isEditing ? 'Edit Profile' : 'Me'}
          </h2>
          {!isEditing && (
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
              VIP 2
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button 
                type="button"
                onClick={() => {
                  setEditedUser({ ...currentUser });
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 rounded-full font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-full font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors cursor-pointer"
              >
                Save
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-1.5 rounded-full font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-28 overscroll-contain">
        {/* Profile Card */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          
          {/* Avatar with Upload & Camera Overlay */}
          <div className="relative mb-3 group">
            <div 
              onClick={() => setShowAvatarModal(true)}
              className="relative cursor-pointer"
            >
              <img 
                src={editedUser.avatar || currentUser.avatar} 
                className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover bg-slate-100 transition-transform group-hover:scale-105" 
                alt="avatar" 
              />
              
              {/* Camera Action Badge */}
              <div 
                className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-transform active:scale-95 z-10"
                title="Change Profile Picture"
              >
                {uploadingAvatar ? (
                  <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                ) : (
                  <i className="fa-solid fa-camera text-xs"></i>
                )}
              </div>

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[9px] font-bold">
                <i className="fa-solid fa-camera text-sm mb-0.5"></i>
                <span>Change Photo</span>
              </div>
            </div>

            {currentUser.isVerified && (
              <div className="absolute top-0 right-0 w-6 h-6 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px]">
                <i className="fa-solid fa-check"></i>
              </div>
            )}
          </div>

          {/* Quick Avatar Change Buttons */}
          <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-upload text-[10px]"></i>
              <span>Upload</span>
            </button>
            <button
              onClick={() => handleAIGenerateAvatar('modern')}
              disabled={isGeneratingAI}
              className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Generate new AI avatar"
            >
              {isGeneratingAI ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin text-[10px]"></i>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
                  <span>AI Avatar</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowAvatarModal(true)}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-images text-[10px]"></i>
              <span>Presets</span>
            </button>
          </div>
          
          {/* Editable Username & Display Name Section */}
          {isEditing ? (
            <div className="w-full space-y-3.5 mb-4 text-left">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Display Name
                </label>
                <input 
                  type="text" 
                  value={editedUser.name} 
                  onChange={e => setEditedUser({...editedUser, name: e.target.value})}
                  placeholder="Enter Display Name"
                  className="text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 ring-indigo-500 w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Username (@handle)
                  </label>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <i className="fa-solid fa-lock text-[8px]"></i> Permanent
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                  <input 
                    type="text" 
                    value={currentDisplayUsername} 
                    disabled
                    readOnly
                    className="text-base font-mono font-bold text-slate-500 bg-slate-100/90 border border-slate-200 rounded-xl pl-8 pr-9 py-2.5 w-full cursor-not-allowed select-none"
                  />
                  <i className="fa-solid fa-lock absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">@handle name is fixed to protect your account identity and live room link.</p>
              </div>

              {/* ASEAN Country Selection inside Edit Profile */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Country (ASEAN)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">
                    {COUNTRIES.find(c => c.code === (editedUser.country || 'ID'))?.flag || '🇮🇩'}
                  </span>
                  <select
                    value={editedUser.country || 'ID'}
                    onChange={e => setEditedUser({...editedUser, country: e.target.value})}
                    className="text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 focus:outline-none focus:ring-2 ring-indigo-500 w-full appearance-none cursor-pointer"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <h3 className="text-2xl font-black text-slate-900 mb-0.5">{currentUser.name}</h3>
              <p className="text-sm font-mono font-bold text-indigo-600 flex items-center justify-center gap-1">
                <span>@{currentDisplayUsername}</span>
              </p>
            </div>
          )}
          
          <div className="flex items-center flex-wrap justify-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-md text-[10px] font-black uppercase">Lv.{currentUser.level}</span>
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest font-mono">ID: {currentUser.id}</span>
            
            {/* ASEAN Country Badge */}
            {(() => {
              const matchedCountry = COUNTRIES.find(c => c.code === (currentUser.country || 'ID'));
              return (
                <span 
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-black border border-slate-200"
                  title={`ASEAN Region: ${matchedCountry?.name || 'Indonesia'}`}
                >
                  <span className="text-xs">{matchedCountry?.flag || '🇮🇩'}</span>
                  <span>{matchedCountry?.name || 'Indonesia'}</span>
                </span>
              );
            })()}

            {currentUser.isGoogleBound && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black border border-blue-200" title={`Connected via Google: ${currentUser.email || 'jaidetura55@gmail.com'}`}>
                <i className="fa-brands fa-google text-[9px]"></i> Google
              </span>
            )}
          </div>

          {/* Following and Followers Row */}
          <div className="grid grid-cols-2 w-full gap-4 py-3.5 border-t border-slate-100">
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-slate-900 tracking-tight">{currentUser.following.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Following</span>
            </div>
            <div className="flex flex-col items-center border-l border-slate-100">
              <span className="text-xl font-black text-slate-900 tracking-tight">{currentUser.followers.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Followers</span>
            </div>
          </div>

          {/* DIAMONDS Balance Bellow Following and Followers, and beside Diamond add Beans */}
          <div className="grid grid-cols-2 w-full gap-3 py-3 border-t border-b border-slate-100">
            {/* Diamonds Balance */}
            <div 
              onClick={() => setShowTopupModal(true)} 
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cyan-50/70 hover:bg-cyan-100/50 border border-cyan-200/70 transition-all cursor-pointer group active:scale-[0.98] shadow-2xs"
              title="Top up Diamonds"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 flex items-center justify-center text-xs shadow-2xs group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-gem"></i>
                </div>
                <span className="text-lg font-black text-cyan-800 font-mono tracking-tight">
                  {currentUser.diamonds.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700">Diamonds</span>
                <span className="text-[9px] bg-cyan-600 text-white font-black px-1.5 py-0.5 rounded-full shadow-2xs flex items-center gap-0.5 group-hover:bg-cyan-700 transition-colors">
                  <i className="fa-solid fa-plus text-[7px]"></i> Top Up
                </span>
              </div>
            </div>

            {/* Beans Balance (Beside Diamond) */}
            <div 
              onClick={() => setShowBeansModal(true)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/50 border border-amber-200/70 transition-all cursor-pointer group active:scale-[0.98] shadow-2xs"
              title="Creator Beans (Earnings)"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center text-xs shadow-2xs group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-coins"></i>
                </div>
                <span className="text-lg font-black text-amber-800 font-mono tracking-tight">
                  {(currentUser.beans ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Beans</span>
                <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded-full shadow-2xs group-hover:bg-amber-600 transition-colors">
                  Earnings
                </span>
              </div>
            </div>
          </div>

          <div className="w-full mt-4 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block px-1">Bio</label>
            {isEditing ? (
              <textarea 
                value={editedUser.bio || ''} 
                onChange={e => setEditedUser({...editedUser, bio: e.target.value})}
                placeholder="Write something about yourself..."
                className="w-full bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 focus:outline-none focus:ring-2 ring-indigo-500 min-h-[100px] resize-none border border-slate-200"
              />
            ) : (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-2xl p-4 min-h-[60px]">
                {currentUser.bio || "No bio yet. Tap edit to add one!"}
              </p>
            )}
          </div>
        </div>

        {/* Diamond Wallet Balance Card (Google Wallet & FPX Supported) */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl border border-white/10">
          {/* Subtle Ambient Glowing Orbs */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Bar inside Card */}
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-sm shadow-inner">
                <i className="fa-solid fa-gem"></i>
              </div>
              <div>
                <span className="text-xs font-black tracking-wide uppercase text-white block">
                  Diamond Wallet
                </span>
                <span className="text-[10px] text-slate-400">Available Spending Balance</span>
              </div>
            </div>

            <button
              onClick={openHistory}
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <i className="fa-solid fa-clock-rotate-left text-xs"></i>
              <span>History</span>
            </button>
          </div>

          {/* Large Balance Display */}
          <div className="my-4 relative z-10">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 font-mono tracking-tight">
                {currentUser.diamonds.toLocaleString()}
              </span>
              <span className="text-cyan-400 font-black text-sm uppercase tracking-wider flex items-center gap-1">
                Diamonds <i className="fa-solid fa-sparkles text-xs animate-pulse"></i>
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-1">
              Estimated Value: <span className="text-slate-200 font-mono font-bold">RM {(currentUser.diamonds * 0.045).toFixed(2)} MYR</span> • <span className="text-slate-300 font-mono font-bold">${(currentUser.diamonds * 0.01).toFixed(2)} USD</span>
            </p>
          </div>

          {/* Quick Payment Badges: Google Wallet & FPX */}
          <div className="pt-2 pb-4 border-t border-white/10 flex flex-wrap items-center gap-2 relative z-10 text-[10px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mr-1">Fast Recharge:</span>
            
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white font-bold">
              <span className="text-blue-400 font-black">G</span>
              <span>Google Wallet</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-500/30 text-rose-300 font-bold">
              <span className="bg-red-600 text-white text-[8px] font-black px-1 rounded">FPX</span>
              <span>Online Banking</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <button
              onClick={() => setShowTopupModal(true)}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-all active:scale-[0.98]"
            >
              <i className="fa-solid fa-circle-plus text-sm"></i>
              <span>Recharge Diamonds</span>
            </button>

            <button
              onClick={openHistory}
              className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <i className="fa-solid fa-receipt text-slate-300"></i>
              <span>Transactions</span>
            </button>
          </div>
        </div>

        {/* Viewing History */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-indigo-500"></i>
              Recent History
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">{currentUser.viewingHistory?.length || 0} items</span>
              {onHistory && (
                <button
                  onClick={onHistory}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 active:scale-95"
                  title="Open full History tab"
                >
                  <span>View All</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </button>
              )}
            </div>
          </h4>
          
          <div className="space-y-3">
            {currentUser.viewingHistory && currentUser.viewingHistory.length > 0 ? (
              currentUser.viewingHistory.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl group hover:bg-indigo-50 transition-colors">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                    <i className="fa-solid fa-play"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-black text-slate-900 truncate">{item.streamTitle}</h5>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">by {item.broadcasterName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400">{formatDate(item.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-300">
                  <i className="fa-solid fa-ghost"></i>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No history yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Host & Agency Hub (Apply Host & Apply Agency) */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center text-xs shadow-md shadow-indigo-500/20">
                <i className="fa-solid fa-briefcase"></i>
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Host & Agency Hub
              </h4>
            </div>
            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Partnership
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Apply Host Card */}
            <div
              onClick={() => setShowApplyHostModal(true)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-slate-50 hover:from-indigo-100/70 hover:to-indigo-50/50 border border-indigo-100/80 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-base shadow-md shadow-indigo-600/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-microphone-lines"></i>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Apply Host
                    </h5>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                      hostStatus === 'Verified Host'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : hostStatus === 'Under Review'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-indigo-600 text-white shadow-2xs'
                    }`}>
                      {hostStatus || 'Recruiting'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    Become an official verified host & earn Beans rewards
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-300 transition-colors flex-shrink-0">
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </div>
            </div>

            {/* Apply Agency Card */}
            <div
              onClick={() => setShowApplyAgencyModal(true)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-cyan-50/70 to-slate-50 hover:from-cyan-100/70 hover:to-cyan-50/50 border border-cyan-100/80 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-11 h-11 rounded-2xl bg-cyan-600 text-white flex items-center justify-center text-base shadow-md shadow-cyan-600/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-building-user"></i>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-xs font-black text-slate-900 group-hover:text-cyan-700 transition-colors">
                      Apply Agency
                    </h5>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                      agencyStatus === 'Certified Agency'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : agencyStatus === 'Under Review'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-cyan-600 text-white shadow-2xs'
                    }`}>
                      {agencyStatus || 'Guild Partner'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    Register your talent agency & earn management commissions
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-cyan-600 group-hover:border-cyan-300 transition-colors flex-shrink-0">
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </div>
            </div>
          </div>
        </div>

        {/* System & Preferences Section (Settings & About) */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs">
              <i className="fa-solid fa-sliders"></i>
            </div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Preferences & Info
            </h4>
          </div>

          <div className="space-y-2.5">
            {/* Settings Card */}
            <div
              onClick={onSettings}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-200/80 text-slate-700 flex items-center justify-center text-sm shadow-2xs flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <i className="fa-solid fa-gear"></i>
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Settings
                  </h5>
                  <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                    Account, stream quality, notifications & privacy
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0">
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </div>
            </div>

            {/* Admin Console Card */}
            {onAdmin && (
              <div
                onClick={onAdmin}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-100 transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 text-white flex items-center justify-center text-sm shadow-2xs flex-shrink-0">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-black text-indigo-950 group-hover:text-indigo-600 transition-colors">
                        Admin Dashboard
                      </h5>
                      <span className="text-[9px] font-bold text-indigo-600 bg-white px-1.5 py-0.2 rounded border border-indigo-200">
                        Port 3001
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-400 font-medium truncate mt-0.5">
                      Operations, stream moderation & user management
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 transition-colors flex-shrink-0">
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </div>
              </div>
            )}

            {/* About Card */}
            <div
              onClick={() => setShowAboutModal(true)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm shadow-2xs flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <i className="fa-solid fa-circle-info"></i>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      About YoungPapi Live
                    </h5>
                    <span className="text-[9px] font-bold text-slate-400 font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      v2.4.0
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                    Terms of Service, Privacy Policy & Community Guidelines
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0">
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Exit Logout Section */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg shadow-inner">
                <i className="fa-solid fa-power-off"></i>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Session & Security</h4>
                <p className="text-[11px] text-slate-400 font-medium">End your active session securely</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              Active
            </span>
          </div>

          <button 
            onClick={() => setShowLogoutModal(true)}
            className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-base group-hover:translate-x-0.5 transition-transform"></i>
            <span>Log Out & Clean Exit</span>
          </button>
        </div>
      </div>

      {/* Avatar Selection Modal / Presets */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2rem] p-6 shadow-2xl flex flex-col text-slate-900">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                  <i className="fa-solid fa-camera"></i>
                </div>
                <h3 className="text-base font-black">Profile Picture</h3>
              </div>
              <button 
                onClick={() => setShowAvatarModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* Device Upload Option */}
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                disabled={uploadingAvatar}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                {uploadingAvatar ? (
                  <i className="fa-solid fa-spinner animate-spin"></i>
                ) : (
                  <i className="fa-solid fa-upload"></i>
                )}
                <span>Upload from Device (Gallery / Files)</span>
              </button>

              {/* AI Avatar Generator Section in Modal */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-3 border border-indigo-100 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-wand-magic-sparkles text-indigo-600"></i>
                    AI Avatar Studio
                  </span>
                  <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase">Instant</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAIGenerateAvatar('modern')}
                    disabled={isGeneratingAI}
                    className="py-2 px-2 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>✨ Studio</span>
                  </button>
                  <button
                    onClick={() => handleAIGenerateAvatar('anime')}
                    disabled={isGeneratingAI}
                    className="py-2 px-2 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>🎨 Anime</span>
                  </button>
                  <button
                    onClick={() => handleAIGenerateAvatar('cyberpunk')}
                    disabled={isGeneratingAI}
                    className="py-2 px-2 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-slate-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>⚡ Cyber</span>
                  </button>
                </div>
              </div>

              {/* Preset Avatars Grid */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Or Pick a Preset Avatar:
                </span>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(url)}
                      className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-transform hover:scale-105 active:scale-95 ${
                        (editedUser.avatar || currentUser.avatar) === url ? 'border-indigo-600 ring-2 ring-indigo-400' : 'border-slate-100 hover:border-indigo-300'
                      }`}
                    >
                      <img src={url} alt={`preset ${idx}`} className="w-full h-full object-cover" />
                      {(editedUser.avatar || currentUser.avatar) === url && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center text-white text-xs">
                          <i className="fa-solid fa-check"></i>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diamond Wallet Top Up Modal with Google Wallet & FPX */}
      <WalletTopupModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        onSuccess={() => {
          fetchTransactionHistory().then(setTransactions);
        }}
      />

      {/* Wallet History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-5 flex flex-col max-h-[80vh] shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                <h3 className="text-base font-black text-slate-900">Wallet Transactions</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
              {isLoadingHistory ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold flex items-center justify-center gap-2">
                  <i className="fa-solid fa-spinner animate-spin"></i> Loading transactions...
                </div>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div key={tx.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        tx.type === 'topup' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : tx.type === 'gift_received' 
                            ? 'bg-cyan-100 text-cyan-700' 
                            : 'bg-rose-100 text-rose-700'
                      }`}>
                        {tx.type === 'topup' ? 'Diamond Recharge' : tx.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 mt-1">{tx.description}</div>
                    
                    <div className="mt-2 text-xs font-mono flex justify-between items-center pt-1.5 border-t border-slate-100">
                      <span className={`font-black ${tx.type === 'topup' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {tx.type === 'topup' ? '+' : '-'}{tx.amount.toLocaleString()} 💎
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs font-bold">
                  No transactions yet. Recharge with Google Wallet or FPX!
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setShowTopupModal(true);
                }}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <i className="fa-solid fa-gem text-xs"></i>
                <span>Top Up More Diamonds</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creator Beans Modal */}
      {showBeansModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-100 flex flex-col text-slate-900 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">
              <i className="fa-solid fa-coins"></i>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Creator Beans Balance
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Beans are creator rewards earned from gifts during your live streams.
            </p>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-black text-amber-800 font-mono">
                  {(currentUser.beans ?? 0).toLocaleString()}
                </span>
                <span className="text-xs font-black uppercase text-amber-600 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  Beans
                </span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-amber-200/60 flex justify-around text-[11px] text-slate-600 font-semibold">
                <span>Value: <strong className="text-slate-800 font-mono">${(((currentUser.beans ?? 0) / 210).toFixed(2))} USD</strong></span>
                <span>•</span>
                <span>Rate: <strong className="text-slate-800 font-mono">210 Beans = $1</strong></span>
              </div>
            </div>

            <div className="space-y-2.5 w-full">
              <button
                onClick={() => {
                  setShowBeansModal(false);
                  setShowDailyCheckInModal(true);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-calendar-check text-xs"></i>
                <span>Daily Check-in Streak (+Bonus Beans)</span>
              </button>

              <button
                onClick={() => {
                  setShowBeansModal(false);
                  onSettings();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-building-columns text-xs"></i>
                <span>Withdraw to Bank Account</span>
              </button>

              <button
                onClick={() => setShowBeansModal(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Exit Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-slate-100 flex flex-col text-slate-900 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm">
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Log Out & Clean Exit?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              You will be signed out of <span className="font-bold text-slate-800">@{currentDisplayUsername}</span>. All session credentials will be cleared and you'll be safely returned to the welcome screen.
            </p>

            <div className="space-y-2.5 w-full">
              <button
                onClick={handleCleanExit}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-check"></i>
                <span>Yes, Log Out & Exit</span>
              </button>

              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel / Stay Signed In
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Daily Check-in Modal */}
      <DailyCheckInModal 
        isOpen={showDailyCheckInModal} 
        onClose={() => setShowDailyCheckInModal(false)} 
      />

      {/* Apply for Official Host Modal */}
      <ApplyHostModal
        isOpen={showApplyHostModal}
        onClose={() => setShowApplyHostModal(false)}
        currentUser={currentUser}
        onApplicationSuccess={() => {
          setHostStatus('Under Review');
          showToast('Host application submitted! Check inbox for updates.');
        }}
      />

      {/* Apply for Agency Partnership Modal */}
      <ApplyAgencyModal
        isOpen={showApplyAgencyModal}
        onClose={() => setShowApplyAgencyModal(false)}
        currentUser={currentUser}
        onApplicationSuccess={() => {
          setAgencyStatus('Under Review');
          showToast('Agency application submitted! Check inbox for updates.');
        }}
      />

      {/* About YoungPapi Live Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </div>
  );
}
