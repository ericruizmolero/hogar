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
  after: 'Despues',
};

// ---------------------------------------------------------------------------
// BEFORE — Preparacion
// ---------------------------------------------------------------------------

const preparation: ChecklistSection = {
  id: 'preparation',
  title: 'Preparacion',
  icon: 'ClipboardList',
  phase: 'before',
  items: [
    { id: 'prep-1', text: 'Consultar catastro (sedecatastro.gob.es): superficie real, ano, coeficiente', priority: 'critical' },
    { id: 'prep-2', text: 'Buscar el edificio en Google Maps / Street View: fachada, entorno, orientacion', priority: 'critical' },
    { id: 'prep-3', text: 'Comprobar ruido del barrio (ocio nocturno, trafico, tren)', priority: 'important' },
    { id: 'prep-4', text: 'Consultar planes urbanisticos en el PGOU de Donostia', priority: 'important' },
    { id: 'prep-5', text: 'Revisar mapa de inundabilidad (URA) si zona cercana al Urumea', priority: 'important' },
    { id: 'prep-6', text: 'Llevar: movil con camara, metro/laser, nivel de burbuja, linterna, cargador', priority: 'critical' },
    { id: 'prep-7', text: 'Llevar esta checklist abierta en el movil', priority: 'recommended' },
  ],
  tips: [
    'Visitar a mediodia (12-14h) para comprobar luz natural real si orientacion sur/suroeste.',
    'Si el piso da a calle transitada, visitar tambien en hora punta (8-9h o 18-19h).',
    'Donostia tiene muchos dias nublados: si puedes, visita un dia soleado y otro gris.',
  ],
};

const questionsForAgent: ChecklistSection = {
  id: 'questions',
  title: 'Preguntas para el agente',
  icon: 'MessageCircleQuestion',
  phase: 'before',
  items: [
    { id: 'q-1', text: 'Por que venden? Cuanto tiempo lleva en venta?', priority: 'critical' },
    { id: 'q-2', text: 'Gastos de comunidad mensuales?', priority: 'critical' },
    { id: 'q-3', text: 'Hay derramas pendientes o previstas?', priority: 'critical' },
    { id: 'q-4', text: 'Tiene ITE pasada? (obligatoria en Euskadi para edificios >50 anos)', priority: 'critical' },
    { id: 'q-5', text: 'Certificado energetico? (obligatorio, pedir letra y consumo)', priority: 'critical' },
    { id: 'q-6', text: 'Se ha hecho alguna reforma reciente? Que se cambio?', priority: 'important' },
    { id: 'q-7', text: 'Que calefaccion tiene? Gasto mensual en invierno?', priority: 'important' },
    { id: 'q-8', text: 'Hay algun vecino conflictivo?', priority: 'important' },
    { id: 'q-9', text: 'Cuanto paga de IBI?', priority: 'important' },
    { id: 'q-10', text: 'Acepta negociar precio? Hay otras ofertas?', priority: 'recommended' },
  ],
};

const redFlags: ChecklistSection = {
  id: 'redflags',
  title: 'Senales de alerta',
  icon: 'TriangleAlert',
  phase: 'before',
  items: [
    { id: 'rf-1', text: 'Edificio pre-1980 sin rehabilitacion: posible amianto, plomo, sin diferenciales', priority: 'critical' },
    { id: 'rf-2', text: 'Fachada norte sin aislamiento ETICS: condensacion en invierno', priority: 'critical' },
    { id: 'rf-3', text: '"A reformar" sin presupuesto: en Donostia 800-1200 eur/m2 reforma integral', priority: 'critical', condition: (p) => p.needsRenovation !== 'no' },
    { id: 'rf-4', text: 'Bajo o entresuelo: humedad por capilaridad, menos luz, ruido de portal', priority: 'important' },
    { id: 'rf-5', text: 'Grietas diagonales en fachada: posible asentamiento (zonas de relleno: Amara Berri, Gros)', priority: 'important' },
    { id: 'rf-6', text: '"Exterior" que da a patio interior: verificar luz real in situ', priority: 'important' },
  ],
  tips: [
    'Donostia tiene ~1500mm de lluvia/ano. La humedad es el enemigo principal.',
    'Zonas cercanas al Urumea (Loiola, Martutene, Egia baja) tienen historico de crecidas.',
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
    { id: 'bld-2', text: 'Revisar portal: buzon, portero automatico, estado general', priority: 'important' },
    { id: 'bld-3', text: 'Estado del ascensor: marca, placa de revision, ruidos', priority: 'critical' },
    { id: 'bld-4', text: 'Escalera: peldanos, barandilla, iluminacion, olor a humedad', priority: 'important' },
    { id: 'bld-5', text: 'Preguntar si tejado/cubierta se ha reparado recientemente', priority: 'important' },
    { id: 'bld-6', text: 'Bajantes: originales o sustituidas? (pre-1990: posible uralita/amianto)', priority: 'critical' },
    { id: 'bld-7', text: 'Garaje: acceso, tamano de plaza, ventilacion, humedades', priority: 'recommended', condition: (p) => p.parkingIncluded || p.parkingOptional },
    { id: 'bld-8', text: 'Trastero: tamano real, humedad, ventilacion, seguridad', priority: 'recommended' },
  ],
};

const structure: ChecklistSection = {
  id: 'structure',
  title: 'Estructura y problemas ocultos',
  icon: 'ScanSearch',
  phase: 'during',
  items: [
    { id: 'str-1', text: 'Buscar grietas en paredes y techos (las diagonales son estructurales)', priority: 'critical' },
    { id: 'str-2', text: 'Comprobar suelos nivelados: poner pelota o usar nivel del movil', priority: 'critical' },
    { id: 'str-3', text: 'Verificar pilares o vigas que limiten distribucion futura', priority: 'important' },
    { id: 'str-4', text: 'Golpear paredes: distinguir tabique (hueco) de muro de carga (solido)', priority: 'important' },
    { id: 'str-5', text: 'Abrir y cerrar todas las puertas y ventanas: deben cerrar sin forzar', priority: 'important' },
    { id: 'str-6', text: 'Buscar manchas de humedad en techos (especialmente bajo banos de arriba)', priority: 'critical' },
    { id: 'str-7', text: 'Mirar detras de muebles y dentro de armarios con linterna', priority: 'critical' },
    { id: 'str-8', text: 'Oler al entrar: humedad, moho o pintura fresca pueden ocultar problemas', priority: 'critical' },
  ],
  tips: [
    'En pisos con fachada norte, tocar la pared interior de la fachada. Si esta fria y humeda, hay puente termico.',
  ],
};

const installations: ChecklistSection = {
  id: 'installations',
  title: 'Instalaciones',
  icon: 'Plug',
  phase: 'during',
  items: [
    { id: 'ins-1', text: 'Localizar cuadro electrico: tiene diferenciales e ICP? Cuantos circuitos?', priority: 'critical' },
    { id: 'ins-2', text: 'Probar enchufes en varias habitaciones (llevar cargador)', priority: 'important' },
    { id: 'ins-3', text: 'Preguntar potencia contratada (minimo 5.75kW si calefaccion electrica)', priority: 'important' },
    { id: 'ins-4', text: 'Abrir grifos de agua caliente y fria: comprobar presion y color', priority: 'critical' },
    { id: 'ins-5', text: 'Tirar cisterna: debe vaciar rapido sin borboteos', priority: 'important' },
    { id: 'ins-6', text: 'Material de tuberias: plomo = sustituir obligatoriamente; cobre/PEX = ok', priority: 'critical' },
    { id: 'ins-7', text: 'Gas natural canalizado? Comprobar caldera: marca, modelo, ano (>15 anos = sustituir)', priority: 'critical' },
    { id: 'ins-8', text: 'Tipo de calefaccion: radiadores, suelo radiante, splits?', priority: 'important' },
    { id: 'ins-9', text: 'Calentador/termo: capacidad (2 personas minimo 80L, familia 120L+)', priority: 'important' },
    { id: 'ins-10', text: 'Aire acondicionado: tiene preinstalacion?', priority: 'recommended' },
  ],
};

const insulation: ChecklistSection = {
  id: 'insulation',
  title: 'Aislamiento termico y acustico',
  icon: 'Thermometer',
  phase: 'during',
  items: [
    { id: 'iso-1', text: 'Ventanas: tipo de cristal (simple, doble, Climalit). Doble acristalamiento imprescindible', priority: 'critical' },
    { id: 'iso-2', text: 'Carpinteria: PVC o aluminio con RPT son los mejores para Donostia', priority: 'critical' },
    { id: 'iso-3', text: 'Cerrar ventanas y escuchar: trafico, vecinos, bares?', priority: 'critical' },
    { id: 'iso-4', text: 'Comprobar persianas/contraventanas: funcionan bien?', priority: 'important' },
    { id: 'iso-5', text: 'Certificado energetico: letra E, F o G = gasto alto (200+ eur/mes en invierno)', priority: 'important' },
    { id: 'iso-6', text: 'Edificio tiene aislamiento exterior (ETICS/SATE)?', priority: 'important' },
    { id: 'iso-7', text: 'Poner mano cerca de marcos de ventana: se nota corriente?', priority: 'important' },
  ],
  tips: [
    'Pide ver una factura de luz/gas de invierno (diciembre-febrero). Es el mejor indicador real del aislamiento.',
  ],
};

const layout: ChecklistSection = {
  id: 'layout',
  title: 'Distribucion y espacios',
  icon: 'LayoutGrid',
  phase: 'during',
  items: [
    { id: 'lay-1', text: 'Medir habitaciones principales con metro (no fiarse de los m2 del anuncio)', priority: 'critical' },
    { id: 'lay-2', text: 'Comprobar que cabe cama de 150cm + mesillas en dormitorio principal', priority: 'important' },
    { id: 'lay-3', text: 'Verificar espacio de almacenamiento: armarios empotrados, trastero', priority: 'important' },
    { id: 'lay-4', text: 'Cocina tiene espacio para nevera, lavavajillas, lavadora, horno?', priority: 'important' },
    { id: 'lay-5', text: 'Evaluar si la distribucion se puede cambiar: muros de carga vs tabiques', priority: 'important' },
    { id: 'lay-6', text: 'Tendedero: hay espacio? Terraza, lavadero, tendedero en bano? Critico en Donostia', priority: 'critical' },
    { id: 'lay-7', text: 'Luz natural: cuantas habitaciones tienen ventana al exterior?', priority: 'important' },
    { id: 'lay-8', text: 'Comprobar orientacion real con brujula del movil', priority: 'critical' },
  ],
};

const kitchenBath: ChecklistSection = {
  id: 'kitchen-bath',
  title: 'Cocina y banos',
  icon: 'CookingPot',
  phase: 'during',
  items: [
    { id: 'kb-1', text: 'Estado de encimera, muebles y electrodomesticos (se quedan o se van?)', priority: 'important' },
    { id: 'kb-2', text: 'Revisar bajo fregadero: humedades, estado de sifon y tuberias', priority: 'critical' },
    { id: 'kb-3', text: 'Campana extractora: funciona? Salida al exterior o recircula?', priority: 'recommended' },
    { id: 'kb-4', text: 'Banos: buscar juntas de silicona negras (moho), azulejos rotos o sueltos', priority: 'important' },
    { id: 'kb-5', text: 'Ventilacion del bano: tiene ventana o extractor? Banos interiores generan moho rapido', priority: 'critical' },
    { id: 'kb-6', text: 'Edad del bano: >20 anos probablemente necesita reforma', priority: 'important' },
    { id: 'kb-7', text: 'Tomas de agua para lavadora (en cocina o bano)', priority: 'recommended' },
  ],
};

const community: ChecklistSection = {
  id: 'community',
  title: 'Comunidad y gastos',
  icon: 'Users',
  phase: 'during',
  items: [
    { id: 'com-1', text: 'Gastos de comunidad mensuales (50-150 eur normal, >200 preguntar)', priority: 'critical' },
    { id: 'com-2', text: 'Derramas aprobadas o previstas: pedir actas de ultimas 3 juntas', priority: 'critical' },
    { id: 'com-3', text: 'Administrador de fincas: quien es?', priority: 'important' },
    { id: 'com-4', text: 'Fondo de reserva de la comunidad (minimo legal 10%)', priority: 'important' },
    { id: 'com-5', text: 'Hay vecinos morosos?', priority: 'important' },
    { id: 'com-6', text: 'Se permite hacer obras? Horarios? Restricciones?', priority: 'recommended' },
    { id: 'com-7', text: 'IBI anual (en Donostia: 1.000-3.000 eur segun zona y tamano)', priority: 'critical' },
    { id: 'com-8', text: 'Tasa de basuras (Donostia cobra aparte: ~100-150 eur/ano)', priority: 'recommended' },
  ],
};

const documentation: ChecklistSection = {
  id: 'documentation',
  title: 'Documentacion a solicitar',
  icon: 'FileText',
  phase: 'during',
  items: [
    { id: 'doc-1', text: 'Nota simple del Registro de la Propiedad (cargas, titularidad, superficie)', priority: 'critical' },
    { id: 'doc-2', text: 'Certificado energetico (obligatorio para venta)', priority: 'critical' },
    { id: 'doc-3', text: 'ITE del edificio (obligatorio en Euskadi >50 anos)', priority: 'critical' },
    { id: 'doc-4', text: 'Ultimas 3 actas de juntas de propietarios', priority: 'critical' },
    { id: 'doc-5', text: 'Ultimo recibo de comunidad pagado', priority: 'important' },
    { id: 'doc-6', text: 'Ultimo recibo de IBI', priority: 'important' },
    { id: 'doc-7', text: 'Plano de la vivienda (para verificar m2 y distribucion)', priority: 'important' },
    { id: 'doc-8', text: 'Cedula de habitabilidad / licencia de primera ocupacion', priority: 'important' },
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
    { id: 'ren-2', text: 'Bajante comunitaria que pase por el piso? Limita redistribucion de banos', priority: 'critical' },
    { id: 'ren-3', text: 'Acceso para materiales: tamano ascensor, anchura escalera y puertas', priority: 'important' },
    { id: 'ren-4', text: 'Altura de techos: minimo 2.50m libre para suelo radiante o falso techo', priority: 'important' },
    { id: 'ren-5', text: 'Estado de solera/forjado bajo el suelo actual', priority: 'important' },
    { id: 'ren-6', text: 'Presupuesto orientativo: integral 800-1200 eur/m2, cocina 8-15k, bano 5-10k', priority: 'critical' },
    { id: 'ren-7', text: 'Licencia de obra: obras mayores requieren licencia municipal (2-3 meses)', priority: 'important' },
    { id: 'ren-8', text: 'La comunidad permite las obras previstas?', priority: 'critical' },
    { id: 'ren-9', text: 'Verificar amianto (1960-1990): bajantes, depositos, cubiertas. Retirada cara y regulada', priority: 'critical' },
  ],
  tips: [
    'Pide al menos 2-3 presupuestos de reforma antes de hacer oferta.',
  ],
};

// ---------------------------------------------------------------------------
// DURING — Que fotografiar
// ---------------------------------------------------------------------------

const photos: ChecklistSection = {
  id: 'photos',
  title: 'Que fotografiar',
  icon: 'Camera',
  phase: 'during',
  items: [
    { id: 'pho-1', text: 'Video panoramico de cada habitacion (empezando por la ventana)', priority: 'critical' },
    { id: 'pho-2', text: 'Cuadro electrico y caldera (para consultar modelo/ano despues)', priority: 'critical' },
    { id: 'pho-3', text: 'Cualquier grieta, humedad o desperfecto', priority: 'critical' },
    { id: 'pho-4', text: 'Vistas desde cada ventana', priority: 'important' },
    { id: 'pho-5', text: 'Zonas comunes, portal, buzon', priority: 'important' },
    { id: 'pho-6', text: 'Placa del ascensor (fecha de revision)', priority: 'important' },
    { id: 'pho-7', text: 'Fachada desde la calle', priority: 'recommended' },
    { id: 'pho-8', text: 'Detalle de ventanas (tipo de cristal, carpinteria)', priority: 'recommended' },
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
    { id: 'post-2', text: 'Puntuar el piso: ubicacion, luz, estado, distribucion, aislamiento, precio', priority: 'critical' },
    { id: 'post-3', text: 'Solicitar nota simple del Registro (online, ~9 eur, tarda 24-48h)', priority: 'important' },
    { id: 'post-4', text: 'Si interesa: pedir segunda visita (llevar a alguien, ir a otra hora)', priority: 'important' },
    { id: 'post-5', text: 'Si interesa: pedir presupuesto de reforma (al menos 2-3)', priority: 'important', condition: (p) => p.needsRenovation !== 'no' },
    { id: 'post-6', text: 'Consultar con banco: tasacion previa y condiciones hipoteca para ESTE piso', priority: 'important' },
    { id: 'post-7', text: 'Calcular coste total: precio + ITP (4% Euskadi) + notaria + registro + reforma', priority: 'critical' },
  ],
  tips: [
    'ITP en Euskadi: 4% para vivienda habitual (de los mas bajos de Espana). Segunda vivienda: 7%.',
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
    { id: 'ver-3', text: 'Esta al corriente de IBI y comunidad — recibos', priority: 'critical' },
    { id: 'ver-4', text: 'La superficie real coincide con la anunciada (margen +-5%)', priority: 'critical' },
    { id: 'ver-5', text: 'No hay derramas pendientes de pago', priority: 'critical' },
    { id: 'ver-6', text: 'El certificado energetico esta en vigor', priority: 'important' },
    { id: 'ver-7', text: 'La ITE esta pasada (si edificio >50 anos)', priority: 'important' },
    { id: 'ver-8', text: 'Tu banco confirma que financia al porcentaje que necesitas', priority: 'critical' },
  ],
  tips: [
    'Al hacer oferta: siempre por escrito, con condiciones claras (sujeta a tasacion, plazo, etc.).',
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
 * Dentro de cada seccion, tambien filtra items condicionales.
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
