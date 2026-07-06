// Session guard + helpers
async function requireAuth(opts = {}) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = pathTo("login.html"); return null; }
  if (opts.admin) {
    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
    if (!roles || roles.length === 0) { location.href = pathTo("app/dashboard.html"); return null; }
  }
  return session;
}
async function isAdmin(uid) {
  const { data } = await sb.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin");
  return data && data.length > 0;
}
async function signOutAndGo() {
  await sb.auth.signOut();
  location.href = pathTo("login.html");
}
// Resolve absolute path from /static/ root regardless of current page depth
function pathTo(rel) { return "/static/" + rel; }
window.requireAuth = requireAuth;
window.isAdmin = isAdmin;
window.signOutAndGo = signOutAndGo;
window.pathTo = pathTo;