# velib-proxy

Cloudflare Worker qui proxifie l'API privée Vélib' Métropole (`map/details`)
pour contourner les restrictions CORS depuis pasdevelib.app.

## Deploy

```bash
npm install
npx wrangler login
npx wrangler deploy
```

## Usage

```
GET https://velib-proxy.pasdevelib.workers.dev?gpsTopLatitude=48.862&gpsTopLongitude=2.352&gpsBotLatitude=48.858&gpsBotLongitude=2.344&fields=bike&zoomLevel=16
```

## Origine autorisée
- https://pasdevelib.app
- https://beta.pasdevelib.app
