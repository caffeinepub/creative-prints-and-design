import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import AdminDashboard from "./pages/AdminDashboard";
import CheckoutPage from "./pages/CheckoutPage";
import CustomOrderPage from "./pages/CustomOrderPage";
import HomePage from "./pages/HomePage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import StorePage from "./pages/StorePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/store",
  component: StorePage,
});

const customOrderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/custom-order",
  component: CustomOrderPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: CheckoutPage,
});

const orderSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order-success",
  validateSearch: (search: Record<string, unknown>) => ({
    customerName: (search.customerName as string) || "",
    itemCount: Number(search.itemCount) || 0,
    total: Number(search.total) || 0,
  }),
  component: OrderSuccessPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminDashboard,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  storeRoute,
  customOrderRoute,
  checkoutRoute,
  orderSuccessRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
