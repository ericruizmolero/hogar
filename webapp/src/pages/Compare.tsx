import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, X, Check } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { PropertyCard } from '../components/PropertyCard';
import { formatPrice, calculatePricePerMeter } from '../lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import { Badge } from '../components/ui/Badge';

export function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { properties, loading } = useProperties();

  const initialIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  const selectedProperties = useMemo(
    () => properties.filter((p) => selectedIds.includes(p.id)),
    [properties, selectedIds]
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newIds = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev;

      setSearchParams(newIds.length > 0 ? { ids: newIds.join(',') } : {});
      return newIds;
    });
  };

  const getBestValue = (key: 'price' | 'squareMeters' | 'pricePerMeter' | 'rooms' | 'bathrooms') => {
    if (selectedProperties.length === 0) return null;

    const values = selectedProperties.map((p) => {
      if (key === 'pricePerMeter') {
        return calculatePricePerMeter(p.price, p.squareMeters);
      }
      return p[key];
    });

    if (key === 'price' || key === 'pricePerMeter') {
      return Math.min(...values);
    }
    return Math.max(...values);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando propiedades...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[85rem] mx-auto px-6 py-8 animate-in">
      <Link
        to="/"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Volver
      </Link>

      <h1 className="text-2xl font-bold mb-2">Comparador</h1>
      <p className="text-gray-600 mb-6">
        Selecciona entre 2 y 4 propiedades para comparar
      </p>

      {selectedProperties.length >= 2 && (
        <div className="bg-white rounded-xl border overflow-x-auto mb-8">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left text-sm font-medium text-gray-500">
                  Característica
                </th>
                {selectedProperties.map((property) => (
                  <th key={property.id} className="p-4 text-left">
                    <div className="flex items-start justify-between">
                      <Link
                        to={`/property/${property.id}`}
                        className="text-blue-600 hover:underline line-clamp-2"
                      >
                        {property.address}
                      </Link>
                      <button
                        onClick={() => toggleSelection(property.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 text-sm text-gray-600">Estado</td>
                {selectedProperties.map((p) => (
                  <td key={p.id} className="p-4">
                    <Badge className={STATUS_COLORS[p.status]}>
                      {STATUS_LABELS[p.status]}
                    </Badge>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 text-sm text-gray-600">Precio</td>
                {selectedProperties.map((p) => {
                  const isBest = p.price === getBestValue('price');
                  return (
                    <td key={p.id} className={`p-4 font-semibold ${isBest ? 'text-green-600' : ''}`}>
                      {formatPrice(p.price)}
                      {isBest && <Check size={16} className="inline ml-1" />}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b">
                <td className="p-4 text-sm text-gray-600">Superficie</td>
                {selectedProperties.map((p) => {
                  const isBest = p.squareMeters === getBestValue('squareMeters');
                  return (
                    <td key={p.id} className={`p-4 ${isBest ? 'text-green-600 font-semibold' : ''}`}>
                      {p.squareMeters} m²
                      {isBest && <Check size={16} className="inline ml-1" />}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b">
                <td className="p-4 text-sm text-gray-600">Precio/m²</td>
                {selectedProperties.map((p) => {
                  const pricePerMeter = calculatePricePerMeter(p.price, p.squareMeters);
                  const isBest = pricePerMeter === getBestValue('pricePerMeter');
                  return (
                    <td key={p.id} className={`p-4 ${isBest ? 'text-green-600 font-semibold' : ''}`}>
                      {formatPrice(pricePerMeter)}
                      {isBest && <Check size={16} className="inline ml-1" />}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b">
                <td className="p-4 text-sm text-gray-600">Habitaciones</td>
                {selectedProperties.map((p) => {
                  const isBest = p.rooms === getBestValue('rooms');
                  return (
                    <td key={p.id} className={`p-4 ${isBest ? 'text-green-600 font-semibold' : ''}`}>
                      {p.rooms}
                      {isBest && <Check size={16} className="inline ml-1" />}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b">
                <td className="p-4 text-sm text-gray-600">Baños</td>
                {selectedProperties.map((p) => {
                  const isBest = p.bathrooms === getBestValue('bathrooms');
                  return (
                    <td key={p.id} className={`p-4 ${isBest ? 'text-green-600 font-semibold' : ''}`}>
                      {p.bathrooms}
                      {isBest && <Check size={16} className="inline ml-1" />}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b">
                <td className="p-4 text-sm text-gray-600">Inmobiliaria</td>
                {selectedProperties.map((p) => (
                  <td key={p.id} className="p-4 text-sm">
                    {p.contact.agency || '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 text-sm text-gray-600">Notas</td>
                {selectedProperties.map((p) => (
                  <td key={p.id} className="p-4 text-sm text-gray-600">
                    {p.notes || '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">
        Seleccionar propiedades ({selectedIds.length}/4)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            selectable
            selected={selectedIds.includes(property.id)}
            onSelect={toggleSelection}
          />
        ))}
      </div>
    </div>
  );
}
