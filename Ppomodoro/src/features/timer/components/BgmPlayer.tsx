import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Play, Pause, Volume2, Search, X, Music, Star } from "lucide-react";
import Tooltip from "../../../shared/components/Tooltip";

interface Track {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const FAVORITES_KEY = "bgm-favorites";

// 노션 등 외부 iframe 안에 임베드됐는지 감지
const isEmbedded = (() => {
  try { return window.self !== window.top; }
  catch { return true; }
})();

export interface BgmPlayerHandle {
  toggle: () => void;
}

const BgmPlayer = forwardRef<BgmPlayerHandle>(function BgmPlayer(_, ref) {
  // ── 일반 모드용 ──────────────────────────────────────
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── 임베드 모드용 (postMessage 직접 제어) ────────────
  const embedIframeRef = useRef<HTMLIFrameElement>(null);

  // ── 공용 상태 ────────────────────────────────────────
  const volumeRef = useRef<number>(50);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("bgm-volume");
    if (!saved) return 50;
    const n = Number(saved);
    return n <= 1 ? 50 : n;
  });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "favorites">("search");
  const [isSearching, setIsSearching] = useState(false);
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => { volumeRef.current = volume; }, [volume]);

  // ── 일반 모드: YouTube IFrame API 초기화 ─────────────
  useEffect(() => {
    if (isEmbedded) return;

    const createPlayer = () => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "0",
        width: "0",
        playerVars: { autoplay: 0 },
        events: {
          onReady: (e: any) => {
            setIsReady(true);
            e.target.setVolume(volumeRef.current);
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              if (e.data === window.YT.PlayerState.ENDED) e.target.playVideo();
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => { playerRef.current?.destroy(); };
  }, []);

  // ── 임베드 모드: YouTube postMessage 수신 ────────────
  useEffect(() => {
    if (!isEmbedded) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== "https://www.youtube.com") return;
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;

        // 플레이어 준비 완료
        if (data.event === "onReady") {
          setIsReady(true);
          sendYTCommand("setVolume", volumeRef.current);
        }

        // 재생 상태 변화
        if (data.event === "infoDelivery" && data.info?.playerState !== undefined) {
          const state = data.info.playerState;
          setIsPlaying(state === 1);
          // 끝나면 자동 반복
          if (state === 0) sendYTCommand("playVideo");
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // ── 임베드 모드: 트랙 변경 시 3초 후 ready 폴백 ──────
  useEffect(() => {
    if (!isEmbedded || !currentTrack) return;
    setIsReady(false);
    const timer = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(timer);
  }, [currentTrack]);

  // ── 임베드 모드: postMessage 명령 전송 ───────────────
  const sendYTCommand = (func: string, args: unknown = "") => {
    embedIframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    );
  };

  // ── 볼륨 변경 ────────────────────────────────────────
  useEffect(() => {
    if (isEmbedded) {
      sendYTCommand("setVolume", volume);
    } else {
      playerRef.current?.setVolume?.(volume);
    }
    localStorage.setItem("bgm-volume", String(volume));
  }, [volume]);

  // ── 즐겨찾기 저장 ────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  const toggleFavorite = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      isFavorite(track.id) ? prev.filter((f) => f.id !== track.id) : [...prev, track]
    );
  };

  // ── 검색 ─────────────────────────────────────────────
  const search = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/api/youtube/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResults(data);
    } catch {
      console.error("검색 실패");
    } finally {
      setIsSearching(false);
    }
  };

  // ── 트랙 재생 ────────────────────────────────────────
  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setShowPanel(false);
    setResults([]);
    setQuery("");
    setIsPlaying(false);

    if (isEmbedded) {
      // key 변경으로 iframe 재마운트 → autoplay=1로 자동 시작
    } else {
      playerRef.current?.loadVideoById(track.id);
    }
  };

  // ── 재생/일시정지 토글 ───────────────────────────────
  const togglePlay = () => {
    if (isEmbedded) {
      if (isPlaying) {
        sendYTCommand("pauseVideo");
        setIsPlaying(false);
      } else {
        sendYTCommand("playVideo");
        setIsPlaying(true);
      }
    } else {
      if (!playerRef.current) return;
      isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
    }
  };

  useImperativeHandle(ref, () => ({ toggle: togglePlay }));

  const closePanel = () => { setShowPanel(false); setResults([]); };

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[1000] scale-90 sm:scale-100">

      {/* 임베드 모드: YouTube iframe 화면 밖에 숨겨두기 */}
      {isEmbedded && currentTrack && (
        <iframe
          ref={embedIframeRef}
          key={currentTrack.id}
          src={`https://www.youtube.com/embed/${currentTrack.id}?enablejsapi=1&autoplay=1&controls=0&loop=1&playlist=${currentTrack.id}`}
          allow="autoplay; encrypted-media"
          style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "1px", height: "1px" }}
          title="BGM"
        />
      )}

      {/* 검색 / 즐겨찾기 패널 */}
      {showPanel && (
        <div className="w-80 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl">
          <div className="flex gap-1 mb-3 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "search" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              검색
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === "favorites" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              <Star size={11} />
              즐겨찾기 {favorites.length > 0 && `(${favorites.length})`}
            </button>
          </div>

          {activeTab === "search" && (
            <>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  placeholder="노래 검색..."
                  autoFocus
                  className="flex-1 bg-white/10 text-white text-sm px-3 py-2 rounded-xl outline-none placeholder-white/30 border border-white/10 focus:border-white/30"
                />
                <button onClick={search} className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors">
                  <Search size={16} />
                </button>
              </div>
              {isSearching && <p className="text-white/40 text-xs text-center py-3">검색 중...</p>}
              <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
                {results.map((r) => (
                  <TrackItem
                    key={r.id}
                    track={r}
                    isPlaying={currentTrack?.id === r.id && isPlaying}
                    isFav={isFavorite(r.id)}
                    onPlay={() => playTrack(r)}
                    onToggleFav={(e) => toggleFavorite(r, e)}
                  />
                ))}
              </div>
            </>
          )}

          {activeTab === "favorites" && (
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
              {favorites.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-6">검색 결과에서 ★ 눌러서 저장하세요</p>
              ) : (
                favorites.map((f) => (
                  <TrackItem
                    key={f.id}
                    track={f}
                    isPlaying={currentTrack?.id === f.id && isPlaying}
                    isFav={true}
                    onPlay={() => playTrack(f)}
                    onToggleFav={(e) => toggleFavorite(f, e)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 플레이어 바 (임베드/일반 동일한 UI) */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
        <div ref={containerRef} className="hidden" />

        <button
          onClick={() => (showPanel ? closePanel() : setShowPanel(true))}
          className="text-white/60 hover:text-white transition-colors"
        >
          {showPanel ? <X size={16} /> : <Search size={16} />}
        </button>

        <div className="flex items-center gap-1.5 max-w-[130px]">
          <Music size={12} className="text-white/40 shrink-0" />
          <span className="text-white/60 text-xs truncate">
            {currentTrack ? currentTrack.title : "노래를 검색하세요"}
          </span>
        </div>

        {currentTrack && (
          <button onClick={(e) => toggleFavorite(currentTrack, e)} className="transition-colors">
            <Star
              size={14}
              className={isFavorite(currentTrack.id) ? "text-yellow-400 fill-yellow-400" : "text-white/30 hover:text-white/60"}
            />
          </button>
        )}

        <Tooltip label={isPlaying ? "일시정지 [X]" : "재생 [X]"}>
          <button
            onClick={togglePlay}
            disabled={!isReady || !currentTrack}
            className="text-white hover:text-white/80 hover:scale-110 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center"
          >
            {isPlaying
              ? <Pause size={20} fill="currentColor" />
              : <Play size={20} fill="currentColor" className="ml-0.5" />
            }
          </button>
        </Tooltip>

        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-white/70" />
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 accent-white"
          />
        </div>
      </div>
    </div>
  );
});

export default BgmPlayer;

function TrackItem({
  track, isPlaying, isFav, onPlay, onToggleFav,
}: {
  track: Track;
  isPlaying: boolean;
  isFav: boolean;
  onPlay: () => void;
  onToggleFav: (e: React.MouseEvent) => void;
}) {
  return (
    <div className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 transition-colors group ${isPlaying ? "bg-white/10" : ""}`}>
      <button onClick={onPlay} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
        <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${isPlaying ? "text-white" : "text-white/80"}`}>{track.title}</p>
          <p className="text-white/40 text-xs truncate">{track.channel}</p>
        </div>
      </button>
      <button onClick={onToggleFav} className="shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Star size={14} className={isFav ? "text-yellow-400 fill-yellow-400" : "text-white/40 hover:text-white/70"} />
      </button>
    </div>
  );
}
