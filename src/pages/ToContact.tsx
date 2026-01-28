import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Copy, Check, ArrowLeft, ExternalLink, Home, PhoneCall, PhoneOff, ChevronDown, ChevronUp, Mail, Plus, Save } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { formatPrice, getImageUrl } from '../lib/utils';
import type { CallResult } from '../types';
import { STATUS_LABELS, CALL_RESULT_LABELS } from '../types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[var(--color-pending)] text-[var(--color-pending-text)]',
  contacted: 'bg-[var(--color-contacted)] text-[var(--color-contacted-text)]',
  visited: 'bg-[var(--color-visited)] text-[var(--color-visited-text)]',
  favorite: 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)]',
  discarded: 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)]',
};

type FilterStatus = 'all' | 'pending' | 'favorite' | 'contacted';

export function ToContact() {
  const { properties, updateStatus, updateProperty } = useProperties();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickCall, setShowQuickCall] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<{
    id: string;
    email: string;
    phone2: string;
    callNotes: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  // Filtrar propiedades que tienen teléfono y están en estados relevantes
  const contactableProperties = useMemo(() => {
    return properties
      .filter(p => {
        const hasPhone = p.contact?.phone;
        if (!hasPhone) return false;

        if (filter === 'all') {
          return ['pending', 'favorite', 'contacted'].includes(p.status);
        }
        return p.status === filter;
      })
      .sort((a, b) => {
        // Prioridad: favoritos primero, luego pendientes, luego contactados
        const priority: Record<string, number> = { favorite: 0, pending: 1, contacted: 2 };
        return (priority[a.status] ?? 3) - (priority[b.status] ?? 3);
      });
  }, [properties, filter]);

  const propertiesWithoutPhone = useMemo(() => {
    return properties.filter(p =>
      !p.contact?.phone &&
      ['pending', 'favorite'].includes(p.status)
    );
  }, [properties]);

  const handleCopyPhone = async (phone: string, id: string) => {
    await navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickCallResult = async (propertyId: string, _result: CallResult) => {
    // Marcar como contactado si no lo está
    // TODO: Integrar con useCalls para registrar la llamada con el resultado
    const property = properties.find(p => p.id === propertyId);
    if (property && property.status === 'pending') {
      await updateStatus(propertyId, 'contacted');
    }
    setShowQuickCall(null);
  };

  const handleExpandCard = (propertyId: string) => {
    if (expandedCard === propertyId) {
      setExpandedCard(null);
      setEditingContact(null);
    } else {
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        setExpandedCard(propertyId);
        setEditingContact({
          id: propertyId,
          email: property.contact?.email || '',
          phone2: property.contact?.phone2 || '',
          callNotes: property.callNotes || '',
        });
      }
    }
  };

  const handleSaveContactInfo = async () => {
    if (!editingContact) return;
    setSaving(true);
    try {
      const property = properties.find(p => p.id === editingContact.id);
      if (property) {
        await updateProperty(editingContact.id, {
          contact: {
            ...property.contact,
            email: editingContact.email,
            phone2: editingContact.phone2,
          },
          callNotes: editingContact.callNotes,
        });
      }
      setExpandedCard(null);
      setEditingContact(null);
    } catch (err) {
      console.error('Error guardando:', err);
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => ({
    all: properties.filter(p => p.contact?.phone && ['pending', 'favorite', 'contacted'].includes(p.status)).length,
    pending: properties.filter(p => p.contact?.phone && p.status === 'pending').length,
    favorite: properties.filter(p => p.contact?.phone && p.status === 'favorite').length,
    contacted: properties.filter(p => p.contact?.phone && p.status === 'contacted').length,
  }), [properties]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 animate-in">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-3 sm:mb-4"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
        <h1
          className="text-xl sm:text-2xl font-medium text-[var(--color-text)]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Pisos por contactar
        </h1>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
          {contactableProperties.length} pisos con teléfono
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'favorite', label: 'Favoritos' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'contacted', label: 'Contactados' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterStatus)}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-all ${
              filter === key
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            {label} ({counts[key as FilterStatus]})
          </button>
        ))}
      </div>

      {/* Lista de propiedades */}
      {contactableProperties.length === 0 ? (
        <div className="p-8 bg-[var(--color-bg-secondary)] rounded-lg text-center">
          <Phone size={32} className="mx-auto text-[var(--color-text-tertiary)] mb-3" />
          <p className="text-[var(--color-text-secondary)]">
            No hay pisos con teléfono en este filtro
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contactableProperties.map((property) => (
            <div
              key={property.id}
              className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg overflow-hidden hover:border-[var(--color-border-strong)] transition-colors"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Top row on mobile: thumbnail + content */}
                <div className="flex flex-1 min-w-0">
                  {/* Thumbnail */}
                  <Link to={`/property/${property.id}`} className="flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[var(--color-bg-secondary)]">
                      {property.photos && property.photos.length > 0 ? (
                        <img
                          src={getImageUrl(property.photos[0])}
                          alt={property.address}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)]">
                          <Home size={24} />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 p-2 sm:p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <Link
                          to={`/property/${property.id}`}
                          className="text-xs sm:text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] line-clamp-1"
                        >
                          {property.zone || property.address}
                        </Link>
                        <div className="text-base sm:text-lg font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>
                          {formatPrice(property.price)}
                        </div>
                      </div>
                      <span className={`flex-shrink-0 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${STATUS_STYLES[property.status]}`}>
                        {STATUS_LABELS[property.status]}
                      </span>
                    </div>

                    {/* Contact info */}
                    <div className="flex items-center gap-2 mt-1">
                      {property.contact?.agency && (
                        <span className="text-[10px] sm:text-xs text-[var(--color-text-tertiary)] line-clamp-1">
                          {property.contact.agency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phone actions - full width on mobile, side column on desktop */}
                <div className="flex sm:flex-col justify-center gap-2 p-2 sm:p-3 border-t sm:border-t-0 sm:border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <a
                    href={`tel:${property.contact?.phone}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-[var(--color-accent)] text-white rounded-md hover:opacity-90 transition-opacity text-sm font-medium"
                  >
                    <Phone size={14} />
                    <span className="sm:inline">Llamar</span>
                  </a>
                  <button
                    onClick={() => handleCopyPhone(property.contact?.phone || '', property.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-bg-hover)] transition-colors text-sm"
                  >
                    {copiedId === property.id ? (
                      <>
                        <Check size={14} className="text-[var(--color-visited-text)]" />
                        <span className="text-[var(--color-visited-text)] hidden sm:inline">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span className="text-[var(--color-text-secondary)] text-xs sm:text-sm">{property.contact?.phone}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick call result (expandible) */}
              {showQuickCall === property.id && (
                <div className="p-2 sm:p-3 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] mb-2">¿Cómo fue la llamada?</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {Object.entries(CALL_RESULT_LABELS).map(([result, label]) => (
                      <button
                        key={result}
                        onClick={() => handleQuickCallResult(property.id, result as CallResult)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-bg-hover)] transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowQuickCall(null)}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Quick actions bar */}
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 px-2 sm:px-3 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
                <button
                  onClick={() => setShowQuickCall(showQuickCall === property.id ? null : property.id)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                >
                  <PhoneCall size={11} />
                  <span className="hidden xs:inline">Registrar</span> llamada
                </button>
                {property.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(property.id, 'contacted')}
                    className="flex items-center gap-1 text-[10px] sm:text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-contacted-text)]"
                  >
                    <Check size={11} />
                    Contactado
                  </button>
                )}
                {property.url && (
                  <a
                    href={property.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] sm:text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
                  >
                    <ExternalLink size={11} />
                    <span className="hidden sm:inline">Ver</span> anuncio
                  </a>
                )}
                <button
                  onClick={() => handleExpandCard(property.id)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] ml-auto"
                >
                  <Plus size={11} />
                  Más
                  {expandedCard === property.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
              </div>

              {/* Expanded contact info */}
              {expandedCard === property.id && editingContact && (
                <div className="p-3 sm:p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs text-[var(--color-text-secondary)] mb-1">
                        <Mail size={10} className="inline mr-1" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={editingContact.email}
                        onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                        placeholder="email@ejemplo.com"
                        className="w-full px-2 py-1.5 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-accent)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs text-[var(--color-text-secondary)] mb-1">
                        <Phone size={10} className="inline mr-1" />
                        Teléfono 2
                      </label>
                      <input
                        type="tel"
                        value={editingContact.phone2}
                        onChange={(e) => setEditingContact({ ...editingContact, phone2: e.target.value })}
                        placeholder="Otro teléfono"
                        className="w-full px-2 py-1.5 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-accent)]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs text-[var(--color-text-secondary)] mb-1">
                      Notas de llamadas
                    </label>
                    <textarea
                      value={editingContact.callNotes}
                      onChange={(e) => setEditingContact({ ...editingContact, callNotes: e.target.value })}
                      placeholder="Apuntes sobre llamadas, disponibilidad, etc."
                      rows={3}
                      className="w-full px-2 py-1.5 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-accent)] resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setExpandedCard(null); setEditingContact(null); }}
                      className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveContactInfo}
                      disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--color-accent)] text-white rounded hover:opacity-90 disabled:opacity-50"
                    >
                      <Save size={12} />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pisos sin teléfono */}
      {propertiesWithoutPhone.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <h2 className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-2">
            <PhoneOff size={14} />
            Sin teléfono ({propertiesWithoutPhone.length})
          </h2>
          <div className="p-3 sm:p-4 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-2 sm:mb-3">
              Pisos sin teléfono registrado:
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {propertiesWithoutPhone.map((p) => (
                <Link
                  key={p.id}
                  to={`/property/${p.id}`}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md hover:border-[var(--color-accent)] transition-colors"
                >
                  {p.zone || p.address} - {formatPrice(p.price)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
