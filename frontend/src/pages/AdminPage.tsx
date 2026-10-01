import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError, errorMessage } from '../api/auth.ts';
import { getAdminUsers, getAuditLogs } from '../api/admin.ts';
import type { AdminUser, AuditLog, PageInfo } from '../api/admin.ts';

// Admin page (Day 49): listahan ng users at audit log, may Prev/Next.
// 🔐 Walang "admin check" dito — ang BACKEND ang nagpapasya (401/403). Kahit i-type ng hindi admin ang /admin,
// o baguhin ang code ng page na ito sa browser, 403 pa rin ang sagot ng API at walang data na lalabas.

type Problem = 'forbidden' | string | null;

// Ano ang gagawin sa error? Pure function (walang state), kaya puwedeng gamitin sa loob ng useEffect
// nang hindi kailangang ilista bilang dependency
function whatToDo(err: unknown): 'login' | 'forbidden' | string {
  if (err instanceof ApiError && err.status === 401) return 'login'; // hindi naka-login
  if (err instanceof ApiError && err.status === 403) return 'forbidden'; // naka-login, pero hindi admin
  return errorMessage(err);
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [users, setUsers] = useState<(PageInfo & { users: AdminUser[] }) | null>(null);
  const [logs, setLogs] = useState<(PageInfo & { logs: AuditLog[] }) | null>(null);

  // Tuwing magbabago ang page ng users. `ignore`: kapag mabilis na pinindot ang Next, ang lumang sagot
  // na huling dumating ay hindi dapat pumalit sa bago (race condition sa frontend)
  useEffect(() => {
    let ignore = false;
    getAdminUsers(usersPage)
      .then((data) => !ignore && setUsers(data))
      .catch((err) => {
        if (ignore) return;
        const todo = whatToDo(err);
        if (todo === 'login') navigate('/login', { replace: true });
        else setProblem(todo);
      });
    return () => {
      ignore = true;
    };
  }, [usersPage, navigate]);

  useEffect(() => {
    let ignore = false;
    getAuditLogs(logsPage)
      .then((data) => !ignore && setLogs(data))
      .catch((err) => {
        if (ignore) return;
        const todo = whatToDo(err);
        if (todo === 'login') navigate('/login', { replace: true });
        else setProblem(todo);
      });
    return () => {
      ignore = true;
    };
  }, [logsPage, navigate]);

  if (problem === 'forbidden') {
    return (
      <section>
        <h2>Admin</h2>
        <p>⛔ 403 — admin lang ang puwede rito.</p>
        <p>
          <small className="note">Ang backend ang humarang (requireRole), hindi ang page na ito.</small>
        </p>
        <Link to="/profile">← Bumalik sa Profile</Link>
      </section>
    );
  }
  if (problem) return <p role="alert">❌ {problem}</p>;
  if (!users || !logs) return <p>Loading…</p>;

  return (
    <section>
      <h2>Admin</h2>
      <Link to="/profile">← Profile</Link>

      <h3>Users ({users.total})</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>email</th>
              <th>name</th>
              <th>role</th>
              <th>ginawa</th>
            </tr>
          </thead>
          <tbody>
            {users.users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.name ?? '—'}</td>
                <td>{u.role}</td>
                <td>{new Date(u.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager info={users} onPage={setUsersPage} />

      <h3>Audit log ({logs.total})</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>kailan</th>
              <th>action</th>
              <th>sino</th>
              <th>target</th>
              <th>ip</th>
              <th>detalye</th>
            </tr>
          </thead>
          <tbody>
            {logs.logs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.action}</td>
                <td>{l.actorEmail ?? '—'}</td>
                <td>{l.targetId ?? '—'}</td>
                <td>{l.ip ?? '—'}</td>
                <td>{l.metadata ? JSON.stringify(l.metadata) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager info={logs} onPage={setLogsPage} />
    </section>
  );
}

// Prev / Next — hindi mapipindot sa unang at huling page
function Pager({ info, onPage }: { info: PageInfo; onPage: (page: number) => void }) {
  const last = Math.max(info.totalPages, 1);
  return (
    <p className="pager">
      <button onClick={() => onPage(info.page - 1)} disabled={info.page <= 1}>
        ← Prev
      </button>{' '}
      Page {info.page} of {last}{' '}
      <button onClick={() => onPage(info.page + 1)} disabled={info.page >= last}>
        Next →
      </button>
    </p>
  );
}
