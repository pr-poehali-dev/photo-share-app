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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90" />

      <div
        className="relative z-10 w-full h-full sm:h-auto sm:max-w-5xl flex flex-col sm:flex-row animate-scale-in sm:border-2 sm:border-foreground overflow-hidden"
        style={{ background: "hsl(45 15% 94%)", maxHeight: "100dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Фото — занимает всё доступное место */}
        <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden">
          <img
            src={photo.src}
            alt={photo.title}
            className="w-full h-full object-contain grayscale-[10%]"
            style={{ maxHeight: "calc(100dvh - 140px)" }}
          />

          {/* Кнопка закрыть поверх фото на мобильном */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:hidden w-9 h-9 bg-black/60 border border-white/30 flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <Icon name="X" size={16} />
          </button>

          {/* Навигация */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 border border-white/30 flex items-center justify-center text-white hover:bg-black/70 transition-colors active:scale-90"
            >
              <Icon name="ChevronLeft" size={18} />
            </button>
          )}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 border border-white/30 flex items-center justify-center text-white hover:bg-black/70 transition-colors active:scale-90"
            >
              <Icon name="ChevronRight" size={18} />
            </button>
          )}

          <div className="absolute inset-0 pointer-events-none photo-noise opacity-30" />
        </div>

        {/* Панель инфо — снизу на мобильном, справа на десктопе */}
        <div className="sm:w-64 md:w-72 flex flex-col flex-shrink-0 border-t-2 sm:border-t-0 sm:border-l-2 border-foreground/30" style={{ background: "hsl(45 15% 94%)" }}>
          <div className="flex justify-between items-start p-4 border-b-2 border-foreground/20 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">{photo.date}</p>
              <h2 className="font-display text-xl sm:text-2xl text-foreground uppercase leading-tight">
                {photo.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="hidden sm:flex w-8 h-8 border-2 border-foreground items-center justify-center font-mono text-foreground hover:bg-foreground hover:text-background transition-colors active:scale-90 flex-shrink-0 ml-3 mt-1"
            >
              <Icon name="X" size={13} />
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            <div className="border border-foreground/25 p-3 flex items-center gap-3">
              <Icon name="Eye" size={14} className="text-muted-foreground flex-shrink-0" />
              <div>
                <p className="font-mono font-bold text-foreground leading-none">{photo.views.toLocaleString()}</p>
                <p className="font-mono text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">просмотров</p>
              </div>
            </div>

            <button
              onClick={() => onLike(photo.id)}
              onTouchEnd={(e) => { e.preventDefault(); onLike(photo.id); }}
              className={`w-full border p-3 flex items-center gap-3 transition-all active:scale-[0.97] touch-manipulation select-none ${
                photo.liked
                  ? "border-electric bg-electric/10 text-electric"
                  : "border-foreground/25 text-foreground hover:border-foreground/60"
              }`}
              style={{ borderColor: photo.liked ? "var(--electric)" : undefined, color: photo.liked ? "var(--electric)" : undefined }}
            >
              <Icon name="Heart" size={14} className={`flex-shrink-0 ${photo.liked ? "fill-current" : ""}`} />
              <div className="text-left">
                <p className="font-mono font-bold leading-none">{photo.likes}</p>
                <p className="font-mono text-xs mt-0.5 uppercase tracking-wider opacity-60">
                  {photo.liked ? "вам нравится" : "нравится"}
                </p>
              </div>
            </button>

            {onDelete && (
              confirmDelete ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { onDelete(photo.id); onClose(); }}
                    className="flex-1 border-2 border-destructive bg-destructive/10 text-destructive font-mono text-xs uppercase py-2.5 flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all hover:bg-destructive hover:text-white"
                  >
                    <Icon name="Trash2" size={12} /> УДАЛИТЬ
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2.5 border-2 border-foreground/30 font-mono text-xs uppercase text-muted-foreground hover:border-foreground/60 active:scale-[0.97] transition-all"
                  >
                    НЕТ
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full border border-foreground/20 p-3 flex items-center justify-center gap-2 font-mono text-xs uppercase text-muted-foreground hover:border-foreground/50 hover:text-foreground active:scale-[0.97] transition-all tracking-wider"
                >
                  <Icon name="Trash2" size={12} /> УДАЛИТЬ ФОТО
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
