import { Component, OnInit, NgZone } from '@angular/core';
import { PlayService } from '../../services/play.service';
import { Player, DrawObject, PlayLine, LineAnchor } from '../../models/play.model';

@Component({
    selector: 'app-toolbox',
    template: `
    <div class="toolbox">
      <h3>Toolbox</h3>
    
      <!-- Players Panel -->
      <div class="panel">
        <h4>Players</h4>
        <!-- Offense-with-ball group -->
        <div class="players-grid">
          @for (num of [1, 2, 3, 4, 5]; track num) {
            <div
              class="player-item offense-with-ball"
              draggable="true"
              (dragstart)="onDragStart($event, 'offense-with-ball-player', num)"
              title="Drag to add offense-with-ball player">
              <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="transparent" stroke="black" stroke-width="3"/>
                <text x="20" y="26" text-anchor="middle" font-size="16" font-weight="bold" fill="black">{{ num }}</text>
              </svg>
            </div>
          }
        </div>
        <!-- Offense group (no ball, transparent border) -->
        <div class="players-grid" style="margin-top: 1rem;">
          @for (num of [1, 2, 3, 4, 5]; track num) {
            <div
              class="player-item offense"
              draggable="true"
              (dragstart)="onDragStart($event, 'offense-player', num)"
              title="Drag to add offensive player (no ball)">
              <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="transparent" stroke="transparent" stroke-width="3"/>
                <text x="20" y="26" text-anchor="middle" font-size="16" font-weight="bold" fill="black">{{ num }}</text>
              </svg>
            </div>
          }
        </div>
        <!-- Defense group -->
        <div class="players-grid" style="margin-top: 1rem;">
          @for (num of [1, 2, 3, 4, 5]; track num) {
            <div
              class="player-item defense"
              draggable="true"
              (dragstart)="onDragStart($event, 'defense-player', num)"
              title="Drag to add defensive player">
              <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <polygon points="20,2 38,38 2,38" fill="transparent" stroke="red" stroke-width="3"/>
                <text x="20" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="red">{{ num }}</text>
              </svg>
            </div>
          }
        </div>
      </div>
    
      <!-- Objects Panel -->
      <div class="panel">
        <h4>Objects</h4>
        <div class="objects-grid">
          <div
            class="object-item"
            draggable="true"
            (dragstart)="onDragStart($event, 'basketball', null)"
            title="Drag to add basketball">
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#ff8c00" stroke-width="2"/>
              <line x1="20" y1="2" x2="20" y2="38" stroke="#ff8c00" stroke-width="1"/>
              <path d="M 8 15 Q 20 20 32 15" fill="none" stroke="#ff8c00" stroke-width="1"/>
              <path d="M 8 25 Q 20 20 32 25" fill="none" stroke="#ff8c00" stroke-width="1"/>
            </svg>
          </div>
          <div
            class="object-item"
            draggable="true"
            (dragstart)="onDragStart($event, 'cone', null)"
            title="Drag to add cone">
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <polygon points="20,5 35,30 5,30" fill="none" stroke="#ffd700" stroke-width="2"/>
              <line x1="5" y1="30" x2="35" y2="30" stroke="#ffd700" stroke-width="2"/>
            </svg>
          </div>
          <div
            class="object-item"
            draggable="true"
            (dragstart)="onDragStart($event, 'chair', null)"
            title="Drag to add chair">
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="20" height="15" fill="none" stroke="#8b4513" stroke-width="2"/>
              <line x1="12" y1="25" x2="12" y2="35" stroke="#8b4513" stroke-width="2"/>
              <line x1="28" y1="25" x2="28" y2="35" stroke="#8b4513" stroke-width="2"/>
            </svg>
          </div>
        </div>
      </div>
    
      <!-- Actions Panel -->
      <div class="panel">
        <h4>Actions</h4>
        <div class="actions-grid">
          @for (action of actions; track action) {
            <button
              (click)="onSelectAction(action)"
              [class.active]="selectedAction === action"
              class="action-btn"
              [title]="'Draw ' + action">
              {{ action }}
            </button>
          }
        </div>
      </div>
    </div>
    `,
    styles: [`
    .toolbox {
      width: 220px;
			position: absolute;
			right:0;
      height: 100%;
      background: #ecf0f1;
      border-left: 1px solid #bdc3c7;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      overflow-y: auto;
    }
    .toolbox h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }
    .panel {
      margin-bottom: 1.5rem;
    }
    .panel h4 {
      margin: 0 0 0.75rem 0;
      color: #34495e;
      font-size: 0.95rem;
    }
    .players-grid, .objects-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    .player-item, .object-item {
      padding: 0.5rem;
      border: 2px solid #bdc3c7;
      border-radius: 4px;
      cursor: grab;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .player-item:active, .object-item:active {
      cursor: grabbing;
    }
    .player-item:hover, .object-item:hover {
      border-color: #3498db;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .player-item svg, .object-item svg {
      width: 100%;
      height: 100%;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    .action-btn {
      background: #3498db;
      color: white;
      border: 2px solid #3498db;
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      text-transform: capitalize;
      transition: all 0.2s;
    }
    .action-btn:hover {
      background: #2980b9;
      border-color: #2980b9;
    }
    .action-btn.active {
      background: #27ae60;
      border-color: #27ae60;
    }
  `],
    standalone: false
})
export class ToolboxComponent implements OnInit {
  actions = ['dribble', 'pass', 'cut', 'screen', 'shot', 'handoff'];
  lineStyles: Array<'straight' | 'curved'> = ['straight', 'curved'];
  anchorCounts: Array<2 | 3 | 4> = [2, 3, 4];
  selectedAction: string | null = null;
  draggedData: any = null;
  selectedLine: PlayLine | null = null;

  constructor(private playService: PlayService, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.playService.selectedLine$.subscribe(line => {
      this.selectedLine = line;
    });
    window.addEventListener('basketball-clear-action', () => {
      this.ngZone.run(() => {
        this.selectedAction = null;
      });
    });
  }

  onDragStart(event: DragEvent, type: string, param: any): void {
    this.draggedData = { type, param };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', JSON.stringify(this.draggedData));
    }
  }

  onSelectAction(action: string): void {
    this.selectedAction = this.selectedAction === action ? null : action;
    window.dispatchEvent(new CustomEvent('basketball-action-selected', { detail: this.selectedAction }));
  }
}