import { formatTime } from "../../../shared/utils/timeFormat";
// 시간 텍스트 표시
// 시간과 텍스트 출력만 하는 역할

interface Props {
  timeLeft: number;
  mode: "focus" | "break";
}

export default function TimerDisplay({ timeLeft, mode }: Props) {
  return (
    <div className="text-center">
      <div
        className={`inline-block px-4 py-2 rounded-2xl text-sm font-semibold mb-4 uppercase tracking-wider transition-all duration-300 border ${
          mode === "focus"
            ? "bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30"
            : "bg-[#4ecdc4]/20 text-[#4ecdc4] border-[#4ecdc4]/30"
        }`}
      >
        {mode === "focus" ? "FOCUS" : "BREAK"}
      </div>
      <div className="text-7xl font-extrabold my-4 tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)] tracking-tight">
        {formatTime(timeLeft)}
      </div>
    </div>
  );
}
