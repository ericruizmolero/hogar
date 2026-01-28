import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { geocodeProperty } from '../utils/geocode';

// San Sebastián center
const DEFAULT_CENTER: [number, number] = [43.3183, -1.9812];
const DEFAULT_ZOOM = 14;

// Custom draggable marker
const createDraggableIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: #2383e2;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg) translate(-50%, -50%);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        cursor: grab;
      "></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}

function DraggableMarker({ position, onPositionChange }: DraggableMarkerProps) {
  const [markerPosition, setMarkerPosition] = useState(position);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  const eventHandlers = {
    dragend(e: L.DragEndEvent) {
      const marker = e.target;
      const pos = marker.getLatLng();
      setMarkerPosition([pos.lat, pos.lng]);
      onPositionChange(pos.lat, pos.lng);
    },
  };

  return (
    <Marker
      position={markerPosition}
      draggable={true}
      eventHandlers={eventHandlers}
      icon={createDraggableIcon()}
    />
  );
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function CenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lat: number, lng: number) => Promise<void>;
  initialLat?: number;
  initialLng?: number;
  address?: string;
  title?: string;
  zone?: string;
  notes?: string;
}

export function LocationPicker({
  isOpen,
  onClose,
  onSave,
  initialLat,
  initialLng,
  address,
  title,
  zone,
  notes,
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : DEFAULT_CENTER
  );
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialLat && initialLng) {
        setPosition([initialLat, initialLng]);
      } else {
        setPosition(DEFAULT_CENTER);
      }
    }
  }, [isOpen, initialLat, initialLng]);

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition([lat, lng]);
  };

  const handleAutoLocate = async () => {
    setSearching(true);
    try {
      const coords = await geocodeProperty(address || '', title || '', zone || '', notes);
      if (coords) {
        setPosition([coords.lat, coords.lon]);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(position[0], position[1]);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ubicar propiedad">
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Arrastra el pin o haz clic en el mapa para ubicar la propiedad.
        </p>

        <div className="h-[400px] rounded-lg overflow-hidden border border-[var(--color-border)]">
          <MapContainer
            center={position}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker position={position} onPositionChange={handlePositionChange} />
            <ClickHandler onClick={handlePositionChange} />
            <CenterMap position={position} />
          </MapContainer>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
          <span>
            <MapPin size={12} className="inline mr-1" />
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </span>
          <button
            onClick={handleAutoLocate}
            disabled={searching}
            className="flex items-center gap-1 text-[var(--color-accent)] hover:underline disabled:opacity-50"
          >
            {searching ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search size={12} />
                Buscar automáticamente
              </>
            )}
          </button>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Guardando...' : 'Guardar ubicación'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
