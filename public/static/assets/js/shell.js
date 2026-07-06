// Renders sidebar + topbar around page content. Call renderShell({active:"dashboard"}) after auth.
const NAV = [
  { section: "Invest" },
  { id: "dashboard", label: "Dashboard", href: "app/dashboard.html", icon: "◈" },
  { id: "portfolio", label: "Portfolio", href: "app/portfolio.html", icon: "▤" },
  { id: "markets", label: "Markets", href: "app/markets.html", icon: "◐" },
  { id: "watchlist", label: "Watchlist", href: "app/watchlist.html", icon: "★" },
  { id: "search", label: "Search", href: "app/search.html", icon: "⌕" },
  { id: "news", label: "News", href: "app/news.html", icon: "◫" },
  { section: "Account" },
  { id: "orders", label: "Orders", href: "app/orders.html", icon: "☰" },
  { id: "history", label: "History", href: "app/history.html", icon: "⌛" },
  { id: "recurring", label: "Recurring", href: "app/recurring.html", icon: "↻" },
  { id: "notifications", label: "Notifications", href: "app/notifications.html", icon: "◔" },
  { section: "Money" },
  { id: "deposit", label: "Deposit", href: "app/deposit/index.html", icon: "↓" },
  { id: "withdraw", label: "Withdraw", href: "app/withdraw.html", icon: "↑" },
  { id: "banks", label: "Banks", href: "app/banks.html", icon: "▦" },
  { section: "Settings" },
  { id: "account", label: "Account", href: "app/account.html", icon: "◉" },
  { id: "profile", label: "Profile", href: "app/profile.html", icon: "☺" },
  { id: "security", label: "Security", href: "app/security.html", icon: "⚿" },
  { id: "documents", label: "Documents", href: "app/documents.html", icon: "▤" },
  { id: "settings", label: "Settings", href: "app/settings.html", icon: "⚙" },
];

async function renderShell({ active, session }) {
  const admin = await isAdmin(session.user.id);
  const nav = NAV.map(n => {
    if (n.section) return `<div class="nav-section">${n.section}</div>`;
    const cls = n.id === active ? "active" : "";
    return `<a href="${pathTo(n.href)}" class="${cls}"><span>${n.icon}</span>${n.label}</a>`;
  }).join("");
  const adminBlock = admin ? `
    <div class="nav-section">Admin</div>
    <a href="${pathTo('admin/index.html')}"><span>◆</span>Admin</a>` : "";
  const initial = (session.user.email || "?")[0].toUpperCase();
  document.body.insertAdjacentHTML("afterbegin", `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><span class="brand-dot"></span>Robinhood</div>
        <nav class="nav">${nav}${adminBlock}</nav>
        <div style="margin-top:24px;padding:12px">
          <button class="btn btn-ghost btn-sm btn-block" onclick="signOutAndGo()">Sign out</button>
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          <input class="search-input" placeholder="Search stocks & crypto" onkeydown="if(event.key==='Enter')location.href=pathTo('app/search.html?q='+encodeURIComponent(this.value))">
          <div class="spacer"></div>
          <div class="user-menu" onclick="location.href=pathTo('app/account.html')">
            <div class="avatar">${initial}</div>
            <span>${session.user.email}</span>
          </div>
        </div>
        <div id="content"></div>
      </main>
    </div>
  `);
}
window.renderShell = renderShell;

function money(n) {
  if (n == null || isNaN(n)) return "$0.00";
  return "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pct(n) {
  const s = n >= 0 ? "+" : "";
  return s + Number(n).toFixed(2) + "%";
}
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
window.money = money; window.pct = pct; window.esc = esc;

// Simple canvas sparkline
function sparkline(canvas, points, color = "#00c805") {
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.offsetWidth * 2;
  const h = canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  const W = w / 2, H = h / 2;
  if (!points || points.length < 2) return;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
  points.forEach((v, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 10) - 5;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  // fill
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = color + "20"; ctx.fill();
}
window.sparkline = sparkline;