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
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

      <div
        className="relative z-10 w-full sm:max-w-5xl sm:mx-4 flex flex-col sm:flex-row rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-scale-in max-h-[95vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Фото */}
        <div className="relative flex-shrink-0 sm:flex-1">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 sm:hidden">
            <div className="w-8 h-1 rounded-full bg-white/30" />
          </div>
          <img
            src={photo.src}
            alt={photo.title}
            className="w-full object-cover"
            style={{ height: "min(50vw, 260px)", minHeight: "200px" }}
          />
          <style>{`@media(min-width:640px){.modal-img{height:80vh!important}}`}</style>
          {hasPrev && (
            <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <Icon name="ChevronLeft" size={16} />
            </button>
          )}
          {hasNext && (
            <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
              <Icon name="ChevronRight" size={16} />
            </button>
          )}
        </div>

        {/* Инфо */}
        <div className="sm:w-64 md:w-72 flex flex-col overflow-y-auto" style={{ background: "hsl(220,18%,9%)", borderTop: "1px solid hsl(220,15%,18%)" }}>
          <div className="flex justify-between items-center px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl text-white leading-tight truncate">{photo.title}</h2>
              <p className="text-muted-foreground text-xs font-body mt-0.5">{photo.date}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white active:scale-90 transition-all flex-shrink-0 ml-3">
              <Icon name="X" size={14} />
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            {/* Просмотры */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/4 border border-white/6">
              <Icon name="Eye" size={16} className="text-accent flex-shrink-0" />
              <div>
                <p className="text-white font-body font-semibold leading-none">{photo.views.toLocaleString()}</p>
                <p className="text-muted-foreground text-xs mt-0.5">просмотров</p>
              </div>
            </div>

            {/* Лайк */}
            <button
              onClick={() => onLike(photo.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 active:scale-[0.97] ${photo.liked ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-white/4 border-white/6 text-white/70 hover:border-rose-500/30 hover:text-rose-400'}`}
            >
              <Icon name="Heart" size={16} className={`flex-shrink-0 ${photo.liked ? 'fill-rose-400 text-rose-400' : ''}`} />
              <div className="text-left">
                <p className="font-body font-semibold leading-none">{photo.likes}</p>
                <p className="text-xs mt-0.5 opacity-70">{photo.liked ? 'вам нравится' : 'нравится'}</p>
              </div>
            </button>

            {/* Удалить */}
            {onDelete && (
              confirmDelete ? (
                <div className="flex gap-2">
                  <button onClick={() => { onDelete(photo.id); onClose(); }} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-sm font-body active:scale-[0.97] transition-all">
                    <Icon name="Trash2" size={14} />Удалить
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="px-4 py-3 rounded-xl bg-white/4 border border-white/6 text-white/60 text-sm font-body active:scale-[0.97] transition-all">
                    Нет
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/4 border border-white/6 text-white/40 hover:text-rose-400 hover:border-rose-500/30 active:scale-[0.97] transition-all text-sm font-body">
                  <Icon name="Trash2" size={13} />Удалить фото
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
