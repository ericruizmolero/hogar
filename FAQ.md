# ❓ Preguntas Frecuentes (FAQ)

## 🚀 Instalación y Configuración

### ¿Cuánto tiempo tarda en configurarse todo?

Con el script de instalación automática (`install.sh`), unos 5-10 minutos. La mayor parte del tiempo se va en obtener las credenciales de Idealista y Google.

### ¿Es gratis usar este tracker?

Sí, el software es completamente gratuito y de código abierto. Sin embargo:
- La API de Idealista tiene planes gratuitos limitados
- Google Sheets API es gratuita para uso normal
- Necesitas Python instalado (gratuito)

### ¿Necesito conocimientos de programación?

No es necesario. Solo necesitas:
1. Seguir las instrucciones del README
2. Saber copiar y pegar
3. Editar archivos de texto básicos

### ¿Funciona en Windows?

Sí, pero el script `install.sh` es para macOS/Linux. En Windows:
1. Instala Python manualmente
2. Crea el entorno virtual: `python -m venv venv`
3. Actívalo: `venv\Scripts\activate`
4. Instala dependencias: `pip install -r requirements.txt`
5. Configura `.env` manualmente

## 🔑 Credenciales y APIs

### ¿Cómo obtengo credenciales de Idealista?

1. Regístrate en https://developers.idealista.com/access-request
2. Completa el formulario explicando tu caso de uso
3. Espera la aprobación (puede tardar días)
4. Accede a tu panel y obtén API Key y Secret

**Nota**: Idealista revisa las solicitudes manualmente. Sé honesto sobre tu uso.

### ¿Por qué Idealista no me aprueba?

Idealista es selectivo. Recomendaciones:
- Explica claramente tu uso (uso personal, no comercial)
- Menciona que es para trackear propiedades de tu interés
- No menciones scraping o uso masivo
- Sé profesional en la solicitud

### ¿Cuántas búsquedas puedo hacer con Idealista?

Depende de tu plan:
- **Gratuito**: Limitado (consulta tu plan)
- **De pago**: Más peticiones

Recomendación: No hagas búsquedas cada menos de 15 minutos.

### ¿Cómo creo una cuenta de servicio de Google?

Sigue la guía en `GUIA_RAPIDA.md` sección 3. En resumen:
1. Google Cloud Console
2. Crear proyecto
3. Habilitar APIs (Sheets + Drive)
4. Crear cuenta de servicio
5. Descargar JSON

### ¿Por qué Google me da error de permisos?

**Error común**: "The caller does not have permission"

**Solución**:
1. Abre `credentials.json`
2. Copia el campo `client_email`
3. Ve a tu hoja de Google Sheets
4. Click en "Compartir"
5. Pega ese email
6. Dale permisos de "Editor"
7. Enviar

## 🔍 Búsqueda y Tracking

### ¿Cómo cambio el área de búsqueda?

Edita `.env`:
```env
IDEALISTA_CENTER=latitud,longitud
IDEALISTA_DISTANCE=metros
```

Para obtener coordenadas:
1. Google Maps → Click derecho en ubicación
2. Copiar coordenadas
3. Pegar en formato: `40.4168,-3.7038`

### ¿Puedo buscar en varias ciudades a la vez?

No directamente. Opciones:
1. Ejecuta múltiples instancias del programa (una por ciudad)
2. Modifica el código para hacer varias búsquedas
3. Usa un centro intermedio con radio grande

### ¿Cuántas propiedades detecta en cada búsqueda?

La API de Idealista devuelve hasta 50 propiedades por búsqueda (configurable con `maxItems`). El programa detecta cuáles son nuevas desde la última búsqueda.

### ¿Qué pasa si cambio los filtros de búsqueda?

Si amplías los filtros (más rango de precio, más área), detectará propiedades que antes no entraban. Si quieres evitar que las marque como "nuevas", no borres `seen_properties.json`.

### ¿Cada cuánto tiempo debo buscar?

Recomendación: **30 minutos** (valor por defecto)

- Menos de 15 min: Puede saturar la API
- 30-60 min: Óptimo para propiedades nuevas
- Más de 2 horas: Puede que pierdas propiedades que se publiquen y retiren rápido

### ¿Cómo busco pisos en alquiler en lugar de venta?

Edita `.env`:
```env
IDEALISTA_OPERATION=rent
```

### ¿Puedo filtrar por número de habitaciones?

Actualmente no está implementado, pero puedes añadirlo:

Edita `idealista_api.py`, método `search_properties()`, añade:
```python
params = {
    # ... otros parámetros ...
    'minRooms': 2,  # Mínimo de habitaciones
    'maxRooms': 4,  # Máximo de habitaciones
}
```

## 📊 Google Sheets

### ¿Puedo usar varias hojas en la misma hoja de cálculo?

El programa usa solo la primera hoja. Si quieres separar por tipo (venta/alquiler), ejecuta dos instancias con diferentes nombres de hojas.

### ¿Cómo ordeno las propiedades en la hoja?

Google Sheets permite ordenar:
1. Selecciona todas las filas
2. Datos → Ordenar rango
3. Ordena por "Precio" o "Fecha Añadido"

### ¿Puedo añadir mis propias columnas?

Sí:
1. Añade columnas en Google Sheets
2. El programa no las tocará
3. Puedes usarlas para notas, valoraciones, etc.

### ¿Cuántas propiedades puede almacenar?

Google Sheets soporta hasta 10 millones de celdas. Con 20 columnas, son ~500,000 filas. Más que suficiente.

### ¿Puedo exportar los datos?

Sí, desde Google Sheets:
- Archivo → Descargar → CSV/Excel/PDF

## 🔔 Notificaciones

### ¿Cómo activo las notificaciones?

Edita `notifications.py` y descomenta el canal que quieras:
```python
def _setup_channels(self):
    self.enabled_channels.append('email')     # Email
    self.enabled_channels.append('telegram')  # Telegram
    self.enabled_channels.append('slack')     # Slack
```

Luego configura las credenciales en `.env`.

### ¿Puedo recibir notificaciones solo de ciertas propiedades?

Sí, modifica `tracker.py`, método `_send_notification()`, añade condiciones:
```python
# Solo notificar si el precio/m² es bueno
if property_data['precio_m2'] < 3000:
    self._send_notification(property_data)
```

### ¿Las notificaciones incluyen fotos?

Sí, si el canal lo soporta:
- ✅ Email (HTML)
- ✅ Telegram
- ✅ Slack
- ❌ Consola

### ¿Puedo recibir un resumen diario en lugar de notificaciones inmediatas?

Actualmente no, pero puedes modificarlo:
1. Comenta `self._send_notification()` en `tracker.py`
2. Guarda las propiedades del día
3. Envía un resumen al final del día

## 🔧 Ejecución y Mantenimiento

### ¿El programa debe estar siempre corriendo?

Depende:
- **Modo continuo**: Sí, debe estar corriendo
- **Cron/LaunchAgent**: No, se ejecuta automáticamente

### ¿Consume muchos recursos?

No. Consumo mínimo:
- CPU: Solo al hacer búsquedas
- RAM: ~50-100 MB
- Red: Mínimo (solo peticiones API)

### ¿Puedo ejecutarlo en un servidor?

Sí, perfecto para:
- VPS (DigitalOcean, Linode, etc.)
- Raspberry Pi
- NAS (Synology, QNAP)
- Servidor local

### ¿Qué pasa si se corta la conexión?

El programa intentará la siguiente búsqueda en el próximo intervalo. Las propiedades publicadas mientras estaba caído se detectarán en la siguiente ejecución (si aún están disponibles).

### ¿Cómo detengo el programa?

- **Modo continuo**: `Ctrl+C`
- **LaunchAgent**: `launchctl unload ~/Library/LaunchAgents/com.idealista.tracker.plist`

### ¿Cómo actualizo el código?

```bash
cd /Users/ericruiz/Desktop/Hogar
git pull  # Si usas Git
# O descarga la nueva versión
pip install -r requirements.txt  # Por si hay nuevas dependencias
```

**Importante**: No borres `.env` ni `seen_properties.json`

## 🐛 Problemas y Errores

### Error: "401 Unauthorized" (Idealista)

**Causa**: Credenciales incorrectas

**Solución**:
1. Verifica API Key y Secret en `.env`
2. Asegúrate de no tener espacios extra
3. Regenera las credenciales en Idealista

### Error: "The caller does not have permission" (Google)

**Causa**: Hoja no compartida con la cuenta de servicio

**Solución**: Ver sección "Credenciales y APIs" arriba

### Error: "SpreadsheetNotFound"

**Causa**: El nombre de la hoja no coincide

**Solución**:
1. Verifica `GOOGLE_SHEETS_SPREADSHEET_NAME` en `.env`
2. Debe coincidir exactamente (mayúsculas, espacios)
3. O déjalo crear una nueva hoja automáticamente

### No encuentra propiedades nuevas

**Posibles causas**:
1. Filtros muy restrictivos → Amplía rango de precio/tamaño
2. Zona sin actividad → Prueba otra ubicación
3. Ya están en `seen_properties.json` → Es normal

### El programa se detiene solo

**Posibles causas**:
1. Error en la API → Revisa logs
2. Problema de red → Verifica conexión
3. Límite de API alcanzado → Reduce frecuencia

**Solución**: Usa LaunchAgent para reinicio automático

### ¿Dónde veo los errores?

1. En consola (si ejecutas directamente)
2. En `logs/stderr.log` (si usas LaunchAgent)
3. Ejecuta `python main.py test` para diagnóstico

## 📈 Optimización

### ¿Cómo acelero las búsquedas?

Las búsquedas ya son rápidas (~2-3 segundos). No es recomendable hacerlas más frecuentes.

### ¿Puedo buscar varios tipos de propiedad a la vez?

No directamente. Ejecuta múltiples instancias con diferentes configuraciones.

### ¿Cómo evito duplicados si ejecuto varias instancias?

Cada instancia debe tener su propio:
- Archivo `.env` (o variables de entorno diferentes)
- `seen_properties.json` con nombre único
- Hoja de Google Sheets diferente

### ¿Puedo usar una base de datos en lugar de Google Sheets?

Sí, reemplaza `google_sheets.py` con tu propia implementación para:
- MySQL
- PostgreSQL
- MongoDB
- SQLite

## 🔒 Seguridad y Privacidad

### ¿Mis datos están seguros?

- Las credenciales están en tu máquina (`.env`, `credentials.json`)
- Google Sheets es privado (solo tú tienes acceso)
- El código es open source (puedes revisarlo)
- No hay servidor externo

### ¿Alguien más puede ver mis propiedades?

No, a menos que:
- Compartas tu hoja de Google Sheets
- Alguien acceda a tu máquina
- Subas `.env` o `credentials.json` a Internet

### ¿Puedo usar esto comercialmente?

El código es MIT License (permisivo), pero:
- Verifica los términos de uso de Idealista
- Google Sheets tiene límites para uso comercial
- Considera un plan de pago si es uso intensivo

## 💡 Casos de Uso

### Busco piso para comprar

```env
IDEALISTA_OPERATION=sale
IDEALISTA_PROPERTY_TYPE=homes
IDEALISTA_MAX_PRICE=300000
IDEALISTA_MIN_PRICE=200000
```

### Busco estudio en alquiler

```env
IDEALISTA_OPERATION=rent
IDEALISTA_PROPERTY_TYPE=homes
IDEALISTA_MAX_PRICE=900
IDEALISTA_MIN_PRICE=600
IDEALISTA_MIN_SIZE=30
IDEALISTA_MAX_SIZE=50
```

### Busco local comercial

```env
IDEALISTA_OPERATION=sale
IDEALISTA_PROPERTY_TYPE=premises
IDEALISTA_MAX_PRICE=100000
```

### Busco plaza de garaje

```env
IDEALISTA_OPERATION=sale
IDEALISTA_PROPERTY_TYPE=garages
IDEALISTA_MAX_PRICE=20000
```

### Estoy en el extranjero, ¿funciona?

Sí, siempre que tengas acceso a:
- Internet
- La API de Idealista (puede estar geo-restringida)
- Google Sheets

## 🆘 Soporte

### ¿Dónde pido ayuda?

1. Lee este FAQ
2. Lee `README.md` y `GUIA_RAPIDA.md`
3. Ejecuta `python verify.py`
4. Revisa los logs en `logs/`
5. Busca el error en Google
6. Abre un issue en GitHub (si aplica)

### ¿Puedo contratar soporte?

Este es un proyecto open source sin soporte comercial, pero puedes:
1. Contratar a un desarrollador Python freelance
2. Buscar en foros de Python
3. Preguntar en Stack Overflow

### ¿Puedo contribuir al proyecto?

¡Sí! Contribuciones bienvenidas:
- Reporta bugs
- Sugiere mejoras
- Envía pull requests
- Mejora la documentación
- Comparte tu experiencia

---

**¿No encuentras tu pregunta?** Abre un issue en GitHub con la etiqueta "question".


