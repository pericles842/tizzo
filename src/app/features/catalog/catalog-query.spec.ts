import { convertToParamMap } from '@angular/router';
import { EMPTY_QUERY, activeFilterCount, parseQuery, toParams } from './catalog-query';

describe('catalog-query', () => {
  it('sin query params es la búsqueda vacía', () => {
    expect(parseQuery(convertToParamMap({}))).toEqual(EMPTY_QUERY);
  });

  it('lee los parámetros en español y los pasa a los valores del API', () => {
    const query = parseQuery(
      convertToParamMap({
        q: '  álgebra ',
        tipo: 'curso',
        temas: 'matematicas,idiomas',
        precio: 'hasta-10,mas-de-20',
        horario: 'noche',
        valoracion: '4.5',
        'en-vivo': '1',
        orden: 'precio-menor',
        pagina: '3'
      })
    );
    expect(query).toEqual({
      q: 'álgebra',
      kind: 'course',
      topics: ['matematicas', 'idiomas'],
      prices: ['low', 'high'],
      times: ['night'],
      rating: 4.5,
      live: true,
      sort: 'price_asc',
      page: 3
    });
  });

  it('ignora valores desconocidos', () => {
    const query = parseQuery(convertToParamMap({ tipo: 'x', temas: 'Mal Slug', precio: 'gratis', valoracion: '3', orden: 'raro', pagina: '-2' }));
    expect(query).toEqual(EMPTY_QUERY);
  });

  it('ida y vuelta: toParams y parseQuery dan la misma búsqueda', () => {
    const query = { ...EMPTY_QUERY, q: 'inglés', kind: 'class' as const, topics: ['idiomas'], prices: ['mid' as const], times: ['morning' as const], rating: 4 as const, live: true, sort: 'rating' as const, page: 2 };
    const params = toParams(query);
    const clean = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== null).map(([key, value]) => [key, String(value)]));
    expect(parseQuery(convertToParamMap(clean))).toEqual(query);
  });

  it('lo que está por defecto no aparece en la URL', () => {
    expect(Object.values(toParams(EMPTY_QUERY)).every((value) => value === null)).toBeTrue();
  });

  it('cuenta los filtros activos del panel (sin búsqueda ni orden)', () => {
    expect(activeFilterCount({ ...EMPTY_QUERY, q: 'x', sort: 'rating' })).toBe(0);
    expect(activeFilterCount({ ...EMPTY_QUERY, kind: 'course', topics: ['a', 'b'], prices: ['low'], live: true, rating: 4 })).toBe(6);
  });
});
