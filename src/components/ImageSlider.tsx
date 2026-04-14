import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getImageUrl } from '../lib/utils';
import { useSwipe } from '../hooks/useSwipe';

interface ImageSliderProps {
  images: string[];
  address: string;
}

const ERROR_SRC = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="14">Error</text></svg>';

function useImageError() {
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [retried, setRetried] = useState<Set<string>>(new Set());

  const handleError = useCallback((src: string, el: HTMLImageElement) => {
    if (!retried.has(src)) {
      setRetried((prev) => new Set(prev).add(src));
      el.src = src + (src.includes('?') ? '&' : '?') + 'r=1';
    } else {
      setFailed((prev) => new Set(prev).add(src));
      el.src = ERROR_SRC;
    }
  }, [retried]);

  return { failed, handleError };
}

export function ImageSlider({ images, address }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const { handleError } = useImageError();

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const swipe = useSwipe(goToNext, goToPrevious);
  const swipeFullscreen = useSwipe(goToNext, goToPrevious);

  if (images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-t-xl">
        <span className="text-gray-400">Sin imágenes</span>
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') setFullscreen(false);
  };

  const handleSliderClick = () => {
    if (!swipe.isSwiping()) {
      setFullscreen(true);
    }
  };

  return (
    <>
      {/* Slider normal */}
      <div className="relative group">
        <div
          className="w-full h-72 md:h-96 cursor-pointer bg-[var(--color-bg-secondary)] select-none"
          onClick={handleSliderClick}
          onTouchStart={swipe.onTouchStart}
          onTouchMove={swipe.onTouchMove}
          onTouchEnd={swipe.onTouchEnd}
          onMouseDown={swipe.onMouseDown}
          onMouseMove={swipe.onMouseMove}
          onMouseUp={swipe.onMouseUp}
          onMouseLeave={swipe.onMouseLeave}
        >
          <img
            src={getImageUrl(images[currentIndex])}
            alt={`${address} - Foto ${currentIndex + 1}`}
            className="w-full h-full object-cover pointer-events-none"
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
            onError={(e) => handleError(getImageUrl(images[currentIndex]), e.target as HTMLImageElement)}
          />
        </div>

        {/* Controles */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Indicador */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 p-2 overflow-x-auto bg-gray-100">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all bg-[var(--color-bg-secondary)] ${
                  idx === currentIndex ? 'border-blue-500' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={getImageUrl(img)}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none"
          onClick={() => { if (!swipeFullscreen.isSwiping()) setFullscreen(false); }}
          onKeyDown={handleKeyDown}
          onTouchStart={swipeFullscreen.onTouchStart}
          onTouchMove={swipeFullscreen.onTouchMove}
          onTouchEnd={swipeFullscreen.onTouchEnd}
          onMouseDown={swipeFullscreen.onMouseDown}
          onMouseMove={swipeFullscreen.onMouseMove}
          onMouseUp={swipeFullscreen.onMouseUp}
          onMouseLeave={swipeFullscreen.onMouseLeave}
          tabIndex={0}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X size={32} />
          </button>

          <img
            src={getImageUrl(images[currentIndex])}
            alt={`${address} - Foto ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain pointer-events-none"
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-lg">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
