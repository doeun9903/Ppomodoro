interface Props {
  progress: number;
  mode: "focus" | "break";
}
// 프로그래스 표시 랜더링 역할
// 진행률 시각화

export default function ProgressCircle({ progress, mode }: Props) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const color = mode === "focus" ? "#ff6b6b" : "#4ecdc4";

  return (
    <svg width="200" height="200">
      <circle
        cx="100"
        cy="100"
        r={radius}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="12"
        fill="none"
      />

      <circle
        cx="100"
        cy="100"
        r={radius}
        stroke={color}
        strokeWidth="12"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: "stroke-dashoffset 1s linear, stroke 0.3s ease",
        }}
      />
    </svg>
  );
}
