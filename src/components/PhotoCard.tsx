import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Photo } from "@/data/photos";

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onClick: (photo: Photo) => void;
  onLike: (id: number) => void;
}

export default function PhotoCard({ photo, index, onClick, onLike }: PhotoCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeAnim(true);
    onLike(photo.id);
    setTimeout(() => setLikeAnim(false), 350);
  };

  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;

  return (
    <div
      className={`photo-card rounded-2xl overflow-hidden cursor-pointer group relative opacity-0-init animate-fade-in ${staggerClass}`}
      onClick={() => onClick(photo)}
    >
      {/* Skeleton */}
      {!imgLoaded && (
        <div className="absolute inset-0 bg-secondary animate-pulse rounded-2xl" />
      )}

      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={photo.src}
          alt={photo.title}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-400" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="text-xs font-body font-500 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/90 border border-white/20">
            {photo.category}
          </span>
        </div>

        {/* Stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-400">
          <h3 className="font-display text-xl text-white mb-2 leading-tight">{photo.title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-body">{photo.author} · {photo.date}</span>
            <div className="flex items-center gap-3">
              {/* Views */}
              <div className="flex items-center gap-1 text-white/60">
                <Icon name="Eye" size={13} />
                <span className="text-xs">{photo.views.toLocaleString()}</span>
              </div>
              {/* Likes */}
              <button
                onClick={handleLike}
                className="flex items-center gap-1 group/like"
              >
                <Icon
                  name={photo.liked ? "Heart" : "Heart"}
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
