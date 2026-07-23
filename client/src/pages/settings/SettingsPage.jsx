import { useState } from 'react';
import { Settings, Bell, Lock, Shield, Moon, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts]     = useState(true);
  const [remindDays, setRemindDays]   = useState('7');

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-white">Account Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Configure notifications, security, and application preferences</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Notifications */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-semibold text-white text-base flex items-center gap-2">
              <Bell size={18} className="text-brand-400" /> Notification Preferences
            </h2>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="text-white text-sm font-medium">Email Expiry & Service Alerts</p>
                <p className="text-slate-400 text-xs">Receive email reminders for service due and document expiries</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="accent-brand-500 w-4 h-4 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <div>
                <p className="text-white text-sm font-medium">SMS & Urgent Notifications</p>
                <p className="text-slate-400 text-xs">Receive high priority SMS alerts for overdue maintenance</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="accent-brand-500 w-4 h-4 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="form-label">Advance Reminder Alert (Days in advance)</label>
              <select
                value={remindDays}
                onChange={(e) => setRemindDays(e.target.value)}
                className="input-field appearance-none cursor-pointer w-full"
              >
                <option value="3" className="bg-surface-900">3 Days Before</option>
                <option value="7" className="bg-surface-900">7 Days Before</option>
                <option value="14" className="bg-surface-900">14 Days Before</option>
                <option value="30" className="bg-surface-900">30 Days Before</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary py-2.5 px-6 text-sm">
              <Save size={15} /> Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
