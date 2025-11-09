import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MaterialLayout, Error, ScrollToAnchor } from 'components/layouts';
import { OrderDataProvider } from 'contexts/OrderDataContext';
import { OrderPaymentProvider } from 'contexts/OrderPaymentContext';
import { OrderFlowProvider } from 'contexts/OrderFlowContext';
import * as StaticComponents from 'components/Static';
import { Placeholder } from 'components/Static';
import { Registration } from 'components/Registration';
import { config } from 'config';
import { logEnvironment } from 'src/logger';
const { STATIC_PAGES, REGISTRATION_ONLY, PRD_LIVE, ENV } = config;

export const App = () => {
  logEnvironment();
  // useEffect(() => {
  //   document.title = EVENT_TITLE;
  // }, []);

  if (REGISTRATION_ONLY && ENV === 'prd' && !PRD_LIVE) {
    return <Placeholder />;
  }

  const RootElement = REGISTRATION_ONLY ? Registration : StaticComponents.Home;

  return (
    <>
      <Router>
        <ScrollToAnchor />
        <MaterialLayout>
          <OrderDataProvider>
            <OrderPaymentProvider>
              <OrderFlowProvider>
                <Routes>
                  <Route path="/" element={<RootElement />} />
                  {STATIC_PAGES.map(page => {
                    const route = page.toLowerCase();
                    const Component = StaticComponents[page as keyof typeof StaticComponents];
                    return <Route key={route} path={`/${route}`} element={<Component />} />;
                  })}
                  {(PRD_LIVE || ENV !== 'prd') &&
                    <Route path="/registration" element={<Registration />} />
                  }
                  <Route path="/error-contact-support" element={<Error />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </OrderFlowProvider>
            </OrderPaymentProvider>
          </OrderDataProvider>
        </MaterialLayout>
      </Router>
    </>
  );
};
