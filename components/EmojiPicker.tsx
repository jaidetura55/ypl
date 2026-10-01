
import React from 'react';
import { EMOJIS } from '../constants';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  return (
    <div className="mt-2 h-40 overflow-y-auto grid grid-cols-8 gap-2 p-2 custom-scrollbar bg-white rounded-xl border border-slate-100 shadow-inner">
      {EMOJIS.map(emoji => (
        <button 
          key={emoji} 
          onClick={() => onSelect(emoji)} 
          className="text-xl hover:bg-slate-100 rounded p-1 transition-colors active:scale-125"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiPicker;
