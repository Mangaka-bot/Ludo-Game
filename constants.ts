
import type { PlayerColor } from './types';

export const PLAYER_COLORS: PlayerColor[] = ['yellow', 'green', 'red', 'blue'];

export const UI_COLORS: Record<PlayerColor, { bg: string; text: string; border: string; accent: string; gradientFrom: string; gradientTo: string; }> = {
    yellow: {
        bg: 'bg-yellow-500',
        text: 'text-yellow-300',
        border: 'border-yellow-400',
        accent: 'bg-yellow-400',
        gradientFrom: 'from-yellow-400',
        gradientTo: 'to-orange-500',
    },
    green: {
        bg: 'bg-green-500',
        text: 'text-green-300',
        border: 'border-green-400',
        accent: 'bg-green-400',
        gradientFrom: 'from-green-400',
        gradientTo: 'to-emerald-500',
    },
    red: {
        bg: 'bg-red-500',
        text: 'text-red-300',
        border: 'border-red-400',
        accent: 'bg-red-400',
        gradientFrom: 'from-red-500',
        gradientTo: 'to-rose-600',
    },
    blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-300',
        border: 'border-blue-400',
        accent: 'bg-blue-400',
        gradientFrom: 'from-blue-400',
        gradientTo: 'to-indigo-500',
    },
};

export const PLAYER_NAMES: Record<PlayerColor, string> = {
    yellow: 'Player 1 (You)',
    green: 'Player 2 (AI)',
    red: 'Player 3 (AI)',
    blue: 'Player 4 (AI)',
};