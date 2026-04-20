import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";
import PhotoCard from "@/components/PhotoCard";
import PhotoModal from "@/components/PhotoModal";
import { PHOTOS, CATEGORIES, Photo } from "@/data/photos";

type PageView = "feed" | "gallery";

export default function Index() {
  const [photos, setPhotos] = useState<Photo[]>(PHOTOS);
  const [page, setPage] = useState<PageView>("feed");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === "Все") return photos;
    return photos.filter((p) => p.category === activeCategory);
  }, [photos, activeCategory]);

  const handleLike = (id: number) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
    if (selectedPhoto?.id === id) {
      setSelectedPhoto((prev) =>
        prev ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : null
      );
    }
  };

  const handleOpen = (photo: Photo) => {
    setSelectedPhoto(photos.find((p) => p.id === photo.id) ?? photo);
  };

  const currentIndex = selectedPhoto ? filtered.findIndex((p) => p.id === selectedPhoto.id) : -1;

  const handlePrev = () => {
    if (currentIndex > 0) setSelectedPhoto(filtered[currentIndex - 1]);
  };

  const handleNext = () => {
    if (currentIndex < filtered.length - 1) setSelectedPhoto(filtered[currentIndex + 1]);
  };

  const totalLikes = photos.reduce((acc, p) => acc + p.likes, 0);
  const totalViews = photos.reduce((acc, p) => acc + p.views, 0);

  return (
    <div className="min-h-screen bg-background font-body">
      {/* NAV */}
      <nav className="sticky top-0 z-40 nav-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center">
              <Icon name="Camera" size={14} className="text-white" />
            </div>
            <span className="font-display text-xl text-foreground tracking-wide">ФотоЛента</span>
          </div>

          <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1 border border-border">
            <button
              onClick={() => setPage("feed")}
              className={`px-4 py-1.5 rounded-lg text-sm font-body transition-all duration-300 ${
                page === "feed"
                  ? "bg-gradient-to-r from-amber-400/90 via-pink-500/90 to-purple-600/90 text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Лента
            </button>
            <button
              onClick={() => setPage("gallery")}
              className={`px-4 py-1.5 rounded-lg text-sm font-body transition-all duration-300 ${
                page === "gallery"
                  ? "bg-gradient-to-r from-amber-400/90 via-pink-500/90 to-purple-600/90 text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Галерея
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="hidden sm:flex items-center gap-1">
              <Icon name="Heart" size={12} className="text-rose-400" />
              {totalLikes.toLocaleString()}
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Icon name="Eye" size={12} className="text-accent" />
              {totalViews.toLocaleString()}
            </span>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-16 pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-80 h-80 bg-amber-400/6 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 font-body animate-fade-in">
            {page === "feed" ? "свежие работы" : "вся коллекция"}
          </p>
          <h1 className="font-display text-5xl md:text-7xl mb-4 leading-none animate-slide-up">
            {page === "feed" ? (
              <>
                Лента <span className="grad-text italic">моментов</span>
              </>
            ) : (
              <>
                Галерея <span className="grad-text italic">работ</span>
              </>
            )}
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto animate-fade-in stagger-2">
            {page === "feed"
              ? "Последние фотографии, отсортированные по дате публикации"
              : "Все фотографии одним взглядом — нажмите для просмотра"}
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hidden">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-body transition-all duration-300 border ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-amber-400/20 via-pink-500/20 to-purple-600/20 border-purple-500/40 text-foreground"
                  : "border-border text-muted-foreground hover:border-border hover:text-foreground bg-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <main className="max-w-6xl mx-auto px-4 pb-20">
        {page === "feed" ? (
          <div className="space-y-6">
            {filtered.map((photo, i) => (
              <div
                key={photo.id}
                className={`card-glass rounded-2xl overflow-hidden flex flex-col md:flex-row gap-0 group cursor-pointer opacity-0-init animate-fade-in stagger-${Math.min(i + 1, 6)}`}
                onClick={() => handleOpen(photo)}
              >
                <div className="md:w-[480px] relative overflow-hidden aspect-video md:aspect-auto md:h-64 flex-shrink-0">
                  <img
                    src={photo.src}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/80 border border-white/15 font-body">
                      {photo.category}
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="font-display text-2xl text-foreground mb-2">{photo.title}</h2>
                    <p className="text-muted-foreground text-sm font-body">{photo.author} · {photo.date}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLike(photo.id); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 text-sm font-body ${
                        photo.liked
                          ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                          : 'border-border text-muted-foreground hover:border-rose-500/40 hover:text-rose-400'
                      }`}
                    >
                      <Icon
                        name="Heart"
                        size={14}
                        className={photo.liked ? 'fill-rose-400 text-rose-400' : ''}
                      />
                      {photo.likes}
                    </button>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Icon name="Eye" size={14} />
                      {photo.views.toLocaleString()}
                    </div>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors"
                    >
                      <Icon name="Maximize2" size={14} />
                      <span className="hidden sm:inline">Открыть</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filtered.map((photo, i) => (
              <div key={photo.id} className="break-inside-avoid">
                <PhotoCard
                  photo={photo}
                  index={i}
                  onClick={handleOpen}
                  onLike={handleLike}
                />
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <Icon name="ImageOff" size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-body">Нет фотографий в этой категории</p>
          </div>
        )}
      </main>

      {/* MODAL */}
      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onLike={handleLike}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < filtered.length - 1}
      />
    </div>
  );
}
