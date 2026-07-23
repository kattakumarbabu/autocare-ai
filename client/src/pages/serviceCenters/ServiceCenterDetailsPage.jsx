import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { serviceCenterApi } from '../../api/serviceCenterApi';
import {
  ArrowLeft, MapPin, Phone, Mail, Clock, Star, Navigation, ShieldCheck,
  Wrench, Fuel, Zap, Truck, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ServiceCenterDetailsPage = () => {
  const { id }   = useParams();
  const [center,  setCenter]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await serviceCenterApi.getById(id);
        setCenter(data.data.serviceCenter);
      } catch (err) {
        setError(err.response?.data?.message || 'Service center not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );

  if (error || !center) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Not Found</p>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <Link to="/service-centers" className="btn-primary text-sm">Back to Map</Link>
      </div>
    </div>
  );

  const {
    name, address, latitude, longitude, phone, email, category,
    servicesOffered, openingHours, ratings, vehicleBrandsSupported, emergencySupport, verified,
  } = center;

  const getCategoryIcon = () => {
    if (category === 'EV Charging') return Zap;
    if (category === 'Fuel Station') return Fuel;
    if (category === 'Towing Service') return Truck;
    return Wrench;
  };
  const CategoryIcon = getCategoryIcon();

  const mapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/service-centers" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {category}
              </span>
              {verified && (
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={13} /> Verified Partner
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl text-white truncate mt-1">{name}</h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {phone && (
              <a href={`tel:${phone}`} className="btn-primary py-2 px-4 text-xs">
                <Phone size={14} /> Call Station
              </a>
            )}
            <a href={mapsDirUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost py-2 px-3 text-xs">
              <Navigation size={14} /> Directions
            </a>
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 animate-slide-up">
          <div className="glass-card p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">Ratings</p>
            <p className="text-xl font-bold text-amber-400 flex items-center justify-center gap-1">
              <Star size={16} fill="currentColor" /> {ratings} / 5.0
            </p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-slate-400 text-xs mb-1">Emergency Support</p>
            <p className={`text-sm font-bold ${emergencySupport ? 'text-emerald-400' : 'text-slate-400'}`}>
              {emergencySupport ? '✓ 24/7 Roadside Assistance' : 'Standard Hours'}
            </p>
          </div>
          <div className="glass-card p-4 text-center col-span-2 sm:col-span-2">
            <p className="text-slate-400 text-xs mb-1">Opening Hours</p>
            <p className="text-sm font-semibold text-white flex items-center justify-center gap-1">
              <Clock size={14} className="text-brand-400" /> {openingHours}
            </p>
          </div>
        </div>

        {/* Map View & Details */}
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 space-y-6">

            {/* Embedded Map Frame */}
            <div className="glass-card p-4 overflow-hidden">
              <h2 className="font-semibold text-white mb-3 text-sm flex items-center gap-2">
                <MapPin size={16} className="text-brand-400" /> Location Map
              </h2>
              <div className="w-full h-72 rounded-xl overflow-hidden border border-white/10">
                <iframe
                  title="Station Location Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                />
              </div>
              <p className="text-slate-400 text-xs mt-3 flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-500" /> {address}
              </p>
            </div>

            {/* Services Offered */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white mb-3 text-base flex items-center gap-2">
                <CategoryIcon size={18} className="text-brand-400" /> Services & Features
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {servicesOffered?.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-xs text-slate-300 p-2 bg-white/5 rounded-lg">
                    <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Brands Supported & Contact Sidebar */}
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="font-semibold text-white mb-3 text-sm">Supported Brands</h3>
              <div className="flex flex-wrap gap-1.5">
                {vehicleBrandsSupported?.map((b) => (
                  <span key={b} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 space-y-3">
              <h3 className="font-semibold text-white text-sm">Contact Station</h3>
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-3 text-xs text-slate-300 hover:text-white p-2.5 bg-white/5 rounded-xl transition-colors">
                  <Phone size={14} className="text-brand-400" /> {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-3 text-xs text-slate-300 hover:text-white p-2.5 bg-white/5 rounded-xl transition-colors">
                  <Mail size={14} className="text-brand-400" /> {email}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCenterDetailsPage;
