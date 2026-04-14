import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Maximize, BedDouble, Bath, Building, Car, Wrench, Calendar, Archive, ExternalLink, Map } from 'lucide-react';
import type { Property, Visit } from '../types';
import { STATUS_LABELS, RENOVATION_LABELS } from '../types';
import { formatPrice, getImageUrl, getProviderLabel } from '../lib/utils';
import { evaluateProperty, getScoreColor, getScoreBgColor } from '../lib/requirements';
import { MortgageWidget } from './MortgageWidget';
import { useSwipe } from '../hooks/useSwipe';

interface PropertyCardProps {
  property: Property;
  selected?: boolean;
  onSelect?: (id: string) => void;
  selectable?: boolean;
  onArchive?: (id: string) => Promise<void>;
  showMortgageWidget?: boolean;
  nextVisit?: Visit;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[var(--color-pending)] text-[var(--color-pending-text)]',
  contacted: 'bg-[var(--color-contacted)] text-[var(--color-contacted-text)]',
  visited: 'bg-[var(--color-visited)] text-[var(--color-visited-text)]',
  favorite: 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)]',
  discarded: 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)]',
};

export function PropertyCard({ property, selected, onSelect, selectable, onArchive, showMortgageWidget = false, nextVisit }: PropertyCardProps) {
  const [archiving, setArchiving] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const pricePerMeter = property.pricePerMeter || (property.squareMeters > 0 ? Math.round(property.price / property.squareMeters) : 0);
  const displaySize = property.builtSquareMeters || property.squareMeters;

  const photos = property.photos || [];
  const hasMultiplePhotos = photos.length > 1;

  const goNext = useCallback(() => {
    setPhotoIndex((i) => (i >= photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setPhotoIndex((i) => (i <= 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  const swipe = useSwipe(goNext, goPrev);

  // Evaluate property against requirements
  const evaluation = useMemo(() => evaluateProperty(property), [property]);

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onArchive) {
      setArchiving(true);
      await onArchive(property.id);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // If user just swiped, don't navigate
    if (swipe.isSwiping()) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      className={`
        group rounded-lg overflow-hidden transition-all duration-200 border border-[var(--color-border)] shadow-sm
        ${selected
          ? 'ring-2 ring-[var(--color-accent)] bg-[var(--color-bg-hover)]'
          : 'hover:bg-[var(--color-bg-hover)]'
        }
      `}
    >
      {selectable && (
        <div className="px-3 py-2 border-b border-[var(--color-border)]">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect?.(property.id)}
            />
            <span>Comparar</span>
          </label>
        </div>
      )}

      <Link to={`/property/${property.id}`} className="block" onClick={handleImageClick}>
        {/* Image carousel */}
        <div
          className="relative aspect-[4/3] bg-[var(--color-bg-secondary)] overflow-hidden select-none"
          {...(hasMultiplePhotos ? {
            onTouchStart: swipe.onTouchStart,
            onTouchMove: swipe.onTouchMove,
            onTouchEnd: swipe.onTouchEnd,
            onMouseDown: swipe.onMouseDown,
            onMouseMove: swipe.onMouseMove,
            onMouseUp: swipe.onMouseUp,
            onMouseLeave: swipe.onMouseLeave,
          } : {})}
        >
          {photos.length > 0 ? (
            <img
              src={getImageUrl(photos[photoIndex])}
              alt={property.address}
              className="w-full h-full object-cover pointer-events-none"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              draggable={false}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                if (!el.dataset.retried) {
                  el.dataset.retried = '1';
                  el.src = el.src + (el.src.includes('?') ? '&' : '?') + 'r=1';
                } else {
                  el.style.display = 'none';
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">
              <span className="text-4xl opacity-30">🏠</span>
            </div>
          )}

          {/* Photo dots indicator */}
          {hasMultiplePhotos && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-[3px]">
              {photos.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-200 ${
                    i === photoIndex ? 'w-1 h-1 bg-white' : 'w-1 h-1 bg-white/35'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Status badge + visit tag */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[property.status]}`}>
              {STATUS_LABELS[property.status]}
            </span>
            {nextVisit && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-favorite)] text-[var(--color-favorite-text)] flex items-center gap-1">
                <Calendar size={10} />
                {nextVisit.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} {nextVisit.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Score badge */}
          <div
            className="absolute bottom-3 left-3 px-2 py-1 rounded text-xs font-bold"
            style={{
              background: getScoreBgColor(evaluation.score),
              color: getScoreColor(evaluation.score),
            }}
            title={`${evaluation.results.filter(r => r.met).length}/${evaluation.results.length} requisitos`}
          >
            {evaluation.score}%
          </div>

          {/* Days published */}
          {property.daysPublished > 0 && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs bg-black/60 text-white">
              {property.daysPublished}d
            </span>
          )}

          {/* Archive button */}
          {onArchive && (
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="p-2 bg-white/90 hover:bg-[var(--color-text)] hover:text-white text-[var(--color-text-secondary)] rounded-md shadow-md transition-colors disabled:opacity-50"
                title="Archivar"
              >
                <Archive size={16} />
              </button>
            </div>
          )}
        </div>
      </Link>

      {/* Content - separate Link so swipe on image doesn't conflict */}
      <Link to={`/property/${property.id}`} className="block">
        <div className="p-4">
          {/* Price */}
          <div className="flex items-baseline justify-between mb-2">
            <h3
              className="text-xl font-medium text-[var(--color-text)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {formatPrice(property.price)}
            </h3>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {formatPrice(pricePerMeter)}/m²
            </span>
          </div>

          {/* Title */}
          {property.title && (
            <p className="text-sm text-[var(--color-text)] line-clamp-1 mb-1">
              {property.title}
            </p>
          )}

          {/* Location */}
          <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-sm mb-3">
            <MapPin size={14} strokeWidth={1.5} className="flex-shrink-0" />
            <span className="line-clamp-1 flex-1">{property.zone || property.address}</span>
            {property.latitude && property.longitude && (
              <span
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = '/map'; }}
                className="flex-shrink-0 p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
                title="Ver en mapa"
              >
                <Map size={13} strokeWidth={1.5} />
              </span>
            )}
          </div>

          {/* Link to provider */}
          {property.url && (
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(property.url, '_blank', 'noopener,noreferrer');
              }}
              className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline mb-3 cursor-pointer"
            >
              <ExternalLink size={12} strokeWidth={1.5} />
              Ver en {getProviderLabel(property.url)}
            </span>
          )}

          {/* Main features */}
          <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)] mb-3">
            <div className="flex items-center gap-1.5">
              <Maximize size={14} strokeWidth={1.5} />
              <span>{displaySize} m²</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BedDouble size={14} strokeWidth={1.5} />
              <span>{property.rooms}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath size={14} strokeWidth={1.5} />
              <span>{property.bathrooms}</span>
            </div>
            {property.floor && (
              <div className="flex items-center gap-1.5">
                <Building size={14} strokeWidth={1.5} />
                <span>{property.floor}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {property.terrace && (
              <span className="notion-tag bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                Terraza
              </span>
            )}
            {property.balcony && (
              <span className="notion-tag bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                Balcón
              </span>
            )}
            {property.elevator && (
              <span className="notion-tag bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                Ascensor
              </span>
            )}
            {property.parkingIncluded && (
              <span className="notion-tag bg-[var(--color-visited)] text-[var(--color-visited-text)]">
                <Car size={10} className="mr-1" /> Incluido
              </span>
            )}
            {property.parkingOptional && (
              <span className="notion-tag bg-[var(--color-favorite)] text-[var(--color-favorite-text)]">
                <Car size={10} className="mr-1" /> Opcional
              </span>
            )}
            {property.needsRenovation && property.needsRenovation !== 'no' && (
              <span className={`notion-tag ${
                property.needsRenovation === 'total'
                  ? 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)]'
                  : 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)]'
              }`}>
                <Wrench size={10} className="mr-1" /> {RENOVATION_LABELS[property.needsRenovation]}
              </span>
            )}
            {property.yearBuilt > 0 && (
              <span className="notion-tag bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]">
                <Calendar size={10} className="mr-1" /> {property.yearBuilt}
              </span>
            )}
          </div>

          {/* Widget de hipoteca */}
          {showMortgageWidget && (
            <div className="mt-3" onClick={(e) => e.preventDefault()}>
              <MortgageWidget
                propertyPrice={property.price}
                renovationType={property.needsRenovation}
              />
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
