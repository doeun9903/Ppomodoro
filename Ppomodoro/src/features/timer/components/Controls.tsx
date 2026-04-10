interface Props {
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  switchMode: () => void;
}
// 사용자 입력 UI
// 버튼 랜더링, 클릭 이벤트 전달
// 입력 컨트롤 역할

export default function Controls({
  isRunning,
  start,
  pause,
  reset,
  switchMode,
}: Props) {
  return (
    <div className="flex gap-4 justify-center mb-8">
      {isRunning ? (
        <button
          onClick={pause}
          className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0"
        >
          일시정지
        </button>
      ) : (
        <button
          onClick={start}
          className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white text-[#1a1a2e] border border-white hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0"
        >
          시작
        </button>
      )}

      <button
        onClick={reset}
        className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0"
      >
        초기화
      </button>

      <button
        onClick={switchMode}
        className="px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0"
      >
        모드 변환
      </button>
    </div>
  );
}
