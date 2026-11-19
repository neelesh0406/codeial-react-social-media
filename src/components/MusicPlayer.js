import React, { useState, useEffect, useRef } from 'react';
import './MusicPlayer.css';

const TRACKS = {
  HINDI: {
    id: 'HINDI',
    title: 'Russian Bandana',
    language: 'Hindi',
    src: `${process.env.PUBLIC_URL || ''}/audio/Hindi.mp3`,
  },
  ENGLISH: {
    id: 'ENGLISH',
    title: 'Cheri Cheri Lady',
    language: 'English',
    src: `${process.env.PUBLIC_URL || ''}/audio/Cheri-Cheri-lady.mp3`,
  },
};

const SOUTH_INDIAN_STATES = ['KA', 'TN', 'KL', 'TS', 'AP', 'PY'];

const GESTURE_EVENTS = [
  'pointerdown',
  'mousedown',
  'click',
  'touchstart',
  'touchend',
  'keydown',
  'scroll',
  'focus',
];

const TARGET_VOLUME = 0.5; // Strictly 50% volume

const MusicPlayer = () => {
  const [trackKey, setTrackKey] = useState('HINDI');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const audioRef = useRef(null);
  const isClosedRef = useRef(false);
  const userSwitchedRef = useRef(false);
  const trackKeyRef = useRef('HINDI');

  // Keep trackKeyRef updated
  useEffect(() => {
    trackKeyRef.current = trackKey;
  }, [trackKey]);

  // Keep isClosedRef updated
  useEffect(() => {
    isClosedRef.current = isClosed;
  }, [isClosed]);

  // Helper to ensure audio starts and stays strictly at 50% volume
  const applySafeVolume = (audio) => {
    if (audio) {
      audio.volume = TARGET_VOLUME;
    }
  };

  // 1. IP Geolocation Detection for North vs South India vs Global
  useEffect(() => {
    let isCancelled = false;

    const detectLocation = async () => {
      let countryCode = null;
      let regionCode = '';

      // Primary: ipwho.is
      try {
        const response = await fetch('https://ipwho.is/');
        if (response.ok) {
          const data = await response.json();
          if (data && data.success) {
            countryCode = data.country_code ? data.country_code.toUpperCase() : null;
            regionCode = data.region_code ? data.region_code.toUpperCase() : '';
          }
        }
      } catch (err) {
        console.warn('ipwho.is lookup failed, trying fallback:', err);
      }

      // Fallback 1: freeipapi.com
      if (!countryCode) {
        try {
          const response = await fetch('https://freeipapi.com/api/json');
          if (response.ok) {
            const data = await response.json();
            if (data && data.countryCode) {
              countryCode = data.countryCode.toUpperCase();
              regionCode = (data.regionCode || data.region_code || '').toUpperCase();
            }
          }
        } catch (e) {}
      }

      // Fallback 2: Browser TimeZone heuristic
      if (!countryCode) {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
          if (
            tz.includes('Calcutta') ||
            tz.includes('Kolkata') ||
            tz.includes('India') ||
            tz.includes('Asia/Colombo')
          ) {
            countryCode = 'IN';
          }
        } catch (e) {}
      }

      if (isCancelled) return;

      // Determine track based on country and region_code:
      // If country is India ('IN'):
      //   South India ('KA', 'TN', 'KL', 'TS', 'AP', 'PY') -> English (Cheri Cheri Lady)
      //   Rest of India (North/Central/West/East) -> Hindi (Russian Bandana)
      // Outside India -> English (Cheri Cheri Lady)
      let targetKey = 'ENGLISH';
      if (countryCode === 'IN') {
        if (regionCode && SOUTH_INDIAN_STATES.includes(regionCode)) {
          targetKey = 'ENGLISH';
        } else {
          targetKey = 'HINDI';
        }
      } else {
        targetKey = 'ENGLISH';
      }

      // If user hasn't manually switched tracks, apply detected track
      if (!userSwitchedRef.current && trackKeyRef.current !== targetKey) {
        setTrackKey(targetKey);
        if (audioRef.current) {
          const currentMuted = audioRef.current.muted;
          audioRef.current.src = TRACKS[targetKey].src;
          applySafeVolume(audioRef.current);
          audioRef.current.muted = currentMuted;
          audioRef.current.load();
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        }
      }
    };

    detectLocation();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Autoplay initialization & Transparent User Gesture Handler
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    applySafeVolume(audio);
    if (!audio.src) {
      audio.src = TRACKS[trackKeyRef.current].src;
    }

    // Try playing unmuted, and if blocked by browser policy, fall back to muted autoplay
    const attemptAutoplay = () => {
      if (!audioRef.current || isClosedRef.current) return;
      applySafeVolume(audioRef.current);

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            removeGestureListeners();
          })
          .catch((err) => {
            console.log('Unmuted autoplay blocked, falling back to muted autoplay:', err.message);
            // Browser blocked unmuted autoplay: start muted (allowed by all browsers on page load)
            if (audioRef.current && !isClosedRef.current) {
              audioRef.current.muted = true;
              audioRef.current
                .play()
                .then(() => {
                  setIsPlaying(true);
                })
                .catch(() => {});
            }
          });
      }
    };

    const handleFirstGesture = () => {
      if (isClosedRef.current || !audioRef.current) {
        removeGestureListeners();
        return;
      }
      // Unmute and play at 50% volume on first interaction
      audioRef.current.muted = false;
      applySafeVolume(audioRef.current);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
          removeGestureListeners();
        })
        .catch(() => {});
    };

    const addGestureListeners = () => {
      GESTURE_EVENTS.forEach((event) => {
        window.addEventListener(event, handleFirstGesture, { capture: true, passive: true });
        document.addEventListener(event, handleFirstGesture, { capture: true, passive: true });
      });
    };

    const removeGestureListeners = () => {
      GESTURE_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleFirstGesture, { capture: true });
        document.removeEventListener(event, handleFirstGesture, { capture: true });
      });
    };

    // Attempt autoplay immediately upon component mount
    attemptAutoplay();

    // Attach transparent gesture listeners to trigger unmuted audio on first interaction
    addGestureListeners();

    // Listen for 'codeial:play-music' from PostsList (when mock posts arrive)
    const handleCodeialPlayEvent = () => {
      if (!isClosedRef.current && audioRef.current) {
        audioRef.current.muted = false;
        applySafeVolume(audioRef.current);
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setIsMuted(false);
            removeGestureListeners();
          })
          .catch((err) => {
            console.log('Playback after mock post waiting for user interaction:', err);
          });
      }
    };

    window.addEventListener('codeial:play-music', handleCodeialPlayEvent);

    return () => {
      removeGestureListeners();
      window.removeEventListener('codeial:play-music', handleCodeialPlayEvent);
    };
  }, []);

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.muted = false;
      applySafeVolume(audioRef.current);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
        })
        .catch((err) => {
          console.warn('Playback error:', err);
        });
    }
  };

  const handleSwitchTrack = (newKey, e) => {
    if (e) e.stopPropagation();
    if (newKey === trackKey) return;

    userSwitchedRef.current = true;
    setTrackKey(newKey);

    if (audioRef.current) {
      audioRef.current.src = TRACKS[newKey].src;
      applySafeVolume(audioRef.current);
      audioRef.current.muted = false;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
        })
        .catch(() => setIsPlaying(false));
    }
  };

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    if (!nextMuted) {
      applySafeVolume(audioRef.current);
    }
    setIsMuted(nextMuted);
  };

  const handleStopAndClose = (e) => {
    if (e) e.stopPropagation();
    isClosedRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsClosed(true);
  };

  const handleReopen = () => {
    isClosedRef.current = false;
    setIsClosed(false);
    if (audioRef.current) {
      audioRef.current.muted = false;
      applySafeVolume(audioRef.current);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
        })
        .catch(() => {});
    }
  };

  const currentTrack = TRACKS[trackKey];

  return (
    <div className={`music-player-container ${isClosed ? 'closed' : ''}`}>
      <audio
        ref={audioRef}
        loop
        preload="auto"
        onPlay={(e) => {
          applySafeVolume(e.target);
          setIsPlaying(true);
        }}
        onLoadedMetadata={(e) => {
          applySafeVolume(e.target);
        }}
        onCanPlay={(e) => {
          applySafeVolume(e.target);
        }}
        onVolumeChange={(e) => {
          if (e.target.volume > TARGET_VOLUME) {
            e.target.volume = TARGET_VOLUME;
          }
        }}
        onPause={() => setIsPlaying(false)}
      />

      {isClosed ? (
        <button
          className="music-player-reopen-btn"
          onClick={handleReopen}
          title="Re-open Music Player"
          aria-label="Re-open Music Player"
        >
          🎵
        </button>
      ) : (
        <div className="music-player-card">
          <div className="player-main">
            {/* Equalizer Icon */}
            <div
              className={`equalizer-box ${isPlaying ? 'playing' : ''}`}
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              <span className="eq-bar bar-1"></span>
              <span className="eq-bar bar-2"></span>
              <span className="eq-bar bar-3"></span>
              <span className="eq-bar bar-4"></span>
            </div>

            {/* Track Details: Only track title, language edition, and switch track button */}
            <div className="track-details">
              <div className="track-header">
                <span className="music-note-icon">🎵</span>
                <span className="track-title">{currentTrack.title}</span>
              </div>
              <div className="track-controls-sub">
                <span className="track-language">{currentTrack.language} Edition</span>
                <button
                  className="switch-track-btn"
                  onClick={(e) =>
                    handleSwitchTrack(trackKey === 'HINDI' ? 'ENGLISH' : 'HINDI', e)
                  }
                  title={`Switch to ${trackKey === 'HINDI' ? 'Cheri Cheri Lady' : 'Russian Bandana'}`}
                >
                  ⇄ {trackKey === 'HINDI' ? 'English' : 'Hindi'}
                </button>
              </div>
            </div>

            {/* Actions: Play/Pause, Mute, Red Close button */}
            <div className="player-actions">
              <button
                className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1.5" />
                    <rect x="14" y="4" width="4" height="16" rx="1.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                className="control-btn mute-btn"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              {/* Red Cross Icon: Immediately stops music & closes widget */}
              <button
                className="control-btn close-music-btn-red"
                onClick={handleStopAndClose}
                title="Stop music and close"
                aria-label="Stop music and close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
