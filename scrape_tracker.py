#!/usr/bin/env python3
"""
Tracker automático usando scraping (sin API)
Scrapea la página de búsqueda de Idealista periódicamente
"""

import json
import os
import time
from datetime import datetime
from idealista_scraper import IdealistaScraper
from google_sheets import GoogleSheetsManager
import config


class ScraperTracker:
    """Sistema de tracking mediante scraping"""
    
    def __init__(self, search_url):
        """
        Args:
            search_url: URL de búsqueda de Idealista
                       Ejemplo: https://www.idealista.com/venta-viviendas/madrid/chamberi/
        """
        self.search_url = search_url
        self.scraper = IdealistaScraper()
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
                    'last_updated': datetime.now().isoformat(),
                    'search_url': self.search_url
                }, f, indent=2)
        except Exception as e:
            print(f"❌ Error guardando propiedades vistas: {e}")
    
    def check_new_properties(self):
        """Busca nuevas propiedades mediante scraping"""
        print(f"\n🔍 Scrapeando búsqueda... [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
        print(f"📍 URL: {self.search_url}")
        
        try:
            # Scrapear la página de búsqueda
            properties = self.scraper.scrape_search_results(self.search_url)
            print(f"📋 Se encontraron {len(properties)} propiedades en total")
            
            # Filtrar propiedades nuevas
            new_properties = []
            for prop in properties:
                property_id = prop['id']
                if property_id and str(property_id) not in self.seen_properties:
                    new_properties.append(prop)
                    self.seen_properties.add(str(property_id))
            
            if new_properties:
                print(f"🆕 ¡{len(new_properties)} nueva(s) propiedad(es) encontrada(s)!")
                
                # Para cada propiedad nueva, scrapear detalles completos
                added_count = 0
                for i, prop in enumerate(new_properties, 1):
                    print(f"\n  [{i}/{len(new_properties)}] Nueva propiedad:")
                    print(f"     ID: {prop['id']}")
                    print(f"     Título: {prop['titulo'][:50]}...")
                    print(f"     Precio: {prop['precio']:,.0f}€")
                    print(f"     URL: {prop['url']}")
                    
                    # Obtener detalles completos (opcional, más lento pero más datos)
                    # detailed_prop = self.scraper.scrape_property_url(prop['url'])
                    # if detailed_prop:
                    #     prop = detailed_prop
                    
                    # Añadir a Google Sheets
                    if self.sheets.add_property(prop):
                        added_count += 1
                        print(f"     ✅ Añadida a Google Sheets")
                    
                    # Delay entre propiedades
                    if i < len(new_properties):
                        time.sleep(1)
                
                print(f"\n✅ {added_count} propiedad(es) añadida(s) a Google Sheets")
                
                # Guardar IDs vistos
                self._save_seen_properties()
                
            else:
                print("ℹ️  No se encontraron propiedades nuevas")
            
            return len(new_properties)
            
        except Exception as e:
            print(f"❌ Error en el scraping: {e}")
            import traceback
            traceback.print_exc()
            return 0
    
    def run_continuous(self):
        """Ejecuta el tracker continuamente"""
        print("""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🕷️  TRACKER CON SCRAPING - IDEALISTA  🕷️           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
        """)
        
        print(f"⏱️  Intervalo de comprobación: {config.CHECK_INTERVAL_MINUTES} minutos")
        print(f"📊 Google Sheets: {self.sheets.get_spreadsheet_url()}")
        print(f"🔍 URL de búsqueda: {self.search_url}")
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
        print("""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🕷️  SCRAPING ÚNICO - IDEALISTA  🕷️                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
        """)
        
        print(f"📊 Google Sheets: {self.sheets.get_spreadsheet_url()}")
        print(f"🔍 URL de búsqueda: {self.search_url}")
        print("\n" + "="*60)
        
        # Inicializar la hoja de cálculo
        self.sheets.get_or_create_spreadsheet()
        
        # Realizar una búsqueda
        new_count = self.check_new_properties()
        
        print(f"\n✅ Scraping completado. {new_count} nueva(s) propiedad(es)")
        return new_count


def main():
    """Función principal"""
    import sys
    
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python scrape_tracker.py <url_busqueda> [once]")
        print()
        print("Ejemplos:")
        print('  python scrape_tracker.py "https://www.idealista.com/venta-viviendas/madrid/chamberi/"')
        print('  python scrape_tracker.py "https://www.idealista.com/venta-viviendas/madrid/" once')
        print()
        print("Pasos para obtener la URL de búsqueda:")
        print("  1. Ve a idealista.com")
        print("  2. Realiza tu búsqueda con los filtros deseados")
        print("  3. Copia la URL de la página de resultados")
        print("  4. Pégala como argumento de este script")
        return
    
    search_url = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else 'continuous'
    
    tracker = ScraperTracker(search_url)
    
    if mode == 'once':
        tracker.run_once()
    else:
        tracker.run_continuous()


if __name__ == '__main__':
    main()


