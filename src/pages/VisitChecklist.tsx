import { useState, useMemo, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Building2,
  ScanSearch,
  Plug,
  Thermometer,
  LayoutGrid,
  CookingPot,
  Users,
  FileText,
  Hammer,
  Camera,
  ListChecks,
  ShieldCheck,
  ClipboardList,
  MessageCircleQuestion,
  TriangleAlert,
  StickyNote,
  Paperclip,
  Trash2,
  X,
} from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { formatPrice } from '../lib/utils';
import {
  getApplicableSections,
  getTotalItems,
  getCheckedCount,
  PHASE_LABELS,
  type Phase,
  type Priority,
  type ChecklistSection,
} from '../lib/visitChecklist';
import type { ChecklistAttachment } from '../types';
import {
  validateFile,
  processChecklistImage,
  formatFileSize,
} from '../lib/checklistStorage';

// Map icon name strings to actual Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  Building2,
  ScanSearch,
  Plug,
  Thermometer,
  LayoutGrid,
  CookingPot,
  Users,
  FileText,
  Hammer,
  Camera,
  ListChecks,
  ShieldCheck,
  ClipboardList,
  MessageCircleQuestion,
  TriangleAlert,
};

const PRIORITY_STYLES: Record<Priority, string> = {
  critical: 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)]',
  important: 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)]',
  recommended: 'bg-[var(--color-visited)] text-[var(--color-visited-text)]',
};

const PRIORITY_DOT: Record<Priority, string> = {
  critical: 'bg-[var(--color-discarded-text)]',
  important: 'bg-[var(--color-favorite-text)]',
  recommended: 'bg-[var(--color-visited-text)]',
};

export function VisitChecklist() {
  const { id } = useParams<{ id: string }>();
  const { properties, updateProperty } = useProperties();
  const property = properties.find((p) => p.id === id);

  const [activePhase, setActivePhase] = useState<Phase>('during');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const sections = useMemo(
    () => (property ? getApplicableSections(property) : []),
    [property],
  );

  const phaseSections = useMemo(
    () => sections.filter((s) => s.phase === activePhase),
    [sections, activePhase],
  );

  const totalItems = useMemo(() => getTotalItems(sections), [sections]);
  const checkedCount = useMemo(
    () => getCheckedCount(sections, property?.visitChecklist),
    [sections, property?.visitChecklist],
  );

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleCheck = useCallback(
    async (itemId: string, checked: boolean) => {
      if (!property) return;
      const prev = property.visitChecklist || {};
      const next = { ...prev, [itemId]: checked };
      // Remove unchecked items to keep Firestore clean
      if (!checked) delete next[itemId];
      await updateProperty(property.id, { visitChecklist: next });
    },
    [property, updateProperty],
  );

  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleNote = useCallback(
    (itemId: string, text: string) => {
      if (!property) return;
      // Debounce: save 500ms after user stops typing
      if (noteTimers.current[itemId]) clearTimeout(noteTimers.current[itemId]);
      noteTimers.current[itemId] = setTimeout(async () => {
        const prev = property.visitChecklistNotes || {};
        const next = { ...prev, [itemId]: text };
        // Remove empty notes to keep Firestore clean
        if (!text.trim()) delete next[itemId];
        await updateProperty(property.id, { visitChecklistNotes: next });
      }, 500);
    },
    [property, updateProperty],
  );

  const handleAddAttachment = useCallback(
    async (itemId: string, file: File) => {
      if (!property) return;

      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }

      setProcessing((prev) => ({ ...prev, [itemId]: true }));

      try {
        const attachment = await processChecklistImage(file);

        const prev = property.visitChecklistAttachments || {};
        const itemAttachments = [...(prev[itemId] || []), attachment];
        await updateProperty(property.id, {
          visitChecklistAttachments: { ...prev, [itemId]: itemAttachments },
        });
      } catch (err) {
        console.error('Image processing failed:', err);
        alert('Error al procesar la imagen. Intentalo de nuevo.');
      } finally {
        setProcessing((prev) => ({ ...prev, [itemId]: false }));
      }
    },
    [property, updateProperty],
  );

  const handleDeleteAttachment = useCallback(
    async (itemId: string, attachmentId: string) => {
      if (!property) return;

      const prev = property.visitChecklistAttachments || {};
      const filtered = (prev[itemId] || []).filter((a) => a.id !== attachmentId);
      const next = { ...prev, [itemId]: filtered };
      if (filtered.length === 0) delete next[itemId];
      await updateProperty(property.id, { visitChecklistAttachments: next });
    },
    [property, updateProperty],
  );

  if (!property) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
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

  const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in">
      {/* Back */}
      <Link
        to={`/property/${property.id}`}
        className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-5 text-sm transition-colors"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        <span className="truncate max-w-[250px]">
          {property.title || property.zone || property.address || 'Volver'}
        </span>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-medium text-[var(--color-text)] mb-1"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Checklist de visita
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          {property.title || property.zone || property.address}
          {property.price > 0 && <> &middot; {formatPrice(property.price)}</>}
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-[var(--color-bg-active)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-[var(--color-text-tertiary)] whitespace-nowrap">
            {checkedCount}/{totalItems} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-[var(--color-bg-secondary)] rounded-lg">
        {(['before', 'during', 'after'] as Phase[]).map((phase) => {
          const phaseCount = sections.filter((s) => s.phase === phase).reduce((sum, s) => s.items.length + sum, 0);
          const phaseChecked = sections
            .filter((s) => s.phase === phase)
            .reduce((sum, s) => s.items.filter((i) => property.visitChecklist?.[i.id]).length + sum, 0);

          return (
            <button
              key={phase}
              onClick={() => setActivePhase(phase)}
              className={`flex-1 py-2 px-3 text-sm rounded-md transition-all ${
                activePhase === phase
                  ? 'bg-white text-[var(--color-text)] shadow-sm font-medium'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {PHASE_LABELS[phase]}
              <span className="ml-1.5 text-xs opacity-60">
                {phaseChecked}/{phaseCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {phaseSections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            checklist={property.visitChecklist}
            notes={property.visitChecklistNotes}
            attachments={property.visitChecklistAttachments}
            processing={processing}
            isOpen={openSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            onCheck={handleCheck}
            onNote={handleNote}
            onAddAttachment={handleAddAttachment}
            onDeleteAttachment={handleDeleteAttachment}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

function SectionBlock({
  section,
  checklist,
  notes,
  attachments,
  processing,
  isOpen,
  onToggle,
  onCheck,
  onNote,
  onAddAttachment,
  onDeleteAttachment,
}: {
  section: ChecklistSection;
  checklist: Record<string, boolean> | undefined;
  notes: Record<string, string> | undefined;
  attachments: Record<string, ChecklistAttachment[]> | undefined;
  processing: Record<string, boolean>;
  isOpen: boolean;
  onToggle: () => void;
  onCheck: (itemId: string, checked: boolean) => void;
  onNote: (itemId: string, text: string) => void;
  onAddAttachment: (itemId: string, file: File) => void;
  onDeleteAttachment: (itemId: string, attachmentId: string) => void;
}) {
  const [openNotes, setOpenNotes] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (notes) {
      for (const item of section.items) {
        if (notes[item.id]?.trim()) initial.add(item.id);
      }
    }
    return initial;
  });

  const [openAttachments, setOpenAttachments] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (attachments) {
      for (const item of section.items) {
        if (attachments[item.id]?.length) initial.add(item.id);
      }
    }
    return initial;
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const toggleNote = (itemId: string) => {
    setOpenNotes((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleAttachments = (itemId: string) => {
    setOpenAttachments((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleFileChange = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      onAddAttachment(itemId, file);
    }
    // Reset input so selecting the same file again works
    e.target.value = '';
  };

  const checked = section.items.filter((i) => checklist?.[i.id]).length;
  const total = section.items.length;
  const allDone = checked === total && total > 0;
  const IconComponent = ICON_MAP[section.icon];

  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
      {/* Section header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-bg-hover)] transition-colors"
      >
        {isOpen ? (
          <ChevronDown size={16} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
        )}
        {IconComponent && (
          <IconComponent
            size={16}
            strokeWidth={1.5}
            className={allDone ? 'text-[var(--color-visited-text)]' : 'text-[var(--color-text-secondary)]'}
          />
        )}
        <span
          className={`flex-1 text-sm font-medium ${
            allDone ? 'text-[var(--color-visited-text)]' : 'text-[var(--color-text)]'
          }`}
        >
          {section.title}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            allDone
              ? PRIORITY_STYLES.recommended
              : checked > 0
              ? 'bg-[var(--color-bg-active)] text-[var(--color-text-secondary)]'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]'
          }`}
        >
          {checked}/{total}
        </span>
      </button>

      {/* Section body */}
      {isOpen && (
        <div className="border-t border-[var(--color-border)]">
          <ul className="divide-y divide-[var(--color-border)]">
            {section.items.map((item) => {
              const isChecked = !!checklist?.[item.id];
              const hasNote = !!notes?.[item.id]?.trim();
              const noteOpen = openNotes.has(item.id);
              const itemAttachments = attachments?.[item.id] || [];
              const hasAttachments = itemAttachments.length > 0;
              const attachmentsOpen = openAttachments.has(item.id);
              const isProcessing = processing[item.id];
              return (
                <li key={item.id}>
                  <div
                    className={`flex items-start gap-3 px-4 py-3 ${
                      isChecked ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Priority dot */}
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[item.priority]}`}
                      title={item.priority}
                    />
                    {/* Checkbox */}
                    <label className="flex-shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => onCheck(item.id, e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded border-[var(--color-border-strong)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0 cursor-pointer"
                      />
                    </label>
                    {/* Text + action buttons */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1">
                        <span
                          className={`text-sm leading-relaxed flex-1 ${
                            isChecked
                              ? 'line-through text-[var(--color-text-tertiary)]'
                              : 'text-[var(--color-text)]'
                          }`}
                        >
                          {item.text}
                        </span>
                        <button
                          onClick={() => toggleNote(item.id)}
                          className={`flex-shrink-0 p-1 rounded transition-colors ${
                            hasNote
                              ? 'text-[var(--color-accent)]'
                              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                          }`}
                          title="Notas"
                        >
                          <StickyNote size={14} />
                        </button>
                        <button
                          onClick={() => toggleAttachments(item.id)}
                          className={`flex-shrink-0 p-1 rounded transition-colors relative ${
                            hasAttachments
                              ? 'text-[var(--color-accent)]'
                              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                          }`}
                          title="Adjuntos"
                        >
                          <Paperclip size={14} />
                          {hasAttachments && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--color-accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                              {itemAttachments.length}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Note textarea */}
                      {noteOpen && (
                        <textarea
                          defaultValue={notes?.[item.id] || ''}
                          onChange={(e) => onNote(item.id, e.target.value)}
                          placeholder="Escribe tus notas aqui..."
                          rows={4}
                          className="mt-2 w-full text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-[var(--color-text)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-y min-h-[120px] sm:min-h-[80px]"
                        />
                      )}

                      {/* Attachments panel */}
                      {attachmentsOpen && (
                        <div className="mt-2 space-y-2">
                          {/* Hidden file input */}
                          <input
                            ref={(el) => { fileInputRefs.current[item.id] = el; }}
                            type="file"
                            accept="image/*,application/pdf"
                            capture="environment"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileChange(item.id, e)}
                          />

                          {/* Upload button */}
                          <button
                            onClick={() => fileInputRefs.current[item.id]?.click()}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
                          >
                            <Paperclip size={12} />
                            {isProcessing ? 'Procesando...' : 'Adjuntar foto'}
                          </button>

                          {/* Attachment list */}
                          {itemAttachments.length > 0 && (
                            <div className="space-y-1.5">
                              {itemAttachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="flex items-center gap-2 p-1.5 rounded-md bg-[var(--color-bg-secondary)] group"
                                >
                                  {/* Thumbnail */}
                                  <button
                                    onClick={() => setPreviewUrl(att.data)}
                                    className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-[var(--color-bg-active)]"
                                  >
                                    <img
                                      src={att.data}
                                      alt={att.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>

                                  {/* File info */}
                                  <button
                                    onClick={() => setPreviewUrl(att.data)}
                                    className="flex-1 min-w-0 text-left"
                                  >
                                    <p className="text-xs text-[var(--color-text)] truncate">
                                      {att.name}
                                    </p>
                                    <p className="text-[10px] text-[var(--color-text-tertiary)]">
                                      {formatFileSize(att.size)}
                                    </p>
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => onDeleteAttachment(item.id, att.id)}
                                    className="flex-shrink-0 p-1 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-discarded-text)] opacity-0 group-hover:opacity-100 transition-all sm:opacity-100"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Tips */}
          {section.tips && section.tips.length > 0 && (
            <div className="px-4 py-3 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
              {section.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                  <Lightbulb size={12} className="mt-0.5 flex-shrink-0 text-[var(--color-favorite-text)]" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image preview overlay */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
          >
            <X size={24} />
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
