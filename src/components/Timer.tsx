import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PlayCircle, PauseCircle, StopCircle, Timer as TimerIcon } from 'lucide-react';

interface TimerProps {
  onComplete?: () => void;
  initialHours?: number;
  initialMinutes?: number;
  initialSeconds?: number;
  initialTotalSeconds?: number; // Total seconds directly
  showControls?: boolean;
  onTimeUpdate?: (remaining: number) => void;
}

export const Timer: React.FC<TimerProps> = ({
  onComplete,
  initialHours = 0,
  initialMinutes = 25,
  initialSeconds = 0,
  initialTotalSeconds,
  showControls = true,
  onTimeUpdate,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(() => {
    // If initialTotalSeconds is provided, use it directly
    if (initialTotalSeconds !== undefined) {
      return initialTotalSeconds;
    }
    return initialHours * 3600 + initialMinutes * 60 + initialSeconds;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [inputHours, setInputHours] = useState(initialHours.toString());
  const [inputMinutes, setInputMinutes] = useState(initialMinutes.toString());
  const [inputSeconds, setInputSeconds] = useState(initialSeconds.toString());

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds((seconds) => {
          const newSeconds = seconds - 1;
          if (newSeconds === 0) {
            setIsRunning(false);
            onComplete?.();
          }
          onTimeUpdate?.(newSeconds);
          return newSeconds;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, onComplete, onTimeUpdate]);

  const formatTime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleStop = () => {
    setIsRunning(false);
    setTotalSeconds(0);
  };

  const handleSetTime = () => {
    const hours = parseInt(inputHours) || 0;
    const minutes = parseInt(inputMinutes) || 0;
    const seconds = parseInt(inputSeconds) || 0;
    const newTotalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (newTotalSeconds > 0) {
      setTotalSeconds(newTotalSeconds);
      setShowSetup(false);
    }
  };

  const TimerDisplay = (
    <div className="text-2xl font-mono font-bold text-primary">{formatTime(totalSeconds)}</div>
  );

  const TimerSetup = (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div>
          <label className="text-sm text-muted-foreground">Hours</label>
          <Input
            type="number"
            min="0"
            max="23"
            value={inputHours}
            onChange={(e) => setInputHours(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Minutes</label>
          <Input
            type="number"
            min="0"
            max="59"
            value={inputMinutes}
            onChange={(e) => setInputMinutes(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Seconds</label>
          <Input
            type="number"
            min="0"
            max="59"
            value={inputSeconds}
            onChange={(e) => setInputSeconds(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSetTime}>Set Time</Button>
        <Button variant="outline" onClick={() => setShowSetup(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );

  if (!showControls) {
    return TimerDisplay;
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <TimerIcon className="h-5 w-5 text-primary" />
        <div className="font-semibold">Study Timer</div>
      </div>

      {showSetup ? (
        TimerSetup
      ) : (
        <div className="space-y-4">
          {TimerDisplay}
          <div className="flex gap-2">
            {!isRunning && totalSeconds > 0 && (
              <Button onClick={handleStart}>
                <PlayCircle className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
            {isRunning && (
              <Button onClick={handlePause}>
                <PauseCircle className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
            {totalSeconds > 0 && (
              <Button variant="outline" onClick={handleStop}>
                <StopCircle className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}
            {!isRunning && (
              <Button variant="outline" onClick={() => setShowSetup(true)}>
                Set Time
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};