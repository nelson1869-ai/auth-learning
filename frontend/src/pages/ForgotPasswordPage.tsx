import { useActionState } from 'react';
import { Link } from 'react-router';
import { ApiError, errorMessage, forgotPassword } from '../api/auth.ts';

// Nakalimutan ang password (Day 61). Laging parehong sagot ang backend, may account man o wala —
// kaya "kung may account…" din ang sinasabi ng page, hindi "naipadala na"

type ForgotState = { sent?: boolean; error?: string; emailError?: string };

async function forgotAction(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const email = formData.get('email');
  try {
    await forgotPassword(typeof email === 'string' ? email : '');
    return { sent: true };
  } catch (err) {
    if (err instanceof ApiError && err.fields.email) return { emailError: err.fields.email[0] };
    // 429 = masyadong maraming hiling (5 bawat 15 minuto)
    return { error: errorMessage(err) };
  }
}

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState<ForgotState, FormData>(forgotAction, {});

  if (state.sent) {
    return (
      <section>
        <h2>Tingnan ang email mo</h2>
        <p>Kung may account ang email na iyon, may ipinadala kaming link para palitan ang password (1 oras ang bisa).</p>
        <p>
          <small className="note">Wala sa Inbox? Tingnan din ang Spam. 🔐 Huwag i-share ang link — parang susi ito.</small>
        </p>
        <Link to="/login">← Bumalik sa Login</Link>
      </section>
    );
  }

  return (
    <form action={formAction}>
      <h2>Nakalimutan ang password</h2>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      {state.emailError && <small>{state.emailError}</small>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Nagpapadala…' : 'Ipadala ang reset link'}
      </button>
      {state.error && <p>❌ {state.error}</p>}
      <p>
        <Link to="/login">← Login</Link>
      </p>
    </form>
  );
}
