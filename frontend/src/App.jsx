import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CategoryProducts from "./pages/CategoryProducts";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { homeLoader, categoryLoader } from "./loaders";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AllProducts from "./pages/AllProducts";
import ProductDetail from "./pages/ProductDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackingPrivacy from "./pages/TrackingPrivacy";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <Home />, loader: homeLoader },
        { path: "login", element: <Login /> },
        { path: "signup", element: <Signup /> },
        { path: "category/:categoryId", element: <CategoryProducts />, loader: categoryLoader },
        { path: "products", element: <AllProducts /> },
        { path: "product/:id", element: <ProductDetail /> },
        { path: "cart", element: <Cart /> },
        { path: "order-confirmation", element: <OrderConfirmation /> },
        { path: "tracking-privacy", element: <TrackingPrivacy /> },
        { path: "wishlist", element: <Wishlist /> },
        {
          path: "admin",
          element: (
            <ProtectedRoute role="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          ),
          children: [
            { index: true, element: <Navigate to="orders" replace /> },
            { path: "orders", element: <AdminOrders /> },
            { path: "users", element: <AdminUsers /> },
            { path: "products", element: <AdminProducts /> },
          ],
        },
        { path: "profile", element: <Profile /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL } // matches Vite's `base` config automatically, both in dev and after deploy
);

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <RouterProvider router={router} />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
