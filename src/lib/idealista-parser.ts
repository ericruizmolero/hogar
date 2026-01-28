/**
 * Parser de HTML de Idealista
 *
 * Uso: El usuario copia el HTML de la página (Ctrl+U o inspeccionar)
 * después de revelar el teléfono, y lo pega aquí.
 */

import type { Property } from '../types';

export function parseIdealistaHtml(html: string, providedUrl: string): Partial<Property> {
  // Crear un DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const getText = (selector: string): string => {
    const el = doc.querySelector(selector);
    return el?.textContent?.trim() || '';
  };

  // Extraer URL del HTML si no se proporcionó
  let url = providedUrl;
  if (!url) {
    // Buscar en canonical link
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (canonical) {
      url = canonical.getAttribute('href') || '';
    }
    // Buscar en og:url
    if (!url) {
      const ogUrl = doc.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        url = ogUrl.getAttribute('content') || '';
      }
    }
    // Buscar en el HTML directo (a veces está en scripts)
    if (!url) {
      const urlMatch = html.match(/https:\/\/www\.idealista\.com\/inmueble\/\d+\/?/);
      if (urlMatch) {
        url = urlMatch[0];
      }
    }
  }

  const getNumber = (text: string): number => {
    const match = text.match(/[\d.,]+/);
    if (match) {
      return parseInt(match[0].replace(/\./g, '').replace(',', '.'), 10) || 0;
    }
    return 0;
  };

  // Precio
  const priceText = getText('.info-data-price') || getText('[class*="price"]');
  const price = getNumber(priceText);

  // Título
  const title = getText('.main-info__title-main') || getText('h1') || getText('.detail-title');

  // Dirección
  const addressText = getText('.main-info__title-minor') || getText('.header-map-list');
  const addressParts = addressText.split(',').map(s => s.trim());
  const zone = addressParts[0] || '';

  // Características
  let squareMeters = 0;
  let builtSquareMeters = 0;
  let usableSquareMeters = 0;
  let rooms = 0;
  let bathrooms = 0;
  let floor = '';

  // Buscar en info-features
  const features = doc.querySelectorAll('.info-features span, .info-data span, .details-property_features li, .details-property li');
  features.forEach(item => {
    const text = item.textContent?.toLowerCase() || '';

    if (text.includes('m²') || text.includes('m2')) {
      const val = getNumber(text);
      if (text.includes('construido') || text.includes('construid')) {
        builtSquareMeters = val;
      } else if (text.includes('útil')) {
        usableSquareMeters = val;
      } else if (!squareMeters) {
        squareMeters = val;
      }
    }

    if (text.includes('hab') || text.includes('dormitorio')) {
      rooms = getNumber(text);
    }

    if (text.includes('baño')) {
      bathrooms = getNumber(text);
    }

    if (text.includes('planta') || text.match(/\d+º/)) {
      floor = text.replace(/[^\dºª\s]/g, '').trim();
    }
  });

  if (!builtSquareMeters && squareMeters) builtSquareMeters = squareMeters;
  if (!squareMeters && builtSquareMeters) squareMeters = builtSquareMeters;

  // Texto completo para buscar características
  const fullText = doc.body?.innerText?.toLowerCase() || html.toLowerCase();

  const terrace = fullText.includes('terraza');
  const balcony = fullText.includes('balcón') || fullText.includes('balcon');
  const elevator = fullText.includes('ascensor');
  const parkingIncluded = fullText.includes('garaje incluido') || fullText.includes('plaza de garaje incluida');
  const parkingOptional = fullText.includes('garaje opcional') || (fullText.includes('garaje') && !parkingIncluded);
  const needsRenovation = fullText.includes('a reformar') || fullText.includes('para reformar') || fullText.includes('necesita reforma');

  // Año construcción
  let yearBuilt = 0;
  const yearMatch = fullText.match(/construido en (\d{4})/i) ||
                    fullText.match(/año de construcción[:\s]*(\d{4})/i) ||
                    fullText.match(/antigüedad[:\s]*(\d{4})/i);
  if (yearMatch) yearBuilt = parseInt(yearMatch[1], 10);

  // Orientación
  let orientation = '';
  const orientMatch = fullText.match(/orientación[:\s]*(norte|sur|este|oeste|noroeste|noreste|suroeste|sureste)/i);
  if (orientMatch) orientation = orientMatch[1];

  // Días publicado
  let daysPublished = 0;
  const statsText = getText('.stats-text');
  const daysMatch = statsText.match(/(\d+)\s*día/);
  if (daysMatch) daysPublished = parseInt(daysMatch[1], 10);

  // Fotos - extraer URLs de imagen reales del HTML
  const photos: string[] = [];
  const seenIds = new Set<string>();

  const addPhoto = (imgUrl: string) => {
    if (!imgUrl) return;
    // Solo imágenes de idealista, no logos ni iconos
    if (!imgUrl.includes('idealista.com')) return;
    if (imgUrl.includes('logo') || imgUrl.includes('icon') || imgUrl.includes('avatar')) return;
    if (imgUrl.includes('profilephotos') || imgUrl.includes('loading')) return;

    // Extraer ID único de la imagen para evitar duplicados
    const idMatch = imgUrl.match(/\/(\d{8,})\.(jpg|jpeg|png|webp)/i);
    if (idMatch) {
      if (seenIds.has(idMatch[1])) return;
      seenIds.add(idMatch[1]);
    }

    // Mejorar resolución
    let cleanUrl = imgUrl
      .replace(/WEB_LISTING/g, 'WEB_DETAIL')
      .replace(/WEB_DETAIL_TOP/g, 'WEB_DETAIL')
      .replace(/\/S\//g, '/L/')
      .replace(/\/M\//g, '/L/');

    if (!photos.includes(cleanUrl)) {
      photos.push(cleanUrl);
    }
  };

  // Buscar URLs de imagen en el HTML completo
  const imgPattern = /https?:\/\/img\d*\.idealista\.com\/[^"'\s<>]+\.(jpg|jpeg|png|webp)/gi;
  const matches = html.matchAll(imgPattern);
  for (const match of matches) {
    addPhoto(match[0]);
  }

  // Buscar en img tags
  doc.querySelectorAll('img').forEach(img => {
    addPhoto(img.src);
    addPhoto(img.getAttribute('data-src') || '');
    addPhoto(img.getAttribute('data-lazy') || '');
  });

  // Buscar en source srcset
  doc.querySelectorAll('source[srcset]').forEach(source => {
    const srcset = source.getAttribute('srcset') || '';
    srcset.split(',').forEach(part => {
      const imgUrl = part.trim().split(' ')[0];
      addPhoto(imgUrl);
    });
  });

  // Contacto - buscar teléfono
  let contactPhone = '';
  let contactAgency = '';
  let contactName = '';

  // Buscar en enlaces tel: (teléfono revelado)
  doc.querySelectorAll('a[href^="tel:"]').forEach(link => {
    const phone = link.getAttribute('href')?.replace('tel:', '').replace(/\s/g, '') || '';
    if (phone && phone.length >= 9 && !contactPhone) {
      contactPhone = phone;
    }
  });

  // Buscar en contenedores de teléfono de Idealista
  if (!contactPhone) {
    const phoneContainers = doc.querySelectorAll('.phone-btn, .phone-number, [class*="phone"], [class*="contact-phones"]');
    phoneContainers.forEach(container => {
      const text = container.textContent || '';
      // Buscar patrón de teléfono español (9 dígitos, puede tener espacios)
      const phoneMatch = text.match(/(\d[\d\s]{8,})/);
      if (phoneMatch && !contactPhone) {
        const cleaned = phoneMatch[1].replace(/\s/g, '');
        if (cleaned.length >= 9 && cleaned.length <= 12) {
          contactPhone = cleaned;
        }
      }
    });
  }

  // Buscar en el HTML completo con regex más agresivo
  if (!contactPhone) {
    // Patrón para teléfonos españoles: 6XX XXX XXX, 9XX XXX XXX, etc.
    const phonePatterns = [
      /\b([679]\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b/g,  // Móviles y fijos españoles
      /\b(\d{3}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})\b/g,  // Formato XXX XX XX XX
    ];

    for (const pattern of phonePatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const cleaned = match[1].replace(/[\s.-]/g, '');
        if (cleaned.length >= 9 && cleaned.length <= 12 && !contactPhone) {
          contactPhone = cleaned;
          break;
        }
      }
      if (contactPhone) break;
    }
  }

  // Buscar en data attributes o scripts
  if (!contactPhone) {
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      const phoneMatch = content.match(/"phone"\s*:\s*"(\d+)"/) ||
                         content.match(/"phoneNumber"\s*:\s*"(\d+)"/) ||
                         content.match(/phone['"]\s*:\s*['"]([\d\s]+)['"]/i);
      if (phoneMatch && !contactPhone) {
        contactPhone = phoneMatch[1].replace(/\s/g, '');
      }
    });
  }

  // Agencia
  const agencyEl = doc.querySelector('.professional-name a, .advertiser-name, [class*="professional"] .name, .owner-name');
  if (agencyEl) {
    contactAgency = agencyEl.textContent?.trim() || '';
  }

  return {
    url,
    title: title.replace(/\s+/g, ' ').trim(),
    address: addressText.replace(/\s+/g, ' ').trim(),
    zone,
    price,
    pricePerMeter: builtSquareMeters > 0 ? Math.round(price / builtSquareMeters) : 0,
    squareMeters: squareMeters || builtSquareMeters,
    builtSquareMeters,
    usableSquareMeters,
    rooms,
    bathrooms,
    floor,
    terrace,
    balcony,
    elevator,
    parkingIncluded,
    parkingOptional,
    needsRenovation,
    yearBuilt,
    orientation,
    daysPublished,
    photos: [...new Set(photos)], // Sin límite - se cargan via proxy
    contact: {
      phone: contactPhone,
      email: '',
      name: contactName,
      agency: contactAgency,
    },
    status: 'pending',
    notes: '',
  };
}
