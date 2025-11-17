export interface Player {
  id: string;
  type: 'offense' | 'defense';
  number: number;
  x: number;
  y: number;
  rotation?: number;
}

export interface DrawObject {
  id: string;
  type: 'basketball' | 'cone' | 'chair';
  x: number;
  y: number;
}

export interface LineAnchor {
  x: number;
  y: number;
  attachedTo?: string; // player or object id
}

export interface PlayLine {
  id: string;
  type: 'dribble' | 'pass' | 'cut' | 'screen' | 'shot' | 'handoff';
  startAnchor: LineAnchor;
  endAnchor: LineAnchor;
  style: 'straight' | 'curved';
  anchorPoints: number; // 2, 3, 4
  points?: LineAnchor[]; // intermediate points for curved lines
}

export interface PlayStep {
  id: string;
  players: Player[];
  objects: DrawObject[];
  lines: PlayLine[];
  thumbnail?: string;
}

export interface Play {
  id: string;
  name: string;
  steps: PlayStep[];
  currentStepIndex: number;
}