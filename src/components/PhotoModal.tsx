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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      {/* Оверлей — тёмный */}
      <div className="absolute inset-0 bg-black/85" />

      <div
        className="relative z-10 w-full sm:max-w-5xl sm:mx-4 flex flex-col sm:flex-row animate-scale-in max-h-[95vh] sm:max-h-[88vh] border-2 border-foreground"
        style={{ background: "hsl(45 15% 94%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle mobile */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden">
          <div className="w-10 h-1 bg-foreground/30" />
        </div>

        {/* Фото */}
        <div className="relative flex-shrink-0 sm:flex-1 border-b-2 sm:border-b-0 sm:border-r-2 border-foreground/30">
          <img
            src={photo.src}
            alt={photo.title}
            className="w-full object-cover grayscale-[10%]"
            style={{ height: "min(55vw, 280px)", minHeight: "200px" }}
          />

          {/* Навигация */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background border-2 border-foreground flex items-center justify-center font-mono text-foreground hover:bg-foreground hover:text-background transition-colors active:scale-90"
            >
              <Icon name="ChevronLeft" size={16} />
            </button>
          )}
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-background border-2 border-foreground flex items-center justify-center font-mono text-foreground hover:bg-foreground hover:text-background transition-colors active:scale-90"
            >
              <Icon name="ChevronRight" size={16} />
            </button>
          )}

          {/* Шум */}
          <div className="absolute inset-0 pointer-events-none photo-noise" />
        </div>

        {/* Панель инфо */}
        <div className="sm:w-64 md:w-72 flex flex-col" style={{ background: "hsl(45 15% 94%)" }}>

          {/* Заголовок панели */}
          <div className="flex justify-between items-start p-4 border-b-2 border-foreground/20 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">{photo.date}</p>
              <h2 className="font-display text-2xl sm:text-3xl text-foreground uppercase leading-tight">
                {photo.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 border-2 border-foreground flex items-center justify-center font-mono text-foreground hover:bg-foreground hover:text-background transition-colors active:scale-90 flex-shrink-0 ml-3 mt-1"
            >
              <Icon name="X" size={13} />
            </button>
          </div>

          {/* Статистика */}
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">

            {/* Просмотры */}
            <div className="border border-foreground/25 p-3 flex items-center gap-3">
              <Icon name="Eye" size={14} className="text-muted-foreground flex-shrink-0" />
              <div>
                <p className="font-mono font-bold text-foreground leading-none">{photo.views.toLocaleString()}</p>
                <p className="font-mono text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">просмотров</p>
              </div>
            </div>

            {/* Лайк */}
            <button
              onClick={() => onLike(photo.id)}
              className={`w-full border p-3 flex items-center gap-3 transition-all active:scale-[0.97] ${
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

            {/* Удалить */}
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
