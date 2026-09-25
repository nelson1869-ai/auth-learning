import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

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
          {/* Kahit anong ibang URL → profile (na magpapasa sa login kung hindi naka-login) */}
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
