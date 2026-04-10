import { useEffect, useState } from "react";
import { Menu as MenuIcon, X, Clock8, Trash2, AlertCircle, Settings, Timer, BarChart2 } from "lucide-react";

interface TodoStat {
  id: string;
  content: string;
  focused_seconds: number;
}

interface Props {
  totalStudyTime: number;
  todayStudyTime: number;
  studyHistory: Record<string, number>;
  resetTotalStudyTime: () => void;
  focusMins: number;
  breakMins: number;
  onUpdateTimerSettings: (focusMins: number, breakMins: number) => void;
}

const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

function getLast7Days(history: Record<string, number>) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const isToday = i === 6;
    return {
      key,
      label: isToday ? "오늘" : DAY_KR[d.getDay()],
      seconds: history[key] ?? 0,
      isToday,
    };
  });
}

export default function Menu({
  totalStudyTime,
  todayStudyTime,
  studyHistory,
  resetTotalStudyTime,
  focusMins,
  breakMins,
  onUpdateTimerSettings,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "settings">("stats");

  // 타이머 설정 로컬 상태
  const [localFocus, setLocalFocus] = useState(focusMins);
  const [localBreak, setLocalBreak] = useState(breakMins);

  // 투두별 통계
  const [todoStats, setTodoStats] = useState<TodoStat[]>([]);
  const [loadingTodos, setLoadingTodos] = useState(false);

  const handleOpenMenu = () => {
    setLocalFocus(focusMins);
    setLocalBreak(breakMins);
    setIsOpen((v) => !v);
  };

  // 통계 탭 열릴 때 투두 목록 fetch
  useEffect(() => {
    if (!isOpen || activeTab !== "stats") return;
    setLoadingTodos(true);
    fetch("http://localhost:3001/api/todos")
      .then((r) => r.json())
      .then((data: TodoStat[]) => {
        setTodoStats(
          data
            .filter((t) => t.focused_seconds > 0)
            .sort((a, b) => b.focused_seconds - a.focused_seconds)
        );
      })
      .catch(console.error)
      .finally(() => setLoadingTodos(false));
  }, [isOpen, activeTab]);

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  const handleApply = () => {
    onUpdateTimerSettings(localFocus, localBreak);
    setIsOpen(false);
  };

  const handleReset = () => {
    resetTotalStudyTime();
    setShowConfirm(false);
  };

  // 주간 차트 데이터
  const weekData = getLast7Days(studyHistory);
  const maxSeconds = Math.max(...weekData.map((d) => d.seconds), 1);

  return (
    <>
      <div className="absolute top-6 left-6 z-40">
        {/* Menu Toggle Button */}
        <button
          onClick={handleOpenMenu}
          className="p-3 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-full text-white/90 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        >
          {isOpen ? <X size={20} /> : <MenuIcon size={20} />}
        </button>

        {/* Menu Dropdown Panel */}
        <div
          className={`absolute top-14 left-0 w-72 bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 origin-top-left ${
            isOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
          }`}
        >
          {/* 탭 */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                activeTab === "stats"
                  ? "text-white bg-white/10"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <BarChart2 size={13} />
              통계
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                activeTab === "settings"
                  ? "text-white bg-white/10"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <Settings size={13} />
              타이머 설정
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">

            {/* ── 통계 탭 ── */}
            {activeTab === "stats" && (
              <>
                {/* 오늘 공부시간 */}
                <div>
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">
                    오늘
                  </p>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-bold text-white tabular-nums">
                      {formatTime(todayStudyTime)}
                    </span>
                  </div>

                  {/* 오늘 투두별 집중시간 */}
                  {loadingTodos ? (
                    <p className="text-white/30 text-xs mt-3">불러오는 중...</p>
                  ) : todoStats.length > 0 ? (
                    <div className="flex flex-col gap-1.5 mt-3">
                      {todoStats.map((t) => (
                        <div key={t.id} className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white/70 text-xs truncate">{t.content}</p>
                          </div>
                          <span className="text-white/50 text-xs tabular-nums shrink-0">
                            {formatTime(t.focused_seconds)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/25 text-xs mt-2">아직 집중한 투두가 없어요</p>
                  )}
                </div>

                {/* 구분선 */}
                <div className="border-t border-white/10" />

                {/* 주간 바 차트 */}
                <div>
                  <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-4">
                    이번 주
                  </p>
                  <div className="flex items-end justify-between gap-1 h-24">
                    {weekData.map((day) => {
                      const heightPct = (day.seconds / maxSeconds) * 100;
                      return (
                        <div key={day.key} className="flex flex-col items-center gap-1.5 flex-1">
                          <div className="w-full flex flex-col justify-end h-20 relative group">
                            {/* 툴팁 */}
                            {day.seconds > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-black/80 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {formatTime(day.seconds)}
                              </div>
                            )}
                            {/* 바 */}
                            <div
                              className={`w-full rounded-t-md transition-all duration-500 ${
                                day.isToday
                                  ? "bg-[#ff6b6b]/80"
                                  : "bg-white/20"
                              }`}
                              style={{ height: `${Math.max(heightPct, day.seconds > 0 ? 4 : 0)}%` }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-medium ${
                              day.isToday ? "text-[#ff6b6b]" : "text-white/40"
                            }`}
                          >
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 구분선 */}
                <div className="border-t border-white/10" />

                {/* 전체 누적 공부시간 */}
                <div>
                  <div className="flex items-center gap-2 text-white/40 text-xs font-medium uppercase tracking-wider mb-2">
                    <Clock8 size={12} />
                    전체 누적 공부시간
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-white">
                      {formatTime(totalStudyTime)}
                    </span>
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 size={12} />
                      리셋
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── 타이머 설정 탭 ── */}
            {activeTab === "settings" && (
              <>
                {/* 집중 시간 */}
                <div>
                  <div className="flex items-center gap-2 text-white/60 text-xs font-medium mb-2.5">
                    <Timer size={12} className="text-[#ff6b6b]" />
                    집중 시간
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setLocalFocus((v) => clamp(v - 5, 1, 120))}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-base font-bold flex items-center justify-center transition-colors active:scale-90"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold text-white tabular-nums">{localFocus}</span>
                      <span className="text-white/40 text-xs ml-1">분</span>
                    </div>
                    <button
                      onClick={() => setLocalFocus((v) => clamp(v + 5, 1, 120))}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-base font-bold flex items-center justify-center transition-colors active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 휴식 시간 */}
                <div>
                  <div className="flex items-center gap-2 text-white/60 text-xs font-medium mb-2.5">
                    <Timer size={12} className="text-[#4ecdc4]" />
                    휴식 시간
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setLocalBreak((v) => clamp(v - 5, 1, 60))}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-base font-bold flex items-center justify-center transition-colors active:scale-90"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold text-white tabular-nums">{localBreak}</span>
                      <span className="text-white/40 text-xs ml-1">분</span>
                    </div>
                    <button
                      onClick={() => setLocalBreak((v) => clamp(v + 5, 1, 60))}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-base font-bold flex items-center justify-center transition-colors active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleApply}
                  className="w-full py-2.5 px-4 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-sm font-medium transition-colors"
                >
                  적용
                </button>
                <p className="text-white/25 text-xs text-center -mt-2">적용 시 타이머가 리셋돼요</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 리셋 확인 모달 */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
          showConfirm ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        />
        <div
          className={`relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#1e1547]/90 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 ${
            showConfirm ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="rounded-full bg-red-500/20 p-3 shrink-0">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">총 공부 시간 초기화</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                지금까지 누적된 공부 시간을 정말 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              초기화 확인
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
