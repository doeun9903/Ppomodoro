import { useEffect, useState } from "react";
import {
  Menu as MenuIcon, X, Trash2, AlertCircle,
  Settings, Timer, BarChart2, CalendarDays, CheckCircle2, Circle,
} from "lucide-react";

interface TodoRecord {
  id: string;
  content: string;
  completed_at: string | null;
  focused_seconds: number;
  created_at: string;
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

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "오늘";
  if (dateStr === yesterday) return "어제";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_KR[d.getDay()]})`;
}

function getLast7Days(history: Record<string, number>) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    return {
      key,
      label: i === 6 ? "오늘" : DAY_KR[d.getDay()],
      seconds: history[key] ?? 0,
      isToday: i === 6,
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
  const [activeTab, setActiveTab] = useState<"stats" | "history" | "settings">("stats");

  // 타이머 설정 로컬 상태
  const [localFocus, setLocalFocus] = useState(focusMins);
  const [localBreak, setLocalBreak] = useState(breakMins);

  // 투두 히스토리
  const [todoHistory, setTodoHistory] = useState<Record<string, TodoRecord[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleOpenMenu = () => {
    setLocalFocus(focusMins);
    setLocalBreak(breakMins);
    setIsOpen((v) => !v);
  };

  // 히스토리 탭 열릴 때 fetch
  useEffect(() => {
    if (!isOpen || activeTab !== "history") return;
    setLoadingHistory(true);
    const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
    fetch(`${API_BASE}/api/todos/history`)
      .then((r) => r.json())
      .then(setTodoHistory)
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
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

  // 히스토리 날짜 목록 (최신순)
  const historyDates = Object.keys(todoHistory).sort((a, b) => b.localeCompare(a));

  const TABS = [
    { key: "stats", label: "통계", icon: <BarChart2 size={13} /> },
    { key: "history", label: "투두 기록", icon: <CalendarDays size={13} /> },
    { key: "settings", label: "설정", icon: <Settings size={13} /> },
  ] as const;

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

        {/* Dropdown Panel */}
        <div
          className={`absolute top-14 left-0 w-72 bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 origin-top-left ${
            isOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
          }`}
        >
          {/* 탭 */}
          <div className="flex border-b border-white/10">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-white bg-white/10"
                    : "text-white/35 hover:text-white/65"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">

            {/* ── 통계 탭 ── */}
            {activeTab === "stats" && (
              <>
                {/* 오늘 */}
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-2">오늘</p>
                  <p className="text-3xl font-bold text-white tabular-nums">
                    {formatTime(todayStudyTime)}
                  </p>
                </div>

                <div className="border-t border-white/10" />

                {/* 주간 바 차트 */}
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-4">이번 주</p>
                  <div className="flex items-end justify-between gap-1 h-28">
                    {weekData.map((day) => {
                      const heightPct = (day.seconds / maxSeconds) * 100;
                      return (
                        <div key={day.key} className="flex flex-col items-center gap-1.5 flex-1">
                          <div className="w-full flex flex-col justify-end h-20 relative group">
                            {day.seconds > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-black/80 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {formatTime(day.seconds)}
                              </div>
                            )}
                            <div
                              className={`w-full rounded-t-md transition-all duration-500 ${
                                day.isToday ? "bg-[#ff6b6b]/80" : "bg-white/20"
                              }`}
                              style={{ height: `${Math.max(heightPct, day.seconds > 0 ? 5 : 0)}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-medium ${day.isToday ? "text-[#ff6b6b]" : "text-white/40"}`}>
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* 전체 누적 */}
                <div>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-2">
                    전체 누적
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-white">{formatTime(totalStudyTime)}</span>
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

            {/* ── 투두 기록 탭 ── */}
            {activeTab === "history" && (
              <>
                {loadingHistory ? (
                  <p className="text-white/30 text-xs text-center py-6">불러오는 중...</p>
                ) : historyDates.length === 0 ? (
                  <p className="text-white/30 text-xs text-center py-6">아직 기록이 없어요</p>
                ) : (
                  historyDates.map((date) => {
                    const dayTodos = todoHistory[date];
                    const doneCount = dayTodos.filter((t) => t.completed_at).length;
                    return (
                      <div key={date}>
                        {/* 날짜 헤더 */}
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white/70 text-xs font-semibold">
                            {formatDateLabel(date)}
                          </p>
                          <span className="text-white/30 text-[10px]">
                            {doneCount}/{dayTodos.length} 완료
                          </span>
                        </div>

                        {/* 해당 날짜 투두 목록 */}
                        <div className="flex flex-col gap-1 mb-4">
                          {dayTodos.map((todo) => {
                            const timeLabel = todo.focused_seconds > 0
                              ? formatTime(todo.focused_seconds)
                              : null;
                            return (
                              <div key={todo.id} className="flex items-start gap-2 py-1">
                                {todo.completed_at ? (
                                  <CheckCircle2 size={14} className="text-[#4ecdc4] shrink-0 mt-0.5" />
                                ) : (
                                  <Circle size={14} className="text-white/25 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs leading-snug ${
                                    todo.completed_at ? "text-white/35 line-through" : "text-white/70"
                                  }`}>
                                    {todo.content}
                                  </p>
                                  {timeLabel && (
                                    <p className="text-[10px] text-white/25 mt-0.5 flex items-center gap-1">
                                      <Timer size={8} />
                                      {timeLabel}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="border-t border-white/5" />
                      </div>
                    );
                  })
                )}
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
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
