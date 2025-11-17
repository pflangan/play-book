import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Play, PlayStep, Player, DrawObject, PlayLine } from '../models/play.model';

@Injectable({
  providedIn: 'root'
})
export class PlayService {
  private playSubject = new BehaviorSubject<Play | null>(null);
  public play$ = this.playSubject.asObservable();

  private currentStepSubject = new BehaviorSubject<PlayStep | null>(null);
  public currentStep$ = this.currentStepSubject.asObservable();

  private selectedLineSubject = new BehaviorSubject<PlayLine | null>(null);
  public selectedLine$ = this.selectedLineSubject.asObservable();

  constructor() {
    this.initializeNewPlay();
  }

  private initializeNewPlay(): void {
    const newPlay: Play = {
      id: this.generateId(),
      name: 'New Play',
      steps: [this.createBlankStep()],
      currentStepIndex: 0
    };
    this.playSubject.next(newPlay);
    this.currentStepSubject.next(newPlay.steps[0]);
  }

  private createBlankStep(): PlayStep {
    return {
      id: this.generateId(),
      players: [],
      objects: [],
      lines: []
    };
  }

  getCurrentStep(): PlayStep | null {
    return this.currentStepSubject.value;
  }

  addPlayerToStep(player: Player): void {
    const step = this.currentStepSubject.value;
    if (step) {
      step.players.push(player);
      this.currentStepSubject.next({ ...step });
    }
  }

  addObjectToStep(obj: DrawObject): void {
    const step = this.currentStepSubject.value;
    if (step) {
      step.objects.push(obj);
      this.currentStepSubject.next({ ...step });
    }
  }

  addLineToStep(line: PlayLine): void {
    const step = this.currentStepSubject.value;
    if (step) {
      step.lines.push(line);
      this.currentStepSubject.next({ ...step });
    }
  }

  updateLineInStep(line: PlayLine): void {
    const step = this.currentStepSubject.value;
    if (step) {
      const index = step.lines.findIndex(l => l.id === line.id);
      if (index > -1) {
        step.lines[index] = line;
        this.currentStepSubject.next({ ...step });
      }
    }
  }

  removeLineFromStep(lineId: string): void {
    const step = this.currentStepSubject.value;
    if (step) {
      step.lines = step.lines.filter(l => l.id !== lineId);
      this.currentStepSubject.next({ ...step });
    }
  }

  selectLine(line: PlayLine | null): void {
    this.selectedLineSubject.next(line);
  }

  nextStep(): void {
    const play = this.playSubject.value;
    if (!play) return;

    const currentStep = play.steps[play.currentStepIndex];
    if (!currentStep) return;

    // Create new step with copy of current players and objects
    const newStep: PlayStep = {
      id: this.generateId(),
      players: JSON.parse(JSON.stringify(currentStep.players)),
      objects: JSON.parse(JSON.stringify(currentStep.objects)),
      lines: []
    };

    // Insert after current step
    play.steps.splice(play.currentStepIndex + 1, 0, newStep);
    play.currentStepIndex += 1;
    this.playSubject.next({ ...play });
    this.currentStepSubject.next(newStep);
  }

  deleteCurrentStep(): void {
    const play = this.playSubject.value;
    if (!play || play.steps.length === 1) return;

    play.steps.splice(play.currentStepIndex, 1);
    if (play.currentStepIndex >= play.steps.length) {
      play.currentStepIndex = play.steps.length - 1;
    }
    this.playSubject.next({ ...play });
    this.currentStepSubject.next(play.steps[play.currentStepIndex]);
  }

  cloneCurrentStep(): void {
    const play = this.playSubject.value;
    if (!play) return;

    const currentStep = play.steps[play.currentStepIndex];
    if (!currentStep) return;

    const clonedStep: PlayStep = {
      id: this.generateId(),
      players: JSON.parse(JSON.stringify(currentStep.players)),
      objects: JSON.parse(JSON.stringify(currentStep.objects)),
      lines: JSON.parse(JSON.stringify(currentStep.lines))
    };

    play.steps.splice(play.currentStepIndex + 1, 0, clonedStep);
    play.currentStepIndex += 1;
    this.playSubject.next({ ...play });
    this.currentStepSubject.next(clonedStep);
  }

  createBlankStepAfterCurrent(): void {
    const play = this.playSubject.value;
    if (!play) return;

    const blankStep = this.createBlankStep();
    play.steps.splice(play.currentStepIndex + 1, 0, blankStep);
    play.currentStepIndex += 1;
    this.playSubject.next({ ...play });
    this.currentStepSubject.next(blankStep);
  }

  setCurrentStep(index: number): void {
    const play = this.playSubject.value;
    if (!play || index < 0 || index >= play.steps.length) return;

    play.currentStepIndex = index;
    this.playSubject.next({ ...play });
    this.currentStepSubject.next(play.steps[index]);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}