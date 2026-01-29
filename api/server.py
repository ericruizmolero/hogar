#!/usr/bin/env python3
"""
Servidor API para Hogar
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

# Configurar CORS para permitir requests desde el frontend
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=False)


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


## Dominios permitidos para el proxy de imágenes (uno por plataforma)
ALLOWED_IMAGE_DOMAINS = [
    'idealista.com',
    'fotocasa.es',
    'pisos.com',
    'habitaclia.com',
    'apinmo.com',
    'engelvoelkers.com',
    'ucarecdn.com',
    'inmotek.net',
]

## Referer dinámico por plataforma
DOMAIN_REFERERS = {
    'idealista.com': 'https://www.idealista.com/',
    'fotocasa.es': 'https://www.fotocasa.es/',
    'pisos.com': 'https://www.pisos.com/',
    'habitaclia.com': 'https://www.habitaclia.com/',
    'apinmo.com': 'https://www.grupotome.com/',
    'engelvoelkers.com': 'https://www.engelvoelkers.com/',
    'ucarecdn.com': 'https://www.engelvoelkers.com/',
    'inmotek.net': 'https://www.areizaga.com/',
}

def is_allowed_domain(url):
    return any(domain in url for domain in ALLOWED_IMAGE_DOMAINS)

def get_referer_for_url(url):
    for domain, referer in DOMAIN_REFERERS.items():
        if domain in url:
            return referer
    return ''


@app.route('/api/image-proxy')
def image_proxy():
    """Proxy para cargar imágenes de plataformas inmobiliarias con las cabeceras correctas"""
    image_url = request.args.get('url')
    if not image_url:
        return 'Missing url parameter', 400

    if not is_allowed_domain(image_url):
        return 'Domain not allowed', 403

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': get_referer_for_url(image_url),
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        }

        # Idealista: si es una URL de página de foto (/inmueble/XXX/foto/N/), extraer la imagen real
        if 'idealista.com' in image_url and '/inmueble/' in image_url and '/foto/' in image_url:
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
            resp = Response(
                response.content,
                content_type=response.headers.get('content-type', 'image/jpeg')
            )
            # Cache images aggressively — they rarely change
            resp.headers['Cache-Control'] = 'public, max-age=2592000, immutable'  # 30 days
            resp.headers['Vary'] = 'Accept'
            return resp
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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print("🏠 Servidor API de Hogar iniciado")
    print(f"📍 http://localhost:{port}")
    print("📝 POST /api/scrape - Scrapear URLs de Idealista")
    app.run(host='0.0.0.0', port=port, debug=True)
