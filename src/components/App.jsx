import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MaterialLayout, Error, ScrollToAnchor } from 'components/layouts';
import { OrderProvider } from 'contexts/OrderContext';
import { Home, About, Staff, Seattle, Contact, Schedule, PaymentExplanation } from 'components/Static';
import { Registration } from 'components/Registration';
import { config } from 'config';
const { TECH_CONTACT } = config;

export const App = () => {
  // useEffect(() => {
  //   document.title = EVENT_TITLE;
  // }, []);

  // for easier local testing of registration
  const RootElement = window.location.hostname === 'localhost' ? Registration : Home;

  return (
    <>
      <Router>
        <ScrollToAnchor />
        <MaterialLayout>
          <OrderProvider>
            <Routes>
              <Route exact path="/" element=<RootElement /> />
              <Route exact path="/home" element=<Home /> />
              <Route exact path="/about" element=<About /> />
              <Route exact path="/staff" element=<Staff /> />
              <Route exact path="/schedule" element=<Schedule /> />
              <Route exact path="/seattle" element=<Seattle /> />
              <Route exact path="/contact" element=<Contact /> />
              <Route exact path="/paymentinfo" element=<PaymentExplanation /> />
              <Route path="/registration" element=<Registration /> />
              <Route exact path="/error-contact-support" element=<Error error={`Unexpected payment processing error. Please email ${TECH_CONTACT}`} /> />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </OrderProvider>
        </MaterialLayout>
      </Router>
    </>
  );
};
