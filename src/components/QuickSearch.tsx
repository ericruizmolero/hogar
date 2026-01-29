import { useState } from 'react';
import { Compass, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface SearchLink {
  label: string;
  url: string;
}

interface PlatformSearch {
  id: string;
  name: string;
  /** Si true, los links se muestran siempre. Si false, se colapsan. */
  alwaysVisible: boolean;
  links: SearchLink[];
}

const PLATFORMS: PlatformSearch[] = [
  {
    id: 'idealista',
    name: 'Idealista',
    alwaysVisible: true,
    links: [
      {
        label: 'Amara',
        url: 'https://www.idealista.com/venta-viviendas/donostia-san-sebastian/amara/con-precio-hasta_800000,metros-cuadrados-mas-de_80/',
      },
      {
        label: 'Atotxa Erreka',
        url: 'https://www.idealista.com/geo/venta-viviendas/atotxa-erreka/con-precio-hasta_800000,metros-cuadrados-mas-de_80/',
      },
      {
        label: 'Gros',
        url: 'https://www.idealista.com/venta-viviendas/donostia-san-sebastian/gros/con-precio-hasta_800000,metros-cuadrados-mas-de_80,de-dos-dormitorios,de-tres-dormitorios,de-cuatro-cinco-habitaciones-o-mas/',
      },
      {
        label: 'Aiete',
        url: 'https://www.idealista.com/areas/venta-viviendas/con-precio-hasta_800000,metros-cuadrados-mas-de_80,de-tres-dormitorios,de-cuatro-cinco-habitaciones-o-mas/?shape=%28%28%28ehigGf%7CgKcc%40%3FoCaAaCkCkBcCsEcHo%40sAw%40iAeBiDsBaFkAyBu%40yBi%40wElBtC%3F_Ih%40gDz%40cClB_DlByBdBiDh%40oBLaA%3FgSMsFUgBu%40aKg%40wEc%40mEKyB%7D%40qI%5BgBMyB%3FsKLw%40xAiDbAgB%7EAeBdBuAzBm%40t%40e%40lB%5B%7E%5E%3FhCd%40bAb%40rBn%40pDl%40rBHrBd%40jAd%40pAv%40zB%60A%60%40l%40R%60ADjAv%40hAdBx%40%60C%7E%40%7EDjAf%40HlBv%40%60CfB%60%40v%40pA%7CAzB%7ECf%40%60AzB%7EChAxBxAxBf%40hAjArD%7C%40nG%60%40dE%3F%7C%5CMxBu%40vEw%40tCsBnEyB%7EC%5Bv%40%7D%40rAg%40d%40yAxBYv%40gBxB_BbC%7B%40fBaC%7ECyAxBeBnBmBfBa%40v%40wAjAi%40l%40_BrAoCfBwGbCyB%60AkAv%40cAjAmBb%40%29%29%29',
      },
      {
        label: 'Loiola Martutene',
        url: 'https://www.idealista.com/areas/venta-viviendas/con-precio-hasta_800000,metros-cuadrados-mas-de_80/?shape=%28%28w%7DjgG%60iaKdAid%40%7CIyh%40rd%40wn%40%7CZjZwa%40jrA%7Dj%40bO%29%29',
      },
    ],
  },
  {
    id: 'fotocasa',
    name: 'Fotocasa',
    alwaysVisible: false,
    links: [
      {
        label: 'Donostia',
        url: 'https://www.fotocasa.es/es/comprar/viviendas/donostia-san-sebastian/todas-las-zonas/l',
      },
    ],
  },
  {
    id: 'engelvolkers',
    name: 'Engel & Volkers',
    alwaysVisible: false,
    links: [
      {
        label: 'Donostia',
        url: 'https://www.engelvoelkers.com/es/es/inmuebles/res/compra/inmobiliario?businessArea[]=residential&currency=EUR&hasSessionBounds=true&measurementSystem=metric&page=1&placeId=ChIJFf5oO_6vUQ0RSUaGlFnFPuQ&placeName=San%20Sebasti%C3%A1n%2C%20Espa%C3%B1a&price.max=800000&propertyMarketingType[]=sale&searchMode=classic&searchRadius=0&sortingOptions[]=PUBLISHED_AT_DESC',
      },
    ],
  },
  {
    id: 'grupotome',
    name: 'Grupo Tome',
    alwaysVisible: false,
    links: [
      {
        label: 'Donostia',
        url: 'https://www.grupotome.com/index.php?limtipos=199,6499,1299,3399,3499,2899&areas=11801_id&buscador=1&idio=1',
      },
    ],
  },
  {
    id: 'areizaga',
    name: 'Areizaga',
    alwaysVisible: false,
    links: [
      {
        label: 'Donostia',
        url: 'https://www.areizaga.com/es/buscador/?ope=venta&tipo=Piso%2CChalet&texto=',
      },
    ],
  },
];

const visiblePlatforms = PLATFORMS.filter((p) => p.alwaysVisible);
const collapsedPlatforms = PLATFORMS.filter((p) => !p.alwaysVisible);

function PlatformRow({ platform }: { platform: PlatformSearch }) {
  return (
    <div>
      <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wide sm:hidden block mb-1">
        {platform.name}
      </span>
      <div className="flex items-start gap-3">
        <span className="text-xs text-[var(--color-text-tertiary)] w-24 flex-shrink-0 pt-0.5 truncate hidden sm:block">
          {platform.name}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {platform.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-md sm:rounded text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] sm:border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <ExternalLink size={10} strokeWidth={1.5} />
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function QuickSearch() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Compass size={15} strokeWidth={1.5} className="text-[var(--color-text-tertiary)]" />
        <span className="text-sm text-[var(--color-text-secondary)]">
          Busca en los portales e importa tus favoritos
        </span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      <div className="space-y-2">
        {visiblePlatforms.map((platform) => (
          <PlatformRow key={platform.id} platform={platform} />
        ))}

        {expanded && collapsedPlatforms.map((platform) => (
          <PlatformRow key={platform.id} platform={platform} />
        ))}
      </div>

      {collapsedPlatforms.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          {expanded
            ? <><ChevronUp size={12} /> Menos portales</>
            : <><ChevronDown size={12} /> Más portales ({collapsedPlatforms.length})</>
          }
        </button>
      )}
    </div>
  );
}
