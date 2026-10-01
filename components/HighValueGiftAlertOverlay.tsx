import React, { useEffect, useState, useRef } from 'react';
import { HighValueGiftAlert } from '../types';

interface HighValueGiftAlertOverlayProps {
  alert: HighValueGiftAlert | null;
  queueCount?: number;
  onDismiss: () => void;
  onCheer?: (message: string) => void;
  onInspectUser?: (userId: string) => void;
}

// Synthesize crystalline diamond fanfare sound using Web Audio API
export const playHighValueDiamondFanfare = (tier: 'elite' | 'luxury' | 'cosmic') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (tier === 'cosmic') {
      // Grand celebratory cosmic fanfare (trumpet chord arpeggios + crystalline cascade)
      const trumpetPitches = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      trumpetPitches.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.45);
      });

      // Shimmering diamond crystals
      [2093, 2637, 3135, 4186].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.4 + idx * 0.06);
        gain.gain.setValueAtTime(0.15, now + 0.4 + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + idx * 0.06 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + 0.4 + idx * 0.06);
        osc.stop(now + 0.4 + idx * 0.06 + 0.85);
      });
    } else if (tier === 'luxury') {
      // Royal gold fanfare
      const freqs = [440, 554.37, 659.25, 880, 1108.73];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.09 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 1.15);
      });
    } else {
      // Diamond Elite chime
      const freqs = [587.33, 739.99, 880, 1174.66];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.25, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.95);
      });
    }
  } catch (e) {}
};

export default function HighValueGiftAlertOverlay({
  alert,
  queueCount = 0,
  onDismiss,
  onCheer,
  onInspectUser,
}: HighValueGiftAlertOverlayProps) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [hasCheered, setHasCheered] = useState(false);
  const durationMs = alert?.tier === 'cosmic' ? 7000 : alert?.tier === 'luxury' ? 6000 : 5200;
  const startTimeRef = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(0);

  // Play fanfare sound upon receiving new alert
  useEffect(() => {
    if (alert) {
      playHighValueDiamondFanfare(alert.tier);
      setProgress(100);
      setHasCheered(false);
      startTimeRef.current = Date.now();
      elapsedRef.current = 0;
    }
  }, [alert?.id]);

  // Countdown timer bar
  useEffect(() => {
    if (!alert) return;
    const interval = setInterval(() => {
      if (!isPaused) {
        elapsedRef.current += 50;
        const remainingPct = Math.max(0, 100 - (elapsedRef.current / durationMs) * 100);
        setProgress(remainingPct);
        if (elapsedRef.current >= durationMs) {
          clearInterval(interval);
          onDismiss();
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [alert?.id, isPaused, durationMs, onDismiss]);

  if (!alert) return null;

  const isCosmic = alert.tier === 'cosmic';
  const isLuxury = alert.tier === 'luxury';

  // Tier configuration badges and aesthetics
  const tierConfig = isCosmic
    ? {
        badgeText: '🌌 COSMIC WHALE DONATION',
        headline: 'ASTRONOMICAL DIAMOND DROP!',
        accentGradient: 'from-purple-500 via-pink-500 to-cyan-400',
        cardBg: 'bg-slate-950/95 border-cyan-400/80 shadow-[0_0_40px_rgba(6,182,212,0.45)]',
        sparkleEmoji: '✨ 💎 🌌',
        glowColor: 'cyan',
      }
    : isLuxury
    ? {
        badgeText: '👑 ULTRA LUXURY SHOWER',
        headline: 'ROYAL HIGH-ROLLER BLESSING!',
        accentGradient: 'from-amber-400 via-yellow-400 to-orange-500',
        cardBg: 'bg-slate-950/95 border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.4)]',
        sparkleEmoji: '👑 💎 🌟',
        glowColor: 'amber',
      }
    : {
        badgeText: '💎 HIGH-VALUE DIAMOND ALERT',
        headline: 'MAJOR DIAMOND CELEBRATION!',
        accentGradient: 'from-indigo-400 via-cyan-400 to-emerald-400',
        cardBg: 'bg-slate-950/95 border-indigo-400/70 shadow-[0_0_25px_rgba(99,102,241,0.35)]',
        sparkleEmoji: '💎 💖 ✨',
        glowColor: 'indigo',
      };

  const handleQuickCheer = (reactionText: string) => {
    if (onCheer) {
      onCheer(reactionText);
      setHasCheered(true);
    }
  };

  return (
    <div
      className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[75] w-[95%] max-w-lg animate-in slide-in-from-top-6 duration-300 pointer-events-auto select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 backdrop-blur-2xl p-4 sm:p-5 text-white transition-all ${tierConfig.cardBg}`}
      >
        {/* Animated Shimmer Sweep Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-pulse" />

        {/* Ambient background particle aura */}
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase bg-white/10 border border-white/20 text-transparent bg-clip-text bg-gradient-to-r ${tierConfig.accentGradient}`}
            >
              <i className="fa-solid fa-gem text-[10px] text-cyan-400 animate-spin" />
              <span>{tierConfig.badgeText}</span>
            </span>

            {queueCount > 0 && (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                +{queueCount} more in queue
              </span>
            )}
          </div>

          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
            title="Dismiss Alert"
          >
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        </div>

        {/* Main Showcase Grid */}
        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          {/* Gifter Avatar + Level Badge */}
          <div
            className="relative flex-shrink-0 cursor-pointer group"
            onClick={() => onInspectUser && onInspectUser(alert.senderId)}
            title="View Gifter Profile"
          >
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-0.5 bg-gradient-to-tr ${tierConfig.accentGradient} shadow-md group-hover:scale-105 transition-transform`}
            >
              <img
                src={
                  alert.senderAvatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    alert.senderName
                  )}&background=4f46e5&color=fff`
                }
                alt={alert.senderName}
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md border border-slate-900 shadow">
              Lv.{alert.senderLevel || 10}
            </div>
          </div>

          {/* Details & Diamond Counts */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="font-black text-sm sm:text-base text-white hover:text-cyan-300 transition-colors truncate max-w-[150px] sm:max-w-[200px] cursor-pointer"
                onClick={() => onInspectUser && onInspectUser(alert.senderId)}
              >
                {alert.senderName}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                showered {alert.receiverName ? alert.receiverName : 'the host'} with
              </span>
            </div>

            {/* Gift Title + Big Count */}
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl filter drop-shadow-md animate-bounce">
                {alert.gift.icon}
              </span>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>{alert.gift.name}</span>
                  <span className="text-amber-400 font-extrabold text-sm sm:text-base">
                    x{alert.quantity}
                  </span>
                </div>
                {/* Total Diamonds Value */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-yellow-300 to-amber-400 drop-shadow">
                    💎 {alert.totalCost.toLocaleString()} Diamonds
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-300/90">
                    (+{alert.beansEarned.toLocaleString()} 🫘 Beans Salary)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Viewer Reaction Bar */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 hidden sm:inline">
              React:
            </span>
            <button
              onClick={() =>
                handleQuickCheer(
                  `👏 WOW! Massive ${alert.quantity}x ${alert.gift.name} (${alert.totalCost.toLocaleString()} 💎) from ${alert.senderName}! 🎉`
                )
              }
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-white transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>👏</span>
              <span className="text-[10px]">Cheer</span>
            </button>
            <button
              onClick={() =>
                handleQuickCheer(
                  `🔥 Absolute Whale! Thank you ${alert.senderName} for the ${alert.gift.name}! 💎`
                )
              }
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-white transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>🔥</span>
              <span className="text-[10px]">Fire</span>
            </button>
            <button
              onClick={() =>
                handleQuickCheer(
                  `❤️ Much love to ${alert.senderName} for blessing this room with ${alert.totalCost.toLocaleString()} 💎! 👑`
                )
              }
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-white transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>❤️</span>
              <span className="text-[10px]">Hype</span>
            </button>
          </div>

          {hasCheered ? (
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <i className="fa-solid fa-check" /> Sent!
            </span>
          ) : (
            <span className="text-[9px] text-slate-400 font-mono hidden sm:inline">
              Auto-dismiss in {Math.ceil((progress / 100) * (durationMs / 1000))}s
            </span>
          )}
        </div>

        {/* Auto-Dismiss Decreasing Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 bg-gradient-to-r ${tierConfig.accentGradient}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
