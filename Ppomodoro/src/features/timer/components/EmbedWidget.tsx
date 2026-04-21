import { useState } from "react";
import {
  Play, Pause, RotateCcw, Search, Star, Music,
  ArrowLeftRight,
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
    } catch {
      console.error("검색 실패");
    } finally {
      setIsSearching(false);
    }
  };

  const accent      = timer.mode === "focus" ? "#ff6b6b" : "#4ecdc4";
  const accentBtn   = timer.mode === "focus"
    ? "bg-[#ff6b6b] hover:bg-[#ff5252] shadow-[0_4px_14px_rgba(255,107,107,0.35)]"
    : "bg-[#4ecdc4] hover:bg-[#3dbdb5] shadow-[0_4px_14px_rgba(78,205,196,0.35)]";
  const modeBadge   = timer.mode === "focus"
    ? "bg-[#ff6b6b]/10 text-[#ff6b6b]"
    : "bg-[#4ecdc4]/10 text-[#4ecdc4]";

  return (
    <div className="h-screen w-full bg-[#0f1117] flex flex-col overflow-hidden select-none">

      {/* ─── 타이머 ─── */}
      <div className="shrink-0 p-3 pb-0">
        <div className="bg-white/[0.05] border border-white/[0.07] rounded-2xl p-4">

          <div className="flex items-center justify-between mb-3">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${modeBadge}`}>
              {timer.mode === "focus" ? "🍅 집중" : "☕ 휴식"}
            </span>
            <span className="text-white/20 text-xs tabular-nums">
              {timer.mode === "focus" ? `${timer.focusMins}분` : `${timer.breakMins}분`}
            </span>
          </div>

          <div
            className="text-5xl font-bold tabular-nums text-center mb-3 tracking-tight"
            style={{ color: accent }}
          >
            {formatTime(timer.timeLeft)}
          </div>

          <div className="h-px bg-white/8 rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full"
              style={{
                width: `${timer.progress}%`,
                background: accent,
                transition: "width 1s linear",
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-2.5">
            <button
              onClick={timer.reset}
              className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 text-white/35 hover:text-white/75 flex items-center justify-center transition-all active:scale-90"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={timer.isRunning ? timer.pause : timer.start}
              className={`flex items-center gap-1.5 px-7 py-2.5 rounded-full text-white text-sm font-semibold transition-all active:scale-95 ${accentBtn}`}
            >
              {timer.isRunning
                ? <><Pause size={14} fill="currentColor" /> 일시정지</>
                : <><Play  size={14} fill="currentColor" className="ml-0.5" /> 시작</>
              }
            </button>

            <button
              onClick={timer.switchMode}
              className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 text-white/35 hover:text-white/75 flex items-center justify-center transition-all active:scale-90"
            >
              <ArrowLeftRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 음악 ─── */}
      <div className="flex-1 flex flex-col overflow-hidden p-3 gap-2 min-h-0">

        {/* Now Playing ─ 평소엔 트랙 정보 / 호버하면 유튜브 컨트롤 노출 */}
        {currentTrack ? (
          <div className="relative shrink-0 rounded-2xl overflow-hidden group cursor-default">
            {/* iframe – 항상 렌더링 (오디오 유지) */}
            <iframe
              key={currentTrack.id}
              src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="w-full aspect-video block"
              title={currentTrack.title}
            />

            {/* 블러 오버레이 – hover 시 사라짐 → 유튜브 컨트롤 노출 */}
            <div className="absolute inset-0 backdrop-blur-md bg-black/65 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none" />

            {/* 트랙 정보 – hover 시 사라짐 */}
            <div className="absolute inset-0 flex items-center gap-3 px-4 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
              <img
                src={currentTrack.thumbnail}
                alt=""
                className="w-10 h-10 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{currentTrack.title}</p>
                <p className="text-white/40 text-xs truncate">{currentTrack.channel}</p>
              </div>
            </div>

            {/* 즐겨찾기 버튼 – 항상 표시, 클릭 가능 */}
            <button
              onClick={(e) => toggleFavorite(currentTrack, e)}
              className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <Star
                size={13}
                className={isFavorite(currentTrack.id)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-white/50 hover:text-white/80"
                }
              />
            </button>

            {/* 호버 힌트 */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <span className="text-[10px] text-white/50 bg-black/50 px-2 py-0.5 rounded-full">
                재생 컨트롤
              </span>
            </div>
          </div>
        ) : (
          <div className="shrink-0 flex items-center gap-3 p-3 rounded-2xl border border-dashed border-white/10 text-white/20">
            <Music size={16} className="shrink-0" />
            <span className="text-xs">아래에서 노래를 검색하세요</span>
          </div>
        )}

        {/* 탭 */}
        <div className="shrink-0 flex gap-1 bg-white/5 p-1 rounded-xl">
          {(["search", "favorites"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white/12 text-white"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              {tab === "favorites" && <Star size={10} />}
              {tab === "search" ? "검색" : `즐겨찾기${favorites.length > 0 ? ` (${favorites.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* 검색 입력 */}
        {activeTab === "search" && (
          <div className="shrink-0 flex gap-1.5">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="노래 검색..."
              className="flex-1 bg-white/8 text-white text-xs px-3 py-2 rounded-xl outline-none placeholder-white/20 border border-white/8 focus:border-white/25 transition-colors"
            />
            <button
              onClick={search}
              className="px-3 bg-white/8 rounded-xl text-white/50 hover:text-white hover:bg-white/15 transition-colors"
            >
              <Search size={13} />
            </button>
          </div>
        )}

        {/* 결과 목록 – 남은 공간 채우고 스크롤 */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === "search" && (
            <>
              {isSearching && (
                <p className="text-white/25 text-[11px] text-center pt-4">검색 중...</p>
              )}
              <div className="flex flex-col gap-0.5">
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
              </div>
            </>
          )}

          {activeTab === "favorites" && (
            <div className="flex flex-col gap-0.5">
              {favorites.length === 0 ? (
                <p className="text-white/20 text-[11px] text-center pt-4">
                  검색 후 ★ 눌러서 저장하세요
                </p>
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
  onToggleFav: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/8 transition-colors group ${
        isPlaying ? "bg-white/8" : ""
      }`}
    >
      <button onClick={onPlay} className="flex items-center gap-2 flex-1 min-w-0 text-left">
        <img
          src={track.thumbnail}
          alt=""
          className="w-8 h-8 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className={`text-[11px] font-medium truncate ${isPlaying ? "text-white" : "text-white/70"}`}>
            {track.title}
          </p>
          <p className="text-white/30 text-[10px] truncate">{track.channel}</p>
        </div>
      </button>
      <button
        onClick={onToggleFav}
        className="shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Star
          size={12}
          className={isFav ? "text-yellow-400 fill-yellow-400" : "text-white/35 hover:text-white/60"}
        />
      </button>
    </div>
  );
}
