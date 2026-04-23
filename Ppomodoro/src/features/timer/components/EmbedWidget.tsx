import { useState } from "react";
import {
  Play, Pause, RotateCcw, Search, Star, Music,
  ArrowLeftRight, X, Sun, Moon,
} from "lucide-react";
import { useTimer } from "../hooks/useTimer";

interface Track {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

const FAVORITES_KEY = "bgm-favorites";
const THEME_KEY     = "widget-theme";
const API_BASE      = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function EmbedWidget() {
  const timer = useTimer();

  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (localStorage.getItem(THEME_KEY) as "dark" | "light") ?? "dark"
  );
  const [currentTrack, setCurrentTrack]   = useState<Track | null>(null);
  const [playlistSrc, setPlaylistSrc]     = useState<string | null>(null); // 즐겨찾기 연속재생 src
  const [query, setQuery]                 = useState("");
  const [results, setResults]             = useState<Track[]>([]);
  const [favorites, setFavorites]         = useState<Track[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"); }
    catch { return []; }
  });
  const [activeTab, setActiveTab]         = useState<"search" | "favorites">("search");
  const [isSearching, setIsSearching]     = useState(false);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);
  const toggleFavorite = (track: Track, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = isFavorite(track.id)
      ? favorites.filter((f) => f.id !== track.id)
      : [...favorites, track];
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  // 검색 결과에서 단일 재생
  const playSingle = (track: Track) => {
    setCurrentTrack(track);
    setPlaylistSrc(`https://www.youtube.com/embed/${track.id}?autoplay=1&rel=0`);
  };

  // 즐겨찾기에서 선택 → 이후 목록 순서대로 연속 재생
  const playFromFavorites = (track: Track) => {
    const idx = favorites.findIndex((f) => f.id === track.id);
    const rest = [
      ...favorites.slice(idx + 1),
      ...favorites.slice(0, idx),
    ].map((f) => f.id).join(",");
    setCurrentTrack(track);
    const src = `https://www.youtube.com/embed/${track.id}?autoplay=1&rel=0${rest ? `&playlist=${rest}` : ""}`;
    setPlaylistSrc(src);
  };

  const search = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res  = await fetch(`${API_BASE}/api/youtube/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch { console.error("검색 실패"); }
    finally { setIsSearching(false); }
  };

  /* ── 색상 토큰 ── */
  const d = theme === "dark";

  const accent    = timer.mode === "focus" ? "#ff6b6b" : "#4ecdc4";
  const accentBtn = timer.mode === "focus"
    ? "bg-[#ff6b6b] hover:bg-[#ff5252]"
    : "bg-[#4ecdc4] hover:bg-[#3dbdb5]";
  const modeBadge = timer.mode === "focus"
    ? d ? "bg-[#ff6b6b]/15 text-[#ff6b6b]" : "bg-[#ff6b6b]/10 text-[#e05555]"
    : d ? "bg-[#4ecdc4]/15 text-[#4ecdc4]" : "bg-[#4ecdc4]/10 text-[#2da89f]";

  const tk = {
    page:         d ? "bg-[#0f1117]"                                   : "bg-[#f0f2f5]",
    card:         d ? "bg-[#1a1f2e] border-white/[0.08]"               : "bg-white border-black/[0.07]",
    textPrimary:  d ? "text-white"                                      : "text-[#111827]",
    textSecond:   d ? "text-white/50"                                   : "text-[#6b7280]",
    textMuted:    d ? "text-white/25"                                   : "text-[#9ca3af]",
    progressBg:   d ? "bg-white/[0.07]"                                 : "bg-black/[0.08]",
    ghostBtn:     d ? "bg-white/[0.07] hover:bg-white/15 text-white/40 hover:text-white/80"
                    : "bg-black/[0.05] hover:bg-black/10 text-[#9ca3af] hover:text-[#374151]",
    input:        d ? "bg-white/[0.07] border-white/[0.07] focus:border-white/25 text-white placeholder-white/20"
                    : "bg-[#f9fafb] border-[#e5e7eb] focus:border-[#9ca3af] text-[#111827] placeholder-[#9ca3af]",
    tabWrap:      d ? "bg-white/[0.04] border-white/[0.07]"            : "bg-black/[0.04] border-black/[0.07]",
    tabActive:    d ? "bg-white/10 text-white"                         : "bg-white text-[#111827] shadow-sm",
    tabInactive:  d ? "text-white/30 hover:text-white/60"              : "text-[#9ca3af] hover:text-[#6b7280]",
    trackHover:   d ? "hover:bg-white/[0.06]"                          : "hover:bg-black/[0.04]",
    trackPlaying: d ? "bg-white/[0.06]"                                : "bg-black/[0.04]",
    searchBtn:    d ? "bg-white/[0.07] text-white/50 hover:text-white hover:bg-white/15"
                    : "bg-black/[0.05] text-[#9ca3af] hover:text-[#374151] hover:bg-black/10",
    emptyBorder:  d ? "border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                    : "border-black/10 hover:border-black/20 hover:bg-black/[0.02]",
    emptyIconBg:  d ? "bg-white/[0.05]"                                : "bg-black/[0.05]",
    themeBtn:     d ? "text-white/25 hover:text-white/60"              : "text-[#9ca3af] hover:text-[#374151]",
    divider:      d ? "border-white/[0.06]"                            : "border-black/[0.06]",
  };

  return (
    <div className={`w-full min-h-screen overflow-y-auto ${tk.page}`}>

      {/* ── 타이머 (sticky) ── */}
      <div className={`sticky top-0 z-20 ${tk.page} px-3 pt-3 pb-2`}>
        <div className={`border rounded-2xl p-4 ${tk.card}`}>

          {/* 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${modeBadge}`}>
              {timer.mode === "focus" ? "🍅 집중" : "☕ 휴식"}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={timer.switchMode}
                className={`flex items-center gap-1 text-[11px] tabular-nums transition-colors ${tk.textMuted} hover:${d ? "text-white/60" : "text-[#6b7280]"}`}
              >
                {timer.mode === "focus" ? `${timer.focusMins}분` : `${timer.breakMins}분`}
                <ArrowLeftRight size={10} />
              </button>
              <button onClick={toggleTheme} className={`transition-colors ${tk.themeBtn}`}>
                {d ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>

          {/* 시간 */}
          <div
            className="text-6xl font-black tabular-nums text-center tracking-tighter mb-3"
            style={{ color: accent }}
          >
            {formatTime(timer.timeLeft)}
          </div>

          {/* 진행 바 */}
          <div className={`h-1 rounded-full overflow-hidden mb-4 ${tk.progressBg}`}>
            <div
              className="h-full rounded-full"
              style={{ width: `${timer.progress}%`, background: accent, transition: "width 1s linear" }}
            />
          </div>

          {/* 컨트롤 */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={timer.reset}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${tk.ghostBtn}`}
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
            <div className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* ── 음악 ── */}
      <div className="px-3 pb-4 flex flex-col gap-2">

        {/* Now Playing */}
        {currentTrack ? (
          <div className="relative rounded-2xl overflow-hidden group">
            <iframe
              key={playlistSrc}
              src={playlistSrc ?? `https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="w-full aspect-video block"
              title={currentTrack.title}
            />
            <div className="absolute inset-0 backdrop-blur-md bg-black/70 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none" />
            <div className="absolute inset-0 flex items-center gap-3 px-4 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
              <img src={currentTrack.thumbnail} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-lg" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate leading-tight">{currentTrack.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-white/40 text-xs truncate">{currentTrack.channel}</p>
                  {playlistSrc?.includes("playlist=") && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/60">
                      즐겨찾기 연속재생
                    </span>
                  )}
                </div>
              </div>
            </div>
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
            <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              마우스를 올려 컨트롤
            </p>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab("search")}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border border-dashed transition-all text-left ${tk.emptyBorder}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tk.emptyIconBg}`}>
              <Music size={16} className={tk.textMuted} />
            </div>
            <span className={`text-xs ${tk.textMuted}`}>노래를 검색해서 틀어보세요</span>
          </button>
        )}

        {/* 탭 */}
        <div className={`flex gap-1 border p-1 rounded-xl ${tk.tabWrap}`}>
          {(["search", "favorites"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab ? tk.tabActive : tk.tabInactive
              }`}
            >
              {tab === "favorites" && <Star size={11} />}
              {tab === "search" ? "검색" : `즐겨찾기${favorites.length > 0 ? ` · ${favorites.length}` : ""}`}
            </button>
          ))}
        </div>

        {/* 검색 입력 */}
        {activeTab === "search" && (
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="노래 제목, 아티스트 검색..."
              className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl outline-none border transition-all ${tk.input}`}
            />
            <button
              onClick={search}
              className={`w-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${tk.searchBtn}`}
            >
              <Search size={14} />
            </button>
          </div>
        )}

        {/* 구분선 */}
        {(results.length > 0 || (activeTab === "favorites" && favorites.length > 0)) && (
          <div className={`border-t ${tk.divider}`} />
        )}

        {/* 결과 목록 */}
        <div className="flex flex-col gap-0.5">
          {activeTab === "search" && (
            <>
              {isSearching && (
                <p className={`text-xs text-center py-4 ${tk.textMuted}`}>검색 중...</p>
              )}
              {results.map((r) => (
                <TrackItem
                  key={r.id}
                  track={r}
                  isPlaying={currentTrack?.id === r.id}
                  isFav={isFavorite(r.id)}
                  onPlay={() => playSingle(r)}
                  onToggleFav={(e) => toggleFavorite(r, e)}
                  tk={tk}
                />
              ))}
            </>
          )}
          {activeTab === "favorites" && (
            <>
              {favorites.length === 0 ? (
                <p className={`text-xs text-center py-4 ${tk.textMuted}`}>검색 후 ★ 눌러서 저장하세요</p>
              ) : (
                favorites.map((f) => (
                  <TrackItem
                    key={f.id}
                    track={f}
                    isPlaying={currentTrack?.id === f.id}
                    isFav={true}
                    onPlay={() => playFromFavorites(f)}
                    onToggleFav={(e) => toggleFavorite(f, e)}
                    tk={tk}
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
  track, isPlaying, isFav, onPlay, onToggleFav, tk,
}: {
  track: Track;
  isPlaying: boolean;
  isFav: boolean;
  onPlay: () => void;
  onToggleFav: (e: React.MouseEvent) => void;
  tk: Record<string, string>;
}) {
  return (
    <div className={`flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors group ${
      isPlaying ? tk.trackPlaying : tk.trackHover
    }`}>
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
                    style={{ height: `${[60, 100, 70][i]}%`, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${isPlaying ? tk.textPrimary : tk.textSecond}`}>
            {track.title}
          </p>
          <p className={`text-[10px] truncate mt-0.5 ${tk.textMuted}`}>{track.channel}</p>
        </div>
      </button>
      <button
        onClick={onToggleFav}
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/[0.06]"
      >
        <Star size={12} className={isFav ? "text-yellow-400 fill-yellow-400" : tk.textMuted} />
      </button>
    </div>
  );
}
