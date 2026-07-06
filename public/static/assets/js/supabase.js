// Supabase client (UMD build loaded via CDN before this file)
const SUPABASE_URL = "https://kscktatolddsillqtvmq.supabase.co";
const SUPABASE_KEY = "sb_publishable_TkBGIZ89CjSSHDpjgAX3qQ_9XCUwaRA";

function isNewSupabaseApiKey(value) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey) {
  return (input, init) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    if (init && init.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // Opaque publishable keys are not JWT bearer tokens.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, Object.assign({}, init, { headers }));
  };
}

window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: { fetch: createSupabaseFetch(SUPABASE_KEY) },
  auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage, storageKey: "sb-static-auth" }
});