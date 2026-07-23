import { Link } from 'react-router-dom';
import {
  Car, Bike, Truck, Shield, Calendar,
  AlertTriangle, Edit3, Trash2, ChevronRight, Gauge, Wrench, Layers,
} from 'lucide-react';

/* ── Config ──────────────────────────────────────────────────────────────────── */
const TYPE_ICONS = { Car: Car, Bike: Bike, Scooter: Bike, Truck: Truck };

/* ── Exported helper — used by Dashboard, Details ────────────────────────────── */
export const healthMeta = (score) => {
  if (score >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-400', label: 'Excellent', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  if (score >= 60) return { bar: 'bg-brand-500',   text: 'text-brand-400',   label: 'Good',      badge: 'bg-brand-500/10 text-brand-400 border-brand-500/20'     };
  if (score >= 35) return { bar: 'bg-yellow-500',  text: 'text-yellow-400',  label: 'Fair',      badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'   };
  return             { bar: 'bg-red-500',     text: 'text-red-400',     label: 'Poor',      badge: 'bg-red-500/10 text-red-400 border-red-500/20'             };
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

const daysLeft = (d) => {
  if (!d) return null;
  return Math.round((new Date(d) - Date.now()) / (24 * 60 * 60 * 1000));
};

const ExpiryPill = ({ date, label }) => {
  const days = daysLeft(date);
  if (days === null) return null;
  const expired = days < 0;
  const soon    = days >= 0 && days <= 30;
  if (!expired && !soon) return null; // only show if warning
  return (
    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      expired ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400'
    }`}>
      <AlertTriangle size={10} />
      {label} {expired ? 'expired' : `in ${days}d`}
    </span>
  );
};

/* ── VehicleCard ─────────────────────────────────────────────────────────────── */
const VehicleCard = ({ vehicle, onDelete }) => {
  const {
    _id, vehicleType, brand, model, variant, year,
    registrationNumber, fuelType, odometer,
    healthScore = 100, image,
    nextServiceDate, insuranceExpiry,
  } = vehicle;

  const TypeIcon = TYPE_ICONS[vehicleType] || Car;
  const hc       = healthMeta(healthScore);
  const serviceDays = daysLeft(nextServiceDate);
  const serviceSoon = serviceDays !== null && serviceDays >= 0 && serviceDays <= 30;

  return (
    <div className="glass-card overflow-hidden group hover:border-brand-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col">

      {/* Hero image */}
      <div className="relative h-44 bg-gradient-to-br from-surface-800 to-surface-900 overflow-hidden flex-shrink-0">
        {image ? (
          <img
            src={image}
            alt={`${year} ${brand} ${model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon size={52} className="text-slate-700" />
          </div>
        )}

        {/* Type badge */}
        <span className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/10">
          <TypeIcon size={11} /> {vehicleType}
        </span>

        {/* Service-due badge */}
        {serviceSoon && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/90 text-white">
            Service {serviceDays === 0 ? 'Today' : `in ${serviceDays}d`}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">

        {/* Title + health badge */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm leading-snug truncate">
              {year} {brand} {model}
              {variant ? <span className="text-slate-400 text-xs font-normal ml-1">{variant}</span> : null}
            </h3>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mt-0.5">{registrationNumber}</p>
          </div>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-semibold ${hc.badge}`}>
            {hc.label}
          </span>
        </div>

        {/* Health bar */}
        <div className="mt-3 mb-2">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1"><Shield size={10} /> Health</span>
            <span className={`${hc.text} font-bold`}>{healthScore}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full ${hc.bar} rounded-full transition-all duration-500`}
              style={{ width: `${healthScore}%` }} />
          </div>
        </div>

        {/* Meta strip */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-3">
          {odometer > 0 && (
            <span className="flex items-center gap-1">
              <Gauge size={10} /> {Number(odometer).toLocaleString()} km
            </span>
          )}
          {fuelType && <span>{fuelType}</span>}
          {nextServiceDate && (
            <span className={`flex items-center gap-1 ${serviceSoon ? 'text-orange-400' : ''}`}>
              <Calendar size={10} /> {fmtDate(nextServiceDate)}
            </span>
          )}
        </div>

        {/* Expiry warnings */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <ExpiryPill date={insuranceExpiry} label="Insurance" />
          <ExpiryPill date={nextServiceDate} label="Service" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/vehicles/${_id}/digital-twin`}
            className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2.5 rounded-xl bg-brand-gradient text-white shadow-glow transition-all"
          >
            <Layers size={13} /> Digital Twin <ChevronRight size={12} />
          </Link>
          <Link
            to={`/vehicles/${_id}/services`}
            className="px-3 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-brand-400 hover:bg-white/10 border border-white/10 transition-colors"
            aria-label="Service History"
            title="Service History"
          >
            <Wrench size={14} />
          </Link>
          <Link
            to={`/vehicles/${_id}/edit`}
            className="px-3 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
            aria-label="Edit"
            title="Edit Vehicle"
          >
            <Edit3 size={14} />
          </Link>
          <button
            onClick={() => onDelete(vehicle)}
            className="px-3 flex items-center justify-center rounded-xl bg-red-500/5 text-red-400 hover:bg-red-500/15 border border-red-500/20 transition-colors"
            aria-label="Delete"
            title="Delete Vehicle"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
