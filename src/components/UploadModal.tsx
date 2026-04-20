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
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

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
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") && !file.name.match(/\.(heic|heif)$/i)) {
      setError("Выберите файл изображения");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("Файл не должен превышать 100 МБ");
      return;
    }
    setError("");
    setCompressing(true);
    setPreview(null);
    try {
      const { b64, previewUrl } = await fileToJpegB64(file);
      setImageB64(b64);
      setPreview(previewUrl);
    } catch {
      setError("Не удалось обработать изображение");
    } finally {
      setCompressing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Введите название фото"); return; }
    if (!imageB64) { setError("Выберите фотографию"); return; }
    setLoading(true);
    setError("");
    try {
      await uploadPhoto({ title: title.trim(), image_b64: imageB64, content_type: "image/jpeg" });
      onUploaded();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div
        className="relative z-10 w-full sm:max-w-lg sm:mx-4 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{ background: "hsl(220, 18%, 9%)", border: "1px solid hsl(220, 15%, 18%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center">
              <Icon name="Upload" size={13} className="text-white" />
            </div>
            <h2 className="font-display text-xl text-foreground">Добавить фото</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <Icon name="X" size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div
            className={`relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
              dragOver ? "border-purple-500/70 bg-purple-500/8"
              : preview ? "border-border"
              : "border-border hover:border-purple-500/40"
            }`}
            style={{ minHeight: "160px" }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {compressing ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Icon name="Loader2" size={28} className="animate-spin text-purple-400" />
                <p className="text-muted-foreground text-sm font-body">Обрабатываю фото...</p>
              </div>
            ) : preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-sm font-body">Нажмите чтобы заменить</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                <div className="w-12 h-12 rounded-xl bg-white/4 border border-border flex items-center justify-center">
                  <Icon name="ImagePlus" size={22} />
                </div>
                <div className="text-center px-4">
                  <p className="text-sm font-body text-foreground">Нажмите чтобы выбрать</p>
                  <p className="text-xs mt-1">JPG, PNG, HEIC, WebP и другие · до 100 МБ</p>
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

          <div>
            <label className="text-xs text-muted-foreground font-body mb-1.5 block">Название *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название вашей фотографии"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm font-body placeholder:text-muted-foreground/50 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {error && (
            <p className="text-rose-400 text-sm font-body flex items-center gap-2">
              <Icon name="AlertCircle" size={14} />
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || compressing}
            className="w-full py-3.5 rounded-xl font-body font-medium text-sm text-white bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 hover:opacity-90 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Icon name="Loader2" size={16} className="animate-spin" />Загружаю...</>
            : compressing ? <><Icon name="Loader2" size={16} className="animate-spin" />Обрабатываю...</>
            : <><Icon name="Upload" size={16} />Опубликовать фото</>}
          </button>
        </div>
      </div>
    </div>
  );
}
