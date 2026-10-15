import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationProvider, useNav, AppRoute } from './context/NavigationContext';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AuthPage } from './pages/AuthPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

// Primary Pages
import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { DisposalRequestsPage } from './pages/DisposalRequestsPage';
import { DataWipingPage } from './pages/DataWipingPage';
import { VerificationPage } from './pages/VerificationPage';
import { CompliancePage } from './pages/CompliancePage';
import { CertificatesPage } from './pages/CertificatesPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';

// Secondary / Detail Pages
import { AssetDetailPage } from './pages/AssetDetailPage';
import { DisposalRequestCreatePage } from './pages/DisposalRequestCreatePage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { CertificateDetailPage } from './pages/CertificateDetailPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Modals
import { AssetModal } from './components/modals/AssetModal';
import { DisposalRequestModal } from './components/modals/DisposalRequestModal';
import { WipingModal } from './components/modals/WipingModal';
import { CertificateModal } from './components/modals/CertificateModal';

import { ITAsset, CertificateOfDestruction } from './types';

const AppContent: React.FC = () => {
  const {
    assets,
    certificates,
    generateCertificate,
    isAuthenticated,
    hasPermission,
    currentUser,
    completeGoogleLogin,
  } = useApp();
  const { currentPage, navigate } = useNav();
  const isAdminUser = currentUser.role === 'Admin';
  const [oauthStatus, setOAuthStatus] = useState('Completing Google sign-in...');

  useEffect(() => {
    if (!window.location.hash.startsWith('#/oauth/callback')) return;

    const queryIndex = window.location.hash.indexOf('?');
    const params = new URLSearchParams(queryIndex >= 0 ? window.location.hash.slice(queryIndex + 1) : '');
    const token = params.get('token');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    if (!token) {
      setOAuthStatus('Google sign-in did not return a session. Please try again.');
      return;
    }

    void completeGoogleLogin(token).then((result) => {
      if (!result.ok) setOAuthStatus(result.message || 'Unable to complete Google sign-in.');
    });
  }, [completeGoogleLogin]);

  // Modal control states for creation & quick actions
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<ITAsset | null>(null);

  const [disposalModalAsset, setDisposalModalAsset] = useState<ITAsset | null>(null);
  const [wipingModalAsset, setWipingModalAsset] = useState<ITAsset | null>(null);

  const [selectedCertificate, setSelectedCertificate] = useState<CertificateOfDestruction | null>(null);
  const [certificateAsset, setCertificateAsset] = useState<ITAsset | null>(null);

  // Asset selection handler -> navigates to dedicated AssetDetailPage
  const handleSelectAsset = (asset: ITAsset) => {
    navigate('asset-details', { assetId: asset.id }, `Asset ${asset.id}`);
  };

  const handleOpenAddAsset = () => {
    setAssetToEdit(null);
    setIsAssetModalOpen(true);
  };

  const handleOpenEditAsset = (asset: ITAsset) => {
    setAssetToEdit(asset);
    setIsAssetModalOpen(true);
  };

  const handleRequestDisposal = (asset: ITAsset) => {
    navigate('disposal-request', { assetId: asset.id }, `Request Disposal ${asset.id}`);
  };

  const handleOpenWiping = (asset: ITAsset) => {
    setWipingModalAsset(asset);
  };

  const handleViewCertificate = (certId: string) => {
    navigate('certificate-details', { certificateId: certId }, `Certificate ${certId}`);
  };

  const handleGenerateCertificate = async (asset: ITAsset) => {
    try {
      const newCert = await generateCertificate(asset.id);
      navigate('certificate-details', { certificateId: newCert.certificateId }, `Certificate ${newCert.certificateId}`);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuthenticated) {
    if (window.location.hash.startsWith('#/oauth/callback')) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <p role="status" className="text-sm text-slate-300">{oauthStatus}</p>
        </div>
      );
    }
    if (window.location.pathname === '/admin/login') return <AdminLoginPage />;
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Fixed Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page: AppRoute) => navigate(page)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          onNavigate={(page: AppRoute) => navigate(page)}
          onSelectAsset={handleSelectAsset}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentPage === 'dashboard' && (
              isAdminUser ? (
                <DashboardPage
                  onNavigate={(page: PageId) => navigate(page)}
                  onSelectAsset={handleSelectAsset}
                  onOpenNewAssetModal={handleOpenAddAsset}
                />
              ) : currentUser.role === 'User' ? (
                <UserDashboardPage
                  onSelectAsset={handleSelectAsset}
                  onOpenNewAssetModal={handleOpenAddAsset}
                />
              ) : (
                <UnauthorizedPage requiredRole="Administrator" attemptedPage="Admin Dashboard" />
              )
            )}

            {currentPage === 'profile' && <UserProfilePage />}

            {currentPage === 'assets' && (
              <AssetsPage
                onSelectAsset={handleSelectAsset}
                onEditAsset={handleOpenEditAsset}
                onRequestDisposal={handleRequestDisposal}
                onOpenNewAssetModal={handleOpenAddAsset}
              />
            )}

            {currentPage === 'asset-details' && <AssetDetailPage />}

            {currentPage === 'disposal-requests' && (
              <DisposalRequestsPage
                onSelectAsset={handleSelectAsset}
                onRequestDisposalNew={() => navigate('disposal-request')}
              />
            )}

            {currentPage === 'disposal-request' && <DisposalRequestCreatePage />}

            {currentPage === 'data-wiping' && (
              hasPermission(['Admin', 'IT Technician']) ? (
                <DataWipingPage
                  onSelectAsset={handleSelectAsset}
                  onOpenWipingModal={handleOpenWiping}
                />
              ) : (
                <UnauthorizedPage requiredRole="Administrator or IT Technician" attemptedPage="Data Wiping Station" />
              )
            )}

            {currentPage === 'verification' && (
              hasPermission(['Admin', 'Compliance Officer']) ? (
                <VerificationPage
                  onSelectAsset={handleSelectAsset}
                  onOpenWipingModal={handleOpenWiping}
                />
              ) : (
                <UnauthorizedPage requiredRole="Administrator or Verification Officer" attemptedPage="Sanitization Verification" />
              )
            )}

            {currentPage === 'compliance' && (
              hasPermission(['Admin', 'Compliance Officer', 'Auditor']) ? (
                <CompliancePage
                  onSelectAsset={handleSelectAsset}
                  onGenerateCertificate={handleGenerateCertificate}
                />
              ) : (
                <UnauthorizedPage requiredRole="Administrator or Compliance Officer" attemptedPage="Compliance Matrix" />
              )
            )}

            {currentPage === 'certificates' && (
              <CertificatesPage
                onViewCertificateModal={(cert, match) => {
                  setSelectedCertificate(cert);
                  setCertificateAsset(match || null);
                }}
                onSelectAsset={handleSelectAsset}
              />
            )}

            {currentPage === 'certificate-details' && <CertificateDetailPage />}

            {currentPage === 'audit-logs' && (
              hasPermission(['Admin', 'Auditor', 'Compliance Officer']) ? (
                <AuditLogsPage />
              ) : (
                <UnauthorizedPage requiredRole="Administrator or Auditor" attemptedPage="Audit Logs Ledger" />
              )
            )}

            {currentPage === 'reports' && (
              hasPermission(['Admin', 'Auditor', 'Manager', 'Compliance Officer']) ? (
                <ReportsPage />
              ) : (
                <UnauthorizedPage requiredRole="Administrator or Manager" attemptedPage="Executive Reports" />
              )
            )}

            {currentPage === 'report-details' && <ReportDetailPage />}

            {currentPage === 'ai-assistant' && (
              <AIAssistantPage onSelectAsset={handleSelectAsset} />
            )}

            {currentPage === 'notifications' && (
              <NotificationsPage onNavigate={(page: PageId) => navigate(page)} />
            )}

            {currentPage === 'user-management' && (
              isAdminUser ? (
                <UserManagementPage />
              ) : (
                <UnauthorizedPage requiredRole="Administrator" attemptedPage="Personnel & RBAC Directory" />
              )
            )}

            {currentPage === 'settings' && (
              isAdminUser ? (
                <SettingsPage />
              ) : (
                <UnauthorizedPage requiredRole="Administrator" attemptedPage="Platform Governance Settings" />
              )
            )}
          </div>
        </main>
      </div>

      {/* Global Interactive Quick Modals */}
      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => {
          setIsAssetModalOpen(false);
          setAssetToEdit(null);
        }}
        assetToEdit={assetToEdit}
      />

      <DisposalRequestModal
        isOpen={!!disposalModalAsset}
        onClose={() => setDisposalModalAsset(null)}
        asset={disposalModalAsset}
      />

      <WipingModal
        isOpen={!!wipingModalAsset}
        onClose={() => setWipingModalAsset(null)}
        asset={wipingModalAsset}
      />

      <CertificateModal
        isOpen={!!selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
        certificate={selectedCertificate}
        asset={certificateAsset}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AppProvider>
  );
}
