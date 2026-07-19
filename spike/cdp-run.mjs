/*
Headless S1 driver over the Chrome DevTools Protocol. Launches nothing itself - point it
at an already-running `chrome --headless --remote-debugging-port=9222` and a URL, and it
polls document.title until the page's auto-run writes the S1 verdict. Node 22 ships a
global WebSocket, so no dependency is needed.
*/
const PORT = process.env.CDP_PORT || 9222;
const URL_TO_OPEN = process.argv[2] || "http://127.0.0.1:4180/?auto";

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_TO_OPEN)}`, { method: "PUT" })).json();
const ws = new WebSocket(targets.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });

ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled") console.log("  [console]", m.params.args.map((a) => a.value ?? a.description).join(" "));
  if (m.method === "Runtime.exceptionThrown") console.log("  [EXCEPTION]", m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});

await new Promise((r) => ws.addEventListener("open", r));
await send("Runtime.enable");

const deadline = Date.now() + 60000;
let verdict = null;
while (Date.now() < deadline) {
  const r = await send("Runtime.evaluate", { expression: "document.title", returnByValue: true });
  const title = r?.result?.value ?? "";
  if (title.startsWith("S1:")) { verdict = title; break; }
  await new Promise((r) => setTimeout(r, 500));
}
console.log(verdict ?? "TIMEOUT (no S1 verdict in 60s)");
ws.close();
process.exit(verdict && verdict.includes("PASS") ? 0 : 1);
