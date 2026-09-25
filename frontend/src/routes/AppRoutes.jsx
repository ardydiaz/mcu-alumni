import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import ProtectedRoute, { FullPageLoader } from './ProtectedRoute.jsx';

import Home from '../pages/public/Home.jsx';
import Give from '../pages/public/Give.jsx';
import SupportCentralino from '../pages/public/SupportCentralino.jsx';
import CampusDevelopment from '../pages/public/CampusDevelopment.jsx';
import Volunteer from '../pages/public/Volunteer.jsx';
import MerchantPartners from '../pages/public/MerchantPartners.jsx';
import IndustryPartners from '../pages/public/IndustryPartners.jsx';
import Networks from '../pages/public/Networks.jsx';
import TransparencyReports from '../pages/public/TransparencyReports.jsx';
import ContactUpdate from '../pages/public/ContactUpdate.jsx';
import GraduateTracer from '../pages/public/GraduateTracer.jsx';
import NotFound from '../pages/public/NotFound.jsx';

// Admin and auth screens load on demand so public visitors never download them.
const AuthLayout = lazy(() => import('../layouts/AuthLayout.jsx'));
const AdminLayout = lazy(() => import('../layouts/AdminLayout.jsx'));
const Login = lazy(() => import('../pages/auth/Login.jsx'));
const M365Callback = lazy(() => import('../pages/auth/M365Callback.jsx'));
const Dashboard = lazy(() => import('../pages/admin/Dashboard.jsx'));
const Categories = lazy(() => import('../pages/admin/Categories.jsx'));
const Donations = lazy(() => import('../pages/admin/Donations.jsx'));
const Scholars = lazy(() => import('../pages/admin/Scholars.jsx'));
const AdminNetworks = lazy(() => import('../pages/admin/Networks.jsx'));
const Partners = lazy(() => import('../pages/admin/Partners.jsx'));
const Projects = lazy(() => import('../pages/admin/Projects.jsx'));
const Reports = lazy(() => import('../pages/admin/Reports.jsx'));
const Alumni = lazy(() => import('../pages/admin/Alumni.jsx'));
const Tracer = lazy(() => import('../pages/admin/Tracer.jsx'));
const Volunteers = lazy(() => import('../pages/admin/Volunteers.jsx'));
const Messages = lazy(() => import('../pages/admin/Messages.jsx'));
const Users = lazy(() => import('../pages/admin/Users.jsx'));
const Roles = lazy(() => import('../pages/admin/Roles.jsx'));
const Logs = lazy(() => import('../pages/admin/Logs.jsx'));
const Profile = lazy(() => import('../pages/admin/Profile.jsx'));

const superAdminOnly = (element) => <ProtectedRoute roles={['Super Admin']}>{element}</ProtectedRoute>;

export default function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="give" element={<Give />} />
          <Route path="support-a-centralino" element={<SupportCentralino />} />
          <Route path="campus-development" element={<CampusDevelopment />} />
          <Route path="volunteer" element={<Volunteer />} />
          <Route path="merchant-partners" element={<MerchantPartners />} />
          <Route path="industry-partners" element={<IndustryPartners />} />
          <Route path="networks" element={<Networks />} />
          <Route path="transparency-reports" element={<TransparencyReports />} />
          <Route path="alumni-contact-update" element={<ContactUpdate />} />
          <Route path="graduate-tracer" element={<GraduateTracer />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Staff sign-in */}
        <Route element={<AuthLayout />}>
          <Route path="admin/login" element={<Login />} />
          <Route path="admin/login/callback" element={<M365Callback />} />
        </Route>

        {/* Admin panel (admin + staff) */}
        <Route path="admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="donations" element={<Donations />} />
          <Route path="scholars" element={<Scholars />} />
          <Route path="networks" element={<AdminNetworks />} />
          <Route path="partners" element={<Partners />} />
          <Route path="projects" element={<Projects />} />
          <Route path="reports" element={<Reports />} />
          <Route path="alumni" element={<Alumni />} />
          <Route path="tracer" element={<Tracer />} />
          <Route path="volunteers" element={<Volunteers />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<Profile />} />
          <Route path="users" element={superAdminOnly(<Users />)} />
          <Route path="roles" element={superAdminOnly(<Roles />)} />
          <Route path="logs" element={superAdminOnly(<Logs />)} />
          <Route path="*" element={<div className="admin-empty"><h2>Page not found</h2></div>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
