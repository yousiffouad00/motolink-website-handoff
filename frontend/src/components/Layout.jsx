import { useEffect } from "react";
import { Outlet, useLocation, useNavigation } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import Footer from "./Footer";
import { trackPageView } from "../analytics/metaPixel";

// Checks whether a session cookie from a previous visit is still valid,
// so a page refresh doesn't silently log the user out on the frontend
// while the backend session is actually still alive.
export default function Layout() {
  const { refreshUser } = useAuth();
  const navigation = useNavigation();
  const location = useLocation();
  const isLoading = navigation.state === "loading";

  useEffect(() => {
    if (!location.pathname.startsWith("/admin")) {
      trackPageView(location.key);
    }
  }, [location.key, location.pathname]);

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Thin animated bar shown while a route/loader is fetching data */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-motolink-blue-light overflow-hidden">
          <div className="h-full w-1/3 bg-motolink-blue animate-loading-bar" />
        </div>
      )}
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
