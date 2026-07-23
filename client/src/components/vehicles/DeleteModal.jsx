import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const DeleteModal = ({ vehicle, onConfirm, onCancel, loading }) => {
  const cancelRef = useRef(null);

  // Focus cancel button on open, trap keyboard
  useEffect(() => {
    cancelRef.current?.focus();
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  if (!vehicle) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="glass-card w-full max-w-md p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={22} className="text-red-400" />
            </div>
            <div>
              <h2 id="delete-modal-title" className="font-semibold text-white text-lg">
                Delete Vehicle
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 mb-6">
          <p className="text-white font-medium text-sm mb-1">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">
            {vehicle.registrationNumber}
          </p>
        </div>

        <p className="text-slate-300 text-sm mb-6">
          Are you sure you want to permanently delete this vehicle? All associated data,
          including service history and reminders, will be removed.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={loading}
            className="btn-ghost flex-1 py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(vehicle._id)}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
            {loading ? 'Deleting…' : 'Delete Vehicle'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
