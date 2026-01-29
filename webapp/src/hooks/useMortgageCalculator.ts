import { useMemo } from 'react';
import { useFinancialProfile } from './useFinancialProfile';

export interface MortgageInputs {
  propertyPrice: number;
  downPaymentPercent?: number;  // Default 20
  interestRate?: number;        // Default 2.5
  years?: number;               // Default 30
  itpReduced?: boolean;         // Default false
  renovationBudget?: number;    // Default 0
  extra1?: number;              // Default 0
  extra2?: number;              // Default 0
}

export interface MortgageCalculation {
  // Ahorros
  totalSavings: number;
  totalExtra: number;

  // Entrada y financiación
  downPayment: number;
  bankFinancesBase: number;
  bankFinances: number;

  // Gastos de compra
  itp: number;
  otherExpenses: number;
  purchaseExpenses: number;
  totalNeededForPurchase: number;

  // Reparto 50/50
  halfNeeded: number;
  person1Base: number;
  person2Base: number;
  person1Total: number;
  person2Total: number;
  person1CanAfford: boolean;
  person2CanAfford: boolean;
  canAffordPurchase: boolean;
  person1Remaining: number;
  person2Remaining: number;
  remaining: number;

  // Cuota mensual
  monthlyMortgage: number;
  totalMonthly: number;

  // Análisis de ingresos
  totalIncome: number;
  percentageOfIncome: number;
  isComfortable: boolean;  // <=30%
  isViable: boolean;       // <=35%
  leftToLive: number;

  // Total a pagar
  totalPaid: number;
  totalInterest: number;
}

export interface MortgageVerdict {
  color: 'green' | 'yellow' | 'red';
  text: string;
  style: string;
}

export interface MortgageResult {
  calc: MortgageCalculation;
  verdict: MortgageVerdict;
  loading: boolean;
  profile: {
    savings1: number;
    savings2: number;
    income1: number;
    income2: number;
    monthlyExpenses: number;
  };
}

export function useMortgageCalculator(inputs: MortgageInputs): MortgageResult {
  const { profile, loading } = useFinancialProfile();
  const { savings1, savings2, income1, income2, monthlyExpenses } = profile;

  const {
    propertyPrice,
    downPaymentPercent = 20,
    interestRate = 2.5,
    years = 30,
    itpReduced = false,
    renovationBudget = 0,
    extra1 = 0,
    extra2 = 0,
  } = inputs;

  const calc = useMemo((): MortgageCalculation => {
    // Ahorros totales
    const totalSavings = savings1 + savings2;

    // Aportaciones extra para reducir hipoteca
    const totalExtra = extra1 + extra2;

    // Lo que pones de entrada (mínimo 20%)
    const downPayment = propertyPrice * (downPaymentPercent / 100);

    // Lo que financia el banco (menos las aportaciones extra)
    const bankFinancesBase = propertyPrice - downPayment;
    const bankFinances = Math.max(0, bankFinancesBase - totalExtra);

    // Gastos de compra
    const itpRate = itpReduced ? 0.025 : 0.04;
    const itp = propertyPrice * itpRate;
    const otherExpenses = 2000; // notaría, registro, gestoría, tasación
    const purchaseExpenses = itp + otherExpenses;

    // Total que necesitas en el banco el día de la compra (50/50)
    const totalNeededForPurchase = downPayment + purchaseExpenses + renovationBudget;

    // Cada uno pone la mitad de la entrada + gastos (50/50)
    const halfNeeded = totalNeededForPurchase / 2;
    const person1Base = halfNeeded;
    const person2Base = halfNeeded;

    // Total que pone cada uno (base 50/50 + su extra)
    const person1Total = person1Base + extra1;
    const person2Total = person2Base + extra2;

    // ¿Tiene cada uno suficiente?
    const person1CanAfford = savings1 >= person1Total;
    const person2CanAfford = savings2 >= person2Total;
    const canAffordPurchase = person1CanAfford && person2CanAfford;

    // Cuánto le queda a cada uno después
    const person1Remaining = savings1 - person1Total;
    const person2Remaining = savings2 - person2Total;
    const remaining = person1Remaining + person2Remaining;

    // Cuota mensual de la hipoteca
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = years * 12;
    let monthlyMortgage: number;
    if (monthlyRate === 0) {
      monthlyMortgage = bankFinances / totalPayments;
    } else {
      monthlyMortgage = bankFinances * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
                        (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }

    // Total que pagarás cada mes
    const totalMonthly = monthlyMortgage + monthlyExpenses;

    // Ingresos totales
    const totalIncome = income1 + income2;

    // Porcentaje de tus ingresos que se va en vivienda
    const percentageOfIncome = totalIncome > 0 ? (totalMonthly / totalIncome) * 100 : 0;

    // ¿Es viable según los bancos?
    const isComfortable = percentageOfIncome <= 30;
    const isViable = percentageOfIncome <= 35;

    // Lo que te queda para vivir
    const leftToLive = totalIncome - totalMonthly;

    // Total que acabarás pagando
    const totalPaid = monthlyMortgage * totalPayments;
    const totalInterest = totalPaid - bankFinances;

    return {
      totalSavings,
      totalExtra,
      bankFinancesBase,
      bankFinances,
      downPayment,
      itp,
      otherExpenses,
      purchaseExpenses,
      totalNeededForPurchase,
      halfNeeded,
      person1Base,
      person2Base,
      person1Total,
      person2Total,
      person1CanAfford,
      person2CanAfford,
      canAffordPurchase,
      remaining,
      person1Remaining,
      person2Remaining,
      monthlyMortgage,
      totalMonthly,
      totalIncome,
      percentageOfIncome,
      isComfortable,
      isViable,
      leftToLive,
      totalPaid,
      totalInterest,
    };
  }, [
    propertyPrice,
    savings1,
    savings2,
    extra1,
    extra2,
    downPaymentPercent,
    income1,
    income2,
    interestRate,
    years,
    itpReduced,
    renovationBudget,
    monthlyExpenses,
  ]);

  const verdict = useMemo((): MortgageVerdict => {
    if (!calc.canAffordPurchase) {
      return {
        color: 'red',
        text: 'No alcanza',
        style: 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)]',
      };
    }
    if (!calc.isViable) {
      return {
        color: 'red',
        text: 'Cuota muy alta',
        style: 'bg-[var(--color-discarded)] text-[var(--color-discarded-text)]',
      };
    }
    if (!calc.isComfortable) {
      return {
        color: 'yellow',
        text: 'Justo pero viable',
        style: 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)]',
      };
    }
    if (calc.remaining < calc.totalMonthly * 6) {
      return {
        color: 'yellow',
        text: 'Sin colchon',
        style: 'bg-[var(--color-favorite)] text-[var(--color-favorite-text)]',
      };
    }
    return {
      color: 'green',
      text: 'Buen margen',
      style: 'bg-[var(--color-visited)] text-[var(--color-visited-text)]',
    };
  }, [calc]);

  return {
    calc,
    verdict,
    loading,
    profile: {
      savings1,
      savings2,
      income1,
      income2,
      monthlyExpenses,
    },
  };
}

// Función de utilidad para formatear moneda
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n) + '€';
}
