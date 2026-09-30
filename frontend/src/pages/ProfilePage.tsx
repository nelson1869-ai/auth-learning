import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError, errorMessage, getMe, logout, resendVerification } from '../api/auth.ts';
import type { User } from '../api/auth.ts';

// Paalala kapag hindi pa verified (Day 61). SOFT (D-026): paalala lang, hindi hinaharangan ang user
function VerifyEmailBanner() {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function handleResend() {
    setIsSending(true);
    try {
      await resendVerification();
      setMessage('📧 Naipadala ang bagong link. Tingnan ang Inbox (at Spam). Hindi na gagana ang lumang link.');
    } catch (err) {
      // 409 = verified na pala (hal. na-verify sa phone habang bukas ang page na ito)
      setMessage(err instanceof ApiError && err.status === 409 ? '✅ Verified na pala ang email mo. I-refresh ang page.' : `❌ ${errorMessage(err)}`);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="notice">
      <p>⚠️ Hindi pa verified ang email mo. Buksan ang link na ipinadala namin pagka-register.</p>
      <button onClick={handleResend} disabled={isSending}>
        {isSending ? 'Nagpapadala…' : 'Ipadala ulit ang link'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default function ProfilePage() {
  // <User | null>: kung wala ito, `never` ang akala ni TypeScript — hindi alam ang hugis ng user
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Pagkatapos mag-render: tanungin ang backend kung sino ako (dalawang beses sa dev dahil sa StrictMode)
  useEffect(() => {
    getMe().then((u) => {
      if (u) setUser(u);
      else navigate('/login', { replace: true }); // hindi naka-login → login page
    });
  }, [navigate]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // UX lang ito — ang tunay na proteksyon ay ang requireAuth ng backend (401 sa /me)
  if (!user) return <p>Loading…</p>;
  return (
    <section>
      <h2>Profile</h2>
      <p>Hello, {user.name ?? user.email}!</p>
      {!user.emailVerified && <VerifyEmailBanner />}
      <p>
        <Link to="/sessions">📱 Mga device ko</Link> · <Link to="/change-password">🔑 Palitan ang password</Link> ·{' '}
        <Link to="/passkeys">🪪 Mga passkey</Link>
      </p>
      {/* Admin lang ang makakakita ng link (Day 49). UX lang ito — kahit i-type ang /admin, 403 ang backend */}
      {user.role === 'admin' && (
        <p>
          <Link to="/admin">🛠️ Admin page</Link>
        </p>
      )}
      <button onClick={handleLogout}>Logout</button>
    </section>
  );
}
