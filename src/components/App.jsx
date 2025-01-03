import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import {Home} from 'components/Static/Home';
import { About } from 'components/Static/About';
import { Staff } from 'components/Static/Staff';
import { Seattle } from 'components/Static/Seattle';
import { Contact } from 'components/Static/Contact';
import { Schedule } from 'components/Static/Schedule';
import { Registration } from 'components/Registration';
import { MaterialLayout } from 'components/Layout/MaterialLayout';
import { Error } from 'components/Layout/Error';
import { PaymentExplanation } from 'components/Static/PaymentExplanation';
import { ScrollToAnchor } from 'components/Layout/ScrollToAnchor';
import { OrderProvider } from 'contexts/OrderContext';
import { config } from 'config';
const { TECH_CONTACT } = config;

export const App = () => {
  // useEffect(() => {
  //   document.title = EVENT_TITLE;
  // }, []);

  return (
    <>
      <Router>
        <ScrollToAnchor />
        <MaterialLayout>
          <OrderProvider>
            <Routes>
              {/* <Route exact path="/" element=<Home /> /> */}
              <Route exact path="/" element=<Registration /> />
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
