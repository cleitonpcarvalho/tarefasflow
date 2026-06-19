export {};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          host?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: YouTubePlayerEvent) => void;
            onStateChange?: (event: YouTubePlayerStateEvent) => void;
            onError?: () => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }

  interface YouTubePlayer {
    destroy: () => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    mute: () => void;
    unMute: () => void;
    pauseVideo: () => void;
    playVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  }

  interface YouTubePlayerEvent {
    target: YouTubePlayer;
  }

  interface YouTubePlayerStateEvent extends YouTubePlayerEvent {
    data: number;
  }
}
