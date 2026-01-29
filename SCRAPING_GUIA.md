# 🕷️ Guía de Scraping de Idealista

## ¿Por qué Scraping?

### ✅ Ventajas ENORMES

1. **GRATIS al 100%** - No necesitas ninguna API ni credenciales
2. **Sin aprobaciones** - Empieza inmediatamente
3. **Sin límites** - No hay cuotas de peticiones
4. **Más datos** - Acceso a TODA la información visible
5. **Más simple** - No OAuth, no tokens, solo HTTP

### ⚠️ Consideraciones

1. **Legalidad**: Revisa los términos de servicio de Idealista
2. **Rate limiting**: Respeta el servidor (delays entre peticiones)
3. **Mantenimiento**: Si cambian el HTML, hay que adaptar
4. **Ética**: No satures el servidor, sé respetuoso

## 🎯 Tres Formas de Usar el Scraper

### 1️⃣ Scrapear URLs Individuales (Manual)

**Ideal para**: Propiedades específicas que ya conoces

```bash
# Una sola URL
python scrape_urls.py "https://www.idealista.com/inmueble/108542671/"

# Múltiples URLs desde un archivo
python scrape_urls.py urls.txt
```

**Crear archivo urls.txt**:
```txt
https://www.idealista.com/inmueble/108542671/
https://www.idealista.com/inmueble/108542672/
https://www.idealista.com/inmueble/108542673/
```

### 2️⃣ Tracker Automático (Recomendado)

**Ideal para**: Monitoreo continuo de una búsqueda

```bash
# Modo continuo (revisa cada X minutos)
python scrape_tracker.py "https://www.idealista.com/venta-viviendas/madrid/chamberi/"

# Búsqueda única
python scrape_tracker.py "https://www.idealista.com/venta-viviendas/madrid/" once
```

### 3️⃣ Scraping Avanzado (Programático)

**Ideal para**: Integración personalizada

```python
from idealista_scraper import IdealistaScraper
from google_sheets import GoogleSheetsManager

scraper = IdealistaScraper()
sheets = GoogleSheetsManager()
sheets.get_or_create_spreadsheet()

# Scrapear una URL
data = scraper.scrape_property_url("https://www.idealista.com/inmueble/108542671/")
sheets.add_property(data)
```

## 📖 Guía Paso a Paso: Tracker Automático

### Paso 1: Obtener URL de Búsqueda

1. Ve a **idealista.com**
2. Realiza tu búsqueda con filtros:
   - Ubicación (ej: Madrid, Chamberí)
   - Tipo (venta/alquiler)
   - Precio min/max
   - Habitaciones, m², etc.
3. **Copia la URL completa** de la página de resultados

**Ejemplo de URL**:
```
https://www.idealista.com/venta-viviendas/madrid/chamberi/con-precio-hasta_300000,precio-desde_200000/
```

### Paso 2: Configurar Google Sheets

(Igual que antes - necesitas `credentials.json`)

### Paso 3: Instalar Dependencias

```bash
cd /Users/ericruiz/Desktop/Hogar
pip install -r requirements.txt
```

Nuevas dependencias añadidas:
- `beautifulsoup4` - Parser HTML
- `lxml` - Parser rápido
- `selenium` - Para sitios con JavaScript (opcional)

### Paso 4: Ejecutar el Tracker

```bash
# Entrecomilla la URL porque puede tener caracteres especiales
python scrape_tracker.py "TU_URL_DE_BUSQUEDA_AQUI"
```

**Ejemplo real**:
```bash
python scrape_tracker.py "https://www.idealista.com/venta-viviendas/madrid/chamberi/con-precio-hasta_300000/"
```

### Paso 5: ¡Listo!

El script:
- ✅ Scrapea la página de búsqueda cada 30 min (configurable en `.env`)
- ✅ Detecta propiedades nuevas automáticamente
- ✅ Las añade a Google Sheets
- ✅ Evita duplicados
- ✅ Corre indefinidamente hasta que lo detengas (Ctrl+C)

## 🎯 Casos de Uso

### Caso 1: Monitorear Pisos en tu Barrio

```bash
# 1. Ve a Idealista y filtra:
#    - Tu barrio
#    - Precio máximo
#    - Mínimo de habitaciones

# 2. Copia la URL

# 3. Ejecuta:
python scrape_tracker.py "URL_COPIADA"

# ¡Ya estás monitoreando! 🎉
```

### Caso 2: Añadir Propiedades Favoritas

```bash
# 1. Crea urls.txt con las URLs que te interesan
# 2. Ejecuta:
python scrape_urls.py urls.txt

# Todas se añaden a Google Sheets
```

### Caso 3: Búsqueda Única Diaria

```bash
# Añade a cron para ejecutar cada día:
0 9 * * * cd /Users/ericruiz/Desktop/Hogar && python scrape_tracker.py "URL" once
```

## 📊 Datos Extraídos

El scraper extrae los mismos 20 campos que con API:

- ✅ ID de la propiedad
- ✅ Título
- ✅ Precio
- ✅ Tamaño (m²)
- ✅ Precio/m²
- ✅ Habitaciones
- ✅ Baños
- ✅ Planta
- ✅ Exterior (sí/no)
- ✅ Ascensor (sí/no)
- ✅ Parking (sí/no)
- ✅ Dirección completa
- ✅ Distrito
- ✅ Municipio
- ✅ Provincia
- ✅ URL del anuncio
- ✅ Imagen principal
- ✅ Descripción
- ✅ Fecha de detección
- ✅ Estado

## ⚙️ Configuración

### Cambiar Intervalo de Búsqueda

Edita `.env`:
```env
CHECK_INTERVAL_MINUTES=30  # Por defecto 30 minutos
```

**Recomendaciones**:
- **15-30 min**: Óptimo para no perder propiedades
- **60 min**: Si la zona no es muy activa
- **5-10 min**: Solo si es MUY urgente (no recomendado)

### Delay entre Peticiones

En `idealista_scraper.py`, método `delay_between_requests()`:
```python
scraper.delay_between_requests(2)  # 2 segundos por defecto
```

## 🚨 Solución de Problemas

### "Error 403 - Forbidden"

Idealista detectó demasiadas peticiones:
- **Solución**: Aumenta el delay entre peticiones
- Espera 5-10 minutos antes de reintentar
- Reduce la frecuencia de búsqueda

### No Extrae Algunos Datos

Idealista cambió el HTML:
- **Solución**: Abre un issue o actualiza los selectores en `idealista_scraper.py`
- Usa el navegador para inspeccionar las nuevas clases CSS

### "No se encontraron propiedades"

Posibles causas:
1. La URL es incorrecta → Copia de nuevo desde el navegador
2. Idealista cambió la estructura → Actualizar selectores
3. Filtros muy restrictivos → Amplía la búsqueda

### Scraping Muy Lento

Si necesitas velocidad:
- Los datos del listado son suficientes (no hace falta scrapear cada URL individual)
- El modo actual scrapea solo la página de búsqueda (rápido)
- Comentado: scraping de detalles completos (lento pero más datos)

## 🎓 Comparación: API vs Scraping

| Característica | Scraping 🕷️ | API 🔌 |
|---------------|-------------|--------|
| **Coste** | GRATIS | Gratis/Pago |
| **Setup** | Inmediato | Días (aprobación) |
| **Credenciales** | No necesita | Requiere |
| **Límites** | Solo tasa respeto | Cuotas por plan |
| **Datos** | Todos visibles | Limitados por API |
| **Mantenimiento** | Medio (cambios HTML) | Bajo (estable) |
| **Velocidad** | Media | Alta |
| **Legalidad** | Zona gris* | Autorizado |
| **Recomendado** | Uso personal | Uso comercial |

\* Verifica los términos de servicio

## 💡 Tips y Trucos

### 1. Búsquedas Guardadas

Guarda tus URLs favoritas en un archivo:

```bash
# urls_favoritas.sh
python scrape_tracker.py "URL_MADRID_CENTRO" once
python scrape_tracker.py "URL_BARCELONA" once
python scrape_tracker.py "URL_VALENCIA" once
```

### 2. Múltiples Zonas

Ejecuta múltiples instancias simultáneamente:

```bash
# Terminal 1
python scrape_tracker.py "URL_ZONA_1"

# Terminal 2
python scrape_tracker.py "URL_ZONA_2"

# Terminal 3
python scrape_tracker.py "URL_ZONA_3"
```

### 3. Exportar Datos

Desde Google Sheets:
- Archivo → Descargar → CSV/Excel
- Analiza con Python, Excel, Tableau, etc.

### 4. Alertas Personalizadas

Modifica `scrape_tracker.py` para añadir condiciones:

```python
# Solo añadir si el precio/m² es bueno
if prop['precio_m2'] < 3000:
    sheets.add_property(prop)
    # Enviar alerta urgente
```

### 5. Scraping Histórico

Para obtener datos del pasado:
- Scrapea páginas 1, 2, 3... de resultados
- Modifica la URL: añade `?pagina=2`, `?pagina=3`, etc.

## 🔒 Ética y Legalidad

### ✅ Buenas Prácticas

1. **Respeta el servidor**: Delays de 2+ segundos
2. **Uso personal**: No revender los datos
3. **No saturar**: Evita demasiadas peticiones simultáneas
4. **Identificación**: User-Agent honesto (ya incluido)
5. **Robots.txt**: Respeta las reglas del sitio

### ⚖️ Legalidad

- **España**: El scraping de datos públicos suele ser legal
- **GDPR**: No scrapees datos personales sensibles
- **Términos de servicio**: Idealista puede prohibirlo en sus ToS
- **Uso**: Personal OK, comercial consulta abogado

**Disclaimer**: Esto no es asesoramiento legal. Consulta con un abogado para casos comerciales.

## 🚀 Siguiente Nivel

### Scraping con JavaScript

Si Idealista usa mucho JS:

```bash
pip install selenium
```

Luego modifica el scraper para usar Selenium (más lento pero más completo)

### Proxies Rotantes

Para scraping intensivo:

```python
proxies = {
    'http': 'http://proxy1.com:8080',
    'https': 'https://proxy1.com:8080',
}
response = requests.get(url, proxies=proxies)
```

### OCR para Captchas

Si aparecen captchas:
- Usa servicios como 2captcha
- O reduce la frecuencia

## 📚 Recursos

- **BeautifulSoup Docs**: https://www.crummy.com/software/BeautifulSoup/bs4/doc/
- **Requests Docs**: https://requests.readthedocs.io/
- **Web Scraping Legal Guide**: https://blog.apify.com/is-web-scraping-legal/

---

## ✅ Checklist de Scraping

- [ ] Dependencias instaladas (`pip install -r requirements.txt`)
- [ ] Google Sheets configurado
- [ ] URL de búsqueda copiada desde Idealista
- [ ] Intervalo configurado en `.env`
- [ ] Primera ejecución: `python scrape_tracker.py "URL" once`
- [ ] Todo OK → Ejecutar en continuo: `python scrape_tracker.py "URL"`

---

**¡Con scraping puedes empezar a trackear propiedades SIN ninguna API en menos de 5 minutos! 🕷️✨**


