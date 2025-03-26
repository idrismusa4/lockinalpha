'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { mightHaveCorsIssues } from '@/app/utils/cors-proxy';

interface EnhancedAudioPlayerProps {
  src: string;
  className?: string;
}

export default function EnhancedAudioPlayer({ src, className = '' }: EnhancedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedProxy, setUsedProxy] = useState(false);
  const [audioSrc, setAudioSrc] = useState(src);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Check if we need to use the proxy
  useEffect(() => {
    if (mightHaveCorsIssues(src) && !usedProxy) {
      // Extract file name from URL
      const fileName = src.split('/').pop();
      if (fileName) {
        const proxyUrl = `/api/media-proxy/${fileName}`;
        console.log('Using proxy URL for audio player:', proxyUrl);
        setAudioSrc(proxyUrl);
      }
    } else {
      setAudioSrc(src);
    }
  }, [src, usedProxy]);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Set up event listeners
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
    };
    
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };
    
    const onError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      
      // If not already using proxy and it might have CORS issues, try with proxy
      if (!usedProxy && mightHaveCorsIssues(src)) {
        console.log('Audio error occurred, trying with proxy...');
        setUsedProxy(true);
      } else {
        setError('Failed to load audio file. Please try again later.');
        setIsLoading(false);
      }
    };
    
    const onCanPlayThrough = () => {
      setIsLoading(false);
    };
    
    // Add event listeners
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError as EventListener);
    audio.addEventListener('canplaythrough', onCanPlayThrough);
    
    // Force a reload of the audio
    audio.load();
    
    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError as EventListener);
      audio.removeEventListener('canplaythrough', onCanPlayThrough);
    };
  }, [audioSrc, src, usedProxy]);
  
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      // Set the currentTime if it's at the end
      if (audio.currentTime >= audio.duration) {
        audio.currentTime = 0;
      }
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play audio. Please try again.');
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = value[0];
    audio.currentTime = newTime;
    setProgress(newTime);
  };
  
  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isMuted) {
      audio.volume = volume || 1;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };
  
  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = Math.min(Math.max(0, audio.currentTime + seconds), audio.duration);
    audio.currentTime = newTime;
    setProgress(newTime);
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <audio 
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        crossOrigin="anonymous"
      />
      
      {error ? (
        <div className="text-red-500 text-center p-4">
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              if (audioRef.current) {
                audioRef.current.load();
              }
            }}
            className="ml-2"
          >
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {formatTime(progress)} / {formatTime(duration)}
            </div>
            
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
              
              <div className="w-24 mx-2">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <Slider
              value={[progress]}
              min={0}
              max={duration || 100}
              step={0.01}
              onValueChange={handleProgressChange}
              aria-label="Seek time"
            />
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => skip(-10)}
            >
              <SkipBack size={20} />
            </Button>
            
            <Button 
              variant="default" 
              size="icon" 
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => skip(10)}
            >
              <SkipForward size={20} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
} 