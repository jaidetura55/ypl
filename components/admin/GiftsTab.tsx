import React, { useState, useEffect } from 'react';
import { Gift } from '../../types';
import { useData } from '../../contexts/DataContext';

interface GiftsTabProps {
  onShowToast: (msg: string) => void;
}

export default function GiftsTab({ onShowToast }: GiftsTabProps) {
  const {
    gifts,
    addGift,
    updateGift,
    deleteGift,
    toggleGift,
    users,
    economySettings,
    economyAnalytics,
    updateEconomySettings,
    refreshEconomyAnalytics
  } = useData();

  const [activeFilter, setActiveFilter] = useState<'all' | 'static' | 'animated'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [testAnimationGift, setTestAnimationGift] = useState<Gift | null>(null);

  // Virtual Economy Profit Ratio Slider State
  const [companyCut, setCompanyCut] = useState<number>(economySettings?.companyCutPercentage ?? 30);
  const streamerCut = 100 - companyCut;

  // Lucky Bet System State
  const [luckyEnabled, setLuckyEnabled] = useState<boolean>(economySettings?.luckyGiftEnabled ?? true);
  const [luckyWinRate, setLuckyWinRate] = useState<number>(economySettings?.luckyWinRatePercentage ?? 70);
  const [luckyMinutes, setLuckyMinutes] = useState<number>(economySettings?.luckySessionMinutes ?? 3);

  // Currency Converter Display State
  const [selectedCurrency, setSelectedCurrency] = useState<'ALL' | 'USD' | 'SGD' | 'MYR' | 'IDR'>('ALL');
  const [isSavingEconomy, setIsSavingEconomy] = useState<boolean>(false);

  // Sync state if economySettings updates from server
  useEffect(() => {
    if (economySettings) {
      setCompanyCut(economySettings.companyCutPercentage ?? 30);
      setLuckyEnabled(economySettings.luckyGiftEnabled ?? true);
      setLuckyWinRate(economySettings.luckyWinRatePercentage ?? 70);
      setLuckyMinutes(economySettings.luckySessionMinutes ?? 3);
    }
  }, [economySettings]);

  // New Gift Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'static' | 'animated'>('static');
  const [newPrice, setNewPrice] = useState<number>(100);
  const [newBeans, setNewBeans] = useState<number>(70);
  const [newIcon, setNewIcon] = useState('🎁');
  const [newAnimationType, setNewAnimationType] = useState<Gift['animationType']>('ferrari');
  const [newDescription, setNewDescription] = useState('');

  // Editing Gift State
  const [editingGift, setEditingGift] = useState<Gift | null>(null);

  const filteredGifts = gifts.filter((g) => {
    if (activeFilter === 'static') return g.type === 'static' || g.category === 'Static';
    if (activeFilter === 'animated') return g.type === 'animated' || g.category === 'Animated' || Boolean(g.animationType);
    return true;
  });

  // Calculate live volume and profits
  const totalVolume = economyAnalytics?.totalDiamondsVolume || users.reduce((acc, u) => acc + (u.totalSpending || 0), 45000);
  const companyProfitDiamonds = Math.round(totalVolume * (companyCut / 100));
  const streamerProfitBeans = Math.round(totalVolume * (streamerCut / 100));

  // Multi-Currency Exchange Rates
  const usdRate = 100; // 100 diamonds = 1.00 USD
  const rateSGD = economySettings?.usdToSgd || 1.35;
  const rateMYR = economySettings?.usdToMyr || 4.45;
  const rateIDR = economySettings?.usdToIdr || 15800;

  // Company Profit in 4 Currencies
  const companyUSD = companyProfitDiamonds / usdRate;
  const companySGD = companyUSD * rateSGD;
  const companyMYR = companyUSD * rateMYR;
  const companyIDR = companyUSD * rateIDR;

  // Streamer Profit in 4 Currencies
  const streamerUSD = streamerProfitBeans / usdRate;
  const streamerSGD = streamerUSD * rateSGD;
  const streamerMYR = streamerUSD * rateMYR;
  const streamerIDR = streamerUSD * rateIDR;

  // Format currency helpers
  const fmtUsd = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtSgd = (val: number) => `S$ ${val.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtMyr = (val: number) => `RM ${val.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtIdr = (val: number) => `Rp ${Math.round(val).toLocaleString('id-ID')}`;

  const handleSaveEconomySettings = async () => {
    setIsSavingEconomy(true);
    const success = await updateEconomySettings({
      companyCutPercentage: companyCut,
      streamerCutPercentage: streamerCut,
      luckyGiftEnabled: luckyEnabled,
      luckyWinRatePercentage: luckyWinRate,
      luckySessionMinutes: luckyMinutes
    });
    setIsSavingEconomy(false);

    if (success) {
      onShowToast(`✅ Virtual Economy Updated: ${companyCut}% Company Take / ${streamerCut}% Streamer Share | Lucky Bet: ${luckyWinRate}% (${luckyMinutes}min session)`);
      refreshEconomyAnalytics();
    } else {
      onShowToast('❌ Failed to update economy settings. Please check server connection.');
    }
  };

  const handleCreateGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      onShowToast('⚠️ Please enter a gift name.');
      return;
    }

    const calculatedHostBeans = Math.round(Number(newPrice) * (streamerCut / 100));

    const created: Gift = {
      id: `gift_${Date.now()}`,
      name: newName.trim(),
      type: newType,
      category: newType === 'animated' ? 'Animated' : 'Static',
      price: Math.max(1, Number(newPrice)),
      beans: Math.max(1, Number(newBeans || calculatedHostBeans)),
      icon: newIcon.trim() || '🎁',
      animationType: newType === 'animated' ? newAnimationType : undefined,
      description: newDescription.trim() || (newType === 'animated' ? 'Animated luxury live gift' : 'Static live gift'),
      isActive: true
    };

    addGift(created);
    setShowAddModal(false);
    onShowToast(`🎉 Created new ${newType} gift: "${created.name}" (${created.price} 💎 / ${created.beans} 🫘 salary)`);

    // Reset form
    setNewName('');
    setNewPrice(100);
    setNewBeans(Math.round(100 * (streamerCut / 100)));
    setNewIcon('🎁');
    setNewDescription('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGift) return;
    updateGift(editingGift.id, {
      name: editingGift.name,
      price: Math.max(1, Number(editingGift.price)),
      beans: Math.max(1, Number(editingGift.beans)),
      icon: editingGift.icon,
      type: editingGift.type,
      animationType: editingGift.animationType,
      description: editingGift.description
    });
    setEditingGift(null);
    onShowToast(`Updated gift: "${editingGift.name}"`);
  };

  const handleTestAnimation = (gift: Gift) => {
    setTestAnimationGift(gift);
    setTimeout(() => {
      setTestAnimationGift(null);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <i className="fa-solid fa-scale-balanced text-cyan-400"></i>
              <span>Virtual Economy & Profit Distribution</span>
            </h2>
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black px-3 py-1 rounded-full">
              SPLIT: {companyCut}% / {streamerCut}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure dynamic profit split ratio between Company & Streamer, view host salary balance in USD, SGD, MYR, IDR, and manage Lucky Gift bet algorithms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveEconomySettings}
            disabled={isSavingEconomy}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <i className={`fa-solid ${isSavingEconomy ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
            <span>{isSavingEconomy ? 'Saving Settings...' : 'Save Economy Ratio'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-pink-600/30 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add New Gift</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC RATIO SLIDER CARD */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-sliders text-indigo-400"></i>
              <span>Profit Share Ratio (Company Take % vs Streamer Balance Profit %)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Slide to adjust what percentage of each gift diamond the platform takes versus how much is credited to streamer bean salaries.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-cyan-400 font-mono">Company: {companyCut}%</span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] font-bold text-amber-400 font-mono">Streamer: {streamerCut}%</span>
          </div>
        </div>

        {/* Visual Dual-Colored Split Bar */}
        <div className="space-y-2">
          <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5">
            <div
              style={{ width: `${companyCut}%` }}
              className="h-full bg-gradient-to-r from-cyan-600 to-blue-600 rounded-l-lg flex items-center justify-center text-[10px] font-black text-white shadow-inner transition-all duration-150"
            >
              {companyCut >= 15 && `🏢 Company ${companyCut}%`}
            </div>
            <div
              style={{ width: `${streamerCut}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-r-lg flex items-center justify-center text-[10px] font-black text-slate-900 shadow-inner transition-all duration-150"
            >
              {streamerCut >= 15 && `🎙️ Streamer ${streamerCut}%`}
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="relative pt-1">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={companyCut}
              onChange={(e) => setCompanyCut(Number(e.target.value))}
              className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0% Company (100% Streamer)</span>
              <span>25% / 75%</span>
              <span>50% / 50%</span>
              <span>75% / 25%</span>
              <span>100% Company (0% Streamer)</span>
            </div>
          </div>
        </div>

        {/* Quick Ratio Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Presets:</span>
          {[
            { comp: 10, label: '10% / 90% (Creator Friendly)' },
            { comp: 20, label: '20% / 80% (High Growth)' },
            { comp: 30, label: '30% / 70% (Standard Platform)' },
            { comp: 40, label: '40% / 60% (Agency Balance)' },
            { comp: 50, label: '50% / 50% (Equal Split)' },
            { comp: 70, label: '70% / 30% (High Margin)' }
          ].map((preset) => (
            <button
              key={preset.comp}
              onClick={() => setCompanyCut(preset.comp)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                companyCut === preset.comp
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Live Simulation Formula Box */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <i className="fa-solid fa-calculator text-cyan-400"></i>
            <span>
              <b>Live Simulation:</b> On a <b>1,000 💎</b> gift sent by viewer:
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono font-bold">
            <span className="text-cyan-400">Company Profit: +{Math.round(1000 * (companyCut / 100))} 💎 ({fmtUsd((1000 * (companyCut / 100)) / 100)})</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400">Streamer Balance: +{Math.round(1000 * (streamerCut / 100))} 🫘 ({fmtUsd((1000 * (streamerCut / 100)) / 100)})</span>
          </div>
        </div>
      </div>

      {/* 3. MULTI-CURRENCY PROFIT BALANCE MATRIX (USD, SGD, MYR, IDR) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-coins text-amber-400"></i>
              <span>Profit Balance Currency Matrix (USD, SGD, MYR, IDR)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live valuation of platform company take and streamer salary balance converted across Southeast Asian and Global currencies.
            </p>
          </div>

          {/* Currency Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {(['ALL', 'USD', 'SGD', 'MYR', 'IDR'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCurrency === curr
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {curr === 'ALL' ? '🌍 All Currencies' : curr === 'USD' ? '🇺🇸 USD' : curr === 'SGD' ? '🇸🇬 SGD' : curr === 'MYR' ? '🇲🇾 MYR' : '🇮🇩 IDR'}
              </button>
            ))}
          </div>
        </div>

        {/* 2 Flagship Financial Balance Cards: Company vs Streamer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* COMPANY PROFIT CARD */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-500/30 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg">
                  <i className="fa-solid fa-building-columns"></i>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Company Net Profit Balance</h4>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">Ratio Share: {companyCut}% of Gross Diamond Gifts</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Volume</span>
                <span className="text-base font-black text-cyan-400 font-mono">{companyProfitDiamonds.toLocaleString()} 💎</span>
              </div>
            </div>

            {/* Currency Breakdown Grid for Company */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(selectedCurrency === 'ALL' || selectedCurrency === 'USD') && (
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <span>🇺🇸</span> USD ($)
                  </span>
                  <div className="text-lg font-black text-white font-mono">{fmtUsd(companyUSD)}</div>
                  <span className="text-[9px] text-slate-500 font-mono">100 💎 = $1.00</span>
                </div>
              )}

              {(selectedCurrency === 'ALL' || selectedCurrency === 'SGD') && (
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <span>🇸🇬</span> SGD (S$)
                  </span>
                  <div className="text-lg font-black text-cyan-300 font-mono">{fmtSgd(companySGD)}</div>
                  <span className="text-[9px] text-slate-500 font-mono">1 USD = {rateSGD} SGD</span>
                </div>
              )}

              {(selectedCurrency === 'ALL' || selectedCurrency === 'MYR') && (
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <span>🇲🇾</span> MYR (RM)
                  </span>
                  <div className="text-lg font-black text-emerald-400 font-mono">{fmtMyr(companyMYR)}</div>
                  <span className="text-[9px] text-slate-500 font-mono">1 USD = {rateMYR} MYR</span>
                </div>
              )}

              {(selectedCurrency === 'ALL' || selectedCurrency === 'IDR') && (
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <span>🇮🇩</span> IDR (Rp)
                  </span>
                  <div className="text-lg font-black text-amber-300 font-mono">{fmtIdr(companyIDR)}</div>
                  <span className="text-[9px] text-slate-500 font-mono">1 USD = 15,800 IDR</span>
                </div>
              )}
            </div>
          </div>

          {/* STREAMER / HOST PROFIT BALANCE CARD */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
                  <i className="fa-solid fa-microphone"></i>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Streamer Host Salary Balance</h4>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">Balance Profit: {streamerCut}% of Gross Diamond Gifts</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Beans</span>
                <span className="text-base font-black text-amber-400 font-mono">{streamerProfitBeans.toLocaleString()} 🫘</span>
              </div>
            </div>

            {/* Currency Breakdown Grid for Streamer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(selectedCurrency === 'ALL' || selectedCurrency === 'USD') && (
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <span>🇺🇸</span> USD ($)
                  </span>
                  <div className="text-lg font-black text-white font-mono">{fmtUsd(streamerUSD)}</div>
                  <span className="text-[9px] text-slate-500 font-mono">Direct Bank Wire</span>
                </div>
              )}

              {(selectedCurrency === 'ALL' || selectedCurrency === 'SGD') && (
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <span>🇸🇬</span> SGD (S$)
                  </span>
                  <div className="text-lg font-black text-cyan-300 font-mono">{fmtSgd(streamerSGD)}</div>
                  <span className="text-[9px] text-slate-500 font-mono">PayNow / FAST</span>
                </div>
              )}

              {(selectedCurrency === 'ALL' || selectedCurrency === 'MYR') && (
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <span>🇲🇾</span> MYR (RM)
                  </span>
                  <div className="text-lg font-black text-emerald-400 font-mono">{fmtMyr(streamerMYR)}</div>
                  <span className="text-[9px] text-slate-500 font-mono">DuitNow / FPX</span>
                </div>
              )}

              {(selectedCurrency === 'ALL' || selectedCurrency === 'IDR') && (
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <span>🇮🇩</span> IDR (Rp)
                  </span>
                  <div className="text-lg font-black text-amber-300 font-mono">{fmtIdr(streamerIDR)}</div>
                  <span className="text-[9px] text-slate-500 font-mono">BCA / GoPay / OVO</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. LUCKY GIFT BET GAMBLE ALGORITHM CONTROLS (3MIN / 5MIN FEELING WIN) */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-dice text-pink-400"></i>
                <span>Lucky Gift Bet Engine & Winning Logic Design</span>
              </h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${luckyEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                {luckyEnabled ? 'ACTIVE IN LIVE ROOM' : 'DISABLED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure viewer gift bet engagement: set the initial &quot;Feeling Win&quot; percentage and session duration (3 min or 5 min) before diamond bets are systematically consumed by house edge.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLuckyEnabled(!luckyEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                luckyEnabled
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {luckyEnabled ? '✅ System Enabled' : '⏸️ System Paused'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Winning Percentage Slider */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <i className="fa-solid fa-trophy text-amber-400 text-xs"></i>
                <span>Initial &quot;Feeling Win&quot; Probability (%)</span>
              </label>
              <span className="text-base font-black text-amber-400 font-mono">{luckyWinRate}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="5"
              value={luckyWinRate}
              onChange={(e) => setLuckyWinRate(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>20% (Strict)</span>
              <span className="text-amber-400">70% (Recommended Dopamine Rush)</span>
              <span>90% (High Hit Rate)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Early in the viewer&apos;s session (first 40%), the algorithm delivers frequent wins (1.5x - 5x multipliers) to create the &quot;Feeling Win&quot; sensation.
            </p>
          </div>

          {/* Session Duration Selector (3min vs 5min) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <i className="fa-solid fa-stopwatch text-cyan-400 text-xs"></i>
                <span>Engagement Session Duration (Minutes)</span>
              </label>
              <span className="text-base font-black text-cyan-400 font-mono">{luckyMinutes} Minutes</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLuckyMinutes(3)}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  luckyMinutes === 3
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span className="text-sm font-black">⏱️ 3 Minutes</span>
                <span className="text-[10px] opacity-80">Fast-Paced Thrill</span>
              </button>

              <button
                type="button"
                onClick={() => setLuckyMinutes(5)}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  luckyMinutes === 5
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span className="text-sm font-black">⏳ 5 Minutes</span>
                <span className="text-[10px] opacity-80">Extended Rollercoaster</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Viewer bets (1 💎 or 100 💎) win and lose back and forth over <b>{luckyMinutes} minutes</b>. Payout multipliers decay smoothly so total bet diamonds settle while streamer gets guaranteed beans.
            </p>
          </div>
        </div>

        {/* Lucky Bet Algorithm Flow Summary */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
            <div>
              <b className="text-white block">Phase 1: Feeling Win Rush</b>
              <span className="text-slate-400 text-[11px]">First 0 to {Math.round(luckyMinutes * 0.4 * 60)}s: {luckyWinRate}% win rate, awards 1.5x - 5x jackpot bursts!</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
            <div>
              <b className="text-white block">Phase 2: Dynamic Decay</b>
              <span className="text-slate-400 text-[11px]">Mid session: win rate scales to ~45%, alternating near-misses and smaller returns.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
            <div>
              <b className="text-white block">Phase 3: Guaranteed Split</b>
              <span className="text-slate-400 text-[11px]">Streamer reliably receives {streamerCut}% beans salary from every bet; company takes {companyCut}%.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. GIFT CATALOG TABS & FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            All Gifts ({gifts.length})
          </button>
          <button
            onClick={() => setActiveFilter('static')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'static'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Static Gifts ({gifts.filter(g => g.type === 'static' || g.category === 'Static').length})
          </button>
          <button
            onClick={() => setActiveFilter('animated')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'animated'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Animated & Luxury Gifts ({gifts.filter(g => g.type === 'animated' || g.category === 'Animated' || g.animationType).length})
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredGifts.length} items • Standard salary: {streamerCut}%
        </div>
      </div>

      {/* 6. GIFTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredGifts.map((gift) => {
          const isAnimated = gift.type === 'animated' || gift.category === 'Animated' || Boolean(gift.animationType);
          const isActive = gift.isActive !== false;
          const hostSalary = gift.beans !== undefined ? gift.beans : Math.round(gift.price * (streamerCut / 100));

          return (
            <div
              key={gift.id}
              className={`bg-slate-900 border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all ${
                isAnimated
                  ? 'border-pink-500/30 hover:border-pink-500/60'
                  : 'border-slate-800 hover:border-slate-700'
              } ${!isActive ? 'opacity-50' : ''}`}
            >
              <div>
                {/* Header with Type & Status */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isAnimated
                        ? 'bg-pink-950 text-pink-300 border border-pink-700/50'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                    }`}
                  >
                    {isAnimated ? '✨ Animated 3D' : 'Static Gift'}
                  </span>

                  <button
                    onClick={() => toggleGift(gift.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {isActive ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </div>

                {/* Gift Icon & Name */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl shadow-inner">
                    {gift.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-white truncate">{gift.name}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{gift.description || 'Virtual gift'}</p>
                    {gift.animationType && (
                      <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40 mt-1 inline-block">
                        Effect: {gift.animationType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price & Salary Info */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 mb-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">User Diamond Cost:</span>
                    <span className="font-bold text-cyan-400 flex items-center gap-1 font-mono">
                      <i className="fa-solid fa-gem text-[10px]"></i>
                      <span>{gift.price.toLocaleString()} 💎</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Host Beans Salary:</span>
                    <span className="font-bold text-amber-400 flex items-center gap-1 font-mono">
                      <span>🫘</span>
                      <span>+{hostSalary.toLocaleString()} Beans</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                    <span className="text-slate-500">Valuation:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {fmtUsd(gift.price / 100)} / {fmtMyr((gift.price / 100) * rateMYR)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {isAnimated && (
                  <button
                    onClick={() => handleTestAnimation(gift)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-pink-950/40 hover:bg-pink-900/60 border border-pink-700/40 text-pink-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Test full-screen animation"
                  >
                    <i className="fa-solid fa-play text-[9px]"></i>
                    <span>Preview FX</span>
                  </button>
                )}

                <button
                  onClick={() => setEditingGift(gift)}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  title="Edit Diamond & Beans Values"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Delete gift "${gift.name}"?`)) {
                      deleteGift(gift.id);
                      onShowToast(`Deleted gift: ${gift.name}`);
                    }
                  }}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 text-[11px] font-bold transition-colors cursor-pointer"
                  title="Delete Gift"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 7. ADD NEW GIFT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-gift text-pink-400"></i>
                <span>Create New Gift</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleCreateGift} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Gift Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Golden Ferrari, Magic Wand, Crystal Heart"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Gift Type</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="static">Static Gift</option>
                    <option value="animated">Animated 3D Gift</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Icon / Emoji</label>
                  <input
                    type="text"
                    required
                    placeholder="🏎️, 🛥️, 👑, 🌹"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-center text-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {newType === 'animated' && (
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Animation Effect Engine</label>
                  <select
                    value={newAnimationType}
                    onChange={(e: any) => setNewAnimationType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-pink-300 font-semibold focus:outline-none focus:border-pink-500"
                  >
                    <option value="ferrari">🏎️ Ferrari Supercar (High Speed Roar)</option>
                    <option value="yacht">🛥️ Ocean Yacht (Turquoise Waves)</option>
                    <option value="rocket">🚀 Space Rocket (Launch & Booster Blast)</option>
                    <option value="dragon">🐉 Imperial Golden Dragon (Mythic Flames)</option>
                    <option value="galaxy">🌌 Galaxy Nova (Cosmic Vortex)</option>
                    <option value="fireworks">🎆 Fireworks Extravaganza (Grand Finale)</option>
                    <option value="pegasus">🦄 Celestial Pegasus (Mythic Flight & Star Dust)</option>
                    <option value="meteor">☄️ Cosmic Meteor (Giant Fireball Strike)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">User Cost (Diamonds 💎)</label>
                  <input
                    type="number"
                    min="1"
                    value={newPrice}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setNewPrice(v);
                      setNewBeans(Math.round(v * (streamerCut / 100)));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-bold font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Host Salary (Beans 🫘)</label>
                  <input
                    type="number"
                    min="1"
                    value={newBeans}
                    onChange={(e) => setNewBeans(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-bold font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Optional brief description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-pink-600/30 cursor-pointer"
                >
                  Create Gift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. EDIT GIFT MODAL */}
      {editingGift && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Edit Gift: {editingGift.name}</span>
              </h3>
              <button
                onClick={() => setEditingGift(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="py-4 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Gift Name</label>
                <input
                  type="text"
                  required
                  value={editingGift.name}
                  onChange={(e) => setEditingGift({ ...editingGift, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">User Cost (💎)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingGift.price}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setEditingGift({ ...editingGift, price: p, beans: Math.round(p * (streamerCut / 100)) });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-bold font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Host Salary (🫘)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingGift.beans || editingGift.price}
                    onChange={(e) => setEditingGift({ ...editingGift, beans: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-bold font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Icon / Emoji</label>
                <input
                  type="text"
                  value={editingGift.icon}
                  onChange={(e) => setEditingGift({ ...editingGift, icon: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-center text-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingGift(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. FULL-SCREEN LIVE ANIMATION PREVIEW OVERLAY */}
      {testAnimationGift && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md pointer-events-auto">
          {testAnimationGift.animationType === 'ferrari' && (
            <div className="w-full max-w-2xl text-center space-y-4 animate-in slide-in-from-left duration-700">
              <div className="text-8xl animate-bounce filter drop-shadow-2xl">🏎️💨</div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 drop-shadow-lg">
                SUPERCAR FERRARI ROARING THROUGH!
              </h2>
              <p className="text-white font-mono text-sm">Sent by Super Admin • +{testAnimationGift.beans?.toLocaleString()} 🫘 Salary</p>
            </div>
          )}

          {testAnimationGift.animationType === 'yacht' && (
            <div className="w-full max-w-2xl text-center space-y-4 animate-in slide-in-from-bottom duration-700">
              <div className="text-8xl filter drop-shadow-2xl animate-pulse">🛥️🌊</div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-lg">
                OCEAN SUPERYACHT HAS ARRIVED!
              </h2>
              <p className="text-white font-mono text-sm">Sent by Super Admin • +{testAnimationGift.beans?.toLocaleString()} 🫘 Salary</p>
            </div>
          )}

          {testAnimationGift.animationType === 'rocket' && (
            <div className="w-full max-w-2xl text-center space-y-4 animate-in slide-in-from-bottom duration-500">
              <div className="text-8xl filter drop-shadow-2xl animate-bounce">🚀🔥</div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-300 drop-shadow-lg">
                SPACE ROCKET BLAST OFF!
              </h2>
              <p className="text-white font-mono text-sm">Sent by Super Admin • +{testAnimationGift.beans?.toLocaleString()} 🫘 Salary</p>
            </div>
          )}

          {testAnimationGift.animationType === 'dragon' && (
            <div className="w-full max-w-2xl text-center space-y-4 animate-in zoom-in-50 duration-700">
              <div className="text-8xl filter drop-shadow-2xl animate-spin">🐉✨</div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 drop-shadow-lg">
                IMPERIAL GOLDEN DRAGON AWAKENS!
              </h2>
              <p className="text-white font-mono text-sm">Sent by Super Admin • +{testAnimationGift.beans?.toLocaleString()} 🫘 Salary</p>
            </div>
          )}

          {testAnimationGift.animationType === 'galaxy' && (
            <div className="w-full max-w-2xl text-center space-y-4 animate-in zoom-in-75 duration-700">
              <div className="text-8xl filter drop-shadow-2xl animate-pulse">🌌💫</div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 drop-shadow-lg">
                COSMIC GALAXY NOVA REVEALED!
              </h2>
              <p className="text-white font-mono text-sm">Sent by Super Admin • +{testAnimationGift.beans?.toLocaleString()} 🫘 Salary</p>
            </div>
          )}

          {testAnimationGift.animationType === 'fireworks' && (
            <div className="w-full max-w-2xl text-center space-y-4 animate-in zoom-in duration-500">
              <div className="text-8xl filter drop-shadow-2xl animate-ping">🎆🎇</div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-300 to-cyan-400 drop-shadow-lg">
                GRAND FINALE FIREWORKS SHOW!
              </h2>
              <p className="text-white font-mono text-sm">Sent by Super Admin • +{testAnimationGift.beans?.toLocaleString()} 🫘 Salary</p>
            </div>
          )}

          {testAnimationGift.animationType === 'pegasus' && (
            <div className="w-full max-w-2xl text-center space-y-4 animate-in zoom-in-75 duration-700">
              <div className="text-8xl filter drop-shadow-2xl animate-bounce">🦄✨</div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 drop-shadow-lg">
                CELESTIAL PEGASUS SOARING THROUGH!
              </h2>
              <p className="text-white font-mono text-sm">Sent by Super Admin • +{testAnimationGift.beans?.toLocaleString()} 🫘 Salary</p>
            </div>
          )}

          {testAnimationGift.animationType === 'meteor' && (
            <div className="w-full max-w-2xl text-center space-y-4 animate-in slide-in-from-top-48 duration-500">
              <div className="text-8xl filter drop-shadow-2xl animate-spin">☄️💥</div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 drop-shadow-lg">
                COSMIC METEOR STRIKE!
              </h2>
              <p className="text-white font-mono text-sm">Sent by Super Admin • +{testAnimationGift.beans?.toLocaleString()} 🫘 Salary</p>
            </div>
          )}

          {!testAnimationGift.animationType && (
            <div className="text-center p-8 bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl">
              <div className="text-8xl mb-3 animate-bounce">{testAnimationGift.icon}</div>
              <h3 className="text-2xl font-black text-white">{testAnimationGift.name}</h3>
              <p className="text-cyan-400 font-mono mt-1">{testAnimationGift.price} 💎 • +{testAnimationGift.beans} 🫘</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
