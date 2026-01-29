# 📁 Estructura del Proyecto

```
Hogar/
│
├── 📄 main.py                          # Punto de entrada principal del programa
├── 📄 tracker.py                       # Lógica de tracking y búsqueda continua
├── 📄 idealista_api.py                 # Cliente para la API de Idealista
├── 📄 google_sheets.py                 # Gestor de Google Sheets
├── 📄 notifications.py                 # Sistema de notificaciones (email, Telegram, Slack)
├── 📄 config.py                        # Configuración y variables de entorno
├── 📄 verify.py                        # Script de verificación de configuración
│
├── 📄 requirements.txt                 # Dependencias de Python
├── 📄 .env                            # Variables de entorno (NO subir a Git)
├── 📄 env.example                     # Plantilla de variables de entorno
├── 📄 credentials.json                 # Credenciales de Google (NO subir a Git)
├── 📄 seen_properties.json             # Cache de propiedades ya vistas (generado automáticamente)
│
├── 📄 install.sh                       # Script de instalación automática
├── 📄 com.idealista.tracker.plist      # Configuración para LaunchAgent (macOS)
│
├── 📄 README.md                        # Documentación completa
├── 📄 GUIA_RAPIDA.md                   # Guía de inicio rápido
├── 📄 ESTRUCTURA.md                    # Este archivo
├── 📄 .gitignore                       # Archivos a ignorar en Git
│
└── 📁 logs/                            # Logs del sistema (generado automáticamente)
    ├── stdout.log
    └── stderr.log
```

## 📝 Descripción de Archivos

### Archivos Principales

#### `main.py`
- Punto de entrada del programa
- Gestiona los modos de ejecución (continuo, único, test)
- Interfaz de usuario en consola

#### `tracker.py`
- Lógica principal del tracker
- Gestiona el ciclo de búsqueda
- Detecta nuevas propiedades
- Coordina con API y Google Sheets

#### `idealista_api.py`
- Cliente para la API de Idealista
- Autenticación OAuth2
- Búsqueda de propiedades
- Formateo de datos

#### `google_sheets.py`
- Conexión con Google Sheets
- Creación y gestión de hojas
- Escritura de datos
- Detección de duplicados

#### `notifications.py`
- Sistema de notificaciones multi-canal
- Soporte para Email, Telegram, Slack
- Formateo de mensajes
- Envío de imágenes

#### `config.py`
- Carga variables de entorno
- Configuración centralizada
- Valores por defecto

### Archivos de Configuración

#### `.env`
- Variables de entorno sensibles
- Credenciales de APIs
- Parámetros de búsqueda
- **NO subir a Git**

#### `env.example`
- Plantilla de `.env`
- Valores de ejemplo
- Documentación de variables

#### `credentials.json`
- Credenciales de Google Cloud
- Cuenta de servicio
- **NO subir a Git**

#### `requirements.txt`
- Dependencias de Python
- Versiones específicas
- Para instalar con pip

### Archivos de Utilidades

#### `install.sh`
- Script de instalación automática
- Verificación de requisitos
- Configuración inicial
- Tests de conexión

#### `verify.py`
- Verificación de configuración
- Tests de conectividad
- Diagnóstico de problemas
- Ejecutar antes del primer uso

#### `com.idealista.tracker.plist`
- Configuración para LaunchAgent (macOS)
- Mantiene el tracker corriendo
- Inicio automático al arrancar
- Gestión de logs

### Archivos Generados Automáticamente

#### `seen_properties.json`
- Cache de propiedades vistas
- Evita duplicados
- Se actualiza automáticamente
- No borrar sin razón

#### `logs/`
- Carpeta de logs
- `stdout.log` - salida estándar
- `stderr.log` - errores
- Útil para debugging

## 🔐 Archivos Sensibles (NO subir a Git)

Estos archivos contienen información sensible y están en `.gitignore`:

- ✅ `.env` - Credenciales y configuración
- ✅ `credentials.json` - Credenciales de Google
- ✅ `token.json` - Token de autenticación
- ✅ `seen_properties.json` - Datos de propiedades
- ✅ `logs/` - Logs del sistema

## 🚀 Flujo de Ejecución

```
┌─────────────┐
│   main.py   │ ← Punto de entrada
└──────┬──────┘
       │
       ├─→ test mode ──→ verify.py
       │
       ├─→ once mode ──┐
       │               │
       └─→ continuous ─┤
                       │
                 ┌─────▼──────┐
                 │ tracker.py │
                 └─────┬──────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────────┐
    │idealista_ │ │google_ │ │notifications │
    │  api.py   │ │sheets  │ │    .py       │
    └───────────┘ └────────┘ └──────────────┘
          │            │            │
          │            │            │
    ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────────┐
    │ Idealista │ │ Google │ │Email/Telegram│
    │    API    │ │ Sheets │ │    /Slack    │
    └───────────┘ └────────┘ └──────────────┘
```

## 📊 Flujo de Datos

```
1. tracker.py solicita búsqueda
        ↓
2. idealista_api.py consulta API
        ↓
3. Se obtienen propiedades
        ↓
4. Se filtran propiedades nuevas
        ↓
5. Para cada nueva propiedad:
   a. Se añade a seen_properties.json
   b. Se escribe en Google Sheets
   c. Se envía notificación
        ↓
6. Se espera intervalo configurado
        ↓
7. Se repite desde el paso 1
```

## 🛠️ Modificaciones Comunes

### Cambiar parámetros de búsqueda
📝 Editar: `.env`

### Añadir nuevos campos a la hoja
📝 Editar: `google_sheets.py` → `_setup_headers()` y `add_property()`

### Añadir nuevo canal de notificación
📝 Editar: `notifications.py` → Crear nuevo método `_send_X()`

### Cambiar formato de notificaciones
📝 Editar: `notifications.py` → `_format_message()`

### Modificar criterios de filtrado
📝 Editar: `idealista_api.py` → `search_properties()`

## 📚 Documentación Adicional

- **README.md** - Documentación completa y detallada
- **GUIA_RAPIDA.md** - Guía de inicio rápido paso a paso
- **ESTRUCTURA.md** - Este archivo (estructura del proyecto)

## 🔄 Ciclo de Vida

1. **Instalación**: `./install.sh`
2. **Configuración**: Editar `.env` y añadir `credentials.json`
3. **Verificación**: `python verify.py`
4. **Ejecución**: `python main.py`
5. **Monitoreo**: Revisar Google Sheets y logs
6. **Mantenimiento**: Actualizar `.env` si es necesario

## 💡 Consejos

- **Backup**: Haz copias periódicas de `seen_properties.json`
- **Logs**: Revisa los logs si algo no funciona
- **Tests**: Ejecuta `python main.py test` después de cambios
- **Git**: Nunca subas archivos sensibles (revisa `.gitignore`)
- **Updates**: Mantén las dependencias actualizadas

---

**Última actualización**: 2026-01-01


