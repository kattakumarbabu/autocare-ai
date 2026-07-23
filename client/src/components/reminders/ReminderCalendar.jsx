import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Bell, Wrench, Shield } from 'lucide-react';

const PRIORITY_COLORS = {
  High:   'bg-red-500 text-white',
  Medium: 'bg-amber-500 text-slate-950',
  Low:    'bg-blue-500 text-white',
};

const ReminderCalendar = ({ reminders = [], onComplete, onSnooze }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode,    setViewMode]    = useState('month'); // 'month' | 'week'
  const [selectedDayReminders, setSelectedDayReminders] = useState(null);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper date math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Month navigation
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => setCurrentDate(new Date());

  // Group reminders by date string "YYYY-MM-DD"
  const remindersByDate = useMemo(() => {
    const map = {};
    reminders.forEach((r) => {
      if (!r.dueDate) return;
      const key = new Date(r.dueDate).toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [reminders]);

  // Calendar cells for Month view
  const monthCells = useMemo(() => {
    const cells = [];
    // Blank padding cells for days before start of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }
    // Month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        date: d,
        dayNumber: day,
        dateStr,
        items: remindersByDate[dateStr] || [],
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }
    return cells;
  }, [year, month, firstDayOfWeek, daysInMonth, remindersByDate]);

  // Calendar cells for Week view
  const weekCells = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        date: d,
        dayNumber: d.getDate(),
        dateStr,
        items: remindersByDate[dateStr] || [],
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }
    return cells;
  }, [currentDate, remindersByDate]);

  const activeCells = viewMode === 'month' ? monthCells : weekCells;
  const monthName   = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="glass-card p-5 animate-fade-in">
      {/* Calendar Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-brand-400" />
            {monthName}
          </h2>
          <button
            onClick={handleToday}
            className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-surface-900 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'month' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'week' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Week View
            </button>
          </div>

          {/* Nav buttons */}
          <div className="flex gap-1">
            <button
              onClick={handlePrev}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs font-semibold text-slate-400 border-b border-white/5 pb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Grid */}
      <div className={`grid grid-cols-7 gap-1.5 ${viewMode === 'week' ? 'min-h-[220px]' : 'min-h-[380px]'}`}>
        {activeCells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="bg-white/2 rounded-xl border border-transparent" />;
          }

          const { dayNumber, items, isToday, dateStr } = cell;

          return (
            <div
              key={dateStr}
              onClick={() => { if (items.length > 0) setSelectedDayReminders({ dateStr, items }); }}
              className={`p-1.5 rounded-xl border flex flex-col justify-start transition-all cursor-pointer min-h-[60px] ${
                isToday
                  ? 'bg-brand-500/10 border-brand-500/50'
                  : items.length > 0
                  ? 'bg-white/5 border-white/10 hover:border-brand-500/30'
                  : 'bg-white/2 border-white/5 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-brand-gradient text-white' : 'text-slate-400'
                  }`}
                >
                  {dayNumber}
                </span>
                {items.length > 0 && (
                  <span className="text-[10px] font-bold text-brand-300">
                    {items.length}
                  </span>
                )}
              </div>

              {/* Item Badges */}
              <div className="space-y-1 overflow-hidden">
                {items.slice(0, 2).map((item) => (
                  <div
                    key={item._id}
                    className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                      PRIORITY_COLORS[item.priority] || 'bg-slate-700 text-white'
                    }`}
                    title={item.title}
                  >
                    {item.title}
                  </div>
                ))}
                {items.length > 2 && (
                  <p className="text-[9px] text-slate-400 font-medium pl-1">
                    +{items.length - 2} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Reminders Popover/Drawer */}
      {selectedDayReminders && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedDayReminders(null)}
        >
          <div
            className="glass-card max-w-md w-full p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <CalendarIcon size={16} className="text-brand-400" />
                Reminders on {selectedDayReminders.dateStr}
              </h3>
              <button
                onClick={() => setSelectedDayReminders(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {selectedDayReminders.items.map((r) => (
                <div key={r._id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-white text-sm font-semibold mb-1">{r.title}</p>
                  <p className="text-slate-400 text-xs mb-2">{r.description || 'No description'}</p>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-slate-400">{r.reminderType} • {r.priority} Priority</span>
                    {r.status !== 'Completed' && (
                      <button
                        onClick={() => {
                          onComplete(r._id);
                          setSelectedDayReminders(null);
                        }}
                        className="text-emerald-400 hover:underline text-xs font-semibold"
                      >
                        ✓ Mark Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderCalendar;
