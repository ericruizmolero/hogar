import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Check,
  ArrowLeft,
  PhoneOff,
  ExternalLink,
  Pencil,
  ChevronDown,
  Maximize,
  BedDouble,
  Building,
} from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { formatPrice, getImageUrl } from '../lib/utils';
import type { Property } from '../types';

type Filter = 'all' | 'pending' | 'contacted';

export function ToContact() {
  const { properties, updateStatus, updateProperty } = useProperties();
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = useMemo(() => {
    return properties
      .filter((p) => {
        if (!p.contact?.phone) return false;
        const relevant = ['pending', 'favorite', 'contacted'].includes(p.status);
        if (!relevant) return false;
        if (filter === 'pending') return p.status !== 'contacted';
        if (filter === 'contacted') return p.status === 'contacted';
        return true;
      })
      .sort((a, b) => {
        const aContacted = a.status === 'contacted' ? 0 : 1;
        const bContacted = b.status === 'contacted' ? 0 : 1;
        if (aContacted !== bContacted) return aContacted - bContacted;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }, [properties, filter]);

  const noPhone = useMemo(
    () => properties.filter((p) => !p.contact?.phone && ['pending', 'favorite'].includes(p.status)),
    [properties],
  );

  const counts = useMemo(() => {
    const withPhone = properties.filter(
      (p) => p.contact?.phone && ['pending', 'favorite', 'contacted'].includes(p.status),
    );
    return {
      all: withPhone.length,
      pending: withPhone.filter((p) => p.status !== 'contacted').length,
      contacted: withPhone.filter((p) => p.status === 'contacted').length,
    };
  }, [properties]);

  const toggleContacted = useCallback(
    async (p: Property) => {
      await updateStatus(p.id, p.status === 'contacted' ? 'pending' : 'contacted');
    },
    [updateStatus],
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-3"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
        <h1
          className="text-2xl sm:text-3xl font-medium text-[var(--color-text)]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Contactar
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          {counts.pending} por llamar · {counts.contacted} contactados
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-6">
        {([
          { key: 'all', label: 'Todos', count: counts.all },
          { key: 'pending', label: 'Por contactar', count: counts.pending },
          { key: 'contacted', label: 'Contactados', count: counts.contacted },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`h-8 px-3 text-sm rounded-md transition-all inline-flex items-center ${
              filter === key
                ? 'bg-[var(--color-text)] text-white'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="py-16 text-center">
          <Phone size={32} className="mx-auto text-[var(--color-text-tertiary)] mb-3 opacity-30" strokeWidth={1.5} />
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {filter === 'contacted' ? 'Ningún piso contactado' : 'Todos contactados'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <ContactCard
              key={p.id}
              property={p}
              isExpanded={expandedId === p.id}
              onToggleExpand={() => setExpandedId(expandedId === p.id ? null : p.id)}
              onToggleContacted={() => toggleContacted(p)}
              onUpdateProperty={updateProperty}
            />
          ))}
        </div>
      )}

      {/* No phone */}
      {noPhone.length > 0 && (
        <div className="mt-10">
          <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <PhoneOff size={12} />
            Sin teléfono ({noPhone.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {noPhone.map((p) => (
              <Link
                key={p.id}
                to={`/property/${p.id}`}
                className="px-3 py-2 text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md hover:border-[var(--color-border-strong)] transition-colors"
              >
                {p.zone || p.address} · {formatPrice(p.price)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContactCard({
  property,
  isExpanded,
  onToggleExpand,
  onToggleContacted,
  onUpdateProperty,
}: {
  property: Property;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleContacted: () => void;
  onUpdateProperty: (id: string, data: Partial<Property>) => Promise<void>;
}) {
  const isContacted = property.status === 'contacted';
  const thumb = property.photos?.[0];
  const displaySize = property.builtSquareMeters || property.squareMeters;
  const agency = property.contact?.agency;
  const notes = property.callNotes;
  const preview = notes && notes.length > 50 ? notes.slice(0, 50) + '…' : notes;

  return (
    <div
      className={`group rounded-lg border overflow-hidden transition-all ${
        isContacted
          ? 'border-[var(--color-visited)]/40'
          : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
      }`}
    >
      <div className="flex">
        {/* Thumbnail - fixed aspect ratio */}
        <Link to={`/property/${property.id}`} className="flex-shrink-0 w-32 sm:w-40">
          <div className="relative aspect-square bg-[var(--color-bg-secondary)]">
            {thumb ? (
              <img
                src={getImageUrl(thumb)}
                alt={property.address}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-20">🏠</div>
            )}
            {isContacted && (
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--color-visited)] text-[var(--color-visited-text)]">
                Contactado
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-between">
          {/* Top */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <Link to={`/property/${property.id}`} className="min-w-0">
                <h3
                  className="text-base font-medium text-[var(--color-text)] truncate"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {formatPrice(property.price)}
                </h3>
              </Link>
              <Link
                to={`/property/${property.id}`}
                className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors flex-shrink-0"
              >
                <ExternalLink size={14} strokeWidth={1.5} />
              </Link>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] truncate mb-1">
              {property.zone || property.address}
            </p>
            <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-tertiary)]">
              {displaySize > 0 && (
                <span className="flex items-center gap-1">
                  <Maximize size={11} strokeWidth={1.5} /> {displaySize} m²
                </span>
              )}
              {property.rooms > 0 && (
                <span className="flex items-center gap-1">
                  <BedDouble size={11} strokeWidth={1.5} /> {property.rooms} hab
                </span>
              )}
              {property.floor && (
                <span className="flex items-center gap-1">
                  <Building size={11} strokeWidth={1.5} /> {property.floor}
                </span>
              )}
            </div>
            {agency && (
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1 truncate">{agency}</p>
            )}
          </div>

          {/* Bottom: phone + actions */}
          <div className="flex items-center gap-2 mt-3">
            <a
              href={`tel:${property.contact?.phone}`}
              className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-sm font-medium bg-[var(--color-text)] text-white hover:opacity-90 transition-opacity"
            >
              <Phone size={13} strokeWidth={1.5} />
              <span className="tabular-nums">{property.contact?.phone}</span>
            </a>
            {property.contact?.phone2 && (
              <a
                href={`tel:${property.contact.phone2}`}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors border border-[var(--color-border)]"
                title={property.contact.phone2}
              >
                <Phone size={12} strokeWidth={1.5} />
                2º
              </a>
            )}
            <button
              onClick={onToggleContacted}
              className={`h-8 px-2.5 rounded-md text-xs font-medium transition-all inline-flex items-center gap-1.5 ml-auto ${
                isContacted
                  ? 'bg-[var(--color-visited)] text-[var(--color-visited-text)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)]'
              }`}
            >
              <Check size={13} strokeWidth={2} />
              <span className="hidden sm:inline">{isContacted ? 'Contactado' : 'Marcar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notes preview or expand */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] border-t border-[var(--color-border)] transition-colors"
      >
        <span className="flex-1 text-left truncate">
          {preview || 'Añadir notas...'}
        </span>
        <ChevronDown size={12} className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <ExpandedDetails property={property} onSave={onUpdateProperty} />
      )}
    </div>
  );
}

function ExpandedDetails({
  property,
  onSave,
}: {
  property: Property;
  onSave: (id: string, data: Partial<Property>) => Promise<void>;
}) {
  const [notes, setNotes] = useState(property.callNotes || '');
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(property.contact?.phone || '');
  const [phone2, setPhone2] = useState(property.contact?.phone2 || '');
  const [email, setEmail] = useState(property.contact?.email || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNotes = useRef(notes);
  latestNotes.current = notes;

  const showSaved = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const scheduleNotesSave = useCallback(
    (text: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await onSave(property.id, { callNotes: text });
        showSaved();
      }, 800);
    },
    [property.id, onSave, showSaved],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        onSave(property.id, { callNotes: latestNotes.current });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [autoResize]);

  const handleNotesChange = (text: string) => {
    setNotes(text);
    scheduleNotesSave(text);
    autoResize();
  };

  const handleContactBlur = async (field: 'phone' | 'phone2' | 'email', value: string) => {
    const current = property.contact || { name: '', phone: '', email: '', agency: '' };
    const updated = { ...current, [field]: value };
    await onSave(property.id, { contact: updated });
    showSaved();
  };

  const inputClass =
    'w-full px-3 py-2 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-accent)] transition-colors';

  return (
    <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-border)]">
      {/* Notes */}
      <div className="relative pt-3">
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Notas sobre la llamada, disponibilidad, lo que han dicho..."
          rows={2}
          className="w-full px-3 py-2.5 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-accent)] resize-none transition-colors overflow-hidden"
        />
        {saved && (
          <span className="absolute right-2 bottom-2 text-[10px] text-[var(--color-visited-text)]">
            Guardado
          </span>
        )}
      </div>

      {/* Edit contact toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setEditing(!editing)}
          className={`inline-flex items-center gap-1.5 text-xs transition-colors ${
            editing
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <Pencil size={12} strokeWidth={1.5} />
          Editar contacto
        </button>
        {property.url && (
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
          >
            <ExternalLink size={11} strokeWidth={1.5} />
            Ver anuncio
          </a>
        )}
      </div>

      {/* Edit contact fields */}
      {editing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => handleContactBlur('phone', phone)}
            placeholder="Teléfono principal"
            className={inputClass}
          />
          <input
            type="tel"
            value={phone2}
            onChange={(e) => setPhone2(e.target.value)}
            onBlur={() => handleContactBlur('phone2', phone2)}
            placeholder="Teléfono 2"
            className={inputClass}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleContactBlur('email', email)}
            placeholder="Email"
            className={`${inputClass} sm:col-span-2`}
          />
        </div>
      )}
    </div>
  );
}
