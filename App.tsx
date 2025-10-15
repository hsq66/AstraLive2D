
import React from 'react';
import { CharacterDisplay } from './components/CharacterDisplay';
import { Controls } from './components/Controls';
import { Transcription } from './components/Transcription';
import { useAstraLive } from './hooks/useAstraLive';

const App: React.FC = () => {
  const {
    status,
    transcriptionHistory,
    startSession,
    stopSession,
    isSpeaking,
    isProcessing,
  } = useAstraLive();

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-gray-900 to-black"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyMDU1LDAuMDUpIj48cGF0aCBkPSJNMCAuNWgzMS41VjMyIi8+PC9zdmc+')] opacity-70"></div>
      
      <main className="z-10 w-full max-w-4xl flex flex-col items-center justify-center flex-grow">
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            AstraLive2D
          </h1>
          <p className="text-gray-300 mt-2">Your Intelligent Digital Companion</p>
        </header>
        
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="w-full md:w-1/2 flex justify-center items-center">
             <CharacterDisplay isSpeaking={isSpeaking} isProcessing={isProcessing} />
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <Controls
              status={status}
              onStart={startSession}
              onStop={stopSession}
            />
            <Transcription history={transcriptionHistory} />
          </div>
        </div>
      </main>

      <footer className="z-10 text-center text-gray-500 text-sm py-4">
        <p>&copy; 2024 AstraLive2D. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
