import { useEffect, useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';
import OpportunityFormPage from './pages/OpportunityFormPage';
import VisitsPage from './pages/VisitsPage';
import VisitFormPage from './pages/VisitFormPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerFormPage from './pages/CustomerFormPage';

function getRoute() {
  return window.location.hash.replace(/^#/, '') || '/dashboard';
}

export default function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) window.location.hash = '/dashboard';
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const content = useMemo(() => {
    const [path, queryString = ''] = route.split('?');
    const query = new URLSearchParams(queryString);
    const parts = path.split('/').filter(Boolean);

    if (path === '/dashboard') return <DashboardPage navigate={navigate} />;
    if (path === '/opportunities') return <OpportunitiesPage navigate={navigate} />;
    if (path === '/opportunities/new') return <OpportunityFormPage navigate={navigate} />;
    if (parts[0] === 'opportunities' && parts[2] === 'edit') {
      return <OpportunityFormPage id={parts[1]} navigate={navigate} />;
    }
    if (parts[0] === 'opportunities' && parts[1]) {
      return <OpportunityDetailPage id={parts[1]} navigate={navigate} />;
    }
    if (path === '/visits') return <VisitsPage navigate={navigate} />;
    if (path === '/visits/new') return <VisitFormPage navigate={navigate} query={query} />;
    if (path === '/customers') return <CustomersPage navigate={navigate} />;
    if (path === '/customers/new') return <CustomerFormPage navigate={navigate} />;
    if (parts[0] === 'customers' && parts[2] === 'edit') {
      return <CustomerFormPage code={parts[1]} navigate={navigate} />;
    }
    if (parts[0] === 'customers' && parts[1]) {
      return <CustomerDetailPage code={parts[1]} navigate={navigate} />;
    }
    return <DashboardPage navigate={navigate} />;
  }, [route]);

  return (
    <Layout route={route} navigate={navigate}>
      {content}
    </Layout>
  );
}
