import React, { useState } from 'react';
import {
  ArrowLeft, MapPin, CreditCard, Plus, Edit2, Trash2, Check, X, Calendar,
  FileText, AlertTriangle, Info, ExternalLink, User, Mail, Phone, Building2,
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertCircle
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

const CATEGORIES = ['Expensas', 'Electricidad', 'Agua', 'Gas', 'Internet', 'Impuestos', 'Alquiler', 'Mantenimiento', 'Seguros', 'Honorarios', 'Otros'];

// ─── Fiscal Checklist ────────────────────────────────────────────────────────

interface FiscalItem {
  status: 'ok' | 'warning' | 'alert' | 'info';
  label: string;
  detail: string;
}

function getFiscalItems(property: Property): FiscalItem[] {
  const items: FiscalItem[] = [];

  if (property.country === 'AR') {
    // Tracked monthly obligations
    items.push({
      status: 'ok',
      label: 'Expensas',
      detail: 'Trackeadas en Vencimientos.',
    });
    items.push({
      status: 'ok',
      label: 'Servicios (EPEC, Gas, Agua)',
      detail: 'Cuentas registradas y vencimientos cargados.',
    });
    items.push({
      status: 'ok',
      label: 'Impuesto Inmobiliario (Rentas Córdoba)',
      detail: 'Tributo provincial. Se paga mensualmente o en cuotas.',
    });
    items.push({
      status: 'ok',
      label: 'Tasa Municipal',
      detail: 'Tasa de Servicios a la Propiedad — municipalidad correspondiente.',
    });

    if (property.role === 'owned_rented_out') {
      items.push({
        status: 'ok',
        label: 'Honorarios inmobiliaria',
        detail: 'Comisión mensual (~10% del alquiler + IVA). Agregá el vencimiento si no está.',
      });
      items.push({
        status: 'warning',
        label: 'Seguro de Incendio Obligatorio',
        detail: 'La Ley 11.591 obliga al locador a contratar seguro contra incendio. ¿Está activo? ¿Lo paga el inquilino o vos?',
      });
      items.push({
        status: 'alert',
        label: 'Impuesto a las Ganancias (AFIP)',
        detail: 'Los alquileres son renta de 1ª categoría. Debés declarar y pagar cuatrimestralmente al AFIP. Si no estás inscripto, hay riesgo de multas.',
      });
    }

    if (property.role === 'owned_vacant') {
      items.push({
        status: 'warning',
        label: 'Seguro del Inmueble',
        detail: 'Para un inmueble vacante conviene contratar seguro contra incendio, robo y responsabilidad civil.',
      });
    }

    items.push({
      status: 'alert',
      label: 'Bienes Personales (AFIP)',
      detail: 'Declaración anual — vence en junio. Todos tus inmuebles en Argentina deben declararse a valor fiscal. Si el total de bienes supera el mínimo no imponible, se paga impuesto.',
    });

    items.push({
      status: 'warning',
      label: 'Ingresos Brutos Córdoba (IIBB)',
      detail: 'Si los alquileres se consideran actividad habitual, puede aplicar IIBB. Verificar con contador.',
    });

    if (!property.escriturada) {
      items.push({
        status: 'alert',
        label: '⚠ Escritura Pendiente',
        detail:
          'Esta propiedad está en boleto de compraventa, sin escritura. Riesgos: no podés hipotecarla, venderla es más complejo y tenés menor protección legal si el vendedor fallece o entra en concurso. ' +
          'Costos estimados al escriturar: Sellado Provincial Córdoba ~1.5% del valor + Honorarios escribano ~2–3% + IVA 21% + Arancel Registro de la Propiedad ~0.5%.',
      });
    }
  }

  if (property.country === 'PE') {
    if (property.role === 'owned_rented_out') {
      items.push({
        status: 'alert',
        label: 'Impuesto a la Renta 1ª Categoría (SUNAT)',
        detail: `5% del monto del alquiler bruto mensual. Monto estimado: S/ ${property.rentAmount ? Math.round(property.rentAmount * 0.05) : '—'}/mes. Se paga mensualmente con el Formulario Virtual 1683 en sunat.gob.pe.`,
      });
      items.push({
        status: 'warning',
        label: 'Impuesto Predial (SAT Lima)',
        detail: 'Impuesto anual sobre el valor de autovalúo del inmueble. Alícuota 0.2%–1% según tramos. Pago anual o en cuotas. Portal: sat.gob.pe.',
      });
      items.push({
        status: 'warning',
        label: 'Arbitrios Municipales',
        detail: 'Limpieza pública, parques y jardines, serenazgo. Pago trimestral o anual a la Municipalidad. Monto según metraje y ubicación.',
      });
    }

    if (property.role === 'renting') {
      items.push({
        status: 'info',
        label: 'Sin obligaciones tributarias como arrendatario',
        detail: 'El casero es quien tributa el Impuesto a la Renta 1ª categoría. Podés solicitar recibo de arrendamiento en SUNAT para respaldo.',
      });
    }
  }

  return items;
}

const fiscalStatusConfig = {
  ok: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  warning: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  alert: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
};

// ─── Vencimiento Form ────────────────────────────────────────────────────────

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

// ─── Main Component ──────────────────────────────────────────────────────────

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
  const [showFiscal, setShowFiscal] = useState(true);

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

  const pendingVencimientos = vencimientos.filter(v => !v.paid);
  const paidVencimientos = vencimientos.filter(v => v.paid);

  const fiscalItems = getFiscalItems(property);
  const fiscalAlerts = fiscalItems.filter(i => i.status === 'alert').length;
  const fiscalWarnings = fiscalItems.filter(i => i.status === 'warning').length;

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

  return (
    <div className="p-6 space-y-6">

      {/* Back + Header gradient */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Volver a Propiedades
        </button>

        <div className={`bg-gradient-to-r ${isAR ? 'from-blue-600 to-blue-700' : 'from-green-600 to-green-700'} rounded-xl p-6 text-white`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{getCountryFlag(property.country)}</span>
                <h1 className="text-xl font-bold">{property.name}</h1>
              </div>
              <div className="flex items-center gap-1.5 text-white/80 text-sm mb-2">
                <MapPin size={14} />
                <span>{property.address}, {property.city}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20">
                  {getRoleLabel(property.role)}
                </span>
                {property.propertyType && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20">
                    {property.propertyType}
                  </span>
                )}
                {property.country === 'AR' && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    property.escriturada ? 'bg-emerald-400/30' : 'bg-red-400/30'
                  }`}>
                    {property.escriturada
                      ? <><ShieldCheck size={11} /> Escriturada</>
                      : <><ShieldAlert size={11} /> Sin escritura</>
                    }
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              {property.rentAmount != null && property.rentCurrency && (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(property.rentAmount, property.rentCurrency)}</div>
                  <div className="text-sm text-white/80">{property.role === 'renting' ? 'alquiler que pagás' : 'alquiler mensual'}</div>
                  {property.rentDueDay && (
                    <div className="text-xs text-white/60 mt-0.5">vence día {property.rentDueDay}</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Ficha de la Propiedad ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-slate-500" />
            Ficha de la Propiedad
          </h2>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">

          {/* Datos generales */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Datos generales</h3>

            {property.surface && (
              <div className="flex items-start gap-2">
                <Building2 size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Superficie</div>
                  <div className="text-sm text-slate-900">{property.surface}</div>
                </div>
              </div>
            )}

            {property.floor && (
              <div className="flex items-start gap-2">
                <Building2 size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Piso / Unidad</div>
                  <div className="text-sm text-slate-900">{property.floor}</div>
                </div>
              </div>
            )}

            {property.country === 'AR' && (
              <div className="flex items-start gap-2">
                {property.escriturada
                  ? <ShieldCheck size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  : <ShieldAlert size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                }
                <div>
                  <div className="text-xs text-slate-500">Escritura</div>
                  <div className={`text-sm font-medium ${property.escriturada ? 'text-emerald-700' : 'text-red-700'}`}>
                    {property.escriturada ? 'Escriturada ✓' : 'Sin escritura — boleto de compraventa'}
                  </div>
                </div>
              </div>
            )}

            {property.generalNotes && (
              <div className="flex items-start gap-2">
                <Info size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Notas</div>
                  <div className="text-sm text-slate-700">{property.generalNotes}</div>
                </div>
              </div>
            )}
          </div>

          {/* Titularidad */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Titularidad</h3>

            {property.cuil && (
              <div className="flex items-start gap-2">
                <User size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">CUIL / RUC Titular</div>
                  <div className="text-sm font-mono text-slate-900">{property.cuil}</div>
                </div>
              </div>
            )}

            {property.contactEmail && (
              <div className="flex items-start gap-2">
                <Mail size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Email de gestión</div>
                  <div className="text-sm text-slate-900">{property.contactEmail}</div>
                </div>
              </div>
            )}

            {property.managingAgency && (
              <div className="flex items-start gap-2">
                <Building2 size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Inmobiliaria / Administrador</div>
                  <div className="text-sm text-slate-900">{property.managingAgency}</div>
                  {property.managingEmail && (
                    <div className="text-xs text-slate-500">{property.managingEmail}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Inquilino (si aplica) */}
          {(property.tenantName || property.tenantPhone || property.tenantEmail) && (
            <div className="space-y-3 sm:col-span-2 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Inquilino</h3>
              <div className="flex flex-wrap gap-6">
                {property.tenantName && (
                  <div className="flex items-start gap-2">
                    <User size={15} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-slate-500">Nombre</div>
                      <div className="text-sm text-slate-900">{property.tenantName}</div>
                    </div>
                  </div>
                )}
                {property.tenantPhone && (
                  <div className="flex items-start gap-2">
                    <Phone size={15} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-slate-500">Teléfono</div>
                      <div className="text-sm text-slate-900">{property.tenantPhone}</div>
                    </div>
                  </div>
                )}
                {property.tenantEmail && (
                  <div className="flex items-start gap-2">
                    <Mail size={15} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-slate-500">Email</div>
                      <div className="text-sm text-slate-900">{property.tenantEmail}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Portales de pago */}
          {property.paymentUrls && property.paymentUrls.length > 0 && (
            <div className="space-y-2 sm:col-span-2 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Portales de pago</h3>
              <div className="flex flex-wrap gap-2">
                {property.paymentUrls.map((u, i) => (
                  <a
                    key={i}
                    href={u.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      isAR
                        ? 'text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100'
                        : 'text-green-700 border-green-200 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    <ExternalLink size={11} />
                    {u.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Checklist Fiscal ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <button
          onClick={() => setShowFiscal(f => !f)}
          className="w-full px-6 py-4 flex items-center justify-between text-left"
        >
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-slate-500" />
            Obligaciones Fiscales
            {fiscalAlerts > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {fiscalAlerts} {fiscalAlerts === 1 ? 'alerta' : 'alertas'}
              </span>
            )}
            {fiscalWarnings > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {fiscalWarnings} {fiscalWarnings === 1 ? 'aviso' : 'avisos'}
              </span>
            )}
          </h2>
          <span className="text-slate-400 text-xs">{showFiscal ? 'Ocultar ▲' : 'Mostrar ▼'}</span>
        </button>

        {showFiscal && (
          <div className="px-6 pb-5 space-y-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 pt-3">
              Este checklist es orientativo. Consultá con tu contador para confirmar la situación fiscal actual.
            </p>
            {fiscalItems.map((item, i) => {
              const cfg = fiscalStatusConfig[item.status];
              const Icon = cfg.icon;
              return (
                <div key={i} className={`flex gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                  <Icon size={16} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <div className={`text-sm font-medium ${cfg.color}`}>{item.label}</div>
                    <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Cuentas de Servicio ── */}
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
          <div className="px-6 py-6 text-center text-slate-400 text-sm">No hay cuentas registradas</div>
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
              <button onClick={handleSaveAccount} className={`px-4 py-1.5 text-sm font-medium text-white rounded-lg ${isAR ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                Guardar
              </button>
              <button
                onClick={() => { setShowAddAccount(false); setNewAccount({ service: '', accountNumber: '' }); }}
                className="px-4 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Vencimientos ── */}
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
          <div className="px-6 py-8 text-center text-slate-400 text-sm">No hay vencimientos registrados</div>
        ) : (
          <div>
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-900 text-sm">{v.name}</span>
                            <Badge variant={level === 'paid' ? 'future' : level} />
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {formatDate(v.dueDate)}
                            {days < 0 && <span className="text-red-600"> · {Math.abs(days)} días vencido</span>}
                            {days >= 0 && days <= 7 && <span className="text-amber-600"> · en {days} días</span>}
                            {v.recurring && <span className="text-slate-400"> · recurrente día {v.recurringDayOfMonth}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {v.amount !== undefined && v.currency && (
                            <div className="text-sm font-semibold text-slate-900">{formatCurrency(v.amount, v.currency)}</div>
                          )}
                          <div className="text-xs text-slate-400">{v.category}</div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => onMarkPaid(v.id, true)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg" title="Marcar como pagado">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingVencimiento(v)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeletingVencimientoId(v.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                      <button onClick={() => onMarkPaid(v.id, false)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Marcar como pendiente">
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
