import { useState } from 'react';
import { ChevronDown, ChevronUp, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMortgageCalculator, formatCurrency } from '../hooks/useMortgageCalculator';

interface MortgageWidgetProps {
  propertyPrice: number;
  needsRenovation?: boolean;
  className?: string;
  defaultExpanded?: boolean;
}

export function MortgageWidget({
  propertyPrice,
  needsRenovation = false,
  className = '',
  defaultExpanded = false,
}: MortgageWidgetProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);

  // Solo calcular si el usuario está logueado
  const { calc, verdict, loading } = useMortgageCalculator({
    propertyPrice,
    downPaymentPercent,
    renovationBudget: needsRenovation ? 30000 : 0,
  });

  const fmt = formatCurrency;

  // Color del indicador
  const indicatorColor = {
    green: 'bg-[var(--color-visited-text)]',
    yellow: 'bg-[var(--color-favorite-text)]',
    red: 'bg-[var(--color-discarded-text)]',
  }[verdict.color];

  // Si no está logueado, mostrar versión simplificada
  if (!user) {
    // Cálculo simple sin perfil de usuario (valores por defecto)
    const estimatedMonthly = Math.round(
      (propertyPrice * 0.8) * // 80% financiado
      (0.025 / 12 * Math.pow(1 + 0.025 / 12, 360)) /
      (Math.pow(1 + 0.025 / 12, 360) - 1)
    );

    return (
      <div className={`rounded-lg border border-[var(--color-border)] overflow-hidden ${className}`}>
        <div className="px-3 py-2 bg-[var(--color-bg-secondary)]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[var(--color-text)]">
              ~{fmt(estimatedMonthly)}/mes
            </div>
            <Link
              to="/login"
              className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
            >
              <LogIn size={12} />
              Ver viabilidad
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`rounded-lg border border-[var(--color-border)] overflow-hidden ${className}`}>
        <div className="px-3 py-2 bg-[var(--color-bg-secondary)]">
          <div className="text-sm text-[var(--color-text-tertiary)]">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-[var(--color-border)] overflow-hidden ${className}`}>
      {/* Header colapsado */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${indicatorColor}`} />
          <span className="text-sm font-medium text-[var(--color-text)]">
            {fmt(calc.monthlyMortgage)}/mes
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-[var(--color-text-tertiary)]" />
        ) : (
          <ChevronDown size={14} className="text-[var(--color-text-tertiary)]" />
        )}
      </button>

      {/* Contenido expandido */}
      {expanded && (
        <div className="px-3 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg)] space-y-3">
          {/* Slider de entrada */}
          <div>
            <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
              <span>Entrada</span>
              <span className="font-medium text-[var(--color-text)]">{downPaymentPercent}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[var(--color-bg-active)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--color-text-tertiary)] mt-1">
              <span>20%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Resumen */}
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Entrada ({downPaymentPercent}%)</span>
              <span className="text-[var(--color-text)]">{fmt(calc.downPayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Cuota hipoteca</span>
              <span className="font-medium text-[var(--color-text)]">{fmt(calc.monthlyMortgage)}/mes</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[var(--color-border)]">
              <span className="text-[var(--color-text-secondary)]">% de ingresos</span>
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
          <div className={`p-2 rounded-md text-xs ${verdict.style}`}>
            {verdict.text}
          </div>

          {/* Link al simulador completo */}
          <Link
            to="/simulador"
            className="block text-center text-xs text-[var(--color-accent)] hover:underline"
          >
            Ver simulador completo
          </Link>
        </div>
      )}
    </div>
  );
}
