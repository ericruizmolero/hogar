export const config = {
  runtime: 'edge',
};

const ALLOWED_DOMAINS = [
  'idealista.com',
  'fotocasa.es',
  'pisos.com',
  'habitaclia.com',
  'apinmo.com',
  'inmotek.net',
];

const DOMAIN_REFERERS: Record<string, string> = {
  'idealista.com': 'https://www.idealista.com/',
  'fotocasa.es': 'https://www.fotocasa.es/',
  'pisos.com': 'https://www.pisos.com/',
  'habitaclia.com': 'https://www.habitaclia.com/',
  'apinmo.com': 'https://www.grupotome.com/',
  'inmotek.net': 'https://www.areizaga.com/',
};

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  if (!ALLOWED_DOMAINS.some((d) => imageUrl.includes(d))) {
    return new Response('Domain not allowed', { status: 403 });
  }

  const referer =
    Object.entries(DOMAIN_REFERERS).find(([d]) => imageUrl.includes(d))?.[1] || '';

  try {
    let targetUrl = imageUrl;

    // Idealista photo page → extract real image URL
    if (
      imageUrl.includes('idealista.com') &&
      imageUrl.includes('/inmueble/') &&
      imageUrl.includes('/foto/')
    ) {
      const pageRes = await fetch(imageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Referer: referer,
        },
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const match = html.match(
          /https?:\/\/img\d?\.idealista\.com\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/i,
        );
        if (match) {
          targetUrl = match[0];
        } else {
          return new Response('No image found in photo page', { status: 404 });
        }
      }
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: referer,
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch: ${response.status}`, {
        status: response.status,
      });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, s-maxage=2592000, max-age=2592000, immutable',
        Vary: 'Accept',
      },
    });
  } catch (error) {
    return new Response(`Error: ${error}`, { status: 500 });
  }
}
