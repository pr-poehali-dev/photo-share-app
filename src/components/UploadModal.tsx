import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { CATEGORIES } from "@/data/photos";
import { uploadPhoto } from "@/api/photos";

interface UploadModalProps {
  onClose: () => void;
  onUploaded: () => void;
}

const PHOTO_CATEGORIES = CATEGORIES.filter((c) => c !== "Все");

export default function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState(PHOTO_CATEGORIES[0]);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string>("");
  const [contentType, setContentType] = useState("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Выберите файл изображения");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Файл не должен превышать 10 МБ");
      return;
    }
    setContentType(file.type);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      const base64 = result.split(",")[1];
      setImageB64(base64);
    };
    reader.readAsDataURL(file);
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
      await uploadPhoto({
        title: title.trim(),
        author: author.trim() || "Аноним",
        category,
        image_b64: imageB64,
        content_type: contentType,
      });
      onUploaded();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-scale-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div
        className="relative z-10 w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "hsl(220, 18%, 9%)", border: "1px solid hsl(220, 15%, 18%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center">
              <Icon name="Upload" size={13} className="text-white" />
            </div>
            <h2 className="font-display text-xl text-foreground">Добавить фото</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all"
          >
            <Icon name="X" size={14} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            className={`relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
              dragOver
                ? "border-purple-500/70 bg-purple-500/8"
                : preview
                ? "border-border"
                : "border-border hover:border-purple-500/40 hover:bg-white/2"
            }`}
            style={{ minHeight: "180px" }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-sm font-body">Нажмите чтобы заменить</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 gap-3 text-muted-foreground">
                <div className="w-12 h-12 rounded-xl bg-white/4 border border-border flex items-center justify-center">
                  <Icon name="ImagePlus" size={22} className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-body text-foreground">Перетащите или нажмите</p>
                  <p className="text-xs mt-1">JPG, PNG, WebP · до 10 МБ</p>
                </div>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
          />

          {/* Title */}
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1.5 block">Название *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название вашей фотографии"
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-body placeholder:text-muted-foreground/50 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Author + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1.5 block">Автор</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ваше имя"
                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-body placeholder:text-muted-foreground/50 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1.5 block">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-body focus:outline-none focus:border-purple-500/50 transition-colors"
              >
                {PHOTO_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-rose-400 text-sm font-body flex items-center gap-2">
              <Icon name="AlertCircle" size={14} />
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl font-body font-medium text-sm text-white bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin" />
                Загружаю...
              </>
            ) : (
              <>
                <Icon name="Upload" size={16} />
                Опубликовать фото
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
