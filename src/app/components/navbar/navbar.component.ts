import { Component } from '@angular/core';

@Component({
    selector: 'app-navbar',
    template: `
    <nav class="navbar">
      <div class="navbar-brand">
        <h1>Basketball Play Creator</h1>
      </div>
      <div class="navbar-menu">
        <button>File</button>
        <button>Edit</button>
        <button>View</button>
      </div>
    </nav>
  `,
    styles: [`
    .navbar {
      background: #2c3e50;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .navbar-brand h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    .navbar-menu button {
      background: transparent;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      cursor: pointer;
      margin-left: 1rem;
      transition: background 0.2s;
    }
    .navbar-menu button:hover {
      background: rgba(255,255,255,0.1);
    }
  `],
    standalone: false
})
export class NavbarComponent {}