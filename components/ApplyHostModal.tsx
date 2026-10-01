import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { COUNTRIES } from '../constants';

interface ApplyHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onApplicationSuccess?: (data: HostApplicationData) => void;
}

export interface HostApplicationData {
  stageName: string;
  realName: string;
  category: string;
  country: string;
  language: string;
  socialHandle: string;
  socialPlatform: string;
  experienceMonths: string;
  weeklyHours: string;
  intro: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const STORAGE_KEY = 'youngpapi_host_application';

export default function ApplyHostModal({
  isOpen,
  onClose,
  currentUser,
  onApplicationSuccess
}: ApplyHostModalProps) {
  const [existingApp, setExistingApp] = useState<HostApplicationData | null>(null);
  const [formData, setFormData] = useState({
    stageName: currentUser.name || '',
    realName: '',
    category: 'Music',
    country: currentUser.country || 'ID',
    language: 'English',
    socialPlatform: 'TikTok',
    socialHandle: '',
    experienceMonths: '1-2 years',
    weeklyHours: '15-25 hours',
    intro: currentUser.bio || '',
    agreeTerms: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setExistingApp(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeTerms) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const application: HostApplicationData = {
        stageName: formData.stageName.trim(),
        realName: formData.realName.trim(),
        category: formData.category,
        country: formData.country,
        language: formData.language,
        socialPlatform: formData.socialPlatform,
        socialHandle: formData.socialHandle.trim(),
        experienceMonths: formData.experienceMonths,
        weeklyHours: formData.weeklyHours,
        intro: formData.intro.trim(),
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(application));
      } catch (err) {
        console.error(err);
      }

      setExistingApp(application);
      setIsSubmitting(false);
      setIsSuccess(true);
      if (onApplicationSuccess) {
        onApplicationSuccess(application);
      }
    }, 900);
  };

  const handleWithdraw = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    setExistingApp(null);
    setIsSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col text-slate-900 my-auto animate-fade-in-up max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center text-lg shadow-md shadow-indigo-500/20">
              <i className="fa-solid fa-microphone-lines"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">Apply for Official Host</h3>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-100">
                  Creator Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Stream live, build a fan community & earn Beans rewards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 py-4 space-y-5">
          {/* Perks Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-1.5 text-xs shadow-sm">
                <i className="fa-solid fa-coins"></i>
              </div>
              <div className="text-[11px] font-black text-indigo-950">Up to 70% Share</div>
              <div className="text-[9px] text-indigo-600/80 font-medium">Beans to Cash</div>
            </div>

            <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-1.5 text-xs shadow-sm">
                <i className="fa-solid fa-certificate"></i>
              </div>
              <div className="text-[11px] font-black text-amber-950">Host Badge</div>
              <div className="text-[9px] text-amber-600/80 font-medium">Verified Profile</div>
            </div>

            <div className="bg-cyan-50/70 border border-cyan-100 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center mx-auto mb-1.5 text-xs shadow-sm">
                <i className="fa-solid fa-fire"></i>
              </div>
              <div className="text-[11px] font-black text-cyan-950">Featured Feed</div>
              <div className="text-[9px] text-cyan-600/80 font-medium">Algorithmic Boost</div>
            </div>
          </div>

          {/* If already submitted / existing status */}
          {existingApp ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl mx-auto shadow-inner">
                {existingApp.status === 'approved' ? (
                  <i className="fa-solid fa-circle-check text-emerald-500"></i>
                ) : (
                  <i className="fa-solid fa-hourglass-half text-indigo-600"></i>
                )}
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 mb-1">
                  Status: {existingApp.status === 'approved' ? 'Approved Host' : 'Application In Review'}
                </span>
                <h4 className="text-base font-black text-slate-900 mt-1">
                  {existingApp.stageName} ({existingApp.category})
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  {existingApp.status === 'approved'
                    ? 'Congratulations! Your official host status is active. You can now Go Live with official perks.'
                    : 'Our Creator Partnerships team is reviewing your audition details. Expect an inbox notification within 24-48 hours.'}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Application ID:</span>
                  <span className="font-mono font-bold text-slate-800">
                    HST-{currentUser.id.slice(0, 6).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Submitted Date:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(existingApp.submittedAt).toLocaleDateString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Target Hours:</span>
                  <span className="font-bold text-slate-800">{existingApp.weeklyHours}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Got It
                </button>
                <button
                  type="button"
                  onClick={handleWithdraw}
                  className="py-3 px-3 rounded-xl bg-slate-200/80 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                  title="Withdraw application to resubmit"
                >
                  <i className="fa-solid fa-rotate-left"></i> Re-apply
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            /* Instant Success Message */
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto shadow-inner">
                <i className="fa-solid fa-check"></i>
              </div>
              <h4 className="text-base font-black text-emerald-900">Application Submitted!</h4>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Thank you for applying to become an Official YoungPapi Live Host. Our talent managers will review your profile and reach out shortly.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Stage / Streamer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.stageName}
                    onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                    placeholder="e.g. DJ Starfire"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Legal Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.realName}
                    onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                    placeholder="e.g. Alex Tan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Country (ASEAN) *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-indigo-500 cursor-pointer"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-indigo-500"
                  >
                    <option value="Music">🎵 Music & DJ</option>
                    <option value="Gaming">🎮 Gaming & Esports</option>
                    <option value="Singing">🎤 Singing & Karaoke</option>
                    <option value="Party">🎉 Party & Dance</option>
                    <option value="Life">☕ Chat & Life</option>
                    <option value="Beauty">💄 Beauty & Fashion</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Primary Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-indigo-500"
                  >
                    <option value="English">English</option>
                    <option value="Malay">Bahasa Melayu</option>
                    <option value="Indonesian">Bahasa Indonesia</option>
                    <option value="Mandarin">Mandarin (中文)</option>
                    <option value="Tagalog">Filipino / Tagalog</option>
                    <option value="Vietnamese">Tiếng Việt</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Target Hours / Wk
                  </label>
                  <select
                    value={formData.weeklyHours}
                    onChange={(e) => setFormData({ ...formData, weeklyHours: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-indigo-500"
                  >
                    <option value="10-15 hours">10 - 15 hrs / wk</option>
                    <option value="15-25 hours">15 - 25 hrs / wk</option>
                    <option value="25-40 hours">25 - 40 hrs (Full-time)</option>
                    <option value="40+ hours">40+ hrs (Power Host)</option>
                  </select>
                </div>
              </div>

              {/* Social / Audition Profile */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Social Media / Audition Handle *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.socialPlatform}
                    onChange={(e) => setFormData({ ...formData, socialPlatform: e.target.value })}
                    className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-indigo-500"
                  >
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Twitch">Twitch</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={formData.socialHandle}
                    onChange={(e) => setFormData({ ...formData, socialHandle: e.target.value })}
                    placeholder="@yourhandle or profile URL"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-indigo-500"
                  />
                </div>
              </div>

              {/* Pitch / Bio */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Talent Pitch / What will you stream? *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.intro}
                  onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                  placeholder="Tell us about your streaming style, talents, instruments, or audience engagement plans..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 ring-indigo-500 resize-none"
                />
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 leading-tight">
                  I agree to the <strong className="text-slate-800">YoungPapi Host Agreement</strong>, Streamer Community Standards, and acknowledge that beans revenue distribution is subject to platform anti-fraud auditing.
                </span>
              </label>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.agreeTerms}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i>
                      <span>Submit Host Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
