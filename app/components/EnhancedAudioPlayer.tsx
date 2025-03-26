'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { mightHaveCorsIssues } from '../utils/cors-proxy';

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
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Log the src prop when it changes
  useEffect(() => {
    console.log('EnhancedAudioPlayer src:', src);
  }, [src]);
  
  // Check if we need to use the proxy
  useEffect(() => {
    // Always try with proxy first if it's a Supabase URL due to known issues
    if (mightHaveCorsIssues(src)) {
      // Extract file name from URL
      const fileName = src.split('/').pop();
      if (fileName) {
        const proxyUrl = `/api/media-proxy/${fileName}`;
        console.log('Using proxy URL for audio player:', proxyUrl);
        setAudioSrc(proxyUrl);
        setUsedProxy(true);
      } else {
        setDebugInfo('Could not extract filename from URL: ' + src);
        setAudioSrc(src);
      }
    } else {
      console.log('Using direct URL for audio player:', src);
      setAudioSrc(src);
    }
  }, [src]);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    console.log('Setting up audio element with src:', audioSrc);
    
    // Set up event listeners
    const onLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
      setDebugInfo(null);
    };
    
    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
    };
    
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };
    
    const onError = (e: Event) => {
      const errorEvent = e as ErrorEvent;
      console.error('Audio error:', e);
      
      // Get more detailed error information
      let errorMessage = 'Unknown audio error';
      
      if (audio.error) {
        switch(audio.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'You aborted the audio playback.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'A network error caused the audio download to fail.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'The audio playback was aborted due to a corruption problem.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'The audio format is not supported by your browser.';
            break;
          default:
            errorMessage = `An unknown error occurred. Code: ${audio.error.code}`;
        }
      }
      
      // If not already using proxy and it might have CORS issues, try with proxy
      if (!usedProxy && mightHaveCorsIssues(src)) {
        console.log('Audio error occurred, trying with proxy...');
        setUsedProxy(true);
        
        // Extract file name from URL
        const fileName = src.split('/').pop();
        if (fileName) {
          const proxyUrl = `/api/media-proxy/${fileName}`;
          console.log('Switching to proxy URL:', proxyUrl);
          setAudioSrc(proxyUrl);
          setDebugInfo(`Error with direct URL. Trying proxy: ${proxyUrl}`);
        } else {
          setError(`Failed to load audio: ${errorMessage}. Could not extract filename for proxy.`);
          setDebugInfo('Could not extract filename from URL: ' + src);
          setIsLoading(false);
        }
      } else {
        // Try a direct fetch to diagnose the issue
        fetch(audioSrc)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }
            console.log('Fetch test succeeded but audio element failed', response.headers.get('content-type'));
            
            // Try one more approach - create a blob URL
            return response.blob();
          })
          .then(blob => {
            const objectUrl = URL.createObjectURL(blob);
            console.log('Created blob URL:', objectUrl);
            setAudioSrc(objectUrl);
            setDebugInfo('Using blob URL as fallback');
          })
          .catch(fetchError => {
            console.error('Fetch test failed:', fetchError);
            setError(`Failed to load audio: ${errorMessage}. Fetch error: ${fetchError.message}`);
            setIsLoading(false);
          });
      }
    };
    
    const onCanPlayThrough = () => {
      console.log('Audio can play through:', audioSrc);
      setIsLoading(false);
      setError(null);
    };
    
    // Add event listeners
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplaythrough', onCanPlayThrough);
    
    // Force a reload of the audio
    audio.load();
    
    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplaythrough', onCanPlayThrough);
      
      // Clean up any blob URLs
      if (audioSrc.startsWith('blob:')) {
        URL.revokeObjectURL(audioSrc);
      }
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
  
  const retryWithDirectUrl = () => {
    // Force use of the original URL without proxy
    setUsedProxy(false);
    setAudioSrc(src);
    setError(null);
    setIsLoading(true);
    setDebugInfo('Retrying with direct URL');
    if (audioRef.current) {
      audioRef.current.load();
    }
  };
  
  const retryWithProxyUrl = () => {
    // Force use of the proxy URL
    const fileName = src.split('/').pop();
    if (fileName) {
      const proxyUrl = `/api/media-proxy/${fileName}`;
      setUsedProxy(true);
      setAudioSrc(proxyUrl);
      setError(null);
      setIsLoading(true);
      setDebugInfo('Retrying with proxy URL');
      if (audioRef.current) {
        audioRef.current.load();
      }
    }
  };
  
  return (
    <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <audio 
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        crossOrigin="anonymous"
      />
      
      {debugInfo && (
        <div className="bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs p-2 mb-2 rounded">
          {debugInfo}
        </div>
      )}
      
      {error ? (
        <div className="text-red-500 text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
          <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
          <p className="mb-2">{error}</p>
          <div className="flex flex-wrap justify-center gap-2">
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
            >
              Retry
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retryWithDirectUrl}
            >
              Try Direct URL
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retryWithProxyUrl}
            >
              Try Proxy
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(src, '_blank')}
            >
              Open in New Tab
            </Button>
          </div>
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