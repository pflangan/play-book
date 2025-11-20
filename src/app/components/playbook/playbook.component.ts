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
          <g id="lines-layer"></g>
          <g id="objects-layer"></g>
          <g id="players-layer"></g>
          <g id="handles-layer"></g>
        </svg>
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
      display: flex;
      align-items: center;
      justify-content: center;
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
  `],
    standalone: false
})
export class PlaybookComponent implements OnInit {
  currentStep: PlayStep | null = null;
  selectedLine: PlayLine | null = null;
  selectedPlayerId: string | null = null;
  selectedObjectId: string | null = null;
  contextMenuX = 0;
  contextMenuY = 0;
  draggedData: any = null;
  svg: SVGSVGElement | null = null;
  selectedAction: string | null = null;
  lineStart: { x: number; y: number } | null = null;
  linePreview: { x: number; y: number } | null = null;
  draggingAnchor: 'start' | 'end' | null = null;
  lineStartAnchorPlayerId: string | null = null;
  draggingPlayer: Player | null = null;

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
      this.renderStep();
    });

    window.addEventListener('basketball-action-selected', (e: any) => {
      this.selectedAction = e.detail;
      this.lineStart = null;
      this.linePreview = null;
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedLine) {
          this.playService.removeLineFromStep(this.selectedLine.id);
          this.playService.selectLine(null);
          this.selectedLine = null;
        } else if (this.selectedPlayerId) {
          this.playService.removePlayerFromStep(this.selectedPlayerId);
          this.selectedPlayerId = null;
        } else if (this.selectedObjectId) {
          this.playService.removeObjectFromStep(this.selectedObjectId);
          this.selectedObjectId = null;
        }
      }
    });

    setTimeout(() => {
      this.svg = document.getElementById('playbook-canvas') as unknown as SVGSVGElement;
      if (this.svg) {
        this.svg.addEventListener('mousedown', this.onCanvasMouseDown.bind(this));
        this.svg.addEventListener('mousemove', this.onCanvasMouseMove.bind(this));
        this.svg.addEventListener('mouseup', this.onCanvasMouseUp.bind(this));
      }
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
    } else if (this.draggedData.type === 'offense-with-ball-player') {
      this.addPlayer(this.draggedData.param, 'offense-with-ball', pt.x, pt.y);
    } else if (this.draggedData.type === 'defense-player') {
      this.addPlayer(this.draggedData.param, 'defense', pt.x, pt.y);
    } else if (['basketball', 'cone', 'chair'].includes(this.draggedData.type)) {
      this.addObject(this.draggedData.type, pt.x, pt.y);
    }
  }

  onCanvasClick(event: MouseEvent): void {
    const handlesLayer = document.getElementById('handles-layer');
    const target = event.target as SVGElement;
    const isLine = target && target.hasAttribute('data-line-id');
    const isObject = target && target.hasAttribute('data-object-id');
    const isPlayer = target && target.hasAttribute('data-player-id');
    // Deselect symbol and hide handles if clicking anywhere on SVG except a line/object/player
    if (!isLine && !isObject && !isPlayer) {
      this.selectedPlayerId = null;
      this.selectedObjectId = null;
      //this.selectedAction = null;
      this.playService.selectLine(null);
      if (handlesLayer) handlesLayer.style.display = 'none';
    }
    // If clicking on an object or player, clear drawing action, deselect line, and hide handles
    if (isObject || isPlayer) {
      this.selectedAction = null;
      this.playService.selectLine(null);
      if (handlesLayer) handlesLayer.style.display = 'none';
    }
  }

  onCanvasMouseDown(event: MouseEvent): void {
    if (this.selectedAction) {
      const target = event.target as SVGElement;
      const playerId = target?.closest('[data-player-id]')?.getAttribute('data-player-id');
      if (playerId && this.currentStep) {
        const player = this.currentStep.players.find(p => p.id === playerId);
        if (player) {
          // Check if this player already has an attached line
          const hasAttachedLine = this.currentStep.lines.some(line => 
            line.startAnchor.attachedTo === player.id || line.endAnchor.attachedTo === player.id
          );
          if (hasAttachedLine) {
            return; // Don't allow drawing from players with attached lines
          }
          this.lineStart = { x: player.x, y: player.y };
          this.linePreview = { x: player.x, y: player.y };
          this.lineStartAnchorPlayerId = playerId;
          return;
        }
      }
      const svgPoint = this.svg!.createSVGPoint();
      svgPoint.x = event.clientX;
      svgPoint.y = event.clientY;
      const pt = svgPoint.matrixTransform(this.svg!.getScreenCTM()?.inverse());
      this.lineStart = pt;
      this.linePreview = pt;
    } else if (this.selectedLine) {
      // Check if anchor is clicked
      const svgPoint = this.svg!.createSVGPoint();
      svgPoint.x = event.clientX;
      svgPoint.y = event.clientY;
      const pt = svgPoint.matrixTransform(this.svg!.getScreenCTM()?.inverse());
      const start = this.selectedLine.startAnchor;
      const end = this.selectedLine.endAnchor;
      if (this.isNear(pt, start)) {
        this.draggingAnchor = 'start';
      } else if (this.isNear(pt, end)) {
        this.draggingAnchor = 'end';
      }
      // Clear drawing action when selecting a line anchor
      this.selectedAction = null;
    }
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (this.selectedAction && this.lineStart) {
      const svgPoint = this.svg!.createSVGPoint();
      svgPoint.x = event.clientX;
      svgPoint.y = event.clientY;
      const pt = svgPoint.matrixTransform(this.svg!.getScreenCTM()?.inverse());
      this.linePreview = pt;
      this.renderStep();
    } else if (this.draggingAnchor && this.selectedLine) {
      const svgPoint = this.svg!.createSVGPoint();
      svgPoint.x = event.clientX;
      svgPoint.y = event.clientY;
      const pt = svgPoint.matrixTransform(this.svg!.getScreenCTM()?.inverse());
      if (this.draggingAnchor === 'start') {
        this.selectedLine.startAnchor = pt;
      } else {
        this.selectedLine.endAnchor = pt;
      }
      this.playService.updateLineInStep(this.selectedLine);
      this.renderStep();
    }
  }

  onCanvasMouseUp(event: MouseEvent): void {
    if (this.selectedAction && this.lineStart) {
      const svgPoint = this.svg!.createSVGPoint();
      svgPoint.x = event.clientX;
      svgPoint.y = event.clientY;
      const pt = svgPoint.matrixTransform(this.svg!.getScreenCTM()?.inverse());
      // Create line object
      const line: PlayLine = {
        id: `line-${Date.now()}`,
        type: this.selectedAction as any,
        style: 'straight',
        startAnchor: { x: this.lineStart.x, y: this.lineStart.y },
        endAnchor: { x: pt.x, y: pt.y },
        anchorPoints: 2,
        points: []
      };
      // Store line with anchor attachment if applicable
      if (this.lineStartAnchorPlayerId) {
        line.startAnchor.attachedTo = this.lineStartAnchorPlayerId;
      }
      this.playService.addLineToStep(line);
      this.lineStart = null;
      this.linePreview = null;
      this.lineStartAnchorPlayerId = null;
      // Do NOT reset selectedAction, allow multiple lines to be drawn
      this.renderStep();
    } else if (this.draggingAnchor) {
      this.draggingAnchor = null;
    }
  }

  isNear(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2) < 12;
  }

  addPlayer(number: number, type: 'offense' | 'defense' | 'offense-with-ball', x: number, y: number): void {
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
    const handlesLayer = document.getElementById('handles-layer');

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
      // Preview line while drawing
      if (this.selectedAction && this.lineStart && this.linePreview) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        // Anchor circle
        const anchor = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        anchor.setAttribute('cx', String(this.lineStart.x));
        anchor.setAttribute('cy', String(this.lineStart.y));
        anchor.setAttribute('r', '8');
        anchor.setAttribute('fill', '#27ae60');
        anchor.setAttribute('stroke', '#fff');
        anchor.setAttribute('stroke-width', '2');
        g.appendChild(anchor);
        // Preview line
        const previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        previewLine.setAttribute('x1', String(this.lineStart.x));
        previewLine.setAttribute('y1', String(this.lineStart.y));
        previewLine.setAttribute('x2', String(this.linePreview.x));
        previewLine.setAttribute('y2', String(this.linePreview.y));
        previewLine.setAttribute('stroke', '#27ae60');
        previewLine.setAttribute('stroke-width', '3');
        previewLine.setAttribute('stroke-dasharray', '4 2');
        g.appendChild(previewLine);
        linesLayer.appendChild(g);
      }
    }

    if (handlesLayer) {
      handlesLayer.innerHTML = '';
      if (this.selectedLine) {
        handlesLayer.style.display = 'block';
        const start = this.selectedLine.startAnchor;
        const end = this.selectedLine.endAnchor;
        const startAnchor = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        startAnchor.setAttribute('cx', String(start.x));
        startAnchor.setAttribute('cy', String(start.y));
        startAnchor.setAttribute('r', '8');
        startAnchor.setAttribute('fill', '#2980b9');
        startAnchor.setAttribute('stroke', '#fff');
        startAnchor.setAttribute('stroke-width', '2');
        handlesLayer.appendChild(startAnchor);
        const endAnchor = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        endAnchor.setAttribute('cx', String(end.x));
        endAnchor.setAttribute('cy', String(end.y));
        endAnchor.setAttribute('r', '8');
        endAnchor.setAttribute('fill', '#e74c3c');
        endAnchor.setAttribute('stroke', '#fff');
        endAnchor.setAttribute('stroke-width', '2');
        handlesLayer.appendChild(endAnchor);
      } else if (this.draggingPlayer && this.currentStep) {
        // Show only start anchor when dragging a player close to it
        // But skip if the dragging player already has an attached line
        const dragPlayerHasAttachedLine = this.currentStep.lines.some(line => 
          line.startAnchor.attachedTo === this.draggingPlayer!.id || line.endAnchor.attachedTo === this.draggingPlayer!.id
        );
        if (!dragPlayerHasAttachedLine) {
          handlesLayer.style.display = 'block';
          this.currentStep.lines.forEach(line => {
            if (!line.startAnchor.attachedTo && this.isNear({ x: this.draggingPlayer!.x, y: this.draggingPlayer!.y }, line.startAnchor)) {
              const anchor = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              anchor.setAttribute('cx', String(line.startAnchor.x));
              anchor.setAttribute('cy', String(line.startAnchor.y));
              anchor.setAttribute('r', '8');
              anchor.setAttribute('fill', '#2980b9');
              anchor.setAttribute('stroke', '#fff');
              anchor.setAttribute('stroke-width', '2');
              handlesLayer.appendChild(anchor);
            }
          });
        } else {
          handlesLayer.style.display = 'none';
        }
      } else {
        handlesLayer.style.display = 'none';
      }
    }
  }

  renderPlayer(player: Player, container: Element): void {
		console.log('Rendering player:', player);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${player.x} ${player.y})`);
    g.setAttribute('data-player-id', player.id);
    g.style.cursor = 'move';

    // Highlight if selected
    if (this.selectedPlayerId === player.id) {
      const highlight = document.createElementNS('http://www.w3.org/2000/svg', (player.type === 'offense' || player.type === 'offense-with-ball') ? 'circle' : 'polygon');
      if (player.type === 'offense' || player.type === 'offense-with-ball') {
        highlight.setAttribute('cx', '0');
        highlight.setAttribute('cy', '0');
        highlight.setAttribute('r', '15');
      } else {
        highlight.setAttribute('points', '0,-18 18,12 -18,12');
      }
      highlight.setAttribute('fill', 'none');
      highlight.setAttribute('stroke', '#fff');
      highlight.setAttribute('stroke-width', '4');
      g.appendChild(highlight);
    }

    const circle = document.createElementNS('http://www.w3.org/2000/svg', (player.type === 'offense' || player.type === 'offense-with-ball') ? 'circle' : 'polygon');
    if (player.type === 'offense' || player.type === 'offense-with-ball') {
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', '12');
    } else {
      circle.setAttribute('points', '0,-15 15,10 -15,10');
    }
    circle.setAttribute('fill', (player.type === 'offense' || player.type === 'offense-with-ball') ? 'white' : 'white');
    if (player.type === 'offense-with-ball') {
      circle.setAttribute('stroke', 'black');
    } else if (player.type === 'offense') {
      circle.setAttribute('stroke', 'transparent');
    } else {
      circle.setAttribute('stroke', 'red');
    }
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
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectedPlayerId = player.id;
      this.selectedObjectId = null;
      this.selectedAction = null;
      this.playService.selectLine(null);
      const handlesLayer = document.getElementById('handles-layer');
      if (handlesLayer) handlesLayer.style.display = 'none';
      window.dispatchEvent(new CustomEvent('basketball-clear-action'));
    });
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
    // Highlight if selected
    if (this.selectedObjectId === obj.id) {
      let highlight: SVGElement;
      if (obj.type === 'basketball') {
        highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        highlight.setAttribute('cx', '0');
        highlight.setAttribute('cy', '0');
        highlight.setAttribute('r', '11');
      } else if (obj.type === 'cone') {
        highlight = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        highlight.setAttribute('points', '0,-13 10,11 -10,11');
      } else {
        highlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        highlight.setAttribute('x', '-9');
        highlight.setAttribute('y', '-7');
        highlight.setAttribute('width', '18');
        highlight.setAttribute('height', '14');
      }
      highlight.setAttribute('fill', 'none');
      highlight.setAttribute('stroke', '#fff');
      highlight.setAttribute('stroke-width', '4');
      g.insertBefore(highlight, g.firstChild);
    }
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectedObjectId = obj.id;
      this.selectedPlayerId = null;
      this.selectedAction = null;
      this.playService.selectLine(null);
      const handlesLayer = document.getElementById('handles-layer');
      if (handlesLayer) handlesLayer.style.display = 'none';
      window.dispatchEvent(new CustomEvent('basketball-clear-action'));
    });
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
      this.selectedPlayerId = null;
      this.selectedObjectId = null;
      this.selectedAction = null;
      this.playService.selectLine(line);
      window.dispatchEvent(new CustomEvent('basketball-clear-action'));
    });

    g.appendChild(path);
    container.appendChild(g);
  }

  makePlayerDraggable(g: SVGGElement, player: Player): void {
    let dragging = false;
    let offset = { x: 0, y: 0 };

    g.addEventListener('pointerdown', (e) => {
      if (this.selectedAction) return;
      dragging = true;
      this.draggingPlayer = player;
      const pt = this.getSVGCoordinates(e.clientX, e.clientY);
      offset = { x: pt.x - player.x, y: pt.y - player.y };
    });

    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const pt = this.getSVGCoordinates(e.clientX, e.clientY);
      player.x = pt.x - offset.x;
      player.y = pt.y - offset.y;
      // Update anchored lines to follow this player
      if (this.currentStep) {
        this.currentStep.lines.forEach(line => {
          if (line.startAnchor.attachedTo === player.id) {
            line.startAnchor = { x: player.x, y: player.y, attachedTo: player.id };
            this.playService.updateLineInStep(line);
          }
          if (line.endAnchor.attachedTo === player.id) {
            line.endAnchor = { x: player.x, y: player.y, attachedTo: player.id };
            this.playService.updateLineInStep(line);
          }
        });
      }
      this.renderStep();
    });

    window.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      this.draggingPlayer = null;
      // Check if player is close to any unattached line anchors
      if (this.currentStep) {
        // Check if player already has an attachment
        const playerAlreadyAttached = this.currentStep.lines.some(line => 
          line.startAnchor.attachedTo === player.id || line.endAnchor.attachedTo === player.id
        );
        
        if (!playerAlreadyAttached) {
          this.currentStep.lines.forEach(line => {
            // Check start anchor attachment
            if (!line.startAnchor.attachedTo && this.isNear({ x: player.x, y: player.y }, line.startAnchor)) {
              line.startAnchor.attachedTo = player.id;
              this.playService.updateLineInStep(line);
              return; // Only attach to first line found
            }
            // Check end anchor attachment
            if (!line.endAnchor.attachedTo && this.isNear({ x: player.x, y: player.y }, line.endAnchor)) {
              line.endAnchor.attachedTo = player.id;
              this.playService.updateLineInStep(line);
              return; // Only attach to first line found
            }
          });
        }
      }
      this.renderStep();
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