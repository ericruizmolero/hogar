#!/usr/bin/env python3
"""
Script para scrapear URLs individuales de Idealista y añadirlas a Google Sheets
Uso: python scrape_urls.py urls.txt
"""

import sys
from idealista_scraper import IdealistaScraper
from google_sheets import GoogleSheetsManager


def scrape_urls_from_file(filename):
    """Lee URLs de un archivo y las scrapea"""
    
    print(f"""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🕷️  SCRAPER DE URLs DE IDEALISTA  🕷️               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    # Leer URLs del archivo
    try:
        with open(filename, 'r') as f:
            urls = [line.strip() for line in f if line.strip() and line.strip().startswith('http')]
    except FileNotFoundError:
        print(f"❌ No se encontró el archivo: {filename}")
        print("\nCrea un archivo con una URL por línea:")
        print("  https://www.idealista.com/inmueble/108542671/")
        print("  https://www.idealista.com/inmueble/108542672/")
        return
    
    if not urls:
        print("❌ No se encontraron URLs válidas en el archivo")
        return
    
    print(f"📋 Se encontraron {len(urls)} URLs para scrapear\n")
    
    # Inicializar scraper y Google Sheets
    scraper = IdealistaScraper()
    sheets = GoogleSheetsManager()
    sheets.get_or_create_spreadsheet()
    
    print(f"📊 Google Sheets: {sheets.get_spreadsheet_url()}\n")
    print("="*60)
    
    # Scrapear cada URL
    success_count = 0
    failed_count = 0
    
    for i, url in enumerate(urls, 1):
        print(f"\n[{i}/{len(urls)}] Procesando...")
        
        try:
            # Scrapear la propiedad
            property_data = scraper.scrape_property_url(url)
            
            if property_data:
                # Verificar si ya existe
                property_id = property_data['id']
                if sheets.property_exists(property_id):
                    print(f"⚠️  La propiedad {property_id} ya existe en la hoja")
                else:
                    # Añadir a Google Sheets
                    if sheets.add_property(property_data):
                        success_count += 1
                        print(f"✅ Añadida: {property_data['titulo'][:50]}...")
                        print(f"   💰 {property_data['precio']:,.0f}€ | 📏 {property_data['tamaño']}m²")
                    else:
                        failed_count += 1
            else:
                failed_count += 1
            
            # Delay entre peticiones para ser respetuoso con el servidor
            if i < len(urls):
                print("⏳ Esperando 2 segundos...")
                scraper.delay_between_requests(2)
            
        except Exception as e:
            print(f"❌ Error procesando URL: {e}")
            failed_count += 1
    
    # Resumen
    print("\n" + "="*60)
    print("📊 RESUMEN")
    print("="*60)
    print(f"✅ Propiedades añadidas: {success_count}")
    print(f"❌ Errores: {failed_count}")
    print(f"📊 Total procesadas: {len(urls)}")
    print(f"\n🔗 Ver en Google Sheets: {sheets.get_spreadsheet_url()}")


def scrape_single_url(url):
    """Scrapea una sola URL y la añade a Google Sheets"""
    
    print(f"""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🕷️  SCRAPER DE URL DE IDEALISTA  🕷️                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    print(f"🔍 URL: {url}\n")
    
    # Inicializar scraper y Google Sheets
    scraper = IdealistaScraper()
    sheets = GoogleSheetsManager()
    sheets.get_or_create_spreadsheet()
    
    print(f"📊 Google Sheets: {sheets.get_spreadsheet_url()}\n")
    print("="*60 + "\n")
    
    # Scrapear la propiedad
    property_data = scraper.scrape_property_url(url)
    
    if property_data:
        # Mostrar datos extraídos
        print("\n📋 Datos extraídos:")
        print(f"  ID: {property_data['id']}")
        print(f"  Título: {property_data['titulo']}")
        print(f"  Precio: {property_data['precio']:,.0f}€")
        print(f"  Tamaño: {property_data['tamaño']}m²")
        print(f"  Precio/m²: {property_data['precio_m2']:.0f}€/m²")
        print(f"  Habitaciones: {property_data['habitaciones']}")
        print(f"  Baños: {property_data['baños']}")
        print(f"  Ubicación: {property_data['direccion']}")
        
        # Verificar si ya existe
        if sheets.property_exists(property_data['id']):
            print(f"\n⚠️  La propiedad {property_data['id']} ya existe en la hoja")
        else:
            # Añadir a Google Sheets
            if sheets.add_property(property_data):
                print(f"\n✅ ¡Propiedad añadida exitosamente a Google Sheets!")
                print(f"🔗 {sheets.get_spreadsheet_url()}")
            else:
                print(f"\n❌ Error añadiendo la propiedad a Google Sheets")
    else:
        print("\n❌ No se pudieron extraer los datos de la propiedad")


def main():
    """Función principal"""
    
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python scrape_urls.py <archivo_urls.txt>    # Múltiples URLs")
        print("  python scrape_urls.py <url>                  # Una sola URL")
        print()
        print("Ejemplos:")
        print("  python scrape_urls.py urls.txt")
        print("  python scrape_urls.py https://www.idealista.com/inmueble/108542671/")
        return
    
    arg = sys.argv[1]
    
    # Detectar si es una URL o un archivo
    if arg.startswith('http'):
        scrape_single_url(arg)
    else:
        scrape_urls_from_file(arg)


if __name__ == '__main__':
    main()


