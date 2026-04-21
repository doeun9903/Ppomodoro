import { useState } from "react";
import {
  Play, Pause, RotateCcw, Search, Star, Music,
  ArrowLeftRight, X,
} from "lucide-react";
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

  const toggleFavorite = (track: Track, e?: React.MouseEvent) => {
    e?.stopPropagation();
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
      const res = await fetch(`${API_BASE}/api/youtube/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch { console.error("검색 실패"); }
    finally { setIsSearching(false); }
  };

  const accent    = timer.mode === "focus" ? "#ff6b6b" : "#4ecdc4";
  const accentBtn = timer.mode === "focus"
    ? "bg-[#ff6b6b] hover:bg-[#ff5252]"
    : "bg-[#4ecdc4] hover:bg-[#3dbdb5]";
  const modeBadge = timer.mode === "focus"
    ? "bg-[#ff6b6b]/15 text-[#ff6b6b]"
    : "bg-[#4ecdc4]/15 text-[#4ecdc4]";

  return (
    <div className="w-full min-h-screen bg-[#0f1117] overflow-y-auto">

      {/* ── 타이머 (항상 상단 고정) ── */}
      <div className="sticky top-0 z-20 bg-[#0f1117] px-3 pt-3 pb-2">
        <div className="bg-[#1a1f2e] border border-white/[0.08] rounded-2xl p-4">

          {/* 모드 + 설정 시간 */}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide ${modeBadge}`}>
              {timer.mode === "focus" ? "🍅 집중" : "☕ 휴식"}
            </span>
            <button
              onClick={timer.switchMode}
              className="flex items-center gap-1.5 text-white/25 hover:text-white/60 text-[11px] transition-colors"
            >
              <span className="tabular-nums">
                {timer.mode === "focus" ? `${timer.focusMins}분` : `${timer.breakMins}분`}
              </span>
              <ArrowLeftRight size={11} />
            </button>
          </div>

          {/* 시간 */}
          <div
            className="text-6xl font-black tabular-nums text-center tracking-tighter mb-3"
            style={{ color: accent }}
          >
            {formatTime(timer.timeLeft)}
          </div>

          {/* 진행 바 */}
          <div className="h-1 rounded-full bg-white/[0.07] overflow-hidden mb-4">
            <div
              className="h-full rounded-full"
              style={{
                width: `${timer.progress}%`,
                background: accent,
                transition: "width 1s linear",
              }}
            />
          </div>

          {/* 컨트롤 */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={timer.reset}
              className="w-10 h-10 rounded-full bg-white/[0.07] hover:bg-white/15 text-white/40 hover:text-white/80 flex items-center justify-center transition-all active:scale-90"
            >
              <RotateCcw size={15} />
            </button>

            <button
              onClick={timer.isRunning ? timer.pause : timer.start}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-full text-white text-sm font-bold transition-all active:scale-95 ${accentBtn}`}
            >
              {timer.isRunning
                ? <><Pause size={15} fill="currentColor" />일시정지</>
                : <><Play  size={15} fill="currentColor" className="ml-0.5" />시작</>
              }
            </button>

            {/* 리셋 자리 채우기용 더미 (대칭) */}
            <div className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* ── 음악 (스크롤 영역) ── */}
      <div className="px-3 pb-4 flex flex-col gap-2">

        {/* Now Playing */}
        {currentTrack ? (
          <div className="relative rounded-2xl overflow-hidden group">
            <iframe
              key={currentTrack.id}
              src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="w-full aspect-video block"
              title={currentTrack.title}
            />
            {/* 블러 오버레이 — 호버 시 사라짐 */}
            <div className="absolute inset-0 backdrop-blur-md bg-black/70 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none" />
            {/* 트랙 정보 */}
            <div className="absolute inset-0 flex items-center gap-3 px-4 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
              <img src={currentTrack.thumbnail} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-lg" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate leading-tight">{currentTrack.title}</p>
                <p className="text-white/40 text-xs truncate mt-0.5">{currentTrack.channel}</p>
              </div>
            </div>
            {/* 액션 버튼 */}
            <div className="absolute top-2.5 right-2.5 z-10 flex gap-1">
              <button
                onClick={(e) => toggleFavorite(currentTrack, e)}
                className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <Star size={12} className={isFavorite(currentTrack.id) ? "text-yellow-400 fill-yellow-400" : "text-white/70"} />
              </button>
              <button
                onClick={() => setCurrentTrack(null)}
                className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X size={12} className="text-white/70" />
              </button>
            </div>
            {/* 호버 힌트 */}
            <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              마우스를 올려 컨트롤
            </p>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab("search")}
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-all text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
              <Music size={16} className="text-white/25" />
            </div>
            <span className="text-white/30 text-xs">노래를 검색해서 틀어보세요</span>
          </button>
        )}

        {/* 탭 */}
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.07] p-1 rounded-xl">
          {(["search", "favorites"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              {tab === "favorites" && <Star size={11} />}
              {tab === "search" ? "검색" : `즐겨찾기${favorites.length > 0 ? ` · ${favorites.length}` : ""}`}
            </button>
          ))}
        </div>

        {/* 검색 */}
        {activeTab === "search" && (
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="노래 제목, 아티스트 검색..."
              className="flex-1 bg-white/[0.07] text-white text-xs px-3.5 py-2.5 rounded-xl outline-none placeholder-white/20 border border-white/[0.07] focus:border-white/25 focus:bg-white/10 transition-all"
            />
            <button
              onClick={search}
              className="w-10 bg-white/[0.07] rounded-xl text-white/50 hover:text-white hover:bg-white/15 flex items-center justify-center transition-all active:scale-95"
            >
              <Search size={14} />
            </button>
          </div>
        )}

        {/* 결과 */}
        <div className="flex flex-col gap-0.5">
          {activeTab === "search" && (
            <>
              {isSearching && (
                <p className="text-white/25 text-xs text-center py-4">검색 중...</p>
              )}
              {results.map((r) => (
                <TrackItem
                  key={r.id}
                  track={r}
                  isPlaying={currentTrack?.id === r.id}
                  isFav={isFavorite(r.id)}
                  onPlay={() => setCurrentTrack(r)}
                  onToggleFav={(e) => toggleFavorite(r, e)}
                />
              ))}
            </>
          )}

          {activeTab === "favorites" && (
            <>
              {favorites.length === 0 ? (
                <p className="text-white/20 text-xs text-center py-4">검색 후 ★ 눌러서 저장하세요</p>
              ) : (
                favorites.map((f) => (
                  <TrackItem
                    key={f.id}
                    track={f}
                    isPlaying={currentTrack?.id === f.id}
                    isFav={true}
                    onPlay={() => setCurrentTrack(f)}
                    onToggleFav={(e) => toggleFavorite(f, e)}
                  />
                ))
              )}
            </>
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
  onToggleFav: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.07] transition-colors group ${
        isPlaying ? "bg-white/[0.07]" : ""
      }`}
    >
      <button onClick={onPlay} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
        <div className="relative shrink-0">
          <img src={track.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover" />
          {isPlaying && (
            <div className="absolute inset-0 rounded-lg bg-black/30 flex items-center justify-center">
              <div className="flex gap-0.5 items-end h-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-white rounded-full animate-pulse"
                    style={{
                      height: `${[60, 100, 70][i]}%`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${isPlaying ? "text-white" : "text-white/75"}`}>
            {track.title}
          </p>
          <p className="text-white/30 text-[10px] truncate mt-0.5">{track.channel}</p>
        </div>
      </button>
      <button
        onClick={onToggleFav}
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
      >
        <Star size={12} className={isFav ? "text-yellow-400 fill-yellow-400" : "text-white/40"} />
      </button>
    </div>
  );
}
