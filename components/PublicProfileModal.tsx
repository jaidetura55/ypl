
import React from 'react';
import { User } from '../types';
import { useData } from '../contexts/DataContext';

interface PublicProfileModalProps {
  user: User;
  onClose: () => void;
  onFollow?: (user: User) => void;
}

export default function PublicProfileModal({ user, onClose, onFollow }: PublicProfileModalProps) {
  const { followedUserIds, toggleFollow, currentUser } = useData();
  const isFollowing = followedUserIds.includes(user.id);
  const isMe = user.id === currentUser.id;

  const handleToggleFollow = () => {
    const willFollow = !isFollowing;
    toggleFollow(user.id);
    if (willFollow && onFollow) {
      onFollow(user);
    }
  };

  const handleMessage = () => {
    alert(`Starting chat with ${user.name}...`);
  };

  const handleSendGift = () => {
    alert(`Opening gift menu for ${user.name}...`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Banner */}
        <div className="h-32 bg-indigo-600 relative">
          {user.banner && <img src={user.banner} className="w-full h-full object-cover" alt="banner" />}
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-8 -mt-12 relative">
          <div className="flex justify-between items-end mb-4">
            <div className="relative">
              <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" alt="avatar" />
              {user.isVerified && (
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px]">
                  <i className="fa-solid fa-check"></i>
                </div>
              )}
            </div>
            {!isMe && (
              <button 
                onClick={handleToggleFollow}
                className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${isFollowing ? 'bg-slate-100 text-slate-600' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              {user.name}
              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[9px] font-black uppercase">Lv.{user.level}</span>
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {user.id}</p>
          </div>

          <div className="flex gap-6 mb-6">
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900">{user.followers.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Followers</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900">{user.following.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Following</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 mb-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">About</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {user.bio || "This user hasn't added a bio yet."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleMessage} className="flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors">
              <i className="fa-solid fa-envelope"></i>
              Message
            </button>
            <button onClick={handleSendGift} className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 rounded-xl text-indigo-600 font-bold text-xs hover:bg-indigo-100 transition-colors">
              <i className="fa-solid fa-gift"></i>
              Send Gift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
