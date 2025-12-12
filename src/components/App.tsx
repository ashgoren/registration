import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { MaterialLayout, Error, ScrollToAnchor } from 'components/layouts';
import { OrderDataProvider } from 'contexts/OrderDataContext';
import { OrderPaymentProvider } from 'contexts/OrderPaymentContext';
import { OrderFlowProvider } from 'contexts/OrderFlowContext';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import * as StaticComponents from 'components/Static';
import { Placeholder } from 'components/Static';
import { RegistrationWrapper } from './Registration';
import { PaymentForm } from 'components/PaymentForm';
import { Confirmation } from 'components/Confirmation';
import { WaiverWrapper } from 'components/Waiver';
import { Waitlist } from 'components/Waitlist';
import { Checkout } from 'components/Checkout';
import { useOrderFlow } from 'contexts/OrderFlowContext';
import { config } from 'config';
import { logEnvironment, logDebug } from 'src/logger';
const { PAGES, STATIC_PAGES, REGISTRATION_ONLY, PRD_LIVE, ENV, PAYMENT_PROCESSOR, PAYPAL_OPTIONS } = config;

const ProtectedRoute = ({ pageKey, children }: { pageKey: string; children: React.ReactNode }) => {
  const { furthestPageReached } = useOrderFlow();
  const pageKeyIndex = PAGES.findIndex((page: { key: string }) => page.key === pageKey);
  const furthestPageIndex = PAGES.findIndex((page: { key: string }) => page.key === furthestPageReached);

  if (pageKeyIndex > furthestPageIndex || (furthestPageReached === 'confirmation' && pageKey !== 'confirmation')) {
    logDebug(`Redirecting from ${pageKey} to ${furthestPageReached}`);
    return <Navigate to={`/registration/${furthestPageReached}`} replace={true} />;
  }

  return <>{children}</>;
}

const RootLayout = () => (
  <>
    <ScrollToAnchor />
    <MaterialLayout>
      <OrderDataProvider>
        <OrderPaymentProvider>
          <OrderFlowProvider>
            <Outlet />
          </OrderFlowProvider>
        </OrderPaymentProvider>
      </OrderDataProvider>
    </MaterialLayout>
  </>
);

const RegistrationLayout = () => (
  PAYMENT_PROCESSOR === 'paypal'
    ? <PayPalScriptProvider options={PAYPAL_OPTIONS}>
        <Outlet />
      </PayPalScriptProvider>
    : <Outlet />
);

const routes = [
  {
    path: '/',
    element: REGISTRATION_ONLY
      ? <Navigate to='/registration' replace={true} />
      : <StaticComponents.Home />
  },
  ...(PRD_LIVE || ENV !== 'prd') ? [{
    path: '/registration',
    element: <RegistrationLayout />,
    children: [
      { index: true, element: <ProtectedRoute pageKey='people'><RegistrationWrapper /></ProtectedRoute> },
      { path: 'people', element: <Navigate to='/registration' replace={true} /> },
      { path: 'waiver', element: <ProtectedRoute pageKey='waiver'><WaiverWrapper /></ProtectedRoute> },
      { path: 'waitlist', element: <ProtectedRoute pageKey='waitlist'><Waitlist /></ProtectedRoute> },
      { path: 'payment', element: <ProtectedRoute pageKey='payment'><PaymentForm /></ProtectedRoute> },
      { path: 'checkout', element: <ProtectedRoute pageKey='checkout'><Checkout /></ProtectedRoute> },
      { path: 'confirmation', element: <ProtectedRoute pageKey='confirmation'><Confirmation /></ProtectedRoute> },
    ]
  }] : [],
  ...STATIC_PAGES.map((page: string) => {
    const route = page.toLowerCase();
    const Component = StaticComponents[page as keyof typeof StaticComponents];
    return {
      path: `/${route}`,
      element: <Component />
    };
  }),
  { path: '/error-contact-support', element: <Error /> },
  { path: '*', element: <Navigate to='/' /> }
];

const router = createBrowserRouter([
  { element: <RootLayout />, children: routes }
]);

export const App = () => {
  logEnvironment();
  // useEffect(() => document.title = EVENT_TITLE, []);

  if (REGISTRATION_ONLY && ENV === 'prd' && !PRD_LIVE) {
    return <Placeholder />;
  }

  return <RouterProvider router={router} />;
};
