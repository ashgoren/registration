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

const ProtectedRoute = ({ pageKey, children }: { pageKey: string; children: React.ReactNode }) => {
  const { furthestPageReached } = useOrderFlow();
  const pageKeyIndex = config.navigation.pages.findIndex((page: { key: string }) => page.key === pageKey);
  const furthestPageIndex = config.navigation.pages.findIndex((page: { key: string }) => page.key === furthestPageReached);

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
  config.payments.processor === 'paypal'
    ? <PayPalScriptProvider options={config.paypal.options}>
        <Outlet />
      </PayPalScriptProvider>
    : <Outlet />
);

const routes = [
  {
    path: '/',
    element: config.registrationOnly
      ? <Navigate to='/registration' replace={true} />
      : <StaticComponents.Home />
  },
  ...(config.productionMode || config.env !== 'prd') ? [{
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
  ...config.staticPages.components.map((page: string) => {
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
  // useEffect(() => document.title = config.event.title, []);

  if (config.registrationOnly && config.env === 'prd' && !config.productionMode) {
    return <Placeholder />;
  }

  return <RouterProvider router={router} />;
};
