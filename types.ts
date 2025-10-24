export type PlayerColor = 'yellow' | 'green' | 'red' | 'blue';

export interface GameState {
  yellow: number[];
  green: number[];
  red: number[];
  blue: number[];
}

export type GameStatus = 'loading' | 'rolling' | 'awaiting_move' | 'ai_thinking' | 'ai_making_move' | 'switching_turn' | 'game_over';

export interface PreloadedAssets {
    count: {
        multi: string[];
        single: string[];
    };
    piece: string[];
    bg: HTMLImageElement;
}