import { useEffect, useState } from 'react';

/** Minimal History API router — real, shareable URLs (a QR code pointing
 * at /g/{slug} must actually resolve to that gallery) without pulling in
 * a routing library for what's ~6 routes. */

export function navigate(path: string): void {
  if (window.location.pathname + window.location.search === path) return;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useLocation(): string {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return path;
}
