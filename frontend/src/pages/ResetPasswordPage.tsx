import { useActionState } from 'react';
import { Link } from 'react-router';
import { ApiError, errorMessage, resetPassword } from '../api/auth.ts';
import { useHashToken } from '../hooks/useHashToken.ts';

// Bagong password gamit ang link sa email (Day 61): …/reset-password#token=…
// Ang token ay nasa #fragment (hindi napupunta sa server), at TINATANGGAL sa address bar pagkabasa

type ResetState = { done?: boolean; error?: string; passwordError?: string };

export default function ResetPasswordPage() {
  const token = useHashToken();

  if (!token) {
    return (
      <section>
        <h2>Palitan ang password</h2>
        <p>❌ Walang reset link. Buksan ang link mula sa email, o humingi ng bago.</p>
        <Link to="/forgot-password">Humingi ng bagong link</Link>
      </section>
    );
  }
  // key={token}: bagong link → bagong form, kaya nawawala ang lumang error
  return <ResetForm key={token} token={token} />;
}

function ResetForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState<ResetState, FormData>(async (_prev, formData) => {
    const newPassword = formData.get('newPassword');
    try {
      await resetPassword(token, typeof newPassword === 'string' ? newPassword : '');
      return { done: true };
    } catch (err) {
      if (err instanceof ApiError && err.fields.newPassword) return { passwordError: err.fields.newPassword[0] };
      return { error: errorMessage(err) }; // hal. "This reset link is invalid or has expired"
    }
  }, {});

  if (state.done) {
    return (
      <section>
        <h2>Palitan ang password</h2>
        <p>✅ Napalitan ang password. Na-logout ang lahat ng device.</p>
        <Link to="/login">Mag-login gamit ang bagong password →</Link>
      </section>
    );
  }

  return (
    <form action={formAction}>
      <h2>Bagong password</h2>
      <label>
        Bagong password (8–128)
        <input name="newPassword" type="password" autoComplete="new-password" required />
      </label>
      {state.passwordError && <small>{state.passwordError}</small>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Pinapalitan…' : 'Palitan ang password'}
      </button>
      {state.error && (
        <p role="alert">
          ❌ {state.error} — <Link to="/forgot-password">humingi ng bagong link</Link>
        </p>
      )}
    </form>
  );
}
