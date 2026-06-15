import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { VencimientosPage } from './pages/VencimientosPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetPage } from './pages/BudgetPage';
import { SettingsPage } from './pages/SettingsPage';
import { Page } from './types';

export default function App() {
  const auth = useAuth();
  const dataHook = useData();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const handleNavigate = (page: Page, propertyId?: string) => {
    setCurrentPage(page);
    if (propertyId) {
      setSelectedPropertyId(propertyId);
    }
  };

  if (!auth.loggedIn) {
    return (
      <LoginPage
        passwordSet={auth.passwordSet}
        onLogin={auth.login}
        onSetupPassword={auth.setupPassword}
        error={auth.error}
        loading={auth.loading}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            data={dataHook.data}
            onMarkPaid={dataHook.markVencimientoPaid}
            onNavigate={handleNavigate}
          />
        );

      case 'properties':
        return (
          <PropertiesPage
            data={dataHook.data}
            onNavigate={handleNavigate}
          />
        );

      case 'property-detail':
        if (!selectedPropertyId) {
          setCurrentPage('properties');
          return null;
        }
        return (
          <PropertyDetailPage
            propertyId={selectedPropertyId}
            data={dataHook.data}
            onBack={() => setCurrentPage('properties')}
            onUpdateProperty={dataHook.updateProperty}
            onAddVencimiento={dataHook.addVencimiento}
            onUpdateVencimiento={dataHook.updateVencimiento}
            onDeleteVencimiento={dataHook.deleteVencimiento}
            onMarkPaid={dataHook.markVencimientoPaid}
          />
        );

      case 'vencimientos':
        return (
          <VencimientosPage
            data={dataHook.data}
            onAdd={dataHook.addVencimiento}
            onUpdate={dataHook.updateVencimiento}
            onDelete={dataHook.deleteVencimiento}
            onMarkPaid={dataHook.markVencimientoPaid}
          />
        );

      case 'transactions':
        return (
          <TransactionsPage
            data={dataHook.data}
            onAdd={dataHook.addTransaction}
            onUpdate={dataHook.updateTransaction}
            onDelete={dataHook.deleteTransaction}
          />
        );

      case 'budget':
        return (
          <BudgetPage
            data={dataHook.data}
            onUpdateBudgetCategory={dataHook.updateBudgetCategory}
            onAddBudgetCategory={dataHook.addBudgetCategory}
            onDeleteBudgetCategory={dataHook.deleteBudgetCategory}
            onAddMonthlyActual={dataHook.addMonthlyActual}
            onUpdateMonthlyActual={dataHook.updateMonthlyActual}
            onDeleteMonthlyActual={dataHook.deleteMonthlyActual}
          />
        );

      case 'settings':
        return (
          <SettingsPage
            data={dataHook.data}
            onAddExchangeRate={dataHook.addExchangeRate}
            onUpdateExchangeRate={dataHook.updateExchangeRate}
            onExportData={dataHook.exportData}
            onImportData={dataHook.importData}
            onResetData={dataHook.resetData}
            onChangePassword={auth.changePassword}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={auth.logout}
    >
      {renderPage()}
    </Layout>
  );
}
