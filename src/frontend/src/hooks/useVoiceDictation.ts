import { useState, useEffect, useRef, useCallback } from 'react';
import { voiceDictationDiagnostics } from '../utils/voiceDictationDiagnostics';

export interface VoiceDictationOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface VoiceDictationState {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  transcript: string;
}

export function useVoiceDictation(options: VoiceDictationOptions = {}) {
  const {
    continuous = false,
    interimResults = true,
    lang = 'en-US',
  } = options;

  // Store callbacks in refs to prevent re-initialization
  const onTranscriptRef = useRef(options.onTranscript);
  const onErrorRef = useRef(options.onError);

  // Update refs when callbacks change
  useEffect(() => {
    onTranscriptRef.current = options.onTranscript;
  }, [options.onTranscript]);

  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isStartingRef = useRef(false);

  // Check browser support
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Check for secure context
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;

  useEffect(() => {
    if (!isSupported) {
      voiceDictationDiagnostics.unsupported();
      return;
    }

    if (!isSecureContext) {
      voiceDictationDiagnostics.insecureContext();
    }
  }, [isSupported, isSecureContext]);

  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'no-speech':
        return 'No speech detected. Please try again.';
      case 'audio-capture':
        return 'No microphone found. Please check your device.';
      case 'not-allowed':
        return 'Microphone permission denied. Please allow microphone access in your browser settings.';
      case 'network':
        return 'Network error occurred. Please check your connection.';
      case 'aborted':
        return 'Speech recognition was aborted.';
      case 'service-not-allowed':
        return 'Speech recognition service not allowed. Please check your browser settings.';
      default:
        return `Speech recognition error: ${errorCode}`;
    }
  };

  // Initialize recognition once
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    voiceDictationDiagnostics.init();

    const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      voiceDictationDiagnostics.started();
      setIsListening(true);
      setError(null);
      isStartingRef.current = false;
    };

    recognition.onend = () => {
      voiceDictationDiagnostics.ended();
      setIsListening(false);
      isStartingRef.current = false;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = getErrorMessage(event.error);
      voiceDictationDiagnostics.error(event.error, errorMessage);
      
      setError(errorMessage);
      setIsListening(false);
      isStartingRef.current = false;
      
      if (onErrorRef.current) {
        onErrorRef.current(errorMessage);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptText + ' ';
        } else {
          interimTranscript += transcriptText;
        }
      }

      if (finalTranscript) {
        const trimmed = finalTranscript.trim();
        setTranscript(trimmed);
        if (onTranscriptRef.current) {
          onTranscriptRef.current(trimmed, true);
        }
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
        if (onTranscriptRef.current) {
          onTranscriptRef.current(interimTranscript, false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [isSupported, continuous, interimResults, lang]);

  const start = useCallback(() => {
    if (!isSupported) {
      const msg = 'Speech recognition is not supported in this browser.';
      setError(msg);
      voiceDictationDiagnostics.error('unsupported', msg);
      if (onErrorRef.current) onErrorRef.current(msg);
      return;
    }

    if (!isSecureContext) {
      const msg = 'Microphone access requires a secure context (HTTPS). Please use HTTPS or localhost.';
      setError(msg);
      voiceDictationDiagnostics.error('insecure-context', msg);
      if (onErrorRef.current) onErrorRef.current(msg);
      return;
    }

    if (!recognitionRef.current) {
      const msg = 'Speech recognition not initialized.';
      setError(msg);
      voiceDictationDiagnostics.error('not-initialized', msg);
      if (onErrorRef.current) onErrorRef.current(msg);
      return;
    }

    // Prevent starting if already listening or starting
    if (isListening || isStartingRef.current) {
      voiceDictationDiagnostics.stateGuard('start', isListening ? 'listening' : 'starting');
      return;
    }

    voiceDictationDiagnostics.startRequested();
    isStartingRef.current = true;

    try {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
    } catch (err: any) {
      isStartingRef.current = false;
      
      // Handle InvalidStateError (already started)
      if (err.name === 'InvalidStateError') {
        voiceDictationDiagnostics.error('invalid-state', 'Recognition already started');
        // Try to recover by stopping and restarting
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (recognitionRef.current && !isListening) {
              recognitionRef.current.start();
            }
          }, 100);
        } catch (recoveryErr) {
          const msg = 'Failed to start speech recognition. Please try again.';
          setError(msg);
          voiceDictationDiagnostics.error('recovery-failed', msg);
          if (onErrorRef.current) onErrorRef.current(msg);
        }
      } else {
        const msg = err.message || 'Failed to start speech recognition. Please try again.';
        setError(msg);
        voiceDictationDiagnostics.error('start-failed', msg);
        if (onErrorRef.current) onErrorRef.current(msg);
      }
    }
  }, [isSupported, isSecureContext, isListening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;

    // Only stop if actually listening
    if (!isListening && !isStartingRef.current) {
      voiceDictationDiagnostics.stateGuard('stop', 'not-listening');
      return;
    }

    voiceDictationDiagnostics.stopped();
    
    try {
      recognitionRef.current.stop();
      isStartingRef.current = false;
    } catch (err: any) {
      // Ignore errors when stopping
      voiceDictationDiagnostics.error('stop-failed', err.message || 'Stop failed');
      isStartingRef.current = false;
      setIsListening(false);
    }
  }, [isListening]);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    isSupported,
    error,
    transcript,
    start,
    stop,
    reset,
  };
}
