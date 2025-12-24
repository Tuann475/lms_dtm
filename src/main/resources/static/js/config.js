// Centralized frontend config for building API URLs that work in both local and production.
// Use relative URLs by default so the browser sends requests to the same origin.

(function () {
  const w = window;

  // If you want to force a different API base (e.g., separate backend), set:
  //   localStorage.setItem('API_BASE_URL', 'https://your-domain');
  // or provide on the page:
  //   <meta name="api-base-url" content="https://your-domain">
  const meta = document.querySelector('meta[name="api-base-url"]');
  const metaBase = meta ? meta.getAttribute('content') : null;
  const storedBase = w.localStorage ? w.localStorage.getItem('API_BASE_URL') : null;

  const normalized = (v) => {
    if (!v) return '';
    return v.endsWith('/') ? v.slice(0, -1) : v;
  };

  // Same-origin by default.
  w.API_BASE_URL = normalized(storedBase || metaBase || w.location.origin);

  w.apiUrl = function apiUrl(path) {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${w.API_BASE_URL}${p}`;
  };
})();

