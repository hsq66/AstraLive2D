
import React, { useEffect, useRef } from 'react';
import { TranscriptionEntry, Speaker } from '../types';

interface TranscriptionProps {
  history: TranscriptionEntry[];
}

export const Transcription: React.FC<TranscriptionProps> = ({ history }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg h-64 flex flex-col border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-gray-100">Conversation</h2>
      </div>
      <div ref={scrollRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
        {history.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Your conversation will appear here.</p>
          </div>
        )}
        {history.map((entry, index) => (
          <div key={index} className={`flex flex-col ${entry.speaker === Speaker.User ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-xs md:max-w-sm lg:max-w-md px-4 py-2 rounded-lg ${
              entry.speaker === Speaker.User 
              ? 'bg-indigo-600 text-white rounded-br-none' 
              : 'bg-gray-700 text-gray-200 rounded-bl-none'
            }`}>
              <p className="font-bold text-sm mb-1">{entry.speaker === Speaker.User ? 'You' : 'Astra'}</p>
              <p>{entry.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
