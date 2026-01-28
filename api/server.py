#!/usr/bin/env python3
"""
Servidor API para scraping de Idealista
Ejecutar: python api/server.py
"""

import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
import re
import requests
import base64
from datetime import datetime

# Agregar el directorio raíz al path para importar módulos
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

app = Flask(__name__)

# Configuración de RapidAPI para Idealista
RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY', 'c0b7375685msh3455479520e750bp1c2437jsn4a756cf35371')
RAPIDAPI_HOST = os.getenv('RAPIDAPI_HOST', 'idealista7.p.rapidapi.com')

# Configurar CORS para permitir requests desde el frontend
# En producción, añadir tu dominio a ALLOWED_ORIGINS
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '').split(',') if os.getenv('ALLOWED_ORIGINS') else []
CORS(app, origins=[
    'http://localhost:5173',
    'http://localhost:5174',
    r'https://.*\.vercel\.app',
    r'https://.*\.onrender\.com',
    *[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
], supports_credentials=True)


def download_image_as_base64(image_url):
    """Descarga una imagen y la devuelve como base64"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://www.idealista.com/',
        }
        response = requests.get(image_url, headers=headers, timeout=10)
        if response.status_code == 200:
            content_type = response.headers.get('content-type', 'image/jpeg')
            b64 = base64.b64encode(response.content).decode('utf-8')
            return f"data:{content_type};base64,{b64}"
    except Exception as e:
        print(f"Error descargando imagen {image_url}: {e}")
    return None


def parse_idealista_html(html, url='', download_images=True):
    """Parsea el HTML de una página de Idealista"""
    soup = BeautifulSoup(html, 'html.parser')
    full_text = soup.get_text()

    def extract_price():
        el = soup.select_one('span.info-data-price')
        if el:
            price_clean = re.sub(r'[^\d]', '', el.text)
            return int(price_clean) if price_clean else 0
        return 0

    def extract_title():
        el = soup.select_one('h1.main-info__title-main, span.main-info__title-main')
        return el.text.strip() if el else ''

    def extract_address():
        el = soup.select_one('span.main-info__title-minor')
        return el.text.strip() if el else ''

    def extract_zone():
        """Extrae la zona/barrio de la propiedad"""
        el = soup.select_one('span.main-info__title-minor')
        if el:
            text = el.text.strip()
            # Formato típico: "Calle X, Barrio, Ciudad"
            parts = text.split(',')
            if len(parts) >= 2:
                return parts[-2].strip()  # Penúltimo elemento suele ser el barrio
        return ''

    def extract_built_size():
        """Metros construidos"""
        match = re.search(r'(\d+)\s*m²\s*construidos', full_text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        # Fallback: buscar en características
        for el in soup.select('li.info-features-item, div.info-features span'):
            text = el.get_text()
            if 'construido' in text.lower():
                m = re.search(r'(\d+)', text)
                if m:
                    return int(m.group(1))
        return 0

    def extract_usable_size():
        """Metros útiles"""
        match = re.search(r'(\d+)\s*m²\s*[úu]tiles', full_text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return 0

    def extract_size():
        for el in soup.find_all(['span', 'div', 'li']):
            text = el.get_text()
            if 'm²' in text:
                match = re.search(r'(\d+)\s*m²', text)
                if match:
                    return int(match.group(1))
        return 0

    def extract_rooms():
        match = re.search(r'(\d+)\s*(?:habitaci[oó]n|hab\.)', full_text, re.IGNORECASE)
        return int(match.group(1)) if match else 0

    def extract_bathrooms():
        match = re.search(r'(\d+)\s*(?:baño|wc)', full_text, re.IGNORECASE)
        return int(match.group(1)) if match else 0

    def extract_floor():
        """Extrae la planta"""
        # Patrones comunes: "3ª planta", "Bajo", "Ático", "Planta 2"
        match = re.search(r'(\d+)[ªº]?\s*planta|planta\s*(\d+)|(bajo|ático|entreplanta|semisótano|sótano)', full_text, re.IGNORECASE)
        if match:
            if match.group(1):
                return f"Planta {match.group(1)}"
            elif match.group(2):
                return f"Planta {match.group(2)}"
            elif match.group(3):
                return match.group(3).capitalize()
        return ''

    def extract_terrace():
        """Comprueba si tiene terraza"""
        return bool(re.search(r'\bterraza\b', full_text, re.IGNORECASE))

    def extract_balcony():
        """Comprueba si tiene balcón"""
        return bool(re.search(r'\bbalc[oó]n\b', full_text, re.IGNORECASE))

    def extract_parking_included():
        """Comprueba si tiene garaje incluido"""
        text_lower = full_text.lower()
        has_parking = bool(re.search(r'\b(garaje|parking|plaza de garaje)\b', text_lower))
        is_included = bool(re.search(r'garaje\s*incluido|plaza.*incluida', text_lower))
        return has_parking and is_included

    def extract_parking_optional():
        """Comprueba si tiene garaje opcional"""
        text_lower = full_text.lower()
        return bool(re.search(r'garaje\s*opcional|plaza.*opcional|posibilidad.*garaje', text_lower))

    def extract_elevator():
        """Comprueba si tiene ascensor"""
        text_lower = full_text.lower()
        has_elevator = bool(re.search(r'\bascensor\b', text_lower))
        no_elevator = bool(re.search(r'sin\s*ascensor|no.*ascensor', text_lower))
        return has_elevator and not no_elevator

    def extract_year_built():
        """Extrae el año de construcción"""
        match = re.search(r'(?:construido|construcción|año).*?(\d{4})|(\d{4}).*?(?:construido|construcción)', full_text, re.IGNORECASE)
        if match:
            year = int(match.group(1) or match.group(2))
            if 1800 <= year <= 2030:
                return year
        return 0

    def extract_orientation():
        """Extrae la orientación"""
        match = re.search(r'orientaci[oó]n\s*(norte|sur|este|oeste|noroeste|noreste|suroeste|sureste)', full_text, re.IGNORECASE)
        if match:
            return match.group(1).capitalize()
        # Buscar orientaciones sueltas cerca de palabras clave
        match = re.search(r'\b(norte|sur|este|oeste)\b', full_text, re.IGNORECASE)
        return match.group(1).capitalize() if match else ''

    def extract_needs_renovation():
        """Comprueba si necesita reforma"""
        text_lower = full_text.lower()
        needs = bool(re.search(r'(necesita|para)\s*reforma|a\s*reformar|estado.*reformar', text_lower))
        return needs

    def extract_days_published():
        """Extrae los días que lleva publicado"""
        # Formato: "Anuncio actualizado hace X días/horas"
        match = re.search(r'hace\s*(\d+)\s*d[ií]as?', full_text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        if re.search(r'hace\s*(\d+)\s*horas?|hoy|ayer', full_text, re.IGNORECASE):
            return 1
        return 0

    def extract_images():
        """Extrae todas las URLs de imágenes de la propiedad (hasta 30)"""
        images = []
        seen_base = set()

        def add_image(img_url):
            """Añade una imagen evitando duplicados"""
            if not img_url or 'logo' in img_url.lower():
                return
            # Ignorar imágenes de tracking, iconos, perfiles, etc.
            if 'loading' in img_url or 'px.png' in img_url or 'bat.bing' in img_url or 'profilephotos' in img_url:
                return
            if not img_url.endswith(('.jpg', '.jpeg', '.png', '.webp')):
                return

            # Extraer identificador único de la imagen (el número final antes de la extensión)
            id_match = re.search(r'/(\d{10})\.(jpg|jpeg|png|webp)', img_url)
            if id_match:
                img_id = id_match.group(1)
                if img_id in seen_base:
                    return
                seen_base.add(img_id)
            else:
                # Fallback: usar URL completa
                base_url = img_url.split('?')[0]
                if base_url in seen_base:
                    return
                seen_base.add(base_url)

            # NO modificar la URL, usar la original
            images.append(img_url)

        # Buscar todas las URLs de imágenes de idealista en el HTML
        # Pattern: https://img4.idealista.com/blur/.../.../M/{hash}/xxx.jpg
        img_pattern = re.compile(r'https?://img\d?\.idealista\.com/[^"\s<>]+\.(?:jpg|jpeg|png|webp)', re.IGNORECASE)
        for match in img_pattern.finditer(html):
            add_image(match.group(0))

        # También buscar en atributos src, srcset, data-src
        for img in soup.select('img'):
            for attr in ['src', 'data-src', 'data-lazy']:
                val = img.get(attr, '')
                if 'idealista' in val:
                    add_image(val)

        for source in soup.select('source[srcset]'):
            srcset = source.get('srcset', '')
            if 'idealista' in srcset:
                for part in srcset.split(','):
                    img_url = part.strip().split(' ')[0]
                    if img_url:
                        add_image(img_url)

        print(f"📷 Total: {len(images)} imágenes únicas")
        return images[:30]

    def extract_description():
        """Extrae la descripción completa del anuncio"""
        # Selectores comunes de Idealista para la descripción
        selectors = [
            'div.comment p',
            'div.comment',
            'div.adCommentsLanguage p',
            'div.adCommentsLanguage',
            '.comment-content p',
            '.comment-content',
            'div[class*="description"] p',
            'div[class*="comment"] p',
        ]

        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                # Unir todos los párrafos encontrados
                text_parts = []
                for el in elements:
                    text = el.get_text(separator=' ', strip=True)
                    if text and len(text) > 20:  # Ignorar textos muy cortos
                        text_parts.append(text)

                if text_parts:
                    return '\n\n'.join(text_parts)

        # Fallback: buscar el primer div.comment
        el = soup.select_one('div.comment')
        return el.get_text(separator='\n', strip=True) if el else ''

    precio = extract_price()
    built_size = extract_built_size()
    usable_size = extract_usable_size()
    tamaño = built_size or extract_size()

    # Extraer URLs de imágenes (guardamos las URLs directamente)
    photos = extract_images()
    if photos:
        print(f"📷 Encontradas {len(photos)} imágenes")

    return {
        'url': url,
        'title': extract_title(),
        'zone': extract_zone(),
        'address': extract_address() or extract_title(),
        'price': precio,
        'pricePerMeter': round(precio / tamaño) if tamaño > 0 else 0,
        'builtSquareMeters': built_size,
        'usableSquareMeters': usable_size,
        'squareMeters': tamaño,
        'rooms': extract_rooms(),
        'floor': extract_floor(),
        'bathrooms': extract_bathrooms(),
        'terrace': extract_terrace(),
        'balcony': extract_balcony(),
        'parkingIncluded': extract_parking_included(),
        'parkingOptional': extract_parking_optional(),
        'elevator': extract_elevator(),
        'yearBuilt': extract_year_built(),
        'orientation': extract_orientation(),
        'needsRenovation': extract_needs_renovation(),
        'daysPublished': extract_days_published(),
        'photos': photos,
        'contact': {'name': '', 'phone': '', 'email': '', 'agency': ''},
        'notes': extract_description(),
    }


@app.route('/api/health', methods=['GET'])
def health():
    """Endpoint de health check"""
    return jsonify({'status': 'ok'})


@app.route('/api/download-photos', methods=['POST'])
def download_photos():
    """
    Descarga fotos de Idealista y las devuelve como base64
    Body: { "urls": ["https://img3.idealista.com/...", ...] }
    Devuelve: { "photos": ["data:image/jpeg;base64,...", ...] }
    """
    data = request.get_json()
    urls = data.get('urls', [])

    if not urls:
        return jsonify({'error': 'Se requiere urls'}), 400

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.idealista.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    }

    photos_base64 = []

    for i, img_url in enumerate(urls[:20]):  # Máximo 20 fotos
        try:
            response = requests.get(img_url, headers=headers, timeout=10)

            if response.status_code == 200:
                content_type = response.headers.get('content-type', 'image/jpeg')
                b64 = base64.b64encode(response.content).decode('utf-8')
                photos_base64.append(f"data:{content_type};base64,{b64}")
                print(f"  Foto {i+1}: descargada OK")
            else:
                print(f"  Foto {i+1}: error ({response.status_code})")

        except Exception as e:
            print(f"  Foto {i+1}: error - {e}")
            continue

    print(f"📷 Descargadas {len(photos_base64)} de {len(urls)} fotos")

    return jsonify({
        'success': True,
        'photos': photos_base64
    })


@app.route('/api/image-proxy')
def image_proxy():
    """Proxy para cargar imágenes de Idealista con las cabeceras correctas"""
    image_url = request.args.get('url')
    if not image_url:
        return 'Missing url parameter', 400

    # Solo permitir imágenes de idealista
    if 'idealista.com' not in image_url:
        return 'Only idealista images allowed', 403

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.idealista.com/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        }

        # Si es una URL de página de foto (/inmueble/XXX/foto/N/), extraer la imagen real
        if '/inmueble/' in image_url and '/foto/' in image_url:
            response = requests.get(image_url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                # Buscar la imagen principal en la página
                img_el = soup.select_one('img.main-image, img.detail-image, picture img, .multimedia-container img')
                if img_el:
                    real_img_url = img_el.get('src') or img_el.get('data-src')
                    if real_img_url:
                        image_url = real_img_url
                else:
                    # Buscar cualquier imagen de idealista en el HTML
                    img_match = re.search(r'https?://img\d?\.idealista\.com/[^"\s<>]+\.(?:jpg|jpeg|png|webp)', response.text)
                    if img_match:
                        image_url = img_match.group(0)
                    else:
                        return 'No image found in photo page', 404

        response = requests.get(image_url, headers=headers, timeout=10)

        if response.status_code == 200:
            from flask import Response
            return Response(
                response.content,
                content_type=response.headers.get('content-type', 'image/jpeg')
            )
        else:
            return f'Failed to fetch image: {response.status_code}', response.status_code
    except Exception as e:
        return f'Error: {str(e)}', 500


@app.route('/api/parse-html', methods=['POST'])
def parse_html():
    """
    Parsea HTML de páginas de Idealista
    Body: { "html": "<html>...</html>", "url": "https://..." }
    """
    data = request.get_json()

    if not data or 'html' not in data:
        return jsonify({'error': 'Se requiere el campo "html"'}), 400

    html = data['html']
    url = data.get('url', '')

    try:
        result = parse_idealista_html(html, url)

        if result['price'] > 0 or result['address']:
            return jsonify({
                'success': True,
                'property': result
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No se pudieron extraer datos del HTML'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })


@app.route('/api/scrape', methods=['POST'])
def scrape_property():
    """
    Nota: El scraping directo está bloqueado por Idealista.
    Usa /api/parse-html con el HTML copiado de la página.
    """
    return jsonify({
        'success': 0,
        'failed': 1,
        'properties': [],
        'errors': [{
            'url': '',
            'error': 'Idealista bloquea el scraping automático. Usa la opción de pegar HTML.'
        }]
    })


# ============================================================
# ENDPOINTS DE API IDEALISTA (RapidAPI)
# ============================================================

@app.route('/api/idealista/search', methods=['GET', 'POST'])
def idealista_search():
    """
    Buscar propiedades en Idealista usando RapidAPI.

    Query params o JSON body:
        - locationId: ID de ubicación (default: '0-EU-ES-28-07-001-079' para Madrid)
        - locationName: Nombre de la ubicación (default: 'Madrid')
        - operation: 'sale' o 'rent' (default: 'sale')
        - order: 'relevance', 'price', 'date', 'size' (default: 'relevance')
        - numPage: Número de página (default: 1)
        - maxItems: Resultados por página (default: 40)
        - minPrice: Precio mínimo
        - maxPrice: Precio máximo
        - minSize: Tamaño mínimo en m2
        - maxSize: Tamaño máximo en m2
        - bedrooms: Número de habitaciones
    """
    # Obtener parámetros de query string o JSON body
    if request.method == 'POST':
        data = request.get_json() or {}
    else:
        data = request.args.to_dict()

    # Construir parámetros para la API
    # Nota: maxItems solo acepta ciertos valores (20, 40, 60)
    max_items = int(data.get('maxItems', 40))
    valid_max_items = [20, 40, 60]
    if max_items not in valid_max_items:
        max_items = 40  # Valor por defecto si no es válido

    params = {
        'order': data.get('order', 'relevance'),
        'operation': data.get('operation', 'sale'),
        'locationId': data.get('locationId', '0-EU-ES-28-07-001-079'),
        'locationName': data.get('locationName', 'Madrid'),
        'numPage': data.get('numPage', 1),
        'maxItems': max_items,
        'location': 'es',
        'locale': 'es',
    }

    # Agregar filtros opcionales
    optional_params = ['minPrice', 'maxPrice', 'minSize', 'maxSize', 'bedrooms']
    for param in optional_params:
        if param in data and data[param]:
            params[param] = data[param]

    headers = {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
    }

    try:
        url = f"https://{RAPIDAPI_HOST}/listhomes"
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()

        api_data = response.json()

        # Formatear las propiedades para el frontend
        properties = []
        raw_properties = api_data.get('elementList', api_data.get('elements', api_data.get('properties', [])))

        if isinstance(api_data, list):
            raw_properties = api_data

        for prop in raw_properties:
            price = prop.get('price', 0)
            size = prop.get('size', prop.get('surface', 0))

            formatted = {
                'id': prop.get('propertyCode', prop.get('id', '')),
                'title': prop.get('title', prop.get('propertyName', 'Sin titulo')),
                'price': price,
                'squareMeters': size,
                'pricePerMeter': round(price / size, 2) if size > 0 else 0,
                'rooms': prop.get('rooms', prop.get('bedrooms', 0)),
                'bathrooms': prop.get('bathrooms', 0),
                'address': prop.get('address', prop.get('location', '')),
                'district': prop.get('district', prop.get('neighborhood', '')),
                'municipality': prop.get('municipality', prop.get('city', '')),
                'province': prop.get('province', ''),
                'floor': prop.get('floor', ''),
                'exterior': prop.get('exterior', prop.get('isExterior', False)),
                'elevator': prop.get('hasLift', prop.get('elevator', False)),
                'parking': prop.get('parkingSpace', prop.get('hasParking', False)),
                'url': prop.get('url', prop.get('link', '')),
                'thumbnail': prop.get('thumbnail', prop.get('image', prop.get('mainImage', ''))),
                'description': (prop.get('description', prop.get('comments', '')) or '')[:500],
                'latitude': prop.get('latitude'),
                'longitude': prop.get('longitude'),
                'photos': [],
            }

            # Extraer fotos si están disponibles
            multimedia = prop.get('multimedia', {})
            if isinstance(multimedia, dict):
                images = multimedia.get('images', [])
                if images:
                    formatted['photos'] = [img.get('url', img) if isinstance(img, dict) else img for img in images]

            properties.append(formatted)

        return jsonify({
            'success': True,
            'total': api_data.get('total', len(properties)),
            'totalPages': api_data.get('totalPages', 1),
            'currentPage': int(params['numPage']),
            'properties': properties
        })

    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        status_code = 500

        if hasattr(e, 'response') and e.response is not None:
            status_code = e.response.status_code
            try:
                error_msg = e.response.json().get('message', error_msg)
            except:
                error_msg = e.response.text[:500]

        return jsonify({
            'success': False,
            'error': error_msg
        }), status_code


@app.route('/api/idealista/property/<property_code>', methods=['GET'])
def idealista_property_details(property_code):
    """
    Obtener detalles de una propiedad específica de Idealista.

    Path params:
        - property_code: Código de la propiedad en Idealista
    """
    headers = {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
    }

    try:
        url = f"https://{RAPIDAPI_HOST}/property/{property_code}"
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        prop = response.json()

        if not prop:
            return jsonify({
                'success': False,
                'error': 'Propiedad no encontrada'
            }), 404

        return jsonify({
            'success': True,
            'property': prop
        })

    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        status_code = 500

        if hasattr(e, 'response') and e.response is not None:
            status_code = e.response.status_code
            if status_code == 404:
                return jsonify({
                    'success': False,
                    'error': 'Propiedad no encontrada'
                }), 404

        return jsonify({
            'success': False,
            'error': error_msg
        }), status_code


@app.route('/api/idealista/import-url', methods=['POST'])
def idealista_import_url():
    """
    Importa una propiedad de Idealista por su URL.
    Busca el ID de la propiedad en los resultados de la API.

    Body: { "url": "https://www.idealista.com/inmueble/123456/" }
    """
    data = request.get_json() or {}
    url = data.get('url', '')

    if not url:
        return jsonify({'success': False, 'error': 'URL requerida'}), 400

    # Extraer el ID del inmueble de la URL
    id_match = re.search(r'inmueble/(\d+)', url)
    if not id_match:
        return jsonify({'success': False, 'error': 'URL no válida. Debe ser de idealista.com/inmueble/...'}), 400

    property_id = id_match.group(1)

    # Intentar extraer la ciudad de la URL si está disponible
    # Formato: /inmueble/123456/ o /venta-viviendas/madrid/...
    # Default: San Sebastián / Guipúzcoa
    location_name = 'Guipuzcoa'
    location_id = '0-EU-ES-20'

    # Mapeo de ciudades
    city_mapping = {
        'san-sebastian': ('0-EU-ES-20', 'Guipuzcoa'),
        'san sebastian': ('0-EU-ES-20', 'Guipuzcoa'),
        'donostia': ('0-EU-ES-20', 'Guipuzcoa'),
        'guipuzcoa': ('0-EU-ES-20', 'Guipuzcoa'),
        'gipuzkoa': ('0-EU-ES-20', 'Guipuzcoa'),
        'madrid': ('0-EU-ES-28-07-001-079', 'Madrid'),
        'barcelona': ('0-EU-ES-08-08-001-019', 'Barcelona'),
        'valencia': ('0-EU-ES-46-46-001-250', 'Valencia'),
        'sevilla': ('0-EU-ES-41-41-001-091', 'Sevilla'),
        'zaragoza': ('0-EU-ES-50-50-001-297', 'Zaragoza'),
        'malaga': ('0-EU-ES-29-29-001-067', 'Malaga'),
        'bilbao': ('0-EU-ES-48', 'Vizcaya'),
        'vizcaya': ('0-EU-ES-48', 'Vizcaya'),
        'alicante': ('0-EU-ES-03-03-001-014', 'Alicante'),
    }

    # Intentar detectar ciudad de la URL
    url_lower = url.lower()
    for city, (city_id, city_name) in city_mapping.items():
        if city in url_lower:
            location_id = city_id
            location_name = city_name
            break

    headers = {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
    }

    # Buscar en varias páginas hasta encontrar la propiedad
    found_property = None
    max_pages = 15  # Buscar en hasta 15 páginas (600 propiedades)

    for page in range(1, max_pages + 1):
        try:
            api_url = f"https://{RAPIDAPI_HOST}/listhomes"
            params = {
                'order': 'relevance',
                'operation': 'sale',
                'locationId': location_id,
                'locationName': location_name,
                'numPage': page,
                'maxItems': 40,
                'location': 'es',
                'locale': 'es',
            }

            response = requests.get(api_url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            api_data = response.json()

            # Buscar en los resultados
            properties = api_data.get('elementList', api_data.get('elements', []))

            for prop in properties:
                prop_code = str(prop.get('propertyCode', prop.get('id', '')))
                if prop_code == property_id:
                    found_property = prop
                    break

            if found_property:
                break

            # Si no hay más páginas, salir
            total_pages = api_data.get('totalPages', 1)
            if page >= total_pages:
                break

        except Exception as e:
            print(f"Error buscando en página {page}: {e}")
            continue

    if not found_property:
        # Si no encontramos la propiedad, intentar búsqueda de alquiler
        for page in range(1, 3):  # Solo 2 páginas para alquiler
            try:
                api_url = f"https://{RAPIDAPI_HOST}/listhomes"
                params = {
                    'order': 'relevance',
                    'operation': 'rent',
                    'locationId': location_id,
                    'locationName': location_name,
                    'numPage': page,
                    'maxItems': 40,
                    'location': 'es',
                    'locale': 'es',
                }

                response = requests.get(api_url, headers=headers, params=params, timeout=30)
                response.raise_for_status()
                api_data = response.json()

                properties = api_data.get('elementList', api_data.get('elements', []))

                for prop in properties:
                    prop_code = str(prop.get('propertyCode', prop.get('id', '')))
                    if prop_code == property_id:
                        found_property = prop
                        break

                if found_property:
                    break

            except Exception as e:
                continue

    if not found_property:
        return jsonify({
            'success': False,
            'error': 'Propiedad no encontrada. Prueba el modo "Completo" pegando el HTML de la página.',
            'propertyId': property_id
        }), 404

    # Formatear la propiedad encontrada
    price = found_property.get('price', 0)
    size = found_property.get('size', found_property.get('surface', 0))

    formatted = {
        'id': found_property.get('propertyCode', found_property.get('id', '')),
        'url': url,
        'title': found_property.get('title', found_property.get('propertyName', f'Piso en {location_name}')),
        'price': price,
        'squareMeters': size,
        'pricePerMeter': round(price / size, 2) if size > 0 else 0,
        'rooms': found_property.get('rooms', found_property.get('bedrooms', 0)),
        'bathrooms': found_property.get('bathrooms', 0),
        'address': found_property.get('address', found_property.get('location', '')),
        'zone': found_property.get('district', found_property.get('neighborhood', '')),
        'district': found_property.get('district', found_property.get('neighborhood', '')),
        'municipality': found_property.get('municipality', found_property.get('city', '')),
        'province': found_property.get('province', ''),
        'floor': str(found_property.get('floor', '')),
        'exterior': found_property.get('exterior', found_property.get('isExterior', False)),
        'elevator': found_property.get('hasLift', found_property.get('elevator', False)),
        'parking': found_property.get('parkingSpace', found_property.get('hasParking', False)),
        'parkingIncluded': found_property.get('parkingIncluded', found_property.get('hasParkingSpace', False)),
        'terrace': found_property.get('hasTerrace', False),
        'description': (found_property.get('description', found_property.get('comments', '')) or ''),
        'latitude': found_property.get('latitude'),
        'longitude': found_property.get('longitude'),
        'photos': [],
    }

    # Extraer fotos
    multimedia = found_property.get('multimedia', {})
    if isinstance(multimedia, dict):
        images = multimedia.get('images', [])
        if images:
            formatted['photos'] = [img.get('url', img) if isinstance(img, dict) else img for img in images]
    elif found_property.get('images'):
        formatted['photos'] = found_property.get('images', [])

    # Si no hay fotos pero hay thumbnail, usarlo
    if not formatted['photos'] and found_property.get('thumbnail'):
        formatted['photos'] = [found_property.get('thumbnail')]

    return jsonify({
        'success': True,
        'property': formatted
    })


@app.route('/api/idealista/locations', methods=['GET'])
def idealista_locations():
    """
    Devuelve una lista de ubicaciones predefinidas de Idealista.
    """
    locations = [
        {'id': '0-EU-ES-28-07-001-079', 'name': 'Madrid', 'type': 'city'},
        {'id': '0-EU-ES-08-08-001-019', 'name': 'Barcelona', 'type': 'city'},
        {'id': '0-EU-ES-46-46-001-250', 'name': 'Valencia', 'type': 'city'},
        {'id': '0-EU-ES-41-41-001-091', 'name': 'Sevilla', 'type': 'city'},
        {'id': '0-EU-ES-50-50-001-297', 'name': 'Zaragoza', 'type': 'city'},
        {'id': '0-EU-ES-29-29-001-067', 'name': 'Malaga', 'type': 'city'},
        {'id': '0-EU-ES-48-48-001-020', 'name': 'Bilbao', 'type': 'city'},
        {'id': '0-EU-ES-03-03-001-014', 'name': 'Alicante', 'type': 'city'},
        {'id': '0-EU-ES-30-30-001-030', 'name': 'Murcia', 'type': 'city'},
        {'id': '0-EU-ES-07-07-001-040', 'name': 'Palma de Mallorca', 'type': 'city'},
    ]

    return jsonify({
        'success': True,
        'locations': locations
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print("🏠 Servidor API de Hogar iniciado")
    print(f"📍 http://localhost:{port}")
    print("📝 POST /api/scrape - Scrapear URLs de Idealista")
    app.run(host='0.0.0.0', port=port, debug=True)
