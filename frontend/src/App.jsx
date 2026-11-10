import { BrowserRouter, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";

function AppContent() {
  const location = useLocation();

  const token = localStorage.getItem("access_token");

  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <>
      {token && !hideNavbar && <Navbar />}

      <AppRoutes />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;