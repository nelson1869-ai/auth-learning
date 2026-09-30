import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import SessionsPage from './pages/SessionsPage.tsx';
import ChangePasswordPage from './pages/ChangePasswordPage.tsx';
import PasskeysPage from './pages/PasskeysPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import VerifyEmailPage from './pages/VerifyEmailPage.tsx';

function App() {
  return (
    // BrowserRouter: binabantayan ang URL — nagpapalit ng page nang walang reload (SPA)
    <BrowserRouter>
      <main>
        <h1>auth-learning</h1>
        {/* Link, hindi <a href> — ang <a> ay nire-reload ang buong page */}
        <nav>
          <Link to="/login">Login</Link> · <Link to="/register">Register</Link> ·{' '}
          <Link to="/profile">Profile</Link>
        </nav>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Walang proteksyon dito — ang backend ang humaharang (401/403). Tingnan ang AdminPage */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/passkeys" element={<PasskeysPage />} />
          {/* Mula sa mga link sa email (Day 61) — hindi kailangang naka-login */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          {/* Kahit anong ibang URL → profile (na magpapasa sa login kung hindi naka-login) */}
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
