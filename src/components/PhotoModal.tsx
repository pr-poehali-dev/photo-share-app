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

  useEffect(() => {
    setConfirmDelete(false);
  }, [photo?.id]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-scale-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

      <div
        className="relative z-10 w-full max-w-5xl mx-4 flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="flex-1 relative">
          <img
            src={photo.src}
            alt={photo.title}
            className="w-full h-[55vh] lg:h-[80vh] object-cover"
          />
          {hasPrev && (
            <button
              onClick={onPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-all hover:scale-110"
            >
              <Icon name="ChevronLeft" size={18} />
            </button>
          )}
          {hasNext && (
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-all hover:scale-110"
            >
              <Icon name="ChevronRight" size={18} />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="lg:w-72 bg-[hsl(220,18%,9%)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-end mb-6">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
            <h2 className="font-display text-3xl text-white mb-2 leading-tight">{photo.title}</h2>
            <p className="text-muted-foreground text-xs font-body">{photo.date}</p>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/4 border border-white/6">
              <Icon name="Eye" size={18} className="text-accent" />
              <div>
                <p className="text-white font-body font-semibold text-lg leading-none">{photo.views.toLocaleString()}</p>
                <p className="text-muted-foreground text-xs mt-0.5">просмотров</p>
              </div>
            </div>

            <button
              onClick={() => onLike(photo.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                photo.liked
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-white/4 border-white/6 text-white/70 hover:border-rose-500/30 hover:text-rose-400'
              }`}
            >
              <Icon name="Heart" size={18} className={photo.liked ? 'fill-rose-400 text-rose-400' : ''} />
              <div className="text-left">
                <p className="font-body font-semibold text-lg leading-none">{photo.likes}</p>
                <p className="text-xs mt-0.5 opacity-70">{photo.liked ? 'вам нравится' : 'нравится'}</p>
              </div>
            </button>

            {onDelete && (
              confirmDelete ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { onDelete(photo.id); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-sm font-body hover:bg-rose-500/30 transition-all"
                  >
                    <Icon name="Trash2" size={14} />
                    Да, удалить
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-3 rounded-xl bg-white/4 border border-white/6 text-white/60 text-sm font-body hover:text-white transition-all"
                  >
                    Нет
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/4 border border-white/6 text-white/40 hover:text-rose-400 hover:border-rose-500/30 transition-all text-sm font-body"
                >
                  <Icon name="Trash2" size={14} />
                  Удалить фото
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
