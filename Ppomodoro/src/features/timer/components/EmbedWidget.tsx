import { useState } from "react";
import { Play, Pause, RotateCcw, Search, Star, Music, ArrowLeftRight } from "lucide-react";
import { useTimer } from "../hooks/useTimer";

interface Track {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

const FAVORITES_KEY = "bgm-favorites";
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function EmbedWidget() {
  const timer = useTimer();

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"); }
    catch { return []; }
  });
  const [activeTab, setActiveTab] = useState<"search" | "favorites">("search");
  const [isSearching, setIsSearching] = useState(false);

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  const toggleFavorite = (track: Track) => {
    const next = isFavorite(track.id)
      ? favorites.filter((f) => f.id !== track.id)
      : [...favorites, track];
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  const search = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/youtube/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResults(data);
    } catch {
      console.error("검색 실패");
    } finally {
      setIsSearching(false);
    }
  };

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
  };

  const accentColor = timer.mode === "focus" ? "#ff6b6b" : "#4ecdc4";
  const accentBg = timer.mode === "focus"
    ? "bg-[#ff6b6b] hover:bg-[#ff5555] shadow-[#ff6b6b]/30"
    : "bg-[#4ecdc4] hover:bg-[#3dbdb5] shadow-[#4ecdc4]/30";
  const modeBadgeBg = timer.mode === "focus"
    ? "bg-[#ff6b6b]/20 text-[#ff6b6b]"
    : "bg-[#4ecdc4]/20 text-[#4ecdc4]";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1e1547] to-[#0d2a60] p-3 flex flex-col gap-3">

      {/* ── 타이머 카드 ── */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${modeBadgeBg}`}>
            {timer.mode === "focus" ? "🍅 집중" : "☕ 휴식"}
          </span>
          <span className="text-white/35 text-xs tabular-nums">
            {timer.mode === "focus" ? `${timer.focusMins}분` : `${timer.breakMins}분`}
          </span>
        </div>

        <div className="text-5xl font-bold text-white tracking-tight tabular-nums text-center mb-4">
          {formatTime(timer.timeLeft)}
        </div>

        {/* 진행 바 */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${timer.progress}%`, background: accentColor }}
          />
        </div>

        {/* 버튼 */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={timer.reset}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all active:scale-90"
          >
            <RotateCcw size={15} />
          </button>

          <button
            onClick={timer.isRunning ? timer.pause : timer.start}
            className={`px-10 py-2.5 rounded-full font-semibold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center ${accentBg}`}
          >
            {timer.isRunning
              ? <Pause size={18} fill="currentColor" />
              : <Play size={18} fill="currentColor" className="ml-0.5" />
            }
          </button>

          <button
            onClick={timer.switchMode}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all active:scale-90"
          >
            <ArrowLeftRight size={15} />
          </button>
        </div>
      </div>

      {/* ── YouTube 플레이어 ── */}
      {currentTrack ? (
        <div className="bg-black/30 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
          <iframe
            key={currentTrack.id}
            src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&rel=0`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video block"
            title={currentTrack.title}
          />
          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
            <span className="flex-1 text-white/70 text-xs truncate">{currentTrack.title}</span>
            <button
              onClick={() => toggleFavorite(currentTrack)}
              className="shrink-0 transition-colors"
            >
              <Star
                size={15}
                className={isFavorite(currentTrack.id)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-white/30 hover:text-white/60"
                }
              />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setActiveTab("search")}
          className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <Music size={18} className="text-white/25 shrink-0" />
          <span className="text-white/30 text-sm">아래에서 노래를 검색하세요</span>
        </div>
      )}

      {/* ── 검색 / 즐겨찾기 ── */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-lg overflow-hidden">
        {/* 탭 */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === "search" ? "text-white bg-white/10" : "text-white/35 hover:text-white/60"
            }`}
          >
            검색
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === "favorites" ? "text-white bg-white/10" : "text-white/35 hover:text-white/60"
            }`}
          >
            <Star size={11} />
            즐겨찾기 {favorites.length > 0 && `(${favorites.length})`}
          </button>
        </div>

        <div className="p-3">
          {activeTab === "search" && (
            <>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  placeholder="노래 검색..."
                  className="flex-1 bg-white/10 text-white text-sm px-3 py-2 rounded-xl outline-none placeholder-white/30 border border-white/10 focus:border-white/30"
                />
                <button
                  onClick={search}
                  className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
                >
                  <Search size={16} />
                </button>
              </div>

              {isSearching && (
                <p className="text-white/35 text-xs text-center py-3">검색 중...</p>
              )}

              <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
                {results.map((r) => (
                  <TrackItem
                    key={r.id}
                    track={r}
                    isPlaying={currentTrack?.id === r.id}
                    isFav={isFavorite(r.id)}
                    onPlay={() => playTrack(r)}
                    onToggleFav={() => toggleFavorite(r)}
                  />
                ))}
              </div>
            </>
          )}

          {activeTab === "favorites" && (
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
              {favorites.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-6">
                  검색 결과에서 ★ 눌러서 저장하세요
                </p>
              ) : (
                favorites.map((f) => (
                  <TrackItem
                    key={f.id}
                    track={f}
                    isPlaying={currentTrack?.id === f.id}
                    isFav={true}
                    onPlay={() => playTrack(f)}
                    onToggleFav={() => toggleFavorite(f)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackItem({
  track, isPlaying, isFav, onPlay, onToggleFav,
}: {
  track: Track;
  isPlaying: boolean;
  isFav: boolean;
  onPlay: () => void;
  onToggleFav: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 transition-colors group ${
        isPlaying ? "bg-white/10" : ""
      }`}
    >
      <button onClick={onPlay} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
        <img
          src={track.thumbnail}
          alt={track.title}
          className="w-9 h-9 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${isPlaying ? "text-white" : "text-white/75"}`}>
            {track.title}
          </p>
          <p className="text-white/35 text-[10px] truncate">{track.channel}</p>
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        className="shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Star
          size={13}
          className={isFav ? "text-yellow-400 fill-yellow-400" : "text-white/40 hover:text-white/70"}
        />
      </button>
    </div>
  );
}
