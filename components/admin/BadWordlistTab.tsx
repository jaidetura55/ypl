import React, { useState, useEffect } from 'react';
import { COUNTRIES } from '../../constants';

interface BadWordlistTabProps {
  onShowToast: (msg: string) => void;
}

interface BadWordEntry {
  id: string;
  word: string;
  language: string;
  severity: 'high' | 'medium' | 'low';
  category: 'profanity' | 'hate_speech' | 'harassment' | 'scam' | 'sexual';
  createdAt: string;
}

// Comprehensive multi-language internet-sourced bad words list matching the platform's supported countries
const DEFAULT_PRESET_WORDLIST: BadWordEntry[] = [
  // English (Global / US / UK)
  { id: 'en-1', word: 'fuck', language: 'en', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'en-2', word: 'shit', language: 'en', severity: 'medium', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'en-3', word: 'bitch', language: 'en', severity: 'high', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'en-4', word: 'asshole', language: 'en', severity: 'medium', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'en-5', word: 'bastard', language: 'en', severity: 'medium', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'en-6', word: 'nigger', language: 'en', severity: 'high', category: 'hate_speech', createdAt: '2026-01-01' },
  { id: 'en-7', word: 'cunt', language: 'en', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'en-8', word: 'dick', language: 'en', severity: 'medium', category: 'sexual', createdAt: '2026-01-01' },
  { id: 'en-9', word: 'pussy', language: 'en', severity: 'high', category: 'sexual', createdAt: '2026-01-01' },
  { id: 'en-10', word: 'faggot', language: 'en', severity: 'high', category: 'hate_speech', createdAt: '2026-01-01' },
  { id: 'en-11', word: 'slut', language: 'en', severity: 'high', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'en-12', word: 'whore', language: 'en', severity: 'high', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'en-13', word: 'scam', language: 'en', severity: 'medium', category: 'scam', createdAt: '2026-01-01' },
  { id: 'en-14', word: 'free diamonds hack', language: 'en', severity: 'high', category: 'scam', createdAt: '2026-01-01' },

  // Bahasa Malaysia (MY)
  { id: 'my-1', word: 'babi', language: 'my', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'my-2', word: 'pukimak', language: 'my', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'my-3', word: 'pantat', language: 'my', severity: 'high', category: 'sexual', createdAt: '2026-01-01' },
  { id: 'my-4', word: 'buto', language: 'my', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'my-5', word: 'lancau', language: 'my', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'my-6', word: 'sial', language: 'my', severity: 'medium', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'my-7', word: 'bodoh', language: 'my', severity: 'low', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'my-8', word: 'bangsat', language: 'my', severity: 'high', category: 'harassment', createdAt: '2026-01-01' },

  // Bahasa Indonesia (ID)
  { id: 'id-1', word: 'anjing', language: 'id', severity: 'medium', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'id-2', word: 'bangsat', language: 'id', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'id-3', word: 'kontol', language: 'id', severity: 'high', category: 'sexual', createdAt: '2026-01-01' },
  { id: 'id-4', word: 'memek', language: 'id', severity: 'high', category: 'sexual', createdAt: '2026-01-01' },
  { id: 'id-5', word: 'kampret', language: 'id', severity: 'medium', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'id-6', word: 'goblog', language: 'id', severity: 'medium', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'id-7', word: 'jembut', language: 'id', severity: 'high', category: 'sexual', createdAt: '2026-01-01' },
  { id: 'id-8', word: 'tolol', language: 'id', severity: 'low', category: 'harassment', createdAt: '2026-01-01' },

  // Tagalog (PH - Philippines)
  { id: 'ph-1', word: 'putangina', language: 'ph', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'ph-2', word: 'gago', language: 'ph', severity: 'medium', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'ph-3', word: 'tarantado', language: 'ph', severity: 'medium', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'ph-4', word: 'bobo', language: 'ph', severity: 'low', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'ph-5', word: 'ulol', language: 'ph', severity: 'medium', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'ph-6', word: 'tite', language: 'ph', severity: 'high', category: 'sexual', createdAt: '2026-01-01' },

  // Vietnamese (VN - Vietnam)
  { id: 'vn-1', word: 'địt mẹ', language: 'vn', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'vn-2', word: 'đụ má', language: 'vn', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'vn-3', word: 'lồn', language: 'vn', severity: 'high', category: 'sexual', createdAt: '2026-01-01' },
  { id: 'vn-4', word: 'buồi', language: 'vn', severity: 'high', category: 'sexual', createdAt: '2026-01-01' },
  { id: 'vn-5', word: 'chó đẻ', language: 'vn', severity: 'high', category: 'harassment', createdAt: '2026-01-01' },

  // Thai (TH - Thailand)
  { id: 'th-1', word: 'เย็ด', language: 'th', severity: 'high', category: 'sexual', createdAt: '2026-01-01' },
  { id: 'th-2', word: 'ควย', language: 'th', severity: 'high', category: 'sexual', createdAt: '2026-01-01' },
  { id: 'th-3', word: 'เหี้ย', language: 'th', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'th-4', word: 'สัส', language: 'th', severity: 'medium', category: 'profanity', createdAt: '2026-01-01' },

  // Japanese (JP - Japan)
  { id: 'jp-1', word: '死ね', language: 'jp', severity: 'high', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'jp-2', word: 'ばか', language: 'jp', severity: 'low', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'jp-3', word: 'くそ', language: 'jp', severity: 'medium', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'jp-4', word: 'ちくしょう', language: 'jp', severity: 'medium', category: 'profanity', createdAt: '2026-01-01' },

  // Korean (KR - South Korea)
  { id: 'kr-1', word: '씨발', language: 'kr', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'kr-2', word: '개새끼', language: 'kr', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'kr-3', word: '미친놈', language: 'kr', severity: 'medium', category: 'harassment', createdAt: '2026-01-01' },

  // Chinese (CN / TW / SG)
  { id: 'cn-1', word: '操你妈', language: 'cn', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'cn-2', word: '傻逼', language: 'cn', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'cn-3', word: '草泥马', language: 'cn', severity: 'medium', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'cn-4', word: '王八蛋', language: 'cn', severity: 'medium', category: 'harassment', createdAt: '2026-01-01' },

  // Hindi (IN - India)
  { id: 'in-1', word: 'madarchod', language: 'in', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'in-2', word: 'bhenchod', language: 'in', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'in-3', word: 'chutiya', language: 'in', severity: 'medium', category: 'harassment', createdAt: '2026-01-01' },
  { id: 'in-4', word: 'gandu', language: 'in', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },

  // Arabic (SA / AE / Middle East)
  { id: 'sa-1', word: 'شرموطة', language: 'sa', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'sa-2', word: 'كس اختك', language: 'sa', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'sa-3', word: 'كلب', language: 'sa', severity: 'low', category: 'harassment', createdAt: '2026-01-01' },

  // Spanish (ES / MX / Latin America)
  { id: 'es-1', word: 'puta', language: 'es', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'es-2', word: 'mierda', language: 'es', severity: 'medium', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'es-3', word: 'hijo de puta', language: 'es', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'es-4', word: 'cabrón', language: 'es', severity: 'medium', category: 'harassment', createdAt: '2026-01-01' },

  // Portuguese (BR - Brazil)
  { id: 'br-1', word: 'porra', language: 'br', severity: 'medium', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'br-2', word: 'caralho', language: 'br', severity: 'high', category: 'profanity', createdAt: '2026-01-01' },
  { id: 'br-3', word: 'filho da puta', language: 'br', severity: 'high', category: 'profanity', createdAt: '2026-01-01' }
];

export default function BadWordlistTab({ onShowToast }: BadWordlistTabProps) {
  // Global Enable/Disable Master Switch
  const [filterEnabled, setFilterEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('youngpapi_wordlist_filter_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Action on Match: 'censor' (replace with ***) or 'block' (reject message from sending)
  const [matchAction, setMatchAction] = useState<'censor' | 'block'>('censor');

  // Wordlist state
  const [wordlist, setWordlist] = useState<BadWordEntry[]>(() => {
    try {
      const saved = localStorage.getItem('youngpapi_bad_wordlist');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return DEFAULT_PRESET_WORDLIST;
  });

  // Active language filter in UI
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Manual Add Form State
  const [newWord, setNewWord] = useState('');
  const [newLanguage, setNewLanguage] = useState('en');
  const [newSeverity, setNewSeverity] = useState<'high' | 'medium' | 'low'>('high');
  const [newCategory, setNewCategory] = useState<'profanity' | 'hate_speech' | 'harassment' | 'scam' | 'sexual'>('profanity');

  // Test Chat Sandbox
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ censored: string; detectedWords: string[]; blocked: boolean } | null>(null);

  // Sync to localStorage
  const saveWordlist = (newList: BadWordEntry[]) => {
    setWordlist(newList);
    localStorage.setItem('youngpapi_bad_wordlist', JSON.stringify(newList));
    // Also save to backend
    fetch('/api/admin/wordlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordlist: newList, enabled: filterEnabled })
    }).catch(() => {});
  };

  const handleToggleFilter = () => {
    const newState = !filterEnabled;
    setFilterEnabled(newState);
    localStorage.setItem('youngpapi_wordlist_filter_enabled', String(newState));
    fetch('/api/admin/wordlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordlist, enabled: newState })
    }).catch(() => {});
    onShowToast(`Live Chat Wordlist filter is now ${newState ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleAddManualWord = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newWord.trim().toLowerCase();
    if (!clean) return;

    if (wordlist.some(w => w.word.toLowerCase() === clean)) {
      onShowToast(`"${clean}" is already in the bad wordlist.`);
      return;
    }

    const newEntry: BadWordEntry = {
      id: `custom-${Date.now()}`,
      word: clean,
      language: newLanguage,
      severity: newSeverity,
      category: newCategory,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newEntry, ...wordlist];
    saveWordlist(updated);
    setNewWord('');
    onShowToast(`Added "${clean}" to ${newLanguage.toUpperCase()} Wordlist.`);
  };

  const handleDeleteWord = (id: string, word: string) => {
    const updated = wordlist.filter(w => w.id !== id);
    saveWordlist(updated);
    onShowToast(`Removed "${word}" from Wordlist.`);
  };

  const handleResetToPresets = () => {
    if (confirm('Reset wordlist to official internet multi-language defaults? Custom added words will be refreshed.')) {
      saveWordlist(DEFAULT_PRESET_WORDLIST);
      onShowToast('Wordlist reset to internet defaults.');
    }
  };

  // Test phrase against current wordlist
  const runTestPhrase = () => {
    if (!testInput.trim()) {
      setTestResult(null);
      return;
    }

    if (!filterEnabled) {
      setTestResult({
        censored: testInput,
        detectedWords: [],
        blocked: false
      });
      return;
    }

    let detected: string[] = [];
    let processed = testInput;

    wordlist.forEach(entry => {
      const regex = new RegExp(`\\b${entry.word.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(testInput)) {
        detected.push(entry.word);
        processed = processed.replace(regex, '*'.repeat(entry.word.length));
      }
    });

    const isBlocked = matchAction === 'block' && detected.length > 0;

    setTestResult({
      censored: processed,
      detectedWords: detected,
      blocked: isBlocked
    });
  };

  // Filtered entries for display
  const filteredList = wordlist.filter(w => {
    const matchLang = selectedLanguage === 'all' || w.language === selectedLanguage;
    const matchSearch = w.word.toLowerCase().includes(searchQuery.toLowerCase()) || w.category.includes(searchQuery.toLowerCase());
    return matchLang && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Master Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${
            filterEnabled ? 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/10' : 'bg-red-500/20 text-red-400'
          }`}>
            <i className="fa-solid fa-spell-check"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">Bad Wordlist & Chat Filter</h2>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                filterEnabled
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                  : 'bg-red-950 text-red-300 border-red-800/60'
              }`}>
                {filterEnabled ? 'ACTIVE & FILTERING' : 'DISABLED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated multi-language censorship across live stream chat rooms and direct messages.
            </p>
          </div>
        </div>

        {/* Global Enable / Disable Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleFilter}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
              filterEnabled
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            <i className={`fa-solid ${filterEnabled ? 'fa-ban' : 'fa-check'}`}></i>
            <span>{filterEnabled ? 'Disable All Wordlist Filter' : 'Enable All Wordlist Filter'}</span>
          </button>

          <button
            onClick={handleResetToPresets}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
            title="Reload official internet lists"
          >
            <i className="fa-solid fa-arrows-rotate mr-1"></i> Reset Defaults
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Blacklisted Words</span>
          <div className="text-2xl font-black text-white">{wordlist.length}</div>
          <span className="text-[10px] text-indigo-400 font-bold mt-1 block">Across 13 Languages</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Filter Action Mode</span>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => { setMatchAction('censor'); onShowToast('Action mode: Asterisk Censoring (***)'); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                matchAction === 'censor' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Censor (***)
            </button>
            <button
              onClick={() => { setMatchAction('block'); onShowToast('Action mode: Block Entire Message'); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                matchAction === 'block' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Block Message
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Live Chat Status</span>
          <div className={`text-base font-black ${filterEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
            {filterEnabled ? 'Shielding Real-time Rooms' : 'Bypass Allowed'}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Live Stream & DM Chat</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Detected Country Coverage</span>
          <div className="text-xl font-black text-amber-400">100% Full Sync</div>
          <span className="text-[10px] text-slate-400 mt-1 block">MY, ID, PH, VN, TH, JP, KR, etc.</span>
        </div>
      </div>

      {/* Real-time Test Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
        <h3 className="text-sm font-black text-white flex items-center gap-2 mb-3">
          <i className="fa-solid fa-flask-vial text-indigo-400"></i>
          <span>Live Chat Censor Simulator (Test Any Sentence)</span>
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runTestPhrase()}
            placeholder="Type a test chat message (e.g. 'Hello you fuck idiot babi')"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={runTestPhrase}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Test Filter
          </button>
        </div>

        {testResult && (
          <div className="mt-4 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Filter Verdict:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                testResult.detectedWords.length === 0
                  ? 'bg-emerald-950 text-emerald-300'
                  : testResult.blocked
                  ? 'bg-red-950 text-red-300'
                  : 'bg-amber-950 text-amber-300'
              }`}>
                {testResult.detectedWords.length === 0
                  ? 'CLEAN (ALLOWED)'
                  : testResult.blocked
                  ? 'MESSAGE BLOCKED FROM SENDING'
                  : 'CENSORED (ASTERISKS APPLIED)'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Live Stream Output View:</span>
              <div className="font-mono text-sm font-bold text-white bg-slate-900 p-2.5 rounded-xl border border-slate-800 mt-1">
                {testResult.blocked ? <span className="text-red-400 italic">[Message blocked by platform moderation rules]</span> : testResult.censored}
              </div>
            </div>
            {testResult.detectedWords.length > 0 && (
              <div className="text-[11px] text-red-400 font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Violating terms detected: {testResult.detectedWords.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Add Word Form & Filter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Add Word Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg h-fit">
          <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
            <i className="fa-solid fa-plus-circle text-emerald-400"></i>
            <span>Add Custom Manual Word</span>
          </h3>

          <form onSubmit={handleAddManualWord} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Word or Phrase
              </label>
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Enter word or phrase..."
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Language / Country
                </label>
                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="en">English (Global)</option>
                  <option value="my">Bahasa Malaysia (MY)</option>
                  <option value="id">Bahasa Indonesia (ID)</option>
                  <option value="ph">Tagalog (PH)</option>
                  <option value="vn">Vietnamese (VN)</option>
                  <option value="th">Thai (TH)</option>
                  <option value="jp">Japanese (JP)</option>
                  <option value="kr">Korean (KR)</option>
                  <option value="cn">Chinese (CN/TW)</option>
                  <option value="in">Hindi (IN)</option>
                  <option value="sa">Arabic (SA/AE)</option>
                  <option value="es">Spanish (ES/MX)</option>
                  <option value="br">Portuguese (BR)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Severity
                </label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="high">High (Immediate)</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low (Warning)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="profanity">Profanity & Swearing</option>
                <option value="hate_speech">Hate Speech & Racism</option>
                <option value="harassment">Harassment & Bullying</option>
                <option value="scam">Scam & Fake Currency</option>
                <option value="sexual">Explicit & Sexual</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <i className="fa-solid fa-floppy-disk mr-1.5"></i> Save & Apply to Live Chat
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Wordlist Table & Language Tabs */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col">
          {/* Language Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-slate-800 custom-scrollbar">
            <button
              onClick={() => setSelectedLanguage('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                selectedLanguage === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Languages ({wordlist.length})
            </button>
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                selectedLanguage === 'en' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🇺🇸 English ({wordlist.filter(w => w.language === 'en').length})
            </button>
            <button
              onClick={() => setSelectedLanguage('my')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                selectedLanguage === 'my' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🇲🇾 Malay ({wordlist.filter(w => w.language === 'my').length})
            </button>
            <button
              onClick={() => setSelectedLanguage('id')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                selectedLanguage === 'id' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🇮🇩 Indonesian ({wordlist.filter(w => w.language === 'id').length})
            </button>
            <button
              onClick={() => setSelectedLanguage('ph')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                selectedLanguage === 'ph' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🇵🇭 Tagalog ({wordlist.filter(w => w.language === 'ph').length})
            </button>
            <button
              onClick={() => setSelectedLanguage('vn')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                selectedLanguage === 'vn' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🇻🇳 Vietnamese ({wordlist.filter(w => w.language === 'vn').length})
            </button>
            <button
              onClick={() => setSelectedLanguage('th')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                selectedLanguage === 'th' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🇹🇭 Thai ({wordlist.filter(w => w.language === 'th').length})
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words, categories..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-[11px] text-slate-400 font-bold shrink-0">
              Showing {filteredList.length} of {wordlist.length}
            </span>
          </div>

          {/* Word List Table */}
          <div className="flex-1 overflow-y-auto max-h-[460px] custom-scrollbar border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="py-2.5 px-3">Word / Phrase</th>
                  <th className="py-2.5 px-3">Lang</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">
                      {item.word}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px] uppercase font-bold">
                        {item.language}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 capitalize text-[11px]">
                      {item.category.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        item.severity === 'high'
                          ? 'bg-red-950 text-red-300 border border-red-800/60'
                          : item.severity === 'medium'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteWord(item.id, item.word)}
                        className="text-slate-500 hover:text-red-400 text-xs transition-colors p-1"
                        title="Delete word"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
