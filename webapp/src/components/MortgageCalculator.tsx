import { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMortgageCalculator, formatCurrency } from '../hooks/useMortgageCalculator';
import type { RenovationType } from '../types';

const RENOVATION_BUDGET: Record<RenovationType, number> = {
  no: 0,
  partial: 15000,
  total: 30000,
};

interface MortgageCalculatorProps {
  propertyPrice: number;
  renovationType?: RenovationType;
}

export function MortgageCalculator({ propertyPrice, renovationType = 'no' }: MortgageCalculatorProps) {
  const [expanded, setExpanded] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);

  const { calc, verdict, loading: loadingProfile } = useMortgageCalculator({
    propertyPrice,
    downPaymentPercent,
    renovationBudget: RENOVATION_BUDGET[renovationType],
  });

  const fmt = formatCurrency;

  return (
    <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-[var(--color-bg)] hover:bg-[var(--color-bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calculator size={18} strokeWidth={1.5} className="text-[var(--color-accent)]" />
          <span className="font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>
            ¿Puedo comprar este piso?
          </span>
        </div>
        <div className="flex items-center gap-3">
          {loadingProfile ? (
            <span className="text-sm text-[var(--color-text-tertiary)]">Cargando...</span>
          ) : (
            <span className={`notion-tag ${verdict.style}`}>{verdict.text}</span>
          )}
          {expanded ? <ChevronUp size={18} className="text-[var(--color-text-tertiary)]" /> : <ChevronDown size={18} className="text-[var(--color-text-tertiary)]" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-border)] p-4 space-y-4">
          {/* Slider de entrada */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--color-text-secondary)]">Entrada</span>
              <span className="font-medium text-[var(--color-text)]">{downPaymentPercent}% ({fmt(calc.downPayment)})</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
              className="w-full h-2 bg-[var(--color-bg-active)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--color-text-tertiary)] mt-1">
              <span>20% mínimo</span>
              <span>100% sin hipoteca</span>
            </div>
          </div>

          {/* Resumen */}
          <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Total necesario (entrada + gastos)</span>
              <span className="font-medium text-[var(--color-text)]">{fmt(calc.totalNeededForPurchase)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">El banco financia</span>
              <span className="font-medium text-[var(--color-text)]">{fmt(calc.bankFinances)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
              <span className="text-[var(--color-text-secondary)]">Cuota mensual</span>
              <span className="font-medium text-lg text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>
                {fmt(calc.monthlyMortgage)}/mes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">% de tus ingresos</span>
              <span className={`font-medium ${
                calc.isComfortable ? 'text-[var(--color-visited-text)]' :
                calc.isViable ? 'text-[var(--color-favorite-text)]' :
                'text-[var(--color-discarded-text)]'
              }`}>
                {calc.percentageOfIncome.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Veredicto */}
          <div className={`p-3 rounded-lg text-sm ${verdict.style}`}>
            {calc.isComfortable ? (
              <span>Situación cómoda. Destinas menos del 30% de tus ingresos.</span>
            ) : calc.isViable ? (
              <span>Viable, pero justo. Estás entre el 30-35% de tus ingresos.</span>
            ) : (
              <span>Cuota alta. Superas el 35% recomendado por los bancos.</span>
            )}
          </div>

          {/* Link al simulador completo */}
          <Link
            to="/simulador"
            className="block text-center text-sm text-[var(--color-accent)] hover:underline py-2"
          >
            Abrir simulador completo (con desglose detallado)
          </Link>
        </div>
      )}
    </div>
  );
}
