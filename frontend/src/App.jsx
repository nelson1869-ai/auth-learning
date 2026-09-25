import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

function App() {
  return (
    <main>
      <h1>auth-learning</h1>
      {/* Magkasama muna ang dalawang form — sa Day 24, magkahiwalay na page (React Router) */}
      <LoginPage />
      <hr />
      <RegisterPage />
    </main>
  );
}

export default App;
