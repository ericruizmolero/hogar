"""
Scraper de Idealista usando Playwright (navegador real)
"""
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import re
from datetime import datetime


class IdealistaPlaywrightScraper:
    """Scraper usando Playwright para evitar bloqueos"""

    def scrape_property_url(self, url):
        """Extrae datos de una URL de propiedad usando un navegador real"""
        try:
            print(f"🔍 Scrapeando con navegador: {url}")

            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    viewport={'width': 1920, 'height': 1080},
                    locale='es-ES'
                )
                page = context.new_page()

                # Navegar a la página
                page.goto(url, wait_until='domcontentloaded', timeout=30000)

                # Esperar a que cargue el contenido principal
                page.wait_for_timeout(2000)

                # Obtener el HTML
                html = page.content()
                browser.close()

            # Parsear con BeautifulSoup
            soup = BeautifulSoup(html, 'lxml')

            property_data = {
                'id': self._extract_property_id(url),
                'titulo': self._extract_title(soup),
                'precio': self._extract_price(soup),
                'tamaño': self._extract_size(soup),
                'habitaciones': self._extract_rooms(soup),
                'baños': self._extract_bathrooms(soup),
                'direccion': self._extract_address(soup),
                'distrito': self._extract_district(soup),
                'planta': self._extract_floor(soup),
                'exterior': self._extract_feature(soup, 'exterior'),
                'ascensor': self._extract_feature(soup, 'ascensor'),
                'parking': self._extract_feature(soup, 'garaje') or self._extract_feature(soup, 'parking'),
                'url': url,
                'thumbnail': self._extract_main_image(soup),
                'descripcion': self._extract_description(soup),
                'fecha_actualizacion': datetime.now().strftime('%Y-%m-%d'),
                'precio_m2': 0
            }

            # Calcular precio/m²
            if property_data['tamaño'] and property_data['tamaño'] > 0:
                property_data['precio_m2'] = round(property_data['precio'] / property_data['tamaño'], 2)

            print(f"✅ Datos extraídos: {property_data['titulo']} - {property_data['precio']}€")
            return property_data

        except Exception as e:
            print(f"❌ Error scrapeando {url}: {e}")
            return None

    def _extract_property_id(self, url):
        match = re.search(r'/inmueble/(\d+)', url)
        return match.group(1) if match else url.split('/')[-2]

    def _extract_title(self, soup):
        # Intentar varios selectores
        selectors = [
            'h1.main-info__title-main',
            'span.main-info__title-main',
            'h1[class*="title"]',
            '.detail-info-title'
        ]
        for sel in selectors:
            el = soup.select_one(sel)
            if el:
                return el.text.strip()
        return 'Sin título'

    def _extract_price(self, soup):
        selectors = [
            'span.info-data-price',
            '[class*="price"]',
            '.price'
        ]
        for sel in selectors:
            el = soup.select_one(sel)
            if el:
                price_text = el.text
                price_clean = re.sub(r'[^\d]', '', price_text)
                if price_clean:
                    return int(price_clean)
        return 0

    def _extract_size(self, soup):
        # Buscar en el texto de la página
        text = soup.get_text()
        match = re.search(r'(\d+)\s*m²\s*(?:construidos|útiles)?', text)
        if match:
            return int(match.group(1))

        # Buscar en elementos específicos
        for el in soup.find_all(['span', 'div', 'li']):
            if 'm²' in el.text and 'construidos' in el.text.lower():
                match = re.search(r'(\d+)', el.text)
                if match:
                    return int(match.group(1))
        return 0

    def _extract_rooms(self, soup):
        text = soup.get_text()
        match = re.search(r'(\d+)\s*(?:habitacion|hab\.)', text, re.IGNORECASE)
        return int(match.group(1)) if match else 0

    def _extract_bathrooms(self, soup):
        text = soup.get_text()
        match = re.search(r'(\d+)\s*(?:baño|wc)', text, re.IGNORECASE)
        return int(match.group(1)) if match else 0

    def _extract_address(self, soup):
        selectors = [
            'span.main-info__title-minor',
            '.detail-info__address',
            '[class*="location"]'
        ]
        for sel in selectors:
            el = soup.select_one(sel)
            if el:
                return el.text.strip()
        return 'No disponible'

    def _extract_district(self, soup):
        breadcrumb = soup.select_one('nav.breadcrumb-container, .breadcrumb')
        if breadcrumb:
            items = breadcrumb.find_all('li')
            if len(items) > 2:
                return items[-2].text.strip()
        return ''

    def _extract_floor(self, soup):
        text = soup.get_text()
        match = re.search(r'(\d+)[ªº]?\s*planta', text, re.IGNORECASE)
        if match:
            return match.group(1)
        if 'bajo' in text.lower():
            return 'Bajo'
        return ''

    def _extract_feature(self, soup, keyword):
        text = soup.get_text().lower()
        return keyword.lower() in text

    def _extract_main_image(self, soup):
        # Buscar imagen principal
        img = soup.select_one('img[class*="detail"], img[class*="gallery"], picture img')
        if img:
            return img.get('src', '') or img.get('data-src', '')
        return ''

    def _extract_description(self, soup):
        selectors = [
            'div.comment',
            '.description',
            '[class*="description"]'
        ]
        for sel in selectors:
            el = soup.select_one(sel)
            if el:
                return el.text.strip()[:500]
        return ''


# Test
if __name__ == '__main__':
    scraper = IdealistaPlaywrightScraper()
    result = scraper.scrape_property_url('https://www.idealista.com/inmueble/109665235/')
    if result:
        print(f"\nResultado:")
        print(f"  Precio: {result['precio']}€")
        print(f"  Tamaño: {result['tamaño']}m²")
        print(f"  Habitaciones: {result['habitaciones']}")
        print(f"  Dirección: {result['direccion']}")
