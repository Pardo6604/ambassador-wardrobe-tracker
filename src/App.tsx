import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { SharedDashboardView } from './components/analytics/SharedDashboardView';

export default function App() {
  const [sharedToken, setSharedToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('shared_dashboard');
      if (token) {
        setSharedToken(token);
      }
    }
  }, []);

  if (sharedToken) {
    return (
      <SharedDashboardView
        shareToken={sharedToken}
        onExit={() => {
          window.location.href = window.location.pathname;
        }}
      />
    );
  }

  return <Dashboard />;
}

