import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError, errorMessage, getSessions, revokeSession } from '../api/auth.ts';
import type { Session } from '../api/auth.ts';

// "Mga device ko" (Day 54): lahat ng naka-login kong session, at Logout bawat isa.
// Kapag may device na hindi ko kilala → i-logout ito, at palitan ang password (Day 55).

// Maikling pangalan ng device mula sa User-Agent (hal. "Chrome sa Windows"). Hula lang ito — kayang pekein
// ng client ang User-Agent, kaya para sa pagkilala lang, hindi para sa security
function deviceName(userAgent: string | null): string {
  if (!userAgent) return 'Hindi kilalang device';
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\/|CriOS\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : null;
  const os = /iPhone|iPad/.test(userAgent)
    ? 'iPhone/iPad'
    : /Android/.test(userAgent)
      ? 'Android'
      : /Windows/.test(userAgent)
        ? 'Windows'
        : /Mac OS X/.test(userAgent)
          ? 'Mac'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : null;
  if (browser && os) return `${browser} sa ${os}`;
  return browser ?? os ?? userAgent.slice(0, 40);
}

export default function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function load() {
    try {
      setSessions(await getSessions());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login', { replace: true });
      else setProblem(errorMessage(err));
    }
  }

  useEffect(() => {
    let ignore = false;
    getSessions()
      .then((list) => !ignore && setSessions(list))
      .catch((err) => {
        if (ignore) return;
        if (err instanceof ApiError && err.status === 401) navigate('/login', { replace: true });
        else setProblem(errorMessage(err));
      });
    return () => {
      ignore = true;
    };
  }, [navigate]);

  async function handleLogout(session: Session) {
    try {
      await revokeSession(session.id);
      if (session.current) navigate('/login'); // ang device na ito mismo — tapos na ang session ko
      else await load(); // ibang device — i-refresh ang listahan
    } catch (err) {
      setProblem(errorMessage(err));
    }
  }

  if (problem) return <p role="alert">❌ {problem}</p>;
  if (!sessions) return <p>Loading…</p>;

  return (
    <section>
      <h2>Mga device ko</h2>
      <Link to="/profile">← Profile</Link>
      <p>
        <small className="note">
          Hindi mo kilala ang isang device? I-logout ito, at <Link to="/change-password">palitan ang password</Link> (nala-logout ang LAHAT). Hula lang ang pangalan ng device, mula sa browser.
        </small>
      </p>
      <ul className="sessions">
        {sessions.map((session) => (
          <li key={session.id}>
            <strong>{deviceName(session.userAgent)}</strong>
            {session.current && <span className="badge">ito ang device mo</span>}
            <br />
            <small className="note">
              IP {session.ip ?? '—'} · naka-login mula {new Date(session.since).toLocaleString()} · huling gamit{' '}
              {new Date(session.lastUsedAt).toLocaleString()}
            </small>
            <br />
            <button onClick={() => handleLogout(session)}>Logout</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
