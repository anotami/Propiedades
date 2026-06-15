export type Currency = 'ARS' | 'USD' | 'PEN';
export type Country = 'AR' | 'PE';
export type PropertyRole = 'owned_rented_out' | 'owned_vacant' | 'renting';
export type TransactionType = 'income' | 'expense';
export type AlertLevel = 'overdue' | 'upcoming' | 'paid';

export interface ServiceAccount {
  service: string;
  accountNumber: string;
  notes?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  country: Country;
  role: PropertyRole;
  tenantName?: string;
  rentAmount?: number;
  rentCurrency?: Currency;
  rentDueDay?: number;
  accounts: ServiceAccount[];
}

export interface Transaction {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  propertyId?: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  currency: Currency;
  paid: boolean;
  dueDate?: string;
  notes?: string;
}

export interface Vencimiento {
  id: string;
  propertyId?: string; // undefined = personal
  name: string;
  category: string;
  amount?: number;
  currency?: Currency;
  dueDate: string; // ISO date YYYY-MM-DD
  paid: boolean;
  paidDate?: string;
  recurring: boolean;
  recurringDayOfMonth?: number; // 1-31
  notes?: string;
}

export interface ExchangeRate {
  id: string;
  date: string;
  USD_ARS: number; // 1 USD = X ARS
  USD_PEN: number; // 1 USD = X PEN
}

export interface BudgetCategory {
  id: string;
  name: string;
  monthlyBudget: number;
  currency: Currency;
  icon?: string;
}

export interface MonthlyActual {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  amount: number;
  currency: Currency;
}

export interface AppData {
  properties: Property[];
  transactions: Transaction[];
  vencimientos: Vencimiento[];
  exchangeRates: ExchangeRate[];
  budgetCategories: BudgetCategory[];
  monthlyActuals: MonthlyActual[];
  version: string;
  lastUpdated: string;
}

export type Page =
  | 'dashboard'
  | 'properties'
  | 'property-detail'
  | 'vencimientos'
  | 'transactions'
  | 'budget'
  | 'settings';
