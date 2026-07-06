const FORMSPARK_URL = "https://submit-form.com/0Qhds1mwa";
async function submitToFormspark(payload) {
  try {
    await fetch(FORMSPARK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {}
}
window.submitToFormspark = submitToFormspark;