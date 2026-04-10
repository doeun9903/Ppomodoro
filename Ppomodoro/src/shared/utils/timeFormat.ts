export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");

  const s = (seconds % 60).toString().padStart(2, "0");

  return `${m}:${s}`;
}

// 공통 유틸 함수
// 초를 MM:SS로 변환해준다.
// 따로 만든이유? 타이머 뿐만 아니라 다른 곳에서도 쓸수 있게
