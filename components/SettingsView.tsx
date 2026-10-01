
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { COUNTRIES } from '../constants';
import { Transaction } from '../types';
import WalletTopupModal from './WalletTopupModal';
import GoogleSSOModal from './GoogleSSOModal';

interface SettingsViewProps {
  onBack: () => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onLogout }) => {
  const { currentUser, updateUser, deleteAccount, reportProblem, logout, topUpDiamonds, fetchTransactionHistory } = useData();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showGoogleSSOModal, setShowGoogleSSOModal] = useState(false);
  
  // Wallet & Withdraw States
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Profile State
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username || currentUser.name.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  const [bio, setBio] = useState(currentUser.bio || '');
  const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
  };
  const [dob, setDob] = useState(formatDate(currentUser.dob));
  const [country, setCountry] = useState(currentUser.country || 'ID');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [themeColor, setThemeColor] = useState(currentUser.themeColor || 'indigo');
  const [isPublicProfile, setIsPublicProfile] = useState(currentUser.isPublicProfile ?? true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    setName(currentUser.name);
    setUsername(currentUser.username || currentUser.name.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    setBio(currentUser.bio || '');
    setDob(formatDate(currentUser.dob));
    setCountry(currentUser.country || 'ID');
    setAvatar(currentUser.avatar);
    setThemeColor(currentUser.themeColor || 'indigo');
    setIsPublicProfile(currentUser.isPublicProfile ?? true);
  }, [currentUser]);

  const loadHistory = async () => {
      const history = await fetchTransactionHistory();
      setTransactions(history);
      setShowHistoryModal(true);
  };

  const calculateAge = (birthDateString: string) => {
      if (!birthDateString) return 0;
      const today = new Date();
      const birthDate = new Date(birthDateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  };

  const currentAge = calculateAge(dob);
  const activeCountryData = COUNTRIES.find(c => c.code === country);

  const handleSaveProfile = async () => {
    setIsUploading(true);
    // Simulate API delay
    setTimeout(() => {
        updateUser(currentUser.id, {
            name,
            username: currentUser.username,
            avatar,
            bio,
            dob,
            country,
            age: currentAge,
            themeColor,
            isPublicProfile
        });
        setIsEditing(false);
        setIsUploading(false);
        alert("Profile updated successfully!");
    }, 500);
  };

  const handleBindGoogle = () => {
    setShowGoogleSSOModal(true);
  };

  const handleBindPhone = () => {
      updateUser(currentUser.id, { isPhoneBound: true }); 
      setShowPhoneModal(false);
      alert("Mobile Number Bound Successfully!");
  };

  const handleDelete = () => {
      if(confirm("Are you sure you want to DELETE your account? This action is irreversible.")) {
          if(confirm("Last warning: All data will be lost. Confirm delete?")) {
              deleteAccount();
          }
      }
  };
  
  const handleLogout = () => {
      if(confirm("Are you sure you want to log out?")) {
          logout(); 
          onLogout(); 
      }
  };

  const handleReport = () => {
      reportProblem(reportText);
      setShowReportModal(false);
      setReportText('');
      alert("Report sent to administration.");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatar(result);
        setIsUploading(true);
        // Simulate upload
        setTimeout(() => {
             updateUser(currentUser.id, { avatar: result });
             setIsUploading(false);
             alert('Avatar updated successfully!');
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIGenerateAvatar = async (styleVariant: string = 'modern') => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || currentUser.name,
          bio: bio || currentUser.bio,
          style: styleVariant
        })
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      if (data && data.avatarUrl) {
        setAvatar(data.avatarUrl);
        updateUser(currentUser.id, { avatar: data.avatarUrl });
      } else {
        throw new Error('No avatar received');
      }
    } catch (err) {
      console.warn('AI Avatar generation network fallback:', err);
      // Seamless offline fallback avatar synthesizer
      const fallbackSeed = `papi-${encodeURIComponent((name || currentUser.name).replace(/[^a-zA-Z0-9]/g, ''))}-${Date.now()}`;
      const fallbackUrl = `https://api.dicebear.com/9.x/lorelei/svg?seed=${fallbackSeed}&backgroundColor=6366f1,ec4899,8b5cf6,3b82f6&backgroundType=gradientLinear`;
      setAvatar(fallbackUrl);
      updateUser(currentUser.id, { avatar: fallbackUrl });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleTopup = async (amount: number, price: number) => {
      if(confirm(`Purchase ${amount} Diamonds for $${price}?`)) {
          const success = await topUpDiamonds(amount, price, `pkg_${amount}`);
          if (success) {
              alert("Purchase Successful!");
              setShowTopupModal(false);
          } else {
              alert("Purchase failed. Please try again.");
          }
      }
  };

  const handleWithdraw = () => {
      const amount = parseInt(withdrawAmount);
      if(!amount || amount <= 0) return alert("Invalid amount");
      if(amount > (currentUser.beans || 0)) return alert("Insufficient balance");
      
      const usd = (amount / 210).toFixed(2);
      
      if(confirm(`Withdraw ${amount} Beans (~$${usd}) to your bank account?`)) {
           updateUser(currentUser.id, { beans: (currentUser.beans || 0) - amount });
           alert("Withdrawal request submitted successfully. Funds will arrive in 1-3 business days.");
           setShowWithdrawModal(false);
           setWithdrawAmount('');
      }
  };

  const colors: Array<'indigo' | 'rose' | 'purple' | 'emerald' | 'orange' | 'blue'> = ['indigo', 'rose', 'purple', 'emerald', 'orange', 'blue'];

  return (
      <div className="fixed inset-0 z-[45] bg-slate-50 flex flex-col animate-fade-in-up">
          {/* Header */}
          <div className="bg-white px-4 py-4 flex items-center gap-4 flex-none border-b border-slate-100">
             <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                <i className="fa-solid fa-arrow-left text-slate-800"></i>
             </button>
             <h2 className="text-xl font-black text-slate-900">Edit Profile & Settings</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-safe custom-scrollbar">
              
              {/* Public Profile Edit Section */}
              <section>
                  <div className="flex justify-between items-center mb-3 px-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Public Profile</h3>
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="text-indigo-600 text-xs font-bold hover:underline">Edit</button>
                    ) : (
                        <div className="flex gap-4">
                            <button onClick={() => setIsEditing(false)} className="text-slate-500 text-xs font-bold hover:text-slate-700">Cancel</button>
                            <button 
                                onClick={handleSaveProfile} 
                                disabled={isUploading}
                                className="text-indigo-600 text-xs font-bold hover:text-indigo-700 disabled:opacity-50"
                            >
                                {isUploading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
                      <div className="flex flex-col items-center">
                          <div className="relative group">
                              <img src={avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md bg-slate-50" />
                              {isEditing && (
                                  <>
                                    <button 
                                        onClick={handleAvatarClick}
                                        disabled={isUploading}
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full text-white flex items-center justify-center border-2 border-white shadow-sm hover:bg-indigo-700 transition-colors z-10 disabled:bg-slate-400" 
                                        title="Upload Photo"
                                    >
                                        {isUploading ? (
                                            <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                                        ) : (
                                            <i className="fa-solid fa-camera text-xs"></i>
                                        )}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileChange}
                                    />
                                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={!isUploading ? handleAvatarClick : undefined}>
                                        <span className="text-white text-[10px] font-bold uppercase">Change</span>
                                    </div>
                                  </>
                              )}
                          </div>
                          {isEditing && (
                             <div className="flex flex-col items-center gap-2 mt-2">
                                <p className="text-[10px] text-slate-400 font-medium">Tap icon to upload or use AI</p>
                                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                  <button 
                                      onClick={() => handleAIGenerateAvatar('modern')}
                                      disabled={isGeneratingAI}
                                      className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                                      title="Generate AI Creator Avatar"
                                  >
                                      {isGeneratingAI ? (
                                          <>
                                              <i className="fa-solid fa-spinner animate-spin"></i>
                                              <span>Generating...</span>
                                          </>
                                      ) : (
                                          <>
                                              <i className="fa-solid fa-wand-magic-sparkles"></i>
                                              <span>AI Generate</span>
                                          </>
                                      )}
                                  </button>
                                  <button 
                                      onClick={() => handleAIGenerateAvatar('anime')}
                                      disabled={isGeneratingAI}
                                      className="flex items-center gap-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
                                      title="Generate Anime Style Avatar"
                                  >
                                      <span>🎨 Anime</span>
                                  </button>
                                  <button 
                                      onClick={() => handleAIGenerateAvatar('cyberpunk')}
                                      disabled={isGeneratingAI}
                                      className="flex items-center gap-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
                                      title="Generate Cyberpunk Style Avatar"
                                  >
                                      <span>⚡ Cyber</span>
                                  </button>
                                </div>
                             </div>
                          )}
                      </div>

                      <div className="space-y-4">
                          {/* Unique ID - Read Only */}
                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unique ID</label>
                              <div className="flex items-center justify-between bg-slate-100 rounded-xl px-4 py-3 border border-transparent">
                                  <span className="font-black text-slate-500">{currentUser.id}</span>
                                  <i className="fa-solid fa-lock text-slate-400 text-xs"></i>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 ml-1">Unique ID cannot be changed.</p>
                          </div>

                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Display Name</label>
                              {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                                  />
                              ) : (
                                  <p className="font-bold text-slate-900 px-4 py-3 bg-slate-50 rounded-xl border border-transparent">{name}</p>
                              )}
                          </div>

                          <div>
                              <div className="flex items-center justify-between mb-1">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username (@handle)</label>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                      <i className="fa-solid fa-lock text-[8px]"></i> Permanent
                                  </span>
                              </div>
                              <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                                  <input 
                                    type="text" 
                                    value={username} 
                                    disabled
                                    readOnly
                                    className="w-full bg-slate-100/90 border border-slate-200 rounded-xl pl-9 pr-10 py-3 font-mono font-bold text-slate-500 cursor-not-allowed select-none"
                                  />
                                  <i className="fa-solid fa-lock absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">@handle name is fixed to protect your account identity and live room link.</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Age (DOB)</label>
                                  {isEditing ? (
                                      <input 
                                        type="date" 
                                        value={dob} 
                                        onChange={(e) => setDob(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                                      />
                                  ) : (
                                      <p className="font-bold text-slate-900 px-4 py-3 bg-slate-50 rounded-xl border border-transparent">{currentAge} Years Old</p>
                                  )}
                             </div>
                             <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Country (ASEAN)</label>
                                  {isEditing ? (
                                      <div className="relative">
                                          <select 
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                                          >
                                              {COUNTRIES.map(c => (
                                                  <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                                              ))}
                                          </select>
                                          <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-transparent">
                                          <span>{activeCountryData?.flag || '🇮🇩'}</span>
                                          <span className="text-sm font-bold text-slate-900">{activeCountryData?.name || country}</span>
                                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase ml-auto">ASEAN</span>
                                      </div>
                                  )}
                             </div>
                             <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Theme Color</label>
                                  {isEditing ? (
                                      <div className="flex gap-2 items-center h-[50px]">
                                          {colors.map(c => (
                                              <button 
                                                key={c} 
                                                onClick={() => setThemeColor(c)} 
                                                className={`w-6 h-6 rounded-full bg-${c}-600 ${themeColor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''} transition-all`}
                                              />
                                          ))}
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-transparent">
                                          <div className={`w-4 h-4 rounded-full bg-${themeColor}-600`}></div>
                                          <span className="text-sm font-bold capitalize">{themeColor}</span>
                                      </div>
                                  )}
                             </div>
                          </div>

                          {/* Public Profile Toggle */}
                          {isEditing && (
                              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                                  <div>
                                      <div className="text-sm font-bold text-slate-900">Public Profile</div>
                                      <div className="text-[10px] text-slate-500">Allow others to find you in search</div>
                                  </div>
                                  <button 
                                      onClick={() => setIsPublicProfile(!isPublicProfile)}
                                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isPublicProfile ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                  >
                                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${isPublicProfile ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                  </button>
                              </div>
                          )}

                          <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bio</label>
                              {isEditing ? (
                                  <textarea 
                                    value={bio} 
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:border-indigo-500 resize-none text-sm"
                                  />
                              ) : (
                                  <p className="font-medium text-slate-600 px-4 py-3 bg-slate-50 rounded-xl border border-transparent text-sm">{bio || 'No bio set.'}</p>
                              )}
                          </div>
                      </div>
                  </div>
              </section>

              {/* Wallet & Earnings Section */}
              <section>
                  <div className="flex justify-between items-center mb-3 px-2">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Wallet & Earnings</h3>
                     <button onClick={loadHistory} className="text-[10px] font-bold text-indigo-600 hover:underline">View History</button>
                  </div>
                  
                  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm grid grid-cols-2 divide-x divide-slate-100 mb-2">
                      <button onClick={() => setShowTopupModal(true)} className="p-4 hover:bg-slate-50 transition-colors flex flex-col items-center gap-2 group">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <i className="fa-solid fa-gem text-xl"></i>
                          </div>
                          <div className="text-center">
                              <div className="text-sm font-black text-slate-900">Top Up</div>
                              <div className="text-[10px] font-bold text-slate-500 mt-1">{currentUser.diamonds.toLocaleString()} Diamonds</div>
                          </div>
                      </button>
                      <button onClick={() => setShowWithdrawModal(true)} className="p-4 hover:bg-slate-50 transition-colors flex flex-col items-center gap-2 group">
                           <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <i className="fa-solid fa-sack-dollar text-xl"></i>
                          </div>
                          <div className="text-center">
                              <div className="text-sm font-black text-slate-900">Withdraw Salary</div>
                              <div className="text-[10px] font-bold text-slate-500 mt-1">{currentUser.beans?.toLocaleString() || 0} Beans</div>
                          </div>
                      </button>
                  </div>
                  <div className="bg-slate-100 rounded-xl p-3 flex justify-between items-center px-4">
                      <span className="text-xs font-bold text-slate-500">Total Spending</span>
                      <span className="text-sm font-black text-slate-900">{currentUser.totalSpending?.toLocaleString() || 0} Diamonds</span>
                  </div>
              </section>

              {/* Account Security */}
              <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">Account Security</h3>
                  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                      <button 
                        onClick={() => !currentUser.isPhoneBound && setShowPhoneModal(true)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50"
                      >
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><i className="fa-solid fa-mobile-screen"></i></div>
                              <span className="text-sm font-bold text-slate-700">Mobile Number</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${currentUser.isPhoneBound ? 'text-slate-400' : 'text-indigo-600'}`}>
                                  {currentUser.isPhoneBound ? 'Bound' : 'Bind Now'}
                              </span>
                              <i className="fa-solid fa-chevron-right text-slate-300 text-xs"></i>
                          </div>
                      </button>
                      <button 
                        onClick={handleBindGoogle}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                      >
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><i className="fa-brands fa-google"></i></div>
                              <div>
                                  <span className="text-sm font-bold text-slate-700 block">Google Account</span>
                                  {currentUser.isGoogleBound && (
                                      <span className="text-[11px] text-slate-400 font-mono block">
                                          {currentUser.email || 'jaidetura55@gmail.com'}
                                      </span>
                                  )}
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              {currentUser.isGoogleBound ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200">
                                      <i className="fa-solid fa-check text-[9px]"></i> Connected
                                  </span>
                              ) : (
                                  <span className="text-xs font-bold text-indigo-600">
                                      Bind Now
                                  </span>
                              )}
                              <i className="fa-solid fa-chevron-right text-slate-300 text-xs"></i>
                          </div>
                      </button>
                  </div>
              </section>

              {/* Support */}
              <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">Support</h3>
                  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                      <button onClick={() => setShowReportModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><i className="fa-solid fa-headset"></i></div>
                              <span className="text-sm font-bold text-slate-700">Report Problem</span>
                          </div>
                          <i className="fa-solid fa-chevron-right text-slate-300 text-xs"></i>
                      </button>
                  </div>
              </section>

              {/* Danger Zone */}
              <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">Danger Zone</h3>
                  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                      <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 group">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-colors"><i className="fa-solid fa-arrow-right-from-bracket"></i></div>
                              <span className="text-sm font-bold text-slate-600">Log Out</span>
                          </div>
                      </button>
                      <button onClick={handleDelete} className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors group">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-200 transition-colors"><i className="fa-solid fa-trash"></i></div>
                              <span className="text-sm font-bold text-red-600">Delete Account</span>
                          </div>
                      </button>
                  </div>
              </section>
              
              <div className="text-center pt-8">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">YoungPapi Live v1.0.0</p>
              </div>
          </div>

          {/* Top Up Modal with Google Wallet & FPX */}
          <WalletTopupModal
            isOpen={showTopupModal}
            onClose={() => setShowTopupModal(false)}
            onSuccess={() => {
              loadHistory();
            }}
          />

          {/* Transaction History Modal */}
          {showHistoryModal && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
                  <div className="bg-white w-full max-w-sm rounded-3xl p-5 flex flex-col max-h-[80vh]">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-black text-slate-900">Wallet History</h3>
                          <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                              <i className="fa-solid fa-xmark"></i>
                          </button>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                          {transactions.length > 0 ? transactions.map(t => (
                              <div key={t.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                  <div className="flex justify-between items-start mb-1">
                                      <span className={`text-xs font-black uppercase tracking-wider ${
                                          t.type === 'topup' || t.type === 'gift_received' ? 'text-emerald-600' : 'text-rose-600'
                                      }`}>{t.type.replace('_', ' ')}</span>
                                      <span className="text-[10px] text-slate-400 font-bold">{new Date(t.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="text-sm font-bold text-slate-800">{t.description}</div>
                                  <div className="mt-1 text-xs font-mono text-slate-500 flex justify-between">
                                      <span>{t.amount} {t.currency}s</span>
                                      <span className="text-[10px]">{new Date(t.createdAt).toLocaleTimeString()}</span>
                                  </div>
                              </div>
                          )) : (
                              <p className="text-center text-slate-400 text-xs py-8">No transactions found.</p>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {/* Withdraw Modal */}
          {showWithdrawModal && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in-up">
                  <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative">
                       <button onClick={() => setShowWithdrawModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                          <i className="fa-solid fa-xmark"></i>
                      </button>
                      <div className="flex flex-col items-center mb-6">
                          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                              <i className="fa-solid fa-sack-dollar text-3xl text-orange-600"></i>
                          </div>
                          <h3 className="text-xl font-black text-slate-900">Withdraw Salary</h3>
                          <p className="text-sm text-slate-500 font-bold">Available: {currentUser.beans?.toLocaleString() || 0} Beans</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rate: 210 Beans = $1.00 USD</p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bank Account</span>
                              <button className="text-[10px] font-black text-indigo-600 uppercase">Change</button>
                          </div>
                          {currentUser.bankDetails ? (
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 text-slate-700">
                                      <i className="fa-solid fa-building-columns"></i>
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-900 text-sm">{currentUser.bankDetails.bankName}</div>
                                      <div className="text-xs font-mono text-slate-500">•••• {currentUser.bankDetails.accountNumber.slice(-4)}</div>
                                  </div>
                              </div>
                          ) : (
                              <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 font-bold text-sm hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                                  <i className="fa-solid fa-plus mr-2"></i> Add Bank Account
                              </button>
                          )}
                      </div>

                      <div className="mb-6">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Withdraw Amount</label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  value={withdrawAmount}
                                  onChange={(e) => setWithdrawAmount(e.target.value)}
                                  placeholder="Min 2100"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-indigo-500 pr-16"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">BEANS</div>
                          </div>
                          {withdrawAmount && (
                              <div className="mt-2 text-right text-xs font-bold text-emerald-600">
                                  Estimated: ~${(parseInt(withdrawAmount) / 210).toFixed(2)} USD
                              </div>
                          )}
                      </div>

                      <button 
                        onClick={handleWithdraw}
                        className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-500 transition-colors active:scale-95"
                      >
                          Confirm Withdrawal
                      </button>
                  </div>
              </div>
          )}

          {/* Report Modal */}
          {showReportModal && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
                  <div className="bg-white w-full max-w-sm rounded-3xl p-6">
                      <h3 className="text-lg font-black text-slate-900 mb-4">Report to Admin</h3>
                      <textarea 
                          value={reportText}
                          onChange={(e) => setReportText(e.target.value)}
                          placeholder="Describe the issue..."
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-indigo-500 mb-4 resize-none"
                      />
                      <div className="flex gap-3">
                          <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
                          <button onClick={handleReport} disabled={!reportText.trim()} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50">Submit</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Phone Bind Modal */}
          {showPhoneModal && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
                  <div className="bg-white w-full max-w-sm rounded-3xl p-6">
                      <h3 className="text-lg font-black text-slate-900 mb-4">Bind Phone Number</h3>
                      <div className="mb-4">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Mobile Number</label>
                          <input 
                              type="tel" 
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="+1 234 567 8900"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => setShowPhoneModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
                          <button onClick={handleBindPhone} disabled={phoneNumber.length < 5} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50">Verify & Bind</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Google SSO Modal */}
          <GoogleSSOModal
            isOpen={showGoogleSSOModal}
            onClose={() => setShowGoogleSSOModal(false)}
            onSuccess={(user) => {
              updateUser(currentUser.id, { 
                isGoogleBound: true, 
                email: user.email || currentUser.email 
              });
              setShowGoogleSSOModal(false);
            }}
          />
      </div>
  );
};

export default SettingsView;
