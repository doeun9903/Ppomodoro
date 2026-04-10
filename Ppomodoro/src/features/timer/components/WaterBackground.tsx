type Props = {
  progress: number;
  mode: "focus" | "break";
};

export default function WaterBackground({ progress, mode }: Props) {
  const isFocus = mode === "focus";
  const waterColor = isFocus ? "bg-[#ff6b6b]" : "bg-[#4ecdc4]";

  // Water level logic: fills from 0 to 100 in Focus, decreases from 100 to 0 in Break.
  const waterLevel = isFocus ? progress : 100 - progress;

  return (
    <div
      className="fixed bottom-0 left-0 w-full transition-[height] duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] z-0 pointer-events-none"
      style={{ height: `${waterLevel}vh` }}
    >
      {/* Background Liquid Mass */}
      <div
        className={`absolute top-0 left-1/2 w-[2500px] h-[2500px] opacity-20 ${waterColor}`}
        style={{
          borderRadius: "43%",
          animation: "waveSpin 12s linear infinite",
        }}
      />
      <div
        className={`absolute top-0 left-1/2 w-[2500px] h-[2500px] opacity-50 ${waterColor}`}
        style={{
          borderRadius: "40%",
          animation: "waveSpin 18s linear infinite reverse",
        }}
      />
    </div>
  );
}
