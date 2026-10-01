
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, ChatMessage } from '../types';
import EmojiPicker from './EmojiPicker';
import ChatCallModal, { CallType } from './ChatCallModal';
import { useData } from '../contexts/DataContext';
import { MOCK_ONLINE_USERS } from '../constants';

interface InboxViewProps {
  onBack: () => void;
}

interface Conversation {
    id: string; // Essentially the other user's ID
    user: Partial<User>;
    lastMessage: string;
    time: string;
    unread: number;
}

// Consistent helper to extract or generate an 8-digit ID for any user
export const get8DigitId = (u?: Partial<User> | null): string => {
  if (!u || !u.id) return '88001001';
  const clean = u.id.replace(/\D/g, '');
  if (clean.length === 8) return clean;
  if (clean.length === 12 && clean.startsWith('10000000')) {
    const suffix = clean.slice(-4);
    return `8800${suffix}`;
  }
  if (clean.length >= 8) {
    const sub = clean.slice(-8);
    if (!sub.startsWith('0000')) return sub;
    return `88${clean.slice(-6)}`;
  }
  let hash = 0;
  for (let i = 0; i < u.id.length; i++) {
    hash = (hash * 31 + u.id.charCodeAt(i)) % 89999999;
  }
  return (10000000 + Math.abs(hash)).toString().slice(0, 8);
};

export const getUsername = (u?: Partial<User> | null): string => {
  if (!u) return 'user';
  if (u.username && u.username.trim()) return u.username.trim().toLowerCase();
  if (u.name && u.name.trim()) return u.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  return 'user';
};

const InboxView: React.FC<InboxViewProps> = ({ onBack }) => {
  const { currentUser, users } = useData();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<Partial<User> | null>(null);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'primary' | 'official' | 'requests'>('primary');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio and Video Call (VC) States
  const [activeCallType, setActiveCallType] = useState<CallType | null>(null);
  const [isCallOpen, setIsCallOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Real State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);

  // Comprehensive user catalog combining DataContext users and online community users
  const allAvailableUsers = useMemo(() => {
    const map = new Map<string, User>();
    // Context users
    users.forEach(u => {
      if (u.id !== currentUser.id) map.set(u.id, u);
    });
    // Mock online community users
    MOCK_ONLINE_USERS.forEach(u => {
      if (u.id !== currentUser.id && !map.has(u.id)) {
        map.set(u.id, {
          ...u,
          username: u.username || u.name.toLowerCase().replace(/[^a-z0-9_]/g, '')
        });
      }
    });
    return Array.from(map.values());
  }, [users, currentUser.id]);

  // 1. Fetch Conversations on Mount
  useEffect(() => {
      const mocks: Conversation[] = allAvailableUsers.slice(0, 4).map((u, idx) => ({
          id: u.id,
          user: u,
          lastMessage: idx === 0 ? "Hey! Are you streaming today?" : idx === 1 ? "Thanks for tuning in!" : "Sent you a gift earlier 🌹",
          time: idx === 0 ? "10:30 AM" : idx === 1 ? "Yesterday" : "2d ago",
          unread: idx === 0 ? 1 : 0
      }));
      setConversations(mocks);
  }, [allAvailableUsers]);

  // 2. Fetch Messages when Chat Selected
  useEffect(() => {
      if (!selectedChatId || !activeChatUser) return;
      const msgs: ChatMessage[] = [
          { id: 'm1', userId: selectedChatId, userName: activeChatUser.name || 'User', text: "Hey there! Nice to connect with you.", timestamp: Date.now() - 120000 },
          { id: 'm2', userId: currentUser.id, userName: currentUser.name, text: "Hi! Glad to connect on YoungPapi.", timestamp: Date.now() - 60000 }
      ];
      setActiveMessages(msgs);
  }, [selectedChatId, activeChatUser, currentUser.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, selectedChatId]);

  const handleOpenChat = (chatId: string, user: Partial<User>) => {
      setSelectedChatId(chatId);
      setActiveChatUser(user);
  };

  const handleStartChatWithUser = (user: Partial<User>) => {
    const existing = conversations.find(c => c.id === user.id);
    if (!existing && user.id) {
      const newConv: Conversation = {
        id: user.id,
        user: user,
        lastMessage: "Chat started",
        time: "Just now",
        unread: 0
      };
      setConversations(prev => [newConv, ...prev]);
    }
    handleOpenChat(user.id || Date.now().toString(), user);
  };

  const handleCreateDirectChatById = (customId: string) => {
    const cleanId = customId.trim();
    const newUser: Partial<User> = {
      id: cleanId,
      name: `User_${cleanId.slice(-4)}`,
      username: `user_${cleanId}`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanId)}&background=6366f1&color=fff`,
      level: 1,
      isVerified: false
    };
    handleStartChatWithUser(newUser);
  };

  const handleSendMessage = async () => {
      if (!inputText.trim() || !selectedChatId) return;
      
      const tempId = Date.now().toString();
      const textToSend = inputText;
      setInputText('');
      setShowEmojiPicker(false);

      const newMsg: ChatMessage = {
          id: tempId,
          userId: currentUser.id,
          userName: currentUser.name,
          text: textToSend,
          timestamp: Date.now()
      };
      setActiveMessages(prev => [...prev, newMsg]);

      // Update last message in conversations
      setConversations(prev => prev.map(c => 
        c.id === selectedChatId ? { ...c, lastMessage: textToSend, time: "Just now" } : c
      ));
  };

  const handleStartCall = (type: CallType) => {
    setActiveCallType(type);
    setIsCallOpen(true);
  };

  const handleEndCall = (type: CallType, durationSec: number) => {
    setIsCallOpen(false);
    setActiveCallType(null);

    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    const durStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const isAudio = type === 'audio';
    const summaryText = isAudio
      ? `📞 Audio Call • ${durationSec > 0 ? durStr : 'Missed'}`
      : `📹 Video Call • ${durationSec > 0 ? durStr : 'Missed'}`;

    const callMsg: ChatMessage = {
      id: `call_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text: summaryText,
      timestamp: Date.now()
    };
    setActiveMessages(prev => [...prev, callMsg]);

    setConversations(prev => prev.map(c => 
      c.id === selectedChatId ? { ...c, lastMessage: summaryText, time: "Just now" } : c
    ));
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {}
  };

  // Search Results filtering by Username or 8-digit ID
  const searchResults = useMemo(() => {
    const raw = searchQuery.trim().toLowerCase();
    if (!raw) return [];

    const textQuery = raw.startsWith('@') ? raw.slice(1) : raw;
    const numericQuery = raw.replace(/\D/g, '');

    return allAvailableUsers.filter(u => {
      const eightDigitId = get8DigitId(u).toLowerCase();
      const fullId = (u.id || '').toLowerCase();
      const username = getUsername(u);
      const name = (u.name || '').toLowerCase();

      // 1. Match username or name
      if (username.includes(textQuery) || name.includes(textQuery)) return true;

      // 2. Match 8-digit ID
      if (eightDigitId.includes(textQuery)) return true;
      if (numericQuery && eightDigitId.includes(numericQuery)) return true;

      // 3. Match full raw ID
      if (fullId.includes(textQuery)) return true;

      return false;
    });
  }, [searchQuery, allAvailableUsers]);

  const getFilteredConversations = () => {
      if (activeTab === 'official') return conversations.filter(c => c.user.level === 99); 
      return conversations;
  };

  if (selectedChatId && activeChatUser) {
      return (
          <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-fade-in-up">
              {/* Chat Header */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-100 shadow-xs z-10">
                  <div className="flex items-center gap-3">
                      <button onClick={() => { setSelectedChatId(null); setActiveChatUser(null); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                          <i className="fa-solid fa-arrow-left text-slate-800"></i>
                      </button>
                      <div className="relative">
                          <img src={activeChatUser.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-100" alt="avatar" />
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                            {activeChatUser.name}
                            {activeChatUser.isVerified && <i className="fa-solid fa-circle-check text-sky-500 text-xs"></i>}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] mt-0.5">
                            <span className="text-slate-400 font-medium">@{getUsername(activeChatUser)}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-indigo-600 font-mono font-bold bg-indigo-50 px-1 rounded">
                              ID: {get8DigitId(activeChatUser)}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-green-500 font-bold">Online</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Audio Call Button */}
                    <button 
                      onClick={() => handleStartCall('audio')}
                      className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-all active:scale-95 shadow-2xs"
                      title="Audio Call"
                      aria-label="Start Audio Call"
                    >
                      <i className="fa-solid fa-phone text-xs"></i>
                    </button>

                    {/* Video Call (VC) Button */}
                    <button 
                      onClick={() => handleStartCall('video')}
                      className="w-8 h-8 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-all active:scale-95 shadow-2xs"
                      title="Video Call (VC)"
                      aria-label="Start Video Call"
                    >
                      <i className="fa-solid fa-video text-xs"></i>
                    </button>

                    {/* Copy 8-digit ID Button */}
                    <button 
                      onClick={(e) => copyToClipboard(get8DigitId(activeChatUser), e)}
                      className="h-8 px-2.5 flex items-center gap-1.5 rounded-full hover:bg-slate-100 text-slate-500 text-xs font-semibold transition-colors"
                      title="Copy 8-digit ID"
                    >
                      <i className="fa-regular fa-copy text-xs"></i>
                      <span className="hidden sm:inline font-mono text-[11px]">{copiedId ? 'Copied!' : get8DigitId(activeChatUser)}</span>
                    </button>
                  </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3" onClick={() => setShowEmojiPicker(false)}>
                  <div className="text-center py-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-white/80 px-3 py-1 rounded-full border border-slate-100 shadow-2xs">
                      End-to-end encrypted chat with @{getUsername(activeChatUser)}
                    </span>
                  </div>

                  {activeMessages.map(msg => {
                      const isMe = msg.userId === currentUser.id;
                      const isCallMsg = msg.text.startsWith('📞') || msg.text.startsWith('📹');

                      if (isCallMsg) {
                        const isVideo = msg.text.startsWith('📹');
                        return (
                          <div key={msg.id} className="flex justify-center my-2">
                            <div className="flex items-center gap-2.5 bg-white border border-slate-200/80 px-4 py-2 rounded-2xl shadow-xs text-xs font-bold text-slate-700">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isVideo ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                <i className={`fa-solid ${isVideo ? 'fa-video' : 'fa-phone'}`}></i>
                              </div>
                              <span>{msg.text}</span>
                              <button
                                onClick={() => handleStartCall(isVideo ? 'video' : 'audio')}
                                className="ml-1 text-[10px] text-indigo-600 hover:text-indigo-700 uppercase font-black tracking-wider bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                              >
                                Call Back
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-medium ${isMe ? 'bg-indigo-600 text-white rounded-br-none shadow-sm shadow-indigo-600/20' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-xs'}`}>
                                  {msg.text}
                              </div>
                          </div>
                      );
                  })}
                  <div ref={messagesEndRef} />
              </div>

              {/* Chat Input with VC and Audio Call Shortcuts */}
              <div className="bg-white p-3 border-t border-slate-100 pb-safe">
                  <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-2 py-1.5">
                       <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showEmojiPicker ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}>
                          <i className="fa-solid fa-face-smile text-lg"></i>
                       </button>
                       <input 
                          type="text" 
                          value={inputText}
                          onChange={e => setInputText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400 px-1"
                       />
                       {!inputText.trim() ? (
                         <div className="flex items-center gap-1">
                           <button
                             onClick={() => handleStartCall('audio')}
                             className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                             title="Audio Call"
                           >
                             <i className="fa-solid fa-phone text-xs"></i>
                           </button>
                           <button
                             onClick={() => handleStartCall('video')}
                             className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                             title="Video Call (VC)"
                           >
                             <i className="fa-solid fa-video text-xs"></i>
                           </button>
                         </div>
                       ) : (
                         <button 
                            onClick={handleSendMessage}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-indigo-600 shadow-md transition-all active:scale-95"
                         >
                            <i className="fa-solid fa-paper-plane text-xs"></i>
                         </button>
                       )}
                  </div>
                  {showEmojiPicker && (
                      <EmojiPicker onSelect={(emoji) => setInputText(prev => prev + emoji)} />
                  )}
              </div>

              {/* VC & Audio Call Modal */}
              <ChatCallModal
                isOpen={isCallOpen}
                callType={activeCallType}
                currentUser={currentUser}
                chatUser={activeChatUser}
                onEndCall={handleEndCall}
              />
          </div>
      );
  }

  // Inbox List View with Searchbar on Top
  return (
    <div className="fixed inset-0 z-[55] bg-white flex flex-col animate-fade-in-up">
        {/* Top Header */}
        <div className="px-4 py-3.5 flex items-center gap-3 border-b border-slate-100">
             <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                <i className="fa-solid fa-arrow-left text-slate-800"></i>
             </button>
             <div>
               <h2 className="text-xl font-black text-slate-900 leading-tight">Messages</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct & Community Chat</p>
             </div>
             <div className="ml-auto flex items-center gap-1.5">
                 <button 
                   onClick={() => {
                     searchInputRef.current?.focus();
                   }} 
                   className="h-8 px-2.5 flex items-center gap-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs transition-colors"
                   title="Find User"
                 >
                     <i className="fa-solid fa-user-plus text-xs"></i>
                     <span className="hidden sm:inline text-[11px]">Find User</span>
                 </button>
             </div>
        </div>

        {/* Searchbar on top of Chat */}
        <div className="px-4 pt-3 pb-3 bg-white border-b border-slate-100 shadow-2xs">
          <div className="relative flex items-center">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 text-slate-400 text-sm pointer-events-none"></i>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find user by username or 8-digit ID..."
              className="w-full bg-slate-100 hover:bg-slate-150 focus:bg-white text-slate-900 text-xs font-semibold pl-10 pr-9 py-2.5 rounded-2xl border border-transparent focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                title="Clear search"
              >
                <i className="fa-solid fa-circle-xmark text-sm"></i>
              </button>
            )}
          </div>

          {/* Quick search hints / tags */}
          {!searchQuery && (
            <div className="flex items-center gap-2 mt-2 px-1 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-bolt text-amber-500 text-[10px]"></i> Quick find:
              </span>
              <button 
                onClick={() => setSearchQuery('sarahvibes')}
                className="hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2 py-0.5 rounded-md border border-slate-200/60 transition-colors font-mono text-[10px]"
              >
                @sarahvibes
              </button>
              <button 
                onClick={() => setSearchQuery('88000101')}
                className="hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2 py-0.5 rounded-md border border-slate-200/60 transition-colors font-mono text-[10px]"
              >
                ID: 88000101
              </button>
            </div>
          )}
        </div>
        
        {/* Content Area: Search Results or Conversations List */}
        {searchQuery.trim() ? (
          <div className="flex-1 overflow-y-auto">
            {/* Search Header Banner */}
            <div className="px-4 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-indigo-700 font-bold">
                <i className="fa-solid fa-magnifying-glass text-[11px]"></i>
                <span>{searchResults.length} {searchResults.length === 1 ? 'user found' : 'users found'} for "{searchQuery}"</span>
                {searchQuery.replace(/\D/g, '').length === 8 && (
                  <span className="bg-indigo-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    8-Digit ID
                  </span>
                )}
              </div>
              <button onClick={() => setSearchQuery('')} className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px]">
                Clear
              </button>
            </div>

            {/* Found Users List */}
            {searchResults.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {searchResults.map(user => {
                  const eightDigit = get8DigitId(user);
                  const username = getUsername(user);
                  const isCopied = copiedId === eightDigit;

                  return (
                    <div 
                      key={user.id}
                      onClick={() => handleStartChatWithUser(user)}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-indigo-50/40 active:bg-indigo-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-2xs group-hover:scale-105 transition-transform" alt={user.name} />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-black text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                              {user.name}
                            </h4>
                            {user.isVerified && <i className="fa-solid fa-circle-check text-sky-500 text-xs"></i>}
                            <span className="text-[9px] font-black px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">
                              Lv.{user.level || 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 font-medium">@{username}</span>
                            <span className="text-slate-300">•</span>
                            <span 
                              onClick={(e) => copyToClipboard(eightDigit, e)}
                              className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-150 transition-colors flex items-center gap-1"
                              title="Click to copy 8-digit ID"
                            >
                              <i className="fa-solid fa-id-badge text-[10px] text-indigo-400"></i>
                              <span>ID: {eightDigit}</span>
                              {isCopied && <i className="fa-solid fa-check text-emerald-500 text-[10px]"></i>}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChatWithUser(user);
                        }}
                        className="flex-shrink-0 ml-3 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-comment-dots text-xs"></i>
                        <span>Chat</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-4 text-2xl shadow-inner">
                  <i className="fa-solid fa-user-slash"></i>
                </div>
                <h3 className="font-black text-slate-900 text-base mb-1">No User Found</h3>
                <p className="text-xs text-slate-400 max-w-xs mb-6">
                  No registered user matches "{searchQuery}". You can search by username (e.g. <span className="font-mono text-slate-600">@sarahvibes</span>) or their 8-digit ID (e.g. <span className="font-mono text-slate-600">88000101</span>).
                </p>

                {/* If the query resembles an 8-digit ID or username, allow direct chat initiation */}
                <button
                  onClick={() => handleCreateDirectChatById(searchQuery.replace(/\D/g, '') || searchQuery)}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-transform flex items-center gap-2"
                >
                  <i className="fa-solid fa-paper-plane text-xs"></i>
                  <span>Start Chat with ID #{searchQuery}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="px-4 pt-2.5 pb-2 flex gap-6 border-b border-slate-100 overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setActiveTab('primary')} 
                  className={`pb-2 text-sm font-bold transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'primary' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >
                  <span>Primary</span>
                  {conversations.filter(c => c.unread > 0).length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {conversations.filter(c => c.unread > 0).length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('official')} 
                  className={`pb-2 text-sm font-bold transition-colors border-b-2 ${activeTab === 'official' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >
                  Official
                </button>
                <button 
                  onClick={() => setActiveTab('requests')} 
                  className={`pb-2 text-sm font-bold transition-colors border-b-2 ${activeTab === 'requests' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >
                  Requests
                </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {getFilteredConversations().length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {getFilteredConversations().map(conv => {
                            const eightDigit = get8DigitId(conv.user);
                            const username = getUsername(conv.user);

                            return (
                              <div 
                                key={conv.id} 
                                onClick={() => handleOpenChat(conv.id, conv.user)} 
                                className="px-4 py-3.5 flex gap-3 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer group"
                              >
                                   <div className="relative flex-shrink-0">
                                       <img src={conv.user.avatar} className="w-12 h-12 rounded-full object-cover border border-slate-100" alt="" />
                                       <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <div className="flex justify-between items-baseline mb-0.5">
                                           <div className="flex items-center gap-1.5 truncate">
                                             <h3 className="font-black text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                                               {conv.user.name}
                                             </h3>
                                             <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                                               ID: {eightDigit}
                                             </span>
                                           </div>
                                           <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 ml-2">{conv.time}</span>
                                       </div>
                                       <p className={`text-xs truncate ${conv.unread > 0 ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}`}>
                                         {conv.lastMessage}
                                       </p>
                                   </div>
                                   {conv.unread > 0 && (
                                       <div className="flex items-center flex-shrink-0 ml-2">
                                           <div className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                                             {conv.unread}
                                           </div>
                                       </div>
                                   )}
                              </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 px-4 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                            <i className="fa-regular fa-comment-dots"></i>
                        </div>
                        <p className="font-bold text-sm text-slate-700 mb-1">No messages yet</p>
                        <p className="text-xs text-slate-400 max-w-xs mb-4">Search any user above by username or 8-digit ID to start a conversation.</p>
                        <button 
                          onClick={() => searchInputRef.current?.focus()} 
                          className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs transition-colors"
                        >
                          Find Users to Chat
                        </button>
                    </div>
                )}
            </div>
          </>
        )}
    </div>
  );
};

export default InboxView;

