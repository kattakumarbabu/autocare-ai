import { useState, useEffect } from 'react';
import { Download, WifiOff, Bell, X, Smartphone, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const InstallPWABanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner,     setShowBanner]     = useState(false);
  const [isOffline,      setIsOffline]      = useState(!navigator.onLine);
  const [notifGranted,   setNotifGranted]   = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for online / offline status
    const handleOnline  = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('AutoCare AI installed on your device!');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleEnablePushNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifGranted(true);
      toast.success('Push Notifications enabled for maintenance reminders!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 space-y-2">
      {/* Offline Status Toast Banner */}
      {isOffline && (
        <div className="glass-card p-3.5 bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 shadow-xl animate-bounce">
          <div className="flex items-center gap-2">
            <WifiOff size={16} className="text-amber-400" />
            <span><b>Offline Mode Active</b> — Cached telemetry available</span>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {showBanner && deferredPrompt && (
        <div className="glass-card p-4 border border-brand-500/30 bg-surface-900 shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="text-white font-semibold text-xs">Install AutoCare AI App</p>
              <p className="text-slate-400 text-[11px]">Install on Phone for offline access & instant SOS</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Download size={13} /> Install
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1.5 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Push Notification Enable Chip */}
      {!notifGranted && (
        <div className="glass-card p-3 bg-surface-900/90 border border-white/10 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-brand-400" />
            <span>Enable Push Notifications for expiry alerts</span>
          </div>
          <button
            onClick={handleEnablePushNotifications}
            className="text-brand-400 font-semibold hover:underline"
          >
            Enable
          </button>
        </div>
      )}
    </div>
  );
};

export default InstallPWABanner;
