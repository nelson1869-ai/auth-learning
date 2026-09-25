import { useState } from 'react';

export default function LoginPage() {
  // State: naaalala ng component; kapag binago (setX), nire-render ulit ng React ang UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(null);

  function handleSubmit(e) {
    e.preventDefault(); // pigilan ang default na page reload ng browser — JavaScript ang hahawak
    setSubmitted({ email }); // Day 22: dito tatawag sa backend
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

      {/* Email lang ang ipinapakita — hindi kailanman ang password */}
      <p>Tina-type mo: {email}</p>
      {submitted && <p>Na-submit: {submitted.email}</p>}
    </form>
  );
}
