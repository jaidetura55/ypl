import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CheckInDayReward {
  day: number;
  beans: number;
  label: string;
  isMega?: boolean;
}

export const CHECKIN_REWARDS: CheckInDayReward[] = [
  { day: 1, beans: 50, label: "+50" },
  { day: 2, beans: 100, label: "+100" },
  { day: 3, beans: 150, label: "+150" },
  { day: 4, beans: 200, label: "+200" },
  { day: 5, beans: 300, label: "+300" },
  { day: 6, beans: 400, label: "+400" },
  { day: 7, beans: 600, label: "+600 Mega", isMega: true },
];

export const getLocalDateString = (date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
};

export default function DailyCheckInModal({ isOpen, onClose }: DailyCheckInModalProps) {
  const { currentUser, updateUser } = useData();
  const [isClaiming, setIsClaiming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [claimedReward, setClaimedReward] = useState<CheckInDayReward | null>(null);

  if (!isOpen) return null;

  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();

  const lastCheckIn = currentUser.lastCheckInDate;
  const rawStreak = currentUser.checkInStreak || 0;

  // Determine if already checked in today
  const isCheckedInToday = lastCheckIn === todayStr;

  // Determine active streak count and which day in the 7-day cycle is active
  let currentCycleDay = 1;
  let nextStreakCount = 1;

  if (isCheckedInToday) {
    // Current streak already includes today
    currentCycleDay = ((rawStreak - 1) % 7) + 1;
    nextStreakCount = rawStreak;
  } else if (lastCheckIn === yesterdayStr) {
    // Checked in yesterday, continues consecutive streak
    currentCycleDay = (rawStreak % 7) + 1;
    nextStreakCount = rawStreak + 1;
  } else {
    // Missed a day or first check-in -> resets to Day 1
    currentCycleDay = 1;
    nextStreakCount = 1;
  }

  const todayReward = CHECKIN_REWARDS[currentCycleDay - 1] || CHECKIN_REWARDS[0];

  const handleClaim = () => {
    if (isCheckedInToday || isClaiming) return;

    setIsClaiming(true);
    const bonusBeans = todayReward.beans;

    setTimeout(() => {
      const updatedBeans = (currentUser.beans || 0) + bonusBeans;
      updateUser(currentUser.id, {
        beans: updatedBeans,
        checkInStreak: nextStreakCount,
        lastCheckInDate: todayStr
      });

      setClaimedReward(todayReward);
      setShowCelebration(true);
      setIsClaiming(false);

      // Record in session so user knows it was claimed
      try {
        sessionStorage.setItem('daily_checkin_claimed_' + todayStr, 'true');
      } catch (e) {}
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 rounded-[2.5rem] border border-amber-500/30 p-6 sm:p-7 shadow-2xl text-white overflow-hidden animate-fade-in-up">
        {/* Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors z-20"
          title="Close"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* Celebration Banner Overlay */}
        {showCelebration && claimedReward && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center text-5xl mb-4 shadow-xl shadow-amber-500/40 animate-bounce">
              <i className="fa-solid fa-coins"></i>
            </div>
            <span className="text-xs uppercase tracking-widest font-black text-amber-400 mb-1">
              Bonus Reward Claimed!
            </span>
            <h3 className="text-3xl font-black text-white mb-2 font-mono">
              +{claimedReward.beans} Beans
            </h3>
            <p className="text-xs text-slate-300 max-w-xs mb-6 leading-relaxed">
              Congratulations! Your {nextStreakCount}-day login streak bonus has been deposited to your creator Beans wallet.
            </p>
            <div className="bg-white/10 border border-white/15 px-4 py-2 rounded-2xl mb-6 text-xs text-slate-200">
              New Balance: <strong className="text-amber-400 font-mono text-sm">{(currentUser.beans || 0).toLocaleString()} Beans</strong>
            </div>
            <button
              onClick={() => {
                setShowCelebration(false);
                onClose();
              }}
              className="w-full max-w-xs py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition-transform"
            >
              Awesome! Continue
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 flex-shrink-0">
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white leading-tight">
                Daily Check-in
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <i className="fa-solid fa-fire text-amber-400 text-[9px]"></i> {rawStreak} Day Streak
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Check in daily to earn bonus Beans for creator withdrawals!
            </p>
          </div>
        </div>

        {/* Current Status Box */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
              <i className="fa-solid fa-coins"></i>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                Current Beans Balance
              </span>
              <span className="text-sm font-black text-white font-mono">
                {(currentUser.beans || 0).toLocaleString()} Beans
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">
              Today's Reward
            </span>
            <span className="text-sm font-black text-amber-400 font-mono">
              +{todayReward.beans} Beans
            </span>
          </div>
        </div>

        {/* 7-Day Reward Grid */}
        <div className="mb-6 relative z-10">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              7-Day Streak Track
            </span>
            <span className="text-[11px] font-bold text-amber-400">
              Day {currentCycleDay} of 7
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {CHECKIN_REWARDS.map((reward) => {
              const dayNum = reward.day;
              const isPastClaimed = isCheckedInToday ? dayNum <= currentCycleDay : dayNum < currentCycleDay;
              const isTodayActive = dayNum === currentCycleDay;
              const isFuture = isCheckedInToday ? dayNum > currentCycleDay : dayNum > currentCycleDay;

              return (
                <div
                  key={dayNum}
                  className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between text-center transition-all ${
                    reward.isMega ? 'col-span-2 sm:col-span-1' : ''
                  } ${
                    isPastClaimed
                      ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                      : isTodayActive
                      ? 'bg-gradient-to-b from-amber-500/30 to-amber-600/10 border-2 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.03]'
                      : 'bg-white/5 border border-white/10 text-slate-400'
                  }`}
                >
                  {/* Status Indicator */}
                  {isPastClaimed && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-black shadow-xs">
                      <i className="fa-solid fa-check"></i>
                    </div>
                  )}

                  {isTodayActive && !isCheckedInToday && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tight shadow-sm whitespace-nowrap">
                      Claim
                    </span>
                  )}

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Day {dayNum}
                  </span>

                  {/* Icon */}
                  <div className={`my-1 text-lg ${
                    isPastClaimed 
                      ? 'text-emerald-400' 
                      : isTodayActive 
                      ? 'text-amber-400 animate-pulse' 
                      : reward.isMega 
                      ? 'text-yellow-400 text-xl' 
                      : 'text-amber-500/70'
                  }`}>
                    {reward.isMega ? (
                      <i className="fa-solid fa-gift"></i>
                    ) : (
                      <i className="fa-solid fa-coins"></i>
                    )}
                  </div>

                  <span className={`text-[11px] font-black font-mono leading-tight ${
                    isTodayActive ? 'text-amber-300' : isPastClaimed ? 'text-emerald-300' : 'text-slate-300'
                  }`}>
                    {reward.label}
                  </span>

                  {isFuture && (
                    <i className="fa-solid fa-lock text-[8px] text-slate-600 mt-1"></i>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim / Status Action Button */}
        <div className="relative z-10 space-y-3">
          {isCheckedInToday ? (
            <div className="space-y-2">
              <button
                disabled
                className="w-full py-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-sm flex items-center justify-center gap-2 cursor-default"
              >
                <i className="fa-solid fa-circle-check text-emerald-400"></i>
                <span>Checked In Today! (+{todayReward.beans} Beans Claimed)</span>
              </button>
              <p className="text-[11px] text-center text-slate-400 font-medium">
                Come back tomorrow after midnight to claim Day {((currentCycleDay % 7) + 1)} reward!
              </p>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isClaiming ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                  <span>Depositing Bonus Beans...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-sparkles text-base"></i>
                  <span>Claim Today's +{todayReward.beans} Beans</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-shield-halved text-amber-500 text-[10px]"></i>
              Rewards reset if a day is missed
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
