import { useActionState } from 'react';
import { Link } from 'react-router';
import { register } from '../api/auth.js';

// Ang "action": tinatawag ng React kapag nag-submit. Ang ibinabalik nito ang magiging bagong state
async function registerAction(prevState, formData) {
  const email = formData.get('email'); // galing sa name="email" ng input — walang useState bawat input
  const password = formData.get('password');
  const name = formData.get('name') || undefined; // "" → wala, kung hindi tatanggihan ni Zod (min 1)
  try {
    const data = await register(email, password, name);
    return { user: data.user };
  } catch (err) {
    // Ibinabalik ang email at name: binubura ng React 19 ang form pagkatapos ng submit, kahit may error.
    // Hindi ibinabalik ang password — sinadyang i-type ulit
    return { error: err.message, fields: err.fields ?? {}, email, name };
  }
}

export default function RegisterPage() {
  // React 19: state = huling ibinalik ng action · isPending = true habang naghihintay sa backend
  const [state, formAction, isPending] = useActionState(registerAction, {});

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
