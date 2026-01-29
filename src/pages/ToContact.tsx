import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Check, ArrowLeft, PhoneOff, Circle, CheckCircle2, ExternalLink, Pencil } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { formatPrice } from '../lib/utils';
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
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-8 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-3"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
          <h1
            className="text-xl sm:text-2xl font-medium text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Contactar
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-4">
        {([
          { key: 'all', label: 'Todos', count: counts.all },
          { key: 'pending', label: 'Por contactar', count: counts.pending },
          { key: 'contacted', label: 'Contactados', count: counts.contacted },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
              filter === key
                ? 'bg-[var(--color-text)] text-white'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Grid */}
      {list.length === 0 ? (
        <div className="py-16 text-center">
          <Phone size={28} className="mx-auto text-[var(--color-text-tertiary)] mb-3" strokeWidth={1.5} />
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {filter === 'contacted' ? 'Ningun piso contactado' : 'Todos contactados'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden sm:flex gap-2">
            {[0, 1].map((col) => (
              <div key={col} className="flex-1 flex flex-col gap-2">
                {list.filter((_, i) => i % 2 === col).map((p) => (
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
            ))}
          </div>
          <div className="sm:hidden flex flex-col gap-2">
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
        </>
      )}

      {/* No phone */}
      {noPhone.length > 0 && (
        <div className="mt-8">
          <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <PhoneOff size={12} />
            Sin telefono ({noPhone.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {noPhone.map((p) => (
              <Link
                key={p.id}
                to={`/property/${p.id}`}
                className="px-2.5 py-1 text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md hover:border-[var(--color-border-strong)] transition-colors"
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

// ---------------------------------------------------------------------------
// Card — compact, single-row feel with thumbnail
// ---------------------------------------------------------------------------

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
  const notes = property.callNotes || '';
  const preview = notes.length > 40 ? notes.slice(0, 40) + '...' : notes;
  const thumb = property.photos?.[0];

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isContacted
          ? 'border-[var(--color-visited)] bg-[var(--color-bg)]'
          : 'border-[var(--color-discarded)] bg-[var(--color-bg)]'
      }`}
    >
      {/* Compact row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Thumbnail */}
        {thumb && (
          <img
            src={thumb}
            alt=""
            className="w-9 h-9 rounded object-cover flex-shrink-0"
          />
        )}

        {/* Status icon */}
        {isContacted ? (
          <CheckCircle2 size={14} className="text-[var(--color-visited-text)] flex-shrink-0" />
        ) : (
          <Circle size={14} className="text-[var(--color-discarded-text)] flex-shrink-0" />
        )}

        {/* Zone + subtitle */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-[var(--color-text)] truncate block">
            {property.zone || property.address}
          </span>
          {/* Subtitle */}
          <p className="text-[11px] text-[var(--color-text-secondary)] truncate leading-tight mt-0.5">
            {[
              property.rooms > 0 && `${property.rooms} hab`,
              property.squareMeters > 0 && `${property.squareMeters} m²`,
              property.floor,
            ].filter(Boolean).join(' · ')}
          </p>
          {/* Notes preview */}
          {preview && (
            <p className="text-[11px] text-[var(--color-text-tertiary)] truncate leading-tight mt-0.5">
              {preview}
            </p>
          )}
        </div>

        {/* Price + Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            className="text-xs font-medium text-[var(--color-text-secondary)] tabular-nums mr-1"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {formatPrice(property.price)}
          </span>
          <Link
            to={`/property/${property.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)]"
            title="Ver ficha"
          >
            <ExternalLink size={15} strokeWidth={1.5} />
          </Link>
          <a
            href={`tel:${property.contact?.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-accent)]"
            title="Llamar"
          >
            <Phone size={15} strokeWidth={1.5} />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleContacted();
            }}
            className={`p-1.5 rounded-md transition-colors ${
              isContacted
                ? 'text-[var(--color-visited-text)] hover:bg-[var(--color-visited)]'
                : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)]'
            }`}
            title={isContacted ? 'Desmarcar contactado' : 'Marcar contactado'}
          >
            <Check size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <ExpandedDetails
          property={property}
          onSave={onUpdateProperty}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded details: notes, listing link, contact editing
// ---------------------------------------------------------------------------

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

  const agency = property.contact?.agency || '';
  const inputClass =
    'w-full px-2 py-1.5 text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-accent)] transition-colors';

  return (
    <div className="px-3 pb-3 space-y-2">
      <div className="h-px bg-[var(--color-border)]" />

      {/* Info row + action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-tertiary)]">
          {agency && <span>{agency}</span>}
          <span>{property.contact?.phone}</span>
          {property.contact?.phone2 && <span>{property.contact.phone2}</span>}
        </div>
        <div className="flex items-center gap-0.5">
          {property.url && (
            <a
              href={property.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
              title="Ver anuncio"
            >
              <ExternalLink size={13} strokeWidth={1.5} />
            </a>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className={`p-1.5 rounded-md transition-colors ${
              editing
                ? 'text-[var(--color-accent)] bg-[var(--color-bg-hover)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'
            }`}
            title="Editar contacto"
          >
            <Pencil size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Edit contact fields */}
      {editing && (
        <div className="grid grid-cols-2 gap-1.5">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => handleContactBlur('phone', phone)}
            placeholder="Teléfono"
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
            className={`${inputClass} col-span-2`}
          />
        </div>
      )}

      {/* Notes */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Notas sobre la llamada, disponibilidad..."
          rows={3}
          className="w-full px-2.5 py-2 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-accent)] resize-none transition-colors overflow-hidden"
        />
        {saved && (
          <span className="absolute right-2 bottom-2 text-[10px] text-[var(--color-visited-text)]">
            Guardado
          </span>
        )}
      </div>
    </div>
  );
}
