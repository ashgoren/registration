import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MaterialLayout, Error, ScrollToAnchor } from 'components/layouts';
import { OrderProvider } from 'contexts/OrderContext';
import * as StaticComponents from 'components/Static';
import { Registration } from 'components/Registration';
import { config } from 'config';
import { logEnvironment } from 'src/logger';
const { STATIC_PAGES, TECH_CONTACT, REGISTRATION_ONLY, PRD_LIVE, ENV } = config;

export const App = () => {
  logEnvironment();
  // useEffect(() => {
  //   document.title = EVENT_TITLE;
  // }, []);

  const RootElement = REGISTRATION_ONLY ? Registration : StaticComponents.Home;

  return (
    <>
      <Router>
        <ScrollToAnchor />
        <MaterialLayout>
          <OrderProvider>
            <Routes>
              <Route exact path="/" element={<RootElement />} />
              {STATIC_PAGES.map(page => {
                const route = page.toLowerCase();
                const Component = StaticComponents[page];
                return <Route key={route} exact path={`/${route}`} element={<Component />} />;
              })}
              {(PRD_LIVE || ENV !== 'prd') &&
                <Route path="/registration" element={<Registration />} />
              }
              <Route exact path="/error-contact-support" element={<Error error={`Unexpected payment processing error. Please email ${TECH_CONTACT}`} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </OrderProvider>
        </MaterialLayout>
      </Router>
    </>
  );
};
