/**
 * Voice dictation diagnostics helper
 * Logs lifecycle events without exposing transcript content
 */

const PREFIX = '[VoiceDictation]';

export const voiceDictationDiagnostics = {
  init: () => {
    console.log(`${PREFIX} Initializing SpeechRecognition instance`);
  },

  startRequested: () => {
    console.log(`${PREFIX} Start requested by user`);
  },

  started: () => {
    console.log(`${PREFIX} Recognition started successfully`);
  },

  ended: () => {
    console.log(`${PREFIX} Recognition ended`);
  },

  stopped: () => {
    console.log(`${PREFIX} Recognition stopped by user`);
  },

  error: (errorCode: string, errorMessage: string) => {
    console.error(`${PREFIX} Error occurred:`, {
      code: errorCode,
      message: errorMessage,
    });
  },

  unsupported: () => {
    console.warn(`${PREFIX} Web Speech API not supported in this browser`);
  },

  insecureContext: () => {
    console.warn(`${PREFIX} Insecure context detected - microphone access may be blocked`);
  },

  stateGuard: (action: string, currentState: string) => {
    console.warn(`${PREFIX} State guard prevented ${action} (current state: ${currentState})`);
  },
};
