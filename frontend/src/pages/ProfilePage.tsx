import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getMe, logout } from '../api/auth.ts';
import type { User } from '../api/auth.ts';

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
      <button onClick={handleLogout}>Logout</button>
    </section>
  );
}
