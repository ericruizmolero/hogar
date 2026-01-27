import { useState } from 'react';
import { FileCode, Loader2, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import type { Property } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (properties: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}

interface ScrapedProperty {
  url: string;
  title: string;
  zone: string;
  address: string;
  price: number;
  pricePerMeter: number;
  builtSquareMeters: number;
  usableSquareMeters: number;
  squareMeters: number;
  rooms: number;
  floor: string;
  bathrooms: number;
  terrace: boolean;
  balcony: boolean;
  parkingIncluded: boolean;
  parkingOptional: boolean;
  elevator: boolean;
  yearBuilt: number;
  orientation: string;
  needsRenovation: boolean;
  daysPublished: number;
  photos: string[];
  contact: {
    name: string;
    phone: string;
    email: string;
    agency: string;
  };
  notes: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [html, setHtml] = useState('');
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<ScrapedProperty | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleParse = async () => {
    if (!html.trim()) {
      setError('Pega el HTML de la página');
      return;
    }

    setImporting(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/parse-html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, url }),
      });

      const data = await response.json();

      if (data.success && data.property) {
        setResult(data.property);
      } else {
        setError(data.error || 'No se pudieron extraer datos');
      }
    } catch (err) {
      setError('Error al conectar con el servidor. Asegúrate de que está corriendo.');
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    setSaving(true);
    try {
      await onImport([{
        url: result.url,
        title: result.title,
        zone: result.zone,
        address: result.address,
        price: result.price,
        pricePerMeter: result.pricePerMeter,
        builtSquareMeters: result.builtSquareMeters,
        usableSquareMeters: result.usableSquareMeters,
        squareMeters: result.squareMeters,
        rooms: result.rooms,
        floor: result.floor,
        bathrooms: result.bathrooms,
        terrace: result.terrace,
        balcony: result.balcony,
        parkingIncluded: result.parkingIncluded,
        parkingOptional: result.parkingOptional,
        elevator: result.elevator,
        yearBuilt: result.yearBuilt,
        orientation: result.orientation,
        needsRenovation: result.needsRenovation,
        daysPublished: result.daysPublished,
        photos: result.photos,
        contact: result.contact,
        notes: result.notes,
        status: 'pending' as const,
      }]);
      handleClose();
    } catch {
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setHtml('');
    setUrl('');
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar desde Idealista">
      <div className="space-y-4">
        {!result ? (
          <>
            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <HelpCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Cómo importar:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Abre la propiedad en Idealista</li>
                    <li>Pulsa <kbd className="bg-blue-100 px-1 rounded">Cmd+U</kbd> (Mac) o <kbd className="bg-blue-100 px-1 rounded">Ctrl+U</kbd> (Windows)</li>
                    <li>Selecciona todo (<kbd className="bg-blue-100 px-1 rounded">Cmd+A</kbd>) y copia (<kbd className="bg-blue-100 px-1 rounded">Cmd+C</kbd>)</li>
                    <li>Pega aquí abajo</li>
                  </ol>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de la propiedad (opcional)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.idealista.com/inmueble/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HTML de la página
              </label>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="Pega aquí el código HTML de la página..."
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                disabled={importing}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <XCircle size={16} />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleParse}
                disabled={importing || !html.trim()}
                className="flex-1"
              >
                {importing ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <FileCode size={18} className="mr-2" />
                    Extraer datos
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <div className="flex items-center gap-2 text-green-700 mb-3">
                <CheckCircle size={18} />
                <span className="font-medium">Datos extraídos correctamente</span>
              </div>

              <div className="space-y-2 text-sm">
                {result.title && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Título:</span>
                    <span className="font-medium text-right max-w-[200px]">{result.title}</span>
                  </div>
                )}
                {result.zone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zona:</span>
                    <span className="font-medium">{result.zone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Dirección:</span>
                  <span className="font-medium text-right max-w-[200px]">{result.address || 'No disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio:</span>
                  <span className="font-medium">{result.price.toLocaleString('es-ES')} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">€/m²:</span>
                  <span className="font-medium">{result.pricePerMeter.toLocaleString('es-ES')} €</span>
                </div>
                {result.builtSquareMeters > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">M² construidos:</span>
                    <span className="font-medium">{result.builtSquareMeters} m²</span>
                  </div>
                )}
                {result.usableSquareMeters > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">M² útiles:</span>
                    <span className="font-medium">{result.usableSquareMeters} m²</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Habitaciones:</span>
                  <span className="font-medium">{result.rooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Baños:</span>
                  <span className="font-medium">{result.bathrooms}</span>
                </div>
                {result.floor && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Planta:</span>
                    <span className="font-medium">{result.floor}</span>
                  </div>
                )}

                <div className="border-t pt-2 mt-2 flex flex-wrap gap-2">
                  {result.terrace && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Terraza</span>}
                  {result.balcony && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Balcón</span>}
                  {result.elevator && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Ascensor</span>}
                  {result.parkingIncluded && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Garaje incluido</span>}
                  {result.parkingOptional && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">Garaje opcional</span>}
                  {result.needsRenovation && <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs">Necesita reforma</span>}
                </div>

                {(result.yearBuilt > 0 || result.orientation || result.daysPublished > 0) && (
                  <div className="border-t pt-2 mt-2 space-y-1">
                    {result.yearBuilt > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Año construcción:</span>
                        <span className="font-medium">{result.yearBuilt}</span>
                      </div>
                    )}
                    {result.orientation && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Orientación:</span>
                        <span className="font-medium">{result.orientation}</span>
                      </div>
                    )}
                    {result.daysPublished > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Días publicado:</span>
                        <span className="font-medium">{result.daysPublished}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Guardando...' : 'Guardar propiedad'}
              </Button>
              <Button variant="secondary" onClick={() => setResult(null)}>
                Volver
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
