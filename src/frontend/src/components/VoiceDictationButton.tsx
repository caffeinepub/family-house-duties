import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VoiceDictationButtonProps {
  isListening: boolean;
  isSupported: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onStart: () => void;
  onStop: () => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  className?: string;
}

export function VoiceDictationButton({
  isListening,
  isSupported,
  disabled = false,
  disabledReason,
  onStart,
  onStop,
  size = 'icon',
  variant = 'outline',
  className,
}: VoiceDictationButtonProps) {
  // Determine the effective disabled state and tooltip message
  const isDisabled = !isSupported || disabled;
  
  let tooltipMessage: string;
  if (!isSupported) {
    tooltipMessage = 'Voice input not supported in this browser';
  } else if (disabled && disabledReason) {
    tooltipMessage = disabledReason;
  } else if (disabled) {
    tooltipMessage = 'Voice input temporarily unavailable';
  } else if (isListening) {
    tooltipMessage = 'Stop dictation';
  } else {
    tooltipMessage = 'Start voice dictation';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-block">
            <Button
              type="button"
              variant={isListening ? 'default' : variant}
              size={size}
              disabled={isDisabled}
              onClick={isListening ? onStop : onStart}
              className={className}
              aria-label={tooltipMessage}
              aria-pressed={isListening}
            >
              {!isSupported || (disabled && !isListening) ? (
                <MicOff className="h-4 w-4" />
              ) : isListening ? (
                <Mic className="h-4 w-4 animate-pulse" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            {/* Listening indicator - visible red dot with glow ring */}
            {isListening && (
              <span 
                className="absolute -top-0.5 -right-0.5 flex h-3 w-3"
                aria-hidden="true"
              >
                {/* Animated ring/glow */}
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                {/* Solid dot */}
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white dark:border-gray-950"></span>
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
      
      {/* Screen reader announcement for listening state */}
      <span 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {isListening ? 'Listening' : 'Not listening'}
      </span>
    </TooltipProvider>
  );
}
