/**
 * CausalFunnel Tracker v1
 * ─────────────────────────────────────────────────────────────────
 * Usage: Add to any page with:
 *   <script src="http://localhost:3001/tracker.js" defer></script>
 *
 * The script automatically:
 *   1. Assigns (or retrieves) a persistent session_id in localStorage.
 *   2. Fires a `page_view` event on load and on SPA navigations.
 *   3. Fires a `click` event with x/y coordinates on every document click.
 *   4. POSTs all events to the backend /api/events endpoint.
 * ─────────────────────────────────────────────────────────────────
 */
(function () {
  "use strict";

  // ── Config ───────────────────────────────────────────────────
  // Derive the API base from the script's own src attribute so the
  // tracker works regardless of where the backend is hosted.
  const scriptEl =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  let API_BASE = "http://localhost:3001";
  if (scriptEl && scriptEl.src) {
    try {
      const u = new URL(scriptEl.src);
      API_BASE = u.origin;
    } catch (_) {}
  }

  const ENDPOINT = API_BASE + "/api/events";

  // ── Session ID ───────────────────────────────────────────────
  function getSessionId() {
    const KEY = "cf_session_id";
    let id = localStorage.getItem(KEY);
    if (!id) {
      // Generate a UUID-like identifier
      id =
        "sess_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 11);
      localStorage.setItem(KEY, id);
    }
    return id;
  }

  const SESSION_ID = getSessionId();

  // ── Send Event ───────────────────────────────────────────────
  function send(payload) {
    const body = JSON.stringify(payload);

    // Prefer sendBeacon for unload events (non-blocking)
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(ENDPOINT, blob);
      if (ok) return;
    }

    // Fall back to fetch
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(function () {
      // Silently swallow errors — tracker must never break the host page
    });
  }

  // ── Track Page View ──────────────────────────────────────────
  function trackPageView() {
    send({
      session_id: SESSION_ID,
      type: "page_view",
      pageUrl: window.location.pathname + window.location.search,
      timestamp: new Date().toISOString(),
    });
  }

  // ── Track Click ──────────────────────────────────────────────
  function trackClick(event) {
    const containerWidth = 1280;
    const pageX = event.pageX;
    const pageY = event.pageY;

    // Calculate left offset of the centered 1280px page content layout
    const docWidth = document.documentElement.clientWidth || window.innerWidth;
    const leftOffset = docWidth > containerWidth ? (docWidth - containerWidth) / 2 : 0;

    send({
      session_id: SESSION_ID,
      type: "click",
      pageUrl: window.location.pathname + window.location.search,
      timestamp: new Date().toISOString(),
      x: Math.max(0, Math.min(containerWidth, Math.round(pageX - leftOffset))),
      y: Math.round(pageY),
    });
  }

  // ── SPA Navigation Support ───────────────────────────────────
  // Monkey-patch pushState / replaceState so we capture virtual page views
  // in single-page applications.
  (function patchHistory() {
    function wrap(original) {
      return function () {
        const result = original.apply(this, arguments);
        trackPageView();
        return result;
      };
    }
    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
    window.addEventListener("popstate", trackPageView);
    window.addEventListener("hashchange", trackPageView);
  })();

  // ── Initialize ───────────────────────────────────────────────
  // Fire page view immediately (or when DOM is ready)
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    trackPageView();
  } else {
    window.addEventListener("DOMContentLoaded", trackPageView);
  }

  // Attach click listener at document level (event delegation)
  document.addEventListener("click", trackClick, { passive: true });
})();
