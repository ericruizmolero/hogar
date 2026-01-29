#!/usr/bin/env python3
"""
Script de verificación de configuración para el tracker de Idealista
Ejecuta este script para verificar que todo esté configurado correctamente
"""

import os
import sys
import json


def print_header(text):
    """Imprime un encabezado decorado"""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)


def print_success(text):
    """Imprime mensaje de éxito"""
    print(f"✅ {text}")


def print_error(text):
    """Imprime mensaje de error"""
    print(f"❌ {text}")


def print_warning(text):
    """Imprime mensaje de advertencia"""
    print(f"⚠️  {text}")


def print_info(text):
    """Imprime mensaje informativo"""
    print(f"ℹ️  {text}")


def check_python_version():
    """Verifica la versión de Python"""
    print_header("1. Verificando versión de Python")
    
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"
    
    if version.major >= 3 and version.minor >= 8:
        print_success(f"Python {version_str} (compatible)")
        return True
    else:
        print_error(f"Python {version_str} (requiere 3.8 o superior)")
        return False


def check_dependencies():
    """Verifica que las dependencias estén instaladas"""
    print_header("2. Verificando dependencias")
    
    required = {
        'requests': 'requests',
        'gspread': 'gspread',
        'google.oauth2': 'google-auth',
        'dotenv': 'python-dotenv'
    }
    
    all_ok = True
    for module, package in required.items():
        try:
            __import__(module)
            print_success(f"{package} instalado")
        except ImportError:
            print_error(f"{package} NO instalado")
            all_ok = False
    
    if not all_ok:
        print_info("Instala las dependencias con: pip install -r requirements.txt")
    
    return all_ok


def check_env_file():
    """Verifica que exista el archivo .env"""
    print_header("3. Verificando archivo .env")
    
    if not os.path.exists('.env'):
        print_error("Archivo .env no encontrado")
        print_info("Copia env.example a .env: cp env.example .env")
        return False
    
    print_success("Archivo .env encontrado")
    
    # Verificar variables críticas
    from dotenv import load_dotenv
    load_dotenv()
    
    use_rapidapi = os.getenv('USE_RAPIDAPI', 'false').lower() == 'true'
    
    all_ok = True
    
    if use_rapidapi:
        print_info("Modo: RapidAPI")
        # Verificar RapidAPI
        rapidapi_key = os.getenv('RAPIDAPI_KEY')
        if not rapidapi_key or rapidapi_key.startswith('tu_'):
            print_error("RAPIDAPI_KEY no configurado")
            print_info("Obtén tu clave en: https://rapidapi.com/palawer/api/idealista-historico")
            all_ok = False
        else:
            print_success(f"RAPIDAPI_KEY configurado ({rapidapi_key[:20]}...)")
    else:
        print_info("Modo: API Oficial de Idealista")
        # Verificar API oficial
        critical_vars = {
            'IDEALISTA_API_KEY': 'API Key de Idealista',
            'IDEALISTA_API_SECRET': 'API Secret de Idealista'
        }
        
        for var, description in critical_vars.items():
            value = os.getenv(var)
            if not value or value.startswith('tu_'):
                print_error(f"{var} no configurado ({description})")
                all_ok = False
            else:
                print_success(f"{var} configurado")
    
    return all_ok


def check_credentials_file():
    """Verifica que exista el archivo de credenciales de Google"""
    print_header("4. Verificando credenciales de Google")
    
    creds_file = os.getenv('GOOGLE_SHEETS_CREDENTIALS_FILE', 'credentials.json')
    
    if not os.path.exists(creds_file):
        print_error(f"Archivo {creds_file} no encontrado")
        print_info("Descarga las credenciales desde Google Cloud Console")
        return False
    
    print_success(f"Archivo {creds_file} encontrado")
    
    # Verificar que sea un JSON válido
    try:
        with open(creds_file, 'r') as f:
            data = json.load(f)
        
        if 'client_email' in data:
            print_success(f"Email de cuenta de servicio: {data['client_email']}")
            print_info("Recuerda compartir tu hoja de Google Sheets con este email")
        else:
            print_warning("El archivo parece no ser de una cuenta de servicio")
            
    except json.JSONDecodeError:
        print_error(f"El archivo {creds_file} no es un JSON válido")
        return False
    
    return True


def check_idealista_connection():
    """Verifica la conexión con la API de Idealista"""
    print_header("5. Probando conexión con Idealista")
    
    try:
        import config
        
        if config.USE_RAPIDAPI:
            print_info("Usando RapidAPI...")
            from idealista_rapidapi import IdealistaRapidAPI
            api = IdealistaRapidAPI()
        else:
            print_info("Usando API oficial de Idealista...")
            from idealista_api import IdealistaAPI
            api = IdealistaAPI()
            # Obtener token
            print_info("Obteniendo token de acceso...")
            token = api._get_access_token()
            print_success(f"Token obtenido: {token[:20]}...")
        
        # Buscar propiedades
        print_info("Buscando propiedades...")
        properties = api.search_properties()
        print_success(f"Se encontraron {len(properties)} propiedades")
        
        if properties:
            sample = api.format_property_data(properties[0])
            print_info(f"Ejemplo: {sample['titulo'][:50]}... - {sample['precio']:,.0f}€")
        
        return True
        
    except Exception as e:
        print_error(f"Error: {e}")
        if "Invalid API key" in str(e):
            print_info("Verifica tu RAPIDAPI_KEY en .env")
        return False


def check_google_sheets_connection():
    """Verifica la conexión con Google Sheets"""
    print_header("6. Probando conexión con Google Sheets")
    
    try:
        from google_sheets import GoogleSheetsManager
        
        sheets = GoogleSheetsManager()
        
        print_info("Accediendo a la hoja de cálculo...")
        sheets.get_or_create_spreadsheet()
        
        url = sheets.get_spreadsheet_url()
        print_success("Hoja de cálculo accesible")
        print_info(f"URL: {url}")
        
        ids = sheets.get_all_property_ids()
        print_success(f"Propiedades en la hoja: {len(ids)}")
        
        return True
        
    except Exception as e:
        print_error(f"Error: {e}")
        
        if "does not have permission" in str(e):
            print_info("¿Compartiste la hoja con la cuenta de servicio?")
        elif "not found" in str(e).lower():
            print_info("¿Existe una hoja con ese nombre? Se creará una nueva.")
        
        return False


def check_configuration():
    """Verifica la configuración general"""
    print_header("7. Verificando configuración")
    
    import config
    
    print_info(f"País: {config.IDEALISTA_COUNTRY}")
    print_info(f"Centro de búsqueda: {config.CENTER}")
    print_info(f"Radio: {config.DISTANCE}m")
    print_info(f"Tipo de propiedad: {config.PROPERTY_TYPE}")
    print_info(f"Operación: {config.OPERATION}")
    print_info(f"Rango de precio: {config.MIN_PRICE:,.0f}€ - {config.MAX_PRICE:,.0f}€")
    print_info(f"Rango de tamaño: {config.MIN_SIZE}m² - {config.MAX_SIZE}m²")
    print_info(f"Intervalo de comprobación: {config.CHECK_INTERVAL_MINUTES} minutos")
    
    print_success("Configuración cargada correctamente")
    return True


def main():
    """Función principal"""
    print("""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🔍  VERIFICADOR DE CONFIGURACIÓN  🔍                ║
║         Tracker de Propiedades de Idealista               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    results = []
    
    # Ejecutar todas las verificaciones
    results.append(("Python", check_python_version()))
    results.append(("Dependencias", check_dependencies()))
    results.append(("Archivo .env", check_env_file()))
    results.append(("Credenciales Google", check_credentials_file()))
    results.append(("Configuración", check_configuration()))
    results.append(("API Idealista", check_idealista_connection()))
    results.append(("Google Sheets", check_google_sheets_connection()))
    
    # Resumen final
    print_header("RESUMEN")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\nPruebas superadas: {passed}/{total}\n")
    
    for name, result in results:
        if result:
            print_success(f"{name}")
        else:
            print_error(f"{name}")
    
    print()
    
    if passed == total:
        print("╔════════════════════════════════════════════════════════════╗")
        print("║                                                            ║")
        print("║  ✅ ¡TODO CONFIGURADO CORRECTAMENTE!                      ║")
        print("║                                                            ║")
        print("║  Ya puedes ejecutar:                                      ║")
        print("║  $ python main.py                                         ║")
        print("║                                                            ║")
        print("╚════════════════════════════════════════════════════════════╝")
        return 0
    else:
        print("╔════════════════════════════════════════════════════════════╗")
        print("║                                                            ║")
        print("║  ⚠️  CONFIGURACIÓN INCOMPLETA                             ║")
        print("║                                                            ║")
        print("║  Revisa los errores arriba y corrígelos                   ║")
        print("║  Lee el README.md o GUIA_RAPIDA.md para más ayuda        ║")
        print("║                                                            ║")
        print("╚════════════════════════════════════════════════════════════╝")
        return 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n👋 Verificación cancelada")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

