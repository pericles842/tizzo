import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { endAfterStart, RangeFields } from './range-fields';

@Component({
  imports: [RangeFields],
  template: `<app-range-fields [group]="group" prefix="t" />`
})
class Host {
  readonly group = new FormGroup({
    starts_at: new FormControl<Date | null>(new Date(2026, 9, 5, 9, 0), Validators.required),
    ends_at: new FormControl<Date | null>(new Date(2026, 9, 5, 10, 0), [Validators.required, endAfterStart])
  });
}

describe('RangeFields', () => {
  /** Crea el componente y espera a que su efecto se suscriba a los cambios del inicio */
  async function setup() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture.componentInstance.group;
  }

  it('al mover el inicio, el fin se mueve con él y conserva la duración', async () => {
    const group = await setup();
    group.controls.starts_at.setValue(new Date(2026, 9, 5, 14, 0));
    expect(group.controls.ends_at.value).toEqual(new Date(2026, 9, 5, 15, 0));
  });

  it('conserva la duración aunque no sea de una hora', async () => {
    const group = await setup();
    group.controls.ends_at.setValue(new Date(2026, 9, 5, 10, 30));
    group.controls.starts_at.setValue(new Date(2026, 9, 6, 18, 0));
    expect(group.controls.ends_at.value).toEqual(new Date(2026, 9, 6, 19, 30));
  });

  it('si el inicio se borra y vuelve a escribirse, el fin sigue al último inicio válido', async () => {
    const group = await setup();
    group.controls.starts_at.setValue(null);
    expect(group.controls.ends_at.value).toEqual(new Date(2026, 9, 5, 10, 0));
    group.controls.starts_at.setValue(new Date(2026, 9, 5, 14, 0));
    expect(group.controls.ends_at.value).toEqual(new Date(2026, 9, 5, 15, 0));
  });

  it('si no había fin, lo propone una hora después', async () => {
    const group = await setup();
    group.controls.ends_at.setValue(null);
    group.controls.starts_at.setValue(new Date(2026, 9, 5, 11, 0));
    expect(group.controls.ends_at.value).toEqual(new Date(2026, 9, 5, 12, 0));
  });

  describe('endAfterStart', () => {
    it('rechaza un fin antes del inicio', async () => {
      const group = await setup();
      group.controls.ends_at.setValue(new Date(2026, 9, 5, 8, 0));
      expect(group.controls.ends_at.errors?.['range']).toContain('después');
    });

    it('rechaza menos de 15 minutos y más de 8 horas', async () => {
      const group = await setup();
      group.controls.ends_at.setValue(new Date(2026, 9, 5, 9, 10));
      expect(group.controls.ends_at.errors?.['range']).toContain('15 a 480');
      group.controls.ends_at.setValue(new Date(2026, 9, 5, 17, 1));
      expect(group.controls.ends_at.errors?.['range']).toContain('15 a 480');
    });

    it('acepta de 15 a 480 minutos', async () => {
      const group = await setup();
      group.controls.ends_at.setValue(new Date(2026, 9, 5, 9, 15));
      expect(group.controls.ends_at.valid).toBeTrue();
      group.controls.ends_at.setValue(new Date(2026, 9, 5, 17, 0));
      expect(group.controls.ends_at.valid).toBeTrue();
    });

    it('se revalida al mover el inicio', async () => {
      const group = await setup();
      group.controls.ends_at.setValue(new Date(2026, 9, 5, 12, 0));
      group.controls.starts_at.setValue(new Date(2026, 9, 5, 9, 0));
      expect(group.controls.ends_at.valid).toBeTrue();
    });
  });
});
