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

//app은 조립만 해주는 역할!!
export default function App() {
  const timer = useTimer(); //hook 호출, 하위 컴포넌트에 porops 전달

  return (
    <>
      <WaterBackground progress={timer.progress} mode={timer.mode} />
      <ClockDisplay />
      <Menu
        totalStudyTime={timer.totalStudyTime}
        resetTotalStudyTime={timer.resetTotalStudyTime}
      />
      <TodoPanel />
      <div className="relative z-10 flex flex-col items-center gap-5 mt-20 p-8 w-[90%] max-w-[480px] text-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] before:absolute before:-top-[50px] before:-right-[50px] before:w-[150px] before:h-[150px] before:bg-[#ff6b6b] before:blur-[80px] before:opacity-30 before:-z-10 after:absolute after:-bottom-[50px] after:-left-[50px] after:w-[150px] after:h-[150px] after:bg-[#4ecdc4] after:blur-[80px] after:opacity-30 after:-z-10">
        <ProgressCircle progress={timer.progress} mode={timer.mode} />

        <TimerDisplay timeLeft={timer.timeLeft} mode={timer.mode} />

        <Controls
          isRunning={timer.isRunning}
          start={timer.start}
          pause={timer.pause}
          reset={timer.reset}
          switchMode={timer.switchMode} // 추가
        />
      </div>
      <BgmPlayer />
    </>
  );
}
