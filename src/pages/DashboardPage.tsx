import { TrendingUp, TrendingDown, DollarSign, RefreshCw, AlertCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { AppData, Page } from '../types';
import { formatCurrency, formatDate, getDaysDiff, getAlertLevel, getCountryFlag, getRoleLabel, convertToUSD } from '../lib/formatters';
import { Badge } from '../components/ui/Badge';

interface DashboardPageProps {
  data: AppData;
  onMarkPaid: (id: string, paid: boolean) => void;
  onNavigate: (page: Page, propertyId?: string) => void;
}

export function DashboardPage({ data, onMarkPaid, onNavigate }: DashboardPageProps) {
  const latestRate = data.exchangeRates.sort((a, b) => b.date.localeCompare(a.date))[0];

  // Income: rent from owned_rented_out properties
  const monthlyIncome = data.properties
    .filter(p => p.role === 'owned_rented_out' && p.rentAmount && p.rentCurrency)
    .reduce((sum, p) => {
      const usd = latestRate ? convertToUSD(p.rentAmount!, p.rentCurrency!, latestRate) : 0;
      return sum + usd;
    }, 0);

  // Expense: rent paid for renting property
  const monthlyExpense = data.properties
    .filter(p => p.role === 'renting' && p.rentAmount && p.rentCurrency)
    .reduce((sum, p) => {
      const usd = latestRate ? convertToUSD(p.rentAmount!, p.rentCurrency!, latestRate) : 0;
      return sum + usd;
    }, 0);

  const netBalance = monthlyIncome - monthlyExpense;

  // Upcoming and overdue vencimientos (next 15 days + overdue)
  const alertVencimientos = data.vencimientos
    .filter(v => {
      if (v.paid) return false;
      const days = getDaysDiff(v.dueDate);
      return days <= 15;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const getPropertyName = (propertyId?: string) => {
    if (!propertyId) return 'Personal';
    const p = data.properties.find(p => p.id === propertyId);
    return p ? p.name : 'Desconocida';
  };

  const getPropertyFlag = (propertyId?: string) => {
    if (!propertyId) return '👤';
    const p = data.properties.find(p => p.id === propertyId);
    return p ? getCountryFlag(p.country) : '';
  };

  // Properties grouped
  const arProperties = data.properties.filter(p => p.country === 'AR');
  const peProperties = data.properties.filter(p => p.country === 'PE');

  const getPendingCount = (propertyId: string) => {
    return data.vencimientos.filter(v => v.propertyId === propertyId && !v.paid && getDaysDiff(v.dueDate) <= 30).length;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen general · Junio 2026</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Ingresos Mensuales</span>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(Math.round(monthlyIncome), 'USD')}</div>
          <div className="text-xs text-slate-400 mt-1">3 propiedades alquiladas</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Egresos Mensuales</span>
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown size={18} className="text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(Math.round(monthlyExpense), 'USD')}</div>
          <div className="text-xs text-slate-400 mt-1">Alquiler Vargas Machuca</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Saldo Neto</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${netBalance >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
              <DollarSign size={18} className={netBalance >= 0 ? 'text-blue-600' : 'text-red-600'} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(Math.round(netBalance), 'USD')}
          </div>
          <div className="text-xs text-slate-400 mt-1">Ingreso − Egreso (USD)</div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Tipo de Cambio</span>
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <RefreshCw size={18} className="text-purple-600" />
            </div>
          </div>
          {latestRate ? (
            <>
              <div className="text-lg font-bold text-slate-900">USD/ARS: {latestRate.USD_ARS.toLocaleString('es-AR')}</div>
              <div className="text-sm text-slate-500">USD/PEN: {latestRate.USD_PEN.toFixed(2)}</div>
              <div className="text-xs text-slate-400 mt-1">{formatDate(latestRate.date)}</div>
            </>
          ) : (
            <div className="text-sm text-slate-400">Sin datos</div>
          )}
        </div>
      </div>

      {/* Alert vencimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" />
            <h2 className="font-semibold text-slate-900">Vencimientos Próximos</h2>
          </div>
          <button
            onClick={() => onNavigate('vencimientos')}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Ver todos <ChevronRight size={14} />
          </button>
        </div>
        {alertVencimientos.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <CheckCircle size={40} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No hay vencimientos pendientes en los próximos 15 días</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {alertVencimientos.map(v => {
              const level = getAlertLevel(v);
              const days = getDaysDiff(v.dueDate);
              return (
                <div
                  key={v.id}
                  className={`px-6 py-4 flex items-center gap-4 ${
                    level === 'overdue' ? 'bg-red-50/50' : level === 'upcoming' ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <div className="text-xl">{getPropertyFlag(v.propertyId)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">{v.name}</div>
                    <div className="text-xs text-slate-500">{getPropertyName(v.propertyId)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {v.amount !== undefined && v.currency && (
                      <div className="font-semibold text-slate-900 text-sm">{formatCurrency(v.amount, v.currency)}</div>
                    )}
                    <div className="text-xs text-slate-500">{formatDate(v.dueDate)}</div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <Badge variant={level === 'paid' ? 'future' : level} />
                    {level === 'overdue' && (
                      <span className="text-xs text-red-600">{Math.abs(days)}d vencido</span>
                    )}
                    {level === 'upcoming' && (
                      <span className="text-xs text-amber-600">en {days}d</span>
                    )}
                  </div>
                  <button
                    onClick={() => onMarkPaid(v.id, true)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                  >
                    Marcar pagado
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Properties summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Argentina */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              🇦🇷 <span>Argentina</span>
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {arProperties.map(p => {
              const pending = getPendingCount(p.id);
              return (
                <div key={p.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.city} · {getRoleLabel(p.role)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {p.rentAmount && p.rentCurrency && (
                      <div className="text-sm font-semibold text-slate-900">{formatCurrency(p.rentAmount, p.rentCurrency)}</div>
                    )}
                    {pending > 0 && (
                      <div className="text-xs text-amber-600 flex items-center gap-1 justify-end">
                        <Clock size={10} />
                        {pending} pendiente{pending > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onNavigate('property-detail', p.id)}
                    className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peru */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              🇵🇪 <span>Perú</span>
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {peProperties.map(p => {
              const pending = getPendingCount(p.id);
              return (
                <div key={p.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.city} · {getRoleLabel(p.role)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {p.rentAmount && p.rentCurrency && (
                      <div className="text-sm font-semibold text-slate-900">{formatCurrency(p.rentAmount, p.rentCurrency)}</div>
                    )}
                    {pending > 0 && (
                      <div className="text-xs text-amber-600 flex items-center gap-1 justify-end">
                        <Clock size={10} />
                        {pending} pendiente{pending > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onNavigate('property-detail', p.id)}
                    className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
