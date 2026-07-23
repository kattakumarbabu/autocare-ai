import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { serviceCenterApi } from '../../api/serviceCenterApi';
import {
  MapPin, Navigation, Phone, Star, Search, SlidersHorizontal,
  Wrench, Fuel, Zap, Truck, ShieldCheck, Loader2, ChevronRight,
  Eye, CheckCircle2, Locate, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_PILLS = [
  { id: '',               label: 'All Nearby',       icon: MapPin  },
  { id: 'Service Center', label: 'Service Centers',  icon: Wrench  },
  { id: 'Fuel Station',   label: 'Fuel Stations',    icon: Fuel    },
  { id: 'EV Charging',    label: 'EV Charging',      icon: Zap     },
  { id: 'Towing Service', label: 'Towing Services',  icon: Truck   },
];

const BRANDS = ['Honda', 'Toyota', 'Ford', 'Tesla', 'Hyundai', 'BMW', 'Tata', 'MG'];

const ServiceCenterLocatorPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [centers,      setCenters]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [userLoc,      setUserLoc]      = useState({ lat: 28.6139, lng: 77.209, isCustom: false });
  const [selectedDoc,  setSelectedDoc]  = useState(null);

  const category = searchParams.get('category') || '';
  const brand    = searchParams.get('brand')    || '';
  const search   = searchParams.get('search')   || '';

  // Get user location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast.loading('Detecting your location…', { id: 'geo' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isCustom: true,
        });
        toast.success('Location updated!', { id: 'geo' });
      },
      () => {
        toast.error('Could not fetch location. Using default city center.', { id: 'geo' });
      }
    );
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await serviceCenterApi.getNearby({
        lat: userLoc.lat,
        lng: userLoc.lng,
        radius: 100,
        category,
        brand,
        search,
      });
      const list = data.data.serviceCenters;
      setCenters(list);
      if (list.length > 0) setSelectedDoc(list[0]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load service centers');
    } finally {
      setLoading(false);
    }
  }, [userLoc, category, brand, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Smart Service Center Locator</h1>
            <p className="text-slate-400 text-sm mt-1">
              Find nearby authorized service hubs, 24/7 towing, EV fast chargers, and fuel stations
            </p>
          </div>

          <button
            onClick={handleDetectLocation}
            className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5 self-start sm:self-auto"
            id="detect-loc-btn"
          >
            <Locate size={15} /> {userLoc.isCustom ? 'Location Detected' : 'Use My Current Location'}
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none animate-slide-up">
          {CATEGORY_PILLS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setParam('category', id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                category === id
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search station name, address, or services…"
              value={search}
              onChange={(e) => setParam('search', e.target.value)}
              className="input-field pl-10 w-full"
              id="locator-search-input"
            />
          </div>

          <select
            value={brand}
            onChange={(e) => setParam('brand', e.target.value)}
            className="input-field appearance-none cursor-pointer min-w-[170px]"
            id="locator-brand-filter"
          >
            <option value="" className="bg-surface-900">All Supported Brands</option>
            {BRANDS.map((b) => (
              <option key={b} value={b} className="bg-surface-900">{b}</option>
            ))}
          </select>
        </div>

        {/* Split View: Interactive Map & Nearby List */}
        <div className="grid lg:grid-cols-12 gap-6 animate-fade-in">

          {/* Left Column: Nearby List */}
          <div className="lg:col-span-5 space-y-4 max-h-[620px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={32} className="animate-spin text-brand-500" />
              </div>
            ) : centers.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <MapPin size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-white font-medium text-sm">No Stations Found</p>
                <p className="text-slate-400 text-xs mt-1">Try clearing your search filters or expanding your search radius.</p>
              </div>
            ) : (
              centers.map((item) => {
                const isSelected = selectedDoc?._id === item._id;
                const mapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`;

                return (
                  <div
                    key={item._id}
                    onClick={() => setSelectedDoc(item)}
                    className={`glass-card p-5 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-brand-500/60 bg-brand-500/10 shadow-glow'
                        : 'hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                          {item.category}
                        </span>
                        <h3 className="font-semibold text-white text-base mt-1.5 leading-snug">{item.name}</h3>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex-shrink-0">
                        {item.distanceKm} km away
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs flex items-start gap-1 mb-3">
                      <MapPin size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{item.address}</span>
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-300 mb-4 flex-wrap">
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Star size={13} fill="currentColor" /> {item.ratings}
                      </span>
                      {item.emergencySupport && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          ✓ 24/7 Roadside Assistance
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <Link
                        to={`/service-centers/${item._id}`}
                        className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                      >
                        <Eye size={13} /> View Details
                      </Link>

                      <div className="flex items-center gap-2">
                        {item.phone && (
                          <a
                            href={`tel:${item.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1"
                            title="Call Station"
                          >
                            <Phone size={13} /> Call
                          </a>
                        )}
                        <a
                          href={mapsDirUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                        >
                          <Navigation size={13} /> Directions
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Google Maps Location Iframe View */}
          <div className="lg:col-span-7">
            <div className="glass-card p-4 h-[620px] flex flex-col">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <MapPin size={15} className="text-brand-400" />
                  {selectedDoc ? selectedDoc.name : 'Select a station'}
                </span>
                {selectedDoc && (
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {selectedDoc.distanceKm} km
                  </span>
                )}
              </div>

              <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-surface-900">
                {selectedDoc ? (
                  <iframe
                    title="Interactive Map View"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://maps.google.com/maps?q=${selectedDoc.latitude},${selectedDoc.longitude}&z=14&output=embed`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                    Select a service center from the list to preview on map
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCenterLocatorPage;
