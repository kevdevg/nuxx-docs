import React, { useState } from 'react';
import { AppProvider } from './services/store';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const MainApp = () => {
  const [viewState, setViewState] = useState<'LANDING' | 'AUTH'>('LANDING');

  if (viewState === 'AUTH') {
    return (
      <LoginPage 
        initialMode="REGISTER" 
        onBack={() => setViewState('LANDING')} 
      />
    );
  }

  return (
    <LandingPage 
      onLogin={() => setViewState('AUTH')}
      onRegister={() => setViewState('AUTH')}
    />
  );
};

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Toaster position="top-right" />
        <MainApp />
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
