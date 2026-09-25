import { useState } from 'react';
import { useNavigate } from 'react-router';
import { login } from '../api/auth.js';

export default function LoginPage() {
  // State: naaalala ng component; kapag binago (setX), nire-render ulit ng React ang UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); // pigilan ang default na page reload ng browser — JavaScript ang hahawak
    setError('');
    try {
      await login(email, password); // naitakda na ng backend ang cookie
      navigate('/profile');
    } catch (err) {
      // 401 mula sa backend, o network/CORS error (hal. "Failed to fetch")
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {/* Controlled input: galing sa state ang value, bawat tipa ay nagbabago ng state */}
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <button type="submit">Login</button>

      {error && <p>❌ {error}</p>}
    </form>
  );
}
