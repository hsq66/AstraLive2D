
import React from 'react';

interface CharacterDisplayProps {
  isSpeaking: boolean;
  isProcessing: boolean;
}

export const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ isSpeaking, isProcessing }) => {
  const speakingGlow = isSpeaking ? 'shadow-[0_0_35px_10px_rgba(74,222,128,0.7)]' : '';
  const processingPulse = isProcessing && !isSpeaking ? 'animate-pulse' : '';

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
      <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full blur-xl transition-all duration-500 ${isSpeaking || isProcessing ? 'opacity-50' : 'opacity-20'}`}></div>
      <img
        src="https://picsum.photos/seed/astra-character/512/512"
        alt="Astra - Digital Companion"
        className={`relative w-full h-full object-cover rounded-full border-4 border-indigo-500/50 transition-all duration-300 ${speakingGlow} ${processingPulse}`}
      />
    </div>
  );
};
