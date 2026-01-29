import os
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# OPCIÓN 1: API OFICIAL DE IDEALISTA
# ============================================================
IDEALISTA_API_KEY = os.getenv('IDEALISTA_API_KEY')
IDEALISTA_API_SECRET = os.getenv('IDEALISTA_API_SECRET')

# ============================================================
# OPCIÓN 2: RAPIDAPI (ALTERNATIVA MÁS FÁCIL)
# ============================================================
RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY')
RAPIDAPI_HOST = os.getenv('RAPIDAPI_HOST', 'idealista7.p.rapidapi.com')
USE_RAPIDAPI = os.getenv('USE_RAPIDAPI', 'false').lower() == 'true'

# Ubicación para búsquedas
IDEALISTA_LOCATION_ID = os.getenv('IDEALISTA_LOCATION_ID', '0-EU-ES-28-07-001-079')
IDEALISTA_LOCATION_NAME = os.getenv('IDEALISTA_LOCATION_NAME', 'Madrid')
IDEALISTA_MAX_ITEMS = int(os.getenv('IDEALISTA_MAX_ITEMS', '40'))

# Configuración general
IDEALISTA_COUNTRY = os.getenv('IDEALISTA_COUNTRY', 'es')
IDEALISTA_LANGUAGE = os.getenv('IDEALISTA_LANGUAGE', 'es')

# Parámetros de búsqueda
CENTER = os.getenv('IDEALISTA_CENTER', '40.4168,-3.7038')
DISTANCE = int(os.getenv('IDEALISTA_DISTANCE', '5000'))
PROPERTY_TYPE = os.getenv('IDEALISTA_PROPERTY_TYPE', 'homes')
OPERATION = os.getenv('IDEALISTA_OPERATION', 'sale')
MAX_PRICE = int(os.getenv('IDEALISTA_MAX_PRICE', '300000'))
MIN_PRICE = int(os.getenv('IDEALISTA_MIN_PRICE', '150000'))
MIN_SIZE = int(os.getenv('IDEALISTA_MIN_SIZE', '60'))
MAX_SIZE = int(os.getenv('IDEALISTA_MAX_SIZE', '120'))

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS_FILE = os.getenv('GOOGLE_SHEETS_CREDENTIALS_FILE', 'credentials.json')
GOOGLE_SHEETS_SPREADSHEET_NAME = os.getenv('GOOGLE_SHEETS_SPREADSHEET_NAME', 'Pisos Idealista')

# Tracking
CHECK_INTERVAL_MINUTES = int(os.getenv('CHECK_INTERVAL_MINUTES', '30'))

# Archivo para almacenar IDs de pisos ya vistos
SEEN_PROPERTIES_FILE = 'seen_properties.json'
