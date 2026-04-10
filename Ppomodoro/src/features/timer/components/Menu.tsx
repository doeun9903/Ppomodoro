import { useState } from "react";
import { Menu as MenuIcon, X, Clock8, Trash2, AlertCircle, Settings, Timer } from "lucide-react";

interface Props {
  totalStudyTime: number; // in seconds
  resetTotalStudyTime: () => void;
  focusMins: number;
  breakMins: number;
  onUpdateTimerSettings: (focusMins: number, breakMins: number) => void;
}

export default function Menu({ totalStudyTime, resetTotalStudyTime, focusMins, breakMins, onUpdateTimerSettings }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"study" | "settings">("study");

  // 설정 로컬 상태 (적용 전까지 임시 보관)
  const [localFocus, setLocalFocus] = useState(focusMins);
  const [localBreak, setLocalBreak] = useState(breakMins);

  const handleOpenMenu = () => {
    setLocalFocus(focusMins);
    setLocalBreak(breakMins);
    setIsOpen(!isOpen);
  };

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  const handleApply = () => {
    onUpdateTimerSettings(localFocus, localBreak);
    setIsOpen(false);
  };

  // Format total seconds into HH:MM:SS
  const formatTotalTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return `${h}시간 ${m}분 ${s}초`;
    }
    if (m > 0) {
      return `${m}분 ${s}초`;
    }
    return `${s}초`;
  };

  const handleReset = () => {
    resetTotalStudyTime();
    setShowConfirm(false);
  };

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
          className={`absolute top-14 left-0 w-68 bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 origin-top-left ${
            isOpen
              ? "opacity-100 scale-100 visible"
              : "opacity-0 scale-95 invisible"
          }`}
        >
          {/* 탭 */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("study")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                activeTab === "study"
                  ? "text-white bg-white/10"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <Clock8 size={13} />
              공부 시간
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

          <div className="p-5">
            {/* 총 공부 시간 탭 */}
            {activeTab === "study" && (
              <div className="flex flex-col gap-4">
                <div className="text-2xl font-bold tracking-tight text-white">
                  {formatTotalTime(totalStudyTime)}
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full py-2.5 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/20 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>시간 리셋</span>
                </button>
              </div>
            )}

            {/* 타이머 설정 탭 */}
            {activeTab === "settings" && (
              <div className="flex flex-col gap-5">
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal Mimicking shadcn/ui */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
          showConfirm
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        />
        <div
          className={`relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#1e1547]/90 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 ${
            showConfirm
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-95 opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="rounded-full bg-red-500/20 p-3 shrink-0">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                총 공부 시간 초기화
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                지금까지 누적된 공부 시간을 정말 초기화하시겠습니까? 이 작업은
                되돌릴 수 없습니다.
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
