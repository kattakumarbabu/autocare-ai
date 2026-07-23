import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Wrench, Shield, FileText, CheckCircle2, Clock,
  Calendar, Trash2, RotateCcw, AlertTriangle, ChevronDown, Car, Sparkles,
} from 'lucide-react';

const PRIORITY_BADGES = {
  High:   'bg-red-500/10 text-red-400 border-red-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Low:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const TYPE_ICONS = {
  Service:   Wrench,
  Insurance: Shield,
  PUC:       FileText,
  Warranty:  Sparkles,
  Custom:    Bell,
};

const daysLeft = (d) => {
  if (!d) return null;
  const now = new Date();
  const target = new Date(d);
  const diffTime = target.setHours(0,0,0,0) - now.setHours(0,0,0,0);
  return Math.round(diffTime / (24 * 60 * 60 * 1000));
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ReminderCard = ({ reminder, onComplete, onSnooze, onRestore, onDelete }) => {
  const [snoozeOpen, setSnoozeOpen] = useState(false);

  const {
    _id, title, description, reminderType = 'Custom', dueDate,
    status, priority = 'Medium', isRecurring, recurringInterval, vehicle,
  } = reminder;

  const TypeIcon = TYPE_ICONS[reminderType] || Bell;
  const days = daysLeft(dueDate);
  const isCompleted = status === 'Completed';
  const isOverdue   = status === 'Overdue' || (days !== null && days < 0 && !isCompleted);

  return (
    <div
      className={`glass-card p-4 transition-all duration-200 flex flex-col justify-between ${
        isCompleted
          ? 'opacity-65 border-white/5 bg-white/2'
          : isOverdue
          ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
          : 'hover:border-brand-500/30'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
              <TypeIcon size={11} className="text-brand-400" /> {reminderType}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_BADGES[priority] || PRIORITY_BADGES.Medium}`}>
              {priority} Priority
            </span>
            {isRecurring && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                ↻ {recurringInterval || 'Recurring'}
              </span>
            )}
          </div>

          {/* Status Badge */}
          {isCompleted ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 size={10} /> Completed
            </span>
          ) : isOverdue ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse-slow">
              <AlertTriangle size={10} /> Overdue
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Pending
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className={`font-semibold text-base mb-1 ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
          {title}
        </h3>
        {description && (
          <p className="text-slate-400 text-xs mb-3 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Vehicle Reference */}
        {vehicle && (
          <Link
            to={`/vehicles/${vehicle._id}`}
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 mb-3 font-mono"
          >
            <Car size={11} /> {vehicle.year} {vehicle.brand} {vehicle.model} ({vehicle.registrationNumber})
          </Link>
        )}
      </div>

      {/* Footer & Due Date */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar size={12} className={isOverdue ? 'text-red-400' : 'text-slate-500'} />
          <span className={isOverdue ? 'text-red-400 font-semibold' : 'text-slate-300'}>
            {fmtDate(dueDate)}
          </span>
          {!isCompleted && days !== null && (
            <span className={`text-[11px] font-medium ml-1 ${days < 0 ? 'text-red-400' : days === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
              ({days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? 'Due Today' : `in ${days}d`})
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {!isCompleted ? (
            <>
              {/* Complete Button */}
              <button
                onClick={() => onComplete(_id)}
                className="btn-primary py-1.5 px-3 text-xs"
                title="Mark Completed"
              >
                <CheckCircle2 size={12} /> Complete
              </button>

              {/* Snooze Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSnoozeOpen(!snoozeOpen)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10 text-xs flex items-center gap-1 transition-colors"
                  title="Snooze Reminder"
                >
                  <Clock size={12} /> <ChevronDown size={10} />
                </button>
                {snoozeOpen && (
                  <div className="absolute right-0 bottom-full mb-1 w-28 bg-surface-900 border border-white/10 rounded-xl shadow-xl z-20 py-1 text-xs animate-fade-in">
                    <p className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 border-b border-white/5">
                      Snooze for…
                    </p>
                    {[1, 3, 7, 14].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          onSnooze(_id, d);
                          setSnoozeOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                      >
                        +{d} Day{d > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Restore Button */
            <button
              onClick={() => onRestore(_id)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 text-xs flex items-center gap-1 transition-colors"
              title="Restore to Active"
            >
              <RotateCcw size={12} /> Restore
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={() => onDelete(_id)}
            className="p-1.5 rounded-lg bg-red-500/5 text-red-400 hover:bg-red-500/15 border border-red-500/20 transition-colors"
            title="Delete Reminder"
            aria-label="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderCard;
