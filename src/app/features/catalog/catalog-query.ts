import { ParamMap, Params } from '@angular/router';
import { CourseKind } from '../../shared/course-detail/course-detail.models';
import { CatalogFilters, CatalogSort, PriceBand, TimeBand } from './catalog.service';

/**
 * Búsqueda del catálogo tal como vive en la URL de /clases, para poder compartirla y volver con "Atrás".
 * Ejemplo: /clases?q=algebra&tipo=curso&temas=matematicas&precio=hasta-10,10-20&valoracion=4.5&en-vivo=1&horario=noche&orden=precio-menor&pagina=2
 */
export interface CatalogQuery {
  q: string;
  kind: CourseKind | null;
  topics: string[];
  prices: PriceBand[];
  times: TimeBand[];
  rating: 4 | 4.5 | null;
  live: boolean;
  sort: CatalogSort;
  page: number;
}

export const EMPTY_QUERY: CatalogQuery = { q: '', kind: null, topics: [], prices: [], times: [], rating: null, live: false, sort: 'soonest', page: 1 };

export const PER_PAGE = 12;

/** Opciones de los filtros: el valor del API, el de la URL y el texto */
export const KIND_OPTIONS: { value: CourseKind; param: string; label: string }[] = [
  { value: 'class', param: 'clase', label: 'Clases sueltas' },
  { value: 'course', param: 'curso', label: 'Cursos' }
];

export const PRICE_OPTIONS: { value: PriceBand; param: string; label: string }[] = [
  { value: 'low', param: 'hasta-10', label: 'Hasta $10' },
  { value: 'mid', param: '10-20', label: '$10 – $20' },
  { value: 'high', param: 'mas-de-20', label: 'Más de $20' }
];

export const TIME_OPTIONS: { value: TimeBand; param: string; label: string; hint: string }[] = [
  { value: 'morning', param: 'manana', label: 'Mañana', hint: '5 a. m. – 12 m.' },
  { value: 'afternoon', param: 'tarde', label: 'Tarde', hint: '12 m. – 7 p. m.' },
  { value: 'night', param: 'noche', label: 'Noche', hint: '7 p. m. – 5 a. m.' }
];

export const RATING_OPTIONS: { value: 4 | 4.5; label: string }[] = [
  { value: 4.5, label: '4.5 o más' },
  { value: 4, label: '4.0 o más' }
];

export const SORT_OPTIONS: { value: CatalogSort; param: string; label: string }[] = [
  { value: 'soonest', param: 'proximas', label: 'Próximas primero' },
  { value: 'rating', param: 'valoracion', label: 'Mejor valorados' },
  { value: 'price_asc', param: 'precio-menor', label: 'Menor precio' },
  { value: 'price_desc', param: 'precio-mayor', label: 'Mayor precio' }
];

/** Valores de la URL ("a,b,c") que existen en las opciones, convertidos al valor del API */
function fromParams<T>(raw: string | null, options: { value: T; param: string }[]): T[] {
  const params = (raw ?? '').split(',');
  return options.filter((option) => params.includes(option.param)).map((option) => option.value);
}

function toParam<T>(values: T[], options: { value: T; param: string }[]): string | null {
  const params = options.filter((option) => values.includes(option.value)).map((option) => option.param);
  return params.length ? params.join(',') : null;
}

/** Lee la búsqueda de los query params (lo desconocido se ignora) */
export function parseQuery(params: ParamMap): CatalogQuery {
  const rating = Number(params.get('valoracion'));
  const page = Math.trunc(Number(params.get('pagina')));
  return {
    q: (params.get('q') ?? '').trim().slice(0, 80),
    kind: fromParams(params.get('tipo'), KIND_OPTIONS)[0] ?? null,
    topics: [...new Set((params.get('temas') ?? '').split(',').filter((slug) => /^[a-z0-9-]{1,80}$/.test(slug)))],
    prices: fromParams(params.get('precio'), PRICE_OPTIONS),
    times: fromParams(params.get('horario'), TIME_OPTIONS),
    rating: rating === 4 || rating === 4.5 ? rating : null,
    live: params.get('en-vivo') === '1',
    sort: fromParams(params.get('orden'), SORT_OPTIONS)[0] ?? 'soonest',
    page: page > 1 ? page : 1
  };
}

/** Query params de la búsqueda; lo que está por defecto no aparece (null lo quita de la URL) */
export function toParams(query: CatalogQuery): Params {
  return {
    q: query.q.trim() || null,
    tipo: toParam(query.kind ? [query.kind] : [], KIND_OPTIONS),
    temas: query.topics.length ? query.topics.join(',') : null,
    precio: toParam(query.prices, PRICE_OPTIONS),
    horario: toParam(query.times, TIME_OPTIONS),
    valoracion: query.rating,
    'en-vivo': query.live ? 1 : null,
    orden: query.sort === 'soonest' ? null : toParam([query.sort], SORT_OPTIONS),
    pagina: query.page > 1 ? query.page : null
  };
}

/** Filtros para el API */
export function toFilters(query: CatalogQuery): CatalogFilters {
  return { ...query, perPage: PER_PAGE };
}

/** Cuántos filtros del panel hay activos (no cuenta la búsqueda ni el orden) */
export function activeFilterCount(query: CatalogQuery): number {
  return (query.kind ? 1 : 0) + query.topics.length + query.prices.length + query.times.length + (query.rating ? 1 : 0) + (query.live ? 1 : 0);
}
