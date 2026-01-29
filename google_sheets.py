import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
import config


class GoogleSheetsManager:
    """Gestor para interactuar con Google Sheets"""
    
    def __init__(self):
        self.spreadsheet_name = config.GOOGLE_SHEETS_SPREADSHEET_NAME
        self.credentials_file = config.GOOGLE_SHEETS_CREDENTIALS_FILE
        self.client = None
        self.spreadsheet = None
        self.worksheet = None
        self._authenticate()
        
    def _authenticate(self):
        """Autentica con Google Sheets usando credenciales de servicio"""
        try:
            scopes = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
            
            creds = Credentials.from_service_account_file(
                self.credentials_file, 
                scopes=scopes
            )
            
            self.client = gspread.authorize(creds)
            print("✅ Autenticado correctamente con Google Sheets")
            
        except Exception as e:
            print(f"❌ Error autenticando con Google Sheets: {e}")
            raise
    
    def get_or_create_spreadsheet(self):
        """Obtiene o crea la hoja de cálculo"""
        try:
            # Intentar abrir la hoja existente
            self.spreadsheet = self.client.open(self.spreadsheet_name)
            print(f"✅ Hoja de cálculo '{self.spreadsheet_name}' encontrada")
            
        except gspread.SpreadsheetNotFound:
            # Crear nueva hoja si no existe
            self.spreadsheet = self.client.create(self.spreadsheet_name)
            print(f"✅ Hoja de cálculo '{self.spreadsheet_name}' creada")
        
        # Obtener o crear la primera hoja
        try:
            self.worksheet = self.spreadsheet.sheet1
        except:
            self.worksheet = self.spreadsheet.add_worksheet(title="Pisos", rows=1000, cols=20)
        
        # Configurar encabezados si la hoja está vacía
        if not self.worksheet.row_values(1):
            self._setup_headers()
        
        return self.spreadsheet
    
    def _setup_headers(self):
        """Configura los encabezados de la hoja"""
        headers = [
            'ID',
            'Título',
            'Precio (€)',
            'Tamaño (m²)',
            'Precio/m²',
            'Habitaciones',
            'Baños',
            'Planta',
            'Exterior',
            'Ascensor',
            'Parking',
            'Dirección',
            'Distrito',
            'Municipio',
            'Provincia',
            'URL',
            'Thumbnail',
            'Descripción',
            'Fecha Añadido',
            'Estado'
        ]
        
        self.worksheet.update('A1:T1', [headers])
        
        # Formatear encabezados
        self.worksheet.format('A1:T1', {
            'textFormat': {'bold': True},
            'backgroundColor': {'red': 0.8, 'green': 0.8, 'blue': 0.8}
        })
        
        print("✅ Encabezados configurados")
    
    def property_exists(self, property_id):
        """Verifica si una propiedad ya existe en la hoja"""
        try:
            cell = self.worksheet.find(str(property_id))
            return cell is not None
        except gspread.exceptions.CellNotFound:
            return False
    
    def add_property(self, property_data):
        """Añade una nueva propiedad a la hoja"""
        try:
            row = [
                property_data.get('id', ''),
                property_data.get('titulo', ''),
                property_data.get('precio', 0),
                property_data.get('tamaño', 0),
                property_data.get('precio_m2', 0),
                property_data.get('habitaciones', 0),
                property_data.get('baños', 0),
                property_data.get('planta', 'N/A'),
                'Sí' if property_data.get('exterior') else 'No',
                'Sí' if property_data.get('ascensor') else 'No',
                'Sí' if property_data.get('parking') else 'No',
                property_data.get('direccion', ''),
                property_data.get('distrito', ''),
                property_data.get('municipio', ''),
                property_data.get('provincia', ''),
                property_data.get('url', ''),
                property_data.get('thumbnail', ''),
                property_data.get('descripcion', '')[:500],  # Limitar descripción
                datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'Nuevo'
            ]
            
            self.worksheet.append_row(row)
            return True
            
        except Exception as e:
            print(f"❌ Error añadiendo propiedad {property_data.get('id')}: {e}")
            return False
    
    def get_all_property_ids(self):
        """Obtiene todos los IDs de propiedades existentes"""
        try:
            # Obtener columna A (IDs) excluyendo el encabezado
            ids = self.worksheet.col_values(1)[1:]
            return set(ids)
        except Exception as e:
            print(f"❌ Error obteniendo IDs: {e}")
            return set()
    
    def update_property_status(self, property_id, status):
        """Actualiza el estado de una propiedad"""
        try:
            cell = self.worksheet.find(str(property_id))
            if cell:
                # Actualizar la columna de estado (columna T = 20)
                self.worksheet.update_cell(cell.row, 20, status)
                return True
            return False
        except Exception as e:
            print(f"❌ Error actualizando estado: {e}")
            return False
    
    def get_spreadsheet_url(self):
        """Obtiene la URL de la hoja de cálculo"""
        if self.spreadsheet:
            return self.spreadsheet.url
        return None


