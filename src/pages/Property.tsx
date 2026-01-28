import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Maximize,
  BedDouble,
  Bath,
  Phone,
  Mail,
  Building,
  Edit,
  Trash2,
  Bell,
  GitCompare,
  Car,
  Wrench,
  Calendar,
  Compass,
  Square,
  LocateFixed,
  Check,
  X,
  FileCode,
  Loader2,
  ClipboardPaste,
} from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { useCalls } from '../hooks/useCalls';
import { useReminders } from '../hooks/useReminders';
import { CallHistory } from '../components/CallHistory';
import { PropertyForm } from '../components/PropertyForm';
import { ImageSlider } from '../components/ImageSlider';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { formatPrice, formatDate } from '../lib/utils';
import { evaluateProperty, getScoreColor, getScoreBgColor } from '../lib/requirements';
import { LocationPicker } from '../components/LocationPicker';
import { MortgageCalculator } from '../components/MortgageCalculator';
import { parseIdealistaHtml } from '../lib/idealista-parser';
import { geocodeProperty } from '../utils/geocode';
import type { PropertyStatus } from '../types';
import { STATUS_LABELS } from '../types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[var(--color-pending)] text-[var(--color-pending-text)] border-[var(--color-pending)]',
  contacted: 'bg-[var(--color-contacted)] text-[var(--color-contacted-text)] border-[var(--color-contacted)]',
  visited: 'bg-[var(--color-visited)] text-[var(--color-visited-text)] border-[var(--color-visited)]',
  favorite: 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)] border-[var(--color-favorite)]',
  discarded: 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)] border-[var(--color-discarded)]',
};

export function Property() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { properties, updateProperty, updateStatus, deleteProperty } = useProperties();
  const { calls, addCall, deleteCall } = useCalls(id || '');
  const { addReminder } = useReminders();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderData, setReminderData] = useState({
    date: '',
    message: '',
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completeHtml, setCompleteHtml] = useState('');
  const [completePhone, setCompletePhone] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  const property = properties.find((p) => p.id === id);

  if (!property) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <span className="text-5xl mb-4 block opacity-20">🏠</span>
        <h2
          className="text-xl text-[var(--color-text-secondary)] mb-2"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Propiedad no encontrada
        </h2>
        <Link to="/" className="text-[var(--color-accent)] hover:underline text-sm">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteProperty(property.id);
    navigate('/');
  };

  const handleUpdate = async (data: Parameters<typeof updateProperty>[1]) => {
    await updateProperty(property.id, data);
    setShowEditForm(false);
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    await addReminder({
      propertyId: property.id,
      date: new Date(reminderData.date),
      message: reminderData.message,
      completed: false,
    });
    setShowReminderForm(false);
    setReminderData({ date: '', message: '' });
  };

  const handleSaveLocation = async (lat: number, lng: number) => {
    await updateProperty(property.id, {
      latitude: lat,
      longitude: lng,
    });
  };

  const handleCompleteWithHtml = async () => {
    if (!completeHtml.trim()) {
      setCompleteError('Pega el HTML de la página');
      return;
    }

    setCompleting(true);
    setCompleteError('');

    try {
      // Parsear HTML
      const parsed = parseIdealistaHtml(completeHtml, property.url || '');

      // Añadir teléfono manual si se proporcionó
      if (completePhone.trim()) {
        parsed.contact = {
          ...parsed.contact,
          phone: completePhone.trim().replace(/\s/g, ''),
          name: parsed.contact?.name || '',
          email: parsed.contact?.email || '',
          agency: parsed.contact?.agency || '',
        };
      }

      if (!parsed.price || parsed.price === 0) {
        setCompleteError('No se pudo extraer el precio. Asegúrate de copiar el HTML completo.');
        setCompleting(false);
        return;
      }

      // Guardar URLs de fotos directamente (se cargan via proxy)
      const photos = parsed.photos || [];

      // Geocodificar
      const coords = await geocodeProperty(
        parsed.address || '',
        parsed.title || '',
        parsed.zone || '',
        parsed.notes || ''
      );

      // Actualizar propiedad
      await updateProperty(property.id, {
        title: parsed.title || property.title,
        address: parsed.address || property.address,
        zone: parsed.zone || property.zone,
        price: parsed.price,
        pricePerMeter: parsed.pricePerMeter || 0,
        squareMeters: parsed.squareMeters || 0,
        builtSquareMeters: parsed.builtSquareMeters || 0,
        usableSquareMeters: parsed.usableSquareMeters || 0,
        rooms: parsed.rooms || 0,
        bathrooms: parsed.bathrooms || 0,
        floor: parsed.floor || '',
        terrace: parsed.terrace || false,
        balcony: parsed.balcony || false,
        elevator: parsed.elevator || false,
        parkingIncluded: parsed.parkingIncluded || false,
        parkingOptional: parsed.parkingOptional || false,
        needsRenovation: parsed.needsRenovation || false,
        yearBuilt: parsed.yearBuilt || 0,
        orientation: parsed.orientation || '',
        daysPublished: parsed.daysPublished || 0,
        photos: photos.length > 0 ? photos : property.photos,
        contact: parsed.contact || property.contact,
        latitude: coords?.lat || property.latitude,
        longitude: coords?.lon || property.longitude,
        notes: property.notes?.replace('⚠️ Importado rápido desde móvil - completar datos desde ordenador', '').trim() || '',
      });

      setShowCompleteForm(false);
      setCompleteHtml('');
      setCompletePhone('');
    } catch (err) {
      setCompleteError('Error al procesar: ' + (err instanceof Error ? err.message : 'desconocido'));
    } finally {
      setCompleting(false);
    }
  };

  // Detectar si es una propiedad incompleta (importada rápido)
  const isIncomplete = property ? (property.price === 0 || property.notes?.includes('Importado rápido')) : false;

  const pricePerMeter = property.pricePerMeter || (property.squareMeters > 0 ? Math.round(property.price / property.squareMeters) : 0);

  // Evaluate property against requirements
  const evaluation = evaluateProperty(property);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-in">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-6 text-sm transition-colors"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        Volver
      </button>

      {/* Incomplete property banner */}
      {isIncomplete && (
        <div className="mb-6 p-4 bg-[var(--color-favorite)] rounded-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-[var(--color-favorite-text)]">Propiedad incompleta</p>
              <p className="text-sm text-[var(--color-favorite-text)] opacity-80">
                Pega el HTML desde el ordenador para completar los datos
              </p>
            </div>
            <Button size="sm" onClick={() => setShowCompleteForm(true)}>
              <FileCode size={14} className="mr-1.5" />
              Completar
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="space-y-6">
        {/* Image */}
        <div className="rounded-lg overflow-hidden">
          <ImageSlider images={property.photos || []} address={property.address} />
        </div>

        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1
                className="text-3xl font-medium text-[var(--color-text)] mb-1"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {formatPrice(property.price)}
              </h1>
              <p className="text-[var(--color-text-secondary)]">
                {formatPrice(pricePerMeter)}/m²
              </p>
            </div>
            <span className={`px-3 py-1 rounded-md text-sm font-medium ${STATUS_STYLES[property.status]}`}>
              {STATUS_LABELS[property.status]}
            </span>
          </div>

          {property.title && (
            <h2 className="text-lg text-[var(--color-text)] mb-2">{property.title}</h2>
          )}

          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <MapPin size={16} strokeWidth={1.5} />
            <span>{property.zone || property.address}</span>
            {property.latitude && property.longitude && (
              <span className="text-xs text-[var(--color-visited-text)] bg-[var(--color-visited)] px-1.5 py-0.5 rounded">
                En mapa
              </span>
            )}
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
            >
              <LocateFixed size={12} />
              {property.latitude ? 'Reubicar' : 'Ubicar en mapa'}
            </button>
          </div>
        </div>

        {/* Needs renovation alert */}
        {property.needsRenovation && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-favorite)] text-[var(--color-favorite-text)] rounded-md">
            <Wrench size={18} strokeWidth={1.5} />
            <span className="font-medium">Necesita reforma</span>
          </div>
        )}

        {/* Key features */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {property.builtSquareMeters > 0 && (
            <div className="p-3 bg-[var(--color-bg-secondary)] rounded-md">
              <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-xs mb-1">
                <Maximize size={12} strokeWidth={1.5} />
                M² construidos
              </div>
              <div className="font-medium text-[var(--color-text)]">{property.builtSquareMeters} m²</div>
            </div>
          )}
          {property.usableSquareMeters > 0 && (
            <div className="p-3 bg-[var(--color-bg-secondary)] rounded-md">
              <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-xs mb-1">
                <Square size={12} strokeWidth={1.5} />
                M² útiles
              </div>
              <div className="font-medium text-[var(--color-text)]">{property.usableSquareMeters} m²</div>
            </div>
          )}
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-md">
            <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-xs mb-1">
              <BedDouble size={12} strokeWidth={1.5} />
              Habitaciones
            </div>
            <div className="font-medium text-[var(--color-text)]">{property.rooms}</div>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-md">
            <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-xs mb-1">
              <Bath size={12} strokeWidth={1.5} />
              Baños
            </div>
            <div className="font-medium text-[var(--color-text)]">{property.bathrooms}</div>
          </div>
          {property.floor && (
            <div className="p-3 bg-[var(--color-bg-secondary)] rounded-md">
              <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-xs mb-1">
                <Building size={12} strokeWidth={1.5} />
                Planta
              </div>
              <div className="font-medium text-[var(--color-text)]">{property.floor}</div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {property.terrace && (
            <span className="notion-tag bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
              Terraza
            </span>
          )}
          {property.balcony && (
            <span className="notion-tag bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
              Balcón
            </span>
          )}
          {property.elevator && (
            <span className="notion-tag bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
              Ascensor
            </span>
          )}
          {property.parkingIncluded && (
            <span className="notion-tag bg-[var(--color-visited)] text-[var(--color-visited-text)]">
              <Car size={12} className="mr-1" /> Garaje incluido
            </span>
          )}
          {property.parkingOptional && (
            <span className="notion-tag bg-[var(--color-favorite)] text-[var(--color-favorite-text)]">
              <Car size={12} className="mr-1" /> Garaje opcional
            </span>
          )}
          {property.yearBuilt > 0 && (
            <span className="notion-tag bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]">
              <Calendar size={12} className="mr-1" /> {property.yearBuilt}
            </span>
          )}
          {property.orientation && (
            <span className="notion-tag bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]">
              <Compass size={12} className="mr-1" /> {property.orientation}
            </span>
          )}
          {property.daysPublished > 0 && (
            <span className="notion-tag bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]">
              {property.daysPublished} días publicado
            </span>
          )}
        </div>

        {/* Requirements score */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-3">
            <h3
              className="font-medium text-[var(--color-text)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Requisitos
            </h3>
            <div
              className="px-3 py-1 rounded-md text-sm font-bold"
              style={{
                background: getScoreBgColor(evaluation.score),
                color: getScoreColor(evaluation.score),
              }}
            >
              {evaluation.score}% {evaluation.passesMinimum ? '✓' : ''}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {evaluation.results.map((result) => (
              <div
                key={result.key}
                className={`flex items-center gap-2 text-sm p-2 rounded ${
                  result.met
                    ? 'bg-[var(--color-visited)] text-[var(--color-visited-text)]'
                    : result.critical
                    ? 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)]'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                }`}
              >
                {result.met ? (
                  <Check size={14} className="flex-shrink-0" />
                ) : (
                  <X size={14} className="flex-shrink-0" />
                )}
                <span className="flex-1 text-xs">{result.label}</span>
                <span className="text-xs opacity-75">{result.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mortgage Calculator */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          <MortgageCalculator propertyPrice={property.price} needsRenovation={property.needsRenovation} />
        </div>

        {/* Status change */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Cambiar estado</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <button
                key={status}
                onClick={() => updateStatus(property.id, status as PropertyStatus)}
                className={`px-3 py-1 text-sm rounded-md border transition-all ${
                  property.status === status
                    ? STATUS_STYLES[status]
                    : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        {(property.contact?.name || property.contact?.phone || property.contact?.email) && (
          <div className="pt-4 border-t border-[var(--color-border)]">
            <h3
              className="font-medium text-[var(--color-text)] mb-3"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Contacto
            </h3>
            <div className="space-y-2">
              {property.contact.agency && (
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-sm">
                  <Building size={14} strokeWidth={1.5} />
                  {property.contact.agency}
                </div>
              )}
              {property.contact.name && (
                <div className="text-[var(--color-text-secondary)] text-sm">
                  {property.contact.name}
                </div>
              )}
              {property.contact.phone && (
                <a
                  href={`tel:${property.contact.phone}`}
                  className="flex items-center gap-2 text-[var(--color-accent)] text-sm hover:underline"
                >
                  <Phone size={14} strokeWidth={1.5} />
                  {property.contact.phone}
                </a>
              )}
              {property.contact.email && (
                <a
                  href={`mailto:${property.contact.email}`}
                  className="flex items-center gap-2 text-[var(--color-accent)] text-sm hover:underline"
                >
                  <Mail size={14} strokeWidth={1.5} />
                  {property.contact.email}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {property.notes && (
          <div className="pt-4 border-t border-[var(--color-border)]">
            <h3
              className="font-medium text-[var(--color-text)] mb-2"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Notas
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm whitespace-pre-wrap">
              {property.notes}
            </p>
          </div>
        )}

        {/* External link */}
        {property.url && (
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[var(--color-accent)] text-sm hover:underline"
          >
            <ExternalLink size={14} strokeWidth={1.5} />
            Ver anuncio original
          </a>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-[var(--color-border)] flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowEditForm(true)}>
            <Edit size={14} strokeWidth={1.5} className="mr-1.5" />
            Editar
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowCompleteForm(true)}>
            <FileCode size={14} strokeWidth={1.5} className="mr-1.5" />
            Actualizar con HTML
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowReminderForm(true)}>
            <Bell size={14} strokeWidth={1.5} className="mr-1.5" />
            Recordatorio
          </Button>
          <Link to={`/compare?ids=${property.id}`}>
            <Button size="sm" variant="secondary">
              <GitCompare size={14} strokeWidth={1.5} className="mr-1.5" />
              Comparar
            </Button>
          </Link>
          <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={14} strokeWidth={1.5} className="mr-1.5" />
            Eliminar
          </Button>
        </div>

        {/* Meta */}
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Añadida el {formatDate(property.createdAt)}
        </p>

        {/* Call history */}
        <div className="pt-4">
          <CallHistory calls={calls} onAddCall={addCall} onDeleteCall={deleteCall} />
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showEditForm} onClose={() => setShowEditForm(false)} title="Editar propiedad">
        <PropertyForm
          initialData={property}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditForm(false)}
        />
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Eliminar propiedad">
        <p className="text-[var(--color-text-secondary)] mb-4">
          ¿Estás seguro de que quieres eliminar esta propiedad? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancelar
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showReminderForm} onClose={() => setShowReminderForm(false)} title="Crear recordatorio">
        <form onSubmit={handleAddReminder} className="space-y-4">
          <Input
            label="Fecha"
            type="datetime-local"
            value={reminderData.date}
            onChange={(e) => setReminderData({ ...reminderData, date: e.target.value })}
            required
          />
          <Input
            label="Mensaje"
            value={reminderData.message}
            onChange={(e) => setReminderData({ ...reminderData, message: e.target.value })}
            placeholder="Llamar para confirmar visita..."
            required
          />
          <div className="flex gap-2">
            <Button type="submit">Crear</Button>
            <Button variant="secondary" onClick={() => setShowReminderForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <LocationPicker
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSave={handleSaveLocation}
        initialLat={property.latitude}
        initialLng={property.longitude}
        address={property.address}
        title={property.title}
        zone={property.zone}
        notes={property.notes}
      />

      <Modal
        isOpen={showCompleteForm}
        onClose={() => {
          setShowCompleteForm(false);
          setCompleteHtml('');
          setCompletePhone('');
          setCompleteError('');
        }}
        title="Actualizar datos con HTML"
      >
        <div className="space-y-4">
          <div className="text-sm text-[var(--color-text-secondary)] space-y-2">
            <p>Actualiza los datos y fotos de esta propiedad pegando el HTML de Idealista:</p>
            <ol className="list-decimal list-inside text-xs space-y-1 opacity-80">
              <li>Abre el piso en Idealista</li>
              <li>Haz clic en <strong>"Ver teléfono"</strong> para revelar el contacto</li>
              <li>Clic derecho → <strong>Inspeccionar</strong> (F12)</li>
              <li>Clic derecho en <code className="bg-[var(--color-bg-secondary)] px-1 rounded">&lt;html&gt;</code> → Copiar elemento</li>
              <li>Pega aquí</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Teléfono <span className="font-normal opacity-70">(opcional)</span>
            </label>
            <input
              type="tel"
              value={completePhone}
              onChange={(e) => setCompletePhone(e.target.value)}
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
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setCompleteHtml(text);
                  } catch {
                    setCompleteError('No se pudo acceder al portapapeles');
                  }
                }}
                className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
              >
                <ClipboardPaste size={12} />
                Pegar
              </button>
            </div>
            <textarea
              value={completeHtml}
              onChange={(e) => setCompleteHtml(e.target.value)}
              placeholder="Pega aquí el código HTML..."
              className="w-full h-32 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] text-sm font-mono resize-none"
              disabled={completing}
            />
          </div>

          {completeError && (
            <p className="text-sm text-red-500">{completeError}</p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleCompleteWithHtml} disabled={completing || !completeHtml.trim()}>
              {completing ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check size={14} className="mr-1.5" />
                  Completar datos
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={() => setShowCompleteForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
