// Centralized frontend config for building API URLs that work in both local and production.
// Use same-origin and preserve context-path by default.

(function () {
  const w = window;

  // Override options:
  //  - localStorage.setItem('API_BASE_URL', 'https://your-domain[/optional-context]')
  //  - <meta name="api-base-url" content="https://your-domain[/optional-context]">
  const meta = document.querySelector('meta[name="api-base-url"]');
  const metaBase = meta ? meta.getAttribute('content') : null;
  const storedBase = w.localStorage ? w.localStorage.getItem('API_BASE_URL') : null;

  const normalized = (v) => {
    if (!v) return '';
    return v.endsWith('/') ? v.slice(0, -1) : v;
  };

  // If app is deployed under a sub-path, keep it (e.g. https://host/lms/login -> base https://host/lms)
  const defaultBase = `${w.location.origin}${w.location.pathname.replace(/\/[^/]*$/, '')}`;

  w.API_BASE_URL = normalized(storedBase || metaBase || defaultBase);

  w.apiUrl = function apiUrl(path) {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${w.API_BASE_URL}${p}`;
  };
})();
