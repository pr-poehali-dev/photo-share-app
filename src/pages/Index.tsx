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
    } catch { /* fallback to static */ } finally { setLoadingApi(false); }
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
    <div className="min-h-screen bg-background font-body">

      {/* NAV */}
      <nav className="sticky top-0 z-40 nav-blur">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center">
              <Icon name="Camera" size={14} className="text-white" />
            </div>
            <span className="font-display text-lg sm:text-xl text-foreground tracking-wide">НаТворче</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0.5 bg-secondary/50 rounded-xl p-1 border border-border">
            <button
              onClick={() => setPage("feed")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-body transition-all duration-300 ${page === "feed" ? "bg-gradient-to-r from-amber-400/90 via-pink-500/90 to-purple-600/90 text-white shadow-lg" : "text-muted-foreground"}`}
            >
              Лента
            </button>
            <button
              onClick={() => setPage("gallery")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-body transition-all duration-300 ${page === "gallery" ? "bg-gradient-to-r from-amber-400/90 via-pink-500/90 to-purple-600/90 text-white shadow-lg" : "text-muted-foreground"}`}
            >
              Галерея
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Icon name="Heart" size={12} className="text-rose-400" />{totalLikes.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Icon name="Eye" size={12} className="text-accent" />{totalViews.toLocaleString()}</span>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-body font-medium text-white bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 hover:opacity-90 active:scale-95 transition-all duration-200 shadow-lg"
            >
              <Icon name="Plus" size={14} />
              <span className="hidden xs:inline sm:inline">Добавить</span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO — компактный на мобильном */}
      <section className="relative pt-8 sm:pt-16 pb-6 sm:pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-600/8 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-amber-400/6 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground mb-2 sm:mb-4 font-body">
            {page === "feed" ? "свежие работы" : "вся коллекция"}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl mb-3 sm:mb-4 leading-none">
            {page === "feed"
              ? <>Лента <span className="grad-text italic">моментов</span></>
              : <>Галерея <span className="grad-text italic">работ</span></>}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xs sm:max-w-md mx-auto">
            {page === "feed" ? "Делись самыми яркими моментами" : "Все фотографии одним взглядом — нажмите для просмотра"}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 pb-24 sm:pb-20">
        {loadingApi && apiPhotos.length === 0 && (
          <div className="flex justify-center py-8">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {page === "feed" ? (
          /* Лента — на мобильном только фото + кнопки под ним */
          <div className="space-y-4 sm:space-y-6">
            {filtered.map((photo, i) => (
              <div
                key={photo.id}
                className={`card-glass rounded-2xl overflow-hidden flex flex-col sm:flex-row group cursor-pointer opacity-0-init animate-fade-in stagger-${Math.min(i + 1, 6)}`}
                onClick={() => handleOpen(photo)}
              >
                {/* Фото */}
                <div className="sm:w-[380px] md:w-[480px] relative overflow-hidden aspect-[16/10] sm:aspect-auto sm:h-56 md:h-64 flex-shrink-0">
                  <img
                    src={photo.src}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                {/* Инфо */}
                <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl text-foreground mb-1">{photo.title}</h2>
                    <p className="text-muted-foreground text-xs sm:text-sm font-body">{photo.date}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-3 sm:mt-4">
                    {/* Лайк */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLike(photo.id); }}
                      className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full border transition-all duration-300 text-sm font-body active:scale-95 ${photo.liked ? 'border-rose-500/40 text-rose-400 bg-rose-500/10' : 'border-border text-muted-foreground'}`}
                    >
                      <Icon name="Heart" size={13} className={photo.liked ? 'fill-rose-400 text-rose-400' : ''} />
                      {photo.likes}
                    </button>
                    {/* Просмотры */}
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <Icon name="Eye" size={13} />
                      {photo.views.toLocaleString()}
                    </div>
                    {/* Удалить */}
                    {photo._apiId && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                        className="ml-auto p-2 rounded-lg text-muted-foreground hover:text-rose-400 active:text-rose-400 transition-colors"
                      >
                        <Icon name="Trash2" size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Галерея — 1 колонка на мобильном, 2 на планшете, 3 на десктопе */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
          <div className="text-center py-20 text-muted-foreground">
            <Icon name="ImageOff" size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-body text-sm">Нет фотографий</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 sm:mt-12 text-center">
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-body font-medium text-sm text-foreground bg-gradient-to-r from-amber-400/10 via-pink-500/10 to-purple-600/10 border border-purple-500/20 hover:border-purple-500/40 active:scale-[0.98] transition-all duration-300"
          >
            <Icon name="ImagePlus" size={16} />
            Поделитесь своим фото
          </button>
          <p className="text-muted-foreground text-xs mt-2.5 font-body">Любой может добавить свою фотографию</p>
        </div>
      </main>

      {/* Мобильный FAB — кнопка добавить (дублирует навбар для удобства) */}
      <div className="fixed bottom-5 right-4 sm:hidden z-30">
        <button
          onClick={() => setShowUpload(true)}
          className="w-14 h-14 rounded-full text-white bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 shadow-xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <Icon name="Plus" size={24} />
        </button>
      </div>

      {/* MODALS */}
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