import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, PieChart, TrendingUp } from 'lucide-react';
import { AppData, BudgetCategory, MonthlyActual, Currency } from '../types';
import { formatCurrency, getCurrentMonth, formatMonth } from '../lib/formatters';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BudgetPageProps {
  data: AppData;
  onUpdateBudgetCategory: (c: BudgetCategory) => void;
  onAddBudgetCategory: (c: BudgetCategory) => void;
  onDeleteBudgetCategory: (id: string) => void;
  onAddMonthlyActual: (a: MonthlyActual) => void;
  onUpdateMonthlyActual: (a: MonthlyActual) => void;
  onDeleteMonthlyActual: (id: string) => void;
}

function CategoryForm({
  onSave,
  onClose,
  initial,
}: {
  onSave: (c: BudgetCategory) => void;
  onClose: () => void;
  initial?: BudgetCategory;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [budget, setBudget] = useState(initial?.monthlyBudget?.toString() ?? '');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'PEN');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initial?.id ?? `bc-${Date.now()}`,
      name,
      monthlyBudget: Number(budget),
      currency,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: Alimentación"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Presupuesto mensual *</label>
          <input
            type="number"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            required
            min="0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PEN">PEN S/</option>
            <option value="USD">USD</option>
            <option value="ARS">ARS $</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
          Cancelar
        </button>
        <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
          {initial ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}

function ActualForm({
  data,
  month,
  onSave,
  onClose,
  initial,
}: {
  data: AppData;
  month: string;
  onSave: (a: MonthlyActual) => void;
  onClose: () => void;
  initial?: MonthlyActual;
}) {
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? data.budgetCategories[0]?.id ?? '');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'PEN');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initial?.id ?? `ma-${Date.now()}`,
      categoryId,
      month,
      amount: Number(amount),
      currency,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {data.budgetCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Monto real *</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            min="0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PEN">PEN S/</option>
            <option value="USD">USD</option>
            <option value="ARS">ARS $</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
          Cancelar
        </button>
        <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
          {initial ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}

export function BudgetPage({
  data,
  onUpdateBudgetCategory,
  onAddBudgetCategory,
  onDeleteBudgetCategory,
  onAddMonthlyActual,
  onUpdateMonthlyActual,
  onDeleteMonthlyActual,
}: BudgetPageProps) {
  const [month, setMonth] = useState(getCurrentMonth());
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [showAddActual, setShowAddActual] = useState(false);
  const [editingActual, setEditingActual] = useState<MonthlyActual | null>(null);
  const [deletingActualId, setDeletingActualId] = useState<string | null>(null);

  const actualsForMonth = useMemo(() => {
    return data.monthlyActuals.filter(a => a.month === month);
  }, [data.monthlyActuals, month]);

  const getActualForCategory = (categoryId: string) => {
    return actualsForMonth.filter(a => a.categoryId === categoryId);
  };

  const getActualTotal = (categoryId: string) => {
    return getActualForCategory(categoryId).reduce((sum, a) => sum + a.amount, 0);
  };

  const totalBudget = data.budgetCategories.reduce((sum, c) => sum + c.monthlyBudget, 0);
  const totalActual = actualsForMonth.reduce((sum, a) => sum + a.amount, 0);

  const chartData = data.budgetCategories.map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    presupuesto: c.monthlyBudget,
    real: getActualTotal(c.id),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Presupuesto Personal</h1>
          <p className="text-slate-500 text-sm mt-1">Seguimiento mensual de gastos · Perú</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddActual(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <Plus size={14} /> Gasto real
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            <Plus size={14} /> Categoría
          </button>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <PieChart size={16} className="text-slate-400" />
        <span className="text-sm text-slate-600">Período:</span>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-slate-700">{formatMonth(month)}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="text-xs font-medium text-blue-700 mb-1">Presupuesto Total</div>
          <div className="text-xl font-bold text-blue-800">{totalBudget.toLocaleString('es-PE')}</div>
          <div className="text-xs text-blue-600">PEN mensual</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="text-xs font-medium text-emerald-700 mb-1">Gasto Real</div>
          <div className="text-xl font-bold text-emerald-800">{totalActual.toLocaleString('es-PE')}</div>
          <div className="text-xs text-emerald-600">{actualsForMonth.length} registros</div>
        </div>
        <div className={`border rounded-xl p-4 ${totalActual <= totalBudget ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <div className={`text-xs font-medium mb-1 ${totalActual <= totalBudget ? 'text-green-700' : 'text-red-700'}`}>
            {totalActual <= totalBudget ? 'Disponible' : 'Excedido'}
          </div>
          <div className={`text-xl font-bold ${totalActual <= totalBudget ? 'text-green-800' : 'text-red-800'}`}>
            {Math.abs(totalBudget - totalActual).toLocaleString('es-PE')}
          </div>
          <div className={`text-xs ${totalActual <= totalBudget ? 'text-green-600' : 'text-red-600'}`}>
            {totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0}% utilizado
          </div>
        </div>
      </div>

      {/* Chart */}
      {data.budgetCategories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-500" />
            Presupuesto vs Real
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value.toLocaleString('es-PE'),
                  name === 'presupuesto' ? 'Presupuesto' : 'Real',
                ]}
              />
              <Bar dataKey="presupuesto" fill="#93c5fd" radius={[3, 3, 0, 0]} />
              <Bar dataKey="real" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.real > entry.presupuesto ? '#f87171' : '#34d399'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-300 inline-block"></span> Presupuesto</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400 inline-block"></span> Real (ok)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block"></span> Real (excedido)</span>
          </div>
        </div>
      )}

      {/* Budget table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Categorías</h2>
        </div>
        {data.budgetCategories.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No hay categorías. Agregá una para comenzar.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {data.budgetCategories.map(cat => {
              const actual = getActualTotal(cat.id);
              const pct = cat.monthlyBudget > 0 ? Math.min((actual / cat.monthlyBudget) * 100, 100) : 0;
              const over = actual > cat.monthlyBudget;
              const actuals = getActualForCategory(cat.id);

              return (
                <div key={cat.id} className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900 text-sm">{cat.name}</span>
                        {over && <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Excedido</span>}
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatCurrency(actual, cat.currency)} de {formatCurrency(cat.monthlyBudget, cat.currency)} · {Math.round(pct)}%
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setShowAddActual(true)}
                        className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"
                        title="Agregar gasto real"
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeletingCategoryId(cat.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Actuals for this category */}
                  {actuals.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {actuals.map(a => (
                        <div key={a.id} className="flex items-center gap-2 text-xs text-slate-500 pl-2 border-l-2 border-slate-100">
                          <span className="flex-1">Registro {formatMonth(a.month)}</span>
                          <span className="font-medium text-slate-700">{formatCurrency(a.amount, a.currency)}</span>
                          <button onClick={() => setEditingActual(a)} className="text-slate-300 hover:text-slate-500"><Edit2 size={10} /></button>
                          <button onClick={() => setDeletingActualId(a.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={10} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddCategory && (
        <Modal title="Agregar Categoría" onClose={() => setShowAddCategory(false)} size="sm">
          <CategoryForm
            onSave={c => { onAddBudgetCategory(c); setShowAddCategory(false); }}
            onClose={() => setShowAddCategory(false)}
          />
        </Modal>
      )}

      {editingCategory && (
        <Modal title="Editar Categoría" onClose={() => setEditingCategory(null)} size="sm">
          <CategoryForm
            initial={editingCategory}
            onSave={c => { onUpdateBudgetCategory(c); setEditingCategory(null); }}
            onClose={() => setEditingCategory(null)}
          />
        </Modal>
      )}

      {deletingCategoryId && (
        <ConfirmDialog
          title="Eliminar Categoría"
          message="¿Seguro que querés eliminar esta categoría? También se eliminarán los gastos reales asociados."
          confirmLabel="Eliminar"
          onConfirm={() => { onDeleteBudgetCategory(deletingCategoryId); setDeletingCategoryId(null); }}
          onCancel={() => setDeletingCategoryId(null)}
          danger
        />
      )}

      {showAddActual && (
        <Modal title="Agregar Gasto Real" onClose={() => setShowAddActual(false)} size="sm">
          <ActualForm
            data={data}
            month={month}
            onSave={a => { onAddMonthlyActual(a); setShowAddActual(false); }}
            onClose={() => setShowAddActual(false)}
          />
        </Modal>
      )}

      {editingActual && (
        <Modal title="Editar Gasto Real" onClose={() => setEditingActual(null)} size="sm">
          <ActualForm
            data={data}
            month={month}
            initial={editingActual}
            onSave={a => { onUpdateMonthlyActual(a); setEditingActual(null); }}
            onClose={() => setEditingActual(null)}
          />
        </Modal>
      )}

      {deletingActualId && (
        <ConfirmDialog
          title="Eliminar Gasto"
          message="¿Seguro que querés eliminar este registro de gasto real?"
          confirmLabel="Eliminar"
          onConfirm={() => { onDeleteMonthlyActual(deletingActualId); setDeletingActualId(null); }}
          onCancel={() => setDeletingActualId(null)}
          danger
        />
      )}
    </div>
  );
}
