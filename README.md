# 🏠 Tracker de Propiedades de Idealista

Sistema automatizado para trackear nuevas propiedades en Idealista y registrarlas automáticamente en Google Sheets con notificaciones en tiempo real.

## 🌟 Características

- ✅ Conexión automática con la API de Idealista
- ✅ Registro automático en Google Sheets
- ✅ Detección de nuevas propiedades en tiempo real
- ✅ Filtros personalizables (precio, tamaño, ubicación, etc.)
- ✅ Evita duplicados automáticamente
- ✅ Notificaciones de nuevas propiedades
- ✅ Modo continuo o búsqueda única
- ✅ Histórico de propiedades rastreadas

## 📋 Requisitos Previos

### 1. API de Idealista - Dos Opciones Disponibles

**⭐ OPCIÓN A: RapidAPI (RECOMENDADO - Más Fácil)**

La forma más rápida y sencilla de empezar:

1. Regístrate en RapidAPI: https://rapidapi.com/auth/sign-up
2. Suscríbete a la API: https://rapidapi.com/palawer/api/idealista-historico
3. Copia tu API Key (plan gratuito disponible)
4. **No requiere aprobación** - Empieza en minutos
5. Lee la [Guía de RapidAPI](RAPIDAPI_GUIA.md) para más detalles

**OPCIÓN B: API Oficial de Idealista**

Si prefieres la API oficial:

1. Regístrate en el portal de desarrolladores de Idealista: https://developers.idealista.com/
2. Crea una aplicación para obtener tu `API Key` y `API Secret`
3. **Requiere aprobación manual** (puede tardar varios días)
4. Documenta tus credenciales (las necesitarás para la configuración)

### 2. Google Cloud Console

Para acceder a Google Sheets, necesitas crear una cuenta de servicio:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto (o selecciona uno existente)
3. Habilita la API de Google Sheets:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Sheets API" y habilítala
   - Busca "Google Drive API" y habilítala
4. Crea una cuenta de servicio:
   - Ve a "APIs & Services" > "Credentials"
   - Haz clic en "Create Credentials" > "Service Account"
   - Dale un nombre (ej: "idealista-tracker")
   - Haz clic en "Create and Continue"
   - En "Role", selecciona "Editor"
   - Haz clic en "Done"
5. Descarga las credenciales JSON:
   - En la lista de cuentas de servicio, haz clic en la que acabas de crear
   - Ve a la pestaña "Keys"
   - Haz clic en "Add Key" > "Create new key"
   - Selecciona formato JSON
   - Descarga el archivo y guárdalo como `credentials.json` en la carpeta del proyecto

### 3. Python 3.8 o superior

```bash
python --version  # Debe ser 3.8 o superior
```

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd /Users/ericruiz/Desktop/Hogar
```

### 2. Crear un entorno virtual (recomendado)

```bash
python3 -m venv venv
source venv/bin/activate  # En macOS/Linux
# o
venv\Scripts\activate  # En Windows
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo con tus credenciales:

```bash
cp env.example .env
```

Edita el archivo `.env` con tus datos:

```env
# Credenciales de Idealista (OBLIGATORIO)
IDEALISTA_API_KEY=tu_api_key_de_idealista
IDEALISTA_API_SECRET=tu_api_secret_de_idealista

# Configuración de búsqueda
IDEALISTA_COUNTRY=es
IDEALISTA_LANGUAGE=es
IDEALISTA_CENTER=40.4168,-3.7038  # Coordenadas (lat,long) del centro de búsqueda
IDEALISTA_DISTANCE=5000  # Radio en metros
IDEALISTA_PROPERTY_TYPE=homes  # homes, offices, premises, garages, bedrooms
IDEALISTA_OPERATION=sale  # sale (venta) o rent (alquiler)
IDEALISTA_MAX_PRICE=300000  # Precio máximo en euros
IDEALISTA_MIN_PRICE=150000  # Precio mínimo en euros
IDEALISTA_MIN_SIZE=60  # Tamaño mínimo en m²
IDEALISTA_MAX_SIZE=120  # Tamaño máximo en m²

# Google Sheets (OBLIGATORIO)
GOOGLE_SHEETS_CREDENTIALS_FILE=credentials.json  # Archivo de credenciales descargado
GOOGLE_SHEETS_SPREADSHEET_NAME=Pisos Idealista  # Nombre de tu hoja de cálculo

# Configuración de tracking
CHECK_INTERVAL_MINUTES=30  # Cada cuántos minutos buscar nuevas propiedades
```

### 5. Colocar credenciales de Google

Asegúrate de que el archivo `credentials.json` esté en la carpeta del proyecto.

## 📖 Uso

### Modo 1: Monitoreo Continuo (Recomendado)

Ejecuta el tracker continuamente, buscando nuevas propiedades cada X minutos:

```bash
python main.py
```

El programa seguirá ejecutándose y comprobando nuevas propiedades automáticamente.
Presiona `Ctrl+C` para detenerlo.

### Modo 2: Búsqueda Única

Ejecuta una sola búsqueda y termina:

```bash
python main.py once
```

Ideal para probar la configuración o ejecutar búsquedas programadas con cron/launchd.

### Modo 3: Test de Conexión

Prueba que todo esté configurado correctamente:

```bash
python main.py test
```

Esto verificará:
- ✅ Conexión con la API de Idealista
- ✅ Acceso a Google Sheets
- ✅ Configuración correcta

## 📊 Estructura de Google Sheets

El programa creará automáticamente una hoja de cálculo con las siguientes columnas:

| Columna | Descripción |
|---------|-------------|
| ID | Identificador único de la propiedad |
| Título | Título del anuncio |
| Precio (€) | Precio de la propiedad |
| Tamaño (m²) | Superficie en metros cuadrados |
| Precio/m² | Precio por metro cuadrado |
| Habitaciones | Número de habitaciones |
| Baños | Número de baños |
| Planta | Planta del inmueble |
| Exterior | Si es exterior o interior |
| Ascensor | Si tiene ascensor |
| Parking | Si incluye parking |
| Dirección | Dirección completa |
| Distrito | Distrito o barrio |
| Municipio | Municipio |
| Provincia | Provincia |
| URL | Enlace al anuncio en Idealista |
| Thumbnail | URL de la imagen principal |
| Descripción | Descripción del anuncio |
| Fecha Añadido | Cuándo se detectó la propiedad |
| Estado | Estado (Nuevo, Visto, etc.) |

## 🔧 Configuración Avanzada

### Cambiar el centro de búsqueda

Para buscar en otra ubicación, necesitas las coordenadas (latitud, longitud):

1. Ve a Google Maps
2. Haz clic derecho en la ubicación deseada
3. Copia las coordenadas (ej: `40.4168, -3.7038`)
4. Actualiza `IDEALISTA_CENTER` en tu archivo `.env`

### Tipos de propiedad disponibles

- `homes` - Viviendas
- `offices` - Oficinas
- `premises` - Locales comerciales
- `garages` - Garajes
- `bedrooms` - Habitaciones

### Operaciones disponibles

- `sale` - Venta
- `rent` - Alquiler

## 🔄 Automatización

### macOS/Linux - Usar cron

Edita el crontab:

```bash
crontab -e
```

Añade una línea para ejecutar cada hora:

```bash
0 * * * * cd /Users/ericruiz/Desktop/Hogar && /Users/ericruiz/Desktop/Hogar/venv/bin/python main.py once
```

### macOS - Usar launchd (Recomendado)

Crea un archivo `~/Library/LaunchAgents/com.user.idealista-tracker.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.user.idealista-tracker</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/ericruiz/Desktop/Hogar/venv/bin/python</string>
        <string>/Users/ericruiz/Desktop/Hogar/main.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/ericruiz/Desktop/Hogar</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/ericruiz/Desktop/Hogar/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/ericruiz/Desktop/Hogar/logs/stderr.log</string>
</dict>
</plist>
```

Carga el servicio:

```bash
mkdir -p /Users/ericruiz/Desktop/Hogar/logs
launchctl load ~/Library/LaunchAgents/com.user.idealista-tracker.plist
```

## 🛠️ Solución de Problemas

### Error: "No module named 'gspread'"

```bash
pip install -r requirements.txt
```

### Error: "Unable to find credentials"

Asegúrate de que `credentials.json` esté en la carpeta del proyecto y que el nombre coincida con `GOOGLE_SHEETS_CREDENTIALS_FILE` en `.env`.

### Error: "The caller does not have permission"

Comparte la hoja de Google Sheets con el email de la cuenta de servicio (está en `credentials.json` como `client_email`).

### La hoja no se actualiza

1. Verifica que el nombre de la hoja en `.env` coincida con el nombre real
2. Asegúrate de que la cuenta de servicio tenga permisos de editor
3. Ejecuta `python main.py test` para diagnosticar

## 📁 Estructura del Proyecto

```
Hogar/
├── main.py                  # Punto de entrada principal
├── tracker.py              # Lógica de tracking
├── idealista_api.py        # Cliente de API de Idealista
├── google_sheets.py        # Gestor de Google Sheets
├── config.py               # Configuración
├── requirements.txt        # Dependencias de Python
├── .env                    # Variables de entorno (NO SUBIR A GIT)
├── env.example            # Ejemplo de configuración
├── credentials.json        # Credenciales de Google (NO SUBIR A GIT)
├── seen_properties.json    # Cache de propiedades vistas
├── .gitignore             # Archivos a ignorar en git
└── README.md              # Este archivo
```

## 🔒 Seguridad

**IMPORTANTE**: Nunca subas estos archivos a un repositorio público:
- `.env`
- `credentials.json`
- `seen_properties.json`

Todos están incluidos en `.gitignore` para tu protección.

## 🤝 Contribuciones

Si encuentras algún error o quieres añadir funcionalidades:

1. Crea un fork del proyecto
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📝 Notas Adicionales

### Límites de la API de Idealista

La API de Idealista tiene límites de uso. Revisa tu plan para conocer:
- Número de peticiones por mes
- Número de resultados por petición

### Costos de Google Sheets API

Google Sheets API es gratuita para uso normal, pero tiene límites:
- 300 peticiones por minuto por proyecto
- 60 peticiones por minuto por usuario

Este programa está optimizado para no exceder estos límites.

## 📞 Soporte

Si tienes problemas:

1. Revisa la sección "Solución de Problemas"
2. Ejecuta `python main.py test` para diagnosticar
3. Revisa los logs de error
4. Abre un issue en GitHub con los detalles

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🎯 Próximas Funcionalidades

- [ ] Notificaciones por email
- [ ] Notificaciones por Telegram
- [ ] Integración con Slack
- [ ] Análisis de precios y tendencias
- [ ] Alertas personalizadas por criterios
- [ ] Dashboard web
- [ ] Comparación con propiedades similares

---

**¡Hecho con ❤️ para encontrar tu hogar ideal!**

