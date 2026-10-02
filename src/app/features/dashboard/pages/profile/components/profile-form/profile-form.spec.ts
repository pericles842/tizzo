import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TeacherProfile } from '../../../../../../core/auth/auth.models';
import { CategoryGroup, ProfilePayload, SpecialtyEntry } from '../../profile.models';
import { TeacherProfileService } from '../../teacher-profile.service';
import { ProfileForm } from './profile-form';

const profile: TeacherProfile = {
  uuid: 'tp-1',
  headline: 'Profesora de idiomas',
  bio: null,
  signature_url: null,
  approval_status: 'pending',
  rejection_reason: null,
  rating_avg: 0,
  rating_count: 0
};

const categories: CategoryGroup[] = [
  { id: 1, name: 'Idiomas', slug: 'idiomas', children: [{ id: 2, name: 'Inglés', slug: 'ingles' }, { id: 3, name: 'Francés', slug: 'frances' }] },
  { id: 6, name: 'Matemáticas', slug: 'matematicas', children: [{ id: 7, name: 'Álgebra', slug: 'algebra' }] },
  { id: 28, name: 'otro', slug: 'otro', children: [] }
];

describe('ProfileForm: especialidades con años', () => {
  let updateProfile: jasmine.Spy;

  function create(specialties: SpecialtyEntry[] = []) {
    const payload: ProfilePayload = { profile, specialties, credentials: [] };
    updateProfile = jasmine.createSpy('updateProfile').and.resolveTo(payload);
    TestBed.configureTestingModule({
      imports: [ProfileForm],
      providers: [provideZonelessChangeDetection(), { provide: TeacherProfileService, useValue: { updateProfile } }]
    });
    const fixture = TestBed.createComponent(ProfileForm);
    fixture.componentRef.setInput('profile', profile);
    fixture.componentRef.setInput('specialties', specialties);
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { fixture, cmp: fixture.componentInstance as any };
  }

  it('el selector agrupa por área y deja las categorías sin subcategorías en "Otros"', () => {
    const { cmp } = create();
    const groups = cmp.options() as { label: string; items: { label: string; value: number }[] }[];
    expect(groups.map((g) => g.label)).toEqual(['Idiomas', 'Matemáticas', 'Otros']);
    expect(groups[0].items.map((i) => i.label)).toEqual(['Inglés', 'Francés']);
    expect(groups[2].items).toEqual([{ label: 'otro', value: 28 }]);
  });

  it('carga lo guardado: un renglón por especialidad con sus años', () => {
    const { cmp } = create([{ category_id: 2, name: 'Inglés', parent_name: 'Idiomas', years_experience: 8 }]);
    expect(cmp.rows.length).toBe(1);
    expect(cmp.rows.at(0).controls.years.value).toBe(8);
    expect(cmp.form.controls.categoryIds.value).toEqual([2]);
    expect(cmp.info(2)).toEqual({ name: 'Inglés', parent: 'Idiomas' });
  });

  it('elegir categorías crea un renglón sin años (inválido) y desmarcar lo quita', () => {
    const { cmp } = create();
    cmp.syncRows([2, 7]);
    expect(cmp.rows.length).toBe(2);
    expect(cmp.rows.controls.every((row: { controls: { years: { invalid: boolean } } }) => row.controls.years.invalid)).toBeTrue();

    cmp.syncRows([7]);
    expect(cmp.rows.length).toBe(1);
    expect(cmp.rows.at(0).controls.category_id.value).toBe(7);
  });

  it('los años son obligatorios, de 0 a 70 (0 es válido)', () => {
    const { cmp } = create();
    cmp.syncRows([2]);
    const years = cmp.rows.at(0).controls.years;
    years.setValue(null);
    expect(years.errors?.['required']).toBeTrue();
    years.setValue(71);
    expect(years.errors?.['max']).toBeTruthy();
    years.setValue(-1);
    expect(years.errors?.['min']).toBeTruthy();
    years.setValue(0);
    expect(years.valid).toBeTrue();
  });

  it('no guarda si falta algún año', async () => {
    const { cmp } = create();
    cmp.syncRows([2, 7]);
    cmp.rows.at(0).controls.years.setValue(5);
    await cmp.save();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('guarda titular, biografía y cada especialidad con sus años', async () => {
    const { cmp } = create();
    cmp.form.controls.headline.setValue('  Profesora de álgebra  ');
    cmp.syncRows([2, 7]);
    cmp.rows.at(0).controls.years.setValue(8);
    cmp.rows.at(1).controls.years.setValue(0);
    await cmp.save();

    expect(updateProfile).toHaveBeenCalledOnceWith({
      headline: 'Profesora de álgebra',
      bio: null,
      specialties: [
        { category_id: 2, years_experience: 8 },
        { category_id: 7, years_experience: 0 }
      ]
    });
  });

  it('quitar un renglón con la papelera también lo desmarca del selector', () => {
    const { cmp } = create([
      { category_id: 2, name: 'Inglés', parent_name: 'Idiomas', years_experience: 8 },
      { category_id: 7, name: 'Álgebra', parent_name: 'Matemáticas', years_experience: 3 }
    ]);
    cmp.removeRow(0);
    expect(cmp.rows.length).toBe(1);
    expect(cmp.form.controls.categoryIds.value).toEqual([7]);
  });
});
