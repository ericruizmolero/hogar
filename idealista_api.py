import requests
import base64
from datetime import datetime, timedelta
import config


class IdealistaAPI:
    """Cliente para interactuar con la API de Idealista"""
    
    def __init__(self):
        self.api_key = config.IDEALISTA_API_KEY
        self.api_secret = config.IDEALISTA_API_SECRET
        self.base_url = "https://api.idealista.com"
        self.access_token = None
        self.token_expiry = None
        
    def _get_access_token(self):
        """Obtiene el token de acceso OAuth2"""
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
            
        url = f"{self.base_url}/oauth/token"
        
        # Crear credenciales en formato base64
        credentials = f"{self.api_key}:{self.api_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Authorization': f'Basic {encoded_credentials}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        data = {
            'grant_type': 'client_credentials',
            'scope': 'read'
        }
        
        try:
            response = requests.post(url, headers=headers, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data['access_token']
            # El token expira en 1 hora (3600 segundos)
            self.token_expiry = datetime.now() + timedelta(seconds=token_data.get('expires_in', 3600))
            
            return self.access_token
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error obteniendo token de acceso: {e}")
            raise
    
    def search_properties(self):
        """Busca propiedades según los criterios configurados"""
        token = self._get_access_token()
        
        url = f"{self.base_url}/3.5/{config.IDEALISTA_COUNTRY}/search"
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        # Parámetros de búsqueda
        params = {
            'center': config.CENTER,
            'country': config.IDEALISTA_COUNTRY,
            'language': config.IDEALISTA_LANGUAGE,
            'distance': config.DISTANCE,
            'propertyType': config.PROPERTY_TYPE,
            'operation': config.OPERATION,
            'maxPrice': config.MAX_PRICE,
            'minPrice': config.MIN_PRICE,
            'minSize': config.MIN_SIZE,
            'maxSize': config.MAX_SIZE,
            'maxItems': 50,
            'numPage': 1,
            'order': 'publicationDate',  # Ordenar por fecha de publicación
        }
        
        try:
            response = requests.post(url, headers=headers, data=params)
            response.raise_for_status()
            
            data = response.json()
            return data.get('elementList', [])
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error buscando propiedades: {e}")
            if hasattr(e.response, 'text'):
                print(f"Respuesta: {e.response.text}")
            raise
    
    def format_property_data(self, property_data):
        """Formatea los datos de una propiedad para ser más legibles"""
        return {
            'id': property_data.get('propertyCode'),
            'titulo': property_data.get('title', 'Sin título'),
            'precio': property_data.get('price', 0),
            'tamaño': property_data.get('size', 0),
            'habitaciones': property_data.get('rooms', 0),
            'baños': property_data.get('bathrooms', 0),
            'direccion': property_data.get('address', 'No disponible'),
            'distrito': property_data.get('district', 'No disponible'),
            'municipio': property_data.get('municipality', 'No disponible'),
            'provincia': property_data.get('province', 'No disponible'),
            'planta': property_data.get('floor', 'No disponible'),
            'exterior': property_data.get('exterior', False),
            'ascensor': property_data.get('hasLift', False),
            'parking': property_data.get('parkingSpace', False),
            'url': property_data.get('url', ''),
            'thumbnail': property_data.get('thumbnail', ''),
            'descripcion': property_data.get('description', ''),
            'fecha_actualizacion': property_data.get('newDevelopment', False),
            'precio_m2': round(property_data.get('price', 0) / property_data.get('size', 1), 2) if property_data.get('size', 0) > 0 else 0,
        }


