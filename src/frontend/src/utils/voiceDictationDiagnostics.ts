/**
 * Voice dictation diagnostics helper
 * Logs lifecycle events without exposing transcript content
 */

const PREFIX = '[VoiceDictation]';

// Get safe environment context
const getEnvironmentContext = () => {
  if (typeof window === 'undefined') return { context: 'server-side' };
  
  return {
    isSecureContext: window.isSecureContext,
    protocol: window.location.protocol,
    hasSpeechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    userAgent: navigator.userAgent.substring(0, 100), // Truncate for safety
  };
};

export const voiceDictationDiagnostics = {
  init: () => {
    console.log(`${PREFIX} Initializing SpeechRecognition instance`, getEnvironmentContext());
  },

  startRequested: () => {
    console.log(`${PREFIX} Start requested by user`);
  },

  startAttempted: () => {
    console.log(`${PREFIX} Recognition.start() called`);
  },

  started: () => {
    console.log(`${PREFIX} Recognition started successfully (onstart fired)`);
  },

  ended: () => {
    console.log(`${PREFIX} Recognition ended (onend fired)`);
  },

  stopped: () => {
    console.log(`${PREFIX} Recognition stopped by user`);
  },

  error: (errorCode: string, errorMessage: string) => {
    console.error(`${PREFIX} Error occurred:`, {
      code: errorCode,
      message: errorMessage,
      environment: getEnvironmentContext(),
    });
  },

  unsupported: () => {
    console.warn(`${PREFIX} Web Speech API not supported in this browser`, getEnvironmentContext());
  },

  insecureContext: () => {
    console.warn(`${PREFIX} Insecure context detected - microphone access may be blocked`, {
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
      isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
    });
  },

  stateGuard: (action: string, currentState: string) => {
    console.warn(`${PREFIX} State guard prevented ${action} (current state: ${currentState})`);
  },

  preflightStarted: () => {
    console.log(`${PREFIX} Microphone permission preflight started`);
  },

  preflightSuccess: () => {
    console.log(`${PREFIX} Microphone permission preflight succeeded`);
  },

  preflightFailed: (errorName: string, errorMessage: string) => {
    console.error(`${PREFIX} Microphone permission preflight failed:`, {
      errorName,
      errorMessage,
    });
  },

  preflightSkipped: (reason: string) => {
    console.log(`${PREFIX} Microphone permission preflight skipped:`, reason);
  },

  startTimeout: () => {
    console.error(`${PREFIX} Start timeout - recognition stuck in starting state`);
  },

  forceReset: () => {
    console.log(`${PREFIX} Force reset - aborting and clearing state`);
  },

  reinitialized: () => {
    console.log(`${PREFIX} Recognition instance reinitialized after InvalidStateError`);
  },
};
