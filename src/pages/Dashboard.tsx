import { useState, useMemo } from 'react';
import { Plus, Search, FileUp, Target, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { useVisits } from '../hooks/useVisits';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyForm } from '../components/PropertyForm';
import { ImportModal } from '../components/ImportModal';
import { QuickSearch } from '../components/QuickSearch';
import { MiniCalendar } from '../components/MiniCalendar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { evaluateProperty } from '../lib/requirements';
import type { PropertyStatus, Property, Visit } from '../types';
import { STATUS_LABELS } from '../types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[var(--color-pending)] text-[var(--color-pending-text)] border-[var(--color-pending)]',
  contacted: 'bg-[var(--color-contacted)] text-[var(--color-contacted-text)] border-[var(--color-contacted)]',
  visited: 'bg-[var(--color-visited)] text-[var(--color-visited-text)] border-[var(--color-visited)]',
  favorite: 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)] border-[var(--color-favorite)]',
  discarded: 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)] border-[var(--color-discarded)]',
};

export function Dashboard() {
  const { properties, loading, addProperty, archiveProperty } = useProperties();
  const { visits } = useVisits();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'all'>('all');
  const [requirementsFilter, setRequirementsFilter] = useState<'all' | 'passes' | '80+' | '60+'>('all');
  const [sortBy, setSortBy] = useState<'status' | 'date' | 'price' | 'sqm' | 'score'>('status');
  const [showFilters, setShowFilters] = useState(false);

  const sortOptions = [
    { value: 'status', label: 'Estado' },
    { value: 'date', label: 'Recientes' },
    { value: 'price', label: 'Precio' },
    { value: 'sqm', label: 'Superficie' },
    { value: 'score', label: 'Puntuación' },
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

    // Requirements filter
    if (requirementsFilter !== 'all') {
      result = result.filter((p) => {
        const evaluation = evaluateProperty(p);
        switch (requirementsFilter) {
          case 'passes':
            return evaluation.passesMinimum;
          case '80+':
            return evaluation.score >= 80;
          case '60+':
            return evaluation.score >= 60;
          default:
            return true;
        }
      });
    }

    const STATUS_ORDER: Record<string, number> = {
      contacted: 0,
      favorite: 1,
      pending: 2,
      visited: 3,
      discarded: 4,
    };

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'status': {
          const diff = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
          return diff !== 0 ? diff : b.createdAt.getTime() - a.createdAt.getTime();
        }
        case 'price':
          return a.price - b.price;
        case 'sqm':
          return (b.builtSquareMeters || b.squareMeters) - (a.builtSquareMeters || a.squareMeters);
        case 'score':
          return evaluateProperty(b).score - evaluateProperty(a).score;
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return result;
  }, [properties, search, statusFilter, requirementsFilter, sortBy]);

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

  // Map propertyId -> next upcoming visit
  const nextVisitByProperty = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const upcoming = visits
      .filter((v) => v.date >= startOfToday)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const map = new Map<string, Visit>();
    for (const v of upcoming) {
      if (!map.has(v.propertyId)) {
        map.set(v.propertyId, v);
      }
    }
    return map;
  }, [visits]);

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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            <Plus size={14} strokeWidth={1.5} className="mr-1" />
            Manual
          </Button>
          <Button onClick={() => setShowImport(true)}>
            <FileUp size={16} strokeWidth={1.5} className="mr-2" />
            Importar
          </Button>
        </div>
      </div>

      {/* Mini Calendar */}
      <MiniCalendar />

      {/* Search & filters bar */}
      <div className="mb-6">
        {/* Collapsed bar */}
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border transition-all flex-shrink-0 ${
              showFilters || statusFilter !== 'all' || requirementsFilter !== 'all'
                ? 'bg-[var(--color-text)] text-white border-[var(--color-text)]'
                : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
            }`}
          >
            <SlidersHorizontal size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Filtros</span>
            {(statusFilter !== 'all' || requirementsFilter !== 'all') && (
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            )}
            <ChevronDown size={12} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expandable panel */}
        {showFilters && (
          <div className="mt-3 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] space-y-4">
            {/* Sort */}
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2">Ordenar</p>
              <div className="flex flex-wrap gap-1.5">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as typeof sortBy)}
                    className={`h-8 px-3 text-sm rounded-md transition-all inline-flex items-center ${
                      sortBy === option.value
                        ? 'bg-[var(--color-text)] text-white'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filters */}
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2">Estado</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`h-8 px-3 text-sm rounded-md border transition-all inline-flex items-center ${
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
                    className={`h-8 px-3 text-sm rounded-md border transition-all inline-flex items-center ${
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

            {/* Requirements filters */}
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2">Requisitos</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setRequirementsFilter(requirementsFilter === 'passes' ? 'all' : 'passes')}
                  className={`h-8 px-3 text-sm rounded-md border transition-all inline-flex items-center gap-1.5 ${
                    requirementsFilter === 'passes'
                      ? 'bg-[var(--color-visited)] text-[var(--color-visited-text)] border-[var(--color-visited)]'
                      : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  <Target size={14} />
                  Cumple requisitos
                </button>
                <button
                  onClick={() => setRequirementsFilter(requirementsFilter === '80+' ? 'all' : '80+')}
                  className={`h-8 px-3 text-sm rounded-md border transition-all inline-flex items-center ${
                    requirementsFilter === '80+'
                      ? 'bg-[var(--color-visited)] text-[var(--color-visited-text)] border-[var(--color-visited)]'
                      : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  80%+
                </button>
                <button
                  onClick={() => setRequirementsFilter(requirementsFilter === '60+' ? 'all' : '60+')}
                  className={`h-8 px-3 text-sm rounded-md border transition-all inline-flex items-center ${
                    requirementsFilter === '60+'
                      ? 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)] border-[var(--color-favorite)]'
                      : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  60%+
                </button>
              </div>
            </div>

            {/* Portales */}
            <QuickSearch />
          </div>
        )}
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
            <PropertyCard
              key={property.id}
              property={property}
              onArchive={archiveProperty}
              nextVisit={nextVisitByProperty.get(property.id)}
            />
          ))}
          {/* Ghost card */}
          <button
            onClick={() => setShowImport(true)}
            className="rounded-lg border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-text-tertiary)] transition-colors flex flex-col items-center justify-center min-h-[300px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          >
            <FileUp size={28} strokeWidth={1} className="mb-2" />
            <span className="text-sm">Importar propiedad</span>
          </button>
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
