import { Component, OnInit } from '@angular/core';
import { PlayService } from '../../services/play.service';
import { Play, PlayStep } from '../../models/play.model';

@Component({
    selector: 'app-play-steps',
    template: `
    <div class="play-steps">
      <h3>Play Steps</h3>
    
      <div class="steps-controls">
        <button (click)="onNextStep()" title="Add next step">
          <span>➕ Next Step</span>
        </button>
        <button (click)="onDeleteStep()" title="Delete current step">
          <span>🗑 Delete</span>
        </button>
        <button (click)="onCloneStep()" title="Clone current step">
          <span>📋 Clone</span>
        </button>
        <button (click)="onCreateBlankStep()" title="Create blank step">
          <span>📄 Blank</span>
        </button>
      </div>
    
      <div class="steps-list">
        @for (step of steps; track step; let i = $index) {
          <div
            [class.active]="isCurrentStep(i)"
            (click)="selectStep(i)"
            class="step-item"
            [title]="'Step ' + (i + 1)">
            <div class="step-thumbnail">
              <svg viewBox="0 0 500 470" preserveAspectRatio="xMidYMid meet">
                <rect x="0" y="0" width="500" height="470" fill="#d2a679"/>
                <!-- mini court -->
                <text x="250" y="235" text-anchor="middle" font-size="12" fill="white">
                  Step {{ i + 1 }}
                </text>
              </svg>
            </div>
            <span class="step-label">Step {{ i + 1 }}</span>
          </div>
        }
      </div>
    </div>
    `,
    styles: [`
    .play-steps {
      width: 220px;
      height: 100%;
      background: #ecf0f1;
      border-right: 1px solid #bdc3c7;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      overflow-y: auto;
    }
    .play-steps h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }
    .steps-controls {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .steps-controls button {
      background: #3498db;
      color: white;
      border: none;
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: background 0.2s;
    }
    .steps-controls button:hover {
      background: #2980b9;
    }
    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      flex: 1;
      overflow-y: auto;
    }
    .step-item {
      padding: 0.5rem;
      border: 2px solid #bdc3c7;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }
    .step-item:hover {
      border-color: #3498db;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .step-item.active {
      border-color: #e74c3c;
      background: #ffe8e8;
    }
    .step-thumbnail {
      width: 100%;
      height: 80px;
      margin-bottom: 0.5rem;
      border-radius: 2px;
      overflow: hidden;
    }
    .step-thumbnail svg {
      width: 100%;
      height: 100%;
    }
    .step-label {
      font-size: 0.85rem;
      color: #2c3e50;
      display: block;
      text-align: center;
    }
  `],
    standalone: false
})
export class PlayStepsComponent implements OnInit {
  play: Play | null = null;
  steps: PlayStep[] = [];

  constructor(private playService: PlayService) {}

  ngOnInit(): void {
    this.playService.play$.subscribe(play => {
      if (play) {
        this.play = play;
        this.steps = play.steps;
      }
    });
  }

  onNextStep(): void {
    this.playService.nextStep();
  }

  onDeleteStep(): void {
    this.playService.deleteCurrentStep();
  }

  onCloneStep(): void {
    this.playService.cloneCurrentStep();
  }

  onCreateBlankStep(): void {
    this.playService.createBlankStepAfterCurrent();
  }

  selectStep(index: number): void {
    this.playService.setCurrentStep(index);
  }

  isCurrentStep(index: number): boolean {
    return this.play?.currentStepIndex === index;
  }
}