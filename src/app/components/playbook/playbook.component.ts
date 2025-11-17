import { Component, OnInit } from '@angular/core';
import { PlayService } from '../../services/play.service';
import { PlayStep, Player, DrawObject, PlayLine, LineAnchor } from '../../models/play.model';

@Component({
    selector: 'app-playbook',
    template: `
    <div class="playbook-outer">
      <div class="playbook-container">
        <svg
          id="playbook-canvas"
          viewBox="0 0 500 470"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event)"
          (click)="onCanvasClick($event)"
        >
          <!-- Court background -->
          <rect x="0" y="0" width="500" height="470" fill="#d2a679" stroke="none"/>
          <!-- Outer boundary -->
          <rect x="6" y="6" width="488" height="458" fill="none" stroke="#fff" stroke-width="3"/>
          <!-- Baseline -->
          <line x1="0" y1="470" x2="500" y2="470" stroke="#fff" stroke-width="3"/>
          <!-- Sidelines -->
          <line x1="0" y1="0" x2="0" y2="470" stroke="#fff" stroke-width="3"/>
          <line x1="500" y1="0" x2="500" y2="470" stroke="#fff" stroke-width="3"/>
          <!-- Three-point line -->
          <path d="M50,380 A190,185 0 0,1 450,420" fill="none" stroke="#fff" stroke-width="3"/>
          <!-- Three-point straight lines -->
          <line x1="50" y1="470" x2="50" y2="380" stroke="#fff" stroke-width="3"/>
          <line x1="450" y1="470" x2="450" y2="380" stroke="#fff" stroke-width="3"/>
          <!-- Free throw lane -->
          <rect x="187" y="280" width="126" height="190" fill="none" stroke="#fff" stroke-width="3"/>
          <!-- Free throw circle (top) -->
          <path d="M187,280 A63,63 0 0,1 313,280" fill="none" stroke="#fff" stroke-width="3"/>
          <!-- Free throw circle (bottom, dashed) -->
          <path d="M187,280 A63,63 0 0,0 313,280" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 6"/>
          <!-- Backboard -->
          <line x1="217" y1="440" x2="283" y2="440" stroke="#fff" stroke-width="4"/>
          <!-- Rim -->
          <circle cx="250" cy="422" r="9" fill="none" stroke="#fff" stroke-width="2"/>
          <!-- Restricted area arc -->
          <path d="M218,428 A32,32 0 0,1 282,428" fill="none" stroke="#fff" stroke-width="2"/>
          <!-- Center circle -->
          <circle cx="250" cy="0" r="60" fill="none" stroke="#fff" stroke-width="3"/>
          <!-- Center circle restricted (dashed) -->
          <circle cx="250" cy="0" r="60" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 6"/>
          <!-- Dynamic layers -->
          <g id="objects-layer"></g>
          <g id="players-layer"></g>
          <g id="lines-layer"></g>
          <g id="handles-layer"></g>
        </svg>
        <!-- Context menu for lines -->
        <ng-container *ngIf="selectedLine">
          <div
            class="context-menu"
            [style.left.px]="contextMenuX"
            [style.top.px]="contextMenuY">
            <div class="context-section">
              <label>Style</label>
              <ng-container *ngFor="let style of ['straight', 'curved']">
                <button
                  (click)="updateLineStyle()"
                  [class.active]="selectedLine.style === style">
                  {{ style }}
                </button>
              </ng-container>
            </div>
            <div class="context-section">
              <label>Anchor Points</label>
              <ng-container *ngFor="let count of [2, 3, 4]">
                <button
                  (click)="updateLineAnchors(count)"
                  [class.active]="selectedLine.anchorPoints === count">
                  {{ count }}
                </button>
              </ng-container>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
    `,
    styles: [`
    .playbook-outer {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      position: relative;
      background: #ecf0f1;
    }
    .playbook-container {
      width: 500px;
      height: 470px;
      position: relative;
      background: #ecf0f1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: visible;
    }
    #playbook-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 500px;
      height: 470px;
      background: transparent;
      cursor: crosshair;
      display: block;
      z-index: 1;
    }
    .context-menu {
      position: fixed;
      background: white;
      border: 2px solid #2c3e50;
      border-radius: 4px;
      padding: 1rem;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    }
    .context-section {
      margin-bottom: 1rem;
    }
    .context-section:last-child {
      margin-bottom: 0;
    }
    .context-section label {
      display: block;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .context-section button {
      display: inline-block;
      background: #ecf0f1;
      border: 2px solid #bdc3c7;
      padding: 0.25rem 0.5rem;
      margin-right: 0.5rem;
      border-radius: 3px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .context-section button:hover {
      border-color: #3498db;
    }
    .context-section button.active {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }
  `],
    standalone: false
})
export class PlaybookComponent implements OnInit {
  currentStep: PlayStep | null = null;
  selectedLine: PlayLine | null = null;
  contextMenuX = 0;
  contextMenuY = 0;
  draggedData: any = null;
  svg: SVGSVGElement | null = null;

  constructor(private playService: PlayService) {}

  ngOnInit(): void {
    this.playService.currentStep$.subscribe(step => {
      this.currentStep = step;
      if (step) {
        this.renderStep();
      }
    });

    this.playService.selectedLine$.subscribe(line => {
      this.selectedLine = line;
    });

    setTimeout(() => {
      this.svg = document.getElementById('playbook-canvas') as unknown as SVGSVGElement;
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (!this.svg) return;

    const data = event.dataTransfer?.getData('text/plain');
    if (!data) return;

    this.draggedData = JSON.parse(data);

    // Use SVG's coordinate system regardless of position
    const svgPoint = this.svg.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const pt = svgPoint.matrixTransform(this.svg.getScreenCTM()?.inverse());

    if (this.draggedData.type === 'offense-player') {
      this.addPlayer(this.draggedData.param, 'offense', pt.x, pt.y);
    } else if (this.draggedData.type === 'defense-player') {
      this.addPlayer(this.draggedData.param, 'defense', pt.x, pt.y);
    } else if (['basketball', 'cone', 'chair'].includes(this.draggedData.type)) {
      this.addObject(this.draggedData.type, pt.x, pt.y);
    }
  }

  onCanvasClick(event: MouseEvent): void {
    // Deselect line if clicking on empty canvas
    if (event.target === this.svg) {
      this.playService.selectLine(null);
    }
  }

  addPlayer(number: number, type: 'offense' | 'defense', x: number, y: number): void {
    const player: Player = {
      id: `player-${Date.now()}`,
      type,
      number,
      x,
      y,
      rotation: 0
    };
    this.playService.addPlayerToStep(player);
  }

  addObject(type: 'basketball' | 'cone' | 'chair', x: number, y: number): void {
    const obj: DrawObject = {
      id: `object-${Date.now()}`,
      type,
      x,
      y
    };
    this.playService.addObjectToStep(obj);
  }

  renderStep(): void {
    if (!this.currentStep) return;
    
    const playersLayer = document.getElementById('players-layer');
    const objectsLayer = document.getElementById('objects-layer');
    const linesLayer = document.getElementById('lines-layer');

    if (playersLayer) {
      playersLayer.innerHTML = '';
      this.currentStep.players.forEach(p => this.renderPlayer(p, playersLayer));
    }

    if (objectsLayer) {
      objectsLayer.innerHTML = '';
      this.currentStep.objects.forEach(o => this.renderObject(o, objectsLayer));
    }

    if (linesLayer) {
      linesLayer.innerHTML = '';
      this.currentStep.lines.forEach(l => this.renderLine(l, linesLayer));
    }
  }

  renderPlayer(player: Player, container: Element): void {
		console.log('Rendering player:', player);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${player.x} ${player.y})`);
    g.setAttribute('data-player-id', player.id);
    g.style.cursor = 'move';

    const circle = document.createElementNS('http://www.w3.org/2000/svg', player.type === 'offense' ? 'circle' : 'polygon');

		if (player.type === 'offense') {
			circle.setAttribute('cx', '0');
			circle.setAttribute('cy', '0');
			circle.setAttribute('r', '12');
		} else {
			circle.setAttribute('points', '0,-15 15,10 -15,10');
		}
    circle.setAttribute('fill', player.type === 'offense' ? 'rgba(255,255,255,0.1)' : 'rgba(255,0,0,0.1)');
    circle.setAttribute('stroke', player.type === 'offense' ? 'black' : 'red');
    circle.setAttribute('stroke-width', '2');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '5');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', player.type === 'offense' ? 'black' : 'red');
    text.textContent = String(player.number);

    g.appendChild(circle);
    g.appendChild(text);

    // Make draggable
    this.makePlayerDraggable(g, player);

    container.appendChild(g);
  }

  renderObject(obj: DrawObject, container: Element): void {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${obj.x} ${obj.y})`);
    g.setAttribute('data-object-id', obj.id);
    g.style.cursor = 'move';

    let svg = '';
    if (obj.type === 'basketball') {
      svg = `
        <circle cx="0" cy="0" r="8" fill="none" stroke="#ff8c00" stroke-width="1"/>
        <line x1="0" y1="-8" x2="0" y2="8" stroke="#ff8c00" stroke-width="0.5"/>
        <path d="M -6 -3 Q 0 -2 6 -3" fill="none" stroke="#ff8c00" stroke-width="0.5"/>
        <path d="M -6 3 Q 0 2 6 3" fill="none" stroke="#ff8c00" stroke-width="0.5"/>
      `;
    } else if (obj.type === 'cone') {
      svg = `<polygon points="0,-10 8,8 -8,8" fill="none" stroke="#ffd700" stroke-width="1.5"/>`;
    } else if (obj.type === 'chair') {
      svg = `
        <rect x="-6" y="-4" width="12" height="8" fill="none" stroke="#8b4513" stroke-width="1.5"/>
        <line x1="-5" y1="4" x2="-5" y2="10" stroke="#8b4513" stroke-width="1.5"/>
        <line x1="5" y1="4" x2="5" y2="10" stroke="#8b4513" stroke-width="1.5"/>
      `;
    }

    g.innerHTML = svg;
    this.makeObjectDraggable(g, obj);
    container.appendChild(g);
  }

  renderLine(line: PlayLine, container: Element): void {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-line-id', line.id);
    g.style.cursor = 'pointer';

    // Draw line path
    let pathD = '';
    if (line.style === 'straight') {
      pathD = `M ${line.startAnchor.x} ${line.startAnchor.y} L ${line.endAnchor.x} ${line.endAnchor.y}`;
    } else {
      // Curved line with intermediate points
      pathD = `M ${line.startAnchor.x} ${line.startAnchor.y}`;
      if (line.points) {
        line.points.forEach(p => {
          pathD += ` Q ${p.x} ${p.y}`;
        });
      }
      pathD += ` ${line.endAnchor.x} ${line.endAnchor.y}`;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#ff7b00');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');

    if (line.type === 'pass' || line.type === 'shot') {
      path.setAttribute('stroke-dasharray', '5 3');
    }

    path.addEventListener('click', (e) => {
      e.stopPropagation();
      this.contextMenuX = e.clientX;
      this.contextMenuY = e.clientY;
      this.playService.selectLine(line);
    });

    g.appendChild(path);
    container.appendChild(g);
  }

  makePlayerDraggable(g: SVGGElement, player: Player): void {
    let dragging = false;
    let offset = { x: 0, y: 0 };

    g.addEventListener('pointerdown', (e) => {
      dragging = true;
      const pt = this.getSVGCoordinates(e.clientX, e.clientY);
      offset = { x: pt.x - player.x, y: pt.y - player.y };
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const pt = this.getSVGCoordinates(e.clientX, e.clientY);
      player.x = pt.x - offset.x;
      player.y = pt.y - offset.y;
      this.renderStep();
    });

    window.addEventListener('pointerup', () => {
      dragging = false;
    });
  }

  makeObjectDraggable(g: SVGGElement, obj: DrawObject): void {
    let dragging = false;
    let offset = { x: 0, y: 0 };

    g.addEventListener('pointerdown', (e) => {
      dragging = true;
      const pt = this.getSVGCoordinates(e.clientX, e.clientY);
      offset = { x: pt.x - obj.x, y: pt.y - obj.y };
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const pt = this.getSVGCoordinates(e.clientX, e.clientY);
      obj.x = pt.x - offset.x;
      obj.y = pt.y - offset.y;
      this.renderStep();
    });

    window.addEventListener('pointerup', () => {
      dragging = false;
    });
  }

  getSVGCoordinates(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.svg) return { x: 0, y: 0 };
    const rect = this.svg.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return this.screenToSVG(x, y);
  }

  screenToSVG(x: number, y: number): { x: number; y: number } {
    if (!this.svg) return { x: 0, y: 0 };
    const pt = this.svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    const transformed = pt.matrixTransform(this.svg.getScreenCTM()?.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  updateLineStyle(): void {
    if (this.selectedLine) {
			if (this.selectedLine.style === 'straight') {
				this.selectedLine.style = 'curved';
			} else {
				this.selectedLine.style = 'straight';
			}
      this.playService.updateLineInStep(this.selectedLine);
      this.renderStep();
    }
  }

  updateLineAnchors(count: number): void {
    if (this.selectedLine) {
      this.selectedLine.anchorPoints = count;
      if (!this.selectedLine.points) {
        this.selectedLine.points = [];
      }
      // Generate intermediate points based on count
      const dx = (this.selectedLine.endAnchor.x - this.selectedLine.startAnchor.x) / count;
      const dy = (this.selectedLine.endAnchor.y - this.selectedLine.startAnchor.y) / count;
      this.selectedLine.points = [];
      for (let i = 1; i < count; i++) {
        this.selectedLine.points.push({
          x: this.selectedLine.startAnchor.x + dx * i,
          y: this.selectedLine.startAnchor.y + dy * i
        });
      }
      this.playService.updateLineInStep(this.selectedLine);
      this.renderStep();
    }
  }
}