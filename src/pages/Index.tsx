import { useState, useMemo, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import PhotoCard from "@/components/PhotoCard";
import PhotoModal from "@/components/PhotoModal";
import UploadModal from "@/components/UploadModal";
import { PHOTOS as STATIC_PHOTOS, Photo } from "@/data/photos";
import { fetchPhotos, toggleLike, incrementView, deletePhoto, ApiPhoto } from "@/api/photos";

type PageView = "feed" | "gallery";
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

export default function Index() {
  const [apiPhotos, setApiPhotos] = useState<PhotoWithApi[]>([]);
  const [page, setPage] = useState<PageView>("feed");
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
  const filtered = allPhotos;

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

  const handleOpen = async (photo: PhotoWithApi) => {
    const found = allPhotos.find((p) => p.id === photo.id) ?? photo;
    setSelectedPhoto(found);
    if (found._apiId) {
      try { await incrementView(found._apiId); } catch { /* ignore */ }
      setApiPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, views: p.views + 1 } : p));
    }
  };

  const handleDelete = async (id: number) => {
    const photo = allPhotos.find((p) => p.id === id);
    if (!photo?._apiId) return;
    setApiPhotos((prev) => prev.filter((p) => p.id !== id));
    setSelectedPhoto(null);
    try { await deletePhoto(photo._apiId); } catch { loadPhotos(); }
  };

  const currentIndex = selectedPhoto ? filtered.findIndex((p) => p.id === selectedPhoto.id) : -1;
  const handlePrev = () => { if (currentIndex > 0) setSelectedPhoto(filtered[currentIndex - 1]); };
  const handleNext = () => { if (currentIndex < filtered.length - 1) setSelectedPhoto(filtered[currentIndex + 1]); };
  const totalLikes = allPhotos.reduce((acc, p) => acc + p.likes, 0);
  const totalViews = allPhotos.reduce((acc, p) => acc + p.views, 0);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">

      {/* NAV */}
      <nav className="sticky top-0 z-40 nav-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

          {/* Логотип */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-display text-3xl text-foreground leading-none">НаТворче</span>
            <span className="retro-tag hidden sm:inline">v2.0</span>
          </div>

          {/* Табы */}
          <div className="flex items-center gap-0 border-2 border-foreground" style={{ borderRadius: 0 }}>
            <button
              onClick={() => setPage("feed")}
              className={`px-3 sm:px-5 py-1.5 font-mono text-xs sm:text-sm uppercase tracking-widest transition-all duration-100 ${
                page === "feed"
                  ? "bg-foreground text-background"
                  : "bg-transparent text-foreground hover:bg-foreground/10"
              }`}
            >
              [ ЛЕНТА ]
            </button>
            <div className="w-px h-full bg-foreground" />
            <button
              onClick={() => setPage("gallery")}
              className={`px-3 sm:px-5 py-1.5 font-mono text-xs sm:text-sm uppercase tracking-widest transition-all duration-100 ${
                page === "gallery"
                  ? "bg-foreground text-background"
                  : "bg-transparent text-foreground hover:bg-foreground/10"
              }`}
            >
              [ ГАЛЕРЕЯ ]
            </button>
          </div>

          {/* Правый блок */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-3 font-mono text-xs text-muted-foreground">
              <span>♥ {totalLikes}</span>
              <span>◎ {totalViews}</span>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="retro-btn-filled px-3 sm:px-4 py-1.5 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5"
            >
              <Icon name="Plus" size={13} />
              <span className="hidden sm:inline">Добавить</span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 pt-10 sm:pt-16 pb-8 sm:pb-12">
        {/* Метка */}
        <div className="font-mono text-xs text-muted-foreground tracking-[0.3em] uppercase mb-3">
          &gt;&gt; {page === "feed" ? "STREAM_MODE" : "GALLERY_MODE"} ████████████ OK
        </div>

        {/* Заголовок */}
        <h1
          className="font-display leading-none mb-2 glitch"
          data-text={page === "feed" ? "ЛЕНТА МОМЕНТОВ" : "ГАЛЕРЕЯ РАБОТ"}
          style={{ fontSize: "clamp(3rem, 10vw, 7rem)", color: "hsl(0 0% 8%)" }}
        >
          {page === "feed" ? (
            <>ЛЕНТА <span className="grad-text">МОМЕНТОВ</span></>
          ) : (
            <>ГАЛЕРЕЯ <span className="grad-text">РАБОТ</span></>
          )}
        </h1>

        {/* Подзаголовок */}
        <p className="font-mono text-sm sm:text-base text-muted-foreground cursor-blink">
          {page === "feed" ? "Делись самыми яркими моментами" : "Все фотографии одним взглядом"}
        </p>

        {/* Горизонтальный разделитель */}
        <div className="mt-6 sm:mt-8 border-t-2 border-foreground relative">
          <span className="absolute -top-3 left-0 bg-background px-2 font-mono text-xs text-electric" style={{ color: "var(--electric)" }}>
            [ {filtered.length} ФОТО ]
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

        {page === "feed" ? (
          <div className="space-y-0 divide-y-2 divide-foreground/20">
            {filtered.map((photo, i) => (
              <div
                key={photo.id}
                className={`flex flex-col sm:flex-row group cursor-pointer opacity-0-init animate-fade-in stagger-${Math.min(i + 1, 6)} py-5 sm:py-6 gap-4 sm:gap-6 hover:bg-black/3 transition-colors`}
                onClick={() => handleOpen(photo)}
              >
                {/* Фото */}
                <div className="sm:w-72 md:w-80 relative overflow-hidden flex-shrink-0 border-2 border-foreground/30 photo-noise" style={{ aspectRatio: "16/10" }}>
                  <img
                    src={photo.src}
                    alt={photo.title}
                    className="w-full h-full object-cover grayscale-[15%] transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                  />
                  {/* Номер */}
                  <div className="absolute top-2 left-2 font-mono text-xs bg-foreground text-background px-2 py-0.5">
                    #{String(i + 1).padStart(3, "0")}
                  </div>
                </div>

                {/* Инфо */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground mb-1 uppercase tracking-widest">{photo.date}</p>
                    <h2 className="font-display text-3xl sm:text-4xl text-foreground leading-tight mb-2">{photo.title.toUpperCase()}</h2>
                    <div className="flex items-center gap-2">
                      <span className="retro-tag">ФОТО</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLike(photo.id); }}
                      className={`retro-btn px-3 py-1.5 text-xs flex items-center gap-1.5 ${photo.liked ? "!bg-foreground !text-background" : ""}`}
                    >
                      <Icon name="Heart" size={11} className={photo.liked ? "fill-current" : ""} />
                      {photo.likes}
                    </button>
                    <div className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
                      <Icon name="Eye" size={11} />
                      {photo.views.toLocaleString()}
                    </div>
                    {photo._apiId && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                        className="ml-auto font-mono text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                      >
                        <Icon name="Trash2" size={11} />
                        <span className="hidden sm:inline">DEL</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((photo, i) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={i}
                onClick={handleOpen}
                onLike={handleLike}
                onDelete={photo._apiId ? handleDelete : undefined}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && !loadingApi && (
          <div className="py-20 font-mono text-sm text-muted-foreground text-center">
            <p>[ ДАННЫЕ ОТСУТСТВУЮТ ]</p>
          </div>
        )}

        {/* CTA */}
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

      {/* FAB mobile */}
      <div className="fixed bottom-5 right-4 sm:hidden z-30">
        <button
          onClick={() => setShowUpload(true)}
          className="retro-btn-filled w-14 h-14 flex items-center justify-center text-xl font-display border-2 border-foreground active:scale-90 transition-transform"
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
        hasNext={currentIndex < filtered.length - 1}
      />

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={loadPhotos} />
      )}
    </div>
  );
}
