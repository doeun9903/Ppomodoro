interface Props {
  label: string;
  children: React.ReactNode;
}

export default function Tooltip({ label, children }: Props) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-black/80 backdrop-blur-sm text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 border border-white/10">
        {label}
      </div>
    </div>
  );
}
