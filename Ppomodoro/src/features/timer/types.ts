export type Mode = "focus" | "break";
// 타임 중앙 관리

export interface TimerState {
  timeLeft: number;
  totalTime: number;
  mode: Mode;
  isRunning: boolean;
}
