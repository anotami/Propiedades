import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertLevel, Country, Currency, ExchangeRate, PropertyRole, Vencimiento } from '../types';

export function formatCurrency(amount: number, currency: Currency): string {
  const rounded = Math.round(amount);
  if (currency === 'ARS') {
    return '$' + rounded.toLocaleString('es-AR');
  }
  if (currency === 'USD') {
    return 'USD ' + rounded.toLocaleString('es-AR');
  }
  if (currency === 'PEN') {
    return 'S/ ' + rounded.toLocaleString('es-PE');
  }
  return String(amount);
}

export function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "d MMM yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatMonth(dateStr: string): string {
  try {
    const date = parseISO(dateStr + '-01');
    return format(date, "MMMM yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}

export function getDaysDiff(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseISO(dateStr);
  return differenceInDays(target, today);
}

export function getAlertLevel(vencimiento: Vencimiento): AlertLevel {
  if (vencimiento.paid) return 'paid';
  const days = getDaysDiff(vencimiento.dueDate);
  if (days < 0) return 'overdue';
  if (days <= 7) return 'upcoming';
  return 'paid';
}

export function convertToUSD(amount: number, currency: Currency, rate: ExchangeRate): number {
  if (currency === 'USD') return amount;
  if (currency === 'ARS') return amount / rate.USD_ARS;
  if (currency === 'PEN') return amount / rate.USD_PEN;
  return amount;
}

export function convertToARS(amount: number, currency: Currency, rate: ExchangeRate): number {
  if (currency === 'ARS') return amount;
  if (currency === 'USD') return amount * rate.USD_ARS;
  if (currency === 'PEN') return (amount / rate.USD_PEN) * rate.USD_ARS;
  return amount;
}

export function getCountryFlag(country: Country): string {
  if (country === 'AR') return '🇦🇷';
  if (country === 'PE') return '🇵🇪';
  return '';
}

export function getRoleLabel(role: PropertyRole): string {
  if (role === 'owned_rented_out') return 'Propia - Alquilada';
  if (role === 'owned_vacant') return 'Propia - Vacante';
  if (role === 'renting') return 'Arrendada';
  return role;
}

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    Expensas: 'bg-purple-100 text-purple-800',
    Electricidad: 'bg-yellow-100 text-yellow-800',
    Agua: 'bg-blue-100 text-blue-800',
    Gas: 'bg-orange-100 text-orange-800',
    Impuestos: 'bg-red-100 text-red-800',
    Internet: 'bg-cyan-100 text-cyan-800',
    Alquiler: 'bg-green-100 text-green-800',
    Mantenimiento: 'bg-gray-100 text-gray-800',
    Seguros: 'bg-indigo-100 text-indigo-800',
    Otros: 'bg-slate-100 text-slate-800',
  };
  return map[category] ?? 'bg-slate-100 text-slate-800';
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
