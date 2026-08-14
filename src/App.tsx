import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { PricingPage } from './pages/PricingPage';

import { DashboardPage } from './pages/DashboardPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { EarnPage } from './pages/EarnPage';
import { PromotePage } from './pages/PromotePage';
import { PromotionsListPage } from './pages/PromotionsListPage';
import { PromotionDetailPage } from './pages/PromotionDetailPage';
import { CreatorsDirectoryPage } from './pages/CreatorsDirectoryPage';
import { CreatorProfilePage } from './pages/CreatorProfilePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { WalletPage } from './pages/WalletPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

import {
  TermsPage,
  PrivacyPage,
  RefundPage,
  CommunityGuidelinesPage,
  ContactPage,
  AccountDeletionPage,
} from './pages/LegalPages';


// Protected Route Guard
const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wide">Loading SubLoop...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Public Only Route Guard (Redirect logged-in users to /dashboard)
const PublicOnlyRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wide">Loading SubLoop...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

import { OffersPage } from './pages/OffersPage';
import { useOnboardingTour } from './components/OnboardingWalkthrough';

// Main Layout Wrapper
const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Non-intrusive onboarding tour hook for new users
  useOnboardingTour();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-yellow-400 selection:text-slate-900">
      {/* Top Navbar */}
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Container */}
      <div className="flex flex-1 relative">
        {/* Sidebar for authenticated creators */}
        {user && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Dynamic Page Content */}
        <main
          className={`flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 transition-all ${
            user ? 'lg:pl-72 pb-24 lg:pb-12' : 'pb-12'
          }`}
        >
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {user && <MobileNav />}

      {/* Global Footer (Visible on public/landing pages or bottom) */}
      {!user && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/refund" element={<RefundPage />} />
              <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/account-deletion" element={<AccountDeletionPage />} />


              {/* Guest Only Routes */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>

              {/* Protected Creator Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/earn" element={<EarnPage />} />
                <Route path="/promote" element={<PromotePage />} />
                <Route path="/campaigns" element={<PromotePage />} />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/promotions" element={<PromotionsListPage />} />
                <Route path="/promotions/:id" element={<PromotionDetailPage />} />
                <Route path="/creators" element={<CreatorsDirectoryPage />} />
                <Route path="/creators/:username" element={<CreatorProfilePage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
