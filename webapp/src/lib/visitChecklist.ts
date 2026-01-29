/**
 * Datos de la checklist de visita.
 *
 * Cada sección pertenece a una fase (before / during / after).
 * Los ítems pueden ser condicionales según las características de la propiedad.
 */

import type { Property } from '../types';

export type Priority = 'critical' | 'important' | 'recommended';
export type Phase = 'before' | 'during' | 'after';

export interface ChecklistItem {
  id: string;
  text: string;
  priority: Priority;
  /** Si devuelve false, el ítem no se muestra para esta propiedad */
  condition?: (p: Property) => boolean;
}

export interface ChecklistSection {
  id: string;
  title: string;
  icon: string; // nombre del icono Lucide
  phase: Phase;
  items: ChecklistItem[];
  tips?: string[];
  /** Si devuelve false, la sección entera se oculta */
  condition?: (p: Property) => boolean;
}

export const PHASE_LABELS: Record<Phase, string> = {
  before: 'Antes',
  during: 'Durante',
  after: 'Después',
};

// ---------------------------------------------------------------------------
// BEFORE — Preparación
// ---------------------------------------------------------------------------

const preparation: ChecklistSection = {
  id: 'preparation',
  title: 'Preparación',
  icon: 'ClipboardList',
  phase: 'before',
  items: [
    { id: 'prep-1', text: 'Consultar catastro (sedecatastro.gob.es): superficie real, año, coeficiente', priority: 'critical' },
    { id: 'prep-2', text: 'Buscar el edificio en Google Maps / Street View: fachada, entorno, orientación', priority: 'critical' },
    { id: 'prep-3', text: 'Comprobar ruido del barrio (ocio nocturno, tráfico, tren)', priority: 'important' },
    { id: 'prep-4', text: 'Consultar planes urbanísticos en el PGOU de Donostia', priority: 'important' },
    { id: 'prep-5', text: 'Revisar mapa de inundabilidad (URA) si zona cercana al Urumea', priority: 'important' },
    { id: 'prep-6', text: 'Llevar: móvil con cámara, metro/láser, nivel de burbuja, linterna, cargador', priority: 'critical' },
    { id: 'prep-7', text: 'Llevar esta checklist abierta en el móvil', priority: 'recommended' },
  ],
  tips: [
    'Visitar a mediodía (12-14h) para comprobar luz natural real si orientación sur/suroeste.',
    'Si el piso da a calle transitada, visitar también en hora punta (8-9h o 18-19h).',
    'Donostia tiene muchos días nublados: si puedes, visita un día soleado y otro gris.',
  ],
};

const questionsForAgent: ChecklistSection = {
  id: 'questions',
  title: 'Preguntas para el agente',
  icon: 'MessageCircleQuestion',
  phase: 'before',
  items: [
    { id: 'q-1', text: '¿Por qué venden? ¿Cuánto tiempo lleva en venta?', priority: 'critical' },
    { id: 'q-2', text: 'Gastos de comunidad mensuales?', priority: 'critical' },
    { id: 'q-3', text: '¿Hay derramas pendientes o previstas?', priority: 'critical' },
    { id: 'q-4', text: '¿Tiene ITE pasada? (obligatoria en Euskadi para edificios >50 años)', priority: 'critical' },
    { id: 'q-5', text: '¿Certificado energético? (obligatorio, pedir letra y consumo)', priority: 'critical' },
    { id: 'q-6', text: '¿Se ha hecho alguna reforma reciente? ¿Qué se cambió?', priority: 'important' },
    { id: 'q-7', text: '¿Qué calefacción tiene? ¿Gasto mensual en invierno?', priority: 'important' },
    { id: 'q-8', text: '¿Hay algún vecino conflictivo?', priority: 'important' },
    { id: 'q-9', text: '¿Cuánto paga de IBI?', priority: 'important' },
    { id: 'q-10', text: '¿Acepta negociar precio? ¿Hay otras ofertas?', priority: 'recommended' },
  ],
};

const redFlags: ChecklistSection = {
  id: 'redflags',
  title: 'Señales de alerta',
  icon: 'TriangleAlert',
  phase: 'before',
  items: [
    { id: 'rf-1', text: 'Edificio pre-1980 sin rehabilitación: posible amianto, plomo, sin diferenciales', priority: 'critical' },
    { id: 'rf-2', text: 'Fachada norte sin aislamiento ETICS: condensación en invierno', priority: 'critical' },
    { id: 'rf-3', text: '"A reformar" sin presupuesto: en Donostia 800-1200 eur/m2 reforma integral', priority: 'critical', condition: (p) => p.needsRenovation !== 'no' },
    { id: 'rf-4', text: 'Bajo o entresuelo: humedad por capilaridad, menos luz, ruido de portal', priority: 'important' },
    { id: 'rf-5', text: 'Grietas diagonales en fachada: posible asentamiento (zonas de relleno: Amara Berri, Gros)', priority: 'important' },
    { id: 'rf-6', text: '"Exterior" que da a patio interior: verificar luz real in situ', priority: 'important' },
  ],
  tips: [
    'Donostia tiene ~1500mm de lluvia/año. La humedad es el enemigo principal.',
    'Zonas cercanas al Urumea (Loiola, Martutene, Egia baja) tienen histórico de crecidas.',
  ],
};

// ---------------------------------------------------------------------------
// DURING — En la visita
// ---------------------------------------------------------------------------

const building: ChecklistSection = {
  id: 'building',
  title: 'Edificio y zonas comunes',
  icon: 'Building2',
  phase: 'during',
  items: [
    { id: 'bld-1', text: 'Comprobar estado de fachada desde la calle: grietas, desconchones, humedades', priority: 'critical' },
    { id: 'bld-2', text: 'Revisar portal: buzón, portero automático, estado general', priority: 'important' },
    { id: 'bld-3', text: 'Estado del ascensor: marca, placa de revisión, ruidos', priority: 'critical' },
    { id: 'bld-4', text: 'Escalera: peldaños, barandilla, iluminación, olor a humedad', priority: 'important' },
    { id: 'bld-5', text: 'Preguntar si tejado/cubierta se ha reparado recientemente', priority: 'important' },
    { id: 'bld-6', text: 'Bajantes: originales o sustituidas? (pre-1990: posible uralita/amianto)', priority: 'critical' },
    { id: 'bld-7', text: 'Garaje: acceso, tamaño de plaza, ventilación, humedades', priority: 'recommended', condition: (p) => p.parkingIncluded || p.parkingOptional },
    { id: 'bld-8', text: 'Trastero: tamaño real, humedad, ventilación, seguridad', priority: 'recommended' },
  ],
};

const structure: ChecklistSection = {
  id: 'structure',
  title: 'Estructura y problemas ocultos',
  icon: 'ScanSearch',
  phase: 'during',
  items: [
    { id: 'str-1', text: 'Buscar grietas en paredes y techos (las diagonales son estructurales)', priority: 'critical' },
    { id: 'str-2', text: 'Comprobar suelos nivelados: poner pelota o usar nivel del móvil', priority: 'critical' },
    { id: 'str-3', text: 'Verificar pilares o vigas que limiten distribución futura', priority: 'important' },
    { id: 'str-4', text: 'Golpear paredes: distinguir tabique (hueco) de muro de carga (sólido)', priority: 'important' },
    { id: 'str-5', text: 'Abrir y cerrar todas las puertas y ventanas: deben cerrar sin forzar', priority: 'important' },
    { id: 'str-6', text: 'Buscar manchas de humedad en techos (especialmente bajo baños de arriba)', priority: 'critical' },
    { id: 'str-7', text: 'Mirar detrás de muebles y dentro de armarios con linterna', priority: 'critical' },
    { id: 'str-8', text: 'Oler al entrar: humedad, moho o pintura fresca pueden ocultar problemas', priority: 'critical' },
  ],
  tips: [
    'En pisos con fachada norte, tocar la pared interior de la fachada. Si está fría y húmeda, hay puente térmico.',
  ],
};

const installations: ChecklistSection = {
  id: 'installations',
  title: 'Instalaciones',
  icon: 'Plug',
  phase: 'during',
  items: [
    { id: 'ins-1', text: 'Localizar cuadro eléctrico: ¿tiene diferenciales e ICP? ¿Cuántos circuitos?', priority: 'critical' },
    { id: 'ins-2', text: 'Probar enchufes en varias habitaciones (llevar cargador)', priority: 'important' },
    { id: 'ins-3', text: 'Preguntar potencia contratada (mínimo 5.75kW si calefacción eléctrica)', priority: 'important' },
    { id: 'ins-4', text: 'Abrir grifos de agua caliente y fría: comprobar presión y color', priority: 'critical' },
    { id: 'ins-5', text: 'Tirar cisterna: debe vaciar rápido sin borboteos', priority: 'important' },
    { id: 'ins-6', text: 'Material de tuberías: plomo = sustituir obligatoriamente; cobre/PEX = ok', priority: 'critical' },
    { id: 'ins-7', text: 'Gas natural canalizado? Comprobar caldera: marca, modelo, año (>15 años = sustituir)', priority: 'critical' },
    { id: 'ins-8', text: 'Tipo de calefacción: radiadores, suelo radiante, splits?', priority: 'important' },
    { id: 'ins-9', text: 'Calentador/termo: capacidad (2 personas mínimo 80L, familia 120L+)', priority: 'important' },
    { id: 'ins-10', text: 'Aire acondicionado: ¿tiene preinstalación?', priority: 'recommended' },
  ],
};

const insulation: ChecklistSection = {
  id: 'insulation',
  title: 'Aislamiento térmico y acústico',
  icon: 'Thermometer',
  phase: 'during',
  items: [
    { id: 'iso-1', text: 'Ventanas: tipo de cristal (simple, doble, Climalit). Doble acristalamiento imprescindible', priority: 'critical' },
    { id: 'iso-2', text: 'Carpintería: PVC o aluminio con RPT son los mejores para Donostia', priority: 'critical' },
    { id: 'iso-3', text: 'Cerrar ventanas y escuchar: ¿tráfico, vecinos, bares?', priority: 'critical' },
    { id: 'iso-4', text: 'Comprobar persianas/contraventanas: ¿funcionan bien?', priority: 'important' },
    { id: 'iso-5', text: 'Certificado energético: letra E, F o G = gasto alto (200+ eur/mes en invierno)', priority: 'important' },
    { id: 'iso-6', text: '¿Edificio tiene aislamiento exterior (ETICS/SATE)?', priority: 'important' },
    { id: 'iso-7', text: 'Poner mano cerca de marcos de ventana: ¿se nota corriente?', priority: 'important' },
  ],
  tips: [
    'Pide ver una factura de luz/gas de invierno (diciembre-febrero). Es el mejor indicador real del aislamiento.',
  ],
};

const layout: ChecklistSection = {
  id: 'layout',
  title: 'Distribución y espacios',
  icon: 'LayoutGrid',
  phase: 'during',
  items: [
    { id: 'lay-1', text: 'Medir habitaciones principales con metro (no fiarse de los m2 del anuncio)', priority: 'critical' },
    { id: 'lay-2', text: 'Comprobar que cabe cama de 150cm + mesillas en dormitorio principal', priority: 'important' },
    { id: 'lay-3', text: 'Verificar espacio de almacenamiento: armarios empotrados, trastero', priority: 'important' },
    { id: 'lay-4', text: 'Cocina tiene espacio para nevera, lavavajillas, lavadora, horno?', priority: 'important' },
    { id: 'lay-5', text: 'Evaluar si la distribución se puede cambiar: muros de carga vs tabiques', priority: 'important' },
    { id: 'lay-6', text: 'Tendedero: ¿hay espacio? Terraza, lavadero, tendedero en baño? Crítico en Donostia', priority: 'critical' },
    { id: 'lay-7', text: 'Luz natural: ¿cuántas habitaciones tienen ventana al exterior?', priority: 'important' },
    { id: 'lay-8', text: 'Comprobar orientación real con brújula del móvil', priority: 'critical' },
  ],
};

const kitchenBath: ChecklistSection = {
  id: 'kitchen-bath',
  title: 'Cocina y baños',
  icon: 'CookingPot',
  phase: 'during',
  items: [
    { id: 'kb-1', text: 'Estado de encimera, muebles y electrodomésticos (¿se quedan o se van?)', priority: 'important' },
    { id: 'kb-2', text: 'Revisar bajo fregadero: humedades, estado de sifón y tuberías', priority: 'critical' },
    { id: 'kb-3', text: 'Campana extractora: ¿funciona? ¿Salida al exterior o recircula?', priority: 'recommended' },
    { id: 'kb-4', text: 'Baños: buscar juntas de silicona negras (moho), azulejos rotos o sueltos', priority: 'important' },
    { id: 'kb-5', text: 'Ventilación del baño: ¿tiene ventana o extractor? Baños interiores generan moho rápido', priority: 'critical' },
    { id: 'kb-6', text: 'Edad del baño: >20 años probablemente necesita reforma', priority: 'important' },
    { id: 'kb-7', text: 'Tomas de agua para lavadora (en cocina o baño)', priority: 'recommended' },
  ],
};

const community: ChecklistSection = {
  id: 'community',
  title: 'Comunidad y gastos',
  icon: 'Users',
  phase: 'during',
  items: [
    { id: 'com-1', text: 'Gastos de comunidad mensuales (50-150 eur normal, >200 preguntar)', priority: 'critical' },
    { id: 'com-2', text: 'Derramas aprobadas o previstas: pedir actas de últimas 3 juntas', priority: 'critical' },
    { id: 'com-3', text: 'Administrador de fincas: ¿quién es?', priority: 'important' },
    { id: 'com-4', text: 'Fondo de reserva de la comunidad (mínimo legal 10%)', priority: 'important' },
    { id: 'com-5', text: '¿Hay vecinos morosos?', priority: 'important' },
    { id: 'com-6', text: '¿Se permite hacer obras? ¿Horarios? ¿Restricciones?', priority: 'recommended' },
    { id: 'com-7', text: 'IBI anual (en Donostia: 1.000-3.000 eur según zona y tamaño)', priority: 'critical' },
    { id: 'com-8', text: 'Tasa de basuras (Donostia cobra aparte: ~100-150 eur/año)', priority: 'recommended' },
  ],
};

const documentation: ChecklistSection = {
  id: 'documentation',
  title: 'Documentación a solicitar',
  icon: 'FileText',
  phase: 'during',
  items: [
    { id: 'doc-1', text: 'Nota simple del Registro de la Propiedad (cargas, titularidad, superficie)', priority: 'critical' },
    { id: 'doc-2', text: 'Certificado energético (obligatorio para venta)', priority: 'critical' },
    { id: 'doc-3', text: 'ITE del edificio (obligatorio en Euskadi >50 años)', priority: 'critical' },
    { id: 'doc-4', text: 'Últimas 3 actas de juntas de propietarios', priority: 'critical' },
    { id: 'doc-5', text: 'Último recibo de comunidad pagado', priority: 'important' },
    { id: 'doc-6', text: 'Último recibo de IBI', priority: 'important' },
    { id: 'doc-7', text: 'Plano de la vivienda (para verificar m2 y distribución)', priority: 'important' },
    { id: 'doc-8', text: 'Cédula de habitabilidad / licencia de primera ocupación', priority: 'important' },
    { id: 'doc-9', text: 'Estatutos de la comunidad (restricciones de uso, obras)', priority: 'recommended' },
    { id: 'doc-10', text: 'Certificado de deuda cero de la comunidad', priority: 'critical' },
  ],
};

const renovation: ChecklistSection = {
  id: 'renovation',
  title: 'Puntos de reforma',
  icon: 'Hammer',
  phase: 'during',
  condition: (p) => p.needsRenovation !== 'no',
  items: [
    { id: 'ren-1', text: 'Identificar muros de carga antes de pensar en tirar tabiques', priority: 'critical' },
    { id: 'ren-2', text: 'Bajante comunitaria que pase por el piso? Limita redistribución de baños', priority: 'critical' },
    { id: 'ren-3', text: 'Acceso para materiales: tamaño ascensor, anchura escalera y puertas', priority: 'important' },
    { id: 'ren-4', text: 'Altura de techos: mínimo 2.50m libre para suelo radiante o falso techo', priority: 'important' },
    { id: 'ren-5', text: 'Estado de solera/forjado bajo el suelo actual', priority: 'important' },
    { id: 'ren-6', text: 'Presupuesto orientativo: integral 800-1200 eur/m2, cocina 8-15k, baño 5-10k', priority: 'critical' },
    { id: 'ren-7', text: 'Licencia de obra: obras mayores requieren licencia municipal (2-3 meses)', priority: 'important' },
    { id: 'ren-8', text: '¿La comunidad permite las obras previstas?', priority: 'critical' },
    { id: 'ren-9', text: 'Verificar amianto (1960-1990): bajantes, depósitos, cubiertas. Retirada cara y regulada', priority: 'critical' },
  ],
  tips: [
    'Pide al menos 2-3 presupuestos de reforma antes de hacer oferta.',
  ],
};

// ---------------------------------------------------------------------------
// DURING — Qué fotografiar
// ---------------------------------------------------------------------------

const photos: ChecklistSection = {
  id: 'photos',
  title: 'Qué fotografiar',
  icon: 'Camera',
  phase: 'during',
  items: [
    { id: 'pho-1', text: 'Vídeo panorámico de cada habitación (empezando por la ventana)', priority: 'critical' },
    { id: 'pho-2', text: 'Cuadro eléctrico y caldera (para consultar modelo/año después)', priority: 'critical' },
    { id: 'pho-3', text: 'Cualquier grieta, humedad o desperfecto', priority: 'critical' },
    { id: 'pho-4', text: 'Vistas desde cada ventana', priority: 'important' },
    { id: 'pho-5', text: 'Zonas comunes, portal, buzón', priority: 'important' },
    { id: 'pho-6', text: 'Placa del ascensor (fecha de revisión)', priority: 'important' },
    { id: 'pho-7', text: 'Fachada desde la calle', priority: 'recommended' },
    { id: 'pho-8', text: 'Detalle de ventanas (tipo de cristal, carpintería)', priority: 'recommended' },
  ],
};

// ---------------------------------------------------------------------------
// AFTER — Post-visita
// ---------------------------------------------------------------------------

const postVisit: ChecklistSection = {
  id: 'post-visit',
  title: 'Post-visita',
  icon: 'ListChecks',
  phase: 'after',
  items: [
    { id: 'post-1', text: 'Apuntar todas las impresiones en la app (notas) antes de 24h', priority: 'critical' },
    { id: 'post-2', text: 'Puntuar el piso: ubicación, luz, estado, distribución, aislamiento, precio', priority: 'critical' },
    { id: 'post-3', text: 'Solicitar nota simple del Registro (online, ~9 eur, tarda 24-48h)', priority: 'important' },
    { id: 'post-4', text: 'Si interesa: pedir segunda visita (llevar a alguien, ir a otra hora)', priority: 'important' },
    { id: 'post-5', text: 'Si interesa: pedir presupuesto de reforma (al menos 2-3)', priority: 'important', condition: (p) => p.needsRenovation !== 'no' },
    { id: 'post-6', text: 'Consultar con banco: tasación previa y condiciones hipoteca para ESTE piso', priority: 'important' },
    { id: 'post-7', text: 'Calcular coste total: precio + ITP (4% Euskadi) + notaría + registro + reforma', priority: 'critical' },
  ],
  tips: [
    'ITP en Euskadi: 4% para vivienda habitual (de los más bajos de España). Segunda vivienda: 7%.',
  ],
};

const verification: ChecklistSection = {
  id: 'verification',
  title: 'Verificar antes de comprometerse',
  icon: 'ShieldCheck',
  phase: 'after',
  items: [
    { id: 'ver-1', text: 'La vivienda no tiene cargas (hipotecas, embargos) — nota simple', priority: 'critical' },
    { id: 'ver-2', text: 'El vendedor es el propietario real — nota simple', priority: 'critical' },
    { id: 'ver-3', text: 'Está al corriente de IBI y comunidad — recibos', priority: 'critical' },
    { id: 'ver-4', text: 'La superficie real coincide con la anunciada (margen +-5%)', priority: 'critical' },
    { id: 'ver-5', text: 'No hay derramas pendientes de pago', priority: 'critical' },
    { id: 'ver-6', text: 'El certificado energético está en vigor', priority: 'important' },
    { id: 'ver-7', text: 'La ITE está pasada (si edificio >50 años)', priority: 'important' },
    { id: 'ver-8', text: 'Tu banco confirma que financia al porcentaje que necesitas', priority: 'critical' },
  ],
  tips: [
    'Al hacer oferta: siempre por escrito, con condiciones claras (sujeta a tasación, plazo, etc.).',
  ],
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const CHECKLIST_SECTIONS: ChecklistSection[] = [
  // Before
  preparation,
  questionsForAgent,
  redFlags,
  // During
  building,
  structure,
  installations,
  insulation,
  layout,
  kitchenBath,
  community,
  documentation,
  renovation,
  photos,
  // After
  postVisit,
  verification,
];

/**
 * Devuelve las secciones aplicables a una propiedad, filtrando por condiciones.
 * Dentro de cada sección, también filtra items condicionales.
 */
export function getApplicableSections(property: Property): ChecklistSection[] {
  return CHECKLIST_SECTIONS
    .filter((s) => !s.condition || s.condition(property))
    .map((s) => ({
      ...s,
      items: s.items.filter((item) => !item.condition || item.condition(property)),
    }));
}

/** Total de items aplicables para una propiedad */
export function getTotalItems(sections: ChecklistSection[]): number {
  return sections.reduce((sum, s) => sum + s.items.length, 0);
}

/** Items marcados como completados */
export function getCheckedCount(
  sections: ChecklistSection[],
  checklist: Record<string, boolean> | undefined,
): number {
  if (!checklist) return 0;
  return sections.reduce(
    (sum, s) => sum + s.items.filter((item) => checklist[item.id]).length,
    0,
  );
}
