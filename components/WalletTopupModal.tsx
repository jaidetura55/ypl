import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';

interface WalletTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
}

// Malaysian FPX Supported Banks
export const FPX_BANKS = [
  { id: 'maybank', name: 'Maybank2u', short: 'MBB', color: '#fbbd08', textColor: '#000', icon: 'fa-building-columns' },
  { id: 'cimb', name: 'CIMB Clicks', short: 'CIMB', color: '#dc2626', textColor: '#fff', icon: 'fa-building-columns' },
  { id: 'public', name: 'Public Bank', short: 'PBB', color: '#b91c1c', textColor: '#fff', icon: 'fa-building-columns' },
  { id: 'rhb', name: 'RHB Now', short: 'RHB', color: '#0284c7', textColor: '#fff', icon: 'fa-building-columns' },
  { id: 'hlb', name: 'Hong Leong Connect', short: 'HLB', color: '#1e3a8a', textColor: '#fff', icon: 'fa-building-columns' },
  { id: 'ambank', name: 'AmOnline', short: 'AMB', color: '#ea580c', textColor: '#fff', icon: 'fa-building-columns' },
  { id: 'bankislam', name: 'Bank Islam', short: 'BIMB', color: '#047857', textColor: '#fff', icon: 'fa-building-columns' },
  { id: 'tng', name: 'Touch \'n Go eWallet', short: 'TNG', color: '#0284c7', textColor: '#fff', icon: 'fa-wallet' },
  { id: 'affin', name: 'Affin Bank', short: 'ABB', color: '#0369a1', textColor: '#fff', icon: 'fa-building-columns' },
];

export const DIAMOND_PACKAGES = [
  { id: 'pkg_100', diamonds: 100, bonus: 0, usdPrice: 0.99, myrPrice: 4.50 },
  { id: 'pkg_500', diamonds: 500, bonus: 35, usdPrice: 4.99, myrPrice: 22.90, popular: true },
  { id: 'pkg_1200', diamonds: 1200, bonus: 120, usdPrice: 9.99, myrPrice: 45.90, bestValue: true },
  { id: 'pkg_2500', diamonds: 2500, bonus: 350, usdPrice: 19.99, myrPrice: 91.90 },
  { id: 'pkg_6500', diamonds: 6500, bonus: 1200, usdPrice: 49.99, myrPrice: 229.90 },
  { id: 'pkg_14000', diamonds: 14000, bonus: 3000, usdPrice: 99.99, myrPrice: 459.90, vip: true },
];

export type PaymentMethod = 'google_wallet' | 'fpx' | 'apple_pay' | 'credit_card';

export default function WalletTopupModal({ isOpen, onClose, onSuccess }: WalletTopupModalProps) {
  const { currentUser, topUpDiamonds } = useData();

  const [selectedPackage, setSelectedPackage] = useState(DIAMOND_PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('google_wallet');
  const [currency, setCurrency] = useState<'USD' | 'MYR'>('MYR');
  
  // FPX state
  const [selectedBank, setSelectedBank] = useState(FPX_BANKS[0].id);
  const [fpxBuyerEmail, setFpxBuyerEmail] = useState(currentUser.email || 'user@youngpapi.live');

  // Checkout flow state
  const [step, setStep] = useState<'select' | 'processing_google' | 'fpx_portal' | 'success'>('select');
  const [fpxOtp, setFpxOtp] = useState('849201');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTx, setCompletedTx] = useState<{ id: string; diamonds: number; method: string; totalCost: string } | null>(null);

  if (!isOpen) return null;

  // Synthesize crystal chime on success using Web Audio API
  const playDiamondChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.6);
      });
    } catch {
      // AudioContext not allowed or not available, safe to ignore
    }
  };

  const totalDiamonds = selectedPackage.diamonds + selectedPackage.bonus;
  const priceDisplay = currency === 'MYR' 
    ? `RM ${selectedPackage.myrPrice.toFixed(2)}` 
    : `$${selectedPackage.usdPrice.toFixed(2)}`;

  // Handle Google Wallet Checkout
  const handleGoogleWalletPay = async () => {
    setStep('processing_google');
    setIsProcessing(true);

    setTimeout(async () => {
      const txCost = currency === 'MYR' ? selectedPackage.myrPrice : selectedPackage.usdPrice;
      const success = await topUpDiamonds(
        totalDiamonds,
        txCost,
        selectedPackage.id,
        'Google Wallet'
      );

      setIsProcessing(false);
      if (success) {
        playDiamondChime();
        setCompletedTx({
          id: 'GW-' + Math.floor(10000000 + Math.random() * 90000000),
          diamonds: totalDiamonds,
          method: 'Google Wallet (Google Pay)',
          totalCost: priceDisplay
        });
        setStep('success');
        if (onSuccess) onSuccess(totalDiamonds);
      }
    }, 1400);
  };

  // Handle FPX Checkout
  const handleFpxProceed = () => {
    setStep('fpx_portal');
  };

  const handleFpxConfirmPayment = async () => {
    setIsProcessing(true);
    const bank = FPX_BANKS.find(b => b.id === selectedBank) || FPX_BANKS[0];

    setTimeout(async () => {
      const txCost = selectedPackage.myrPrice;
      const success = await topUpDiamonds(
        totalDiamonds,
        txCost,
        selectedPackage.id,
        `FPX (${bank.name})`
      );

      setIsProcessing(false);
      if (success) {
        playDiamondChime();
        setCompletedTx({
          id: 'FPX-' + Math.floor(10000000 + Math.random() * 90000000),
          diamonds: totalDiamonds,
          method: `FPX Online Banking (${bank.name})`,
          totalCost: `RM ${selectedPackage.myrPrice.toFixed(2)}`
        });
        setStep('success');
        if (onSuccess) onSuccess(totalDiamonds);
      }
    }, 1600);
  };

  // Handle Generic / Apple Pay / Card
  const handleGenericPay = async () => {
    setIsProcessing(true);
    const methodName = paymentMethod === 'apple_pay' ? 'Apple Pay' : 'Credit Card';
    setTimeout(async () => {
      const txCost = currency === 'MYR' ? selectedPackage.myrPrice : selectedPackage.usdPrice;
      const success = await topUpDiamonds(
        totalDiamonds,
        txCost,
        selectedPackage.id,
        methodName
      );

      setIsProcessing(false);
      if (success) {
        playDiamondChime();
        setCompletedTx({
          id: 'TX-' + Math.floor(10000000 + Math.random() * 90000000),
          diamonds: totalDiamonds,
          method: methodName,
          totalCost: priceDisplay
        });
        setStep('success');
        if (onSuccess) onSuccess(totalDiamonds);
      }
    }, 1200);
  };

  const resetAndClose = () => {
    setStep('select');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white text-lg">
              <i className="fa-solid fa-gem"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">Diamond Recharge</h3>
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Instant Credit
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Current: <span className="text-cyan-400 font-bold">{currentUser.diamonds.toLocaleString()}</span> Diamonds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency Switcher */}
            <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex text-[11px] font-bold">
              <button
                onClick={() => setCurrency('MYR')}
                className={`px-2 py-1 rounded-lg transition-all ${currency === 'MYR' ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'}`}
              >
                MYR (RM)
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded-lg transition-all ${currency === 'USD' ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'}`}
              >
                USD ($)
              </button>
            </div>

            <button
              onClick={resetAndClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-colors"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* STEP 1: Main Selection (Packages + Payment Methods) */}
          {step === 'select' && (
            <>
              {/* Diamond Package Selection Grid */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-sparkles text-cyan-400"></i> Select Diamond Pack
                  </span>
                  <span className="text-[11px] text-cyan-400 font-bold">
                    +Up to 3,000 Free Bonus
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DIAMOND_PACKAGES.map((pkg) => {
                    const isSelected = selectedPackage.id === pkg.id;
                    const price = currency === 'MYR' ? `RM ${pkg.myrPrice.toFixed(2)}` : `$${pkg.usdPrice.toFixed(2)}`;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`relative rounded-2xl p-3 flex flex-col items-center justify-between border transition-all text-center ${
                          isSelected
                            ? 'bg-gradient-to-b from-cyan-500/20 to-indigo-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                            : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        {pkg.popular && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                            🔥 Hot Popular
                          </span>
                        )}
                        {pkg.bestValue && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                            ⭐ Best Value
                          </span>
                        )}
                        {pkg.vip && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                            👑 VIP Pack
                          </span>
                        )}

                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-lg my-1">
                          <i className="fa-solid fa-gem"></i>
                        </div>

                        <div className="text-xl font-black text-white">
                          {pkg.diamonds.toLocaleString()}
                        </div>

                        {pkg.bonus > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md my-0.5">
                            +{pkg.bonus.toLocaleString()} Bonus
                          </span>
                        ) : (
                          <span className="text-[10px] text-transparent my-0.5">Standard</span>
                        )}

                        <div className="w-full mt-2 pt-2 border-t border-white/10">
                          <span className="text-xs font-black text-cyan-300">
                            {price}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-3 flex items-center gap-1.5">
                  <i className="fa-solid fa-credit-card text-indigo-400"></i> Choose Payment Method
                </span>

                <div className="space-y-2.5">
                  {/* Option 1: Google Wallet / Google Pay */}
                  <label
                    onClick={() => setPaymentMethod('google_wallet')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'google_wallet'
                        ? 'bg-gradient-to-r from-white/15 to-white/5 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md p-2">
                        {/* Google Wallet custom logo */}
                        <div className="flex items-center justify-center gap-1 font-black text-slate-900 text-sm">
                          <span className="text-blue-500 font-black">G</span>
                          <span className="text-xs font-bold text-slate-700">Wallet</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">Google Wallet</span>
                          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                            Google Pay 1-Tap
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Instant contactless payment via saved cards & Google account
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'google_wallet' ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/30'}`}>
                      {paymentMethod === 'google_wallet' && <i className="fa-solid fa-check text-[10px] font-black"></i>}
                    </div>
                  </label>

                  {/* Option 2: FPX Online Banking (Malaysia) */}
                  <label
                    onClick={() => setPaymentMethod('fpx')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'fpx'
                        ? 'bg-gradient-to-r from-white/15 to-white/5 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-md text-white font-black text-xs tracking-tighter">
                        FPX
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">FPX Online Banking</span>
                          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                            Malaysia Direct Banks
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Maybank2u, CIMB, Public Bank, RHB, HLB & TNG eWallet
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'fpx' ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/30'}`}>
                      {paymentMethod === 'fpx' && <i className="fa-solid fa-check text-[10px] font-black"></i>}
                    </div>
                  </label>

                  {/* FPX Banks Dropdown / Grid (Shown when FPX is selected) */}
                  {paymentMethod === 'fpx' && (
                    <div className="bg-slate-950/70 rounded-2xl p-4 border border-red-500/20 space-y-3 animate-fade-in">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-300">Select Your Malaysian Bank:</span>
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> FPX Gateway Active
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {FPX_BANKS.map((bank) => {
                          const isBankSelected = selectedBank === bank.id;
                          return (
                            <button
                              key={bank.id}
                              type="button"
                              onClick={() => setSelectedBank(bank.id)}
                              className={`p-2 rounded-xl text-left border flex flex-col justify-between h-16 transition-all ${
                                isBankSelected
                                  ? 'border-red-400 bg-red-950/40 shadow-md ring-1 ring-red-400'
                                  : 'bg-white/5 border-white/5 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs font-black text-white">{bank.short}</span>
                                {isBankSelected && <i className="fa-solid fa-circle-check text-red-400 text-xs"></i>}
                              </div>
                              <span className="text-[10px] text-slate-300 font-semibold truncate w-full">
                                {bank.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Bank Notification Email
                        </label>
                        <input
                          type="email"
                          value={fpxBuyerEmail}
                          onChange={(e) => setFpxBuyerEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Option 3: Apple Pay */}
                  <label
                    onClick={() => setPaymentMethod('apple_pay')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'apple_pay'
                        ? 'bg-gradient-to-r from-white/15 to-white/5 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md text-slate-950 text-xl font-bold">
                        <i className="fa-brands fa-apple"></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">Apple Pay</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Touch ID & Face ID 1-click payment on iOS & Mac
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'apple_pay' ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/30'}`}>
                      {paymentMethod === 'apple_pay' && <i className="fa-solid fa-check text-[10px] font-black"></i>}
                    </div>
                  </label>

                  {/* Option 4: Credit / Debit Card */}
                  <label
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'credit_card'
                        ? 'bg-gradient-to-r from-white/15 to-white/5 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 text-lg">
                        <i className="fa-solid fa-credit-card"></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">Credit or Debit Card</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Visa, Mastercard, American Express, UnionPay
                        </p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'credit_card' ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/30'}`}>
                      {paymentMethod === 'credit_card' && <i className="fa-solid fa-check text-[10px] font-black"></i>}
                    </div>
                  </label>
                </div>
              </div>

              {/* Checkout Action Button */}
              <div className="pt-2">
                {paymentMethod === 'google_wallet' && (
                  <button
                    onClick={handleGoogleWalletPay}
                    disabled={isProcessing}
                    className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all active:scale-[0.98] shadow-xl shadow-white/10"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-600 font-black">G</span>
                      <span>Pay with Google Wallet</span>
                      <span className="text-slate-400 font-bold ml-1">({priceDisplay})</span>
                    </div>
                  </button>
                )}

                {paymentMethod === 'fpx' && (
                  <button
                    onClick={handleFpxProceed}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-red-600 to-amber-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all active:scale-[0.98] shadow-xl shadow-red-600/20"
                  >
                    <i className="fa-solid fa-shield-halved"></i>
                    <span>Proceed to FPX Gateway ({priceDisplay})</span>
                  </button>
                )}

                {paymentMethod !== 'google_wallet' && paymentMethod !== 'fpx' && (
                  <button
                    onClick={handleGenericPay}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all active:scale-[0.98] shadow-xl shadow-cyan-500/20"
                  >
                    <span>Confirm Top Up ({priceDisplay})</span>
                  </button>
                )}

                <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-slate-400 font-medium">
                  <i className="fa-solid fa-lock text-emerald-400"></i>
                  <span>256-Bit SSL Encrypted & PCI-DSS Certified Transaction</span>
                </div>
              </div>
            </>
          )}

          {/* STEP 2A: Google Wallet Processing Overlay */}
          {step === 'processing_google' && (
            <div className="py-8 flex flex-col items-center text-center space-y-5 animate-fade-in">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl p-4">
                  <div className="flex items-center justify-center gap-1 font-black text-slate-900 text-xl">
                    <span className="text-blue-500 text-2xl font-black">G</span>
                    <span className="text-sm font-black text-slate-800">Wallet</span>
                  </div>
                </div>
                <div className="absolute -inset-2 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
              </div>

              <div>
                <h4 className="text-lg font-black text-white">Communicating with Google Wallet...</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Authorizing purchase of <span className="text-cyan-400 font-bold">{totalDiamonds.toLocaleString()} Diamonds</span> for {priceDisplay}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full max-w-xs text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Google Account</span>
                  <span className="text-white font-mono">{currentUser.email || 'user@gmail.com'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Linked Card</span>
                  <span className="text-white font-mono flex items-center gap-1">
                    <i className="fa-brands fa-cc-mastercard text-amber-400"></i> •••• 4242
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-white/10 pt-2 font-bold">
                  <span className="text-white">Amount</span>
                  <span className="text-cyan-400 font-mono">{priceDisplay}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2B: FPX B2C Bank Authorization Portal */}
          {step === 'fpx_portal' && (
            <div className="space-y-4 animate-fade-in">
              {/* FPX Official Banner */}
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/80">FPX B2C Payment Gateway</div>
                  <div className="text-base font-black">
                    {FPX_BANKS.find(b => b.id === selectedBank)?.name}
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-mono font-bold">
                  RM {selectedPackage.myrPrice.toFixed(2)}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between text-slate-400 pb-2 border-b border-white/10">
                  <span>Merchant:</span>
                  <span className="text-white font-bold">YoungPapi Live Streaming Sdn Bhd</span>
                </div>
                <div className="flex justify-between text-slate-400 pb-2 border-b border-white/10">
                  <span>Item:</span>
                  <span className="text-cyan-400 font-bold">{totalDiamonds.toLocaleString()} Diamonds</span>
                </div>
                <div className="flex justify-between text-slate-400 pb-2 border-b border-white/10">
                  <span>Buyer ID / Email:</span>
                  <span className="text-white font-mono">{fpxBuyerEmail}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>FPX Transaction Ref:</span>
                  <span className="text-amber-400 font-mono">FPX{Date.now().toString().slice(-8)}</span>
                </div>
              </div>

              {/* Bank Security / TAC verification */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-white">
                  <i className="fa-solid fa-mobile-screen-button text-amber-400"></i>
                  <span>Authorisation Code (TAC / Push Notification)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  A verification TAC code has been dispatched to your mobile phone registered with {FPX_BANKS.find(b => b.id === selectedBank)?.name}.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={fpxOtp}
                    onChange={(e) => setFpxOtp(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-center font-mono text-base font-black tracking-widest text-amber-300 w-full focus:outline-none focus:border-amber-400"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setFpxOtp(Math.floor(100000 + Math.random() * 900000).toString())}
                    className="px-3 py-2.5 rounded-xl bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white shrink-0"
                  >
                    Resend TAC
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  disabled={isProcessing}
                  className="flex-1 py-3.5 rounded-2xl bg-white/10 text-slate-300 font-bold text-xs hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFpxConfirmPayment}
                  disabled={isProcessing || !fpxOtp}
                  className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all"
                >
                  {isProcessing ? (
                    <i className="fa-solid fa-spinner animate-spin"></i>
                  ) : (
                    <i className="fa-solid fa-shield-check"></i>
                  )}
                  <span>Authorize & Pay RM {selectedPackage.myrPrice.toFixed(2)}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {step === 'success' && completedTx && (
            <div className="py-6 flex flex-col items-center text-center space-y-4 animate-fade-in">
              {/* Confetti & Diamond burst visual */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-950 text-3xl shadow-xl shadow-cyan-400/30 animate-bounce">
                <i className="fa-solid fa-gem"></i>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  Payment Successful
                </span>
                <h4 className="text-2xl font-black text-white mt-2">
                  +{completedTx.diamonds.toLocaleString()} Diamonds
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Credited instantly to your YoungPapi Live Wallet!
                </p>
              </div>

              {/* Transaction Receipt Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Reference ID</span>
                  <span className="text-white font-mono font-bold">{completedTx.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payment Method</span>
                  <span className="text-cyan-400 font-bold">{completedTx.method}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Amount Paid</span>
                  <span className="text-white font-bold">{completedTx.totalCost}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-white/10 pt-2 font-bold">
                  <span className="text-white">Updated Balance</span>
                  <span className="text-cyan-400 text-sm font-black flex items-center gap-1">
                    <i className="fa-solid fa-gem text-xs"></i> {currentUser.diamonds.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="w-full pt-2 flex gap-3">
                <button
                  onClick={resetAndClose}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-black text-xs shadow-xl shadow-cyan-500/25 hover:opacity-95 transition-all"
                >
                  Done & Back to Live
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
