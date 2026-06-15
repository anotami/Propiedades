import React, { useState, useMemo } from 'react';
import { Plus, Check, X, Edit2, Trash2, Filter, Calendar } from 'lucide-react';
import { AppData, Vencimiento, Currency, Country } from '../types';
import { formatCurrency, formatDate, getAlertLevel, getCountryFlag, getDaysDiff, getCurrentMonth } from '../lib/formatters';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface VencimientosPageProps {
  data: AppData;
  onAdd: (v: Vencimiento) => void;
  onUpdate: (v: Vencimiento) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string, paid: boolean) => void;
}

const CATEGORIES = ['Expensas', 'Electricidad', 'Agua', 'Gas', 'Internet', 'Impuestos', 'Alquiler', 'Mantenimiento', 'Seguros', 'Otros'];

function VencimientoForm({
  data,
  onSave,
  onClose,
  initial,
}: {
  data: AppData;
  onSave: (v: Vencimiento) => void;
  onClose: () => void;
  initial?: Vencimiento;
}) {
  const [propertyId, setPropertyId] = useState(initial?.propertyId ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Expensas');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'ARS');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [recurringDay, setRecurringDay] = useState(initial?.recurringDayOfMonth?.toString() ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v: Vencimiento = {
      id: initial?.id ?? `v-${Date.now()}`,
      propertyId: propertyId || undefined,
      name,
      category,
      amount: amount ? Number(amount) : undefined,
      currency: amount ? currency : undefined,
      dueDate,
      paid: initial?.paid ?? false,
      paidDate: initial?.paidDate,
      recurring,
      recurringDayOfMonth: recurring && recurringDay ? Number(recurringDay) : undefined,
      notes: notes || undefined,
    };
    onSave(v);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Propiedad</label>
        <select
          value={propertyId}
          onChange={e => setPropertyId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Personal (sin propiedad)</option>
          {data.properties.map(p => (
            <option key={p.id} value={p.id}>{getCountryFlag(p.country)} {p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: EPEC junio"
        />
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="0"
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

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de vencimiento *</label>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recurring-v"
          checked={recurring}
          onChange={e => setRecurring(e.target.checked)}
          className="rounded border-slate-300 text-blue-600"
        />
        <label htmlFor="recurring-v" className="text-sm text-slate-700">Recurrente mensual</label>
      </div>

      {recurring && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Día del mes</label>
          <input
            type="number"
            value={recurringDay}
            onChange={e => setRecurringDay(e.target.value)}
            min="1"
            max="31"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

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

export function VencimientosPage({ data, onAdd, onUpdate, onDelete, onMarkPaid }: VencimientosPageProps) {
  const [filterCountry, setFilterCountry] = useState<'all' | Country | 'personal'>('all');
  const [filterMonth, setFilterMonth] = useState<string>(getCurrentMonth());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vencimiento | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getPropertyName = (propertyId?: string) => {
    if (!propertyId) return 'Personal';
    return data.properties.find(p => p.id === propertyId)?.name ?? 'Desconocida';
  };

  const getPropertyCountry = (propertyId?: string): Country | null => {
    if (!propertyId) return null;
    return data.properties.find(p => p.id === propertyId)?.country ?? null;
  };

  const filtered = useMemo(() => {
    return data.vencimientos.filter(v => {
      // Country filter
      if (filterCountry !== 'all') {
        const country = getPropertyCountry(v.propertyId);
        if (filterCountry === 'personal') {
          if (v.propertyId !== undefined) return false;
        } else {
          if (country !== filterCountry) return false;
        }
      }
      // Month filter
      if (filterMonth) {
        if (!v.dueDate.startsWith(filterMonth)) return false;
      }
      return true;
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [data.vencimientos, filterCountry, filterMonth]);

  const overdue = filtered.filter(v => !v.paid && getDaysDiff(v.dueDate) < 0);
  const upcoming15 = filtered.filter(v => !v.paid && getDaysDiff(v.dueDate) >= 0 && getDaysDiff(v.dueDate) <= 15);
  const thisMonth = filtered.filter(v => !v.paid && getDaysDiff(v.dueDate) > 15);
  const paid = filtered.filter(v => v.paid);

  const VencimientoRow = ({ v }: { v: Vencimiento }) => {
    const level = getAlertLevel(v);
    const days = getDaysDiff(v.dueDate);
    const country = getPropertyCountry(v.propertyId);
    const flag = country ? getCountryFlag(country) : '👤';

    return (
      <div className={`px-6 py-4 flex items-center gap-4 ${
        v.paid ? 'opacity-60' : level === 'overdue' ? 'bg-red-50/40' : level === 'upcoming' ? 'bg-amber-50/40' : ''
      }`}>
        <div className="text-lg flex-shrink-0">{flag}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-sm ${v.paid ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{v.name}</span>
            <Badge variant={v.paid ? 'paid' : level === 'paid' ? 'future' : level} />
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {getPropertyName(v.propertyId)} · {v.category}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {v.amount !== undefined && v.currency && (
            <div className="text-sm font-semibold text-slate-900">{formatCurrency(v.amount, v.currency)}</div>
          )}
          <div className="text-xs text-slate-500">{formatDate(v.dueDate)}</div>
          {!v.paid && days < 0 && <div className="text-xs text-red-600">{Math.abs(days)}d vencido</div>}
          {!v.paid && days >= 0 && days <= 7 && <div className="text-xs text-amber-600">en {days}d</div>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {!v.paid ? (
            <button onClick={() => onMarkPaid(v.id, true)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg" title="Marcar pagado">
              <Check size={14} />
            </button>
          ) : (
            <button onClick={() => onMarkPaid(v.id, false)} className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg" title="Desmarcar">
              <X size={14} />
            </button>
          )}
          <button onClick={() => setEditing(v)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <Edit2 size={14} />
          </button>
          <button onClick={() => setDeletingId(v.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  const Section = ({ title, items, color }: { title: string; items: Vencimiento[]; color: string }) => {
    if (items.length === 0) return null;
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className={`px-6 py-3 border-b ${color}`}>
          <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
          <span className="ml-2 text-xs opacity-70">({items.length})</span>
        </div>
        <div className="divide-y divide-slate-50">
          {items.map(v => <VencimientoRow key={v.id} v={v} />)}
        </div>
      </div>
    );
  };

  const totalPending = overdue.length + upcoming15.length + thisMonth.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vencimientos</h1>
          <p className="text-slate-500 text-sm mt-1">
            {totalPending} pendiente{totalPending !== 1 ? 's' : ''} · {paid.length} pagado{paid.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-400" />
          <span className="text-sm text-slate-500">Filtrar:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'AR', 'PE', 'personal'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterCountry(f)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                filterCountry === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'AR' ? '🇦🇷 Argentina' : f === 'PE' ? '🇵🇪 Perú' : '👤 Personal'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Calendar size={14} className="text-slate-400" />
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setFilterMonth('')}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Sin filtro
          </button>
        </div>
      </div>

      {/* Sections */}
      <Section
        title="🔴 Vencidos"
        items={overdue}
        color="bg-red-50 text-red-700 border-red-100"
      />
      <Section
        title="🟡 Próximos 15 días"
        items={upcoming15}
        color="bg-amber-50 text-amber-700 border-amber-100"
      />
      <Section
        title="📅 Resto del mes"
        items={thisMonth}
        color="bg-blue-50 text-blue-700 border-blue-100"
      />
      <Section
        title="✅ Pagados"
        items={paid}
        color="bg-emerald-50 text-emerald-700 border-emerald-100"
      />

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay vencimientos para este período</p>
        </div>
      )}

      {showForm && (
        <Modal title="Agregar Vencimiento" onClose={() => setShowForm(false)}>
          <VencimientoForm
            data={data}
            onSave={v => { onAdd(v); setShowForm(false); }}
            onClose={() => setShowForm(false)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar Vencimiento" onClose={() => setEditing(null)}>
          <VencimientoForm
            data={data}
            initial={editing}
            onSave={v => { onUpdate(v); setEditing(null); }}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}

      {deletingId && (
        <ConfirmDialog
          title="Eliminar Vencimiento"
          message="¿Seguro que querés eliminar este vencimiento?"
          confirmLabel="Eliminar"
          onConfirm={() => { onDelete(deletingId); setDeletingId(null); }}
          onCancel={() => setDeletingId(null)}
          danger
        />
      )}
    </div>
  );
}
