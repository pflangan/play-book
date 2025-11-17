import { Component } from '@angular/core';

import { NavbarComponent } from './components/navbar/navbar.component';
import { PlayStepsComponent } from './components/play-steps/play-steps.component';
import { PlaybookComponent } from './components/playbook/playbook.component';
import { ToolboxComponent } from './components/toolbox/toolbox.component';

@Component({
    selector: 'app-root',
    template: `
    <div class="app">
      <app-navbar></app-navbar>
      <div class="main-layout">
        <app-play-steps></app-play-steps>
        <app-playbook></app-playbook>
        <app-toolbox></app-toolbox>
      </div>
    </div>
  `,
    styles: [`
    .app {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
  `],
    standalone: false
})
export class AppComponent {}