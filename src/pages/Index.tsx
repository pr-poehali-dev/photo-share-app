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
      { threshold: 0.25 }
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
      {/* Карточка — белая рамка, лента */}
      <div style={{ border: "2px solid rgba(255,255,255,0.85)", background: "white", overflow: "hidden" }}>
        {/* Шапка карточки белая */}
        <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(0,0,150,0.15)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="https://cdn.poehali.dev/files/e0676edc-9002-4ae9-8934-4099ea16d7cf.png"
              alt="fox"
              className="w-8 h-8 object-contain flex-shrink-0"
              style={{ imageRendering: "pixelated" }}
            />
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold text-[#1a00cc] truncate">
                {photo.author && photo.author !== "Аноним" ? photo.author : "НаТворче"}
              </p>
              <p className="font-mono text-[9px] text-gray-400">{photo.date}</p>
            </div>
          </div>
          <span className="font-mono text-[9px] text-gray-300 flex-shrink-0">#{String(index + 1).padStart(3, "0")}</span>
        </div>

        {/* Фото — квадрат */}
        <div className="relative overflow-hidden photo-noise" style={{ aspectRatio: "1/1" }}>
          <img
            src={photo.src}
            alt={photo.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Подпись */}
        <div className="px-3 py-2.5" style={{ background: "white" }}>
          <p className="font-mono text-[12px] font-bold text-[#1a00cc] leading-snug mb-2">{photo.title}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onLike(photo.id); }}
              className="flex items-center gap-1 font-mono text-[11px] select-none transition-colors"
              style={{ color: photo.liked ? "#e8002d" : "#555", WebkitTapHighlightColor: "transparent" }}
            >
              <Icon name="Heart" size={13} className={photo.liked ? "fill-current" : ""} />
              <span>{photo.likes}</span>
            </button>
            <div className="flex items-center gap-1 font-mono text-[11px] text-gray-400">
              <Icon name="Eye" size={12} />
              {photo.views.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ADMIN_PASSWORD = "89132543946Mama";

export default function Index() {
  const [apiPhotos, setApiPhotos] = useState<PhotoWithApi[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithApi | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loadingApi, setLoadingApi] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem("admin_ok") === "1");
  const sessionId = getSessionId();

  const loadPhotos = useCallback(async () => {
    try {
      const data = await fetchPhotos();
      const fresh = data.map(apiToPhoto);
      setApiPhotos((prev) => {
        const freshMap = new Map(fresh.map((f) => [f.id, f]));
        const merged = prev.map((old) => {
          const f = freshMap.get(old.id);
          return f ? { ...f, liked: old.liked, likes: Math.max(f.likes, old.likes), views: Math.max(f.views, old.views) } : old;
        });
        const existingIds = new Set(prev.map((p) => p.id));
        const newOnes = fresh.filter((f) => !existingIds.has(f.id));
        return [...newOnes, ...merged];
      });
    } catch (_e) { /* fallback */ } finally { setLoadingApi(false); }
  }, []);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") loadPhotos();
    }, 10000);
    const onVisible = () => { if (document.visibilityState === "visible") loadPhotos(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [loadPhotos]);

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
    if (!isAdmin) return;
    const photo = allPhotos.find((p) => p.id === id);
    if (!photo?._apiId) return;
    if (!confirm("Удалить это фото?")) return;
    setApiPhotos((prev) => prev.filter((p) => p.id !== id));
    setSelectedPhoto(null);
    try { await deletePhoto(photo._apiId, ADMIN_PASSWORD); } catch { loadPhotos(); }
  };

  const handleAdminLogin = () => {
    const pwd = prompt("Введите пароль администратора:");
    if (pwd === ADMIN_PASSWORD) {
      localStorage.setItem("admin_ok", "1");
      setIsAdmin(true);
    } else if (pwd !== null) {
      alert("Неверный пароль");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_ok");
    setIsAdmin(false);
  };

  const currentIndex = selectedPhoto ? allPhotos.findIndex((p) => p.id === selectedPhoto.id) : -1;
  const handlePrev = () => { if (currentIndex > 0) setSelectedPhoto(allPhotos[currentIndex - 1]); };
  const handleNext = () => { if (currentIndex < allPhotos.length - 1) setSelectedPhoto(allPhotos[currentIndex + 1]); };
  const totalLikes = allPhotos.reduce((acc, p) => acc + p.likes, 0);
  const totalViews = allPhotos.reduce((acc, p) => acc + p.views, 0);

  return (
    <div className="min-h-screen" style={{ background: "#1a00cc" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-40 nav-blur">
        <div className="max-w-2xl mx-auto px-4 h-13 flex items-center justify-between gap-3" style={{ height: "52px" }}>
          <div className="flex items-center gap-2">
            {/* Лисичка */}
            <img
              src="https://cdn.poehali.dev/files/e0676edc-9002-4ae9-8934-4099ea16d7cf.png"
              alt="fox"
              className="w-10 h-10 object-contain flex-shrink-0"
              style={{ imageRendering: "pixelated" }}
            />
            {/* Логотип */}
            <div className="flex items-center gap-0.5">
              <span className="font-mono text-base font-bold text-white/40">[</span>
              <span className="font-mono text-base font-bold text-white tracking-tight">НаТворче</span>
              <span className="font-mono text-base font-bold text-white/40">]</span>
            </div>
            <span className="hidden sm:inline font-mono text-[10px] text-[#e8ff5a] border border-[#e8ff5a]/40 px-1.5 py-0.5">СО «Алтай»</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Icon name="Heart" size={10} className="text-[#e8ff5a]" />
              {totalLikes}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="Eye" size={10} />
              {totalViews}
            </span>
            <button
              onClick={isAdmin ? handleAdminLogout : handleAdminLogin}
              className="flex items-center gap-1 hover:text-white/80 transition-colors"
              title={isAdmin ? "Выйти из режима админа" : "Вход админа"}
            >
              <Icon name={isAdmin ? "ShieldCheck" : "Shield"} size={12} className={isAdmin ? "text-[#e8ff5a]" : ""} />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "#2200ee" }}>
        <div className="absolute inset-0 pointer-events-none photo-noise" />
        <div className="max-w-2xl mx-auto px-5 py-8 relative z-10">
          <div className="font-mono text-[10px] text-white/50 tracking-[0.3em] uppercase mb-3">
            [ творческий фестиваль 2026 ]
          </div>
          <p className="font-mono text-white leading-relaxed mb-5"
            style={{ fontSize: "clamp(0.95rem, 3vw, 1.2rem)" }}
          >
            Делись самыми яркими моментами с фестиваля — пусть эти мгновения оживут снова!
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="retro-btn-yellow px-5 py-2 text-xs font-mono uppercase tracking-widest"
          >
            [ поделиться фото ]
          </button>
        </div>
        {/* Бегущая строка */}
        <div className="ticker-wrap border-t border-white/20 py-2 text-white/40 font-mono text-xs">
          <div className="ticker">
            {"ААААААААААААЛТАЙ] 4 – 3 – 2 [ААААААААААА ТВОРЧЕСКИЙ ФЕСТИВАЛЬ 2026 [ ААААААААААААЛТАЙ] 4 – 3 – 2 [ААААААААААА ТВОРЧЕСКИЙ ФЕСТИВАЛЬ 2026 ".repeat(2)}
          </div>
        </div>
      </section>

      {/* ЛЕНТА ФОТО — как в соцсети */}
      <main className="max-w-2xl mx-auto px-0 sm:px-4 py-4 pb-28">
        {loadingApi && apiPhotos.length === 0 && (
          <div className="flex items-center gap-3 py-8 font-mono text-sm text-white/50 px-4">
            <Icon name="Loader2" size={16} className="animate-spin" />
            ЗАГРУЗКА...
          </div>
        )}

        <div className="flex flex-col gap-0 sm:gap-3 divide-y-4 sm:divide-y-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
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
            <p>[ пока нет фото — будь первым! ]</p>
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
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < allPhotos.length - 1}
        canDelete={isAdmin && !!selectedPhoto?._apiId}
        onDelete={selectedPhoto ? () => handleDelete(selectedPhoto.id) : undefined}
      />

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={loadPhotos} />
      )}
    </div>
  );
}