"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { CloseIcon } from "@/components/ui/CloseIcon";
import styles from "./YouTubeDemoPlayer.module.css";

interface YouTubeDemoPlayerProps {
  onClose: () => void;
  startSeconds?: number;
  videoId: string;
}

const iframeApiSrc = "https://www.youtube.com/iframe_api";

export function YouTubeDemoPlayer({
  onClose,
  startSeconds = 0,
  videoId
}: YouTubeDemoPlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    function createPlayer() {
      if (
        cancelled ||
        !mountRef.current ||
        !window.YT?.Player ||
        playerRef.current
      ) {
        return;
      }

      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId,
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
          showinfo: 0,
          start: startSeconds
        },
        events: {
          onReady: ({ target }) => {
            if (cancelled) {
              return;
            }

            target.mute();
            target.playVideo();
            setReady(true);
          },
          onStateChange: ({ data }) => {
            if (!window.YT) {
              return;
            }

            if (data === window.YT.PlayerState.PLAYING) {
              setPlaying(true);
            } else if (data === window.YT.PlayerState.ENDED) {
              setPlaying(false);
              setProgress(1);
            } else if (data === window.YT.PlayerState.BUFFERING) {
              setPlaying(false);
            }
          },
          onError: () => setFailed(true)
        }
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${iframeApiSrc}"]`
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src = iframeApiSrc;
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
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [startSeconds, videoId]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const timer = window.setInterval(() => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      setProgress(getPerceivedProgress(currentTime, duration, startSeconds));
    }, 250);

    return () => window.clearInterval(timer);
  }, [ready, startSeconds]);

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        aria-labelledby="video-demo-title"
        aria-modal="true"
        className={styles.backdrop}
        data-modal-open="true"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
        role="dialog"
        transition={{ duration: 0.25 }}
      >
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={styles.dialog}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          initial={{ opacity: 0, scale: 0.985, y: 12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.dialogHeader}>
            <div>
              <p className={styles.kicker}>Demonstração do produto</p>
              <h2 id="video-demo-title">Veja como o TarefasFlow organiza seu dia</h2>
            </div>
            <button
              aria-label="Fechar demonstração"
              className={styles.closeButton}
              onClick={onClose}
              ref={closeButtonRef}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>

          <div className={styles.videoFrame}>
            <Image
              alt=""
              aria-hidden="true"
              className={`${styles.poster} ${playing ? styles.posterHidden : ""}`}
              fill
              sizes="(max-width: 900px) 94vw, 960px"
              src="/images/01-hero.png"
            />
            <div className={styles.playerCrop}>
              <div className={styles.playerMount} ref={mountRef} />
            </div>
            <div aria-hidden="true" className={styles.interactionShield} />
            {!playing && !failed ? (
              <div className={styles.loading}>
                <span className={styles.spinner} />
                <span>{ready ? "Preparando reprodução" : "Carregando demonstração"}</span>
              </div>
            ) : null}
            {failed ? (
              <div className={styles.error}>
                <p>Não foi possível carregar a demonstração agora.</p>
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}&t=${startSeconds}s`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir o vídeo
                </a>
              </div>
            ) : null}
            <div className={styles.videoBrand}>
              <BrandLogo linked={false} />
            </div>
            <div
              aria-label="Progresso da demonstração"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(progress * 100)}
              className={styles.progressTrack}
              role="progressbar"
            >
              <span
                className={styles.progressBar}
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          </div>

          <p className={styles.caption}>
            O vídeo inicia automaticamente sem som. Feche quando quiser.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function getPerceivedProgress(
  currentTime: number,
  duration: number,
  startSeconds: number
) {
  if (!Number.isFinite(duration) || duration <= startSeconds) {
    return 0;
  }

  const elapsed = Math.max(0, currentTime - startSeconds);
  const playableDuration = duration - startSeconds;
  const realProgress = Math.min(1, elapsed / playableDuration);
  const quickPhase = Math.min(30, playableDuration * 0.55);
  const finalPhase = Math.min(8, playableDuration * 0.12);
  const middleEnd = playableDuration - finalPhase;

  if (elapsed <= quickPhase) {
    return Math.min(0.5, (elapsed / Math.max(quickPhase, 1)) * 0.5);
  }

  if (elapsed < middleEnd && middleEnd > quickPhase) {
    const middleProgress =
      (elapsed - quickPhase) / (middleEnd - quickPhase);
    return 0.5 + middleProgress * 0.4;
  }

  return realProgress;
}
