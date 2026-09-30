import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { addPasskey, ApiError, errorMessage, getPasskeys, removePasskey } from '../api/auth.ts';
import type { FieldErrors, Passkey } from '../api/auth.ts';

// Mga passkey (Day 95–96): idagdag ang device na ito bilang passkey, tingnan ang mga mayroon, at magbura.
// Ang login gamit ang passkey ay sa Day 97 — sa ngayon, nairerehistro pa lang.
// Kailangan ang KASALUKUYANG password para magdagdag: ang passkey ay isang bagong paraan ng pagpasok sa account

// Ang mga error ng browser (hindi ng server) kapag hindi natuloy ang dialog
function browserProblem(err: unknown): string | null {
  if (!(err instanceof Error)) return null;
  if (err.name === 'NotAllowedError') return 'Kinansela, o naubos ang oras. Subukan ulit.';
  if (err.name === 'InvalidStateError') return 'May passkey na ang device na ito para sa account mo.';
  if (err.name === 'NotSupportedError' || err.name === 'SecurityError') return 'Hindi kaya ng browser o device na ito ang passkey.';
  return null;
}

export default function PasskeysPage() {
  const navigate = useNavigate();
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  // Kung walang WebAuthn ang browser, huwag nang ipakita ang form
  const supported = typeof window.PublicKeyCredential !== 'undefined';

  useEffect(() => {
    let ignore = false;
    getPasskeys()
      .then((list) => !ignore && setPasskeys(list))
      .catch((err) => {
        if (ignore) return;
        if (err instanceof ApiError && err.status === 401) navigate('/login', { replace: true });
        else setProblem(errorMessage(err));
      });
    return () => {
      ignore = true;
    };
  }, [navigate]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = data.get('currentPassword');
    const name = data.get('name');
    setBusy(true);
    setProblem(null);
    setFields({});
    setAdded(null);
    try {
      const passkey = await addPasskey(typeof password === 'string' ? password : '', typeof name === 'string' ? name.trim() : '');
      form.reset(); // huwag iwan ang password sa form
      setAdded(passkey.name);
      setPasskeys(await getPasskeys());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login', { replace: true });
      else if (err instanceof ApiError && Object.keys(err.fields).length > 0) setFields(err.fields);
      else setProblem(browserProblem(err) ?? errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(passkey: Passkey) {
    try {
      await removePasskey(passkey.id);
      setAdded(null);
      setPasskeys(await getPasskeys());
    } catch (err) {
      setProblem(errorMessage(err));
    }
  }

  if (!passkeys && problem) return <p>❌ {problem}</p>;
  if (!passkeys) return <p>Loading…</p>;

  return (
    <section>
      <h2>Mga passkey</h2>
      <Link to="/profile">← Profile</Link>
      <p>
        <small className="note">
          Ang passkey ay isang susi na nasa device mo (fingerprint, mukha o PIN ang nagbubukas). Public key lang ang napupunta sa server — walang
          password na mananakaw, at hindi ito gagana sa pekeng site. Sa ngayon ay nairerehistro pa lang; ang login gamit ito ay idadagdag pa.
        </small>
      </p>

      {passkeys.length === 0 ? (
        <p>Wala ka pang passkey.</p>
      ) : (
        <ul className="sessions">
          {passkeys.map((passkey) => (
            <li key={passkey.id}>
              <strong>{passkey.name}</strong>
              <span className="badge">{passkey.deviceType === 'multiDevice' ? 'naka-sync' : 'sa device na iyon lang'}</span>
              <br />
              <small className="note">
                idinagdag {new Date(passkey.createdAt).toLocaleString()} · huling gamit{' '}
                {passkey.lastUsedAt ? new Date(passkey.lastUsedAt).toLocaleString() : 'hindi pa'}
              </small>
              <br />
              <button onClick={() => handleRemove(passkey)}>Burahin</button>
            </li>
          ))}
        </ul>
      )}

      {supported ? (
        <form onSubmit={handleAdd}>
          <h3>Idagdag ang device na ito</h3>
          <label>
            Pangalan (para makilala mo, hal. "Laptop ko")
            <input name="name" type="text" maxLength={50} autoComplete="off" />
          </label>
          {fields.name && <small>{fields.name[0]}</small>}
          <label>
            Kasalukuyang password
            <input name="currentPassword" type="password" autoComplete="current-password" required />
          </label>
          {fields.currentPassword && <small>{fields.currentPassword[0]}</small>}
          <button type="submit" disabled={busy}>
            {busy ? 'Naghihintay sa device…' : 'Magdagdag ng passkey'}
          </button>
          {added && <p>✅ Naidagdag: {added}</p>}
          {problem && <p>❌ {problem}</p>}
        </form>
      ) : (
        <p>❌ Hindi kaya ng browser na ito ang passkey.</p>
      )}
    </section>
  );
}
