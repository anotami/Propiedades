import React, { useState } from 'react';
import {
  ArrowLeft, MapPin, CreditCard, Plus, Edit2, Trash2, Check, X, Calendar
} from 'lucide-react';
import { AppData, Property, ServiceAccount, Vencimiento, Currency } from '../types';
import { formatCurrency, formatDate, getAlertLevel, getCountryFlag, getRoleLabel, getDaysDiff } from '../lib/formatters';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface PropertyDetailPageProps {
  propertyId: string;
  data: AppData;
  onBack: () => void;
  onUpdateProperty: (property: Property) => void;
  onAddVencimiento: (v: Vencimiento) => void;
  onUpdateVencimiento: (v: Vencimiento) => void;
  onDeleteVencimiento: (id: string) => void;
  onMarkPaid: (id: string, paid: boolean) => void;
}

const CATEGORIES = ['Expensas', 'Electricidad', 'Agua', 'Gas', 'Internet', 'Impuestos', 'Alquiler', 'Mantenimiento', 'Seguros', 'Otros'];

function VencimientoForm({
  propertyId,
  onSave,
  onClose,
  initial,
}: {
  propertyId: string;
  onSave: (v: Vencimiento) => void;
  onClose: () => void;
  initial?: Vencimiento;
}) {
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
      propertyId,
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
          id="recurring"
          checked={recurring}
          onChange={e => setRecurring(e.target.checked)}
          className="rounded border-slate-300 text-blue-600"
        />
        <label htmlFor="recurring" className="text-sm text-slate-700">Vencimiento recurrente mensual</label>
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
            placeholder="Ej: 10"
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
          placeholder="Notas opcionales..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          {initial ? 'Guardar cambios' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}

export function PropertyDetailPage({
  propertyId,
  data,
  onBack,
  onUpdateProperty,
  onAddVencimiento,
  onUpdateVencimiento,
  onDeleteVencimiento,
  onMarkPaid,
}: PropertyDetailPageProps) {
  const property = data.properties.find(p => p.id === propertyId);
  const [showAddVencimiento, setShowAddVencimiento] = useState(false);
  const [editingVencimiento, setEditingVencimiento] = useState<Vencimiento | null>(null);
  const [deletingVencimientoId, setDeletingVencimientoId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<{ index: number; account: ServiceAccount } | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState<ServiceAccount>({ service: '', accountNumber: '' });

  if (!property) {
    return (
      <div className="p-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Volver
        </button>
        <p className="mt-4 text-slate-500">Propiedad no encontrada.</p>
      </div>
    );
  }

  const isAR = property.country === 'AR';

  const vencimientos = data.vencimientos
    .filter(v => v.propertyId === propertyId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const handleSaveAccount = () => {
    if (!newAccount.service) return;
    const updated: Property = {
      ...property,
      accounts: [...property.accounts, { ...newAccount }],
    };
    onUpdateProperty(updated);
    setNewAccount({ service: '', accountNumber: '' });
    setShowAddAccount(false);
  };

  const handleUpdateAccount = () => {
    if (!editingAccount) return;
    const accounts = [...property.accounts];
    accounts[editingAccount.index] = editingAccount.account;
    onUpdateProperty({ ...property, accounts });
    setEditingAccount(null);
  };

  const handleDeleteAccount = (index: number) => {
    const accounts = property.accounts.filter((_, i) => i !== index);
    onUpdateProperty({ ...property, accounts });
  };

  const pendingVencimientos = vencimientos.filter(v => !v.paid);
  const paidVencimientos = vencimientos.filter(v => v.paid);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Volver a Propiedades
        </button>

        <div className={`bg-gradient-to-r ${isAR ? 'from-blue-600 to-blue-700' : 'from-green-600 to-green-700'} rounded-xl p-6 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{getCountryFlag(property.country)}</span>
                <h1 className="text-xl font-bold">{property.name}</h1>
              </div>
              <div className="flex items-center gap-1.5 text-blue-100 text-sm">
                <MapPin size={14} />
                <span>{property.address}, {property.city}</span>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                  {getRoleLabel(property.role)}
                </span>
              </div>
            </div>
            <div className="text-right">
              {property.rentAmount && property.rentCurrency && (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(property.rentAmount, property.rentCurrency)}</div>
                  <div className="text-sm text-blue-100">por mes</div>
                  {property.rentDueDay && (
                    <div className="text-xs text-blue-200 mt-0.5">vence día {property.rentDueDay}</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cuentas de servicio */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <CreditCard size={18} className="text-slate-500" />
            Cuentas de Servicio
          </h2>
          <button
            onClick={() => setShowAddAccount(true)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isAR ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' : 'text-green-700 bg-green-50 hover:bg-green-100'
            }`}
          >
            <Plus size={14} /> Agregar
          </button>
        </div>

        {property.accounts.length === 0 ? (
          <div className="px-6 py-6 text-center text-slate-400 text-sm">
            No hay cuentas registradas
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {property.accounts.map((acc, i) => (
              <div key={i} className="px-6 py-3 flex items-center gap-4">
                {editingAccount?.index === i ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={editingAccount.account.service}
                        onChange={e => setEditingAccount({ ...editingAccount, account: { ...editingAccount.account, service: e.target.value } })}
                        className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg"
                        placeholder="Servicio"
                      />
                      <input
                        value={editingAccount.account.accountNumber}
                        onChange={e => setEditingAccount({ ...editingAccount, account: { ...editingAccount.account, accountNumber: e.target.value } })}
                        className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg"
                        placeholder="N° de cuenta"
                      />
                    </div>
                    <input
                      value={editingAccount.account.notes ?? ''}
                      onChange={e => setEditingAccount({ ...editingAccount, account: { ...editingAccount.account, notes: e.target.value || undefined } })}
                      className="px-2 py-1.5 text-sm border border-slate-300 rounded-lg"
                      placeholder="Notas"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleUpdateAccount} className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        <Check size={12} /> Guardar
                      </button>
                      <button onClick={() => setEditingAccount(null)} className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        <X size={12} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{acc.service}</div>
                      {acc.accountNumber && (
                        <div className="text-xs text-slate-500 font-mono">{acc.accountNumber}</div>
                      )}
                      {acc.notes && <div className="text-xs text-slate-400 mt-0.5">{acc.notes}</div>}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingAccount({ index: i, account: { ...acc } })}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(i)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {showAddAccount && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Servicio</label>
                <input
                  value={newAccount.service}
                  onChange={e => setNewAccount(a => ({ ...a, service: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  placeholder="Ej: EPEC"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">N° de cuenta</label>
                <input
                  value={newAccount.accountNumber}
                  onChange={e => setNewAccount(a => ({ ...a, accountNumber: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  placeholder="123456"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
              <input
                value={newAccount.notes ?? ''}
                onChange={e => setNewAccount(a => ({ ...a, notes: e.target.value || undefined }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                placeholder="Opcional"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveAccount} className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                Guardar
              </button>
              <button onClick={() => { setShowAddAccount(false); setNewAccount({ service: '', accountNumber: '' }); }}
                className="px-4 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vencimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Calendar size={18} className="text-slate-500" />
            Vencimientos
            {pendingVencimientos.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingVencimientos.length} pendiente{pendingVencimientos.length > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <button
            onClick={() => setShowAddVencimiento(true)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isAR ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' : 'text-green-700 bg-green-50 hover:bg-green-100'
            }`}
          >
            <Plus size={14} /> Agregar
          </button>
        </div>

        {vencimientos.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">
            No hay vencimientos registrados
          </div>
        ) : (
          <div>
            {/* Pendientes */}
            {pendingVencimientos.length > 0 && (
              <div>
                <div className="px-6 py-2 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pendientes</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {pendingVencimientos.map(v => {
                    const level = getAlertLevel(v);
                    const days = getDaysDiff(v.dueDate);
                    return (
                      <div
                        key={v.id}
                        className={`px-6 py-4 flex items-center gap-4 ${
                          level === 'overdue' ? 'bg-red-50/50' : level === 'upcoming' ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 text-sm">{v.name}</span>
                            <Badge variant={level === 'paid' ? 'future' : level} />
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {formatDate(v.dueDate)}
                            {days < 0 && <span className="text-red-600"> · {Math.abs(days)} días vencido</span>}
                            {days >= 0 && days <= 7 && <span className="text-amber-600"> · en {days} días</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {v.amount !== undefined && v.currency && (
                            <div className="text-sm font-semibold text-slate-900">{formatCurrency(v.amount, v.currency)}</div>
                          )}
                          <div className="text-xs text-slate-400">{v.category}</div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onMarkPaid(v.id, true)}
                            className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                            title="Marcar como pagado"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingVencimiento(v)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingVencimientoId(v.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pagados */}
            {paidVencimientos.length > 0 && (
              <div>
                <div className="px-6 py-2 bg-slate-50 border-t border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pagados</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {paidVencimientos.map(v => (
                    <div key={v.id} className="px-6 py-3 flex items-center gap-4 opacity-60">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700 text-sm line-through">{v.name}</span>
                          <Badge variant="paid" />
                        </div>
                        <div className="text-xs text-slate-400">{formatDate(v.dueDate)}</div>
                      </div>
                      {v.amount !== undefined && v.currency && (
                        <div className="text-sm text-slate-500">{formatCurrency(v.amount, v.currency)}</div>
                      )}
                      <button
                        onClick={() => onMarkPaid(v.id, false)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Marcar como pendiente"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddVencimiento && (
        <Modal title="Agregar Vencimiento" onClose={() => setShowAddVencimiento(false)}>
          <VencimientoForm
            propertyId={propertyId}
            onSave={v => { onAddVencimiento(v); setShowAddVencimiento(false); }}
            onClose={() => setShowAddVencimiento(false)}
          />
        </Modal>
      )}

      {editingVencimiento && (
        <Modal title="Editar Vencimiento" onClose={() => setEditingVencimiento(null)}>
          <VencimientoForm
            propertyId={propertyId}
            initial={editingVencimiento}
            onSave={v => { onUpdateVencimiento(v); setEditingVencimiento(null); }}
            onClose={() => setEditingVencimiento(null)}
          />
        </Modal>
      )}

      {deletingVencimientoId && (
        <ConfirmDialog
          title="Eliminar Vencimiento"
          message="¿Seguro que querés eliminar este vencimiento? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={() => { onDeleteVencimiento(deletingVencimientoId); setDeletingVencimientoId(null); }}
          onCancel={() => setDeletingVencimientoId(null)}
          danger
        />
      )}
    </div>
  );
}
