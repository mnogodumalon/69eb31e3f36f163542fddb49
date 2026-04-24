import '@/lib/sentry';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import { WorkflowPlaceholders } from '@/components/WorkflowPlaceholders';
import AdminPage from '@/pages/AdminPage';
import MitarbeiterPage from '@/pages/MitarbeiterPage';
import SchichtdefinitionPage from '@/pages/SchichtdefinitionPage';
import SchichtplanungPage from '@/pages/SchichtplanungPage';
import PublicFormMitarbeiter from '@/pages/public/PublicForm_Mitarbeiter';
import PublicFormSchichtdefinition from '@/pages/public/PublicForm_Schichtdefinition';
import PublicFormSchichtplanung from '@/pages/public/PublicForm_Schichtplanung';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/69eb31ca00a109d9305cc8f7" element={<PublicFormMitarbeiter />} />
              <Route path="public/69eb31cfd2b8634d5207588f" element={<PublicFormSchichtdefinition />} />
              <Route path="public/69eb31d0cef13ab397a4d85f" element={<PublicFormSchichtplanung />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<><div className="mb-8"><WorkflowPlaceholders /></div><DashboardOverview /></>} />
                <Route path="mitarbeiter" element={<MitarbeiterPage />} />
                <Route path="schichtdefinition" element={<SchichtdefinitionPage />} />
                <Route path="schichtplanung" element={<SchichtplanungPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
