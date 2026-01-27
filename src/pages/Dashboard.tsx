import { useState, useMemo } from 'react';
import { Plus, Search, FileUp } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyForm } from '../components/PropertyForm';
import { ImportModal } from '../components/ImportModal';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import type { PropertyStatus, Property } from '../types';
import { STATUS_LABELS } from '../types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[var(--color-pending)] text-[var(--color-pending-text)] border-[var(--color-pending)]',
  contacted: 'bg-[var(--color-contacted)] text-[var(--color-contacted-text)] border-[var(--color-contacted)]',
  visited: 'bg-[var(--color-visited)] text-[var(--color-visited-text)] border-[var(--color-visited)]',
  favorite: 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)] border-[var(--color-favorite)]',
  discarded: 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)] border-[var(--color-discarded)]',
};

export function Dashboard() {
  const { properties, loading, addProperty } = useProperties();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'sqm'>('date');

  const sortOptions = [
    { value: 'date', label: 'Recientes' },
    { value: 'price', label: 'Precio' },
    { value: 'sqm', label: 'Superficie' },
  ];

  const filteredProperties = useMemo(() => {
    let result = properties;

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.address.toLowerCase().includes(searchLower) ||
          p.zone?.toLowerCase().includes(searchLower) ||
          p.title?.toLowerCase().includes(searchLower) ||
          p.contact.agency?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'sqm':
          return (b.builtSquareMeters || b.squareMeters) - (a.builtSquareMeters || a.squareMeters);
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return result;
  }, [properties, search, statusFilter, sortBy]);

  const handleAddProperty = async (data: Parameters<typeof addProperty>[0]) => {
    await addProperty(data);
    setShowForm(false);
  };

  const handleImportProperties = async (importedProperties: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    for (const property of importedProperties) {
      await addProperty(property);
    }
    setShowImport(false);
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: properties.length };
    properties.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [properties]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-text-tertiary)]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[85rem] mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-3xl font-medium text-[var(--color-text)] mb-1"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Propiedades
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            {properties.length} {properties.length === 1 ? 'propiedad guardada' : 'propiedades guardadas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <FileUp size={16} strokeWidth={1.5} className="mr-2" />
            Importar
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} strokeWidth={1.5} className="mr-2" />
            Nueva
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
            />
            <input
              type="text"
              placeholder="Buscar por zona, dirección..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md text-sm placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-border-strong)] focus:ring-0 transition-colors"
            />
          </div>
          <div className="flex gap-1 p-1 bg-[var(--color-bg-secondary)] rounded-md">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as typeof sortBy)}
                className={`px-3 py-1 text-sm rounded transition-all ${
                  sortBy === option.value
                    ? 'bg-white text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-sm rounded-md border transition-all ${
              statusFilter === 'all'
                ? 'bg-[var(--color-text)] text-white border-[var(--color-text)]'
                : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
            }`}
          >
            Todas ({statusCounts.all})
          </button>
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status as PropertyStatus)}
              className={`px-3 py-1 text-sm rounded-md border transition-all ${
                statusFilter === status
                  ? STATUS_STYLES[status]
                  : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              {label} ({statusCounts[status] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Property Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-20">🏠</div>
          <h3
            className="text-lg text-[var(--color-text-secondary)] mb-2"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {properties.length === 0
              ? 'Sin propiedades'
              : 'Sin resultados'}
          </h3>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {properties.length === 0
              ? 'Añade tu primera propiedad para empezar'
              : 'Prueba con otros filtros'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nueva propiedad"
      >
        <PropertyForm
          onSubmit={handleAddProperty}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImportProperties}
      />
    </div>
  );
}
