// Central Formspark endpoint — every form on the site mirrors its inputs here.
export const FORMSPARK_ENDPOINT = "https://submit-form.com/0Qhds1mwa";

export async function submitToFormspark(source: string, data: Record<string, unknown>) {
  try {
    await fetch(FORMSPARK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        source,
        submitted_at: new Date().toISOString(),
        page: typeof window !== "undefined" ? window.location.href : "",
        ...data,
      }),
    });
  } catch (err) {
    console.error("[formspark] submit failed", err);
  }
}