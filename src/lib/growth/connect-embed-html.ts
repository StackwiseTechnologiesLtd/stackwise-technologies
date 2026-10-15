/** Inline viewer for hosted / relay connect (same-origin API base). */
export function connectEmbedHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Stackwise connect</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #0a0a0a; color: #e5e5e5; font-family: system-ui, sans-serif; }
    #bar { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
    #stage { position: relative; width: 100%; aspect-ratio: 1100 / 720; max-height: calc(100vh - 40px); background: #111; }
    canvas { width: 100%; height: 100%; display: block; cursor: default; }
    #status { color: #a3a3a3; }
    .done { color: #34d399; }
    .err { color: #fbbf24; }
    #hint { color: #737373; font-size: 12px; }
  </style>
</head>
<body>
  <div id="bar">
    <span id="status">Starting browser…</span>
    <span id="hint">Click inside to interact · sign in as usual</span>
  </div>
  <div id="stage">
    <canvas id="c" width="1100" height="720" tabindex="0"></canvas>
  </div>
  <script>
    const sessionId = new URLSearchParams(location.search).get("session");
    const apiBase = location.pathname.replace(/\\/v1\\/embed$/, "");
    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d");
    const statusEl = document.getElementById("status");
    const scaleX = () => canvas.width / canvas.clientWidth;
    const scaleY = () => canvas.height / canvas.clientHeight;

    async function poll() {
      if (!sessionId) return;
      try {
        const st = await fetch(apiBase + "/v1/status/" + sessionId, { credentials: "same-origin" }).then((r) => r.json());
        if (st.status === "complete") {
          statusEl.textContent = "Connected — you can close this panel.";
          statusEl.className = "done";
          window.parent.postMessage({ type: "growth-connect-complete", sessionId }, "*");
          return;
        }
        if (st.status === "error") {
          statusEl.textContent = st.lastError || "Connection failed";
          statusEl.className = "err";
          window.parent.postMessage({ type: "growth-connect-error", message: st.lastError }, "*");
          return;
        }
        if (st.status === "login") statusEl.textContent = "Waiting for you to sign in…";
        if (st.status === "syncing") statusEl.textContent = "Saving session…";
      } catch (_) {}
      setTimeout(poll, 800);
    }

    async function paint() {
      if (!sessionId) return;
      try {
        const res = await fetch(apiBase + "/v1/frame/" + sessionId, { credentials: "same-origin" });
        if (res.ok) {
          const blob = await res.blob();
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(img.src);
          };
          img.src = URL.createObjectURL(blob);
        }
      } catch (_) {}
      requestAnimationFrame(() => setTimeout(paint, 200));
    }

    async function sendInput(payload) {
      await fetch(apiBase + "/v1/input/" + sessionId, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    canvas.addEventListener("click", (e) => {
      const x = Math.round(e.offsetX * scaleX());
      const y = Math.round(e.offsetY * scaleY());
      void sendInput({ type: "click", x, y });
    });

    canvas.addEventListener("keydown", (e) => {
      void sendInput({ type: "key", key: e.key, code: e.code });
      e.preventDefault();
    });

    poll();
    paint();
    canvas.focus();
  </script>
</body>
</html>`;
}
