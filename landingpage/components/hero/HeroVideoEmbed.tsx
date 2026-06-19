"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./HeroVideoEmbed.module.css";

const VIDEO_ID = "RXkQV21uKTg";
const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

// 0-65% visual fills in first 20% of real time (very fast)
// 65-85% visual fills in next 35% of real time (medium)
// 85-100% visual fills in remaining 45% of real time (slow)
function getPerceivedProgress(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const real = Math.min(1, currentTime / duration);
  if (real <= 0.2) return (real / 0.2) * 0.65;
  if (real <= 0.55) return 0.65 + ((real - 0.2) / 0.35) * 0.2;
  return 0.85 + ((real - 0.55) / 0.45) * 0.15;
}

export function HeroVideoEmbed() {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const trackingRef = useRef<number | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  const startTracking = useCallback(() => {
    if (trackingRef.current) return;
    trackingRef.current = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      setProgress(getPerceivedProgress(currentTime, duration));
    }, 250);
  }, []);

  useEffect(() => {
    let cancelled = false;

    function createPlayer() {
      if (cancelled || !mountRef.current || !window.YT?.Player || playerRef.current) return;

      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: ({ target }) => {
            if (cancelled) return;
            target.mute();
            target.playVideo();
            setReady(true);
          },
          onStateChange: ({ data }) => {
            if (!window.YT) return;
            if (data === window.YT.PlayerState.PLAYING) {
              startTracking();
            } else if (data === window.YT.PlayerState.ENDED) {
              if (trackingRef.current) {
                window.clearInterval(trackingRef.current);
                trackingRef.current = null;
              }
              setProgress(1);
            }
          },
          onError: () => {},
        },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${IFRAME_API_SRC}"]`
      );
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = IFRAME_API_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
      if (trackingRef.current) {
        window.clearInterval(trackingRef.current);
        trackingRef.current = null;
      }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [startTracking]);

  const handleUnlockAudio = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.unMute();
    player.seekTo(0, true);
    player.playVideo();
    if (trackingRef.current) {
      window.clearInterval(trackingRef.current);
      trackingRef.current = null;
    }
    setProgress(0);
    setAudioUnlocked(true);
    startTracking();
  }, [startTracking]);

  const showOverlay = ready && !audioUnlocked;

  return (
    <figure className={styles.figure}>
      <div aria-hidden="true" className={styles.glow} />
      <div className={styles.frame}>
        <div className={styles.playerWrap}>
          <div className={styles.playerMount} ref={mountRef} />
        </div>

        {/* Blocks native YouTube controls on hover */}
        <div aria-hidden="true" className={styles.shield} />

        {/* Dark scrim — draws attention to the CTA overlay */}
        {showOverlay ? (
          <div aria-hidden="true" className={styles.videoScrim} />
        ) : null}

        {showOverlay ? (
          <button
            className={styles.audioButton}
            onClick={handleUnlockAudio}
            type="button"
          >
            <span aria-hidden="true" className={styles.audioEmoji}>🔊</span>
            <span className={styles.audioLabel}>Ativar áudio</span>
            <span className={styles.audioSub}>Toque para ouvir a demonstração completa</span>
          </button>
        ) : null}
      </div>

      <div
        aria-label="Progresso do vídeo"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(progress * 100)}
        className={styles.progressTrack}
        role="progressbar"
      >
        <span
          className={styles.progressFill}
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <figcaption className="sr-only">
        Demonstração em vídeo do TarefasFlow, assistente de produtividade no WhatsApp.
      </figcaption>
    </figure>
  );
}
