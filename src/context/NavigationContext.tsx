import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PageId } from '../components/layout/Sidebar';

export type AppRoute =
  | PageId
  | 'asset-details'
  | 'disposal-request'
  | 'report-details'
  | 'certificate-details';

export interface NavHistoryEntry {
  page: AppRoute;
  params?: Record<string, any>;
  title?: string;
  scrollPosition?: number;
}

export interface PreservedPageStates {
  assets?: {
    search: string;
    deviceFilter: string;
    statusFilter: string;
    complianceFilter: string;
    departmentFilter: string;
  };
  disposalRequests?: {
    tabFilter: string;
    search: string;
  };
  dataWiping?: {
    methodFilter: string;
    statusFilter: string;
    search: string;
  };
  verification?: {
    search: string;
    filterState: string;
  };
  compliance?: {
    complianceFilter: string;
    riskFilter: string;
    search: string;
    showConfigRules: boolean;
  };
  reports?: {
    selectedReport: string;
    departmentFilter: string;
    deviceFilter: string;
    dateRange: string;
  };
  [key: string]: any;
}

interface NavigationContextType {
  currentPage: AppRoute;
  currentParams: Record<string, any>;
  history: NavHistoryEntry[];
  canGoBack: boolean;
  previousEntry: NavHistoryEntry | null;
  navigate: (page: AppRoute, params?: Record<string, any>, title?: string) => void;
  goBack: () => void;
  pageStates: PreservedPageStates;
  setPageState: <K extends keyof PreservedPageStates>(key: K, state: PreservedPageStates[K]) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Helper to serialize route to URL hash
function getHashForRoute(page: AppRoute, params?: Record<string, any>): string {
  if (page === 'asset-details' && params?.assetId) {
    return `#/assets/${encodeURIComponent(params.assetId)}`;
  }
  if (page === 'disposal-request' && params?.assetId) {
    return `#/disposal-request?assetId=${encodeURIComponent(params.assetId)}`;
  }
  if (page === 'disposal-request') {
    return `#/disposal-request`;
  }
  if (page === 'report-details' && params?.reportType) {
    return `#/reports/${encodeURIComponent(params.reportType.toLowerCase().replace(/\s+/g, '-'))}`;
  }
  if (page === 'certificate-details' && params?.certificateId) {
    return `#/certificates/${encodeURIComponent(params.certificateId)}`;
  }
  return `#/${page}`;
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation stack: initial is dashboard
  const [history, setHistory] = useState<NavHistoryEntry[]>([
    { page: 'dashboard', title: 'Dashboard' },
  ]);

  const [pageStates, setPageStatesInternal] = useState<PreservedPageStates>({
    assets: {
      search: '',
      deviceFilter: 'All',
      statusFilter: 'All',
      complianceFilter: 'All',
      departmentFilter: 'All',
    },
    disposalRequests: {
      tabFilter: 'All',
      search: '',
    },
    dataWiping: {
      methodFilter: 'All',
      statusFilter: 'All',
      search: '',
    },
    verification: {
      search: '',
      filterState: 'Pending',
    },
    compliance: {
      complianceFilter: 'All',
      riskFilter: 'All',
      search: '',
      showConfigRules: false,
    },
    reports: {
      selectedReport: 'Asset Disposal Report',
      departmentFilter: 'All',
      deviceFilter: 'All',
      dateRange: 'Past 90 Days',
    },
  });

  const setPageState = useCallback(<K extends keyof PreservedPageStates>(key: K, state: PreservedPageStates[K]) => {
    setPageStatesInternal((prev) => ({
      ...prev,
      [key]: state,
    }));
  }, []);

  const currentEntry = history[history.length - 1] || { page: 'dashboard' as AppRoute };
  const currentPage = currentEntry.page;
  const currentParams = currentEntry.params || {};
  const canGoBack = history.length > 1;
  const previousEntry = history.length > 1 ? history[history.length - 2] : null;

  // Navigate function: push onto history stack & update browser history
  const navigate = useCallback((page: AppRoute, params?: Record<string, any>, title?: string) => {
    setHistory((prev) => {
      // Don't push duplicate identical routes consecutively
      const last = prev[prev.length - 1];
      if (
        last &&
        last.page === page &&
        JSON.stringify(last.params || {}) === JSON.stringify(params || {})
      ) {
        return prev;
      }

      const newEntry: NavHistoryEntry = {
        page,
        params,
        title,
        scrollPosition: window.scrollY || 0,
      };

      const newHistory = [...prev, newEntry];

      // Update URL hash for bookmarking and native back/forward support
      const hash = getHashForRoute(page, params);
      if (window.location.hash !== hash) {
        window.history.pushState(
          { historyIndex: newHistory.length - 1, page, params },
          title || page,
          hash
        );
      }

      return newHistory;
    });

    // Reset scroll smoothly to top for the new page
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Go Back function: pop top entry from history stack
  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      const newHistory = prev.slice(0, prev.length - 1);
      const target = newHistory[newHistory.length - 1];

      // Update URL hash
      const hash = getHashForRoute(target.page, target.params);
      if (window.location.hash !== hash) {
        window.history.replaceState(
          { historyIndex: newHistory.length - 1, page: target.page, params: target.params },
          target.title || target.page,
          hash
        );
      }

      return newHistory;
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Listen to browser popstate (native Back and Forward buttons)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.historyIndex === 'number') {
        // Browser back/forward triggered
        setHistory((prev) => {
          const targetIndex = event.state.historyIndex;
          if (targetIndex >= 0 && targetIndex < prev.length) {
            return prev.slice(0, targetIndex + 1);
          }
          if (event.state.page) {
            return [
              ...prev,
              { page: event.state.page, params: event.state.params, title: event.state.page },
            ];
          }
          return prev;
        });
      } else {
        // Fallback for direct hash alteration or back without state
        setHistory((prev) => {
          if (prev.length > 1) {
            return prev.slice(0, prev.length - 1);
          }
          return prev;
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        currentPage,
        currentParams,
        history,
        canGoBack,
        previousEntry,
        navigate,
        goBack,
        pageStates,
        setPageState,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNav = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNav must be used within a NavigationProvider');
  }
  return context;
};
