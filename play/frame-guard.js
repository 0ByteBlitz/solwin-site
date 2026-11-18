// GitHub Pages can't send X-Frame-Options or CSP frame-ancestors, so refuse to run
// inside a frame (stops clickjacking of wallet prompts).
if (window.top !== window.self) {
    document.documentElement.replaceChildren();
    try { window.top.location.href = window.location.href; } catch { /* cross-origin parent: stay blank */ }
}
