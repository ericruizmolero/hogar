import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useProperties } from '../hooks/useProperties';
import { STATUS_LABELS } from '../types';
import type { Property } from '../types';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// San Sebastián center coordinates
const SAN_SEBASTIAN_CENTER: [number, number] = [43.3183, -1.9812];
const DEFAULT_ZOOM = 13;

// Format price for marker (e.g., "245K")
const formatPriceShort = (price: number): string => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`;
  }
  return `${Math.round(price / 1000)}K`;
};

// Status colors - vibrant for visibility on map
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#37352f', text: '#ffffff' },
  contacted: { bg: '#2383e2', text: '#ffffff' },
  visited: { bg: '#0d9488', text: '#ffffff' },
  favorite: { bg: '#ea580c', text: '#ffffff' },
  discarded: { bg: '#dc2626', text: '#ffffff' },
};

// Custom marker - circle with price
const createPriceIcon = (price: number, status: string) => {
  const priceText = formatPriceShort(price);
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="map-pin" style="
        position: relative;
        transform: translate(-50%, -50%);
      ">
        <div style="
          background: ${style.bg};
          color: ${style.text};
          width: 48px;
          height: 48px;
          border-radius: 50%;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          cursor: pointer;
        ">
          ${priceText}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -30],
  });
};

function FitBounds({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude);
    if (propertiesWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        propertiesWithCoords.map(p => [p.latitude!, p.longitude!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
    }
  }, [properties, map]);

  return null;
}

function PropertyPopup({ property }: { property: Property }) {
  const style = STATUS_STYLES[property.status] || STATUS_STYLES.pending;

  return (
    <div className="min-w-[220px]">
      <div
        className="text-[13px] font-medium mb-2 line-clamp-2"
        style={{ color: 'var(--color-text)' }}
      >
        {property.title || property.address}
      </div>
      <div
        className="text-xl font-semibold mb-2"
        style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-text)' }}
      >
        {property.price.toLocaleString('es-ES')} €
      </div>
      <div
        className="text-xs mb-3 flex items-center gap-1"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <span>{property.rooms} hab</span>
        <span style={{ color: 'var(--color-border-strong)' }}>·</span>
        <span>{property.squareMeters} m²</span>
        {property.floor && (
          <>
            <span style={{ color: 'var(--color-border-strong)' }}>·</span>
            <span>{property.floor}</span>
          </>
        )}
      </div>
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
        <span
          className="text-xs px-2 py-1 rounded"
          style={{ background: style.bg, color: style.text }}
        >
          {STATUS_LABELS[property.status]}
        </span>
        <Link
          to={`/property/${property.id}`}
          className="text-xs font-medium hover:underline"
          style={{ color: 'var(--color-accent)' }}
        >
          Ver detalles →
        </Link>
      </div>
    </div>
  );
}

// Extract neighborhood from zone or address
function extractNeighborhood(property: Property): string {
  const zone = property.zone || property.address || '';
  // Take the first meaningful part (usually the neighborhood)
  const parts = zone.split(',').map(p => p.trim());
  return parts[0] || 'Sin zona';
}

export function MapView() {
  const { properties, loading } = useProperties();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude);

  // Get unique zones/neighborhoods
  const zones = [...new Set(propertiesWithCoords.map(extractNeighborhood))].sort();

  // Apply both filters
  const filteredProperties = propertiesWithCoords.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesZone = zoneFilter === 'all' || extractNeighborhood(p) === zoneFilter;
    return matchesStatus && matchesZone;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-60px)]">
        <div className="text-gray-500">Cargando mapa...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
      {/* Filter bar */}
      <div className="bg-white border-b border-[var(--color-border)] px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">Estado:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-md transition ${
                statusFilter === 'all'
                  ? 'bg-[var(--color-text)] text-white'
                  : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
              }`}
            >
              Todas
            </button>
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const count = propertiesWithCoords.filter(p => p.status === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-2.5 py-1 text-xs rounded-md transition ${
                    statusFilter === key
                      ? 'bg-[var(--color-text)] text-white'
                      : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Zone filter */}
        {zones.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-tertiary)]">Barrio:</span>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="text-xs px-2 py-1 rounded-md border border-[var(--color-border)] bg-white text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              <option value="all">Todos ({propertiesWithCoords.length})</option>
              {zones.map(zone => {
                const count = propertiesWithCoords.filter(p => extractNeighborhood(p) === zone).length;
                return (
                  <option key={zone} value={zone}>
                    {zone} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Count */}
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="text-[var(--color-text-secondary)]">
            {filteredProperties.length} propiedad{filteredProperties.length !== 1 ? 'es' : ''}
          </span>
          {propertiesWithCoords.length < properties.length && (
            <span className="text-amber-600">
              {properties.length - propertiesWithCoords.length} sin ubicar
            </span>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={SAN_SEBASTIAN_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds properties={filteredProperties} />
          {filteredProperties.map((property) => (
            <Marker
              key={property.id}
              position={[property.latitude!, property.longitude!]}
              icon={createPriceIcon(property.price, property.status)}
            >
              <Popup>
                <PropertyPopup property={property} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
