import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationProvider, useNav, AppRoute } from './context/NavigationContext';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

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

// Modals
import { AssetModal } from './components/modals/AssetModal';
import { DisposalRequestModal } from './components/modals/DisposalRequestModal';
import { WipingModal } from './components/modals/WipingModal';
import { CertificateModal } from './components/modals/CertificateModal';

import { ITAsset, CertificateOfDestruction } from './types';

const AppContent: React.FC = () => {
  const { assets, certificates, generateCertificate } = useApp();
  const { currentPage, navigate } = useNav();

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

  const handleGenerateCertificate = (asset: ITAsset) => {
    try {
      const newCert = generateCertificate(asset.id);
      navigate('certificate-details', { certificateId: newCert.certificateId }, `Certificate ${newCert.certificateId}`);
    } catch (e) {
      console.error(e);
    }
  };

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
              <DashboardPage
                onNavigate={(page: PageId) => navigate(page)}
                onSelectAsset={handleSelectAsset}
                onOpenNewAssetModal={handleOpenAddAsset}
              />
            )}

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
              <DataWipingPage
                onSelectAsset={handleSelectAsset}
                onOpenWipingModal={handleOpenWiping}
              />
            )}

            {currentPage === 'verification' && (
              <VerificationPage
                onSelectAsset={handleSelectAsset}
                onOpenWipingModal={handleOpenWiping}
              />
            )}

            {currentPage === 'compliance' && (
              <CompliancePage
                onSelectAsset={handleSelectAsset}
                onGenerateCertificate={handleGenerateCertificate}
              />
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

            {currentPage === 'audit-logs' && <AuditLogsPage />}

            {currentPage === 'reports' && <ReportsPage />}

            {currentPage === 'report-details' && <ReportDetailPage />}

            {currentPage === 'ai-assistant' && (
              <AIAssistantPage onSelectAsset={handleSelectAsset} />
            )}

            {currentPage === 'notifications' && (
              <NotificationsPage onNavigate={(page: PageId) => navigate(page)} />
            )}

            {currentPage === 'user-management' && <UserManagementPage />}

            {currentPage === 'settings' && <SettingsPage />}
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
