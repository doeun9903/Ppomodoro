import { useState } from "react";
import { Play, Pause, RotateCcw, Search, Star, Music, ArrowLeftRight, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showMusic, setShowMusic] = useState(false);

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
      const res = await fetch(`${API_BASE}/api/youtube/search?q=${encodeURIComponent(query)}`);
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

  const accent = timer.mode === "focus" ? "#ff6b6b" : "#4ecdc4";
  const accentBg = timer.mode === "focus"
    ? "bg-[#ff6b6b] hover:bg-[#ff5252]"
    : "bg-[#4ecdc4] hover:bg-[#3dbdb5]";
  const modeBadge = timer.mode === "focus"
    ? "bg-[#ff6b6b]/15 text-[#ff6b6b] border border-[#ff6b6b]/20"
    : "bg-[#4ecdc4]/15 text-[#4ecdc4] border border-[#4ecdc4]/20";

  return (
    <div className="min-h-screen w-full bg-[#111827] flex flex-col p-3 gap-2.5 font-sans">

      {/* ── 타이머 섹션 ── */}
      <div className="bg-white/5 border border-white/8 rounded-2xl p-4">

        {/* 모드 배지 + 설정시간 */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${modeBadge}`}>
            {timer.mode === "focus" ? "🍅 집중 모드" : "☕ 휴식 모드"}
          </span>
          <span className="text-white/25 text-[11px]">
            {timer.mode === "focus" ? `${timer.focusMins}분` : `${timer.breakMins}분`}
          </span>
        </div>

        {/* 시간 표시 */}
        <div className="text-center mb-4">
          <span
            className="text-6xl font-bold tabular-nums tracking-tight"
            style={{ color: accent }}
          >
            {formatTime(timer.timeLeft)}
          </span>
        </div>

        {/* 진행 바 */}
        <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden mb-5">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${timer.progress}%`, background: accent }}
          />
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={timer.reset}
            className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 text-white/40 hover:text-white/80 flex items-center justify-center transition-all active:scale-90"
            title="리셋"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={timer.isRunning ? timer.pause : timer.start}
            className={`px-8 py-2.5 rounded-full font-semibold text-white text-sm flex items-center gap-2 transition-all active:scale-95 ${accentBg}`}
          >
            {timer.isRunning
              ? <><Pause size={15} fill="currentColor" /> 일시정지</>
              : <><Play size={15} fill="currentColor" className="ml-0.5" /> 시작</>
            }
          </button>

          <button
            onClick={timer.switchMode}
            className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 text-white/40 hover:text-white/80 flex items-center justify-center transition-all active:scale-90"
            title="모드 전환"
          >
            <ArrowLeftRight size={14} />
          </button>
        </div>
      </div>

      {/* ── 음악 섹션 ── */}
      <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">

        {/* 헤더 토글 */}
        <button
          onClick={() => setShowMusic((v) => !v)}
          className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <Music size={13} className="text-white/40 shrink-0" />
          {currentTrack ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img
                src={currentTrack.thumbnail}
                alt=""
                className="w-5 h-5 rounded object-cover shrink-0"
              />
              <span className="text-white/65 text-xs truncate">{currentTrack.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(currentTrack); }}
                className="shrink-0 ml-auto"
              >
                <Star
                  size={11}
                  className={isFavorite(currentTrack.id)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-white/25 hover:text-white/50"
                  }
                />
              </button>
            </div>
          ) : (
            <span className="flex-1 text-white/30 text-xs text-left">음악 선택하기</span>
          )}
          {showMusic
            ? <ChevronUp size={13} className="text-white/25 shrink-0" />
            : <ChevronDown size={13} className="text-white/25 shrink-0" />
          }
        </button>

        {/* 펼쳐지는 영역 */}
        {showMusic && (
          <div className="border-t border-white/8">

            {/* YouTube 미니 플레이어 */}
            {currentTrack && (
              <div className="px-3 pt-3">
                <div className="rounded-xl overflow-hidden bg-black">
                  <iframe
                    key={currentTrack.id}
                    src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&rel=0`}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="w-full aspect-video block"
                    title={currentTrack.title}
                  />
                </div>
              </div>
            )}

            {/* 탭 */}
            <div className="flex gap-1 px-3 pt-3">
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                  activeTab === "search"
                    ? "bg-white/12 text-white"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                검색
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
                  activeTab === "favorites"
                    ? "bg-white/12 text-white"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                <Star size={10} />
                즐겨찾기
                {favorites.length > 0 && (
                  <span className="text-white/40">({favorites.length})</span>
                )}
              </button>
            </div>

            <div className="p-3">
              {activeTab === "search" && (
                <>
                  <div className="flex gap-1.5 mb-2">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && search()}
                      placeholder="노래 검색..."
                      className="flex-1 bg-white/8 text-white text-xs px-3 py-2 rounded-xl outline-none placeholder-white/25 border border-white/8 focus:border-white/25 transition-colors"
                    />
                    <button
                      onClick={search}
                      className="px-3 py-2 bg-white/8 rounded-xl text-white/60 hover:text-white hover:bg-white/15 transition-colors"
                    >
                      <Search size={13} />
                    </button>
                  </div>

                  {isSearching && (
                    <p className="text-white/30 text-[11px] text-center py-3">검색 중...</p>
                  )}

                  <div className="flex flex-col gap-0.5 max-h-44 overflow-y-auto">
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
                <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                  {favorites.length === 0 ? (
                    <p className="text-white/25 text-[11px] text-center py-5">
                      검색 후 ★ 눌러서 저장하세요
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
        )}
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
      className={`flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/8 transition-colors group ${
        isPlaying ? "bg-white/8" : ""
      }`}
    >
      <button onClick={onPlay} className="flex items-center gap-2 flex-1 min-w-0 text-left">
        <img
          src={track.thumbnail}
          alt={track.title}
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
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
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
