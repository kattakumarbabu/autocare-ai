import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_NAME_MAP = {
  dashboard:    'Dashboard',
  vehicles:     'My Vehicles',
  add:          'Add New',
  edit:         'Edit',
  services:     'Service History',
  reminders:    'Smart Reminders',
  fuel:         'Fuel Tracker',
  expenses:     'Expense Manager',
  documents:    'Document Vault',
  'ai-assistant': 'AI Assistant',
  profile:      'User Profile',
  settings:     'Account Settings',
};

const Breadcrumbs = () => {
  const location = useLocation();

  // Don't render breadcrumbs on home landing page or auth pages
  if (
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password'
  ) {
    return null;
  }

  const pathnames = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="bg-surface-900/50 border-b border-white/5 px-4 sm:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-400">
        {/* Home / Dashboard Root Link */}
        <Link
          to="/dashboard"
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Dashboard"
        >
          <Home size={13} className="text-brand-400" />
          <span>Home</span>
        </Link>

        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;

          // Check if value is a 24-character Mongo ID or hash
          const isMongoId = /^[0-9a-fA-F]{24}$/.test(value);
          let label = ROUTE_NAME_MAP[value] || value;
          if (isMongoId) {
            label = `Item #${value.slice(-6)}`;
          }

          return (
            <div key={to} className="flex items-center gap-2">
              <ChevronRight size={12} className="text-slate-600 flex-shrink-0" />
              {isLast ? (
                <span className="text-white font-medium capitalize truncate max-w-[180px]">
                  {label}
                </span>
              ) : (
                <Link
                  to={to}
                  className="hover:text-white transition-colors capitalize truncate max-w-[120px]"
                >
                  {label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default Breadcrumbs;
