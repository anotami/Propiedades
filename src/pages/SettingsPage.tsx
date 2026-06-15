import React, { useState, useRef } from 'react';
import { RefreshCw, Shield, Database, Plus, Edit2, Download, Upload, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { AppData, ExchangeRate } from '../types';
import { formatDate } from '../lib/formatters';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface SettingsPageProps {
  data: AppData;
  onAddExchangeRate: (rate: ExchangeRate) => void;
  onUpdateExchangeRate: (rate: ExchangeRate) => void;
  onExportData: () => string;
  onImportData: (json: string) => void;
  onResetData: () => void;
  onChangePassword: (current: string, newPass: string, confirm: string) => Promise<boolean>;
}

function ExchangeRateForm({
  onSave,
  onClose,
  initial,
}: {
  onSave: (r: ExchangeRate) => void;
  onClose: () => void;
  initial?: ExchangeRate;
}) {
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split('T')[0]);
  const [usdArs, setUsdArs] = useState(initial?.USD_ARS?.toString() ?? '');
  const [usdPen, setUsdPen] = useState(initial?.USD_PEN?.toString() ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initial?.id ?? `er-${Date.now()}`,
      date,
      USD_ARS: Number(usdArs),
      USD_PEN: Number(usdPen),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">1 USD = ? ARS</label>
        <input
          type="number"
          value={usdArs}
          onChange={e => setUsdArs(e.target.value)}
          required
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="1150"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">1 USD = ? PEN</label>
        <input
          type="number"
          value={usdPen}
          onChange={e => setUsdPen(e.target.value)}
          required
          min="0"
          step="0.001"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="3.72"
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

export function SettingsPage({
  data,
  onAddExchangeRate,
  onUpdateExchangeRate,
  onExportData,
  onImportData,
  onResetData,
  onChangePassword,
}: SettingsPageProps) {
  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Password form state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  const sortedRates = [...data.exchangeRates].sort((a, b) => b.date.localeCompare(a.date));

  const handleExport = () => {
    const json = onExportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propiedades_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      onImportData(text);
      alert('Datos importados correctamente.');
    } catch {
      alert('Error al importar. Asegurate de que el archivo sea un backup válido.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);
    const ok = await onChangePassword(currentPass, newPass, confirmPass);
    if (ok) {
      setPassSuccess(true);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      setPassError('Error al cambiar la contraseña. Verificá los datos.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">Tipos de cambio, seguridad y datos</p>
      </div>

      {/* Exchange Rates */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <RefreshCw size={18} className="text-slate-500" />
            Tipos de Cambio
          </h2>
          <button
            onClick={() => setShowRateForm(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
          >
            <Plus size={14} /> Actualizar
          </button>
        </div>
        {sortedRates.length === 0 ? (
          <div className="px-6 py-6 text-center text-slate-400 text-sm">Sin datos de tipo de cambio</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">USD/ARS</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">USD/PEN</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedRates.map((r, i) => (
                  <tr key={r.id} className={`hover:bg-slate-50/50 ${i === 0 ? 'font-medium' : ''}`}>
                    <td className="px-6 py-3 text-slate-700">
                      {formatDate(r.date)}
                      {i === 0 && <span className="ml-2 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Actual</span>}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-900">{r.USD_ARS.toLocaleString('es-AR')}</td>
                    <td className="px-6 py-3 text-right text-slate-900">{r.USD_PEN.toFixed(3)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditingRate(r)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Shield size={18} className="text-slate-500" />
            Seguridad
          </h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-600 mb-4">
            La contraseña se almacena como hash SHA-256 en el dispositivo. Nunca se envía a ningún servidor.
          </p>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cambiar contraseña
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Database size={18} className="text-slate-500" />
            Gestión de Datos
          </h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
            <Download size={20} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-slate-900 text-sm">Exportar datos (JSON)</div>
              <div className="text-xs text-slate-500 mt-0.5">Descarga un backup de todos tus datos</div>
            </div>
            <button
              onClick={handleExport}
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Exportar
            </button>
          </div>

          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
            <Upload size={20} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-slate-900 text-sm">Importar datos (JSON)</div>
              <div className="text-xs text-slate-500 mt-0.5">Restaura datos desde un backup. Reemplaza los datos actuales.</div>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg"
            >
              Importar
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>

          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <RotateCcw size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-red-900 text-sm">Restablecer todo</div>
              <div className="text-xs text-red-600 mt-0.5">Elimina todos los datos y restaura los datos iniciales. No se puede deshacer.</div>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Restablecer
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-slate-800 rounded-xl p-6 text-white">
        <div className="text-sm font-semibold mb-1">PropAdmin v1.0.0</div>
        <div className="text-slate-400 text-xs">
          Administración de propiedades · Gabriel Pizarro · 2026
        </div>
        <div className="text-slate-500 text-xs mt-1">
          Datos almacenados localmente en este dispositivo
        </div>
      </div>

      {/* Modals */}
      {showRateForm && (
        <Modal title="Nuevo Tipo de Cambio" onClose={() => setShowRateForm(false)} size="sm">
          <ExchangeRateForm
            onSave={r => { onAddExchangeRate(r); setShowRateForm(false); }}
            onClose={() => setShowRateForm(false)}
          />
        </Modal>
      )}

      {editingRate && (
        <Modal title="Editar Tipo de Cambio" onClose={() => setEditingRate(null)} size="sm">
          <ExchangeRateForm
            initial={editingRate}
            onSave={r => { onUpdateExchangeRate(r); setEditingRate(null); }}
            onClose={() => setEditingRate(null)}
          />
        </Modal>
      )}

      {showPasswordModal && (
        <Modal title="Cambiar Contraseña" onClose={() => { setShowPasswordModal(false); setPassError(null); setPassSuccess(false); }} size="sm">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  required
                  minLength={4}
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {passError && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{passError}</div>}
            {passSuccess && <div className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">¡Contraseña cambiada exitosamente!</div>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                Cambiar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showResetConfirm && (
        <ConfirmDialog
          title="Restablecer todos los datos"
          message="Esto eliminará TODOS tus datos (transacciones, vencimientos, tipos de cambio) y restaurará los datos iniciales. Esta acción NO se puede deshacer."
          confirmLabel="Sí, restablecer"
          onConfirm={() => { onResetData(); setShowResetConfirm(false); }}
          onCancel={() => setShowResetConfirm(false)}
          danger
        />
      )}
    </div>
  );
}
