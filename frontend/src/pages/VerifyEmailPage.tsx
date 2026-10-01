import { useState } from 'react';
import { Link } from 'react-router';
import { errorMessage, verifyEmail } from '../api/auth.ts';
import { useHashToken } from '../hooks/useHashToken.ts';

// I-verify ang email (Day 61): …/verify-email#token=…
// May BUTTON (hindi kusang nagve-verify pagbukas):
//  - sa dev, dalawang beses tumatakbo ang useEffect (StrictMode) — ang una ang gagamit sa token, 400 ang pangalawa
//  - may mga email scanner na nagbubukas ng link bago pa ang tao
type Status = 'idle' | 'working' | 'done' | 'error';

export default function VerifyEmailPage() {
  const token = useHashToken();

  if (!token) {
    return (
      <section>
        <h2>I-verify ang email</h2>
        <p>❌ Walang verification link. Buksan ang link mula sa email.</p>
        <Link to="/profile">Profile → Ipadala ulit ang link</Link>
      </section>
    );
  }
  // key={token}: bagong link → bagong component, kaya malinis ulit ang status at error
  return <VerifyForm key={token} token={token} />;
}

function VerifyForm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function handleVerify() {
    setStatus('working');
    try {
      await verifyEmail(token);
      setStatus('done');
    } catch (err) {
      setError(errorMessage(err));
      setStatus('error');
    }
  }

  return (
    <section>
      <h2>I-verify ang email</h2>
      {status === 'done' ? (
        <>
          <p>✅ Na-verify ang email mo.</p>
          <Link to="/profile">Pumunta sa Profile →</Link>
        </>
      ) : (
        <>
          <p>I-click para kumpirmahing iyo ang email na ito.</p>
          <button onClick={handleVerify} disabled={status === 'working'}>
            {status === 'working' ? 'Kinukumpirma…' : 'Kumpirmahin ang email'}
          </button>
          {status === 'error' && (
            <p role="alert">
              ❌ {error} — <Link to="/profile">magpadala ng bagong link mula sa Profile</Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}
