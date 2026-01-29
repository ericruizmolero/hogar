# 🚀 Guía Rápida - Usando RapidAPI (Método Recomendado)

## ¿Por qué RapidAPI?

✅ **No requiere aprobación** de Idealista (proceso que puede tardar días)  
✅ **Configuración en 5 minutos** - registro inmediato  
✅ **Plan gratuito disponible** para pruebas  
✅ **Más sencillo** - solo necesitas una API key

## 🎯 Instalación Rápida (5 minutos)

### Paso 1: Instalar dependencias

```bash
cd /Users/ericruiz/Desktop/Hogar
./install.sh
```

### Paso 2: Obtener API Key de RapidAPI

1. **Regístrate en RapidAPI**: https://rapidapi.com/auth/sign-up
2. **Ve a la API de Idealista**: https://rapidapi.com/palawer/api/idealista-historico
3. **Suscríbete al plan gratuito** (o de pago según necesites):
   - Click en "Subscribe to Test"
   - Selecciona el plan "Basic" (gratuito) o el que prefieras
4. **Copia tu API Key**:
   - En la misma página, verás "X-RapidAPI-Key" en el código de ejemplo
   - Copia ese valor

### Paso 3: Configurar el .env

Edita el archivo `.env`:

```bash
nano .env
```

Configura así:

```env
# Usa RapidAPI (más fácil)
USE_RAPIDAPI=true
RAPIDAPI_KEY=tu_clave_de_rapidapi_aqui

# Parámetros de búsqueda
IDEALISTA_CENTER=40.4168,-3.7038  # Cambia a tu ubicación
IDEALISTA_MAX_PRICE=300000
IDEALISTA_MIN_PRICE=150000
```

### Paso 4: Configurar Google Sheets

*(Igual que antes)*

1. Ve a https://console.cloud.google.com/
2. Crea proyecto y cuenta de servicio
3. Descarga `credentials.json`
4. Comparte tu hoja con el email de la cuenta

### Paso 5: ¡Ejecutar!

```bash
source venv/bin/activate
python main.py test  # Probar configuración
python main.py       # Ejecutar tracker
```

## 📊 Planes de RapidAPI

| Plan | Precio | Peticiones/mes | Recomendado para |
|------|--------|----------------|------------------|
| **Basic** | Gratis | 100-500 | Pruebas y uso ligero |
| **Pro** | ~10€/mes | 5,000-10,000 | Uso regular |
| **Ultra** | ~50€/mes | 50,000+ | Uso intensivo |

**Nota**: Verifica los planes actuales en [RapidAPI - Idealista Histórico](https://rapidapi.com/palawer/api/idealista-historico)

## 🔄 Cambiar entre API Oficial y RapidAPI

Si más adelante quieres usar la API oficial de Idealista:

```env
# Cambiar a API oficial
USE_RAPIDAPI=false
IDEALISTA_API_KEY=tu_api_key
IDEALISTA_API_SECRET=tu_api_secret
```

El programa detectará automáticamente qué API usar.

## ✨ Ventajas de RapidAPI

### 🚀 Velocidad
- Registro instantáneo
- Sin espera de aprobación
- Empieza en minutos

### 💰 Coste-Beneficio
- Plan gratuito para probar
- Planes accesibles
- Paga solo lo que uses

### 🛠️ Facilidad
- Una sola API key
- No OAuth complicado
- Documentación clara

### 🔒 Fiabilidad
- Infraestructura de RapidAPI
- Monitoreo incluido
- Soporte disponible

## 🎯 Ejemplo Completo de .env

```env
# ===== USAR RAPIDAPI (RECOMENDADO) =====
USE_RAPIDAPI=true
RAPIDAPI_KEY=abc123def456ghi789jkl012mno345pqr

# ===== BÚSQUEDA =====
# Buscar pisos en Madrid centro
IDEALISTA_CENTER=40.4168,-3.7038
IDEALISTA_DISTANCE=5000
IDEALISTA_OPERATION=sale
IDEALISTA_PROPERTY_TYPE=homes
IDEALISTA_MAX_PRICE=350000
IDEALISTA_MIN_PRICE=200000
IDEALISTA_MIN_SIZE=70
IDEALISTA_MAX_SIZE=100

# ===== GOOGLE SHEETS =====
GOOGLE_SHEETS_CREDENTIALS_FILE=credentials.json
GOOGLE_SHEETS_SPREADSHEET_NAME=Pisos Madrid

# ===== TRACKING =====
CHECK_INTERVAL_MINUTES=30
```

## 🧪 Probar la Conexión

```bash
python main.py test
```

Deberías ver:

```
✅ Usando RapidAPI para conectar con Idealista
✅ Se encontraron X propiedades
✅ Hoja de cálculo accesible
✅ ¡Todas las conexiones funcionan correctamente!
```

## ❓ Preguntas Frecuentes

### ¿Es legal usar RapidAPI?

Sí, RapidAPI es una plataforma legítima que proporciona acceso a APIs de terceros de forma autorizada.

### ¿Cuántas búsquedas puedo hacer?

Depende de tu plan. El plan básico suele incluir cientos de peticiones al mes, suficiente para búsquedas cada 30 minutos.

### ¿Qué pasa si agoto mi cuota?

El programa dará error. Puedes:
- Esperar al próximo mes (se renueva automáticamente)
- Actualizar a un plan superior
- Reducir la frecuencia de búsqueda

### ¿Los datos son iguales a la API oficial?

RapidAPI accede a los mismos datos de Idealista, por lo que la información es la misma.

### ¿Puedo usar ambas APIs?

Sí, solo cambia `USE_RAPIDAPI` en `.env` para alternar entre ambas.

## 🚨 Solución de Problemas

### Error: "Invalid API Key"

Tu API key de RapidAPI es incorrecta. Verifica:
1. Copiaste bien la key desde RapidAPI
2. No hay espacios extra en `.env`
3. Te suscribiste al plan (incluso el gratuito)

### Error: "Quota Exceeded"

Agotaste tu cuota mensual:
1. Espera al próximo mes
2. Actualiza tu plan en RapidAPI
3. Reduce `CHECK_INTERVAL_MINUTES` a un valor mayor (ej: 60)

### No encuentra propiedades

1. Verifica los filtros (puede que sean muy restrictivos)
2. Prueba con otro `IDEALISTA_CENTER`
3. Amplía `IDEALISTA_DISTANCE`

## 🎓 Recursos

- **RapidAPI Idealista**: https://rapidapi.com/palawer/api/idealista-historico
- **Documentación RapidAPI**: https://docs.rapidapi.com/
- **Tu panel de RapidAPI**: https://rapidapi.com/developer/dashboard

---

## 📝 Checklist de Configuración

- [ ] Cuenta de RapidAPI creada
- [ ] Suscrito a Idealista Histórico API
- [ ] API Key copiada
- [ ] Archivo `.env` configurado con `USE_RAPIDAPI=true`
- [ ] Google Sheets configurado
- [ ] Probado con `python main.py test`
- [ ] Ejecutando tracker con `python main.py`

---

**¡Con RapidAPI puedes empezar a trackear propiedades en menos de 10 minutos! 🎉**


