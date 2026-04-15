import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useVisits } from '../hooks/useVisits';
import { useProperties } from '../hooks/useProperties';
import { formatPrice } from '../lib/utils';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { Visit, Property } from '../types';

const DAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function propertyLabel(p: Property) {
  const parts: string[] = [];
  const loc = p.zone || p.address || p.title || 'Sin dirección';
  parts.push(loc);
  if (p.price) parts.push(formatPrice(p.price));
  const size = p.builtSquareMeters || p.squareMeters;
  if (size) parts.push(`${size} m²`);
  if (p.rooms) parts.push(`${p.rooms} hab`);
  if (p.floor) parts.push(p.floor);
  return parts.join(' · ');
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { date: Date; currentMonth: boolean }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      currentMonth: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      currentMonth: true,
    });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        currentMonth: false,
      });
    }
  }

  return days;
}

export function MiniCalendar() {
  const { visits, loading, addVisit, deleteVisit } = useVisits();
  const { properties } = useProperties();

  const today = new Date();
  const [expanded, setExpanded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ propertyId: '', notes: '' });
  const [pickYear, setPickYear] = useState(today.getFullYear());
  const [pickMonth, setPickMonth] = useState(today.getMonth());
  const [pickDay, setPickDay] = useState<number | null>(null);
  const [pickHour, setPickHour] = useState<number | null>(null);
  const [pickMinute, setPickMinute] = useState<number | null>(null);

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const visitsByDate = useMemo(() => {
    const map = new Map<string, Visit[]>();
    visits.forEach((v) => {
      const key = `${v.date.getFullYear()}-${v.date.getMonth()}-${v.date.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    });
    return map;
  }, [visits]);

  const upcomingVisits = useMemo(() => {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return visits
      .filter((v) => v.date >= startOfToday)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [visits, today]);

  const selectedDateVisits = useMemo(() => {
    if (!selectedDate) return [];
    return visits
      .filter((v) => isSameDay(v.date, selectedDate))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [visits, selectedDate]);

  const getPropertyInfo = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId);
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  const handleDayClick = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const pickDays = useMemo(() => getCalendarDays(pickYear, pickMonth), [pickYear, pickMonth]);

  const openAddForm = (prefilledDate?: Date) => {
    const d = prefilledDate || selectedDate || new Date();
    setPickYear(d.getFullYear());
    setPickMonth(d.getMonth());
    setPickDay(d.getDate());
    setPickHour(null);
    setPickMinute(null);
    setFormData({ propertyId: '', notes: '' });
    setShowAddForm(true);
  };

  const canSubmit = formData.propertyId && pickDay !== null && pickHour !== null && pickMinute !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const visitDate = new Date(pickYear, pickMonth, pickDay!, pickHour!, pickMinute!);

    await addVisit({
      propertyId: formData.propertyId,
      date: visitDate,
      notes: formData.notes,
    });

    setShowAddForm(false);
  };

  const pickPrevMonth = () => {
    if (pickMonth === 0) { setPickMonth(11); setPickYear(pickYear - 1); }
    else setPickMonth(pickMonth - 1);
    setPickDay(null);
  };
  const pickNextMonth = () => {
    if (pickMonth === 11) { setPickMonth(0); setPickYear(pickYear + 1); }
    else setPickMonth(pickMonth + 1);
    setPickDay(null);
  };

  const formatDayLabel = (date: Date) => {
    const dayOfWeek = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const dayNum = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'long' });
    return `${dayOfWeek} ${dayNum} de ${month}`;
  };

  // Summary for the collapsed bar
  const nextVisit = upcomingVisits[0];
  const nextVisitProperty = nextVisit ? getPropertyInfo(nextVisit.propertyId) : null;

  if (loading) return null;

  return (
    <div className="mb-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden">
      {/* Collapsed header bar - always visible, single line */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full h-10 px-4 flex items-center gap-2 hover:bg-[var(--color-bg-hover)] transition-colors overflow-hidden"
      >
        <Calendar size={14} strokeWidth={1.5} className="text-[var(--color-text-secondary)] flex-shrink-0" />
        <span className="text-sm font-medium text-[var(--color-text)] flex-shrink-0 leading-none">Visitas</span>
        {upcomingVisits.length > 0 && (
          <span className="text-[11px] leading-none px-1.5 py-0.5 rounded-full bg-[var(--color-contacted)] text-[var(--color-contacted-text)] font-medium flex-shrink-0">
            {upcomingVisits.length}
          </span>
        )}
        {!expanded && nextVisit && (
          <span className="text-xs leading-none text-[var(--color-text-tertiary)] truncate hidden sm:block">
            — {nextVisit.date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} {formatTime(nextVisit.date)}
            {nextVisitProperty && ` · ${nextVisitProperty.zone || nextVisitProperty.address}`}
          </span>
        )}
        <span className="flex-1" />
        <span
          onClick={(e) => { e.stopPropagation(); openAddForm(); }}
          className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-active)] transition-all flex-shrink-0"
          title="Nueva visita"
        >
          <Plus size={14} strokeWidth={1.5} />
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className={`text-[var(--color-text-tertiary)] transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="border-t border-[var(--color-border)]">
          <div className="flex flex-col lg:flex-row">
            {/* Calendar grid */}
            <div className="p-4 lg:border-r lg:border-[var(--color-border)]">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-all"
                >
                  <ChevronLeft size={16} strokeWidth={1.5} />
                </button>
                <button
                  onClick={goToToday}
                  className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors"
                >
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-all"
                >
                  <ChevronRight size={16} strokeWidth={1.5} />
                </button>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-0 mb-1">
                {DAY_NAMES.map((name) => (
                  <div
                    key={name}
                    className="text-center text-[11px] font-medium text-[var(--color-text-tertiary)] py-1"
                  >
                    {name}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-0">
                {calendarDays.map(({ date, currentMonth: isCurrent }, idx) => {
                  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                  const dayVisits = visitsByDate.get(key) || [];
                  const hasVisits = dayVisits.length > 0;
                  const isToday = isSameDay(date, today);
                  const isSelected = selectedDate && isSameDay(date, selectedDate);

                  return (
                    <button
                      key={idx}
                      onClick={() => handleDayClick(date)}
                      className={`
                        relative w-8 h-8 flex flex-col items-center justify-center rounded-md text-xs transition-all mx-auto
                        ${!isCurrent ? 'text-[var(--color-text-tertiary)] opacity-40' : 'text-[var(--color-text-secondary)]'}
                        ${isToday && !isSelected ? 'font-bold text-[var(--color-accent)]' : ''}
                        ${isSelected
                          ? 'bg-[var(--color-text)] text-white font-medium'
                          : 'hover:bg-[var(--color-bg-hover)]'
                        }
                      `}
                    >
                      <span>{date.getDate()}</span>
                      {hasVisits && (
                        <div className="absolute bottom-0.5 flex gap-0.5">
                          {dayVisits.slice(0, 3).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-1 rounded-full ${
                                isSelected ? 'bg-white/70' : 'bg-[var(--color-accent)]'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right panel: selected day or upcoming */}
            <div className="flex-1 min-w-0 p-4 border-t lg:border-t-0">
              {selectedDate ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-[var(--color-text)] capitalize">
                      {formatDayLabel(selectedDate)}
                    </h3>
                    <button
                      onClick={() => openAddForm(selectedDate)}
                      className="text-xs text-[var(--color-accent)] hover:underline"
                    >
                      + Añadir
                    </button>
                  </div>

                  {selectedDateVisits.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      Sin visitas este día
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateVisits.map((visit) => (
                        <VisitItem
                          key={visit.id}
                          visit={visit}
                          property={getPropertyInfo(visit.propertyId)}
                          onDelete={deleteVisit}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">
                    Próximas visitas
                  </h3>
                  {upcomingVisits.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      No hay visitas programadas
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingVisits.slice(0, 5).map((visit) => (
                        <VisitItem
                          key={visit.id}
                          visit={visit}
                          property={getPropertyInfo(visit.propertyId)}
                          onDelete={deleteVisit}
                          showDate
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add visit modal */}
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Nueva visita">
        <div className="space-y-5">
          {/* Property selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">Propiedad</label>
            <select
              value={formData.propertyId}
              onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
              className="appearance-none w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-strong)] transition-colors cursor-pointer"
            >
              <option value="">Selecciona propiedad</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {propertyLabel(p)}
                </option>
              ))}
            </select>
          </div>

          {/* Inline calendar picker */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 block">Fecha</label>
            <div className="border border-[var(--color-border)] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={pickPrevMonth} className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-all">
                  <ChevronLeft size={16} strokeWidth={1.5} />
                </button>
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {MONTH_NAMES[pickMonth]} {pickYear}
                </span>
                <button type="button" onClick={pickNextMonth} className="p-1 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-all">
                  <ChevronRight size={16} strokeWidth={1.5} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0 mb-1">
                {DAY_NAMES.map((n) => (
                  <div key={n} className="text-center text-[11px] font-medium text-[var(--color-text-tertiary)] py-1">{n}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0">
                {pickDays.map(({ date: d, currentMonth: cur }, idx) => {
                  const isPickToday = isSameDay(d, today);
                  const isPicked = pickDay === d.getDate() && cur;
                  const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate()) && cur;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!cur || isPast}
                      onClick={() => setPickDay(d.getDate())}
                      className={`
                        w-8 h-8 mx-auto flex items-center justify-center rounded-md text-xs transition-all
                        ${!cur ? 'text-[var(--color-text-tertiary)] opacity-20 cursor-default' : ''}
                        ${isPast ? 'text-[var(--color-text-tertiary)] opacity-30 cursor-not-allowed' : ''}
                        ${cur && !isPast && !isPicked ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer' : ''}
                        ${isPickToday && !isPicked ? 'font-bold text-[var(--color-accent)]' : ''}
                        ${isPicked ? 'bg-[var(--color-text)] text-white font-medium' : ''}
                      `}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time picker */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-2 block">Hora</label>
            <div className="border border-[var(--color-border)] rounded-lg p-3">
              {/* Hours */}
              <div className="flex flex-wrap gap-1 mb-3">
                {Array.from({ length: 13 }, (_, i) => i + 9).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setPickHour(h)}
                    className={`w-10 h-8 rounded-md text-xs font-medium transition-all ${
                      pickHour === h
                        ? 'bg-[var(--color-text)] text-white'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                ))}
              </div>
              {/* Minutes */}
              {pickHour !== null && (
                <div className="flex flex-wrap gap-1">
                  {[0, 15, 30, 45].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPickMinute(m)}
                      className={`flex-1 h-8 rounded-md text-xs font-medium transition-all ${
                        pickMinute === m
                          ? 'bg-[var(--color-text)] text-white'
                          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                      }`}
                    >
                      {String(pickHour).padStart(2, '0')}:{String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <Input
            label="Notas (opcional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Llevar cinta métrica..."
          />

          {/* Summary + submit */}
          <div className="flex items-center justify-between pt-1">
            {canSubmit ? (
              <p className="text-sm text-[var(--color-text-secondary)]">
                {new Date(pickYear, pickMonth, pickDay!).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {String(pickHour).padStart(2, '0')}:{String(pickMinute!).padStart(2, '0')}
              </p>
            ) : (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {!formData.propertyId ? 'Selecciona propiedad' : pickDay === null ? 'Selecciona día' : pickHour === null ? 'Selecciona hora' : 'Selecciona minutos'}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                Crear
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Exported so PropertyCard can look up upcoming visits per property */
export { isSameDay };

function VisitItem({
  visit,
  property,
  onDelete,
  showDate,
}: {
  visit: Visit;
  property?: Property;
  onDelete: (id: string) => Promise<void>;
  showDate?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  const location = property
    ? property.zone || property.address || property.title || 'Propiedad'
    : 'Propiedad eliminada';

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await onDelete(visit.id);
  };

  const isToday = isSameDay(visit.date, new Date());
  const isPast = visit.date < new Date() && !isToday;

  const dateLabel = showDate
    ? visit.date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    : null;

  return (
    <Link
      to={property ? `/property/${property.id}` : '#'}
      className={`group block rounded-lg border p-3 transition-all ${
        isPast
          ? 'border-[var(--color-border)] opacity-40'
          : isToday
            ? 'border-[var(--color-accent)]/20 bg-[var(--color-contacted)]/20'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-hover)]'
      }`}
    >
      {/* Row 1: time + date + delete */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-base font-medium leading-none ${
              isToday ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'
            }`}
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {formatTime(visit.date)}
          </span>
          {dateLabel && (
            <span className="text-[11px] text-[var(--color-text-tertiary)] capitalize">
              {dateLabel}
            </span>
          )}
        </div>
        <div
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.preventDefault()}
        >
          {confirming ? (
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-discarded)] text-[var(--color-discarded-text)]"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-discarded-text)] transition-colors"
              title="Eliminar visita"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: location */}
      <p className="text-sm text-[var(--color-text)] truncate">
        {location}
      </p>

      {/* Row 3: details */}
      {property && (
        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 truncate">
          {formatPrice(property.price)} · {property.builtSquareMeters || property.squareMeters} m² · {property.rooms} hab
          {property.floor ? ` · ${property.floor}` : ''}
        </p>
      )}

      {/* Row 4: notes */}
      {visit.notes && (
        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1 truncate italic">
          {visit.notes}
        </p>
      )}
    </Link>
  );
}
