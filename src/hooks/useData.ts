import { useState, useCallback } from 'react';
import { AppData, Property, Transaction, Vencimiento, ExchangeRate, BudgetCategory, MonthlyActual } from '../types';
import { loadData, saveData, exportData as exportJSON, importData as importJSON, resetData } from '../lib/storage';

export function useData() {
  const [data, setData] = useState<AppData>(() => loadData());

  const persist = useCallback((newData: AppData) => {
    saveData(newData);
    setData(newData);
  }, []);

  // Properties
  const updateProperties = useCallback((properties: Property[]) => {
    setData(prev => {
      const next = { ...prev, properties };
      saveData(next);
      return next;
    });
  }, []);

  const addProperty = useCallback((property: Property) => {
    setData(prev => {
      const next = { ...prev, properties: [...prev.properties, property] };
      saveData(next);
      return next;
    });
  }, []);

  const updateProperty = useCallback((property: Property) => {
    setData(prev => {
      const next = { ...prev, properties: prev.properties.map(p => p.id === property.id ? property : p) };
      saveData(next);
      return next;
    });
  }, []);

  // Transactions
  const addTransaction = useCallback((transaction: Transaction) => {
    setData(prev => {
      const next = { ...prev, transactions: [...prev.transactions, transaction] };
      saveData(next);
      return next;
    });
  }, []);

  const updateTransaction = useCallback((transaction: Transaction) => {
    setData(prev => {
      const next = { ...prev, transactions: prev.transactions.map(t => t.id === transaction.id ? transaction : t) };
      saveData(next);
      return next;
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData(prev => {
      const next = { ...prev, transactions: prev.transactions.filter(t => t.id !== id) };
      saveData(next);
      return next;
    });
  }, []);

  // Vencimientos
  const addVencimiento = useCallback((vencimiento: Vencimiento) => {
    setData(prev => {
      const next = { ...prev, vencimientos: [...prev.vencimientos, vencimiento] };
      saveData(next);
      return next;
    });
  }, []);

  const updateVencimiento = useCallback((vencimiento: Vencimiento) => {
    setData(prev => {
      const next = { ...prev, vencimientos: prev.vencimientos.map(v => v.id === vencimiento.id ? vencimiento : v) };
      saveData(next);
      return next;
    });
  }, []);

  const deleteVencimiento = useCallback((id: string) => {
    setData(prev => {
      const next = { ...prev, vencimientos: prev.vencimientos.filter(v => v.id !== id) };
      saveData(next);
      return next;
    });
  }, []);

  const markVencimientoPaid = useCallback((id: string, paid: boolean) => {
    setData(prev => {
      const today = new Date().toISOString().split('T')[0];
      const next = {
        ...prev,
        vencimientos: prev.vencimientos.map(v =>
          v.id === id ? { ...v, paid, paidDate: paid ? today : undefined } : v
        ),
      };
      saveData(next);
      return next;
    });
  }, []);

  // Exchange Rates
  const addExchangeRate = useCallback((rate: ExchangeRate) => {
    setData(prev => {
      const next = { ...prev, exchangeRates: [...prev.exchangeRates, rate] };
      saveData(next);
      return next;
    });
  }, []);

  const updateExchangeRate = useCallback((rate: ExchangeRate) => {
    setData(prev => {
      const next = { ...prev, exchangeRates: prev.exchangeRates.map(r => r.id === rate.id ? rate : r) };
      saveData(next);
      return next;
    });
  }, []);

  // Budget Categories
  const updateBudgetCategory = useCallback((category: BudgetCategory) => {
    setData(prev => {
      const exists = prev.budgetCategories.some(c => c.id === category.id);
      const next = {
        ...prev,
        budgetCategories: exists
          ? prev.budgetCategories.map(c => c.id === category.id ? category : c)
          : [...prev.budgetCategories, category],
      };
      saveData(next);
      return next;
    });
  }, []);

  const addBudgetCategory = useCallback((category: BudgetCategory) => {
    setData(prev => {
      const next = { ...prev, budgetCategories: [...prev.budgetCategories, category] };
      saveData(next);
      return next;
    });
  }, []);

  const deleteBudgetCategory = useCallback((id: string) => {
    setData(prev => {
      const next = { ...prev, budgetCategories: prev.budgetCategories.filter(c => c.id !== id) };
      saveData(next);
      return next;
    });
  }, []);

  // Monthly Actuals
  const addMonthlyActual = useCallback((actual: MonthlyActual) => {
    setData(prev => {
      const next = { ...prev, monthlyActuals: [...prev.monthlyActuals, actual] };
      saveData(next);
      return next;
    });
  }, []);

  const updateMonthlyActual = useCallback((actual: MonthlyActual) => {
    setData(prev => {
      const next = { ...prev, monthlyActuals: prev.monthlyActuals.map(a => a.id === actual.id ? actual : a) };
      saveData(next);
      return next;
    });
  }, []);

  const deleteMonthlyActual = useCallback((id: string) => {
    setData(prev => {
      const next = { ...prev, monthlyActuals: prev.monthlyActuals.filter(a => a.id !== id) };
      saveData(next);
      return next;
    });
  }, []);

  // Export / Import
  const exportDataFn = useCallback((): string => {
    return exportJSON();
  }, []);

  const importDataFn = useCallback((json: string): void => {
    const imported = importJSON(json);
    setData(imported);
  }, []);

  const resetDataFn = useCallback((): void => {
    const fresh = resetData();
    setData(fresh);
  }, []);

  const refreshData = useCallback(() => {
    setData(loadData());
  }, []);

  return {
    data,
    persist,
    updateProperties,
    addProperty,
    updateProperty,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addVencimiento,
    updateVencimiento,
    deleteVencimiento,
    markVencimientoPaid,
    addExchangeRate,
    updateExchangeRate,
    updateBudgetCategory,
    addBudgetCategory,
    deleteBudgetCategory,
    addMonthlyActual,
    updateMonthlyActual,
    deleteMonthlyActual,
    exportData: exportDataFn,
    importData: importDataFn,
    resetData: resetDataFn,
    refreshData,
  };
}
