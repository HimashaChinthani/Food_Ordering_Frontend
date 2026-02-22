import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage';
import Home from './pages/Home';
import MenuPage from './pages/MenuPage';
import MenuItemDetail from './pages/MenuItemDetail';
import CartPage from './pages/CartPage';
import PaidOrders from './pages/PaidOrders';
import MainLanding from './pages/MainLanding';
import About from './pages/About';
import PaymentSuccess from './pages/PaymentSuccess';
import Mission from './pages/Mission';
import Vision from './pages/Vision';
import Service from './pages/Service';
import Contact from './pages/Contact';
import Header from './components/Header';
import Footer from './components/Footer';
import { CartProvider } from './context/CartContext';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminOrders from './pages/AdminOrders';
import Profile from './pages/Profile';

// Simple auth guard that checks for a `user` in localStorage
const RequireAuth = ({ children }) => {
  try {
    const raw = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    if (!user) return <Navigate to="/" replace />;
  } catch (e) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const RequireAdmin = ({ children }) => {
  try {
    const raw = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    const role = user && user.role ? String(user.role).toLowerCase() : null;
    if (!user || role !== 'admin') return <Navigate to="/login" replace />;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <InnerApp />
      </BrowserRouter>
    </CartProvider>
  );
}

function InnerApp() {
  const location = useLocation();
  const user = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  })();

  // Hide navbar on root and the following public/info/auth pages
  const hiddenPaths = ['/', '/login', '/register', '/about', '/mission', '/vision', '/service', '/contact'];
  const showNav = !hiddenPaths.includes(location.pathname);

  return (
    <div className="app-root">
      {showNav && user && <Header />}
      <main className="app-content">
        <Routes>
          <Route path="/" element={<MainLanding />} />
          <Route path="/about" element={<About />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/service" element={<Service />} />
          <Route path="/contact" element={<Contact />} />

          {/* Admin route */}
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
          <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

          {/* Protected routes: require login */}
          <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/menu" element={<RequireAuth><MenuPage /></RequireAuth>} />
          <Route path="/menu/:id" element={<RequireAuth><MenuItemDetail /></RequireAuth>} />
          <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
          <Route path="/paid-orders" element={<RequireAuth><PaidOrders /></RequireAuth>} />
          <Route path="/payment-success" element={<RequireAuth><PaymentSuccess /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      {showNav && user && <Footer />}
    </div>
  );
}

export default App;
