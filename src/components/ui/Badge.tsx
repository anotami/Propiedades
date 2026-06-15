
type BadgeVariant = 'overdue' | 'upcoming' | 'paid' | 'vacant' | 'rented' | 'renting' | 'future';

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

const config: Record<BadgeVariant, { label: string; className: string }> = {
  overdue: { label: 'Vencido', className: 'bg-red-100 text-red-800 border border-red-200' },
  upcoming: { label: 'Próximo', className: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
  paid: { label: 'Pagado', className: 'bg-green-100 text-green-800 border border-green-200' },
  future: { label: 'Pendiente', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
  vacant: { label: 'Vacante', className: 'bg-gray-100 text-gray-700 border border-gray-200' },
  rented: { label: 'Alquilada', className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  renting: { label: 'En alquiler', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
};

export function Badge({ variant, className = '' }: BadgeProps) {
  const { label, className: variantClass } = config[variant];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClass} ${className}`}>
      {label}
    </span>
  );
}
