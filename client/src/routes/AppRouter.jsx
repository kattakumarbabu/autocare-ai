import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import PrivateRoute   from './PrivateRoute';
import ErrorBoundary  from '../components/common/ErrorBoundary';
import { Loader2 }    from 'lucide-react';

import MainLayout      from '../layouts/MainLayout';
import AuthLayout      from '../layouts/AuthLayout';
import Home            from '../pages/Home';
import Login           from '../pages/Login';
import Register        from '../pages/Register';
import ForgotPassword  from '../pages/ForgotPassword';

import Dashboard       from '../pages/Dashboard';
import MyVehicles      from '../pages/vehicles/MyVehicles';
import AddVehicle      from '../pages/vehicles/AddVehicle';
import EditVehicle     from '../pages/vehicles/EditVehicle';
import VehicleDetails  from '../pages/vehicles/VehicleDetails';

import AllServices     from '../pages/services/AllServices';
import ServiceHistory  from '../pages/services/ServiceHistory';
import AddService      from '../pages/services/AddService';
import EditService     from '../pages/services/EditService';
import ServiceDetails  from '../pages/services/ServiceDetails';

import RemindersPage   from '../pages/reminders/RemindersPage';

import FuelTrackerPage from '../pages/fuel/FuelTrackerPage';
import AddFuelEntry    from '../pages/fuel/AddFuelEntry';
import EditFuelEntry   from '../pages/fuel/EditFuelEntry';
import FuelEntryDetails from '../pages/fuel/FuelEntryDetails';

import ExpensesPage    from '../pages/expenses/ExpensesPage';
import AddExpense      from '../pages/expenses/AddExpense';
import EditExpense     from '../pages/expenses/EditExpense';
import ExpenseDetails  from '../pages/expenses/ExpenseDetails';

import DocumentsPage   from '../pages/documents/DocumentsPage';
import UploadDocument  from '../pages/documents/UploadDocument';
import EditDocument    from '../pages/documents/EditDocument';
import DocumentDetails from '../pages/documents/DocumentDetails';

import ServiceCenterLocatorPage from '../pages/serviceCenters/ServiceCenterLocatorPage';
import ServiceCenterDetailsPage from '../pages/serviceCenters/ServiceCenterDetailsPage';

import AIAssistantPage from '../pages/ai/AIAssistantPage';
import PredictiveAIDashboard from '../pages/predictive/PredictiveAIDashboard';

import MyAppointments    from '../pages/appointments/MyAppointments';
import BookAppointment   from '../pages/appointments/BookAppointment';
import AppointmentDetails from '../pages/appointments/AppointmentDetails';
import MechanicProfile   from '../pages/appointments/MechanicProfile';
import MechanicDashboard from '../pages/appointments/MechanicDashboard';

import VehicleDigitalTwinPage from '../pages/digitalTwin/VehicleDigitalTwinPage';
import ResalePredictionPage   from '../pages/resale/ResalePredictionPage';
import VehiclePerformanceReportPage from '../pages/performance/VehiclePerformanceReportPage';
import AdvancedAnalyticsDashboard   from '../pages/analytics/AdvancedAnalyticsDashboard';
import EmergencySOSPage            from '../pages/emergency/EmergencySOSPage';

import ProfilePage     from '../pages/profile/ProfilePage';
import SettingsPage    from '../pages/settings/SettingsPage';

const LoadingFallback = () => (
  <div className="min-h-screen bg-surface-950 flex items-center justify-center">
    <Loader2 size={32} className="animate-spin text-brand-500" />
  </div>
);

const AppRouter = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* ── Public landing page ── */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
            </Route>

            {/* ── Auth pages ── */}
            <Route element={<AuthLayout />}>
              <Route path="/login"           element={<Login />} />
              <Route path="/register"        element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* ── Protected App Routes (inside MainLayout with Sidebar & Breadcrumbs) ── */}
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard font"              element={<Dashboard />} />
                <Route path="/dashboard"                   element={<Dashboard />} />
                <Route path="/emergency-sos"               element={<EmergencySOSPage />} />
                <Route path="/analytics"                   element={<AdvancedAnalyticsDashboard />} />
                <Route path="/vehicles"                    element={<MyVehicles />} />
                <Route path="/vehicles/add"                element={<AddVehicle />} />
                <Route path="/vehicles/:id"                element={<VehicleDetails />} />
                <Route path="/vehicles/:id/edit"           element={<EditVehicle />} />
                <Route path="/vehicles/:id/digital-twin"   element={<VehicleDigitalTwinPage />} />
                <Route path="/vehicles/:id/resale-prediction" element={<ResalePredictionPage />} />
                <Route path="/vehicles/:id/performance-report" element={<VehiclePerformanceReportPage />} />

                {/* Service History routes */}
                <Route path="/services"                    element={<AllServices />} />
                <Route path="/vehicles/:vehicleId/services"     element={<ServiceHistory />} />
                <Route path="/vehicles/:vehicleId/services/add" element={<AddService />} />
                <Route path="/services/add"                element={<AddService />} />
                <Route path="/services/:id"                element={<ServiceDetails />} />
                <Route path="/services/:id/edit"           element={<EditService />} />

                {/* Smart Reminders route */}
                <Route path="/reminders"                   element={<RemindersPage />} />

                {/* Fuel & Mileage Tracker routes */}
                <Route path="/fuel"                        element={<FuelTrackerPage />} />
                <Route path="/fuel/add"                    element={<AddFuelEntry />} />
                <Route path="/fuel/:id"                    element={<FuelEntryDetails />} />
                <Route path="/fuel/:id/edit"               element={<EditFuelEntry />} />

                {/* Expense Analytics routes */}
                <Route path="/expenses"                    element={<ExpensesPage />} />
                <Route path="/expenses/add"                element={<AddExpense />} />
                <Route path="/expenses/:id"                element={<ExpenseDetails />} />
                <Route path="/expenses/:id/edit"           element={<EditExpense />} />

                {/* Digital Document Vault routes */}
                <Route path="/documents"                   element={<DocumentsPage />} />
                <Route path="/documents/upload"            element={<UploadDocument />} />
                <Route path="/documents/:id"               element={<DocumentDetails />} />
                <Route path="/documents/:id/edit"          element={<EditDocument />} />

                {/* Smart Service Center Locator routes */}
                <Route path="/service-centers"             element={<ServiceCenterLocatorPage />} />
                <Route path="/service-centers/:id"         element={<ServiceCenterDetailsPage />} />

                {/* AI Predictive Intelligence & Assistant routes */}
                <Route path="/ai-assistant"                element={<AIAssistantPage />} />
                <Route path="/predictive-ai"               element={<PredictiveAIDashboard />} />

                {/* Service Appointment & Mechanic routes */}
                <Route path="/appointments"                element={<MyAppointments />} />
                <Route path="/appointments/book"           element={<BookAppointment />} />
                <Route path="/appointments/:id"            element={<AppointmentDetails />} />
                <Route path="/appointments/mechanics/:id"  element={<MechanicProfile />} />
                <Route path="/appointments/mechanic-dashboard" element={<MechanicDashboard />} />

                {/* Additional Modules */}
                <Route path="/profile"                     element={<ProfilePage />} />
                <Route path="/settings"                    element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default AppRouter;
