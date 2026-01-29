#!/bin/bash

# Script de instalación para el Tracker de Idealista
# Este script automatiza la configuración inicial del proyecto

set -e  # Detener en caso de error

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║    🏠  INSTALADOR - TRACKER DE IDEALISTA  🏠               ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# 1. Verificar Python
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Verificando Python..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 no está instalado"
    echo "Por favor, instala Python 3.8 o superior desde https://www.python.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
print_success "Python $PYTHON_VERSION encontrado"

# 2. Crear entorno virtual
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Creando entorno virtual..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "venv" ]; then
    print_warning "El entorno virtual ya existe. ¿Deseas recrearlo? (s/n)"
    read -r response
    if [[ "$response" =~ ^([sS][iI]|[sS])$ ]]; then
        rm -rf venv
        python3 -m venv venv
        print_success "Entorno virtual recreado"
    else
        print_info "Usando entorno virtual existente"
    fi
else
    python3 -m venv venv
    print_success "Entorno virtual creado"
fi

# 3. Activar entorno virtual e instalar dependencias
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Instalando dependencias..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    print_success "Dependencias instaladas correctamente"
else
    print_error "Error instalando dependencias"
    exit 1
fi

# 4. Configurar archivo .env
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Configurando variables de entorno..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env" ]; then
    print_warning "El archivo .env ya existe. ¿Deseas recrearlo? (s/n)"
    read -r response
    if [[ "$response" =~ ^([sS][iI]|[sS])$ ]]; then
        cp env.example .env
        print_success "Archivo .env recreado desde la plantilla"
    else
        print_info "Usando archivo .env existente"
    fi
else
    cp env.example .env
    print_success "Archivo .env creado desde la plantilla"
fi

# 5. Verificar credenciales de Google
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Verificando credenciales de Google..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "credentials.json" ]; then
    print_warning "No se encontró credentials.json"
    echo ""
    echo "Para obtener credentials.json:"
    echo "1. Ve a https://console.cloud.google.com/"
    echo "2. Crea un proyecto o selecciona uno existente"
    echo "3. Habilita Google Sheets API y Google Drive API"
    echo "4. Crea una cuenta de servicio"
    echo "5. Descarga el archivo JSON de credenciales"
    echo "6. Renómbralo a 'credentials.json' y colócalo en este directorio"
    echo ""
    print_info "Continúa cuando hayas colocado el archivo"
else
    print_success "Archivo credentials.json encontrado"
fi

# 6. Crear directorio de logs
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Creando estructura de directorios..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p logs
print_success "Directorio de logs creado"

# 7. Información de configuración
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Configuración requerida"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
print_warning "IMPORTANTE: Debes configurar las siguientes variables en el archivo .env:"
echo ""
echo "   📝 IDEALISTA_API_KEY - Tu API Key de Idealista"
echo "   📝 IDEALISTA_API_SECRET - Tu API Secret de Idealista"
echo ""
echo "Parámetros de búsqueda (opcionales, ya tienen valores por defecto):"
echo "   - IDEALISTA_CENTER (coordenadas del centro de búsqueda)"
echo "   - IDEALISTA_DISTANCE (radio de búsqueda en metros)"
echo "   - IDEALISTA_MAX_PRICE / MIN_PRICE"
echo "   - IDEALISTA_MIN_SIZE / MAX_SIZE"
echo ""

# 8. Abrir editor para configurar
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  Configuración interactiva"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "¿Deseas configurar las credenciales ahora? (s/n)"
read -r response

if [[ "$response" =~ ^([sS][iI]|[sS])$ ]]; then
    echo ""
    echo "Ingresa tus credenciales de Idealista:"
    echo ""
    
    read -p "API Key: " api_key
    read -p "API Secret: " api_secret
    
    # Actualizar archivo .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/IDEALISTA_API_KEY=.*/IDEALISTA_API_KEY=$api_key/" .env
        sed -i '' "s/IDEALISTA_API_SECRET=.*/IDEALISTA_API_SECRET=$api_secret/" .env
    else
        # Linux
        sed -i "s/IDEALISTA_API_KEY=.*/IDEALISTA_API_KEY=$api_key/" .env
        sed -i "s/IDEALISTA_API_SECRET=.*/IDEALISTA_API_SECRET=$api_secret/" .env
    fi
    
    print_success "Credenciales guardadas en .env"
fi

# 9. Test de conexión
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9️⃣  Prueba de configuración"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "¿Deseas probar la configuración ahora? (s/n)"
read -r response

if [[ "$response" =~ ^([sS][iI]|[sS])$ ]]; then
    echo ""
    print_info "Ejecutando test de conexión..."
    echo ""
    python main.py test
fi

# 10. Resumen final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ¡INSTALACIÓN COMPLETADA!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Próximos pasos:"
echo ""
echo "   1. Activa el entorno virtual:"
echo "      $ source venv/bin/activate"
echo ""
echo "   2. Edita .env si es necesario:"
echo "      $ nano .env"
echo ""
echo "   3. Prueba la conexión:"
echo "      $ python main.py test"
echo ""
echo "   4. Ejecuta el tracker:"
echo "      $ python main.py          # Modo continuo"
echo "      $ python main.py once     # Búsqueda única"
echo ""
echo "📖 Lee el README.md para más información"
echo ""
print_success "¡Listo para rastrear propiedades! 🏠"
echo ""


