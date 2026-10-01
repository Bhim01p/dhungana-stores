import { useEffect, useState } from "react";
import { getCategoryIcon } from "../utils/categoryIcons";

interface Props {
  src?: string | null;
  name: string;
  categoryName?: string;
  categorySlug?: string;
  className?: string;
}

export default function ProductImage({ src, name, categoryName = "Groceries", categorySlug = "", className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (src && !failed) {
    return <img src={src} alt={name} loading="lazy" className={`h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03] sm:p-4 ${className}`} onError={() => setFailed(true)} />;
  }

  return (
    <div style={{ background: "radial-gradient(ellipse at 50% 32%, #fff 0%, #fbf7f0 55%, #f2ece3 100%)" }} className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-stone-500 ${className}`} role="img" aria-label={`${name}, product photo coming soon`}>
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-white/80" />
      <div className="absolute -bottom-16 -left-14 h-40 w-40 rounded-full border border-white/80" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.65rem] border border-white/90 bg-white/80 text-4xl shadow-[0_8px_30px_rgba(91,54,32,0.08)] sm:h-24 sm:w-24 sm:text-5xl">
        {getCategoryIcon(categorySlug, categoryName)}
      </div>
      <span className="relative mt-4 text-[9px] font-bold uppercase tracking-[0.16em] text-stone-400 sm:text-[10px]">Photo coming soon</span>
    </div>
  );
}
