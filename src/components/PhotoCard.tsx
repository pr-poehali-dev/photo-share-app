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

  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;

  return (
    <div
      className={`photo-card rounded-2xl overflow-hidden cursor-pointer group relative opacity-0-init animate-fade-in ${staggerClass}`}
      onClick={() => onClick(photo)}
    >
      {!imgLoaded && (
        <div className="absolute inset-0 bg-secondary animate-pulse rounded-2xl" />
      )}

      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={photo.src}
          alt={photo.title}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-400" />

        {/* Delete button */}
        {onDelete && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {confirmDelete ? (
              <button
                onClick={handleDeleteConfirm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 text-white text-xs font-body font-medium shadow-lg"
              >
                <Icon name="Trash2" size={12} />
                Удалить?
              </button>
            ) : (
              <button
                onClick={handleDeleteClick}
                className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-rose-400 hover:border-rose-500/40 transition-all"
              >
                <Icon name="Trash2" size={13} />
              </button>
            )}
          </div>
        )}

        {/* Stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-400">
          <h3 className="font-display text-xl text-white mb-2 leading-tight">{photo.title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-body">{photo.date}</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-white/60">
                <Icon name="Eye" size={13} />
                <span className="text-xs">{photo.views.toLocaleString()}</span>
              </div>
              <button onClick={handleLike} className="flex items-center gap-1 group/like">
                <Icon
                  name="Heart"
                  size={15}
                  className={`transition-all duration-200 ${likeAnim ? 'scale-125' : 'scale-100'} ${photo.liked ? 'text-rose-400 fill-rose-400' : 'text-white/60 group-hover/like:text-rose-400'}`}
                />
                <span className={`text-xs transition-colors ${photo.liked ? 'text-rose-400' : 'text-white/60 group-hover/like:text-rose-400'}`}>
                  {photo.likes}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
