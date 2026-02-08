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
  disabledReason: string | null;
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
  const [disabledReason, setDisabledReason] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isStartingRef = useRef(false);
  const startTimeoutRef = useRef<number | null>(null);

  // Check browser support
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Check for secure context
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;

  useEffect(() => {
    if (!isSupported) {
      voiceDictationDiagnostics.unsupported();
      setDisabledReason('Voice input is not supported in this browser');
      return;
    }

    if (!isSecureContext) {
      voiceDictationDiagnostics.insecureContext();
      setDisabledReason('Voice input requires HTTPS. Please use a secure connection.');
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

  // Force reset recognition instance
  const forceReset = useCallback(() => {
    voiceDictationDiagnostics.forceReset();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
    }
    
    isStartingRef.current = false;
    setIsListening(false);
    
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
  }, []);

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
      
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
    };

    recognition.onend = () => {
      voiceDictationDiagnostics.ended();
      setIsListening(false);
      isStartingRef.current = false;
      
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = getErrorMessage(event.error);
      voiceDictationDiagnostics.error(event.error, errorMessage);
      
      setError(errorMessage);
      setIsListening(false);
      isStartingRef.current = false;
      
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      
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
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
      }
    };
  }, [isSupported, continuous, interimResults, lang]);

  // Microphone permission preflight for mobile
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    // Only attempt getUserMedia if available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      voiceDictationDiagnostics.preflightSkipped('getUserMedia not available');
      return true; // Skip preflight, let SpeechRecognition handle it
    }

    try {
      voiceDictationDiagnostics.preflightStarted();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Immediately stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      voiceDictationDiagnostics.preflightSuccess();
      return true;
    } catch (err: any) {
      const errorMsg = err.name === 'NotAllowedError' 
        ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
        : err.name === 'NotFoundError'
        ? 'No microphone found. Please check your device.'
        : 'Failed to access microphone. Please check your browser settings.';
      
      voiceDictationDiagnostics.preflightFailed(err.name, errorMsg);
      setError(errorMsg);
      
      if (onErrorRef.current) {
        onErrorRef.current(errorMsg);
      }
      
      return false;
    }
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      const msg = 'Voice input is not supported in this browser';
      setError(msg);
      setDisabledReason(msg);
      voiceDictationDiagnostics.error('unsupported', msg);
      if (onErrorRef.current) onErrorRef.current(msg);
      return;
    }

    if (!isSecureContext) {
      const msg = 'Voice input requires HTTPS. Please use a secure connection.';
      setError(msg);
      setDisabledReason(msg);
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

    // Set a timeout to recover from stuck "starting" state
    startTimeoutRef.current = window.setTimeout(() => {
      if (isStartingRef.current && !isListening) {
        voiceDictationDiagnostics.startTimeout();
        forceReset();
        const msg = 'Speech recognition failed to start. Please try again.';
        setError(msg);
        if (onErrorRef.current) onErrorRef.current(msg);
      }
    }, 5000);

    // Request microphone permission first (mobile-friendly)
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      isStartingRef.current = false;
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      return;
    }

    try {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
      voiceDictationDiagnostics.startAttempted();
    } catch (err: any) {
      isStartingRef.current = false;
      
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      
      // Handle InvalidStateError (already started)
      if (err.name === 'InvalidStateError') {
        voiceDictationDiagnostics.error('invalid-state', 'Recognition already started');
        // Force reset and allow retry
        forceReset();
        
        // Reinitialize the recognition instance
        const SpeechRecognitionAPI = 
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (SpeechRecognitionAPI) {
          const newRecognition = new SpeechRecognitionAPI() as SpeechRecognition;
          newRecognition.continuous = continuous;
          newRecognition.interimResults = interimResults;
          newRecognition.lang = lang;
          newRecognition.maxAlternatives = 1;
          
          // Copy event handlers from current recognition
          newRecognition.onstart = recognitionRef.current.onstart;
          newRecognition.onend = recognitionRef.current.onend;
          newRecognition.onerror = recognitionRef.current.onerror;
          newRecognition.onresult = recognitionRef.current.onresult;
          
          recognitionRef.current = newRecognition;
          voiceDictationDiagnostics.reinitialized();
        }
        
        const msg = 'Please tap the microphone button again to start.';
        setError(msg);
        if (onErrorRef.current) onErrorRef.current(msg);
      } else {
        const msg = err.message || 'Failed to start speech recognition. Please try again.';
        setError(msg);
        voiceDictationDiagnostics.error('start-failed', msg);
        if (onErrorRef.current) onErrorRef.current(msg);
      }
    }
  }, [isSupported, isSecureContext, isListening, continuous, interimResults, lang, requestMicrophonePermission, forceReset]);

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
      
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
    } catch (err: any) {
      // Ignore errors when stopping
      voiceDictationDiagnostics.error('stop-failed', err.message || 'Stop failed');
      isStartingRef.current = false;
      setIsListening(false);
      
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
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
    disabledReason,
    start,
    stop,
    reset,
  };
}
