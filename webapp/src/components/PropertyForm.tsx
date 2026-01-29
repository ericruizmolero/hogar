import { useState } from 'react';
import type { Property, PropertyStatus, RenovationType } from '../types';
import { STATUS_LABELS, RENOVATION_LABELS } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface PropertyFormProps {
  initialData?: Partial<Property>;
  onSubmit: (data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export function PropertyForm({ initialData, onSubmit, onCancel }: PropertyFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    url: initialData?.url || '',
    title: initialData?.title || '',
    zone: initialData?.zone || '',
    address: initialData?.address || '',
    price: initialData?.price || 0,
    pricePerMeter: initialData?.pricePerMeter || 0,
    builtSquareMeters: initialData?.builtSquareMeters || 0,
    usableSquareMeters: initialData?.usableSquareMeters || 0,
    squareMeters: initialData?.squareMeters || 0,
    rooms: initialData?.rooms || 0,
    floor: initialData?.floor || '',
    bathrooms: initialData?.bathrooms || 0,
    terrace: initialData?.terrace || false,
    balcony: initialData?.balcony || false,
    parkingIncluded: initialData?.parkingIncluded || false,
    parkingOptional: initialData?.parkingOptional || false,
    elevator: initialData?.elevator || false,
    yearBuilt: initialData?.yearBuilt || 0,
    orientation: initialData?.orientation || '',
    needsRenovation: initialData?.needsRenovation || 'no' as RenovationType,
    daysPublished: initialData?.daysPublished || 0,
    photos: initialData?.photos || [],
    contactName: initialData?.contact?.name || '',
    contactPhone: initialData?.contact?.phone || '',
    contactEmail: initialData?.contact?.email || '',
    contactAgency: initialData?.contact?.agency || '',
    status: initialData?.status || 'pending' as PropertyStatus,
    notes: initialData?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const sqm = Number(formData.builtSquareMeters) || Number(formData.squareMeters);
    const calculatedPricePerMeter = sqm > 0 ? Math.round(Number(formData.price) / sqm) : 0;

    try {
      await onSubmit({
        url: formData.url,
        title: formData.title,
        zone: formData.zone,
        address: formData.address,
        price: Number(formData.price),
        pricePerMeter: Number(formData.pricePerMeter) || calculatedPricePerMeter,
        builtSquareMeters: Number(formData.builtSquareMeters),
        usableSquareMeters: Number(formData.usableSquareMeters),
        squareMeters: Number(formData.squareMeters),
        rooms: Number(formData.rooms),
        floor: formData.floor,
        bathrooms: Number(formData.bathrooms),
        terrace: formData.terrace,
        balcony: formData.balcony,
        parkingIncluded: formData.parkingIncluded,
        parkingOptional: formData.parkingOptional,
        elevator: formData.elevator,
        yearBuilt: Number(formData.yearBuilt),
        orientation: formData.orientation,
        needsRenovation: formData.needsRenovation,
        daysPublished: Number(formData.daysPublished),
        photos: formData.photos,
        contact: {
          name: formData.contactName,
          phone: formData.contactPhone,
          email: formData.contactEmail,
          agency: formData.contactAgency,
        },
        status: formData.status,
        notes: formData.notes,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <Input
        label="URL del anuncio"
        value={formData.url}
        onChange={(e) => handleChange('url', e.target.value)}
        placeholder="https://idealista.com/inmueble/..."
      />

      <Input
        label="Título"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        placeholder="Piso en venta..."
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Zona"
          value={formData.zone}
          onChange={(e) => handleChange('zone', e.target.value)}
          placeholder="Barrio, zona"
        />
        <Input
          label="Dirección"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Calle, número, ciudad"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Precio (€)"
          type="number"
          value={formData.price || ''}
          onChange={(e) => handleChange('price', e.target.value)}
          required
        />
        <Input
          label="€/m² (auto si vacío)"
          type="number"
          value={formData.pricePerMeter || ''}
          onChange={(e) => handleChange('pricePerMeter', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="M² construidos"
          type="number"
          value={formData.builtSquareMeters || ''}
          onChange={(e) => handleChange('builtSquareMeters', e.target.value)}
        />
        <Input
          label="M² útiles"
          type="number"
          value={formData.usableSquareMeters || ''}
          onChange={(e) => handleChange('usableSquareMeters', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Habitaciones"
          type="number"
          value={formData.rooms || ''}
          onChange={(e) => handleChange('rooms', e.target.value)}
        />
        <Input
          label="Baños"
          type="number"
          value={formData.bathrooms || ''}
          onChange={(e) => handleChange('bathrooms', e.target.value)}
        />
        <Input
          label="Planta"
          value={formData.floor}
          onChange={(e) => handleChange('floor', e.target.value)}
          placeholder="Ej: 3ª"
        />
      </div>

      {/* Características */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Características</h4>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.terrace}
              onChange={(e) => setFormData(prev => ({ ...prev, terrace: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm">Terraza</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.balcony}
              onChange={(e) => setFormData(prev => ({ ...prev, balcony: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm">Balcón</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.elevator}
              onChange={(e) => setFormData(prev => ({ ...prev, elevator: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm">Ascensor</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.parkingIncluded}
              onChange={(e) => setFormData(prev => ({ ...prev, parkingIncluded: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm">Garaje incluido</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.parkingOptional}
              onChange={(e) => setFormData(prev => ({ ...prev, parkingOptional: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm">Garaje opcional</span>
          </label>
          <div className="col-span-2">
            <Select
              label="Reforma"
              value={formData.needsRenovation}
              onChange={(e) => setFormData(prev => ({ ...prev, needsRenovation: e.target.value as RenovationType }))}
              options={Object.entries(RENOVATION_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>
        </div>
      </div>

      {/* Info adicional */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Año construcción"
          type="number"
          value={formData.yearBuilt || ''}
          onChange={(e) => handleChange('yearBuilt', e.target.value)}
          placeholder="Ej: 1990"
        />
        <Input
          label="Orientación"
          value={formData.orientation}
          onChange={(e) => handleChange('orientation', e.target.value)}
          placeholder="Ej: Sur"
        />
      </div>

      <Select
        label="Estado"
        value={formData.status}
        onChange={(e) => handleChange('status', e.target.value)}
        options={statusOptions}
      />

      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium mb-3">Contacto</h4>
        <div className="space-y-3">
          <Input
            label="Nombre"
            value={formData.contactName}
            onChange={(e) => handleChange('contactName', e.target.value)}
          />
          <Input
            label="Teléfono"
            value={formData.contactPhone}
            onChange={(e) => handleChange('contactPhone', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
          />
          <Input
            label="Inmobiliaria"
            value={formData.contactAgency}
            onChange={(e) => handleChange('contactAgency', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Notas personales sobre la propiedad..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Añadir propiedad'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
