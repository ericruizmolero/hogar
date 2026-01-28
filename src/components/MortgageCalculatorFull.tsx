import { useState } from 'react';
import { HelpCircle, Check, X, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMortgageCalculator, formatCurrency } from '../hooks/useMortgageCalculator';

interface MortgageCalculatorFullProps {
  propertyPrice: number;
  needsRenovation?: boolean;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 p-3 bg-[var(--color-contacted)] rounded-md text-sm text-[var(--color-contacted-text)]">
      <HelpCircle size={16} className="flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function SectionTitle({ children, step }: { children: React.ReactNode; step: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-sm font-medium">
        {step}
      </div>
      <h3 className="text-base font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>
        {children}
      </h3>
    </div>
  );
}

export function MortgageCalculatorFull({ propertyPrice, needsRenovation = false }: MortgageCalculatorFullProps) {
  // Aportación extra para reducir hipoteca (no cuenta para el 50/50)
  const [extra1, setExtra1] = useState(0);
  const [extra2, setExtra2] = useState(0);

  // Entrada (% del precio que pones tú)
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);

  // Hipoteca
  const [interestRate, setInterestRate] = useState(2.5);
  const [years, setYears] = useState(30);

  // Gastos de compra (País Vasco)
  const [itpReduced, setItpReduced] = useState(false);

  // Reforma
  const [renovationBudget, setRenovationBudget] = useState(needsRenovation ? 30000 : 0);

  // Usar el hook de cálculo
  const { calc, loading: loadingProfile, profile } = useMortgageCalculator({
    propertyPrice,
    downPaymentPercent,
    interestRate,
    years,
    itpReduced,
    renovationBudget,
    extra1,
    extra2,
  });

  const { savings1, savings2, income1, income2, monthlyExpenses } = profile;
  const fmt = formatCurrency;

  if (loadingProfile) {
    return (
      <div className="p-4 text-[var(--color-text-secondary)]">Cargando perfil financiero...</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* RESUMEN RÁPIDO */}
      <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[var(--color-bg)] rounded-lg text-center">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Necesitas tener ahorrado</div>
            <div className="text-2xl font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>
              {fmt(calc.totalNeededForPurchase)}
            </div>
            <div className={`mt-2 text-sm ${calc.canAffordPurchase ? 'text-[var(--color-visited-text)]' : 'text-[var(--color-discarded-text)]'}`}>
              {calc.canAffordPurchase ? (
                <span className="flex items-center justify-center gap-1"><Check size={14} /> Tenéis suficiente</span>
              ) : (
                <span className="flex items-center justify-center gap-1"><X size={14} /> Os faltan {fmt(calc.totalNeededForPurchase - calc.totalSavings)}</span>
              )}
            </div>
          </div>
          <div className="p-4 bg-[var(--color-bg)] rounded-lg text-center">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Pagarás cada mes</div>
            <div className="text-2xl font-medium text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>
              {fmt(calc.totalMonthly)}
            </div>
            <div className={`mt-2 text-sm ${calc.isComfortable ? 'text-[var(--color-visited-text)]' : calc.isViable ? 'text-[var(--color-favorite-text)]' : 'text-[var(--color-discarded-text)]'}`}>
              {calc.percentageOfIncome.toFixed(0)}% de tus ingresos
            </div>
          </div>
        </div>
      </div>

      {/* Banner perfil financiero */}
      <Link
        to="/settings"
        className="flex items-center justify-between p-3 bg-[var(--color-contacted)] rounded-lg text-sm hover:bg-[var(--color-contacted)]/80 transition-colors group"
      >
        <div className="flex items-center gap-2 text-[var(--color-contacted-text)]">
          <Settings size={14} />
          <span>Usando datos de tu perfil financiero</span>
        </div>
        <span className="text-xs text-[var(--color-contacted-text)] opacity-70 group-hover:opacity-100">
          Editar ahorros e ingresos
        </span>
      </Link>

      {/* PASO 1: TUS AHORROS */}
      <section>
        <SectionTitle step={1}>¿Cuánto tenéis ahorrado?</SectionTitle>
        <Tip>
          El banco te presta como máximo el 80% del precio. El resto + los gastos salen de vuestros ahorros.
          Si ponéis más entrada, pedís menos hipoteca y pagáis menos intereses.
        </Tip>
        <div className="mt-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[var(--color-bg)] rounded-lg">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Persona 1</div>
              <div className="text-lg font-medium text-[var(--color-text)]">{fmt(savings1)}</div>
            </div>
            <div className="p-3 bg-[var(--color-bg)] rounded-lg">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Persona 2</div>
              <div className="text-lg font-medium text-[var(--color-text)]">{fmt(savings2)}</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-[var(--color-text-tertiary)]">
            Total ahorros: <span className="text-[var(--color-text)] font-medium">{fmt(calc.totalSavings)}</span>
          </div>
        </div>

        {/* Desglose de gastos */}
        <div className="mt-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg space-y-3 text-sm">
          <div className="font-medium text-[var(--color-text)] mb-3">¿A dónde va ese dinero?</div>

          {/* Entrada ajustable */}
          <div className="p-3 bg-[var(--color-bg)] rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[var(--color-text)]">Entrada (lo que pones tú)</span>
              <span className="font-medium text-[var(--color-text)]">{fmt(calc.downPayment)}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="20"
                max="100"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
                className="flex-1 h-2 bg-[var(--color-bg-active)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
              />
              <span className="text-sm font-medium text-[var(--color-accent)] w-12 text-right">{downPaymentPercent}%</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--color-text-tertiary)] mt-1">
              <span>Mínimo 20%</span>
              <span>100% (sin hipoteca)</span>
            </div>
            {downPaymentPercent > 20 && (
              <div className="mt-2 text-xs text-[var(--color-visited-text)]">
                Poniendo más entrada, el banco te presta menos y pagas menos intereses
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-secondary)]">ITP (impuesto de compra)</span>
              <select
                value={itpReduced ? 'reduced' : 'normal'}
                onChange={(e) => setItpReduced(e.target.value === 'reduced')}
                className="text-xs px-2 py-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded"
              >
                <option value="normal">4%</option>
                <option value="reduced">2.5% (vivienda habitual)</option>
              </select>
            </div>
            <span className="font-medium">{fmt(calc.itp)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Notaría, registro, gestoría, tasación</span>
            <span className="font-medium">~{fmt(calc.otherExpenses)}</span>
          </div>
          {renovationBudget > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Reforma</span>
              <input
                type="number"
                value={renovationBudget}
                onChange={(e) => setRenovationBudget(parseInt(e.target.value) || 0)}
                className="w-24 px-2 py-1 text-right text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded"
              />
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-[var(--color-border)] font-medium text-[var(--color-text)]">
            <span>Total que necesitáis el día de la firma</span>
            <span>{fmt(calc.totalNeededForPurchase)}</span>
          </div>

          {/* Quién pone cuánto - 50/50 */}
          <div className="mt-3 p-3 bg-[var(--color-bg)] rounded-lg">
            <div className="text-xs text-[var(--color-text-tertiary)] mb-2">Entrada + gastos (50/50)</div>
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-[var(--color-text-secondary)]">Persona 1: </span>
                <span className={`font-medium ${calc.person1CanAfford ? '' : 'text-[var(--color-discarded-text)]'}`}>
                  {fmt(calc.halfNeeded)}
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">Persona 2: </span>
                <span className={`font-medium ${calc.person2CanAfford ? '' : 'text-[var(--color-discarded-text)]'}`}>
                  {fmt(calc.halfNeeded)}
                </span>
              </div>
            </div>
          </div>

          {calc.canAffordPurchase && calc.remaining > 0 && (
            <div className="flex justify-between text-[var(--color-visited-text)]">
              <span>Os sobra (colchón de emergencia)</span>
              <span>{fmt(calc.remaining)}</span>
            </div>
          )}
        </div>

        {needsRenovation && renovationBudget === 0 && (
          <button
            onClick={() => setRenovationBudget(30000)}
            className="mt-3 text-sm text-[var(--color-accent)] hover:underline"
          >
            + Añadir presupuesto de reforma
          </button>
        )}
      </section>

      {/* PASO 2: INGRESOS */}
      <section>
        <SectionTitle step={2}>¿Cuánto ganáis al mes (neto)?</SectionTitle>
        <Tip>
          Los bancos dicen que la cuota no debería superar el 30-35% de lo que ganáis. Si supera el 35%, probablemente no te lo concedan.
        </Tip>
        <div className="mt-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[var(--color-bg)] rounded-lg">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Persona 1</div>
              <div className="text-lg font-medium text-[var(--color-text)]">{fmt(income1)}/mes</div>
            </div>
            <div className="p-3 bg-[var(--color-bg)] rounded-lg">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Persona 2</div>
              <div className="text-lg font-medium text-[var(--color-text)]">{fmt(income2)}/mes</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-[var(--color-text-tertiary)]">
            Total: <span className="text-[var(--color-text)] font-medium">{fmt(calc.totalIncome)}/mes</span>
          </div>
        </div>
      </section>

      {/* PASO 3: CONDICIONES HIPOTECA */}
      <section>
        <SectionTitle step={3}>Condiciones de la hipoteca</SectionTitle>
        <Tip>
          El tipo de interés actual ronda el 2-3% fijo. A más años, menos cuota mensual pero más intereses totales.
        </Tip>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">Tipo de interés (%)</label>
            <input
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 text-lg bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--color-text-secondary)] mb-2 block">Años de hipoteca</label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 text-lg bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Aportación extra para reducir hipoteca */}
        <div className="mt-4 p-4 bg-[var(--color-visited)] rounded-lg">
          <div className="text-sm font-medium text-[var(--color-visited-text)] mb-3">
            ¿Alguien quiere poner extra para pedir menos hipoteca?
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--color-visited-text)] opacity-80 mb-1 block">Persona 1 extra</label>
              <input
                type="number"
                value={extra1}
                onChange={(e) => setExtra1(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-visited-text)] opacity-80 mb-1 block">Persona 2 extra</label>
              <input
                type="number"
                value={extra2}
                onChange={(e) => setExtra2(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="0"
              />
            </div>
          </div>
          {calc.totalExtra > 0 && (
            <div className="mt-3 text-sm text-[var(--color-visited-text)]">
              Con {fmt(calc.totalExtra)} extra, pedís {fmt(calc.bankFinances)} en vez de {fmt(calc.bankFinancesBase)}
            </div>
          )}
          <div className="mt-2 text-xs text-[var(--color-visited-text)] opacity-70">
            Este dinero no cuenta para el 50/50 de la entrada. Es una aportación voluntaria de quien quiera reducir la cuota.
          </div>
        </div>

        <div className="mt-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--color-text-secondary)]">El banco os presta</span>
            <div>
              {calc.totalExtra > 0 && (
                <span className="text-[var(--color-text-tertiary)] line-through mr-2">{fmt(calc.bankFinancesBase)}</span>
              )}
              <span className="font-medium">{fmt(calc.bankFinances)}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Cuota mensual de la hipoteca</span>
            <span className="font-medium text-[var(--color-text)]">{fmt(calc.monthlyMortgage)}</span>
          </div>
        </div>
      </section>

      {/* PASO 4: GASTOS MENSUALES */}
      <section>
        <SectionTitle step={4}>Otros gastos mensuales de la vivienda</SectionTitle>
        <Tip>
          Además de la hipoteca, tendrás gastos fijos: comunidad (~80€), IBI (~60€), seguro hogar (~25€), seguro vida (~30€).
        </Tip>
        <div className="mt-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
          <div className="text-sm text-[var(--color-text-secondary)]">Comunidad + IBI + seguros (estimado)</div>
          <div className="text-lg font-medium text-[var(--color-text)] mt-1">{fmt(monthlyExpenses)}/mes</div>
        </div>
      </section>

      {/* RESULTADO FINAL */}
      <section className={`p-5 rounded-lg ${calc.isComfortable ? 'bg-[var(--color-visited)]' : calc.isViable ? 'bg-[var(--color-favorite)]' : 'bg-[var(--color-discarded)]'}`}>
        <h3 className="text-lg font-medium mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
          Resumen
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Hipoteca</span>
            <span className="font-medium">{fmt(calc.monthlyMortgage)}/mes</span>
          </div>
          <div className="flex justify-between">
            <span>Otros gastos vivienda</span>
            <span className="font-medium">{fmt(monthlyExpenses)}/mes</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-current/20 text-lg font-medium">
            <span>Total vivienda</span>
            <span>{fmt(calc.totalMonthly)}/mes</span>
          </div>
          <div className="flex justify-between text-sm opacity-80">
            <span>Os queda para vivir</span>
            <span>{fmt(calc.leftToLive)}/mes</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-current/20">
          {calc.isComfortable ? (
            <div className="flex items-start gap-2">
              <Check size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Situación cómoda</div>
                <div className="text-sm opacity-80">
                  Destináis el {calc.percentageOfIncome.toFixed(0)}% de vuestros ingresos a la vivienda.
                  Os queda margen para imprevistos.
                </div>
              </div>
            </div>
          ) : calc.isViable ? (
            <div className="flex items-start gap-2">
              <HelpCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Viable, pero justo</div>
                <div className="text-sm opacity-80">
                  Destináis el {calc.percentageOfIncome.toFixed(0)}% a vivienda. Está en el límite de lo que
                  recomiendan los bancos (30-35%). Poco margen para imprevistos.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <X size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Cuota demasiado alta</div>
                <div className="text-sm opacity-80">
                  El {calc.percentageOfIncome.toFixed(0)}% de vuestros ingresos iría a vivienda.
                  Los bancos suelen rechazar hipotecas por encima del 35%.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* QUÉ LE QUEDA A CADA UNO */}
      {calc.canAffordPurchase && (
        <section className="p-4 bg-[var(--color-bg-secondary)] rounded-lg">
          <div className="font-medium text-[var(--color-text)] mb-3">Resumen de aportaciones</div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="p-3 bg-[var(--color-bg)] rounded-lg">
              <div className="text-[var(--color-text-tertiary)] text-xs mb-2">Persona 1</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">50% entrada:</span>
                  <span>{fmt(calc.halfNeeded)}</span>
                </div>
                {extra1 > 0 && (
                  <div className="flex justify-between text-[var(--color-visited-text)]">
                    <span>Extra hipoteca:</span>
                    <span>{fmt(extra1)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-[var(--color-border)] font-medium">
                  <span>Total pone:</span>
                  <span>{fmt(calc.person1Total)}</span>
                </div>
                <div className="flex justify-between text-[var(--color-text-tertiary)]">
                  <span>Le queda:</span>
                  <span>{fmt(calc.person1Remaining)}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-[var(--color-bg)] rounded-lg">
              <div className="text-[var(--color-text-tertiary)] text-xs mb-2">Persona 2</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">50% entrada:</span>
                  <span>{fmt(calc.halfNeeded)}</span>
                </div>
                {extra2 > 0 && (
                  <div className="flex justify-between text-[var(--color-visited-text)]">
                    <span>Extra hipoteca:</span>
                    <span>{fmt(extra2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-[var(--color-border)] font-medium">
                  <span>Total pone:</span>
                  <span>{fmt(calc.person2Total)}</span>
                </div>
                <div className="flex justify-between text-[var(--color-text-tertiary)]">
                  <span>Le queda:</span>
                  <span>{fmt(calc.person2Remaining)}</span>
                </div>
              </div>
            </div>
          </div>

          {(calc.person1Remaining > 5000 || calc.person2Remaining > 5000) && (
            <div className="p-3 bg-[var(--color-contacted)] rounded-lg text-sm text-[var(--color-contacted-text)]">
              <div className="font-medium mb-2">¿Adelantar dinero a la hipoteca?</div>
              <p className="mb-2">
                Si uno tiene ahorros extra, puede usarlos para reducir la hipoteca. Esto se llama <strong>amortización anticipada</strong>.
              </p>
              <div className="space-y-1 text-xs">
                <div>• <strong>Reducir cuota</strong>: Pagas menos cada mes (mismo plazo)</div>
                <div>• <strong>Reducir plazo</strong>: Acabas antes y pagas menos intereses total</div>
              </div>
              <p className="mt-2 text-xs opacity-80">
                Ojo: El banco puede cobrarte una pequeña comisión (0.25-0.5%).
                Y es mejor tener siempre un colchón de 3-6 meses de gastos antes de adelantar.
              </p>
            </div>
          )}
        </section>
      )}

      {/* CURIOSIDAD: INTERESES */}
      <section className="text-sm text-[var(--color-text-tertiary)] p-4 bg-[var(--color-bg-secondary)] rounded-lg">
        <div className="font-medium text-[var(--color-text)] mb-2">Dato curioso sobre los intereses</div>
        <p>
          El banco te presta {fmt(calc.bankFinances)}, pero acabarás pagando {fmt(calc.totalPaid)}
          en {years} años. Es decir, <span className="text-[var(--color-text)] font-medium">{fmt(calc.totalInterest)} solo en intereses</span>.
        </p>
      </section>
    </div>
  );
}
