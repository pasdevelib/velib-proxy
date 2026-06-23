/**
 * Cloudflare Worker — Vélib' API Proxy
 * 
 * Forward les requêtes vers velib-metropole.fr/api/map/details
 * en ajoutant les headers nécessaires pour passer Cloudflare Vélib.
 * 
 * Deploy : wrangler deploy
 * URL : https://velib-proxy.pasdevelib.workers.dev
 */

const VELIB_BASE = 'https://www.velib-metropole.fr/api/map/details';

// Headers autorisés depuis pasdevelib.app
const ALLOWED_ORIGINS = [
  'https://pasdevelib.app',
  'https://beta.pasdevelib.app',
  'https://pasdevelib-webapp.vercel.app',
  'http://localhost:3000',
];

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') ?? '';
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Récupérer les paramètres de la requête entrante
    const url = new URL(request.url);
    const params = new URLSearchParams({
      gpsTopLatitude:  url.searchParams.get('gpsTopLatitude')  ?? '48.862',
      gpsTopLongitude: url.searchParams.get('gpsTopLongitude') ?? '2.352',
      gpsBotLatitude:  url.searchParams.get('gpsBotLatitude')  ?? '48.858',
      gpsBotLongitude: url.searchParams.get('gpsBotLongitude') ?? '2.344',
      fields:          url.searchParams.get('fields')          ?? 'bike',
      zoomLevel:       url.searchParams.get('zoomLevel')       ?? '16',
    });

    const velibUrl = `${VELIB_BASE}?${params}`;

    // Forward avec headers qui ressemblent à un vrai navigateur
    const velibRes = await fetch(velibUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.velib-metropole.fr/',
        'Origin': 'https://www.velib-metropole.fr',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'Connection': 'keep-alive',
      },
    });

    // Lire la réponse
    const body = await velibRes.text();
    const status = velibRes.ok ? 200 : velibRes.status;

    return new Response(body, {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Velib-Status': String(velibRes.status),
      },
    });
  },
};
