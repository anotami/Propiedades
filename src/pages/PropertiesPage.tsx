import { MapPin, ChevronRight, Home, Users, Building } from 'lucide-react';
import { AppData, Page, Property } from '../types';
import { formatCurrency, getCountryFlag } from '../lib/formatters';
import { Badge } from '../components/ui/Badge';

interface PropertiesPageProps {
  data: AppData;
  onNavigate: (page: Page, propertyId?: string) => void;
}

function PropertyCard({ property, vencimientoCount, onDetail }: { property: Property; vencimientoCount: number; onDetail: () => void }) {
  const isAR = property.country === 'AR';
  const accentClass = isAR ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50';
  const iconClass = isAR ? 'text-blue-600' : 'text-green-600';

  const roleBadge = () => {
    if (property.role === 'owned_rented_out') return <Badge variant="rented" />;
    if (property.role === 'owned_vacant') return <Badge variant="vacant" />;
    if (property.role === 'renting') return <Badge variant="renting" />;
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className={`px-5 py-4 border-b ${accentClass} rounded-t-xl`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center`}>
              <Building size={20} className={iconClass} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{property.name}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <MapPin size={11} />
                <span>{property.address}, {property.city}</span>
              </div>
            </div>
          </div>
          <div className="text-xl">{getCountryFlag(property.country)}</div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Estado</span>
          {roleBadge()}
        </div>

        {property.rentAmount && property.rentCurrency && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {property.role === 'renting' ? 'Pago mensual' : 'Alquiler mensual'}
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {formatCurrency(property.rentAmount, property.rentCurrency)}/mes
            </span>
          </div>
        )}

        {property.rentDueDay && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Vence el día</span>
            <span className="text-sm text-slate-700">día {property.rentDueDay} de cada mes</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Cuentas de servicio</span>
          <span className="text-sm text-slate-700">{property.accounts.length}</span>
        </div>

        {vencimientoCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Vencimientos pendientes</span>
            <span className="text-sm font-medium text-amber-600">{vencimientoCount}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100">
        <button
          onClick={onDetail}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            isAR
              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              : 'bg-green-50 hover:bg-green-100 text-green-700'
          }`}
        >
          <Home size={15} />
          Ver detalle
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export function PropertiesPage({ data, onNavigate }: PropertiesPageProps) {
  const arProperties = data.properties.filter(p => p.country === 'AR');
  const peProperties = data.properties.filter(p => p.country === 'PE');

  const getPendingVencimientos = (propertyId: string) => {
    return data.vencimientos.filter(v => v.propertyId === propertyId && !v.paid).length;
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Propiedades</h1>
        <p className="text-slate-500 text-sm mt-1">Gestión de {data.properties.length} propiedades</p>
      </div>

      {/* Argentina */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          🇦🇷 Argentina
          <span className="text-sm font-normal text-slate-500">· {arProperties.length} propiedades</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {arProperties.map(p => (
            <PropertyCard
              key={p.id}
              property={p}
              vencimientoCount={getPendingVencimientos(p.id)}
              onDetail={() => onNavigate('property-detail', p.id)}
            />
          ))}
        </div>
      </section>

      {/* Peru */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          🇵🇪 Perú
          <span className="text-sm font-normal text-slate-500">· {peProperties.length} propiedades</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {peProperties.map(p => (
            <PropertyCard
              key={p.id}
              property={p}
              vencimientoCount={getPendingVencimientos(p.id)}
              onDetail={() => onNavigate('property-detail', p.id)}
            />
          ))}
        </div>
      </section>

      {/* Resumen */}
      <section className="bg-slate-800 rounded-xl p-6 text-white">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users size={18} />
          Resumen del Portafolio
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold">{data.properties.length}</div>
            <div className="text-slate-400 text-xs mt-0.5">Total propiedades</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {data.properties.filter(p => p.role === 'owned_rented_out').length}
            </div>
            <div className="text-slate-400 text-xs mt-0.5">Propias alquiladas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-400">
              {data.properties.filter(p => p.role === 'owned_vacant').length}
            </div>
            <div className="text-slate-400 text-xs mt-0.5">Vacantes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {data.properties.filter(p => p.role === 'renting').length}
            </div>
            <div className="text-slate-400 text-xs mt-0.5">Arrendadas</div>
          </div>
        </div>
      </section>
    </div>
  );
}
