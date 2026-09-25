import { useActionState } from 'react';
import { Link } from 'react-router';
import { register, errorMessage, ApiError } from '../api/auth.ts';
import type { User, FieldErrors } from '../api/auth.ts';

// Lahat ng puwedeng laman ng state — ang ibinabalik ng action (tagumpay o error)
type RegisterState = {
  user?: User;
  error?: string;
  fields?: FieldErrors;
  email?: string;
  name?: string;
};

// FormData.get() ay `string | File | null` — gawing string (walang laman kapag wala)
function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

// Ang "action": tinatawag ng React kapag nag-submit. Ang ibinabalik nito ang magiging bagong state
async function registerAction(_prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const email = text(formData, 'email'); // galing sa name="email" ng input — walang useState bawat input
  const password = text(formData, 'password');
  const name = text(formData, 'name') || undefined; // "" → wala, kung hindi tatanggihan ni Zod (min 1)
  try {
    const user = await register(email, password, name);
    return { user };
  } catch (err) {
    // Ibinabalik ang email at name: binubura ng React 19 ang form pagkatapos ng submit, kahit may error.
    // Hindi ibinabalik ang password — sinadyang i-type ulit
    const fields = err instanceof ApiError ? err.fields : {};
    return { error: errorMessage(err), fields, email, name };
  }
}

export default function RegisterPage() {
  // React 19: state = huling ibinalik ng action · isPending = true habang naghihintay sa backend
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(registerAction, {});

  return (
    <form action={formAction}>
      <h2>Register</h2>
      <label>
        Email
        <input name="email" type="email" defaultValue={state.email} required />
      </label>
      {state.fields?.email && <small>{state.fields.email[0]}</small>}

      <label>
        Password
        <input name="password" type="password" required />
      </label>
      {state.fields?.password && <small>{state.fields.password[0]}</small>}

      <label>
        Name (optional)
        <input name="name" defaultValue={state.name} />
      </label>
      {state.fields?.name && <small>{state.fields.name[0]}</small>}

      {/* disabled habang naghihintay — hindi madodoble ang register kapag pinindot nang dalawang beses */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Nagre-register…' : 'Register'}
      </button>
      {state.error && <p>❌ {state.error}</p>}
      {state.user && (
        <p>
          ✅ Nagawa ang account: {state.user.email} — <Link to="/login">Mag-login na</Link>
        </p>
      )}
    </form>
  );
}
