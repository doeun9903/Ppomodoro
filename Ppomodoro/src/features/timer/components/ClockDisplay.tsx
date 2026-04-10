import { useEffect, useState } from "react";

export default function ClockDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const syncTick = () => setNow(new Date());

    // 다음 분 정각까지 기다린 후 1분 인터벌 시작
    const delay = (60 - new Date().getSeconds()) * 1000;
    let intervalId: number;

    const timeoutId = setTimeout(() => {
      syncTick();
      intervalId = setInterval(syncTick, 60000);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  const timeString = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  const dateString = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(now);

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl px-7 py-3 rounded-2xl flex flex-col items-center z-50">
      <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
        {timeString}
      </div>
      <div className="text-xs text-white/50 mt-0.5 tracking-wide">
        {dateString}
      </div>
    </div>
  );
}
