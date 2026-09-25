import { useState } from 'react';
import { login } from '../api/auth.js';

export default function LoginPage() {
  // State: naaalala ng component; kapag binago (setX), nire-render ulit ng React ang UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault(); // pigilan ang default na page reload ng browser — JavaScript ang hahawak
    setError('');
    try {
      const data = await login(email, password);
      setUser(data.user);
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

      {user && <p>✅ Naka-login: {user.email}</p>}
      {error && <p>❌ {error}</p>}
    </form>
  );
}
