import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  template: `
    <router-outlet />
    <p-toast position="top-center" showTransformOptions="translateY(-100%)" hideTransformOptions="translateY(-20%)" showTransitionOptions="300ms ease-out" hideTransitionOptions="250ms ease-in" />
  `
})
export class App {}
