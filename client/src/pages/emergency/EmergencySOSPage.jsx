import { useState, useEffect } from 'react';
import { emergencyApi } from '../../api/emergencyApi';
import { vehicleApi }   from '../../api/vehicleApi';
import {
  AlertTriangle, Phone, MapPin, Shield, Truck, Cross,
  Share2, Navigation, Loader2, CheckCircle2, Car, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmergencySOSPage = () => {
  const [loadingLoc, setLoadingLoc]   = useState(false);
  const [coords,     setCoords]       = useState(null);
  const [vehicles,   setVehicles]     = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [sosActive,  setSosActive]    = useState(false);
  const [sosData,    setSosData]      = useState(null);
  const [nearby,     setNearby]       = useState({ hospitals: [], policeStations: [], towingServices: [] });

  useEffect(() => {
    // Fetch vehicles
    (async () => {
      try {
        const { data: vRes } = await vehicleApi.getAll({ limit: 10 });
        const vList = vRes.data?.vehicles || [];
        setVehicles(vList);
        if (vList.length > 0) setSelectedVehicle(vList[0]._id);
      } catch {
        // Handled
      }
    })();

    // Fetch initial nearby emergency contacts
    (async () => {
      try {
        const { data: nRes } = await emergencyApi.getNearby();
        setNearby(nRes.data || {});
      } catch {
        // Handled
      }
    })();

    // Auto-detect geolocation
    detectLocation();
  }, []);

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      setLoadingLoc(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: Number(pos.coords.latitude.toFixed(5)),
            longitude: Number(pos.coords.longitude.toFixed(5)),
          });
          setLoadingLoc(false);
        },
        () => {
          setLoadingLoc(false);
          toast.error('Location permission denied or unavailable. Using approximate IP location.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleTriggerSOS = async () => {
    setSosActive(true);
    try {
      const payload = {
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        vehicleId: selectedVehicle,
      };

      const { data: res } = await emergencyApi.triggerSOS(payload);
      setSosData(res.data.sosPayload);
      toast.success('🆘 EMERGENCY SOS BROADCASTED SUCCESSFULLY!');
    } catch {
      toast.error('Failed to broadcast SOS alert');
      setSosActive(false);
    }
  };

  const shareWhatsAppSOS = () => {
    if (!sosData) return;
    const text = encodeURIComponent(
      `🆘 EMERGENCY SOS ALERT!\nName: ${sosData.user.name}\nVehicle: ${sosData.vehicle.name} (${sosData.vehicle.registrationNumber})\nLocation: ${sosData.location.mapsUrl}\nEmergency Contact: ${sosData.user.emergencyContact.phone}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="text-center mb-8 animate-fade-in">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider mb-2">
            <AlertTriangle size={14} className="animate-pulse" /> Emergency Rapid Response
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
            1-Tap Emergency <span className="text-red-500">SOS Dispatch</span>
          </h1>
          <p className="text-slate-400 text-xs max-w-md mx-auto mt-1">
            Instantly broadcast your live location, vehicle profile, and emergency contacts to towing services, police, and hospitals.
          </p>
        </div>

        {/* ── GIANT ONE-TAP SOS BUTTON ─────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center my-10 animate-scale-up">
          <button
            onClick={handleTriggerSOS}
            className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center text-white font-display font-extrabold text-2xl tracking-wider transition-all duration-300 shadow-2xl relative group ${
              sosActive
                ? 'bg-red-600 ring-8 ring-red-500/40 shadow-red-600/80 animate-pulse'
                : 'bg-gradient-to-br from-red-600 via-red-500 to-rose-700 hover:scale-105 ring-4 ring-red-500/20 shadow-red-600/50'
            }`}
            id="emergency-sos-btn"
          >
            <AlertTriangle size={56} className="mb-2 group-hover:scale-110 transition-transform" />
            <span>{sosActive ? 'SOS BROADCASTING' : 'TAP FOR SOS'}</span>
            <span className="text-[10px] font-sans font-normal text-red-100 opacity-90 mt-1">ONE TAP EMERGENCY</span>
          </button>
        </div>

        {/* Live Location & Vehicle Selector Strip */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8 animate-fade-in">
          {/* Live Location Card */}
          <div className="glass-card p-5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 flex-shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Live GPS Location</p>
                <p className="text-slate-400 text-[11px] font-mono mt-0.5">
                  {loadingLoc ? 'Detecting coordinates…' : coords ? `${coords.latitude}, ${coords.longitude}` : 'Location Active'}
                </p>
              </div>
            </div>
            <button
              onClick={detectLocation}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              Refresh
            </button>
          </div>

          {/* Vehicle Selector */}
          <div className="glass-card p-5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-400 flex-shrink-0">
                <Car size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold">Active Breakdown Vehicle</p>
                <select
                  value={selectedVehicle || ''}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="bg-transparent text-slate-300 text-xs font-medium focus:outline-none cursor-pointer truncate max-w-[180px]"
                >
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id} className="bg-surface-900 text-white">
                      {v.year} {v.brand} {v.model} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SOS Broadcast Active Card */}
        {sosData && (
          <div className="glass-card p-6 mb-8 border border-red-500/40 bg-red-500/10 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4 border-b border-red-500/20 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-red-400" />
                <h3 className="font-semibold text-white text-base">SOS Alert Active & Transmitted</h3>
              </div>
              <button
                onClick={shareWhatsAppSOS}
                className="btn-primary py-2 px-4 text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                <Share2 size={14} /> Share via WhatsApp
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400">Emergency Contacts Notified:</p>
                <p className="text-white font-semibold mt-0.5">{sosData.user.emergencyContact.name} ({sosData.user.emergencyContact.phone})</p>
              </div>
              <div>
                <p className="text-slate-400">Broadcasting Vehicle:</p>
                <p className="text-white font-semibold mt-0.5">{sosData.vehicle.name} [{sosData.vehicle.registrationNumber}]</p>
              </div>
            </div>
          </div>
        )}

        {/* ── NEAREST EMERGENCY SERVICES ────────────────────────────── */}
        <h2 className="font-display font-bold text-xl text-white mb-4">Nearest Emergency Services</h2>

        <div className="grid sm:grid-cols-3 gap-4 mb-8 animate-fade-in">

          {/* 🛞 Towing Services */}
          <div className="glass-card p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={18} className="text-amber-400" />
              <h3 className="font-semibold text-white text-sm">24/7 Towing Services</h3>
            </div>
            <div className="space-y-3">
              {(nearby.towingServices || []).map((t, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-xl text-xs space-y-1.5">
                  <p className="text-white font-semibold">{t.name}</p>
                  <p className="text-slate-400 text-[11px] flex items-center gap-1">
                    <MapPin size={10} /> {t.address} ({t.distanceKm} km)
                  </p>
                  <a
                    href={`tel:${t.phone}`}
                    className="inline-flex items-center gap-1.5 text-amber-400 hover:underline font-bold text-xs pt-1"
                  >
                    <Phone size={12} /> {t.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* 🏥 Hospitals */}
          <div className="glass-card p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Cross size={18} className="text-red-400" />
              <h3 className="font-semibold text-white text-sm">Nearest Hospitals</h3>
            </div>
            <div className="space-y-3">
              {(nearby.hospitals || []).map((h, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-xl text-xs space-y-1.5">
                  <p className="text-white font-semibold">{h.name}</p>
                  <p className="text-slate-400 text-[11px] flex items-center gap-1">
                    <MapPin size={10} /> {h.address} ({h.distanceKm} km)
                  </p>
                  <a
                    href={`tel:${h.phone}`}
                    className="inline-flex items-center gap-1.5 text-red-400 hover:underline font-bold text-xs pt-1"
                  >
                    <Phone size={12} /> {h.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* 🚓 Police Stations */}
          <div className="glass-card p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-brand-400" />
              <h3 className="font-semibold text-white text-sm">Police Stations</h3>
            </div>
            <div className="space-y-3">
              {(nearby.policeStations || []).map((p, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-xl text-xs space-y-1.5">
                  <p className="text-white font-semibold">{p.name}</p>
                  <p className="text-slate-400 text-[11px] flex items-center gap-1">
                    <MapPin size={10} /> {p.address} ({p.distanceKm} km)
                  </p>
                  <a
                    href={`tel:${p.phone}`}
                    className="inline-flex items-center gap-1.5 text-brand-400 hover:underline font-bold text-xs pt-1"
                  >
                    <Phone size={12} /> {p.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmergencySOSPage;
