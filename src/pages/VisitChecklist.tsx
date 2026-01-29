import { useState, useMemo, useCallback } from 'react';
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
            isOpen={openSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            onCheck={handleCheck}
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
  isOpen,
  onToggle,
  onCheck,
}: {
  section: ChecklistSection;
  checklist: Record<string, boolean> | undefined;
  isOpen: boolean;
  onToggle: () => void;
  onCheck: (itemId: string, checked: boolean) => void;
}) {
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
              return (
                <li key={item.id}>
                  <label
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors ${
                      isChecked ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Priority dot */}
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[item.priority]}`}
                      title={item.priority}
                    />
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onCheck(item.id, e.target.checked)}
                      className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-[var(--color-border-strong)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-0 cursor-pointer"
                    />
                    {/* Text */}
                    <span
                      className={`text-sm leading-relaxed ${
                        isChecked
                          ? 'line-through text-[var(--color-text-tertiary)]'
                          : 'text-[var(--color-text)]'
                      }`}
                    >
                      {item.text}
                    </span>
                  </label>
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
    </div>
  );
}
