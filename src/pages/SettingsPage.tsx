import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RefreshCw, Shield, Database, Plus, Edit2, Download, Upload, RotateCcw,
  Eye, EyeOff, Activity, Wifi, Smartphone, Globe, LogIn, Key, Trash2
} from 'lucide-react';
import { AppData, ExchangeRate } from '../types';
import { formatDate } from '../lib/formatters';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  getLocalLog, getVisitCount, getGistConfig, saveGistConfig, clearGistConfig,
  fetchGistLog, VisitEntry, GistConfig,
} from '../lib/visitLog';

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
  onSave, onClose, initial,
}: { onSave: (r: ExchangeRate) => void; onClose: () => void; initial?: ExchangeRate }) {
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split('T')[0]);
  const [usdArs, setUsdArs] = useState(initial?.USD_ARS?.toString() ?? '');
  const [usdPen, setUsdPen] = useState(initial?.USD_PEN?.toString() ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: initial?.id ?? `er-${Date.now()}`, date, USD_ARS: Number(usdArs), USD_PEN: Number(usdPen) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">1 USD = ? ARS</label>
        <input type="number" value={usdArs} onChange={e => setUsdArs(e.target.value)} required min="0" step="0.01"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1150" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">1 USD = ? PEN</label>
        <input type="number" value={usdPen} onChange={e => setUsdPen(e.target.value)} required min="0" step="0.001"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="3.72" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
        <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">{initial ? 'Guardar' : 'Agregar'}</button>
      </div>
    </form>
  );
}

// ─── Visit Log Section ────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function VisitLogSection() {
  const [log, setLog] = useState<VisitEntry[]>([]);
  const [count, setCount] = useState(0);
  const [gistCfg, setGistCfg] = useState<GistConfig | null>(null);
  const [showGistForm, setShowGistForm] = useState(false);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [gistLoading, setGistLoading] = useState(false);
  const [gistError, setGistError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadLocal = useCallback(() => {
    setLog(getLocalLog());
    setCount(getVisitCount());
    setGistCfg(getGistConfig());
  }, []);

  useEffect(() => { loadLocal(); }, [loadLocal]);

  const handleSaveGist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setGistLoading(true);
    setGistError(null);
    try {
      // Verify token works by hitting the API
      const res = await fetch('https://api.github.com/gists', {
        headers: { Authorization: `token ${token.trim()}` },
      });
      if (!res.ok) { setGistError('Token inválido o sin permisos. Verificá que tenga scope "gist".'); setGistLoading(false); return; }
      const cfg = getGistConfig();
      saveGistConfig({ token: token.trim(), gistId: cfg?.gistId });
      setGistCfg(getGistConfig());
      setShowGistForm(false);
      setToken('');
    } catch { setGistError('Error de red al verificar el token.'); }
    finally { setGistLoading(false); }
  };

  const handleLoadGist = async () => {
    if (!gistCfg?.token || !gistCfg?.gistId) return;
    setGistLoading(true);
    try {
      const remote = await fetchGistLog(gistCfg.token, gistCfg.gistId);
      setLog(remote);
    } catch { /* ignore */ }
    finally { setGistLoading(false); }
  };

  const handleClearLog = () => {
    localStorage.removeItem('propiedades_visit_log');
    localStorage.removeItem('propiedades_visit_count');
    setLog([]);
    setCount(0);
    setShowClearConfirm(false);
  };

  const handleExportLog = () => {
    const csv = ['Fecha,IP,Ciudad,País,Dispositivo,Browser,Tipo',
      ...log.map(e => `"${formatTimestamp(e.timestamp)}","${e.ip}","${e.city ?? ''}","${e.country ?? ''}","${e.device}","${e.browser}","${e.type}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accesos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Activity size={18} className="text-slate-500" />
          Registro de Accesos
        </h2>
        <div className="flex gap-2">
          {gistCfg?.token && gistCfg?.gistId && (
            <button onClick={() => void handleLoadGist()}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
              {gistLoading ? '...' : <><Globe size={12} /> Cargar desde Gist</>}
            </button>
          )}
          <button onClick={handleExportLog} disabled={log.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg disabled:opacity-40">
            <Download size={12} /> Exportar CSV
          </button>
          <button onClick={() => setShowClearConfirm(true)} disabled={log.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg disabled:opacity-40">
            <Trash2 size={12} /> Limpiar
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{count}</div>
          <div className="text-xs text-slate-500 mt-0.5">Accesos totales</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{new Set(log.map(e => e.ip)).size}</div>
          <div className="text-xs text-slate-500 mt-0.5">IPs únicas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{log.filter(e => e.type === 'login').length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Logins</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-900 truncate">
            {log[0] ? formatTimestamp(log[0].timestamp) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Último acceso</div>
        </div>
      </div>

      {/* Log table */}
      {log.length === 0 ? (
        <div className="px-6 py-8 text-center text-slate-400 text-sm">
          No hay accesos registrados aún. Se guardarán automáticamente con cada login.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wide whitespace-nowrap">Fecha y hora</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wide">IP</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wide">Ubicación</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wide">Dispositivo</th>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wide">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {log.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap font-mono">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Wifi size={10} className="text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-slate-900">{entry.ip}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {entry.city && entry.country ? `${entry.city}, ${entry.country}` : entry.country ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Smartphone size={10} className="text-slate-400 flex-shrink-0" />
                      <span className="text-slate-700">{entry.device} · {entry.browser}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      entry.type === 'login'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      <LogIn size={9} />
                      {entry.type === 'login' ? 'Login' : 'Visita'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Gist sync section */}
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
        <div className="flex items-start gap-3">
          <Key size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-700">Sincronización con GitHub Gist</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Guardá el log en un Gist privado para verlo desde cualquier dispositivo.
              Necesitás un <a href="https://github.com/settings/tokens/new?scopes=gist" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">token de GitHub con scope "gist"</a>.
            </div>
            {gistCfg?.token ? (
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                  ✓ Token configurado {gistCfg.gistId ? `· Gist ${gistCfg.gistId.slice(0, 8)}...` : '· Sin Gist aún (se crea en el próximo login)'}
                </span>
                <button onClick={() => { clearGistConfig(); setGistCfg(null); }}
                  className="text-xs text-red-600 hover:underline">
                  Desconectar
                </button>
              </div>
            ) : (
              <button onClick={() => setShowGistForm(v => !v)}
                className="mt-2 text-xs text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg">
                + Configurar token
              </button>
            )}

            {showGistForm && (
              <form onSubmit={e => void handleSaveGist(e)} className="mt-3 space-y-2">
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => setShowToken(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {gistError && <div className="text-xs text-red-600">{gistError}</div>}
                <div className="flex gap-2">
                  <button type="submit" disabled={gistLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                    {gistLoading ? 'Verificando...' : 'Guardar token'}
                  </button>
                  <button type="button" onClick={() => { setShowGistForm(false); setGistError(null); setToken(''); }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmDialog
          title="Limpiar log de accesos"
          message="Se eliminarán todos los registros de acceso guardados en este dispositivo. Esta acción no se puede deshacer."
          confirmLabel="Limpiar"
          onConfirm={handleClearLog}
          onCancel={() => setShowClearConfirm(false)}
          danger
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SettingsPage({
  data, onAddExchangeRate, onUpdateExchangeRate, onExportData, onImportData, onResetData, onChangePassword,
}: SettingsPageProps) {
  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } else {
      setPassError('Error al cambiar la contraseña. Verificá los datos.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">Tipos de cambio, accesos, seguridad y datos</p>
      </div>

      {/* Exchange Rates */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <RefreshCw size={18} className="text-slate-500" />
            Tipos de Cambio
          </h2>
          <button onClick={() => setShowRateForm(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg">
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
                      <button onClick={() => setEditingRate(r)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
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

      {/* Visit Log */}
      <VisitLogSection />

      {/* Security */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Shield size={18} className="text-slate-500" />
            Seguridad
          </h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-600 mb-4">La contraseña se almacena como hash SHA-256 en el dispositivo. Nunca se envía a ningún servidor.</p>
          <button onClick={() => setShowPasswordModal(true)} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
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
            <button onClick={handleExport} className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Exportar</button>
          </div>
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
            <Upload size={20} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-slate-900 text-sm">Importar datos (JSON)</div>
              <div className="text-xs text-slate-500 mt-0.5">Restaura datos desde un backup. Reemplaza los datos actuales.</div>
            </div>
            <button onClick={() => fileRef.current?.click()} className="flex-shrink-0 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg">Importar</button>
            <input ref={fileRef} type="file" accept=".json" onChange={e => void handleImport(e)} className="hidden" />
          </div>
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <RotateCcw size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-red-900 text-sm">Restablecer todo</div>
              <div className="text-xs text-red-600 mt-0.5">Elimina todos los datos y restaura los datos iniciales. No se puede deshacer.</div>
            </div>
            <button onClick={() => setShowResetConfirm(true)} className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">Restablecer</button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-slate-800 rounded-xl p-6 text-white">
        <div className="text-sm font-semibold mb-1">PropAdmin v1.0.0</div>
        <div className="text-slate-400 text-xs">Administración de propiedades · Gabriel Pizarro · 2026</div>
        <div className="text-slate-500 text-xs mt-1">Datos almacenados localmente en este dispositivo</div>
      </div>

      {/* Modals */}
      {showRateForm && (
        <Modal title="Nuevo Tipo de Cambio" onClose={() => setShowRateForm(false)} size="sm">
          <ExchangeRateForm onSave={r => { onAddExchangeRate(r); setShowRateForm(false); }} onClose={() => setShowRateForm(false)} />
        </Modal>
      )}
      {editingRate && (
        <Modal title="Editar Tipo de Cambio" onClose={() => setEditingRate(null)} size="sm">
          <ExchangeRateForm initial={editingRate} onSave={r => { onUpdateExchangeRate(r); setEditingRate(null); }} onClose={() => setEditingRate(null)} />
        </Modal>
      )}
      {showPasswordModal && (
        <Modal title="Cambiar Contraseña" onClose={() => { setShowPasswordModal(false); setPassError(null); setPassSuccess(false); }} size="sm">
          <form onSubmit={e => void handleChangePassword(e)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña actual</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={currentPass} onChange={e => setCurrentPass(e.target.value)} required
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} required minLength={4}
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nueva contraseña</label>
              <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {passError && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{passError}</div>}
            {passSuccess && <div className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">¡Contraseña cambiada exitosamente!</div>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Cambiar</button>
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
