import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, Trash2, MapPin, Maximize, BedDouble } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { formatPrice, getImageUrl } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { STATUS_LABELS } from '../types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[var(--color-pending)] text-[var(--color-pending-text)]',
  contacted: 'bg-[var(--color-contacted)] text-[var(--color-contacted-text)]',
  visited: 'bg-[var(--color-visited)] text-[var(--color-visited-text)]',
  favorite: 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)]',
  discarded: 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)]',
};

export function Archived() {
  const { archivedProperties, unarchiveProperty, deleteProperty, loading } = useProperties();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await deleteProperty(deleteId);
    setDeleting(false);
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-text-tertiary)]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[85rem] mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <h1
          className="text-3xl font-medium text-[var(--color-text)] mb-1"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Archivados
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          {archivedProperties.length} {archivedProperties.length === 1 ? 'propiedad archivada' : 'propiedades archivadas'}
        </p>
      </div>

      {archivedProperties.length === 0 ? (
        <div className="text-center py-16">
          <Archive size={48} strokeWidth={1} className="mx-auto text-[var(--color-text-tertiary)] mb-4 opacity-30" />
          <h3
            className="text-lg text-[var(--color-text-secondary)] mb-2"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Sin archivados
          </h3>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Las propiedades que archives aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {archivedProperties.map((property) => {
            const displaySize = property.builtSquareMeters || property.squareMeters;
            return (
              <div
                key={property.id}
                className="group flex items-center gap-4 p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                {/* Thumbnail */}
                <Link to={`/property/${property.id}`} className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-[var(--color-bg-secondary)]">
                    {property.photos?.[0] ? (
                      <img
                        src={getImageUrl(property.photos[0])}
                        alt={property.address}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg opacity-20">🏠</div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <Link to={`/property/${property.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-base font-medium text-[var(--color-text)]"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {formatPrice(property.price)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[property.status]}`}>
                      {STATUS_LABELS[property.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] truncate">
                    <MapPin size={12} strokeWidth={1.5} className="flex-shrink-0" />
                    <span className="truncate">{property.zone || property.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    {displaySize > 0 && (
                      <span className="flex items-center gap-1">
                        <Maximize size={10} /> {displaySize} m²
                      </span>
                    )}
                    {property.rooms > 0 && (
                      <span className="flex items-center gap-1">
                        <BedDouble size={10} /> {property.rooms} hab
                      </span>
                    )}
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => unarchiveProperty(property.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-visited)] hover:text-[var(--color-visited-text)] transition-colors"
                    title="Desarchivar"
                  >
                    <ArchiveRestore size={14} />
                    Restaurar
                  </button>
                  <button
                    onClick={() => setDeleteId(property.id)}
                    className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-discarded-text)] hover:bg-[var(--color-discarded)] rounded-md transition-colors"
                    title="Eliminar definitivamente"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar definitivamente">
        <p className="text-[var(--color-text-secondary)] mb-4">
          ¿Eliminar esta propiedad? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
