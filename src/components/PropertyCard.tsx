import { Link } from 'react-router-dom';
import { MapPin, Maximize, BedDouble, Bath, Building, Car, Wrench, Calendar } from 'lucide-react';
import type { Property } from '../types';
import { STATUS_LABELS } from '../types';
import { formatPrice, getImageUrl } from '../lib/utils';

interface PropertyCardProps {
  property: Property;
  selected?: boolean;
  onSelect?: (id: string) => void;
  selectable?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[var(--color-pending)] text-[var(--color-pending-text)]',
  contacted: 'bg-[var(--color-contacted)] text-[var(--color-contacted-text)]',
  visited: 'bg-[var(--color-visited)] text-[var(--color-visited-text)]',
  favorite: 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)]',
  discarded: 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)]',
};

export function PropertyCard({ property, selected, onSelect, selectable }: PropertyCardProps) {
  const pricePerMeter = property.pricePerMeter || (property.squareMeters > 0 ? Math.round(property.price / property.squareMeters) : 0);
  const displaySize = property.builtSquareMeters || property.squareMeters;

  return (
    <div
      className={`
        group rounded-lg overflow-hidden transition-all duration-200
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

      <Link to={`/property/${property.id}`} className="block">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-[var(--color-bg-secondary)] overflow-hidden">
          {property.photos && property.photos.length > 0 ? (
            <img
              src={getImageUrl(property.photos[0])}
              alt={property.address}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">
              <span className="text-4xl opacity-30">🏠</span>
            </div>
          )}

          {/* Status badge */}
          <span className={`
            absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-medium
            ${STATUS_STYLES[property.status]}
          `}>
            {STATUS_LABELS[property.status]}
          </span>

          {/* Days published */}
          {property.daysPublished > 0 && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs bg-black/60 text-white">
              {property.daysPublished}d
            </span>
          )}
        </div>

        {/* Content */}
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
            <span className="line-clamp-1">{property.zone || property.address}</span>
          </div>

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
            {property.needsRenovation && (
              <span className="notion-tag bg-[var(--color-discarded)] text-[var(--color-discarded-text)]">
                <Wrench size={10} className="mr-1" /> Reforma
              </span>
            )}
            {property.yearBuilt > 0 && (
              <span className="notion-tag bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]">
                <Calendar size={10} className="mr-1" /> {property.yearBuilt}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
