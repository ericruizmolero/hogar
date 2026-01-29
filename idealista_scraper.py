import requests
from bs4 import BeautifulSoup
import time
import re
from datetime import datetime

try:
    import cloudscraper
    HAS_CLOUDSCRAPER = True
except ImportError:
    HAS_CLOUDSCRAPER = False


class IdealistaScraper:
    """Scraper para extraer datos de Idealista sin usar API"""
    
    def __init__(self):
        # Usar cloudscraper si está disponible (mejor para evitar bloqueos)
        if HAS_CLOUDSCRAPER:
            self.session = cloudscraper.create_scraper(
                browser={
                    'browser': 'chrome',
                    'platform': 'darwin',
                    'desktop': True
                }
            )
        else:
            self.session = requests.Session()

        # Headers para parecer un navegador real
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Referer': 'https://www.idealista.com/',
        })
        
    def scrape_property_url(self, url):
        """
        Extrae datos de una URL específica de propiedad
        Ejemplo: https://www.idealista.com/inmueble/108542671/
        """
        try:
            print(f"🔍 Scrapeando: {url}")

            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Extraer datos de la página
            property_data = {
                'id': self._extract_property_id(url),
                'titulo': self._extract_title(soup),
                'precio': self._extract_price(soup),
                'tamaño': self._extract_size(soup),
                'habitaciones': self._extract_rooms(soup),
                'baños': self._extract_bathrooms(soup),
                'direccion': self._extract_address(soup),
                'distrito': self._extract_district(soup),
                'municipio': self._extract_municipality(soup),
                'provincia': self._extract_province(soup),
                'planta': self._extract_floor(soup),
                'exterior': self._extract_exterior(soup),
                'ascensor': self._extract_elevator(soup),
                'parking': self._extract_parking(soup),
                'url': url,
                'thumbnail': self._extract_main_image(soup),
                'descripcion': self._extract_description(soup),
                'fecha_actualizacion': datetime.now().strftime('%Y-%m-%d'),
                'precio_m2': 0
            }
            
            # Calcular precio/m²
            if property_data['tamaño'] and property_data['tamaño'] > 0:
                property_data['precio_m2'] = round(property_data['precio'] / property_data['tamaño'], 2)
            
            print(f"✅ Datos extraídos: {property_data['titulo']}")
            return property_data
            
        except Exception as e:
            print(f"❌ Error scrapeando {url}: {e}")
            return None
    
    def scrape_search_results(self, search_url):
        """
        Scrapea una página de resultados de búsqueda
        Ejemplo: https://www.idealista.com/venta-viviendas/madrid/chamberi/
        """
        try:
            print(f"🔍 Scrapeando resultados: {search_url}")
            
            response = self.session.get(search_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Encontrar todos los artículos de propiedades
            property_items = soup.find_all('article', class_='item')
            
            if not property_items:
                # Intentar con otro selector
                property_items = soup.find_all('div', class_='item-info-container')
            
            properties = []
            
            for item in property_items:
                try:
                    # Extraer URL de la propiedad
                    link = item.find('a', class_='item-link')
                    if not link:
                        continue
                        
                    property_url = 'https://www.idealista.com' + link.get('href', '')
                    
                    # Extraer datos básicos del listado
                    property_data = self._extract_from_listing(item, property_url)
                    if property_data:
                        properties.append(property_data)
                        
                except Exception as e:
                    print(f"⚠️  Error extrayendo propiedad de listado: {e}")
                    continue
            
            print(f"✅ Extraídas {len(properties)} propiedades de la búsqueda")
            return properties
            
        except Exception as e:
            print(f"❌ Error scrapeando búsqueda: {e}")
            return []
    
    def _extract_from_listing(self, item, url):
        """Extrae datos básicos de un item en el listado"""
        try:
            # Precio
            price_element = item.find('span', class_='item-price')
            precio = self._clean_price(price_element.text if price_element else '0')
            
            # Título
            title_element = item.find('a', class_='item-link')
            titulo = title_element.text.strip() if title_element else 'Sin título'
            
            # Detalles (habitaciones, m², etc.)
            details = item.find('span', class_='item-detail')
            details_text = details.text if details else ''
            
            # Extraer habitaciones
            rooms_match = re.search(r'(\d+)\s*hab', details_text)
            habitaciones = int(rooms_match.group(1)) if rooms_match else 0
            
            # Extraer m²
            size_match = re.search(r'(\d+)\s*m²', details_text)
            tamaño = int(size_match.group(1)) if size_match else 0
            
            # Extraer baños
            bath_match = re.search(r'(\d+)\s*baño', details_text)
            baños = int(bath_match.group(1)) if bath_match else 0
            
            # Ubicación
            location = item.find('span', class_='item-address')
            direccion = location.text.strip() if location else 'No disponible'
            
            return {
                'id': self._extract_property_id(url),
                'titulo': titulo,
                'precio': precio,
                'tamaño': tamaño,
                'precio_m2': round(precio / tamaño, 2) if tamaño > 0 else 0,
                'habitaciones': habitaciones,
                'baños': baños,
                'planta': 'N/A',
                'exterior': False,
                'ascensor': False,
                'parking': False,
                'direccion': direccion,
                'distrito': '',
                'municipio': '',
                'provincia': '',
                'url': url,
                'thumbnail': self._extract_listing_image(item),
                'descripcion': '',
                'fecha_actualizacion': datetime.now().strftime('%Y-%m-%d'),
            }
        except Exception as e:
            print(f"⚠️  Error extrayendo datos del listado: {e}")
            return None
    
    def _extract_property_id(self, url):
        """Extrae el ID de la propiedad de la URL"""
        match = re.search(r'/inmueble/(\d+)', url)
        return match.group(1) if match else url.split('/')[-2]
    
    def _extract_title(self, soup):
        """Extrae el título de la propiedad"""
        title = soup.find('h1', class_='main-info__title-main')
        if not title:
            title = soup.find('span', class_='main-info__title-main')
        return title.text.strip() if title else 'Sin título'
    
    def _extract_price(self, soup):
        """Extrae el precio"""
        price = soup.find('span', class_='info-data-price')
        if not price:
            price = soup.find('span', {'data-test': 'price'})
        price_text = price.text if price else '0'
        return self._clean_price(price_text)
    
    def _clean_price(self, price_text):
        """Limpia el texto del precio y lo convierte a número"""
        # Eliminar todo excepto números
        price_clean = re.sub(r'[^\d]', '', price_text)
        return int(price_clean) if price_clean else 0
    
    def _extract_size(self, soup):
        """Extrae el tamaño en m²"""
        size = soup.find('span', string=re.compile(r'm²\s*construidos'))
        if size:
            size_text = size.text
            match = re.search(r'(\d+)\s*m²', size_text)
            return int(match.group(1)) if match else 0
        return 0
    
    def _extract_rooms(self, soup):
        """Extrae el número de habitaciones"""
        rooms = soup.find('span', string=re.compile(r'habitacion'))
        if rooms:
            match = re.search(r'(\d+)', rooms.text)
            return int(match.group(1)) if match else 0
        return 0
    
    def _extract_bathrooms(self, soup):
        """Extrae el número de baños"""
        baths = soup.find('span', string=re.compile(r'baño'))
        if baths:
            match = re.search(r'(\d+)', baths.text)
            return int(match.group(1)) if match else 0
        return 0
    
    def _extract_address(self, soup):
        """Extrae la dirección"""
        address = soup.find('span', class_='main-info__title-minor')
        return address.text.strip() if address else 'No disponible'
    
    def _extract_district(self, soup):
        """Extrae el distrito"""
        breadcrumb = soup.find('nav', class_='breadcrumb-container')
        if breadcrumb:
            items = breadcrumb.find_all('li')
            if len(items) > 2:
                return items[-2].text.strip()
        return 'No disponible'
    
    def _extract_municipality(self, soup):
        """Extrae el municipio"""
        breadcrumb = soup.find('nav', class_='breadcrumb-container')
        if breadcrumb:
            items = breadcrumb.find_all('li')
            if len(items) > 1:
                return items[-3].text.strip() if len(items) > 2 else items[-2].text.strip()
        return 'No disponible'
    
    def _extract_province(self, soup):
        """Extrae la provincia"""
        address = self._extract_address(soup)
        # Intentar extraer de la dirección
        if ',' in address:
            parts = address.split(',')
            return parts[-1].strip() if len(parts) > 1 else 'No disponible'
        return 'No disponible'
    
    def _extract_floor(self, soup):
        """Extrae la planta"""
        floor = soup.find('span', string=re.compile(r'planta', re.IGNORECASE))
        if floor:
            match = re.search(r'(\d+)', floor.text)
            return match.group(1) if match else 'N/A'
        return 'N/A'
    
    def _extract_exterior(self, soup):
        """Detecta si es exterior"""
        features = soup.find_all('span', class_='details-property-feature-text')
        for feature in features:
            if 'exterior' in feature.text.lower():
                return True
        return False
    
    def _extract_elevator(self, soup):
        """Detecta si tiene ascensor"""
        features = soup.find_all('span', class_='details-property-feature-text')
        for feature in features:
            if 'ascensor' in feature.text.lower():
                return True
        return False
    
    def _extract_parking(self, soup):
        """Detecta si tiene parking"""
        features = soup.find_all('span', class_='details-property-feature-text')
        for feature in features:
            if 'garaje' in feature.text.lower() or 'parking' in feature.text.lower():
                return True
        return False
    
    def _extract_main_image(self, soup):
        """Extrae la imagen principal"""
        img = soup.find('img', class_='detail-image')
        if not img:
            img = soup.find('picture')
            if img:
                img = img.find('img')
        return img.get('src', '') if img else ''
    
    def _extract_listing_image(self, item):
        """Extrae la imagen del listado"""
        img = item.find('img', class_='item-multimedia')
        if not img:
            img = item.find('img')
        return img.get('src', '') if img else ''
    
    def _extract_description(self, soup):
        """Extrae la descripción"""
        desc = soup.find('div', class_='comment')
        if not desc:
            desc = soup.find('div', {'data-test': 'description'})
        return desc.text.strip()[:500] if desc else ''
    
    @staticmethod
    def delay_between_requests(seconds=2):
        """Añade un delay para no saturar el servidor"""
        time.sleep(seconds)


