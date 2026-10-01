import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { login, errorMessage, loginWithPasskey, passkeyBrowserProblem } from '../api/auth.ts';

export default function LoginPage() {
  // State: naaalala ng component; kapag binago (setX), nire-render ulit ng React ang UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // pigilan ang default na page reload ng browser — JavaScript ang hahawak
    setError('');
    try {
      await login(email, password); // naitakda na ng backend ang cookie
      navigate('/profile');
    } catch (err) {
      // 401 mula sa backend, o network/CORS error (hal. "Failed to fetch")
      setError(errorMessage(err)); // `unknown` ang err — hindi laging may .message
    }
  }

  // Day 97: walang password. Kung may tinype na email, ang mga passkey ng account na iyon lang; kung wala, ang device ang pipili
  async function handlePasskey() {
    setError('');
    try {
      await loginWithPasskey(email.trim() || undefined);
      navigate('/profile');
    } catch (err) {
      setError(passkeyBrowserProblem(err) ?? errorMessage(err));
    }
  }
  const passkeySupported = typeof window.PublicKeyCredential !== 'undefined';

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {/* Controlled input: galing sa state ang value, bawat tipa ay nagbabago ng state */}
      <label>
        Email
        {/* autoComplete: para alam ng password manager kung alin ang username at ang password */}
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <button type="submit">Login</button>
      {passkeySupported && (
        // type="button": hindi isinusumite ang form (hindi kailangan ng password)
        <button type="button" onClick={handlePasskey}>
          🪪 Mag-login gamit ang passkey
        </button>
      )}

      {error && <p role="alert">❌ {error}</p>}
      <p>
        <Link to="/forgot-password">Nakalimutan ang password?</Link>
      </p>
    </form>
  );
}
