import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Photo } from "@/data/photos";

interface PhotoModalProps {
  photo: Photo | null;
  onClose: () => void;
  onLike: (id: number) => void;
  onDelete?: (id: number) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function PhotoModal({ photo, onClose, onLike, onDelete, onPrev, onNext, hasPrev, hasNext }: PhotoModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  useEffect(() => {
    document.body.style.overflow = photo ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [photo]);

  useEffect(() => { setConfirmDelete(false); }, [photo?.id]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}
      style={{ background: "rgba(0,0,100,0.92)" }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)"
        }}
      />

      <div
        className="relative z-10 w-full sm:max-w-4xl mx-2 sm:mx-4 animate-scale-in overflow-hidden"
        style={{
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 0 60px rgba(0,0,200,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
          maxHeight: "95dvh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Titlebar WinXP */}
        <div className="win-titlebar flex-shrink-0">
          <div className="w-3 h-3 rounded-sm bg-white/30 flex-shrink-0" />
          <span className="flex-1 text-[11px] truncate" style={{ fontFamily: "Tahoma, sans-serif" }}>
            {photo.title} — творческий фестиваль 2026
          </span>
          <div className="flex gap-0.5 ml-2">
            <div className="win-btn win-btn-min">─</div>
            <div className="win-btn win-btn-max">□</div>
            <div className="win-btn win-btn-close" onClick={onClose}>✕</div>
          </div>
        </div>

        {/* Тело */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0" style={{ background: "#1a00cc" }}>
          {/* Фото */}
          <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden"
            style={{ background: "#000010" }}
          >
            <img
              src={photo.src}
              alt={photo.title}
              className="w-full h-full object-contain"
              style={{ maxHeight: "calc(95dvh - 130px)" }}
            />

            {hasPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-white active:scale-90"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                <Icon name="ChevronLeft" size={18} />
              </button>
            )}
            {hasNext && (
              <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-white active:scale-90"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                <Icon name="ChevronRight" size={18} />
              </button>
            )}


          </div>

          {/* Панель */}
          <div className="sm:w-60 flex flex-col flex-shrink-0"
            style={{ background: "rgba(0,0,80,0.6)", borderLeft: "1px solid rgba(255,255,255,0.15)" }}
          >
            <div className="p-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">{photo.date}</p>
              <h2 className="font-mono font-bold text-white text-lg leading-tight uppercase">
                {photo.title}
              </h2>
              <p className="font-mono text-xs text-white/50 mt-1">{photo.author}</p>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {onDelete && (
                confirmDelete ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onDelete(photo.id); onClose(); }}
                      className="flex-1 font-mono text-xs uppercase py-2 flex items-center justify-center gap-1.5 active:scale-[0.97]"
                      style={{ border: "1px solid #ff4444", background: "rgba(255,0,0,0.15)", color: "#ff6666" }}
                    >
                      <Icon name="Trash2" size={11} /> УДАЛИТЬ
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-2 font-mono text-xs uppercase text-white/50 active:scale-[0.97]"
                      style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                    >
                      НЕТ
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full p-2.5 flex items-center justify-center gap-2 font-mono text-xs uppercase text-white/30 active:scale-[0.97] tracking-wider"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Icon name="Trash2" size={11} /> УДАЛИТЬ ФОТО
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}