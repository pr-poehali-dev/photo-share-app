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
      className={`opacity-0-init animate-fade-in stagger-${Math.min(index + 1, 6)} group cursor-pointer`}
      onClick={() => onOpen(photo)}
    >
      {/* Windows XP окно */}
      <div className="border border-[rgba(255,255,255,0.25)] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(100,180,255,0.15) 0%, rgba(50,100,200,0.08) 100%)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.15)",
        }}
      >
        {/* Titlebar */}
        <div className="win-titlebar">
          <div className="w-3 h-3 rounded-sm bg-white/30 flex-shrink-0" />
          <span className="flex-1 text-[10px] font-bold truncate" style={{ fontFamily: "Tahoma, sans-serif" }}>
            {photo.title}
          </span>
          <div className="flex gap-0.5 ml-auto">
            <div className="win-btn win-btn-min">─</div>
            <div className="win-btn win-btn-max">□</div>
            <div className="win-btn win-btn-close">✕</div>
          </div>
        </div>

        {/* Фото */}
        <div className="relative overflow-hidden photo-noise" style={{ aspectRatio: "4/3" }}>
          <img
            src={photo.src}
            alt={photo.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Номер */}
          <div className="absolute top-2 left-2 font-mono text-[10px] bg-black/60 text-white px-1.5 py-0.5 border border-white/20">
            #{String(index + 1).padStart(3, "0")}
          </div>
        </div>

        {/* Подвал карточки */}
        <div className="p-2 flex items-center justify-between gap-2"
          style={{ background: "rgba(0,0,60,0.4)", borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p className="font-mono text-[10px] text-white/60 truncate">{photo.date}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onLike(photo.id); }}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onLike(photo.id); }}
              className="flex items-center gap-1 font-mono text-[11px] touch-manipulation select-none transition-colors"
              style={{ color: photo.liked ? "#e8ff5a" : "rgba(255,255,255,0.7)" }}
            >
              <Icon name="Heart" size={11} className={photo.liked ? "fill-current" : ""} />
              {photo.likes}
            </button>
            <div className="flex items-center gap-1 font-mono text-[11px] text-white/50">
              <Icon name="Eye" size={11} />
              {photo.views.toLocaleString()}
            </div>
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
    } catch (_e) { /* fallback */ } finally { setLoadingApi(false); }
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
      } catch (_e) { /* ignore */ }
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
    try { await incrementView(photo._apiId); } catch (_e) { /* ignore */ }
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

  const tickerText = "ААААААААААААЛТАЙ] 4 – 3 – 2 [ААААААААААА ТВОРЧЕСКИЙ ФЕСТИВАЛЬ 2026 [ ААААААААААААЛТАЙ] 4 – 3 – 2 [ААААААААААА ТВОРЧЕСКИЙ ФЕСТИВАЛЬ 2026 ";

  return (
    <div className="min-h-screen" style={{ background: "#1a00cc" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-40 nav-blur">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Логотип в стиле скобок */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-lg font-bold text-white/30">[</span>
              <div>
                <span className="font-mono text-base font-bold text-white tracking-tight">ТВОРЧ</span>
                <span className="font-mono text-xs text-[#e8ff5a] block leading-none" style={{ fontFamily: "monospace" }}>СО «Алтай»</span>
              </div>
              <span className="font-mono text-lg font-bold text-white/30">]</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 font-mono text-xs text-white/50">
              <span className="flex items-center gap-1">
                <Icon name="Heart" size={10} className="text-[#e8ff5a]" />
                {totalLikes}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Eye" size={10} />
                {totalViews}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO — синий блок с текстом как на фото */}
      <section className="relative overflow-hidden" style={{ background: "#2200ee" }}>
        {/* Шум поверх */}
        <div className="absolute inset-0 pointer-events-none photo-noise" />

        <div className="max-w-5xl mx-auto px-5 py-10 sm:py-14 relative z-10">
          <div className="font-mono text-xs text-white/50 tracking-[0.3em] uppercase mb-4">
            творческий фестиваль 2026
          </div>

          <h1 className="font-bold text-white leading-tight mb-6 glitch"
            data-text="привет! я — творческий фестиваль!"
            style={{ fontSize: "clamp(1.6rem, 5vw, 3rem)", fontFamily: "IBM Plex Mono, monospace", fontStyle: "italic" }}
          >
            привет! я — <em>творческий фестиваль!</em>
          </h1>

          <p className="font-mono text-white leading-relaxed mb-6"
            style={{ fontSize: "clamp(1rem, 3vw, 1.4rem)" }}
          >
            совсем скоро мы с тобой увидимся! хореограф / фотограф / видеограф / танцор / дизайнер / творец / креативщик / зритель / <em>и ты!</em>
          </p>

          <p className="font-mono text-white leading-relaxed mb-6"
            style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.2rem)" }}
          >
            я жду твою <span className="border border-[#e8ff5a] px-1 text-[#e8ff5a]">заявку</span> и верю, что именно ты засияешь вместе со <em>студенческими отрядами Алтайского края!</em>
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowUpload(true)}
              className="retro-btn-yellow px-5 py-2 text-sm font-mono uppercase tracking-widest"
            >
              [ поделиться фото ]
            </button>
            <div className="font-mono text-xs text-white/40">
              {allPhotos.length} фото в ленте
            </div>
          </div>
        </div>

        {/* Бегущая строка внизу блока */}
        <div className="ticker-wrap border-t border-white/20 py-2 text-white/40 font-mono text-xs">
          <div className="ticker">
            {tickerText}{tickerText}
          </div>
        </div>
      </section>

      {/* GRID ФОТО */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-28">
        {loadingApi && apiPhotos.length === 0 && (
          <div className="flex items-center gap-3 py-8 font-mono text-sm text-white/50">
            <Icon name="Loader2" size={16} className="animate-spin" />
            ЗАГРУЗКА ДАННЫХ...
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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
          <div className="py-20 font-mono text-sm text-white/40 text-center">
            <p>[ ДАННЫЕ ОТСУТСТВУЮТ ]</p>
          </div>
        )}
      </main>

      {/* FAB — всегда виден */}
      <div className="fixed bottom-5 right-5 z-30">
        <button
          onClick={() => setShowUpload(true)}
          className="retro-btn-filled w-14 h-14 flex items-center justify-center text-2xl font-mono active:scale-90 transition-transform"
          style={{ background: "#e8ff5a", color: "#1a00cc", border: "2px solid #1a00cc" }}
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