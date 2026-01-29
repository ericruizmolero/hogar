import json
import os
import time
from datetime import datetime
import config

# Importar el cliente apropiado según la configuración
if config.USE_RAPIDAPI:
    from idealista_rapidapi import IdealistaRapidAPI as IdealistaClient
    print("🔌 Usando RapidAPI para conectar con Idealista")
else:
    from idealista_api import IdealistaAPI as IdealistaClient
    print("🔌 Usando API oficial de Idealista")

from google_sheets import GoogleSheetsManager


class PropertyTracker:
    """Sistema de tracking de propiedades"""
    
    def __init__(self):
        self.idealista = IdealistaClient()
        self.sheets = GoogleSheetsManager()
        self.seen_properties_file = config.SEEN_PROPERTIES_FILE
        self.seen_properties = self._load_seen_properties()
        
    def _load_seen_properties(self):
        """Carga el conjunto de propiedades ya vistas"""
        if os.path.exists(self.seen_properties_file):
            try:
                with open(self.seen_properties_file, 'r') as f:
                    data = json.load(f)
                    return set(data.get('seen_ids', []))
            except Exception as e:
                print(f"⚠️  Error cargando propiedades vistas: {e}")
                return set()
        return set()
    
    def _save_seen_properties(self):
        """Guarda el conjunto de propiedades vistas"""
        try:
            with open(self.seen_properties_file, 'w') as f:
                json.dump({
                    'seen_ids': list(self.seen_properties),
                    'last_updated': datetime.now().isoformat()
                }, f, indent=2)
        except Exception as e:
            print(f"❌ Error guardando propiedades vistas: {e}")
    
    def check_new_properties(self):
        """Busca nuevas propiedades y las añade a la hoja de cálculo"""
        print(f"\n🔍 Buscando nuevas propiedades... [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
        
        try:
            # Obtener propiedades de Idealista
            properties = self.idealista.search_properties()
            print(f"📋 Se encontraron {len(properties)} propiedades en total")
            
            # Filtrar propiedades nuevas
            new_properties = []
            for prop in properties:
                property_id = prop.get('propertyCode', prop.get('id'))
                if property_id and str(property_id) not in self.seen_properties:
                    new_properties.append(prop)
                    self.seen_properties.add(str(property_id))
            
            if new_properties:
                print(f"🆕 ¡{len(new_properties)} nueva(s) propiedad(es) encontrada(s)!")
                
                # Añadir cada propiedad nueva a Google Sheets
                added_count = 0
                for prop in new_properties:
                    formatted_prop = self.idealista.format_property_data(prop)
                    
                    # Mostrar información de la nueva propiedad
                    print(f"\n  ➕ Nueva propiedad:")
                    print(f"     ID: {formatted_prop['id']}")
                    print(f"     Título: {formatted_prop['titulo'][:50]}...")
                    print(f"     Precio: {formatted_prop['precio']:,.0f}€")
                    print(f"     Tamaño: {formatted_prop['tamaño']}m²")
                    print(f"     Ubicación: {formatted_prop['distrito']}, {formatted_prop['municipio']}")
                    print(f"     URL: {formatted_prop['url']}")
                    
                    # Añadir a Google Sheets
                    if self.sheets.add_property(formatted_prop):
                        added_count += 1
                        self._send_notification(formatted_prop)
                
                print(f"\n✅ {added_count} propiedad(es) añadida(s) a Google Sheets")
                
                # Guardar IDs vistos
                self._save_seen_properties()
                
            else:
                print("ℹ️  No se encontraron propiedades nuevas")
            
            return len(new_properties)
            
        except Exception as e:
            print(f"❌ Error en la búsqueda: {e}")
            import traceback
            traceback.print_exc()
            return 0
    
    def _send_notification(self, property_data):
        """Envía notificación de nueva propiedad"""
        # Aquí puedes implementar notificaciones por:
        # - Email
        # - Telegram
        # - Slack
        # - Push notifications
        
        notification = f"""
        🏠 ¡NUEVA PROPIEDAD DISPONIBLE!
        
        📍 Ubicación: {property_data['direccion']}
        💰 Precio: {property_data['precio']:,.0f}€
        📏 Tamaño: {property_data['tamaño']}m² ({property_data['precio_m2']:.0f}€/m²)
        🛏️  Habitaciones: {property_data['habitaciones']}
        🚿 Baños: {property_data['baños']}
        🔗 Ver más: {property_data['url']}
        """
        
        # Por ahora solo imprime, pero puedes añadir tu lógica aquí
        print(notification)
    
    def run_continuous(self):
        """Ejecuta el tracker continuamente"""
        print("🚀 Iniciando tracker de propiedades de Idealista")
        print(f"⏱️  Intervalo de comprobación: {config.CHECK_INTERVAL_MINUTES} minutos")
        print(f"📊 Google Sheets: {self.sheets.get_spreadsheet_url()}")
        print("\n" + "="*60)
        
        # Inicializar la hoja de cálculo
        self.sheets.get_or_create_spreadsheet()
        
        try:
            while True:
                self.check_new_properties()
                
                # Esperar hasta la próxima comprobación
                wait_seconds = config.CHECK_INTERVAL_MINUTES * 60
                print(f"\n⏳ Esperando {config.CHECK_INTERVAL_MINUTES} minutos hasta la próxima comprobación...")
                print("   (Presiona Ctrl+C para detener)")
                time.sleep(wait_seconds)
                
        except KeyboardInterrupt:
            print("\n\n🛑 Tracker detenido por el usuario")
            print(f"📊 Propiedades rastreadas: {len(self.seen_properties)}")
            self._save_seen_properties()
    
    def run_once(self):
        """Ejecuta una sola búsqueda"""
        print("🚀 Ejecutando búsqueda única de propiedades")
        print(f"📊 Google Sheets: {self.sheets.get_spreadsheet_url()}")
        print("\n" + "="*60)
        
        # Inicializar la hoja de cálculo
        self.sheets.get_or_create_spreadsheet()
        
        # Realizar una búsqueda
        new_count = self.check_new_properties()
        
        print(f"\n✅ Búsqueda completada. {new_count} nueva(s) propiedad(es)")
        return new_count


def main():
    """Función principal"""
    import sys
    
    tracker = PropertyTracker()
    
    # Si se pasa 'once' como argumento, ejecutar solo una vez
    if len(sys.argv) > 1 and sys.argv[1] == 'once':
        tracker.run_once()
    else:
        tracker.run_continuous()


if __name__ == '__main__':
    main()
