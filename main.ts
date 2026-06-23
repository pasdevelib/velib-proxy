// Vélib' API Proxy — Deno Deploy
// Deploy : https://deno.com/deploy
// Endpoint : https://velib-proxy.deno.dev

const ALLOWED_ORIGINS = [
  "https://pasdevelib.app",
  "https://beta.pasdevelib.app",
  "http://localhost:3000",
];

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));

  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const params = new URLSearchParams({
    gpsTopLatitude:  url.searchParams.get("gpsTopLatitude")  ?? "48.862",
    gpsTopLongitude: url.searchParams.get("gpsTopLongitude") ?? "2.352",
    gpsBotLatitude:  url.searchParams.get("gpsBotLatitude")  ?? "48.858",
    gpsBotLongitude: url.searchParams.get("gpsBotLongitude") ?? "2.344",
    fields:          url.searchParams.get("fields")          ?? "bike",
    zoomLevel:       url.searchParams.get("zoomLevel")       ?? "16",
  });

  const velibUrl = `https://www.velib-metropole.fr/api/map/details?${params}`;

  try {
    const res = await fetch(velibUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9",
        "Referer": "https://www.velib-metropole.fr/",
        "Origin": "https://www.velib-metropole.fr",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
    });

    const body = await res.text();

    return new Response(body, {
      status: res.ok ? 200 : res.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30",
        "X-Velib-Status": String(res.status),
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
