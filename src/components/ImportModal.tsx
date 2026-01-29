import { useState, useEffect } from 'react';
import { FileCode, Loader2, CheckCircle, XCircle, HelpCircle, MapPin, ClipboardPaste } from 'lucide-react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Modal } from './ui/Modal';
import { geocodeProperty } from '../utils/geocode';
import { platformRegistry, getPlatformOptions } from '../lib/parsers';
import type { Property } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (properties: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [platform, setPlatform] = useState('idealista');
  const [html, setHtml] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<Partial<Property> | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  // Geocode when result is available
  useEffect(() => {
    if (result) {
      setGeocoding(true);
      geocodeProperty(result.address || '', result.title || '', result.zone || '', result.notes || '').then((coords) => {
        setCoordinates(coords);
        setGeocoding(false);
      });
    }
  }, [result]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setHtml(text);
    } catch (e) {
      setError('No se pudo acceder al portapapeles');
    }
  };

  const handleParse = async () => {
    if (!html.trim()) {
      setError('Pega el HTML de la página');
      return;
    }

    setImporting(true);
    setError('');
    setResult(null);

    try {
      // Usar parser de la plataforma seleccionada
      const platformDef = platformRegistry.get(platform);
      if (!platformDef) {
        setError('Plataforma no soportada');
        setImporting(false);
        return;
      }
      const parsed = platformDef.parse(html, '');

      // Añadir teléfono manual si se proporcionó
      if (phone.trim()) {
        parsed.contact = {
          ...parsed.contact,
          phone: phone.trim().replace(/\s/g, ''),
          name: parsed.contact?.name || '',
          email: parsed.contact?.email || '',
          agency: parsed.contact?.agency || '',
        };
      }

      if (parsed && parsed.price && parsed.price > 0) {
        // Las fotos se guardan como URLs y se cargan via proxy
        // Esto evita ocupar espacio en la base de datos
        setResult(parsed);
      } else {
        setError('No se pudieron extraer los datos. Asegúrate de copiar el código fuente completo de la página.');
      }
    } catch (err) {
      setError('Error al procesar el HTML: ' + (err instanceof Error ? err.message : 'desconocido'));
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    setSaving(true);
    try {
      await onImport([{
        url: result.url || '',
        title: result.title || '',
        zone: result.zone || '',
        address: result.address || '',
        latitude: coordinates?.lat,
        longitude: coordinates?.lon,
        price: result.price || 0,
        pricePerMeter: result.pricePerMeter || 0,
        builtSquareMeters: result.builtSquareMeters || 0,
        usableSquareMeters: result.usableSquareMeters || 0,
        squareMeters: result.squareMeters || 0,
        rooms: result.rooms || 0,
        floor: result.floor || '',
        bathrooms: result.bathrooms || 0,
        terrace: result.terrace || false,
        balcony: result.balcony || false,
        parkingIncluded: result.parkingIncluded || false,
        parkingOptional: result.parkingOptional || false,
        elevator: result.elevator || false,
        yearBuilt: result.yearBuilt || 0,
        orientation: result.orientation || '',
        needsRenovation: result.needsRenovation || 'no',
        daysPublished: result.daysPublished || 0,
        photos: result.photos || [],
        contact: result.contact || { name: '', phone: '', email: '', agency: '' },
        notes: result.notes || '',
        status: 'pending' as const,
      }]);
      handleClose();
    } catch (err) {
      console.error('Error al guardar propiedad:', err);
      setError('Error al guardar: ' + (err instanceof Error ? err.message : 'desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setPlatform('idealista');
    setHtml('');
    setPhone('');
    setResult(null);
    setError('');
    setCoordinates(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar propiedad">
      <div className="space-y-4">
        {!result ? (
          <>
            {/* Selector de plataforma */}
            <Select
              label="Plataforma"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              options={getPlatformOptions()}
            />

            <div className="bg-[var(--color-contacted)] text-[var(--color-contacted-text)] p-3 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <HelpCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Cómo importar:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Abre la propiedad en <strong>{platformRegistry.get(platform)?.label || 'la plataforma'}</strong></li>
                    <li>Haz clic en <strong>"Ver teléfono"</strong></li>
                    <li>Clic derecho → <strong>Inspeccionar</strong> (F12)</li>
                    <li>Clic derecho en <code className="bg-[var(--color-bg)] px-1 rounded">&lt;html&gt;</code> → Copiar → Copiar elemento</li>
                    <li>Pega el HTML aquí abajo</li>
                  </ol>
                  <p className="mt-2 text-xs opacity-80">
                    Si el teléfono no se detecta, pégalo manualmente en el campo de teléfono.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Teléfono <span className="font-normal opacity-70">(si no se detecta)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="612 345 678"
                className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  HTML de la página
                </label>
                <button
                  onClick={handlePasteFromClipboard}
                  className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
                >
                  <ClipboardPaste size={12} />
                  Pegar del portapapeles
                </button>
              </div>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="Pega aquí el código HTML de la página..."
                className="w-full h-40 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] text-sm font-mono resize-none"
                disabled={importing}
              />
              {html && (
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  {html.length.toLocaleString()} caracteres
                </p>
              )}
            </div>

            {error && (
              <div className="bg-[var(--color-discarded)] text-[var(--color-discarded-text)] p-3 rounded-lg text-sm flex items-center gap-2">
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
            <div className="bg-[var(--color-visited)] p-4 rounded-lg max-h-96 overflow-y-auto">
              <div className="flex items-center gap-2 text-[var(--color-visited-text)] mb-3">
                <CheckCircle size={18} />
                <span className="font-medium">Datos extraídos correctamente</span>
              </div>

              <div className="space-y-2 text-sm">
                {result.title && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-visited-text)] opacity-80">Título:</span>
                    <span className="font-medium text-[var(--color-visited-text)] text-right max-w-[200px]">{result.title}</span>
                  </div>
                )}
                {result.zone && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-visited-text)] opacity-80">Zona:</span>
                    <span className="font-medium text-[var(--color-visited-text)]">{result.zone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--color-visited-text)] opacity-80">Dirección:</span>
                  <span className="font-medium text-[var(--color-visited-text)] text-right max-w-[200px]">{result.address || 'No disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-visited-text)] opacity-80">Precio:</span>
                  <span className="font-medium text-[var(--color-visited-text)]">{(result.price || 0).toLocaleString('es-ES')} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-visited-text)] opacity-80">€/m²:</span>
                  <span className="font-medium text-[var(--color-visited-text)]">{(result.pricePerMeter || 0).toLocaleString('es-ES')} €</span>
                </div>
                {(result.builtSquareMeters || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-visited-text)] opacity-80">M² construidos:</span>
                    <span className="font-medium text-[var(--color-visited-text)]">{result.builtSquareMeters} m²</span>
                  </div>
                )}
                {(result.usableSquareMeters || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-visited-text)] opacity-80">M² útiles:</span>
                    <span className="font-medium text-[var(--color-visited-text)]">{result.usableSquareMeters} m²</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--color-visited-text)] opacity-80">Habitaciones:</span>
                  <span className="font-medium text-[var(--color-visited-text)]">{result.rooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-visited-text)] opacity-80">Baños:</span>
                  <span className="font-medium text-[var(--color-visited-text)]">{result.bathrooms}</span>
                </div>
                {result.floor && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-visited-text)] opacity-80">Planta:</span>
                    <span className="font-medium text-[var(--color-visited-text)]">{result.floor}</span>
                  </div>
                )}

                <div className="border-t border-[var(--color-visited-text)]/20 pt-2 mt-2 flex flex-wrap gap-2">
                  {result.terrace && <span className="bg-[var(--color-bg)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded text-xs">Terraza</span>}
                  {result.balcony && <span className="bg-[var(--color-bg)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded text-xs">Balcón</span>}
                  {result.elevator && <span className="bg-[var(--color-bg)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded text-xs">Ascensor</span>}
                  {result.parkingIncluded && <span className="bg-[var(--color-bg)] text-[var(--color-visited-text)] px-2 py-0.5 rounded text-xs">Garaje incluido</span>}
                  {result.parkingOptional && <span className="bg-[var(--color-bg)] text-[var(--color-favorite-text)] px-2 py-0.5 rounded text-xs">Garaje opcional</span>}
                  {result.needsRenovation && result.needsRenovation !== 'no' && (
                    <span className="bg-[var(--color-bg)] text-[var(--color-favorite-text)] px-2 py-0.5 rounded text-xs">
                      Reforma {result.needsRenovation === 'total' ? 'total' : 'parcial'}
                    </span>
                  )}
                </div>

                {/* Contacto */}
                <div className="border-t border-[var(--color-visited-text)]/20 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-visited-text)] opacity-80">Teléfono:</span>
                    {result.contact?.phone ? (
                      <span className="font-bold text-[var(--color-visited-text)]">{result.contact.phone}</span>
                    ) : (
                      <span className="text-[var(--color-favorite-text)] text-xs">No encontrado - ¿revelaste el teléfono?</span>
                    )}
                  </div>
                  {result.contact?.agency && (
                    <div className="flex justify-between mt-1">
                      <span className="text-[var(--color-visited-text)] opacity-80">Agencia:</span>
                      <span className="text-[var(--color-visited-text)]">{result.contact.agency}</span>
                    </div>
                  )}
                </div>

                {/* Ubicación */}
                <div className="border-t border-[var(--color-visited-text)]/20 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-visited-text)] opacity-80 flex items-center gap-1">
                      <MapPin size={14} />
                      Ubicación:
                    </span>
                    {geocoding ? (
                      <span className="text-[var(--color-visited-text)] text-xs flex items-center gap-1 opacity-70">
                        <Loader2 size={12} className="animate-spin" />
                        Buscando...
                      </span>
                    ) : coordinates ? (
                      <span className="text-[var(--color-visited-text)] text-xs">Encontrada</span>
                    ) : (
                      <span className="text-[var(--color-favorite-text)] text-xs">No encontrada</span>
                    )}
                  </div>
                </div>

                {result.photos && result.photos.length > 0 && (
                  <div className="text-xs text-[var(--color-visited-text)] opacity-70 pt-2">
                    {result.photos.length} fotos encontradas
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-[var(--color-discarded)] text-[var(--color-discarded-text)] p-3 rounded-lg text-sm flex items-center gap-2">
                <XCircle size={16} />
                {error}
              </div>
            )}

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
