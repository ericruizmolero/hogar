import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Star, Home } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import { MortgageCalculatorFull } from '../components/MortgageCalculatorFull';
import { formatPrice, getImageUrl } from '../lib/utils';

export function Simulator() {
  const { properties, loading: loadingProperties } = useProperties();
  const { profile, loading: loadingProfile } = useFinancialProfile();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Filtrar solo favoritos
  const favorites = useMemo(() => {
    return properties.filter(p => p.status === 'favorite');
  }, [properties]);

  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId) return null;
    return properties.find(p => p.id === selectedPropertyId) || null;
  }, [properties, selectedPropertyId]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n) + '€';

  const loading = loadingProperties || loadingProfile;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-[var(--color-text-secondary)]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-in">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-4"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
        <h1
          className="text-2xl font-medium text-[var(--color-text)]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Simulador de hipoteca
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Selecciona uno de tus pisos favoritos para simular la hipoteca
        </p>
      </div>

      {/* Perfil financiero resumen */}
      <div className="mb-8 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
            Tu perfil financiero
          </h2>
          <Link
            to="/settings"
            className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
          >
            <Settings size={12} />
            Editar
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)]">Ahorros totales</div>
            <div className="text-lg font-medium text-[var(--color-text)]">
              {formatCurrency(profile.savings1 + profile.savings2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)]">Ingresos mensuales</div>
            <div className="text-lg font-medium text-[var(--color-text)]">
              {formatCurrency(profile.income1 + profile.income2)}/mes
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)]">Persona 1</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {formatCurrency(profile.savings1)} / {formatCurrency(profile.income1)}/mes
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)]">Persona 2</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {formatCurrency(profile.savings2)} / {formatCurrency(profile.income2)}/mes
            </div>
          </div>
        </div>
      </div>

      {/* Selector de inmuebles favoritos */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-4 flex items-center gap-2">
          <Star size={16} />
          Tus favoritos ({favorites.length})
        </h2>

        {favorites.length === 0 ? (
          <div className="p-8 bg-[var(--color-bg-secondary)] rounded-lg text-center">
            <Home size={32} className="mx-auto text-[var(--color-text-tertiary)] mb-3" />
            <p className="text-[var(--color-text-secondary)]">
              No tienes pisos marcados como favoritos
            </p>
            <Link
              to="/"
              className="inline-block mt-3 text-sm text-[var(--color-accent)] hover:underline"
            >
              Ver todos los pisos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {favorites.map((property) => (
              <button
                key={property.id}
                onClick={() => setSelectedPropertyId(property.id)}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${selectedPropertyId === property.id
                    ? 'border-[var(--color-accent)] bg-[var(--color-contacted)] ring-2 ring-[var(--color-accent)]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-hover)]'
                  }
                `}
              >
                {/* Thumbnail */}
                <div className="aspect-video rounded overflow-hidden bg-[var(--color-bg-secondary)] mb-2">
                  {property.photos && property.photos.length > 0 ? (
                    <img
                      src={getImageUrl(property.photos[0])}
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">
                      <Home size={20} />
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-[var(--color-text)] line-clamp-1">
                  {property.zone || property.address}
                </div>
                <div className="text-lg font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  {formatPrice(property.price)}
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  {property.squareMeters}m² · {property.rooms} hab
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Calculadora completa para el piso seleccionado */}
      {selectedProperty && (
        <div className="animate-in">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
              Simulacion para: {selectedProperty.zone || selectedProperty.address}
            </h2>
            <Link
              to={`/property/${selectedProperty.id}`}
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              Ver ficha completa
            </Link>
          </div>
          <MortgageCalculatorFull
            propertyPrice={selectedProperty.price}
            needsRenovation={selectedProperty.needsRenovation}
          />
        </div>
      )}

      {/* Mensaje si no hay piso seleccionado */}
      {!selectedProperty && favorites.length > 0 && (
        <div className="p-8 bg-[var(--color-bg-secondary)] rounded-lg text-center">
          <p className="text-[var(--color-text-secondary)]">
            Selecciona un piso de arriba para ver la simulacion de hipoteca
          </p>
        </div>
      )}
    </div>
  );
}
