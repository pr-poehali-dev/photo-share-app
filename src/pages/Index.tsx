import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import PhotoModal from "@/components/PhotoModal";
import UploadModal from "@/components/UploadModal";
import { PHOTOS as STATIC_PHOTOS, Photo } from "@/data/photos";
import { fetchPhotos, toggleLike, incrementView, deletePhoto, ApiPhoto } from "@/api/photos";

type PhotoWithApi = Photo & { _apiId?: number };

function getSessionId(): string {
  let sid = localStorage.getItem("photo_session_id");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("photo_session_id", sid);
  }
  return sid;
}

function apiToPhoto(p: ApiPhoto): PhotoWithApi {
  const date = new Date(p.created_at);
  const formatted = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  return { id: p.id + 10000, title: p.title, author: p.author, category: p.category, src: p.image_url, likes: p.likes, views: p.views, date: formatted, liked: false, _apiId: p.id };
}

interface PhotoCardProps {
  photo: PhotoWithApi;
  index: number;
  onOpen: (photo: PhotoWithApi) => void;
  onLike: (id: number) => void;
  onInView: (photo: PhotoWithApi) => void;
}

function PhotoCard({ photo, index, onOpen, onLike, onInView }: PhotoCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { onInView(photo); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [photo, onInView]);

  return (
    <div
      ref={ref}
      className={`flex flex-col sm:flex-row group cursor-pointer opacity-0-init animate-fade-in stagger-${Math.min(index + 1, 6)} py-5 sm:py-6 gap-4 sm:gap-6 hover:bg-black/3 transition-colors`}
      onClick={() => onOpen(photo)}
    >
      <div className="sm:w-72 md:w-80 relative overflow-hidden flex-shrink-0 border-2 border-foreground/30 photo-noise" style={{ aspectRatio: "16/10" }}>
        <img
          src={photo.src}
          alt={photo.title}
          className="w-full h-full object-cover grayscale-[15%] transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 font-mono text-xs bg-foreground text-background px-2 py-0.5">
          #{String(index + 1).padStart(3, "0")}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <p className="font-mono text-xs text-muted-foreground mb-1 uppercase tracking-widest">{photo.date}</p>
          <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight mb-2">{photo.title.toUpperCase()}</h2>
          <span className="retro-tag">ФОТО</span>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onLike(photo.id); }}
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onLike(photo.id); }}
            className={`retro-btn px-3 py-1.5 text-xs flex items-center gap-1.5 touch-manipulation select-none ${photo.liked ? "!bg-foreground !text-background" : ""}`}
          >
            <Icon name="Heart" size={11} className={photo.liked ? "fill-current" : ""} />
            {photo.likes}
          </button>
          <div className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
            <Icon name="Eye" size={11} />
            {photo.views.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [apiPhotos, setApiPhotos] = useState<PhotoWithApi[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithApi | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loadingApi, setLoadingApi] = useState(true);
  const sessionId = getSessionId();

  const loadPhotos = useCallback(async () => {
    try {
      const data = await fetchPhotos();
      setApiPhotos(data.map(apiToPhoto));
    } catch { /* fallback */ } finally { setLoadingApi(false); }
  }, []);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const allPhotos: PhotoWithApi[] = useMemo(
    () => [...apiPhotos, ...STATIC_PHOTOS.map((p) => ({ ...p }))],
    [apiPhotos]
  );

  const handleLike = async (id: number) => {
    const photo = allPhotos.find((p) => p.id === id);
    const applyToggle = (prev: PhotoWithApi[]) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p);
    if (photo?._apiId) {
      setApiPhotos((prev) => applyToggle(prev));
      setSelectedPhoto((prev) => prev?.id === id ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : prev);
      try {
        const res = await toggleLike(photo._apiId, sessionId);
        setApiPhotos((prev) => prev.map((p) => p.id === id ? { ...p, liked: res.liked, likes: res.likes } : p));
        setSelectedPhoto((prev) => prev?.id === id ? { ...prev, liked: res.liked, likes: res.likes } : prev);
      } catch { /* ignore */ }
    } else {
      setApiPhotos((prev) => applyToggle(prev));
      setSelectedPhoto((prev) => prev?.id === id ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : prev);
    }
  };

  const handleOpen = (photo: PhotoWithApi) => {
    const found = allPhotos.find((p) => p.id === photo.id) ?? photo;
    setSelectedPhoto(found);
  };

  const viewedIds = useRef<Set<number>>(new Set());

  const handleInView = useCallback(async (photo: PhotoWithApi) => {
    if (!photo._apiId || viewedIds.current.has(photo.id)) return;
    viewedIds.current.add(photo.id);
    try { await incrementView(photo._apiId); } catch { /* ignore */ }
    setApiPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, views: p.views + 1 } : p));
  }, []);

  const handleDelete = async (id: number) => {
    const photo = allPhotos.find((p) => p.id === id);
    if (!photo?._apiId) return;
    setApiPhotos((prev) => prev.filter((p) => p.id !== id));
    setSelectedPhoto(null);
    try { await deletePhoto(photo._apiId); } catch { loadPhotos(); }
  };

  const currentIndex = selectedPhoto ? allPhotos.findIndex((p) => p.id === selectedPhoto.id) : -1;
  const handlePrev = () => { if (currentIndex > 0) setSelectedPhoto(allPhotos[currentIndex - 1]); };
  const handleNext = () => { if (currentIndex < allPhotos.length - 1) setSelectedPhoto(allPhotos[currentIndex + 1]); };
  const totalLikes = allPhotos.reduce((acc, p) => acc + p.likes, 0);
  const totalViews = allPhotos.reduce((acc, p) => acc + p.views, 0);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">

      {/* NAV */}
      <nav className="sticky top-0 z-40 nav-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-display text-3xl text-foreground leading-none">НаТворче</span>
            <span className="retro-tag hidden sm:inline">v2.0</span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-3 font-mono text-xs text-muted-foreground">
              <span>♥ {totalLikes}</span>
              <span>◎ {totalViews}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 pt-10 sm:pt-16 pb-8 sm:pb-12">
        <div className="font-mono text-xs text-muted-foreground tracking-[0.3em] uppercase mb-3">
          &gt;&gt; STREAM_MODE ████████████ OK
        </div>

        <h1
          className="font-display leading-none mb-2 glitch"
          data-text="ЛЕНТА МОМЕНТОВ"
          style={{ fontSize: "clamp(3rem, 10vw, 7rem)", color: "hsl(0 0% 8%)" }}
        >
          ЛЕНТА <span className="grad-text">МОМЕНТОВ</span>
        </h1>

        <p className="font-mono text-sm sm:text-base text-muted-foreground cursor-blink">
          Делись самыми яркими впечатлениями.
        </p>

        <div className="mt-6 sm:mt-8 border-t-2 border-foreground relative">
          <span className="absolute -top-3 left-0 bg-background px-2 font-mono text-xs" style={{ color: "var(--electric)" }}>
            [ {allPhotos.length} ФОТО ]
          </span>
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-5xl mx-auto px-4 pb-24 sm:pb-20">
        {loadingApi && apiPhotos.length === 0 && (
          <div className="flex items-center gap-3 py-8 font-mono text-sm text-muted-foreground">
            <Icon name="Loader2" size={16} className="animate-spin" />
            ЗАГРУЗКА ДАННЫХ...
          </div>
        )}

        <div className="space-y-0 divide-y-2 divide-foreground/20">
          {allPhotos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={i}
              onOpen={handleOpen}
              onLike={handleLike}
              onInView={handleInView}
            />
          ))}
        </div>

        {allPhotos.length === 0 && !loadingApi && (
          <div className="py-20 font-mono text-sm text-muted-foreground text-center">
            <p>[ ДАННЫЕ ОТСУТСТВУЮТ ]</p>
          </div>
        )}

        <div className="mt-12 sm:mt-16 border-2 border-dashed border-foreground/30 p-6 sm:p-8 text-center">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">// ЗАГРУЗИТЬ НОВОЕ ФОТО</p>
          <button
            onClick={() => setShowUpload(true)}
            className="retro-btn-blue px-6 py-2.5 text-sm uppercase tracking-wider flex items-center gap-2 mx-auto"
          >
            <Icon name="ImagePlus" size={14} />
            [ ПОДЕЛИТЬСЯ ФОТО ]
          </button>
        </div>
      </main>

      {/* FAB — всегда виден */}
      <div className="fixed bottom-5 right-5 z-30">
        <button
          onClick={() => setShowUpload(true)}
          className="retro-btn-filled w-14 h-14 flex items-center justify-center text-2xl font-display border-2 border-foreground active:scale-90 transition-transform shadow-lg"
          title="Добавить фото"
        >
          +
        </button>
      </div>

      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onLike={handleLike}
        onDelete={selectedPhoto?._apiId ? handleDelete : undefined}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < allPhotos.length - 1}
      />

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={loadPhotos} />
      )}
    </div>
  );
}