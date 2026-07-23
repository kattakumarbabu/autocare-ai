import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vehicleApi } from '../../api/vehicleApi';
import { Wrench, Plus, Car, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

const AllServices = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await vehicleApi.getAll({ limit: 100 });
        setVehicles(data.data.vehicles);
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Service History</h1>
            <p className="text-slate-400 text-sm mt-1">Select a vehicle to inspect or log maintenance records</p>
          </div>
          <Link to="/services/add" className="btn-primary">
            <Plus size={18} /> Log Service Record
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12">
            <Car size={36} className="text-slate-600 mx-auto mb-3" />
            <h3 className="font-semibold text-white text-lg mb-2">No Vehicles Registered</h3>
            <p className="text-slate-400 text-sm mb-6">Add your first vehicle before logging service history.</p>
            <Link to="/vehicles/add" className="btn-primary">Add Vehicle</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {vehicles.map((v) => (
              <Link
                key={v._id}
                to={`/vehicles/${v._id}/services`}
                className="glass-card p-5 hover:border-brand-500/30 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-400 flex-shrink-0">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base group-hover:text-brand-300 transition-colors">
                      {v.year} {v.brand} {v.model}
                    </h3>
                    <p className="text-slate-500 text-xs font-mono uppercase">{v.registrationNumber}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllServices;
