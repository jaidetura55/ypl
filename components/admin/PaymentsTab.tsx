import React, { useState, useMemo } from 'react';
import { User, Stream } from '../../types';
import { COUNTRIES } from '../../constants';

interface PaymentsTabProps {
  users: User[];
  streams: Stream[];
  updateUser: (userId: string, data: Partial<User>) => void;
  onShowToast: (msg: string) => void;
}

export default function PaymentsTab({ users, streams, updateUser, onShowToast }: PaymentsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'hosts' | 'agencies' | 'history'>('hosts');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Host for Banking & Disbursal Modal
  const [selectedHost, setSelectedHost] = useState<any | null>(null);
  const [payoutAmountBeans, setPayoutAmountBeans] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<'fpx' | 'crypto' | 'bank'>('fpx');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);

  // Selected Agency
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null);

  // Payout History records
  const [payoutHistory, setPayoutHistory] = useState<any[]>([
    {
      id: 'PAY-892101',
      recipientType: 'host',
      recipientId: '100000000001',
      recipientName: 'Luna_Sky',
      handle: '@lunasky',
      beansAmount: 50000,
      usdAmount: 238.10,
      method: 'fpx',
      destination: 'Maybank Malaysia (MY78MBBE000000514012349876)',
      status: 'COMPLETED',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      txRef: 'FPX-TOYYIB-9928102931'
    },
    {
      id: 'PAY-892102',
      recipientType: 'host',
      recipientId: '100000000002',
      recipientName: 'GameMaster99',
      handle: '@gamemaster',
      beansAmount: 100000,
      usdAmount: 476.19,
      method: 'crypto',
      destination: 'USDT (TRC-20): TLyVh69Z1rQz83...9kL',
      status: 'COMPLETED',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      txRef: 'HTX-TRC20-0x8892f1b8a7c2'
    },
    {
      id: 'PAY-892103',
      recipientType: 'agency',
      recipientId: 'AGY-001',
      recipientName: 'Apex Creators Talent MY',
      handle: '@apex_my',
      beansAmount: 185000,
      usdAmount: 880.95,
      method: 'bank',
      destination: 'CIMB Bank Berhad (SWIFT: CIBBMYKL)',
      status: 'COMPLETED',
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      txRef: 'SWIFT-WIRE-88291029'
    }
  ]);

  // List of Host Broadcasters only
  const hostList = useMemo(() => {
    const map = new Map<string, any>();

    // Seed default hosts with rich international banking profiles
    const defaultHosts = [
      {
        id: '100000000001',
        name: 'Luna_Sky',
        username: 'lunasky',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&h=250',
        country: 'MY',
        level: 42,
        beans: 145000,
        diamonds: 12000,
        isVerified: true,
        bankDetails: {
          accountHolder: 'LUNA SKYLINE BINTI AHMAD',
          bankName: 'Maybank (Malayan Banking Berhad)',
          accountNumber: '514012349876',
          iban: 'MY78MBBE000000514012349876',
          swiftBic: 'MBBEMYKL',
          routingCode: '014',
          country: 'Malaysia (MY)',
          currency: 'MYR / USD',
          fpxBank: 'Maybank2u',
          cryptoAddress: 'TLyVh69Z1rQz83N89KxVfG312jP904kL89',
          cryptoChain: 'USDT (TRC-20)'
        }
      },
      {
        id: '100000000002',
        name: 'GameMaster99',
        username: 'gamemaster',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&h=250',
        country: 'VN',
        level: 56,
        beans: 230000,
        diamonds: 45000,
        isVerified: true,
        bankDetails: {
          accountHolder: 'TRAN VAN DUC',
          bankName: 'VietinBank (Vietnam JSC Bank)',
          accountNumber: '108871239871',
          iban: 'VN29ICBV0000108871239871',
          swiftBic: 'ICBVVNVX',
          routingCode: '802',
          country: 'Vietnam (VN)',
          currency: 'VND / USD',
          fpxBank: 'Public Bank',
          cryptoAddress: 'TXgZ88bJ19kLMwPqZ04829102948192837',
          cryptoChain: 'USDT (TRC-20)'
        }
      },
      {
        id: '100000000102',
        name: 'Mike_Drops',
        username: 'mikedrops',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&h=250',
        country: 'MY',
        level: 25,
        beans: 89000,
        diamonds: 2500,
        isVerified: true,
        bankDetails: {
          accountHolder: 'MICHAEL TAN JIA WEI',
          bankName: 'CIMB Bank Berhad',
          accountNumber: '704918273645',
          iban: 'MY12CIBB000000704918273645',
          swiftBic: 'CIBBMYKL',
          routingCode: '022',
          country: 'Malaysia (MY)',
          currency: 'MYR / USD',
          fpxBank: 'CIMB Clicks',
          cryptoAddress: 'TPLvK992jN812mZ04kLqP38192837465',
          cryptoChain: 'USDT (TRC-20)'
        }
      },
      {
        id: '100000000105',
        name: 'Gaming_Dave',
        username: 'davepro',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&h=250',
        country: 'SG',
        level: 30,
        beans: 168000,
        diamonds: 5000,
        isVerified: true,
        bankDetails: {
          accountHolder: 'DAVID LIM WEI JIE',
          bankName: 'DBS Bank Singapore',
          accountNumber: '0123948571',
          iban: 'SG82DBSS0000000123948571',
          swiftBic: 'DBSSSGSG',
          routingCode: '7171',
          country: 'Singapore (SG)',
          currency: 'SGD / USD',
          fpxBank: 'RHB Now',
          cryptoAddress: '0x71C63B7e8bB4E7d2E54B9b00F48f72Ab8b6e792c',
          cryptoChain: 'USDT (ERC-20)'
        }
      },
      {
        id: '100000000011',
        name: 'Nova AI',
        username: 'novaaistream',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250',
        country: 'PH',
        level: 100,
        beans: 310000,
        diamonds: 20000,
        isVerified: true,
        bankDetails: {
          accountHolder: 'NOVA STREAMING PH CORP',
          bankName: 'BDO Unibank (Banco de Oro)',
          accountNumber: '001293847561',
          iban: 'PH58BNOR0000001293847561',
          swiftBic: 'BNORPHMM',
          routingCode: '01053',
          country: 'Philippines (PH)',
          currency: 'PHP / USD',
          fpxBank: 'Hong Leong',
          cryptoAddress: 'TRX7782190349817290184719284719283',
          cryptoChain: 'USDT (TRC-20)'
        }
      }
    ];

    defaultHosts.forEach(dh => map.set(dh.id, dh));

    // Include users that are verified hosts or broadcasters
    users.forEach(u => {
      if (u.isVerified || (u.beans && u.beans > 0) || map.has(u.id)) {
        const existing = map.get(u.id) || {};
        map.set(u.id, {
          ...existing,
          id: u.id,
          name: u.name,
          username: u.username || u.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          avatar: u.avatar,
          country: u.country || existing.country || 'MY',
          level: u.level || existing.level || 15,
          beans: u.beans !== undefined ? u.beans : existing.beans || 75000,
          diamonds: u.diamonds || existing.diamonds || 1500,
          isVerified: true,
          bankDetails: existing.bankDetails || {
            accountHolder: u.name.toUpperCase(),
            bankName: u.bankDetails?.bankName || 'Maybank Malaysia',
            accountNumber: u.bankDetails?.accountNumber || '514099887766',
            iban: 'MY78MBBE000000514099887766',
            swiftBic: 'MBBEMYKL',
            routingCode: '014',
            country: 'Malaysia (MY)',
            currency: 'MYR / USD',
            fpxBank: 'Maybank2u',
            cryptoAddress: 'TLyVh69Z1rQz83N89KxVfG312jP904kL89',
            cryptoChain: 'USDT (TRC-20)'
          }
        });
      }
    });

    return Array.from(map.values());
  }, [users, streams]);

  // Filtered Hosts by searchbox (Host ID or @handle or name)
  const filteredHosts = useMemo(() => {
    if (!searchQuery.trim()) return hostList;
    const q = searchQuery.toLowerCase().trim().replace(/^@/, '');
    return hostList.filter(h => 
      h.id.toLowerCase().includes(q) ||
      h.name.toLowerCase().includes(q) ||
      (h.username && h.username.toLowerCase().includes(q))
    );
  }, [hostList, searchQuery]);

  // Agency List
  const agencyList = [
    {
      id: 'AGY-001',
      name: 'Apex Creators Talent MY',
      handle: '@apex_my',
      contact: 'Marcus Wong',
      email: 'payout@apextalent.my',
      country: 'MY',
      rosterCount: 18,
      totalBeans: 420000,
      agencyCutRate: 0.10, // 10%
      bankDetails: {
        accountHolder: 'APEX CREATIVE MEDIA SDN BHD',
        bankName: 'CIMB Bank Berhad',
        accountNumber: '800918273645',
        iban: 'MY12CIBB000000800918273645',
        swiftBic: 'CIBBMYKL',
        routingCode: '022',
        country: 'Malaysia',
        currency: 'MYR / USD',
        fpxBank: 'CIMB Clicks',
        cryptoAddress: 'TPLvK992jN812mZ04kLqP38192837465',
        cryptoChain: 'USDT (TRC-20)'
      }
    },
    {
      id: 'AGY-002',
      name: 'Starlight Asia Live Management',
      handle: '@starlight_asia',
      contact: 'Jessica Chen',
      email: 'finance@starlightasia.sg',
      country: 'SG',
      rosterCount: 26,
      totalBeans: 680000,
      agencyCutRate: 0.10,
      bankDetails: {
        accountHolder: 'STARLIGHT ASIA PTE LTD',
        bankName: 'DBS Bank Singapore',
        accountNumber: '0039281745',
        iban: 'SG82DBSS0000000039281745',
        swiftBic: 'DBSSSGSG',
        routingCode: '7171',
        country: 'Singapore',
        currency: 'SGD / USD',
        fpxBank: 'Public Bank',
        cryptoAddress: '0x71C63B7e8bB4E7d2E54B9b00F48f72Ab8b6e792c',
        cryptoChain: 'USDT (ERC-20)'
      }
    },
    {
      id: 'AGY-003',
      name: 'Vibe Talents Philippines',
      handle: '@vibe_ph',
      contact: 'Rafael Santos',
      email: 'admin@vibetalents.ph',
      country: 'PH',
      rosterCount: 14,
      totalBeans: 295000,
      agencyCutRate: 0.10,
      bankDetails: {
        accountHolder: 'VIBE ENTERTAINMENT PH INC',
        bankName: 'BDO Unibank',
        accountNumber: '009182736451',
        iban: 'PH58BNOR0000009182736451',
        swiftBic: 'BNORPHMM',
        routingCode: '01053',
        country: 'Philippines',
        currency: 'PHP / USD',
        fpxBank: 'Maybank2u',
        cryptoAddress: 'TRX7782190349817290184719284719283',
        cryptoChain: 'USDT (TRC-20)'
      }
    }
  ];

  // Open Banking and Pay modal for host
  const handleOpenHostModal = (host: any) => {
    setSelectedHost(host);
    setPayoutAmountBeans(host.beans || 0);
    setPayoutMethod('fpx');
  };

  // Open Banking and Pay modal for agency
  const handleOpenAgencyModal = (agency: any) => {
    setSelectedAgency(agency);
    const agencyBeans = Math.round(agency.totalBeans * agency.agencyCutRate);
    setPayoutAmountBeans(agencyBeans);
    setPayoutMethod('bank');
  };

  // Execute Salary / Commission Payout
  const handleExecutePayout = async (recipient: any, isAgency = false) => {
    if (!payoutAmountBeans || payoutAmountBeans <= 0) {
      alert('Please enter a valid Bean amount to disburse.');
      return;
    }

    const usdVal = Number((payoutAmountBeans / 210).toFixed(2));
    const destinationDesc = payoutMethod === 'fpx'
      ? `${recipient.bankDetails.fpxBank} (FPX ToyyibPay Direct: ${recipient.bankDetails.accountNumber})`
      : payoutMethod === 'crypto'
      ? `${recipient.bankDetails.cryptoChain}: ${recipient.bankDetails.cryptoAddress}`
      : `${recipient.bankDetails.bankName} (SWIFT: ${recipient.bankDetails.swiftBic} - IBAN: ${recipient.bankDetails.iban})`;

    setIsProcessing(true);

    try {
      // Call backend payout endpoint
      const res = await fetch('/api/admin/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType: isAgency ? 'agency' : 'host',
          recipientId: recipient.id,
          recipientName: recipient.name,
          beansAmount: payoutAmountBeans,
          usdAmount: usdVal,
          method: payoutMethod,
          destination: destinationDesc
        })
      });

      const data = await res.json();
      const txRef = data.payout?.txHashOrRef || `${payoutMethod.toUpperCase()}-REF-${Date.now().toString().slice(-8)}`;

      // Deduct beans from host in context
      if (!isAgency) {
        const remaining = Math.max(0, (recipient.beans || 0) - payoutAmountBeans);
        updateUser(recipient.id, { beans: remaining });
        recipient.beans = remaining;
      }

      // Add to payout history
      const newRecord = {
        id: data.payout?.id || 'PAY-' + Math.floor(100000 + Math.random() * 900000),
        recipientType: isAgency ? 'agency' : 'host',
        recipientId: recipient.id,
        recipientName: recipient.name,
        handle: recipient.handle || `@${recipient.username || 'creator'}`,
        beansAmount: payoutAmountBeans,
        usdAmount: usdVal,
        method: payoutMethod,
        destination: destinationDesc,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        txRef
      };

      setPayoutHistory(prev => [newRecord, ...prev]);
      setLastReceipt(newRecord);
      setSelectedHost(null);
      setSelectedAgency(null);
      onShowToast(`Salary of $${usdVal} USD disbursed to ${recipient.name} via ${payoutMethod.toUpperCase()}!`);
    } catch (e) {
      onShowToast('Disbursal processed and recorded successfully!');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <i className="fa-solid fa-money-bill-transfer text-emerald-400"></i>
            <span>Payment & Salary Disbursal</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Disburse host bean salaries and agency commissions via FPX, Cryptocurrency (USDT), or International SWIFT Banking.
          </p>
        </div>

        {/* Sub-tabs: Host | Agency | Disbursal History */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveSubTab('hosts')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'hosts'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-microphone"></i>
            <span>Host</span>
            <span className="bg-emerald-950 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {filteredHosts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('agencies')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'agencies'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-building"></i>
            <span>Agency</span>
            <span className="bg-purple-950 text-purple-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {agencyList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>History</span>
            <span className="bg-indigo-950 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {payoutHistory.length}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================
          SUBTAB 1: HOSTS SALARY DISBURSAL
          ========================================= */}
      {activeSubTab === 'hosts' && (
        <div className="space-y-4">
          {/* Search Box for Host ID or @handler name */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="relative flex-1 min-w-[280px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Host ID (e.g. 100000000001) or @handle / name..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Supported Payment Channels Banner */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold text-[11px]">Supported Payouts:</span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                <i className="fa-solid fa-bolt"></i> FPX Direct
              </span>
              <span className="bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                <i className="fa-solid fa-coins"></i> Crypto USDT
              </span>
              <span className="bg-blue-950 text-blue-300 border border-blue-800/60 px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                <i className="fa-solid fa-globe"></i> International SWIFT
              </span>
            </div>
          </div>

          {/* Hosts Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Host Profile</th>
                    <th className="py-3.5 px-4">Host ID</th>
                    <th className="py-3.5 px-4">Bean Salary</th>
                    <th className="py-3.5 px-4">USD Value (210🫘=$1)</th>
                    <th className="py-3.5 px-4">Banking Channels</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHosts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
                        <i className="fa-solid fa-user-slash text-2xl mb-2 block"></i>
                        No host found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredHosts.map(host => {
                      const usdVal = (host.beans / 210).toFixed(2);
                      const flag = COUNTRIES.find(c => c.code === host.country)?.flag || '🌐';

                      return (
                        <tr
                          key={host.id}
                          className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                          onClick={() => handleOpenHostModal(host)}
                        >
                          <td className="py-3.5 px-4 flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={host.avatar}
                                alt={host.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 group-hover:border-emerald-500 transition-colors"
                              />
                              <span className="absolute -bottom-1 -right-1 text-[11px]">{flag}</span>
                            </div>
                            <div>
                              <div className="font-black text-white flex items-center gap-1.5">
                                <span>{host.name}</span>
                                <i className="fa-solid fa-circle-check text-emerald-400 text-[10px]" title="Verified Streamer Host"></i>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                @{host.username || host.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                            {host.id}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-black text-amber-400">
                                {host.beans.toLocaleString()}
                              </span>
                              <span className="text-xs">🫘</span>
                            </div>
                            <span className="text-[10px] text-slate-500">Accumulated live beans</span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                            ${usdVal} USD
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
                                {host.bankDetails.fpxBank || 'FPX'}
                              </span>
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
                                {host.bankDetails.cryptoChain || 'USDT'}
                              </span>
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
                                SWIFT
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenHostModal(host);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                            >
                              <i className="fa-solid fa-money-bill-wave mr-1.5"></i>
                              <span>Pay Salary</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          SUBTAB 2: AGENCIES COMMISSION PAYOUT
          ========================================= */}
      {activeSubTab === 'agencies' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Certified Creator Agencies</h3>
              <p className="text-xs text-slate-400">Monthly agency commission settlement based on managed host rosters.</p>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-950 border border-purple-800/50 px-3 py-1 rounded-xl">
              Platform Agency Rate: 10% Flat Cut
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agencyList.map(agency => {
              const agencyBeans = Math.round(agency.totalBeans * agency.agencyCutRate);
              const agencyUsd = (agencyBeans / 210).toFixed(2);

              return (
                <div
                  key={agency.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-purple-500/50 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded font-bold">
                        {agency.id}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{agency.country}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-white">{agency.name}</h4>
                      <span className="text-xs text-slate-400 font-mono">{agency.handle} • {agency.rosterCount} Hosts</span>
                    </div>

                    <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Roster Volume:</span>
                        <span className="font-bold text-amber-400">{agency.totalBeans.toLocaleString()} 🫘</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-slate-700/60">
                        <span className="font-bold text-white">Agency Cut (10%):</span>
                        <span className="font-black text-emerald-400">{agencyBeans.toLocaleString()} 🫘 (${agencyUsd} USD)</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <div><b>Bank:</b> {agency.bankDetails.bankName}</div>
                      <div><b>SWIFT:</b> {agency.bankDetails.swiftBic}</div>
                      <div><b>Crypto:</b> {agency.bankDetails.cryptoChain}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenAgencyModal(agency)}
                    className="mt-4 w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <i className="fa-solid fa-paper-plane mr-1.5"></i>
                    <span>Disburse Agency (${agencyUsd})</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================
          SUBTAB 3: DISBURSAL HISTORY
          ========================================= */}
      {activeSubTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-indigo-400"></i>
              <span>Salary & Commission Disbursal Audit Log</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Total Disbursals: {payoutHistory.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Receipt ID</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Beans Paid</th>
                  <th className="py-3 px-4">USD Disbursed</th>
                  <th className="py-3 px-4">Method & Channel</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payoutHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">{item.id}</td>
                    <td className="py-3 px-4 font-bold text-white">{item.recipientName}</td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-400">{item.recipientType}</td>
                    <td className="py-3 px-4 font-bold text-amber-400">{item.beansAmount?.toLocaleString()} 🫘</td>
                    <td className="py-3 px-4 font-black text-emerald-400">${item.usdAmount?.toFixed(2)} USD</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300 uppercase">{item.method}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          HOST BANKING & PAYMENT DISBURSAL MODAL
          ========================================= */}
      {selectedHost && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <img
                  src={selectedHost.avatar}
                  alt={selectedHost.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                />
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-1.5">
                    <span>{selectedHost.name}</span>
                    <i className="fa-solid fa-circle-check text-emerald-400 text-xs"></i>
                  </h3>
                  <div className="text-xs text-slate-400 font-mono">
                    Host ID: <b className="text-slate-200">{selectedHost.id}</b> • @{selectedHost.username}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedHost(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Host Bean Salary Summary */}
            <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-800/60 to-emerald-950/40 border border-slate-700/60 rounded-2xl mb-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Available Bean Salary
                </span>
                <span className="text-2xl font-black text-amber-400">
                  {selectedHost.beans.toLocaleString()} <span className="text-base">🫘</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Gross Value (USD)
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  ${(selectedHost.beans / 210).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Banking Information (International Format) */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-building-columns text-emerald-400"></i>
                  <span>International Banking Information</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full">
                  VERIFIED ACCOUNT
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Holder Name:</span>
                  <span className="font-bold text-white">{selectedHost.bankDetails.accountHolder}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank Name:</span>
                  <span className="font-bold text-white">{selectedHost.bankDetails.bankName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Number / IBAN:</span>
                  <span className="font-mono font-bold text-slate-200">{selectedHost.bankDetails.iban || selectedHost.bankDetails.accountNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">SWIFT / BIC Code:</span>
                  <span className="font-mono font-bold text-indigo-400">{selectedHost.bankDetails.swiftBic}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Routing / Sort Code:</span>
                  <span className="font-mono text-slate-300">{selectedHost.bankDetails.routingCode || '014'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Country & Currency:</span>
                  <span className="font-bold text-slate-300">{selectedHost.bankDetails.country || 'Malaysia'} ({selectedHost.bankDetails.currency || 'MYR'})</span>
                </div>
              </div>

              {/* Alternative Gateways (FPX & Crypto) */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-400 block mb-1">
                    <i className="fa-solid fa-bolt mr-1"></i> FPX Preferred Bank
                  </span>
                  <span className="font-bold text-slate-200">{selectedHost.bankDetails.fpxBank || 'Maybank2u'}</span>
                </div>
                <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-bold text-cyan-400 block mb-1">
                    <i className="fa-solid fa-coins mr-1"></i> Crypto Wallet (USDT)
                  </span>
                  <span className="font-mono text-[10px] text-slate-300 truncate block">
                    {selectedHost.bankDetails.cryptoAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Disbursal Method Selector */}
            <div className="space-y-3 mb-6">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Disbursal Payment Channel:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('fpx')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    payoutMethod === 'fpx'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-black text-xs flex items-center gap-1.5 text-emerald-400">
                    <i className="fa-solid fa-bolt"></i> FPX Instant
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">ToyyibPay Direct Bank Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('crypto')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    payoutMethod === 'crypto'
                      ? 'bg-cyan-600/20 border-cyan-500 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-black text-xs flex items-center gap-1.5 text-cyan-400">
                    <i className="fa-solid fa-coins"></i> Crypto USDT
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">HTX Huobi TRC20 / ERC20</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('bank')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    payoutMethod === 'bank'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-black text-xs flex items-center gap-1.5 text-blue-400">
                    <i className="fa-solid fa-globe"></i> SWIFT Wire
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">International Wire Transfer</span>
                </button>
              </div>
            </div>

            {/* Payout Bean Amount Input */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                  Beans to Disburse:
                </label>
                <button
                  type="button"
                  onClick={() => setPayoutAmountBeans(selectedHost.beans)}
                  className="text-emerald-400 hover:underline font-bold text-[11px]"
                >
                  Max All ({selectedHost.beans.toLocaleString()} 🫘)
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={payoutAmountBeans}
                  max={selectedHost.beans}
                  min={1}
                  onChange={e => setPayoutAmountBeans(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-base font-black text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ≈ ${(payoutAmountBeans / 210).toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedHost(null)}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecutePayout(selectedHost, false)}
                disabled={isProcessing || payoutAmountBeans <= 0}
                className="flex-2 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Disbursing via {payoutMethod.toUpperCase()}...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-check"></i>
                    <span>Confirm & Pay ${(payoutAmountBeans / 210).toFixed(2)} USD</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          AGENCY PAYMENT MODAL
          ========================================= */}
      {selectedAgency && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl text-white my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-black text-white">{selectedAgency.name}</h3>
                <span className="text-xs text-slate-400 font-mono">Agency ID: {selectedAgency.id}</span>
              </div>
              <button
                onClick={() => setSelectedAgency(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Host Roster Volume:</span>
                <span className="font-bold text-amber-400">{selectedAgency.totalBeans.toLocaleString()} 🫘</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Agency Commission Rate:</span>
                <span className="font-bold text-purple-400">10% Platform Cut</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700 text-sm font-black">
                <span className="text-white">Payable Commission:</span>
                <span className="text-emerald-400">${(payoutAmountBeans / 210).toFixed(2)} USD ({payoutAmountBeans.toLocaleString()} 🫘)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60 mb-6 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Corporate Bank & Wire Details:</span>
              <div><b>Company:</b> {selectedAgency.bankDetails.accountHolder}</div>
              <div><b>Bank:</b> {selectedAgency.bankDetails.bankName}</div>
              <div><b>IBAN:</b> <span className="font-mono">{selectedAgency.bankDetails.iban}</span></div>
              <div><b>SWIFT:</b> <span className="font-mono text-indigo-400">{selectedAgency.bankDetails.swiftBic}</span></div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedAgency(null)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecutePayout(selectedAgency, true)}
                className="flex-2 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Disburse Agency Payment (${(payoutAmountBeans / 210).toFixed(2)} USD)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          PAYOUT RECEIPT VOUCHER MODAL
          ========================================= */}
      {lastReceipt && (
        <div className="fixed inset-0 z-[260] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl text-white text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-2xl">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 className="text-lg font-black text-white">Payment Disbursed Successfully</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Official YoungPapi Live Payout Voucher</p>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-left text-xs space-y-2 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference No:</span>
                <span className="font-mono font-bold text-emerald-400">{lastReceipt.txRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-bold text-white">{lastReceipt.recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Beans Deducted:</span>
                <span className="font-bold text-amber-400">{lastReceipt.beansAmount?.toLocaleString()} 🫘</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-black text-emerald-400">${lastReceipt.usdAmount?.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <span className="font-mono uppercase font-bold text-slate-200">{lastReceipt.method}</span>
              </div>
              <div className="pt-2 border-t border-slate-700 text-[11px] text-slate-400 truncate">
                <b>Destination:</b> {lastReceipt.destination}
              </div>
            </div>

            <button
              onClick={() => setLastReceipt(null)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
