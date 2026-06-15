import React, { useState, useMemo, useRef } from 'react';
import { Plus, Download, Upload, Trash2, Edit2, Filter, Check, X } from 'lucide-react';
import { AppData, Transaction, TransactionType, Currency } from '../types';
import { formatCurrency, formatDate, getCountryFlag, getCurrentMonth } from '../lib/formatters';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface TransactionsPageProps {
  data: AppData;
  onAdd: (t: Transaction) => void;
  onUpdate: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES = ['Alquiler', 'Expensas', 'Electricidad', 'Agua', 'Gas', 'Internet', 'Impuestos', 'Mantenimiento', 'Seguros', 'Otros'];

function TransactionForm({
  data,
  onSave,
  onClose,
  initial,
}: {
  data: AppData;
  onSave: (t: Transaction) => void;
  onClose: () => void;
  initial?: Transaction;
}) {
  const [propertyId, setPropertyId] = useState(initial?.propertyId ?? '');
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'income');
  const [category, setCategory] = useState(initial?.category ?? 'Alquiler');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'USD');
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split('T')[0]);
  const [paid, setPaid] = useState(initial?.paid ?? true);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t: Transaction = {
      id: initial?.id ?? `tr-${Date.now()}`,
      date,
      propertyId: propertyId || undefined,
      type,
      category,
      description,
      amount: Number(amount),
      currency,
      paid,
      notes: notes || undefined,
    };
    onSave(t);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as TransactionType)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="income">Ingreso</option>
            <option value="expense">Egreso</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Propiedad</label>
        <select
          value={propertyId}
          onChange={e => setPropertyId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Personal</option>
          {data.properties.map(p => (
            <option key={p.id} value={p.id}>{getCountryFlag(p.country)} {p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción *</label>
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Descripción del movimiento"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Monto *</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            min="0"
            step="0.01"
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
            <option value="ARS">ARS $</option>
            <option value="USD">USD</option>
            <option value="PEN">PEN S/</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="paid-t"
          checked={paid}
          onChange={e => setPaid(e.target.checked)}
          className="rounded border-slate-300 text-blue-600"
        />
        <label htmlFor="paid-t" className="text-sm text-slate-700">Cobrado / Pagado</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
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

export function TransactionsPage({ data, onAdd, onUpdate, onDelete }: TransactionsPageProps) {
  const [filterProperty, setFilterProperty] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterMonth, setFilterMonth] = useState<string>(getCurrentMonth());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const getPropertyName = (propertyId?: string) => {
    if (!propertyId) return 'Personal';
    return data.properties.find(p => p.id === propertyId)?.name ?? 'Desconocida';
  };

  const getPropertyFlag = (propertyId?: string) => {
    if (!propertyId) return '👤';
    const p = data.properties.find(pr => pr.id === propertyId);
    return p ? getCountryFlag(p.country) : '';
  };

  const filtered = useMemo(() => {
    return data.transactions
      .filter(t => {
        if (filterProperty && t.propertyId !== filterProperty) return false;
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterMonth && !t.date.startsWith(filterMonth)) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.transactions, filterProperty, filterType, filterMonth]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const exportCSV = () => {
    const header = 'Fecha,Propiedad,Tipo,Categoría,Descripción,Monto,Moneda,Pagado';
    const rows = data.transactions.map(t =>
      [t.date, getPropertyName(t.propertyId), t.type === 'income' ? 'Ingreso' : 'Egreso', t.category, `"${t.description}"`, t.amount, t.currency, t.paid ? 'Sí' : 'No'].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimientos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportXLSX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = utils.sheet_to_json<Record<string, unknown>>(sheet);
      let imported = 0;
      for (const row of rows) {
        const amount = Number(row['Monto'] ?? row['Amount'] ?? row['amount'] ?? 0);
        const description = String(row['Descripcion'] ?? row['Descripción'] ?? row['Description'] ?? row['description'] ?? '');
        const date = String(row['Fecha'] ?? row['Date'] ?? row['date'] ?? new Date().toISOString().split('T')[0]);
        const category = String(row['Categoria'] ?? row['Categoría'] ?? row['Category'] ?? 'Otros');
        const currency = String(row['Moneda'] ?? row['Currency'] ?? 'ARS') as Currency;
        if (!amount || !description) continue;
        const t: Transaction = {
          id: `tr-import-${Date.now()}-${imported}`,
          date: date.includes('/') ? date.split('/').reverse().join('-') : date,
          type: 'expense',
          category,
          description,
          amount,
          currency,
          paid: true,
        };
        onAdd(t);
        imported++;
      }
      alert(`Se importaron ${imported} movimientos.`);
    } catch (err) {
      alert('Error al importar el archivo. Asegurate de que sea un .xlsx válido.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Movimientos</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} registros</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <Download size={14} /> CSV
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <Upload size={14} /> XLSX
          </button>
          <input ref={fileRef} type="file" accept=".xlsx" onChange={handleImportXLSX} className="hidden" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="text-xs font-medium text-emerald-700 mb-1">Ingresos</div>
          <div className="text-xl font-bold text-emerald-800">{totalIncome.toLocaleString('es-AR')}</div>
          <div className="text-xs text-emerald-600">{filtered.filter(t => t.type === 'income').length} registros</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="text-xs font-medium text-red-700 mb-1">Egresos</div>
          <div className="text-xl font-bold text-red-800">{totalExpense.toLocaleString('es-AR')}</div>
          <div className="text-xs text-red-600">{filtered.filter(t => t.type === 'expense').length} registros</div>
        </div>
        <div className={`border rounded-xl p-4 ${totalIncome - totalExpense >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
          <div className={`text-xs font-medium mb-1 ${totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Saldo</div>
          <div className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
            {(totalIncome - totalExpense).toLocaleString('es-AR')}
          </div>
          <div className={`text-xs ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>neto del período</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-400" />
        </div>
        <select
          value={filterProperty}
          onChange={e => setFilterProperty(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las propiedades</option>
          {data.properties.map(p => (
            <option key={p.id} value={p.id}>{getCountryFlag(p.country)} {p.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as 'all' | TransactionType)}
          className="text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Egresos</option>
        </select>
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={() => setFilterMonth('')} className="text-xs text-slate-500 hover:text-slate-700">
          Sin filtro mes
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No hay movimientos registrados para este filtro
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Propiedad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoría</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Monto</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-600">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-slate-700">
                        {getPropertyFlag(t.propertyId)} {getPropertyName(t.propertyId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-medium">{t.description}</td>
                    <td className="px-4 py-3 text-slate-500">{t.category}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.paid ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <Check size={10} /> Pagado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <X size={10} /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setEditing(t)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingId(t.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title="Agregar Movimiento" onClose={() => setShowForm(false)}>
          <TransactionForm
            data={data}
            onSave={t => { onAdd(t); setShowForm(false); }}
            onClose={() => setShowForm(false)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar Movimiento" onClose={() => setEditing(null)}>
          <TransactionForm
            data={data}
            initial={editing}
            onSave={t => { onUpdate(t); setEditing(null); }}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}

      {deletingId && (
        <ConfirmDialog
          title="Eliminar Movimiento"
          message="¿Seguro que querés eliminar este movimiento? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={() => { onDelete(deletingId); setDeletingId(null); }}
          onCancel={() => setDeletingId(null)}
          danger
        />
      )}
    </div>
  );
}
