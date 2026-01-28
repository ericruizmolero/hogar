#!/usr/bin/env node

/**
 * Idealista Scraper
 *
 * Uso:
 *   node scripts/scrape-idealista.mjs <url>
 *   node scripts/scrape-idealista.mjs "https://www.idealista.com/inmueble/12345678/"
 *
 * Con --save para guardar automáticamente:
 *   node scripts/scrape-idealista.mjs "https://www.idealista.com/inmueble/12345678/" --save
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

puppeteer.use(StealthPlugin());

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeIdealista(url, autoSave = false) {
  log(`\n🏠 Scraping: ${url}`, 'cyan');

  const browser = await puppeteer.launch({
    headless: false, // Visible para debug y evitar detección
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1366,900',
    ],
    defaultViewport: { width: 1366, height: 900 },
  });

  const page = await browser.newPage();

  // User agent realista
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  try {
    log('📄 Abriendo página...', 'dim');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Espera un poco para parecer humano
    await delay(2000 + Math.random() * 2000);

    // Aceptar cookies si aparecen
    try {
      const cookieButton = await page.$('#didomi-notice-agree-button');
      if (cookieButton) {
        log('🍪 Aceptando cookies...', 'dim');
        await cookieButton.click();
        await delay(1000);
      }
    } catch (e) {
      // No hay banner de cookies
    }

    // Scroll para cargar contenido lazy
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(1000);

    // Buscar y hacer clic en botón de teléfono
    log('📞 Buscando botón de teléfono...', 'dim');

    let phoneClicked = false;

    // Método 1: Buscar por clase específica de Idealista
    try {
      const phoneBtn = await page.waitForSelector('.phone-btn, .see-phones-btn, [class*="phone-button"]', { timeout: 5000 });
      if (phoneBtn) {
        await phoneBtn.click();
        phoneClicked = true;
        log('✓ Clic en botón de teléfono', 'green');
        await delay(2000);
      }
    } catch (e) {
      // No encontrado
    }

    // Método 2: Buscar cualquier botón que contenga "teléfono" o "phone"
    if (!phoneClicked) {
      try {
        const clicked = await page.evaluate(() => {
          const elements = document.querySelectorAll('button, a, span');
          for (const el of elements) {
            const text = el.textContent?.toLowerCase() || '';
            if (text.includes('ver teléfono') || text.includes('ver tel') || text.includes('mostrar')) {
              if (el.click) {
                el.click();
                return true;
              }
            }
          }
          return false;
        });
        if (clicked) {
          phoneClicked = true;
          log('✓ Clic en botón por texto', 'green');
          await delay(2000);
        }
      } catch (e) {
        // No encontrado
      }
    }

    if (!phoneClicked) {
      log('⚠ No se encontró botón de teléfono. Puede que necesites revelarlo manualmente.', 'yellow');
      log('  El navegador está abierto, haz clic en "Ver teléfono" y luego presiona Enter aquí.', 'yellow');

      // Esperar input del usuario
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });

      await delay(1000);
    }

    // Extraer datos
    log('📊 Extrayendo datos...', 'dim');

    const data = await page.evaluate((sourceUrl) => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent?.trim() || '' : '';
      };

      // Precio
      const priceText = getText('.info-data-price') || getText('[class*="price"]') || getText('h2');
      const price = parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;

      // Título y dirección
      const title = getText('.main-info__title-main') || getText('h1') || getText('.detail-title');
      const addressText = getText('.main-info__title-minor') || getText('.header-map-list') || getText('.location');

      // Separar zona de dirección
      const addressParts = addressText.split(',').map(s => s.trim());
      const zone = addressParts[0] || '';
      const address = addressText;

      // Características - buscar en múltiples lugares
      let squareMeters = 0;
      let builtSquareMeters = 0;
      let usableSquareMeters = 0;
      let rooms = 0;
      let bathrooms = 0;
      let floor = '';

      // Buscar en info-features
      const features = document.querySelectorAll('.info-features span, .info-data span, .details-property_features li');
      features.forEach(item => {
        const text = item.textContent?.toLowerCase() || '';

        if (text.includes('m²') || text.includes('m2')) {
          const match = text.match(/(\d+)/);
          if (match) {
            const val = parseInt(match[1], 10);
            if (text.includes('construido') || text.includes('construid')) {
              builtSquareMeters = val;
            } else if (text.includes('útil')) {
              usableSquareMeters = val;
            } else if (!squareMeters) {
              squareMeters = val;
            }
          }
        }

        if (text.includes('hab') || text.includes('dormitorio')) {
          const match = text.match(/(\d+)/);
          if (match) rooms = parseInt(match[1], 10);
        }

        if (text.includes('baño')) {
          const match = text.match(/(\d+)/);
          if (match) bathrooms = parseInt(match[1], 10);
        }

        if (text.includes('planta') || (text.includes('º') && text.match(/\d+º/))) {
          floor = text.replace(/[^\dºª\s]/g, '').trim();
        }
      });

      // Si no hay m² específicos, usar el general
      if (!builtSquareMeters && squareMeters) builtSquareMeters = squareMeters;
      if (!squareMeters && builtSquareMeters) squareMeters = builtSquareMeters;

      // Características booleanas
      const fullText = document.body.innerText.toLowerCase();
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
      const statsEl = document.querySelector('.stats-text');
      if (statsEl) {
        const match = statsEl.textContent?.match(/(\d+)\s*día/);
        if (match) daysPublished = parseInt(match[1], 10);
      }

      // Fotos
      const photos = [];
      const imgSelectors = [
        '.detail-image-gallery img',
        '.gallery-container img',
        '.image-gallery img',
        'picture img',
        '[class*="gallery"] img',
        '[class*="slider"] img'
      ];

      for (const selector of imgSelectors) {
        document.querySelectorAll(selector).forEach(img => {
          let src = img.src || img.dataset?.src || img.getAttribute('data-lazy');
          if (src) {
            // Obtener imagen en mejor resolución
            src = src.replace(/\/S\//, '/L/').replace('WEB_LISTING', 'WEB_DETAIL');
            if (!src.includes('logo') && !src.includes('icon') && !photos.includes(src)) {
              photos.push(src);
            }
          }
        });
        if (photos.length > 0) break;
      }

      // Contacto
      let contactPhone = '';
      let contactAgency = '';
      let contactName = '';

      // Buscar teléfono en enlaces tel:
      const telLinks = document.querySelectorAll('a[href^="tel:"]');
      telLinks.forEach(link => {
        const phone = link.href.replace('tel:', '').replace(/\s/g, '');
        if (phone && phone.length >= 9 && !contactPhone) {
          contactPhone = phone;
        }
      });

      // Buscar teléfono en texto visible
      if (!contactPhone) {
        const phoneContainers = document.querySelectorAll('[class*="phone"], [class*="contact"]');
        phoneContainers.forEach(el => {
          const text = el.textContent || '';
          const phoneMatch = text.match(/(\d[\d\s]{8,})/);
          if (phoneMatch && !contactPhone) {
            contactPhone = phoneMatch[1].replace(/\s/g, '');
          }
        });
      }

      // Agencia / Profesional
      const agencyEl = document.querySelector('.professional-name a, .advertiser-name, [class*="professional"] .name, .contact-name');
      if (agencyEl) {
        contactAgency = agencyEl.textContent?.trim() || '';
      }

      // Nombre del contacto
      const contactEl = document.querySelector('.professional-name, .contact-person');
      if (contactEl && contactEl.textContent !== contactAgency) {
        contactName = contactEl.textContent?.trim() || '';
      }

      return {
        url: sourceUrl,
        title: title.replace(/\s+/g, ' ').trim(),
        address: address.replace(/\s+/g, ' ').trim(),
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
        photos: [...new Set(photos)].slice(0, 20),
        contact: {
          phone: contactPhone,
          email: '',
          name: contactName,
          agency: contactAgency,
        },
        status: 'pending',
        notes: '',
      };
    }, url);

    // Mostrar resultado
    log('\n✅ Datos extraídos:', 'green');
    console.log('');
    console.log(`  Título: ${data.title}`);
    console.log(`  Zona: ${data.zone}`);
    console.log(`  Precio: ${data.price.toLocaleString('es-ES')}€`);
    console.log(`  M²: ${data.builtSquareMeters} construidos, ${data.usableSquareMeters} útiles`);
    console.log(`  Habitaciones: ${data.rooms} | Baños: ${data.bathrooms}`);
    console.log(`  Planta: ${data.floor || 'N/A'}`);
    console.log(`  Características: ${[
      data.terrace && 'Terraza',
      data.balcony && 'Balcón',
      data.elevator && 'Ascensor',
      data.parkingIncluded && 'Garaje incluido',
      data.parkingOptional && 'Garaje opcional',
      data.needsRenovation && 'Necesita reforma',
    ].filter(Boolean).join(', ') || 'Ninguna'}`);
    console.log(`  Fotos: ${data.photos.length}`);
    console.log('');
    console.log(`  📞 Teléfono: ${data.contact.phone || '❌ No encontrado'}`);
    console.log(`  🏢 Agencia: ${data.contact.agency || 'N/A'}`);
    console.log('');

    // Guardar JSON
    const outputDir = path.join(__dirname, '..', 'scraped');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `property_${Date.now()}.json`;
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    log(`💾 Guardado en: scraped/${filename}`, 'cyan');

    if (!data.contact.phone) {
      log('\n⚠ El teléfono no se encontró automáticamente.', 'yellow');
      log('  Si lo ves en la página, añádelo manualmente al JSON o a la app.', 'dim');
    }

    log('\n🔍 El navegador sigue abierto para que verifiques los datos.', 'dim');
    log('   Ciérralo cuando hayas terminado o presiona Ctrl+C.', 'dim');

    // Mantener abierto
    await browser.waitForTarget(() => false, { timeout: 0 }).catch(() => {});

    return data;

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    await browser.close();
    throw error;
  }
}

// Main
const args = process.argv.slice(2);
const url = args.find(a => a.startsWith('http'));
const autoSave = args.includes('--save');

if (!url) {
  console.log(`
🏠 Idealista Scraper

Uso:
  node scripts/scrape-idealista.mjs <url>

Ejemplo:
  node scripts/scrape-idealista.mjs "https://www.idealista.com/inmueble/12345678/"

El script abrirá un navegador, extraerá los datos del inmueble
(incluido el teléfono si está visible) y guardará un JSON en la carpeta /scraped.
`);
  process.exit(1);
}

if (!url.includes('idealista.com')) {
  log('❌ Error: La URL debe ser de idealista.com', 'red');
  process.exit(1);
}

scrapeIdealista(url, autoSave).catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
});
