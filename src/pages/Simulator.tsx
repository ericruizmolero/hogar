import { useState, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Download, Loader2, Save, Trash2, History, ChevronDown, Pencil } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { useMortgageCalculator, formatCurrency } from '../hooks/useMortgageCalculator';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import { useSimulations } from '../hooks/useSimulations';
import { formatPrice, getImageUrl } from '../lib/utils';

export function Simulator() {
  const { properties, loading: loadingProps } = useProperties();
  const { profile, loading: loadingProfile } = useFinancialProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(2.5);
  const [years, setYears] = useState(30);
  const [itpReduced, setItpReduced] = useState(false);
  const [priceExVat, setPriceExVat] = useState(false);
  const [includeRenovation, setIncludeRenovation] = useState(false);
  const [renovationBudget, setRenovationBudget] = useState(0);
  const [renoPerSqm, setRenoPerSqm] = useState(500);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingSimId, setEditingSimId] = useState<string | null>(null);
  const { simulations, saveSimulation, updateSimulation, deleteSimulation } = useSimulations();

  const selected = useMemo(
    () => (selectedId ? properties.find((p) => p.id === selectedId) : null) || null,
    [properties, selectedId],
  );

  // When property changes via selector, pre-fill defaults (skip when loading a simulation)
  const prevSelectedRef = useRef(selectedId);
  const skipAutoReset = useRef(false);
  if (selectedId !== prevSelectedRef.current) {
    prevSelectedRef.current = selectedId;
    if (skipAutoReset.current) {
      skipAutoReset.current = false;
    } else {
      setCustomPrice(null);
      setPriceExVat(!!selected?.isNewBuild);
      const reno = selected?.needsRenovation || 'no';
      if (reno !== 'no') {
        setIncludeRenovation(true);
        const sqm = selected?.builtSquareMeters || selected?.squareMeters || 0;
        const defaultPerSqm = reno === 'total' ? 700 : 500;
        setRenoPerSqm(defaultPerSqm);
        setRenovationBudget(sqm * defaultPerSqm);
      } else {
        setIncludeRenovation(false);
        setRenovationBudget(0);
      }
    }
  }

  const basePrice = selected ? (priceExVat ? Math.round(selected.price * 1.10) : selected.price) : 0;
  const effectivePrice = customPrice ?? basePrice;

  const { calc, verdict } = useMortgageCalculator({
    propertyPrice: effectivePrice,
    downPaymentPercent: downPct,
    interestRate: rate,
    years,
    itpReduced,
    renovationBudget: includeRenovation ? renovationBudget : 0,
  });

  const fmt = formatCurrency;
  const loading = loadingProps || loadingProfile;

  const buildSimData = useCallback(() => {
    if (!selected) return null;
    return {
      propertyId: selected.id,
      propertyZone: selected.zone || '',
      propertyAddress: selected.address || '',
      effectivePrice,
      basePrice,
      downPct,
      rate,
      years,
      itpReduced,
      priceExVat,
      includeRenovation,
      renovationBudget: includeRenovation ? renovationBudget : 0,
      customPrice,
      totalNeededForPurchase: calc.totalNeededForPurchase,
      totalMonthly: calc.totalMonthly,
      monthlyMortgage: calc.monthlyMortgage,
      percentageOfIncome: calc.percentageOfIncome,
      verdictText: verdict.text,
      bankFinances: calc.bankFinances,
    };
  }, [selected, effectivePrice, basePrice, downPct, rate, years, itpReduced, priceExVat, includeRenovation, renovationBudget, customPrice, calc, verdict]);

  const handleSaveSimulation = useCallback(async () => {
    const data = buildSimData();
    if (!data) return;
    setSaving(true);
    if (editingSimId) {
      await updateSimulation(editingSimId, data);
    } else {
      await saveSimulation(data);
    }
    setSaving(false);
    setEditingSimId(null);
  }, [buildSimData, editingSimId, saveSimulation, updateSimulation]);

  const loadSimulation = useCallback((sim: typeof simulations[0], edit = false) => {
    skipAutoReset.current = true;
    setSelectedId(sim.propertyId);
    setDownPct(sim.downPct);
    setRate(sim.rate);
    setYears(sim.years);
    setItpReduced(sim.itpReduced);
    setPriceExVat(sim.priceExVat);
    setIncludeRenovation(sim.includeRenovation);
    setRenovationBudget(sim.renovationBudget);
    setCustomPrice(sim.customPrice);
    // Recalculate €/m² from saved budget
    const prop = properties.find(p => p.id === sim.propertyId);
    const sqm = prop?.builtSquareMeters || prop?.squareMeters || 0;
    setRenoPerSqm(sqm > 0 && sim.renovationBudget > 0 ? Math.round(sim.renovationBudget / sqm) : 500);
    setEditingSimId(edit ? sim.id : null);
    setShowHistory(false);
  }, [properties]);

  const handleDownloadPdf = useCallback(async () => {
    if (!selected) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const m = 18; // left margin
      const r = pageW - m; // right edge
      let y = 0;
      const lineH = 6; // row height
      const gapSection = 8; // gap between sections

      const checkPage = (need = 25) => {
        if (y + need > pageH - 20) {
          pdf.addPage();
          y = 22;
        }
      };

      const section = (text: string) => {
        checkPage(30);
        y += gapSection;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(155, 155, 150);
        pdf.text(text.toUpperCase(), m, y);
        y += 4;
        pdf.setDrawColor(230, 230, 225);
        pdf.setLineWidth(0.3);
        pdf.line(m, y, r, y);
        y += 5;
      };

      const row = (label: string, value: string, style: 'normal' | 'bold' | 'muted' = 'normal') => {
        checkPage(lineH + 2);
        pdf.setFontSize(style === 'muted' ? 8.5 : 9.5);
        pdf.setFont('helvetica', style === 'bold' ? 'bold' : 'normal');
        pdf.setTextColor(style === 'muted' ? 160 : 55, style === 'muted' ? 160 : 53, style === 'muted' ? 155 : 47);
        pdf.text(label, m, y);
        pdf.text(value, r, y, { align: 'right' });
        y += lineH;
      };

      const gap = (px = 2) => { y += px; };

      const divider = () => {
        y += 2;
        pdf.setDrawColor(235, 235, 230);
        pdf.setLineWidth(0.2);
        pdf.line(m, y, r, y);
        y += 4;
      };

      // ── Header ──
      y = 25;
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 53, 47);
      pdf.text('Simulacion de hipoteca', m, y);
      y += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 53, 47);
      const priceLabel = customPrice && customPrice !== basePrice
        ? `${formatPrice(effectivePrice)} (negociado desde ${formatPrice(basePrice)})`
        : formatPrice(effectivePrice);
      pdf.text(`${selected.zone || selected.address}  ·  ${priceLabel}`, m, y);
      y += 6;

      // Property details
      const displaySize = selected.builtSquareMeters || selected.squareMeters;
      const details = [
        displaySize > 0 ? `${displaySize} m2` : '',
        selected.rooms > 0 ? `${selected.rooms} hab` : '',
        selected.bathrooms > 0 ? `${selected.bathrooms} banos` : '',
        selected.floor || '',
        selected.address && selected.zone ? selected.address : '',
      ].filter(Boolean).join('  ·  ');

      if (details) {
        pdf.setFontSize(9);
        pdf.setTextColor(130, 130, 125);
        pdf.text(details, m, y);
        y += 5;
      }

      if (priceExVat) {
        pdf.setFontSize(8);
        pdf.setTextColor(155, 155, 150);
        pdf.text(`Precio publicado sin IVA: ${formatPrice(selected.price)} + 10% IVA`, m, y);
        y += 5;
      }

      pdf.setFontSize(8);
      pdf.setTextColor(170, 170, 165);
      pdf.text(new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), m, y);
      y += 2;

      // ── Resumen ──
      section('Resumen');
      row('Dia de la firma', fmt(calc.totalNeededForPurchase), 'bold');
      row('Cuota mensual', `${fmt(calc.totalMonthly)}/mes`, 'bold');
      row('% de ingresos', `${calc.percentageOfIncome.toFixed(0)}%`);
      row('Os queda para vivir', `${fmt(calc.leftToLive)}/mes`);
      row('Veredicto', verdict.text, 'bold');

      // ── Compra ──
      section('Compra');
      row('Precio', fmt(effectivePrice));
      if (priceExVat) row('IVA incluido', 'Si', 'muted');
      row(`Entrada (${downPct}%)`, fmt(calc.downPayment));
      row(`ITP (${itpReduced ? '2,5%' : '4%'})`, fmt(calc.itp));
      row('Notaria, registro, gestoria', `~${fmt(calc.otherExpenses)}`);
      divider();
      row('Total dia de la firma', fmt(calc.totalNeededForPurchase), 'bold');

      // ── Hipoteca ──
      section('Hipoteca');
      row('El banco presta', fmt(calc.bankFinances));
      row(`Cuota (${rate}% a ${years} anos)`, `${fmt(calc.monthlyMortgage)}/mes`);
      row('Gastos vivienda (comunidad, IBI...)', `${fmt(profile.monthlyExpenses)}/mes`);
      divider();
      row('Total mensual', `${fmt(calc.totalMonthly)}/mes`, 'bold');

      // ── Reforma ──
      const renoHalf = includeRenovation ? renovationBudget / 2 : 0;
      if (includeRenovation && renovationBudget > 0) {
        section('Reforma (aparte del banco)');
        row('Presupuesto', fmt(renovationBudget));
        row('Cada persona (50%)', fmt(renovationBudget / 2));
      }

      // ── Persona 1 ──
      const n1 = profile.name1 || 'Persona 1';
      const n2 = profile.name2 || 'Persona 2';
      section(n1);
      row('Ahorros', fmt(profile.savings1));
      row('Firma (50%)', `-${fmt(calc.halfNeeded)}`);
      divider();
      row('Le queda', fmt(calc.person1Remaining), 'bold');
      if (renoHalf > 0) {
        row('Reforma (50%)', `-${fmt(renoHalf)}`);
        row('Tras reforma', fmt(calc.person1Remaining - renoHalf), 'bold');
      }
      gap(3);
      row('Devuelve al banco', fmt(calc.totalPaid / 2), 'muted');
      row('Cuota mensual', `${fmt(calc.totalMonthly / 2)}/mes`, 'muted');
      row('Si cancela deuda hoy', fmt((calc.person1Remaining - renoHalf) - calc.bankFinances / 2), 'muted');

      // ── Persona 2 ──
      section(n2);
      row('Ahorros', fmt(profile.savings2));
      row('Firma (50%)', `-${fmt(calc.halfNeeded)}`);
      divider();
      row('Le queda', fmt(calc.person2Remaining), 'bold');
      if (renoHalf > 0) {
        row('Reforma (50%)', `-${fmt(renoHalf)}`);
        row('Tras reforma', fmt(calc.person2Remaining - renoHalf), 'bold');
      }
      gap(3);
      row('Devuelve al banco', fmt(calc.totalPaid / 2), 'muted');
      row('Cuota mensual', `${fmt(calc.totalMonthly / 2)}/mes`, 'muted');
      row('Si cancela deuda hoy', fmt((calc.person2Remaining - renoHalf) - calc.bankFinances / 2), 'muted');

      // ── Deuda total ──
      y += gapSection;
      checkPage(10);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(170, 170, 165);
      pdf.text(`Deuda total: ${fmt(calc.bankFinances)}  ·  Devolvereis ${fmt(calc.totalPaid)} (${fmt(calc.totalInterest)} en intereses a ${years} anos)`, m, y);

      // ── Footer: logo + branding ──
      const footerY = pageH - 12;
      // House icon (simplified path as lines)
      pdf.setDrawColor(55, 53, 47);
      pdf.setLineWidth(0.5);
      const hx = m; const hy = footerY - 2;
      // Roof
      pdf.line(hx, hy + 3, hx + 3, hy);
      pdf.line(hx + 3, hy, hx + 6, hy + 3);
      // Walls
      pdf.line(hx + 1, hy + 3, hx + 1, hy + 6);
      pdf.line(hx + 5, hy + 3, hx + 5, hy + 6);
      pdf.line(hx + 1, hy + 6, hx + 5, hy + 6);
      // Door
      pdf.line(hx + 2.5, hy + 4, hx + 2.5, hy + 6);
      pdf.line(hx + 3.5, hy + 4, hx + 3.5, hy + 6);
      pdf.line(hx + 2.5, hy + 4, hx + 3.5, hy + 4);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 53, 47);
      pdf.text('Hogar', hx + 8, footerY + 2);

      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(170, 170, 165);
      pdf.text('Generado con Hogar App', r, footerY + 2, { align: 'right' });

      const filename = `simulacion-${(selected.zone || selected.address || 'propiedad').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [selected, effectivePrice, basePrice, customPrice, priceExVat, downPct, rate, years, itpReduced, calc, verdict, profile, includeRenovation, renovationBudget, fmt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-text-tertiary)]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-4"
      >
        <ArrowLeft size={16} />
        Volver
      </Link>

      <h1
        className="text-2xl sm:text-3xl font-medium text-[var(--color-text)] mb-1"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Simulador
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-6">
        Selecciona un piso y ajusta las condiciones
      </p>

      {/* Property selector */}
      <div className="mb-6">
        <select
          value={selectedId || ''}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="w-full appearance-none px-4 py-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-strong)] transition-colors cursor-pointer"
        >
          <option value="">Elige una propiedad...</option>
          {properties.map((p) => {
            const size = p.builtSquareMeters || p.squareMeters;
            return (
              <option key={p.id} value={p.id}>
                {p.zone || p.address} · {formatPrice(p.price)} · {size} m² · {p.rooms} hab
              </option>
            );
          })}
        </select>
      </div>

      {/* Selected property card */}
      {selected && (
        <div className="mb-6 rounded-lg border border-[var(--color-border)] overflow-hidden">
          <div className="flex items-center gap-3 p-3">
            {selected.photos?.[0] && (
              <img
                src={getImageUrl(selected.photos[0])}
                alt=""
                className="w-14 h-14 rounded-md object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-base font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>
                {priceExVat ? (
                  <>
                    {formatPrice(effectivePrice)}
                    <span className="text-xs font-normal text-[var(--color-text-tertiary)] ml-1.5">
                      ({formatPrice(selected.price)} + 10% IVA)
                    </span>
                  </>
                ) : (
                  formatPrice(selected.price)
                )}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)] truncate">
                {selected.zone || selected.address}
              </div>
            </div>
            <Link to={`/property/${selected.id}`} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] flex-shrink-0">
              Ver ficha
            </Link>
          </div>
          {/* Price ex VAT toggle */}
          <button
            onClick={() => setPriceExVat(!priceExVat)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs border-t border-[var(--color-border)] transition-colors ${
              priceExVat
                ? 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)]'
                : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            <span>El precio publicado es sin IVA (obra nueva)</span>
            <span className={`inline-flex items-center w-7 h-4 rounded-full transition-colors flex-shrink-0 ${priceExVat ? 'bg-[var(--color-favorite-text)]' : 'bg-[var(--color-border-strong)]'}`}>
              <span className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${priceExVat ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </span>
          </button>
          {/* Negotiated price */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-tertiary)]">Precio negociado</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={customPrice ?? basePrice}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setCustomPrice(isNaN(v) ? null : v);
                }}
                className="w-28 px-2 py-1 text-xs text-right bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-strong)]"
              />
              <span className="text-xs text-[var(--color-text-tertiary)]">€</span>
              {customPrice !== null && customPrice !== basePrice && (
                <button
                  onClick={() => setCustomPrice(null)}
                  className="text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          {customPrice !== null && customPrice !== basePrice && (
            <div className="px-3 py-1.5 bg-[var(--color-favorite)] text-[var(--color-favorite-text)] text-xs border-t border-[var(--color-border)]">
              {customPrice < basePrice
                ? `Negociado ${fmt(basePrice - customPrice)} menos (${((1 - customPrice / basePrice) * 100).toFixed(1)}% descuento)`
                : `${fmt(customPrice - basePrice)} más que el precio publicado`
              }
            </div>
          )}
        </div>
      )}

      {!selected && (
        <div className="py-16 text-center">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Selecciona un piso de arriba para simular
          </p>
        </div>
      )}

      {selected && (
        <div className="space-y-4">
          <div className="space-y-4">
          {/* Results - always visible */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Día de la firma</div>
              <div className="text-xl font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>
                {fmt(calc.totalNeededForPurchase)}
              </div>
              <div className={`mt-1 text-xs ${calc.canAffordPurchase ? 'text-[var(--color-visited-text)]' : 'text-[var(--color-discarded-text)]'}`}>
                {calc.canAffordPurchase
                  ? `Tenéis de sobra (${fmt(calc.totalSavings)})`
                  : `Os faltan ${fmt(calc.totalNeededForPurchase - calc.totalSavings)}`
                }
              </div>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Cuota mensual</div>
              <div className="text-xl font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>
                {fmt(calc.totalMonthly)}
              </div>
              <div className={`mt-1.5 text-xs ${calc.isComfortable ? 'text-[var(--color-visited-text)]' : calc.isViable ? 'text-[var(--color-favorite-text)]' : 'text-[var(--color-discarded-text)]'}`}>
                {calc.percentageOfIncome.toFixed(0)}% de vuestros ingresos
              </div>
            </div>
          </div>

          {/* Verdict banner */}
          <div className={`p-3 rounded-lg text-sm font-medium text-center ${verdict.style}`}>
            {verdict.text} — Os queda {fmt(calc.leftToLive)}/mes para vivir
          </div>

          {/* Down payment slider */}
          <div className="p-4 rounded-lg border border-[var(--color-border)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-[var(--color-text)]">Entrada</span>
              <span className="text-sm font-medium text-[var(--color-text)]">{fmt(calc.downPayment)} ({downPct}%)</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={downPct}
              onChange={(e) => setDownPct(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[var(--color-bg-active)] rounded-full appearance-none cursor-pointer accent-[var(--color-text)]"
            />
            <div className="flex justify-between text-[11px] text-[var(--color-text-tertiary)] mt-1.5">
              <span>20% mínimo</span>
              <span>100%</span>
            </div>
          </div>

          {/* Renovation toggle */}
          <div className="p-4 rounded-lg border border-[var(--color-border)]">
            <button
              onClick={() => {
                const next = !includeRenovation;
                setIncludeRenovation(next);
                if (next && renovationBudget === 0 && selected) {
                  const sqm = selected.builtSquareMeters || selected.squareMeters;
                  setRenovationBudget(sqm * renoPerSqm);
                }
              }}
              className={`w-full flex items-center justify-between text-sm ${
                includeRenovation ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <span>Incluir reforma</span>
              <span className={`inline-flex items-center w-7 h-4 rounded-full transition-colors flex-shrink-0 ${includeRenovation ? 'bg-[var(--color-text)]' : 'bg-[var(--color-border-strong)]'}`}>
                <span className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${includeRenovation ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
              </span>
            </button>
            {includeRenovation && selected && (
              <div className="mt-3 space-y-3">
                {/* €/m² presets */}
                <div>
                  <div className="text-xs text-[var(--color-text-tertiary)] mb-1.5">Precio por m²</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[300, 500, 700, 900, 1100, 1400].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setRenoPerSqm(v);
                          setRenovationBudget((selected.builtSquareMeters || selected.squareMeters) * v);
                        }}
                        className={`h-8 px-2.5 text-xs rounded-md transition-all inline-flex items-center ${
                          renoPerSqm === v
                            ? 'bg-[var(--color-text)] text-white'
                            : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                        }`}
                      >
                        {v} €/m²
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="text-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-secondary)]">Superficie</span>
                    <span className="text-[var(--color-text)]">{selected.builtSquareMeters || selected.squareMeters} m²</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[var(--color-text-secondary)]">Coste/m²</span>
                      <button onClick={() => { const v = Math.max(0, renoPerSqm - 50); setRenoPerSqm(v); setRenovationBudget((selected.builtSquareMeters || selected.squareMeters) * v); }} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] text-xs px-0.5">-</button>
                      <button onClick={() => { const v = renoPerSqm + 50; setRenoPerSqm(v); setRenovationBudget((selected.builtSquareMeters || selected.squareMeters) * v); }} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] text-xs px-0.5">+</button>
                    </div>
                    <span className="text-[var(--color-text)] tabular-nums">{renoPerSqm} €/m²</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-[var(--color-border)] font-medium text-[var(--color-text)]">
                    <span>Total reforma</span>
                    <span>{fmt(renovationBudget)}</span>
                  </div>
                </div>

                {/* Manual override */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">Manual:</span>
                  <input
                    type="number"
                    value={renovationBudget}
                    onChange={(e) => {
                      const v = Math.max(0, parseInt(e.target.value) || 0);
                      setRenovationBudget(v);
                      const sqm = selected.builtSquareMeters || selected.squareMeters;
                      if (sqm > 0) setRenoPerSqm(Math.round(v / sqm));
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-strong)] text-right tabular-nums"
                  />
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">€</span>
                </div>
              </div>
            )}
          </div>

          {/* Breakdown: Compra */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] text-sm space-y-2">
            <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">Compra</div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Entrada ({downPct}%)</span>
              <span className="text-[var(--color-text)]">{fmt(calc.downPayment)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-secondary)]">ITP</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  <button
                    onClick={() => setItpReduced(false)}
                    className={`px-2 py-0.5 text-xs rounded transition-all ${!itpReduced ? 'bg-[var(--color-text)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]'}`}
                  >4%</button>
                  <button
                    onClick={() => setItpReduced(true)}
                    className={`px-2 py-0.5 text-xs rounded transition-all ${itpReduced ? 'bg-[var(--color-text)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]'}`}
                  >2,5%</button>
                </div>
                <span className="text-[var(--color-text)] w-16 text-right">{fmt(calc.itp)}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Notaría, registro, gestoría</span>
              <span className="text-[var(--color-text)]">~{fmt(calc.otherExpenses)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[var(--color-border)] font-medium text-[var(--color-text)]">
              <span>Total día de la firma</span>
              <span>{fmt(calc.totalNeededForPurchase)}</span>
            </div>
          </div>

          {/* Breakdown: Hipoteca */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] text-sm space-y-2">
            <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">Hipoteca</div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">El banco presta</span>
              <span className="text-[var(--color-text)]">{fmt(calc.bankFinances)}</span>
            </div>
            {/* Inline rate + years controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[var(--color-text-secondary)]">Interés</span>
                <button onClick={() => setRate(Math.max(0, +(rate - 0.1).toFixed(1)))} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] text-xs px-0.5">-</button>
                <button onClick={() => setRate(+(rate + 0.1).toFixed(1))} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] text-xs px-0.5">+</button>
              </div>
              <span className="text-sm font-medium text-[var(--color-text)] tabular-nums">{rate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[var(--color-text-secondary)]">Plazo</span>
                <button onClick={() => setYears(Math.max(1, years - 1))} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] text-xs px-0.5">-</button>
                <button onClick={() => setYears(Math.min(40, years + 1))} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] text-xs px-0.5">+</button>
              </div>
              <span className="text-sm font-medium text-[var(--color-text)] tabular-nums">{years} años</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Cuota hipoteca</span>
              <span className="font-medium text-[var(--color-text)]">{fmt(calc.monthlyMortgage)}/mes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Gastos vivienda (comunidad, IBI...)</span>
              <span className="text-[var(--color-text)]">{fmt(profile.monthlyExpenses)}/mes</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[var(--color-border)] font-medium text-[var(--color-text)]">
              <span>Total mensual</span>
              <span>{fmt(calc.totalMonthly)}/mes</span>
            </div>
          </div>

          {/* Breakdown: Reforma (separate block) */}
          {includeRenovation && renovationBudget > 0 && (
            <div className="p-4 rounded-lg border border-[var(--color-border)] text-sm space-y-2">
              <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">Reforma (aparte del banco)</div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Presupuesto reforma</span>
                <span className="text-[var(--color-text)]">{fmt(renovationBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Cada persona (50%)</span>
                <span className="text-[var(--color-text)]">{fmt(renovationBudget / 2)}</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-tertiary)] pt-1">
                Se paga con vuestros ahorros, no entra en la hipoteca
              </p>
            </div>
          )}

          {/* Per-person breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: profile.name1 || 'Persona 1', savings: profile.savings1, half: calc.halfNeeded, remaining: calc.person1Remaining, canAfford: calc.person1CanAfford },
              { label: profile.name2 || 'Persona 2', savings: profile.savings2, half: calc.halfNeeded, remaining: calc.person2Remaining, canAfford: calc.person2CanAfford },
            ].map((p) => {
              const renoHalf = includeRenovation ? renovationBudget / 2 : 0;
              return (
                <div key={p.label} className="p-3 rounded-lg bg-[var(--color-bg-secondary)] text-sm">
                  <div className="text-xs text-[var(--color-text-tertiary)] mb-2">{p.label}</div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--color-text-secondary)]">Ahorros</span>
                    <span className="text-[var(--color-text)]">{fmt(p.savings)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--color-text-secondary)]">Firma (50%)</span>
                    <span className="text-[var(--color-text)]">-{fmt(p.half)}</span>
                  </div>
                  <div className={`flex justify-between pt-1 border-t border-[var(--color-border)] font-medium ${p.canAfford ? 'text-[var(--color-visited-text)]' : 'text-[var(--color-discarded-text)]'}`}>
                    <span>Le queda</span>
                    <span>{fmt(p.remaining)}</span>
                  </div>
                  {includeRenovation && renovationBudget > 0 && (
                    <>
                      <div className="flex justify-between mt-1.5 pt-1.5 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                        <span>Reforma (50%)</span>
                        <span>-{fmt(renoHalf)}</span>
                      </div>
                      <div className={`flex justify-between text-xs font-medium ${p.remaining - renoHalf >= 0 ? 'text-[var(--color-visited-text)]' : 'text-[var(--color-discarded-text)]'}`}>
                        <span>Tras reforma</span>
                        <span>{fmt(p.remaining - renoHalf)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between mt-2 pt-1.5 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
                    <span>Devuelve al banco</span>
                    <span>{fmt(calc.totalPaid / 2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--color-text-tertiary)]">
                    <span>Cuota mensual</span>
                    <span>{fmt(calc.totalMonthly / 2)}/mes</span>
                  </div>
                  <div className="flex justify-between mt-1.5 pt-1.5 border-t border-dashed border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
                    <span>Si cancela deuda hoy</span>
                    <span>{fmt((p.remaining - renoHalf) - calc.bankFinances / 2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bank totals */}
          <div className="px-1 text-xs text-[var(--color-text-tertiary)] space-y-0.5">
            <p>Deuda total con el banco: {fmt(calc.bankFinances)} — devolveréis {fmt(calc.totalPaid)} ({fmt(calc.totalInterest)} en intereses a {years} años)</p>
          </div>
          </div>

          {/* Actions row */}
          {editingSimId && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-contacted)] text-[var(--color-contacted-text)] text-xs">
              <span>Editando simulación guardada</span>
              <button onClick={() => setEditingSimId(null)} className="ml-auto underline">Cancelar</button>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSaveSimulation}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Guardando...</>
              ) : (
                <><Save size={14} strokeWidth={1.5} /> {editingSimId ? 'Actualizar' : 'Guardar'}</>
              )}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <><Loader2 size={14} className="animate-spin" /> PDF...</>
              ) : (
                <><Download size={14} strokeWidth={1.5} /> PDF</>
              )}
            </button>
          </div>

          {/* Edit profile link */}
          <Link
            to="/settings"
            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <Settings size={13} strokeWidth={1.5} />
            Editar perfil financiero (ahorros, ingresos)
          </Link>
        </div>
      )}

      {/* History */}
      {simulations.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors mb-3"
          >
            <History size={14} strokeWidth={1.5} />
            <span>Simulaciones guardadas ({simulations.length})</span>
            <ChevronDown size={13} className={`ml-auto transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`} />
          </button>

          {showHistory && (
            <div className="space-y-3">
              {simulations.map((sim) => {
                const label = sim.propertyZone || sim.propertyAddress || (sim as unknown as Record<string,string>).propertyLabel || 'Propiedad';
                return (
                  <div
                    key={sim.id}
                    className={`group rounded-lg border overflow-hidden transition-colors ${
                      editingSimId === sim.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-contacted)]/20'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    {/* Main info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[var(--color-text)] truncate">{label}</div>
                          <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                            {sim.createdAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {sim.updatedAt > sim.createdAt && (
                              <span> · editado {sim.updatedAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${
                            sim.verdictText.includes('margen') || sim.verdictText.includes('omoda')
                              ? 'bg-[var(--color-visited)] text-[var(--color-visited-text)]'
                              : sim.verdictText.includes('iable') || sim.verdictText.includes('usto')
                              ? 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)]'
                              : 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)]'
                          }`}
                        >
                          {sim.verdictText}
                        </span>
                      </div>

                      {/* Key numbers */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-2 rounded-md bg-[var(--color-bg-secondary)]">
                          <div className="text-[10px] text-[var(--color-text-tertiary)]">Precio</div>
                          <div className="text-sm font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>{fmt(sim.effectivePrice)}</div>
                        </div>
                        <div className="p-2 rounded-md bg-[var(--color-bg-secondary)]">
                          <div className="text-[10px] text-[var(--color-text-tertiary)]">Firma</div>
                          <div className="text-sm font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>{fmt(sim.totalNeededForPurchase)}</div>
                        </div>
                        <div className="p-2 rounded-md bg-[var(--color-bg-secondary)]">
                          <div className="text-[10px] text-[var(--color-text-tertiary)]">Cuota</div>
                          <div className="text-sm font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>{fmt(sim.totalMonthly)}</div>
                        </div>
                      </div>

                      {/* Conditions */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[11px] text-[var(--color-text-tertiary)]">
                        <span>{sim.downPct}% entrada</span>
                        <span>{sim.rate}% interés</span>
                        <span>{sim.years} años</span>
                        <span>{sim.percentageOfIncome.toFixed(0)}% ingresos</span>
                        {sim.priceExVat && <span>+IVA</span>}
                        {sim.includeRenovation && sim.renovationBudget > 0 && <span>reforma {fmt(sim.renovationBudget)}</span>}
                        {sim.customPrice && sim.customPrice !== sim.basePrice && <span>negociado</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex border-t border-[var(--color-border)]">
                      <button
                        onClick={() => loadSimulation(sim)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors border-r border-[var(--color-border)]"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => loadSimulation(sim, true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors border-r border-[var(--color-border)]"
                      >
                        <Pencil size={11} /> Editar
                      </button>
                      <button
                        onClick={() => deleteSimulation(sim.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-discarded-text)] hover:bg-[var(--color-bg-hover)] transition-colors"
                      >
                        <Trash2 size={11} /> Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
