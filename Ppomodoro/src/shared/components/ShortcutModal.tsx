import { X, Keyboard } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: "타이머",
    items: [
      { key: "Space", desc: "시작 / 일시정지" },
      { key: "R", desc: "타이머 초기화" },
      { key: "Z", desc: "집중 ↔ 휴식 모드 전환" },
    ],
  },
  {
    category: "음악",
    items: [
      { key: "X", desc: "BGM 재생 / 정지" },
    ],
  },
  {
    category: "기타",
    items: [
      { key: "?", desc: "단축키 도움말" },
    ],
  },
];

export default function ShortcutModal({ isOpen, onClose }: Props) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      }`}
    >
      {/* 배경 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div
        className={`relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#1e1547]/90 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Keyboard size={18} className="text-white/60" />
            <span>키보드 단축키</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 단축키 목록 */}
        <div className="flex flex-col gap-5">
          {SHORTCUTS.map(({ category, items }) => (
            <div key={category}>
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">
                {category}
              </p>
              <div className="flex flex-col gap-2">
                {items.map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">{desc}</span>
                    <kbd className="px-2.5 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xs font-mono">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-white/25 text-xs text-center mt-5">
          입력창 포커스 중엔 단축키가 비활성화돼요
        </p>
      </div>
    </div>
  );
}
