import requests
from datetime import datetime
import config


class IdealistaRapidAPI:
    """Cliente para interactuar con la API de Idealista a través de RapidAPI (idealista7)"""

    def __init__(self):
        self.api_key = config.RAPIDAPI_KEY
        self.api_host = config.RAPIDAPI_HOST
        self.base_url = f"https://{self.api_host}"
        self.headers = {
            'X-RapidAPI-Key': self.api_key,
            'X-RapidAPI-Host': self.api_host
        }

    def search_properties(self, location_id=None, location_name=None, operation=None,
                          num_page=1, max_items=40, order='relevance', **filters):
        """
        Busca propiedades según los criterios especificados.

        Args:
            location_id: ID de ubicación de Idealista (ej: '0-EU-ES-28-07-001-079' para Madrid)
            location_name: Nombre de la ubicación (ej: 'Madrid')
            operation: Tipo de operación ('sale', 'rent')
            num_page: Número de página (default: 1)
            max_items: Máximo de resultados por página (default: 40)
            order: Ordenamiento ('relevance', 'price', 'date', 'size')
            **filters: Filtros adicionales (minPrice, maxPrice, minSize, maxSize, etc.)

        Returns:
            dict: Respuesta completa de la API con propiedades
        """
        url = f"{self.base_url}/listhomes"

        # Usar valores de config como defaults
        params = {
            'order': order,
            'operation': operation or config.OPERATION,
            'locationId': location_id or config.IDEALISTA_LOCATION_ID,
            'locationName': location_name or config.IDEALISTA_LOCATION_NAME,
            'numPage': num_page,
            'maxItems': max_items,
            'location': config.IDEALISTA_COUNTRY,
            'locale': config.IDEALISTA_LANGUAGE,
        }

        # Agregar filtros de precio si están configurados
        if config.MIN_PRICE > 0:
            params['minPrice'] = config.MIN_PRICE
        if config.MAX_PRICE > 0:
            params['maxPrice'] = config.MAX_PRICE

        # Agregar filtros de tamaño si están configurados
        if config.MIN_SIZE > 0:
            params['minSize'] = config.MIN_SIZE
        if config.MAX_SIZE > 0:
            params['maxSize'] = config.MAX_SIZE

        # Agregar filtros adicionales pasados como kwargs
        for key, value in filters.items():
            if value is not None:
                params[key] = value

        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()

            data = response.json()
            return data

        except requests.exceptions.RequestException as e:
            print(f"Error buscando propiedades: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Codigo de estado: {e.response.status_code}")
                print(f"Respuesta: {e.response.text[:500]}")
            raise

    def get_properties_list(self, **kwargs):
        """
        Obtiene la lista de propiedades de la búsqueda.

        Returns:
            list: Lista de propiedades encontradas
        """
        data = self.search_properties(**kwargs)

        if isinstance(data, dict):
            # La API puede devolver la lista en diferentes campos
            return data.get('elementList', data.get('elements', data.get('properties', [])))
        elif isinstance(data, list):
            return data
        return []

    def format_property_data(self, property_data):
        """Formatea los datos de una propiedad para ser más legibles"""
        price = property_data.get('price', 0)
        size = property_data.get('size', property_data.get('surface', 0))

        return {
            'id': property_data.get('propertyCode', property_data.get('id', 'N/A')),
            'titulo': property_data.get('title', property_data.get('propertyName', 'Sin titulo')),
            'precio': price,
            'tamano': size,
            'habitaciones': property_data.get('rooms', property_data.get('bedrooms', 0)),
            'banos': property_data.get('bathrooms', 0),
            'direccion': property_data.get('address', property_data.get('location', 'No disponible')),
            'distrito': property_data.get('district', property_data.get('neighborhood', 'No disponible')),
            'municipio': property_data.get('municipality', property_data.get('city', 'No disponible')),
            'provincia': property_data.get('province', 'No disponible'),
            'planta': property_data.get('floor', 'No disponible'),
            'exterior': property_data.get('exterior', property_data.get('isExterior', False)),
            'ascensor': property_data.get('hasLift', property_data.get('elevator', False)),
            'parking': property_data.get('parkingSpace', property_data.get('hasParking', False)),
            'url': property_data.get('url', property_data.get('link', '')),
            'thumbnail': property_data.get('thumbnail', property_data.get('image', property_data.get('mainImage', ''))),
            'descripcion': property_data.get('description', property_data.get('comments', ''))[:500] if property_data.get('description', property_data.get('comments', '')) else '',
            'fecha_actualizacion': property_data.get('modificationDate', property_data.get('updated', '')),
            'precio_m2': round(price / size, 2) if size > 0 else 0,
            'latitud': property_data.get('latitude', None),
            'longitud': property_data.get('longitude', None),
            'fotos': property_data.get('multimedia', {}).get('images', []) if isinstance(property_data.get('multimedia'), dict) else property_data.get('images', []),
        }

    def get_property_details(self, property_code):
        """
        Obtiene detalles completos de una propiedad específica.

        Args:
            property_code: Código de la propiedad en Idealista

        Returns:
            dict: Detalles de la propiedad o None si hay error
        """
        url = f"{self.base_url}/property/{property_code}"

        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error obteniendo detalles de propiedad {property_code}: {e}")
            return None

    def search_all_pages(self, max_pages=10, **kwargs):
        """
        Busca propiedades en múltiples páginas.

        Args:
            max_pages: Número máximo de páginas a buscar
            **kwargs: Parámetros de búsqueda

        Returns:
            list: Lista completa de propiedades de todas las páginas
        """
        all_properties = []

        for page in range(1, max_pages + 1):
            print(f"Buscando pagina {page}...")

            data = self.search_properties(num_page=page, **kwargs)

            if isinstance(data, dict):
                properties = data.get('elementList', data.get('elements', []))
                total_pages = data.get('totalPages', 1)
            else:
                properties = data if isinstance(data, list) else []
                total_pages = 1

            if not properties:
                break

            all_properties.extend(properties)

            # Si ya obtuvimos todas las páginas disponibles, salir
            if page >= total_pages:
                break

        print(f"Total propiedades encontradas: {len(all_properties)}")
        return all_properties


# Ejemplo de uso
if __name__ == "__main__":
    api = IdealistaRapidAPI()

    print("Buscando propiedades en Madrid...")
    print("-" * 50)

    try:
        # Búsqueda básica
        properties = api.get_properties_list()

        print(f"Encontradas {len(properties)} propiedades\n")

        # Mostrar las primeras 5 propiedades
        for i, prop in enumerate(properties[:5], 1):
            formatted = api.format_property_data(prop)
            print(f"{i}. {formatted['titulo']}")
            print(f"   Precio: {formatted['precio']:,} EUR")
            print(f"   Tamano: {formatted['tamano']} m2")
            print(f"   Habitaciones: {formatted['habitaciones']}")
            print(f"   Precio/m2: {formatted['precio_m2']:,.2f} EUR")
            print(f"   URL: {formatted['url']}")
            print()

    except Exception as e:
        print(f"Error: {e}")
