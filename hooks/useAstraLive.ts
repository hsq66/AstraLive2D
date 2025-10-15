
import { useState, useCallback, useRef, useEffect } from 'react';
// FIX: Removed LiveSession as it is not an exported member of '@google/genai'.
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, createBlob, decodeAudioData } from '../utils/audioUtils';
import { Status, TranscriptionEntry, Speaker } from '../types';

export const useAstraLive = () => {
  const [status, setStatus] = useState<Status>(Status.Idle);
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // FIX: Replaced LiveSession with `any` since it is not an exported type.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = useCallback(() => {
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.onaudioprocess = null;
        scriptProcessorRef.current.disconnect();
    }
    
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    microphoneStreamRef.current = null;
    scriptProcessorRef.current = null;
    sessionPromiseRef.current = null;

    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
    nextStartTimeRef.current = 0;
    audioSourcesRef.current.clear();
    
    setIsSpeaking(false);
    setIsProcessing(false);
  }, []);

  const startSession = useCallback(async () => {
    setStatus(Status.Connecting);
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // FIX: Cast window to `any` to access webkitAudioContext for broader browser compatibility without TypeScript errors.
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // FIX: Cast window to `any` to access webkitAudioContext for broader browser compatibility without TypeScript errors.
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = outputAudioContextRef.current.currentTime;

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: async () => {
            setStatus(Status.Connected);
            microphoneStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = inputAudioContextRef.current!.createMediaStreamSource(microphoneStreamRef.current);
            scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputTranscriptionRef.current += text;
              if(!isProcessing) setIsProcessing(true);
              setStatus(Status.Listening);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentOutputTranscriptionRef.current += text;
            }
            if (message.serverContent?.turnComplete) {
                const fullInput = currentInputTranscriptionRef.current.trim();
                const fullOutput = currentOutputTranscriptionRef.current.trim();
                
                if (fullInput) {
                    setTranscriptionHistory(prev => [...prev, { speaker: Speaker.User, text: fullInput }]);
                }
                if (fullOutput) {
                    setTranscriptionHistory(prev => [...prev, { speaker: Speaker.Astra, text: fullOutput }]);
                }

                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
                setIsProcessing(false);
                setStatus(Status.Connected);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              setStatus(Status.Speaking);
              if (isProcessing) setIsProcessing(false);

              const outputAudioContext = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);

              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);

              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                  setIsSpeaking(false);
                  if (status === Status.Speaking) {
                     setStatus(Status.Connected);
                  }
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const source of audioSourcesRef.current.values()) {
                source.stop();
              }
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setStatus(Status.Error);
            cleanup();
          },
          onclose: (e: CloseEvent) => {
            setStatus(Status.Disconnected);
            cleanup();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: 'You are Astra, a friendly and helpful digital companion. Your personality is cheerful, curious, and empathetic. Engage in natural, human-like conversation.'
        }
      });
    } catch (error) {
      console.error("Failed to start session:", error);
      setStatus(Status.Error);
      cleanup();
    }
  }, [cleanup, isProcessing, status]);

  const stopSession = useCallback(async () => {
    if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (error) {
            console.error("Error closing session:", error);
        }
    }
    cleanup();
    setStatus(Status.Disconnected);
    setTimeout(() => setStatus(Status.Idle), 1000);
  }, [cleanup]);
  
  useEffect(() => {
      return () => {
          stopSession();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, transcriptionHistory, startSession, stopSession, isSpeaking, isProcessing };
};
