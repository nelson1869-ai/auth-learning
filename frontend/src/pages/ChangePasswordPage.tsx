import { useActionState } from 'react';
import { Link, Navigate } from 'react-router';
import { changePassword, errorMessage, ApiError } from '../api/auth.ts';
import type { FieldErrors } from '../api/auth.ts';

// Change password (Day 55) — kailangan ang KASALUKUYANG password. Pagkatapos: na-logout ang LAHAT ng ibang device,
// pero tuloy ang session sa device na ito (bagong session ang ibinigay ng backend)

type ChangeState = { done?: boolean; error?: string; fields?: FieldErrors; unauthenticated?: boolean };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

async function changeAction(_prev: ChangeState, formData: FormData): Promise<ChangeState> {
  try {
    await changePassword(text(formData, 'currentPassword'), text(formData, 'newPassword'));
    return { done: true };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return { unauthenticated: true };
    // Walang ibinabalik na password — sinadyang i-type ulit (binubura ng React 19 ang form)
    return { error: errorMessage(err), fields: err instanceof ApiError ? err.fields : {} };
  }
}

export default function ChangePasswordPage() {
  const [state, formAction, isPending] = useActionState<ChangeState, FormData>(changeAction, {});

  // Hindi naka-login (401) → login page. <Navigate />, hindi navigate(): bawal mag-navigate HABANG nagre-render
  if (state.unauthenticated) return <Navigate to="/login" replace />;
  if (state.done) {
    return (
      <section>
        <h2>Palitan ang password</h2>
        <p>✅ Napalitan ang password.</p>
        <p>
          <small className="note">
            Na-logout ang lahat ng IBANG device (ang access token nila ay titigil sa loob ng ≤ 15 minuto). Tuloy ka
            rito.
          </small>
        </p>
        <Link to="/profile">← Profile</Link>
      </section>
    );
  }

  return (
    <form action={formAction}>
      <h2>Palitan ang password</h2>
      <label>
        Kasalukuyang password
        <input name="currentPassword" type="password" autoComplete="current-password" required />
      </label>
      {state.fields?.currentPassword && <small>{state.fields.currentPassword[0]}</small>}

      <label>
        Bagong password (8–128)
        <input name="newPassword" type="password" autoComplete="new-password" required />
      </label>
      {state.fields?.newPassword && <small>{state.fields.newPassword[0]}</small>}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Pinapalitan…' : 'Palitan'}
      </button>
      {state.error && !state.fields?.currentPassword && !state.fields?.newPassword && <p role="alert">❌ {state.error}</p>}
      <p>
        <Link to="/profile">← Profile</Link>
      </p>
    </form>
  );
}
