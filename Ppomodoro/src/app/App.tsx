import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";
import {
  TimerDisplay,
  ProgressCircle,
  Controls,
  BgmPlayer,
  WaterBackground,
  ClockDisplay,
  Menu,
  TodoPanel,
  useTimer,
} from "../features/timer";
import type { BgmPlayerHandle } from "../features/timer/components/BgmPlayer";
import ShortcutModal from "../shared/components/ShortcutModal";

interface SelectedTodo {
  id: string;
  content: string;
}

// app은 조립만 해주는 역할!!
export default function App() {
  const timer = useTimer();

  const bgmRef = useRef<BgmPlayerHandle>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [selectedTodo, setSelectedTodo] = useState<SelectedTodo | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [syncedTodo, setSyncedTodo] = useState<{ id: string; focused_seconds: number } | null>(null);
  const accRef = useRef(0); // 동기화용 누적 초 (렌더링 불필요)
  const prevRef = useRef({
    isRunning: false,
    mode: "focus" as "focus" | "break",
    todoId: null as string | null,
  });

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // input / textarea 입력 중엔 무시
      const tag = (document.activeElement as HTMLElement)?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          timer.isRunning ? timer.pause() : timer.start();
          break;
        case "KeyR":
          timer.reset();
          break;
        case "KeyZ":
          timer.switchMode();
          break;
        case "KeyX":
          bgmRef.current?.toggle();
          break;
        case "Slash":
          if (e.shiftKey) setShowShortcuts((v) => !v); // ? = Shift + /
          break;
        case "Escape":
          setShowShortcuts(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [timer]);

  // 집중 모드 + 투두 선택 중일 때 1초마다 누적
  useEffect(() => {
    if (!timer.isRunning || timer.mode !== "focus" || !selectedTodo) return;
    const interval = setInterval(() => {
      accRef.current += 1;
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.mode, selectedTodo]);

  // 일시정지 / 모드 전환 / 투두 변경 시 → DB에 집중 시간 동기화
  useEffect(() => {
    const prev = prevRef.current;
    const wasFocusing = prev.isRunning && prev.mode === "focus" && prev.todoId;
    const ended =
      !timer.isRunning ||
      timer.mode !== "focus" ||
      selectedTodo?.id !== prev.todoId;

    if (wasFocusing && ended && accRef.current > 0) {
      const todoId = prev.todoId!;
      const secs = accRef.current;
      accRef.current = 0;
      setSessionSeconds(0);

      fetch(`http://localhost:3001/api/todos/${todoId}/focus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds: secs }),
      })
        .then((res) => res.json())
        .then((updated) => setSyncedTodo({ id: updated.id, focused_seconds: updated.focused_seconds }))
        .catch(console.error);
    }

    prevRef.current = {
      isRunning: timer.isRunning,
      mode: timer.mode,
      todoId: selectedTodo?.id ?? null,
    };
  }, [timer.isRunning, timer.mode, selectedTodo]);

  return (
    <>
      <WaterBackground progress={timer.progress} mode={timer.mode} />
      <ClockDisplay />
      <Menu
        totalStudyTime={timer.totalStudyTime}
        resetTotalStudyTime={timer.resetTotalStudyTime}
        focusMins={timer.focusMins}
        breakMins={timer.breakMins}
        onUpdateTimerSettings={timer.updateTimerSettings}
      />
      <TodoPanel
        selectedTodoId={selectedTodo?.id ?? null}
        onSelect={setSelectedTodo}
        sessionSeconds={sessionSeconds}
        syncedTodo={syncedTodo}
      />
      <div className="relative z-10 flex flex-col items-center gap-5 mt-20 p-8 w-[90%] max-w-[480px] text-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] before:absolute before:-top-[50px] before:-right-[50px] before:w-[150px] before:h-[150px] before:bg-[#ff6b6b] before:blur-[80px] before:opacity-30 before:-z-10 after:absolute after:-bottom-[50px] after:-left-[50px] after:w-[150px] after:h-[150px] after:bg-[#4ecdc4] after:blur-[80px] after:opacity-30 after:-z-10">
        <ProgressCircle progress={timer.progress} mode={timer.mode} />
        <TimerDisplay timeLeft={timer.timeLeft} mode={timer.mode} />
        <Controls
          isRunning={timer.isRunning}
          start={timer.start}
          pause={timer.pause}
          reset={timer.reset}
          switchMode={timer.switchMode}
        />

        {/* 현재 작업 중인 투두 표시 */}
        {selectedTodo && (
          <div className="flex items-center gap-1.5 text-white/50 text-xs -mt-2 pb-1 max-w-full">
            <Timer size={11} className="shrink-0 text-[#ff6b6b]" />
            <span className="truncate">{selectedTodo.content}</span>
          </div>
        )}
      </div>
      <BgmPlayer ref={bgmRef} />
      <ShortcutModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}
