import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { COUNTRIES } from '../constants';

interface ApplyAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onApplicationSuccess?: (data: AgencyApplicationData) => void;
}

export interface AgencyApplicationData {
  agencyName: string;
  contactPerson: string;
  businessEmail: string;
  phoneWhatsapp: string;
  country: string;
  rosterSize: string;
  niche: string;
  website: string;
  monthlyTarget: string;
  notes: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const STORAGE_KEY = 'youngpapi_agency_application';

export default function ApplyAgencyModal({
  isOpen,
  onClose,
  currentUser,
  onApplicationSuccess
}: ApplyAgencyModalProps) {
  const [existingApp, setExistingApp] = useState<AgencyApplicationData | null>(null);
  const [formData, setFormData] = useState({
    agencyName: '',
    contactPerson: currentUser.name || '',
    businessEmail: currentUser.email || '',
    phoneWhatsapp: '',
    country: currentUser.country || 'MY',
    rosterSize: '15-50 hosts',
    niche: 'Music & Singing',
    website: '',
    monthlyTarget: '$10,000 - $50,000 USD',
    notes: '',
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
      const application: AgencyApplicationData = {
        agencyName: formData.agencyName.trim(),
        contactPerson: formData.contactPerson.trim(),
        businessEmail: formData.businessEmail.trim(),
        phoneWhatsapp: formData.phoneWhatsapp.trim(),
        country: formData.country,
        rosterSize: formData.rosterSize,
        niche: formData.niche,
        website: formData.website.trim(),
        monthlyTarget: formData.monthlyTarget,
        notes: formData.notes.trim(),
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center text-lg shadow-md shadow-cyan-500/20">
              <i className="fa-solid fa-building-user"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">Apply for Agency</h3>
                <span className="bg-cyan-50 text-cyan-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-cyan-100">
                  Guild & Agency
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Register your talent agency & earn management commissions
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
            <div className="bg-cyan-50/70 border border-cyan-100 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center mx-auto mb-1.5 text-xs shadow-sm">
                <i className="fa-solid fa-percent"></i>
              </div>
              <div className="text-[11px] font-black text-cyan-950">15% Commission</div>
              <div className="text-[9px] text-cyan-600/80 font-medium">On Talent Gifts</div>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-1.5 text-xs shadow-sm">
                <i className="fa-solid fa-users-gear"></i>
              </div>
              <div className="text-[11px] font-black text-indigo-950">Roster CRM</div>
              <div className="text-[9px] text-indigo-600/80 font-medium">Host Analytics</div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-1.5 text-xs shadow-sm">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div className="text-[11px] font-black text-emerald-950">Fast Verification</div>
              <div className="text-[9px] text-emerald-600/80 font-medium">Direct Auditions</div>
            </div>
          </div>

          {/* If already submitted / existing status */}
          {existingApp ? (
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-2xl mx-auto shadow-inner">
                {existingApp.status === 'approved' ? (
                  <i className="fa-solid fa-circle-check text-emerald-500"></i>
                ) : (
                  <i className="fa-solid fa-building-circle-check text-cyan-600"></i>
                )}
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 mb-1">
                  Status: {existingApp.status === 'approved' ? 'Certified Agency' : 'Under Review'}
                </span>
                <h4 className="text-base font-black text-slate-900 mt-1">
                  {existingApp.agencyName}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  {existingApp.status === 'approved'
                    ? 'Your agency partnership agreement is active. You can now onboard talent rosters directly.'
                    : 'Our Agency Partnership Team is verifying your agency credentials. We will contact your business representative via WhatsApp or Email.'}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Agency ID:</span>
                  <span className="font-mono font-bold text-slate-800">
                    AGY-{currentUser.id.slice(0, 6).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Contact Person:</span>
                  <span className="font-bold text-slate-800">{existingApp.contactPerson}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Roster Size:</span>
                  <span className="font-bold text-slate-800">{existingApp.rosterSize}</span>
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
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
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
            <div className="bg-cyan-50 border border-cyan-200 rounded-3xl p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-2xl mx-auto shadow-inner">
                <i className="fa-solid fa-check"></i>
              </div>
              <h4 className="text-base font-black text-cyan-950">Agency Application Submitted!</h4>
              <p className="text-xs text-cyan-800 leading-relaxed">
                Thank you for applying to become an official YoungPapi Live Agency Partner. Our business development team will contact you within 1-2 business days.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
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
                    Agency / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.agencyName}
                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                    placeholder="e.g. Nexus Talent Media"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Managing Director / Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.businessEmail}
                    onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                    placeholder="contact@agency.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    WhatsApp / Telegram Contact *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phoneWhatsapp}
                    onChange={(e) => setFormData({ ...formData, phoneWhatsapp: e.target.value })}
                    placeholder="+60 12-345 6789"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    HQ Country (ASEAN) *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-cyan-500"
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
                    Managed Roster Size *
                  </label>
                  <select
                    value={formData.rosterSize}
                    onChange={(e) => setFormData({ ...formData, rosterSize: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-cyan-500"
                  >
                    <option value="5-15 hosts">5 - 15 Hosts</option>
                    <option value="15-50 hosts">15 - 50 Hosts</option>
                    <option value="50-100 hosts">50 - 100 Hosts</option>
                    <option value="100+ hosts">100+ Hosts (Large Enterprise)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Primary Niche
                  </label>
                  <select
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-cyan-500"
                  >
                    <option value="Music & Singing">Music & Singing</option>
                    <option value="Gaming & Esports">Gaming & Esports</option>
                    <option value="PK Battles & Entertainment">PK Battles & Show</option>
                    <option value="Multi-genre Variety">Multi-genre Variety</option>
                  </select>
                </div>
              </div>

              {/* Website / Social */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Agency Website or Company Social Link
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://agency.com or Instagram/LinkedIn"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ring-cyan-500"
                />
              </div>

              {/* Agency Pitch & Notes */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Agency Background & Onboarding Target *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Describe your agency's operating track record, recruitment plans, and how many hosts you plan to onboard in the first 30 days..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 ring-cyan-500 resize-none"
                />
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-[11px] text-slate-500 leading-tight">
                  I represent an authorized agency entity and agree to the <strong className="text-slate-800">YoungPapi Live Agency Partnership Terms</strong>, talent protection guidelines, and platform code of conduct.
                </span>
              </label>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.agreeTerms}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Submitting Agency Dossier...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i>
                      <span>Submit Agency Application</span>
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
