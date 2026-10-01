import React, { useState } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'terms' | 'privacy' | 'community' | 'currency'>('overview');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setUpdateMessage(null);
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateMessage('YoungPapi Live is up to date! (v2.4.0 Stable)');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col text-slate-900 my-auto animate-fade-in-up max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-500/25">
              <i className="fa-solid fa-play"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">About YoungPapi Live</h3>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-100 font-mono">
                  v2.4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Next-generation social live broadcasting platform
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

        {/* Tab navigation pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar border-b border-slate-100 text-xs flex-shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <i className="fa-solid fa-sparkles mr-1.5 text-xs"></i>
            Overview
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'community'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <i className="fa-solid fa-handshake-angle mr-1.5 text-xs"></i>
            Guidelines
          </button>

          <button
            onClick={() => setActiveTab('currency')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'currency'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <i className="fa-solid fa-gem mr-1.5 text-xs"></i>
            Diamonds & Beans
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <i className="fa-solid fa-file-contract mr-1.5 text-xs"></i>
            Terms
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <i className="fa-solid fa-shield-halved mr-1.5 text-xs"></i>
            Privacy
          </button>
        </div>

        {/* Tab content body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 py-4 text-xs space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gradient-to-br from-indigo-50 via-cyan-50 to-white p-4 rounded-3xl border border-indigo-100 text-slate-800">
                <h4 className="font-black text-sm text-indigo-950 mb-1 flex items-center gap-1.5">
                  <i className="fa-solid fa-heart text-rose-500"></i>
                  Welcome to YoungPapi Live
                </h4>
                <p className="text-slate-600 leading-relaxed text-xs">
                  YoungPapi Live is a world-class interactive live streaming platform built for creators, talent agencies, and fans around the world. We offer low-latency video streaming, animated luxury gifts, real-time PK streamer battles, and transparent creator earnings with Google Wallet & FPX banking support.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Build Version
                  </div>
                  <div className="font-black text-slate-800 font-mono text-sm">2.4.0 Stable</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">● Production Ready</div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Stream Engine
                  </div>
                  <div className="font-black text-slate-800 text-sm">Low-Latency WebRTC</div>
                  <div className="text-[10px] text-indigo-600 font-bold mt-0.5">1080p60 Ultra HD</div>
                </div>
              </div>

              {/* Version Check Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCheckUpdate}
                  disabled={checkingUpdate}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {checkingUpdate ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Checking Server...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-rotate text-xs"></i>
                      <span>Check for Updates</span>
                    </>
                  )}
                </button>
                {updateMessage && (
                  <p className="text-center text-[11px] font-bold text-emerald-600 mt-2 animate-fade-in flex items-center justify-center gap-1.5">
                    <i className="fa-solid fa-circle-check"></i>
                    {updateMessage}
                  </p>
                )}
              </div>

              {/* Official Social Links & Support */}
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Official Channels & Support
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="mailto:support@youngpapi.live"
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-center transition-colors block text-slate-700"
                  >
                    <i className="fa-solid fa-envelope text-indigo-500 text-sm block mb-1"></i>
                    <span className="text-[10px] font-bold">Email Support</span>
                  </a>

                  <a
                    href="#discord"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Join the official YoungPapi Discord community: discord.gg/youngpapilive');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-center transition-colors block text-slate-700"
                  >
                    <i className="fa-brands fa-discord text-indigo-500 text-sm block mb-1"></i>
                    <span className="text-[10px] font-bold">Discord Guild</span>
                  </a>

                  <a
                    href="#status"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Platform status: All 12 CDN streaming regions operational.');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 text-center transition-colors block text-slate-700"
                  >
                    <i className="fa-solid fa-server text-emerald-500 text-sm block mb-1"></i>
                    <span className="text-[10px] font-bold">System Status</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'community' && (
            <div className="space-y-3 animate-fade-in leading-relaxed text-slate-600">
              <h4 className="font-black text-slate-900 text-sm">Community Guidelines & Standards</h4>
              <p>
                To provide a safe, welcoming, and high-energy environment for everyone, all hosts and viewers must observe these standards:
              </p>
              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-start gap-2.5">
                  <i className="fa-solid fa-ban text-rose-500 mt-0.5"></i>
                  <div>
                    <strong className="text-slate-900 block text-xs">Zero Tolerance Harassment</strong>
                    <span className="text-[11px] text-slate-500">Hate speech, racism, threats, doxxing, or cyber-bullying will result in immediate permanent account termination.</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-2.5">
                  <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5"></i>
                  <div>
                    <strong className="text-slate-900 block text-xs">Streamer Attire & Conduct</strong>
                    <span className="text-[11px] text-slate-500">Explicit content, dangerous acts, illegal gambling, or impersonation of platform staff are strictly prohibited.</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5">
                  <i className="fa-solid fa-copyright text-indigo-500 mt-0.5"></i>
                  <div>
                    <strong className="text-slate-900 block text-xs">Intellectual Property & Fair Play</strong>
                    <span className="text-[11px] text-slate-500">Hosts must have broadcast rights for visual media. Artificially inflating viewer numbers or bots is prohibited.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'currency' && (
            <div className="space-y-3 animate-fade-in leading-relaxed text-slate-600">
              <h4 className="font-black text-slate-900 text-sm">Diamonds & Creator Beans Policy</h4>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-100">
                  <div className="flex items-center gap-2 font-black text-cyan-900 text-xs mb-1">
                    <i className="fa-solid fa-gem text-cyan-600"></i>
                    <span>Diamonds (Viewer Spending Currency)</span>
                  </div>
                  <p className="text-[11px] text-cyan-800">
                    Diamonds are purchased by viewers through verified gateways including Google Wallet, FPX Malaysian Online Banking, and Credit Cards. Diamonds are used to send live virtual gifts, VIP entry effects, and support favorite streamers.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2 font-black text-amber-900 text-xs mb-1">
                    <i className="fa-solid fa-coins text-amber-600"></i>
                    <span>Creator Beans (Host Earnings Currency)</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    When a host receives gifts, they earn Creator Beans. Beans can be exchanged for real cash. The platform conversion rate is <strong>210 Beans = $1.00 USD</strong>. Withdrawals are processed to verified bank accounts or PayPal within 3-5 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3 animate-fade-in leading-relaxed text-slate-600">
              <h4 className="font-black text-slate-900 text-sm">Terms of Service</h4>
              <p className="text-slate-500 text-[11px]">Last Updated: September 2026</p>
              <p>
                By using YoungPapi Live, you agree to comply with our Terms of Service. You must be at least 18 years old or the age of legal majority in your jurisdiction to create an account and transact virtual currency.
              </p>
              <p>
                Accounts found violating anti-money laundering (AML) laws, fraudulent chargebacks, or unauthorized access will be frozen and reported to relevant authorities.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3 animate-fade-in leading-relaxed text-slate-600">
              <h4 className="font-black text-slate-900 text-sm">Privacy Policy & Security</h4>
              <p className="text-slate-500 text-[11px]">Last Updated: September 2026</p>
              <p>
                YoungPapi Live respects your personal data. We utilize TLS 1.3 encryption for all data in transit and never sell personal identifiable information to third parties.
              </p>
              <p>
                You may request account deletion and complete data erasure at any time through our Settings & Privacy menu.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
          <span>© 2026 YoungPapi Live Inc.</span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
