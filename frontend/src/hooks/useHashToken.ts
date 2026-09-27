import { useEffect, useState } from 'react';
import { takeTokenFromHash } from '../api/auth.ts';

// Token mula sa …#token=… ng link sa email (Day 61). Binabasa sa unang render, at tinatanggal agad sa address bar.
// Binabantayan din ang `hashchange`: kapag nag-paste ng BAGONG link sa parehong tab, # lang ang nagbago —
// walang reload, kaya kung wala ito, ang LUMANG token pa rin ang gagamitin ng page
export function useHashToken(): string {
  const [token, setToken] = useState(takeTokenFromHash);
  useEffect(() => {
    function onHashChange() {
      const next = takeTokenFromHash();
      if (next) setToken(next);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return token;
}
