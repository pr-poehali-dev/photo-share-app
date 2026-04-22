import { useState, useRef, useCallback } from "react";
import heic2any from "heic2any";
import Icon from "@/components/ui/icon";
import { uploadPhoto } from "@/api/photos";

interface UploadModalProps {
  onClose: () => void;
  onUploaded: () => void;
}

const MAX_SIDE = 1600;
const MAX_B64_BYTES = 3 * 1024 * 1024;

async function fileToJpegB64(file: File): Promise<{ b64: string; previewUrl: string }> {
  let blob: Blob = file;
  const isHeic = file.type === "image/heic" || file.type === "image/heif"
    || file.name.toLowerCase().endsWith(".heic")
    || file.name.toLowerCase().endsWith(".heif");
  if (isHeic) {
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
    blob = Array.isArray(converted) ? converted[0] : converted;
  }
  const previewUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_SIDE || height > MAX_SIDE) {
        if (width > height) { height = Math.round(height * MAX_SIDE / width); width = MAX_SIDE; }
        else { width = Math.round(width * MAX_SIDE / height); height = MAX_SIDE; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      let quality = 0.85;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length > MAX_B64_BYTES * 1.37 && quality > 0.3) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      resolve({ b64: dataUrl.split(",")[1], previewUrl });
    };
    img.onerror = reject;
    img.src = previewUrl;
  });
}

export default function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") && !file.name.match(/\.(heic|heif)$/i)) {
      setError("[ ОШИБКА ] Выберите файл изображения");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("[ ОШИБКА ] Файл не должен превышать 100 МБ");
      return;
    }
    setError(""); setCompressing(true); setPreview(null);
    try {
      const { b64, previewUrl } = await fileToJpegB64(file);
      setImageB64(b64); setPreview(previewUrl);
    } catch { setError("[ ОШИБКА ] Не удалось обработать изображение"); }
    finally { setCompressing(false); }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("[ ОШИБКА ] Введите название"); return; }
    if (!imageB64) { setError("[ ОШИБКА ] Выберите фотографию"); return; }
    setLoading(true); setError("");
    try {
      await uploadPhoto({ title: title.trim(), author: author.trim(), image_b64: imageB64, content_type: "image/jpeg" });
      onUploaded(); onClose();
    } catch (e: unknown) {
      setError(`[ ОШИБКА ] ${e instanceof Error ? e.message : "Ошибка загрузки"}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}
      style={{ background: "rgba(0,0,100,0.92)" }}
    >
      <div
        className="relative z-10 w-full sm:max-w-lg sm:mx-4 animate-scale-in overflow-hidden"
        style={{
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 0 40px rgba(0,0,200,0.4)",
          maxHeight: "95dvh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Titlebar */}
        <div className="win-titlebar flex-shrink-0">
          <div className="w-3 h-3 rounded-sm bg-white/30 flex-shrink-0" />
          <span className="flex-1 text-[11px]" style={{ fontFamily: "Tahoma, sans-serif" }}>
            загрузить фото — творческий фестиваль 2026
          </span>
          <div className="flex gap-0.5 ml-2">
            <div className="win-btn win-btn-close" onClick={onClose}>✕</div>
          </div>
        </div>

        <div className="p-5 space-y-4" style={{ background: "#1a00cc" }}>
          {/* Дроп-зона */}
          <div
            className="relative cursor-pointer overflow-hidden transition-all duration-150"
            style={{
              minHeight: "160px",
              border: dragOver ? "2px dashed #e8ff5a" : "2px dashed rgba(255,255,255,0.3)",
              background: dragOver ? "rgba(232,255,90,0.05)" : "rgba(255,255,255,0.05)",
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {compressing ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Icon name="Loader2" size={22} className="animate-spin text-white/50" />
                <p className="font-mono text-xs text-white/50 uppercase tracking-wider">ОБРАБОТКА...</p>
              </div>
            ) : preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="font-mono text-white text-xs uppercase tracking-wider">[ ЗАМЕНИТЬ ]</p>
                </div>
                <div className="absolute inset-0 pointer-events-none photo-noise" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-10 h-10 flex items-center justify-center" style={{ border: "1px solid rgba(255,255,255,0.3)" }}>
                  <Icon name="ImagePlus" size={18} className="text-white/50" />
                </div>
                <div className="text-center px-4">
                  <p className="font-mono text-xs text-white uppercase tracking-wider">[ НАЖМИТЕ ИЛИ ПЕРЕТАЩИТЕ ]</p>
                  <p className="font-mono text-xs text-white/40 mt-1">JPG · PNG · HEIC · WEBP · до 100 МБ</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
          />

          {/* Поле названия */}
          <div>
            <label className="font-mono text-xs text-white/50 uppercase tracking-wider mb-1.5 block">
              &gt; НАЗВАНИЕ *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ВВЕДИТЕ НАЗВАНИЕ..."
              className="retro-input w-full px-3 py-2.5 text-sm uppercase tracking-wide"
            />
          </div>

          {/* Поле имени */}
          <div>
            <label className="font-mono text-xs text-white/50 uppercase tracking-wider mb-1.5 block">
              &gt; ВАШЕ ИМЯ (необязательно)
            </label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="КАК ВАС ЗОВУТ..."
              className="retro-input w-full px-3 py-2.5 text-sm tracking-wide"
            />
          </div>

          {/* Ошибка */}
          {error && (
            <p className="font-mono text-xs flex items-center gap-2" style={{ color: "#ff6666" }}>
              <Icon name="AlertCircle" size={12} />
              {error}
            </p>
          )}

          {/* Кнопка */}
          <button
            onClick={handleSubmit}
            disabled={loading || compressing}
            className="w-full py-3 text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-mono transition-colors"
            style={{ background: "#e8ff5a", color: "#1a00cc", border: "none" }}
          >
            {loading ? (
              <><Icon name="Loader2" size={14} className="animate-spin" /> ЗАГРУЗКА...</>
            ) : compressing ? (
              <><Icon name="Loader2" size={14} className="animate-spin" /> ОБРАБОТКА...</>
            ) : (
              <><Icon name="Upload" size={14} /> [ ОПУБЛИКОВАТЬ ]</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}