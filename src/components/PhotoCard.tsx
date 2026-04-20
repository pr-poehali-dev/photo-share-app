import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Photo } from "@/data/photos";

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onClick: (photo: Photo) => void;
  onLike: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function PhotoCard({ photo, index, onClick, onLike, onDelete }: PhotoCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeAnim(true);
    onLike(photo.id);
    setTimeout(() => setLikeAnim(false), 350);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(true);
    setTimeout(() => setConfirmDelete(false), 3000);
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(photo.id);
  };

  return (
    <div
      className={`photo-card cursor-pointer group relative opacity-0-init animate-fade-in stagger-${Math.min(index + 1, 6)}`}
      onClick={() => onClick(photo)}
    >
      {!imgLoaded && (
        <div className="absolute inset-0 bg-secondary animate-pulse" style={{ aspectRatio: "4/3" }} />
      )}

      {/* Фото */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <img
          src={photo.src}
          alt={photo.title}
          className={`w-full h-full object-cover grayscale-[20%] transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
        />

        {/* Шум поверх */}
        <div className="absolute inset-0 pointer-events-none photo-noise" />

        {/* Градиент снизу */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* Номер */}
        <div className="absolute top-2 left-2 font-mono text-xs bg-foreground text-background px-2 py-0.5">
          #{String(index + 1).padStart(3, "0")}
        </div>

        {/* Удалить */}
        {onDelete && (
          <div className="absolute top-2 right-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {confirmDelete ? (
              <button onClick={handleDeleteConfirm} className="font-mono text-xs bg-destructive text-white px-2 py-1 border border-red-800 active:scale-95 transition-transform">
                DEL?
              </button>
            ) : (
              <button onClick={handleDeleteClick} className="w-7 h-7 bg-black/60 border border-white/20 flex items-center justify-center text-white/80 active:scale-90 transition-transform">
                <Icon name="Trash2" size={12} />
              </button>
            )}
          </div>
        )}

        {/* Нижняя панель */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-display text-xl text-white leading-tight mb-2 uppercase">
            {photo.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="font-mono text-white/50 text-xs">{photo.date}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-white/50 flex items-center gap-1">
                <Icon name="Eye" size={11} />
                {photo.views.toLocaleString()}
              </span>
              <button
                onClick={handleLike}
                className={`font-mono text-xs flex items-center gap-1 transition-all duration-150 active:scale-110 ${photo.liked ? "text-electric" : "text-white/60"}`}
                style={{ color: photo.liked ? "var(--electric)" : undefined }}
              >
                <Icon
                  name="Heart"
                  size={13}
                  className={`transition-transform duration-150 ${likeAnim ? "scale-125" : "scale-100"} ${photo.liked ? "fill-current" : ""}`}
                />
                {photo.likes}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
