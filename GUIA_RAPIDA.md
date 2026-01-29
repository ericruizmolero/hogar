# 🚀 Guía Rápida de Inicio

## Instalación Express (5 minutos)

### 1. Ejecutar el instalador automático

```bash
cd /Users/ericruiz/Desktop/Hogar
./install.sh
```

El script hará todo automáticamente:
- ✅ Verificar Python
- ✅ Crear entorno virtual
- ✅ Instalar dependencias
- ✅ Configurar archivos
- ✅ Probar conexión

### 2. Obtener credenciales de Idealista

**Opción A: Ya tengo cuenta de desarrollador**

Si ya tienes API Key y Secret, edita el archivo `.env`:

```bash
nano .env
```

Busca y modifica:
```
IDEALISTA_API_KEY=pega_tu_key_aqui
IDEALISTA_API_SECRET=pega_tu_secret_aqui
```

**Opción B: Necesito registrarme**

1. Ve a: https://developers.idealista.com/access-request
2. Completa el formulario de solicitud
3. Espera la aprobación (puede tardar unos días)
4. Una vez aprobado, accede a tu panel y obtén tus credenciales
5. Pégalas en el archivo `.env`

### 3. Configurar Google Sheets

**Paso 1: Crear cuenta de servicio**

1. Ve a: https://console.cloud.google.com/
2. Crea un nuevo proyecto (o usa uno existente)
3. Busca "Google Sheets API" en el buscador y actívala
4. Busca "Google Drive API" y actívala también
5. Ve a "APIs & Services" → "Credentials"
6. Click "Create Credentials" → "Service Account"
7. Dale un nombre: `idealista-tracker`
8. Click en la cuenta creada → pestaña "Keys"
9. "Add Key" → "Create new key" → JSON
10. Descarga el archivo y guárdalo como `credentials.json` en la carpeta del proyecto

**Paso 2: Obtener el email de la cuenta de servicio**

Abre `credentials.json` y busca el campo `client_email`. Cópialo.

**Paso 3: Compartir la hoja de Google Sheets**

1. Crea una nueva hoja de Google Sheets
2. Nómbrala "Pisos Idealista" (o el nombre que hayas puesto en `.env`)
3. Click en "Compartir"
4. Pega el email de la cuenta de servicio
5. Dale permisos de "Editor"
6. Click "Enviar"

### 4. Personalizar búsqueda

Edita `.env` para ajustar tu búsqueda:

```bash
# Cambiar ubicación (ejemplo: Malasaña, Madrid)
IDEALISTA_CENTER=40.4254,-3.7076

# Cambiar precios
IDEALISTA_MAX_PRICE=350000
IDEALISTA_MIN_PRICE=200000

# Cambiar tamaño
IDEALISTA_MIN_SIZE=70
IDEALISTA_MAX_SIZE=100

# Cambiar distancia (metros)
IDEALISTA_DISTANCE=3000
```

**¿Cómo obtener coordenadas?**
1. Ve a Google Maps
2. Haz clic derecho en la ubicación deseada
3. Click en las coordenadas para copiarlas
4. Pégalas en formato: `latitud,longitud`

### 5. Probar configuración

```bash
source venv/bin/activate
python main.py test
```

Deberías ver:
```
✅ Token obtenido: ...
✅ Se encontraron X propiedades
✅ Hoja de cálculo accesible
✅ ¡Todas las conexiones funcionan correctamente!
```

### 6. ¡Lanzar el tracker!

**Modo continuo (recomendado):**
```bash
python main.py
```
Buscará propiedades cada 30 minutos (configurable en `.env`)

**Búsqueda única:**
```bash
python main.py once
```
Realiza una búsqueda y termina

## ❓ Problemas Comunes

### "No se encontró credentials.json"
- Asegúrate de haber descargado el archivo de Google Cloud Console
- Debe estar en la carpeta del proyecto con ese nombre exacto

### "Error 401 - Unauthorized" (Idealista)
- Verifica que tu API Key y Secret estén correctos en `.env`
- Asegúrate de que no haya espacios extra
- Verifica que tu cuenta esté aprobada en Idealista

### "The caller does not have permission" (Google Sheets)
- Compartiste la hoja con el email de la cuenta de servicio?
- El email está en `credentials.json` como `client_email`
- Diste permisos de "Editor", no solo "Viewer"

### "SpreadsheetNotFound"
- El nombre en `.env` coincide con el nombre de tu hoja?
- Distingue mayúsculas/minúsculas
- Si tiene espacios, mantenlos

### No encuentra propiedades
- Verifica las coordenadas en `.env`
- Amplía el radio de búsqueda (`IDEALISTA_DISTANCE`)
- Ajusta los filtros de precio y tamaño
- Prueba con `IDEALISTA_OPERATION=rent` si buscas alquiler

## 🎯 Casos de Uso

### Buscar pisos en alquiler en Barcelona
```env
IDEALISTA_CENTER=41.3874,2.1686
IDEALISTA_OPERATION=rent
IDEALISTA_MAX_PRICE=1500
IDEALISTA_MIN_PRICE=800
IDEALISTA_DISTANCE=5000
```

### Buscar oficinas en venta en Valencia
```env
IDEALISTA_CENTER=39.4699,-0.3763
IDEALISTA_PROPERTY_TYPE=offices
IDEALISTA_OPERATION=sale
IDEALISTA_MAX_PRICE=200000
IDEALISTA_MIN_PRICE=50000
```

### Buscar garajes cerca de mi ubicación
```env
IDEALISTA_CENTER=tu_latitud,tu_longitud
IDEALISTA_PROPERTY_TYPE=garages
IDEALISTA_OPERATION=sale
IDEALISTA_DISTANCE=2000
```

## 📱 Activar Notificaciones

### Email
Edita `.env` y añade:
```env
EMAIL_SMTP_SERVER=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_FROM=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion
EMAIL_TO=destinatario@gmail.com
```

Luego edita `notifications.py`:
```python
def _setup_channels(self):
    self.enabled_channels.append('email')  # Descomenta esta línea
```

### Telegram
1. Habla con @BotFather en Telegram
2. Envía `/newbot` y sigue las instrucciones
3. Guarda el token que te da
4. Habla con @userinfobot para obtener tu chat_id

Edita `.env`:
```env
TELEGRAM_BOT_TOKEN=tu_token_del_bot
TELEGRAM_CHAT_ID=tu_chat_id
```

Edita `notifications.py`:
```python
def _setup_channels(self):
    self.enabled_channels.append('telegram')  # Descomenta esta línea
```

## 🔄 Automatización

### macOS - LaunchAgent (mantener siempre activo)

1. Crea el archivo:
```bash
mkdir -p ~/Library/LaunchAgents
nano ~/Library/LaunchAgents/com.idealista.tracker.plist
```

2. Pega este contenido:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.idealista.tracker</string>
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

3. Carga el servicio:
```bash
launchctl load ~/Library/LaunchAgents/com.idealista.tracker.plist
```

4. Comandos útiles:
```bash
# Ver si está corriendo
launchctl list | grep idealista

# Detener
launchctl unload ~/Library/LaunchAgents/com.idealista.tracker.plist

# Ver logs
tail -f /Users/ericruiz/Desktop/Hogar/logs/stdout.log
```

### Linux/macOS - Cron (ejecutar periódicamente)

```bash
crontab -e
```

Añade (ejecutar cada hora):
```
0 * * * * cd /Users/ericruiz/Desktop/Hogar && ./venv/bin/python main.py once >> logs/cron.log 2>&1
```

## 💡 Tips

1. **Primera ejecución**: Puede que detecte muchas propiedades la primera vez. Todas se añadirán a la hoja.

2. **Evitar duplicados**: El programa recuerda las propiedades vistas en `seen_properties.json`. No lo borres a menos que quieras empezar de cero.

3. **Ajustar frecuencia**: Modifica `CHECK_INTERVAL_MINUTES` en `.env`. No pongas menos de 15 minutos para no saturar la API.

4. **Ver estadísticas**: El archivo `seen_properties.json` te dice cuántas propiedades has rastreado.

5. **Backup**: Haz copias periódicas de tu hoja de Google Sheets.

## 🆘 Soporte

Si tienes problemas:

1. Lee el README.md completo
2. Revisa esta guía
3. Ejecuta `python main.py test` para diagnóstico
4. Revisa los logs en la carpeta `logs/`
5. Busca el error en Google

---

**¡Listo! Ahora estás rastreando propiedades en Idealista automáticamente 🎉**


