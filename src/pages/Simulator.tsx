import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, ChevronDown } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import { useMortgageCalculator, formatCurrency } from '../hooks/useMortgageCalculator';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import { formatPrice, getImageUrl } from '../lib/utils';
import type { RenovationType } from '../types';

const RENOVATION_BUDGET: Record<RenovationType, number> = {
  no: 0,
  partial: 15000,
  total: 30000,
};

export function Simulator() {
  const { properties, loading: loadingProps } = useProperties();
  const { profile, loading: loadingProfile } = useFinancialProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(2.5);
  const [years, setYears] = useState(30);
  const [itpReduced, setItpReduced] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const selected = useMemo(
    () => (selectedId ? properties.find((p) => p.id === selectedId) : null) || null,
    [properties, selectedId],
  );

  const renovation = selected?.needsRenovation || 'no';

  const { calc, verdict } = useMortgageCalculator({
    propertyPrice: selected?.price || 0,
    downPaymentPercent: downPct,
    interestRate: rate,
    years,
    itpReduced,
    renovationBudget: RENOVATION_BUDGET[renovation],
  });

  const fmt = formatCurrency;
  const loading = loadingProps || loadingProfile;

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
        <div className="mb-6 flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)]">
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
              {formatPrice(selected.price)}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] truncate">
              {selected.zone || selected.address}
            </div>
          </div>
          <Link to={`/property/${selected.id}`} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] flex-shrink-0">
            Ver ficha
          </Link>
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
          {/* Results - always visible */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)]">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Necesitas ahorrado</div>
              <div className="text-xl font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>
                {fmt(calc.totalNeededForPurchase)}
              </div>
              <div className={`mt-1.5 text-xs ${calc.canAffordPurchase ? 'text-[var(--color-visited-text)]' : 'text-[var(--color-discarded-text)]'}`}>
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

          {/* Breakdown */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Entrada ({downPct}%)</span>
              <span className="text-[var(--color-text)]">{fmt(calc.downPayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">ITP ({itpReduced ? '2,5%' : '4%'})</span>
              <span className="text-[var(--color-text)]">{fmt(calc.itp)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Notaría, registro, gestoría</span>
              <span className="text-[var(--color-text)]">~{fmt(calc.otherExpenses)}</span>
            </div>
            {RENOVATION_BUDGET[renovation] > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Reforma ({renovation})</span>
                <span className="text-[var(--color-text)]">{fmt(RENOVATION_BUDGET[renovation])}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-[var(--color-border)] font-medium text-[var(--color-text)]">
              <span>Total día de la firma</span>
              <span>{fmt(calc.totalNeededForPurchase)}</span>
            </div>
            <div className="h-px" />
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">El banco presta</span>
              <span className="text-[var(--color-text)]">{fmt(calc.bankFinances)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Hipoteca ({rate}% a {years} años)</span>
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

          {/* Per-person breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] text-sm">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-2">Persona 1</div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--color-text-secondary)]">Ahorros</span>
                <span className="text-[var(--color-text)]">{fmt(profile.savings1)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--color-text-secondary)]">Aporta (50%)</span>
                <span className="text-[var(--color-text)]">{fmt(calc.halfNeeded)}</span>
              </div>
              <div className={`flex justify-between pt-1 border-t border-[var(--color-border)] font-medium ${calc.person1CanAfford ? 'text-[var(--color-visited-text)]' : 'text-[var(--color-discarded-text)]'}`}>
                <span>Le queda</span>
                <span>{fmt(calc.person1Remaining)}</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] text-sm">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-2">Persona 2</div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--color-text-secondary)]">Ahorros</span>
                <span className="text-[var(--color-text)]">{fmt(profile.savings2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--color-text-secondary)]">Aporta (50%)</span>
                <span className="text-[var(--color-text)]">{fmt(calc.halfNeeded)}</span>
              </div>
              <div className={`flex justify-between pt-1 border-t border-[var(--color-border)] font-medium ${calc.person2CanAfford ? 'text-[var(--color-visited-text)]' : 'text-[var(--color-discarded-text)]'}`}>
                <span>Le queda</span>
                <span>{fmt(calc.person2Remaining)}</span>
              </div>
            </div>
          </div>

          {/* Interest fact */}
          <p className="text-xs text-[var(--color-text-tertiary)] px-1">
            En {years} años pagaréis {fmt(calc.totalInterest)} en intereses (total devuelto: {fmt(calc.totalPaid)})
          </p>

          {/* Advanced config toggle */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Settings size={14} strokeWidth={1.5} />
              Ajustar condiciones
            </span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${showConfig ? 'rotate-180' : ''}`} />
          </button>

          {showConfig && (
            <div className="p-4 rounded-lg border border-[var(--color-border)] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--color-text-tertiary)] mb-1.5 block">Interés (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-strong)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-tertiary)] mb-1.5 block">Años</label>
                  <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md focus:outline-none focus:border-[var(--color-border-strong)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)] mb-1.5 block">ITP (País Vasco)</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setItpReduced(false)}
                    className={`h-8 px-3 text-sm rounded-md transition-all inline-flex items-center ${
                      !itpReduced ? 'bg-[var(--color-text)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    4% general
                  </button>
                  <button
                    onClick={() => setItpReduced(true)}
                    className={`h-8 px-3 text-sm rounded-md transition-all inline-flex items-center ${
                      itpReduced ? 'bg-[var(--color-text)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    2,5% vivienda habitual
                  </button>
                </div>
              </div>
              <Link
                to="/settings"
                className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors"
              >
                <Settings size={12} />
                Editar perfil financiero (ahorros, ingresos)
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
