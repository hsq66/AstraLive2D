
import React from 'react';
import { Status } from '../types';

interface ControlsProps {
  status: Status;
  onStart: () => void;
  onStop: () => void;
}

const getStatusText = (status: Status) => {
  switch (status) {
    case Status.Idle: return "Ready to connect";
    case Status.Connecting: return "Connecting...";
    case Status.Connected: return "Connected. Start speaking!";
    case Status.Listening: return "Listening...";
    case Status.Processing: return "Thinking...";
    case Status.Speaking: return "Astra is speaking...";
    case Status.Error: return "An error occurred";
    case Status.Disconnected: return "Disconnected";
    default: return "Standby";
  }
};

export const Controls: React.FC<ControlsProps> = ({ status, onStart, onStop }) => {
  const isSessionActive = status !== Status.Idle && status !== Status.Disconnected && status !== Status.Error;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 flex flex-col items-center gap-4 border border-gray-700">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSessionActive ? 'bg-green-400' : 'bg-gray-400'} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-3 w-3 ${isSessionActive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
        </span>
        <p className="text-lg font-medium text-gray-200">{getStatusText(status)}</p>
      </div>
      <button
        onClick={isSessionActive ? onStop : onStart}
        disabled={status === Status.Connecting}
        className={`w-full py-3 px-6 text-lg font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
          ${isSessionActive 
            ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500'}
          ${status === Status.Connecting ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isSessionActive ? 'End Conversation' : 'Start Conversation'}
      </button>
    </div>
  );
};
