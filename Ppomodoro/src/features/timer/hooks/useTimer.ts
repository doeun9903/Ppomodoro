import { useEffect, useRef, useState } from "react";
import type { Mode } from "../types";
// 타이머 기능 구현하는 메인 코드
//useEffect -> 타이머 루프

// 상수 정의 (테스트를 위해 임시로 5초, 3초로 변경)
const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 10 * 60;

export function useTimer() {
  // 현재의 상태가 집중 시간인지 휴식 시간인지
  const [mode, setMode] = useState<Mode>("focus");
  // 남은 시간
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  // 타이머의 작동 여부
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<number | null>(null);

  // 총 공부 시간 (초 단위)
  const [totalStudyTime, setTotalStudyTime] = useState<number>(() => {
    const saved = localStorage.getItem("total-study-time");
    return saved ? parseInt(saved, 10) : 0;
  });

  // totalStudyTime이 바뀔 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem("total-study-time", totalStudyTime.toString());
  }, [totalStudyTime]);

  // 모드에 따라 전체 시간 계산
  const totalTime = mode === "focus" ? FOCUS_TIME : BREAK_TIME;

  // 수동 모드 전환 함수
  const switchMode = () => {
    const next = mode === "focus" ? "break" : "focus";

    setIsRunning(false); // 전환 시 멈춤
    setMode(next);
    // 모드가 바뀌면 남은 시간도 바뀌어야 한다.
    setTimeLeft(next === "focus" ? FOCUS_TIME : BREAK_TIME);
  };

  //타이머 루프 (핵심)
  useEffect(() => {
    if (!isRunning) return; //start 버튼 누를 때만 생성

    // 타이머 시작
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));

      // 집중 모드인 경우 총 공부 시간 1초 증가
      if (mode === "focus") {
        setTotalStudyTime((prev) => prev + 1);
      }
    }, 1000);

    //메모리 누수를 방지하는 역할
    //중복 interval
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  // 시간이 0이 되면 자동으로 모드 전환 및 타이머 계속 진행
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      const endBell = new Audio("/audio/end_bell.wav");
      endBell.play().catch(console.error);

      const nextMode = mode === "focus" ? "break" : "focus";
      setMode(nextMode);
      setTimeLeft(nextMode === "focus" ? FOCUS_TIME : BREAK_TIME);
    }
  }, [timeLeft, isRunning, mode]);

  //진행률 (모드에 상관없이 물이 차오르는 효과로 통일)
  const progress = (1 - timeLeft / totalTime) * 100;

  //컨트롤

  const start = () => {
    const startBell = new Audio("/audio/start_bell.wav");
    startBell.play().catch(console.error);
    setIsRunning(true);
  };

  const pause = () => setIsRunning(false);

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? FOCUS_TIME : BREAK_TIME);
  };

  const resetTotalStudyTime = () => {
    setTotalStudyTime(0);
  };

  return {
    timeLeft,
    mode,
    isRunning,
    progress,
    totalStudyTime,
    start,
    pause,
    reset,
    switchMode,
    resetTotalStudyTime,
  };
}
