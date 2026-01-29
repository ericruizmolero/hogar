#!/usr/bin/env python3
"""
Script principal para trackear propiedades de Idealista
"""

from tracker import PropertyTracker
import sys


def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🏠  TRACKER DE PROPIEDADES DE IDEALISTA  🏠         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    try:
        tracker = PropertyTracker()
        
        # Comprobar argumentos
        if len(sys.argv) > 1:
            if sys.argv[1] == 'once':
                print("🔍 Modo: Búsqueda única\n")
                tracker.run_once()
            elif sys.argv[1] == 'test':
                print("🧪 Modo: Test de conexión\n")
                test_connections(tracker)
            else:
                print(f"❌ Argumento desconocido: {sys.argv[1]}")
                print_usage()
        else:
            print("🔄 Modo: Monitoreo continuo\n")
            tracker.run_continuous()
            
    except KeyboardInterrupt:
        print("\n\n👋 ¡Hasta luego!")
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def test_connections(tracker):
    """Prueba las conexiones con las APIs"""
    print("="*60)
    print("Probando conexión con Idealista...")
    print("="*60)
    
    try:
        token = tracker.idealista._get_access_token()
        print(f"✅ Token obtenido: {token[:20]}...")
        
        properties = tracker.idealista.search_properties()
        print(f"✅ Se encontraron {len(properties)} propiedades")
        
        if properties:
            sample = tracker.idealista.format_property_data(properties[0])
            print(f"\n📋 Ejemplo de propiedad:")
            print(f"   ID: {sample['id']}")
            print(f"   Título: {sample['titulo'][:50]}")
            print(f"   Precio: {sample['precio']:,.0f}€")
            
    except Exception as e:
        print(f"❌ Error con Idealista: {e}")
        return False
    
    print("\n" + "="*60)
    print("Probando conexión con Google Sheets...")
    print("="*60)
    
    try:
        tracker.sheets.get_or_create_spreadsheet()
        print(f"✅ Hoja de cálculo accesible")
        print(f"   URL: {tracker.sheets.get_spreadsheet_url()}")
        
        ids = tracker.sheets.get_all_property_ids()
        print(f"✅ Propiedades en la hoja: {len(ids)}")
        
    except Exception as e:
        print(f"❌ Error con Google Sheets: {e}")
        return False
    
    print("\n" + "="*60)
    print("✅ ¡Todas las conexiones funcionan correctamente!")
    print("="*60)
    return True


def print_usage():
    """Muestra información de uso"""
    print("""
Uso: python main.py [modo]

Modos disponibles:
  (ninguno)  - Ejecuta el tracker en modo continuo
  once       - Ejecuta una única búsqueda
  test       - Prueba las conexiones con las APIs

Ejemplos:
  python main.py           # Modo continuo
  python main.py once      # Búsqueda única
  python main.py test      # Test de conexión
    """)


if __name__ == '__main__':
    main()


