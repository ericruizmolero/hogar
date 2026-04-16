import { useRef, useState } from 'react';
import { Upload, X, Link2, Loader2, Plus } from 'lucide-react';
import { fileToCompressedDataUrl } from '../lib/storage';
import { getImageUrl } from '../lib/utils';
import { Button } from './ui/Button';

interface PhotoManagerProps {
  propertyId: string;
  photos: string[];
  onChange: (photos: string[]) => Promise<void> | void;
}

// Firestore tiene un límite de 1 MB por documento: limitamos cada foto a 700 KB para dejar margen.
const MAX_PHOTO_BYTES = 700 * 1024;

export function PhotoManager({ photos, onChange }: PhotoManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [urlMode, setUrlMode] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    const added: string[] = [];
    const skipped: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        let dataUrl = await fileToCompressedDataUrl(file, { maxWidth: 1200, quality: 0.8 });
        // Si sigue siendo demasiado grande, intenta con más compresión / menor resolución
        if (dataUrl.length > MAX_PHOTO_BYTES) {
          dataUrl = await fileToCompressedDataUrl(file, { maxWidth: 1000, quality: 0.7 });
        }
        if (dataUrl.length > MAX_PHOTO_BYTES) {
          dataUrl = await fileToCompressedDataUrl(file, { maxWidth: 800, quality: 0.65 });
        }
        if (dataUrl.length > MAX_PHOTO_BYTES) {
          skipped.push(file.name);
          setProgress({ done: i + 1, total: files.length });
          continue;
        }
        added.push(dataUrl);
        setProgress({ done: i + 1, total: files.length });
      }
      if (added.length > 0) {
        await onChange([...photos, ...added]);
      }
      if (skipped.length > 0) {
        setError(`No se pudieron añadir (demasiado grandes tras comprimir): ${skipped.join(', ')}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar las fotos');
    } finally {
      setUploading(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (index: number) => {
    const next = photos.filter((_, i) => i !== index);
    await onChange(next);
  };

  const handleAddUrl = async () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    setError('');
    try {
      new URL(trimmed);
    } catch {
      setError('URL no válida');
      return;
    }
    await onChange([...photos, trimmed]);
    setNewUrl('');
    setUrlMode(false);
  };

  return (
    <div className="space-y-3">
      {/* Thumbnails grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((photo, idx) => (
            <div
              key={`${photo}-${idx}`}
              className="group relative aspect-square rounded-md overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
            >
              <img
                src={getImageUrl(photo)}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = '0.3';
                }}
              />
              {idx === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white">
                  Portada
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-[var(--color-discarded)] hover:text-[var(--color-discarded-text)] text-white rounded-md opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity"
                style={{ opacity: 1 }}
                title="Eliminar foto"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add controls */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          type="button"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="mr-1.5 animate-spin" />
              Procesando {progress ? `${progress.done}/${progress.total}` : '...'}
            </>
          ) : (
            <>
              <Upload size={14} className="mr-1.5" />
              Añadir desde dispositivo
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setUrlMode(!urlMode)}
          disabled={uploading}
          type="button"
        >
          <Link2 size={14} className="mr-1.5" />
          Añadir URL
        </Button>
      </div>

      {urlMode && (
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-accent)]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
          />
          <Button size="sm" onClick={handleAddUrl} type="button">
            <Plus size={14} className="mr-1" />
            Añadir
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-[var(--color-discarded-text)]">{error}</p>}

      {photos.length === 0 && (
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Sin fotos. Sube una imagen desde tu dispositivo o pega la URL de una foto.
        </p>
      )}
    </div>
  );
}
