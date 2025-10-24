
import type { GameState, PlayerColor, PreloadedAssets } from '../types';

// --- Browser-compatible helpers ---
const loadImageAsync = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

// -- Constants Start ----------
const Line = (p1: [number, number], p2: [number, number]): [number, number][] => {
    const line: [number, number][] = [];
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    if (x1 === x2) { // Vertical line
        const step = (y1 < y2) ? 1 : -1;
        for (let y = y1; y !== y2 + step; y += step) {
            line.push([x1, y]);
        }
    } else if (y1 === y2) { // Horizontal line
        const step = (x1 < x2) ? 1 : -1;
        for (let x = x1; x !== x2 + step; x += step) {
            line.push([x, y1]);
        }
    }
    return line;
};

const main_path: [number, number][] = [
    ...Line([2, 7], [6, 7]),
    ...Line([7, 6], [7, 1]),
    [8, 1],
    ...Line([9, 1], [9, 6]),
    ...Line([10, 7], [15, 7]),
    [15, 8],
    ...Line([15, 9], [10, 9]),
    ...Line([9, 10], [9, 15]),
    [8, 15],
    ...Line([7, 15], [7, 10]),
    ...Line([6, 9], [1, 9]),
    ...Line([1, 8], [1, 7])
];

const colorData = {
    yellow: {
        start: [2, 7] as [number, number],
        home_column: Line([2, 8], [7, 8]),
        home_base: [[175, 175], [325, 175], [325, 325], [175, 325]]
    },
    green: {
        start: [7, 14] as [number, number],
        home_column: Line([8, 14], [8, 9]),
        home_base: [[175, 1225], [175, 1075], [325, 1075], [325, 1225]]
    },
    red: {
        start: [14, 9] as [number, number],
        home_column: Line([14, 8], [9, 8]),
        home_base: [[1225, 1225], [1075, 1225], [1075, 1075], [1225, 1075]]
    },
    blue: {
        start: [9, 2] as [number, number],
        home_column: Line([8, 2], [8, 7]),
        home_base: [[1225, 175], [1225, 325], [1075, 325], [1075, 175]]
    }
};

const colorPaths: Record<PlayerColor, [number, number][]> = {
    yellow: [],
    green: [],
    red: [],
    blue: []
};

for (const key of Object.keys(colorData)) {
    const colorKey = key as PlayerColor;
    const color = colorData[colorKey];
    const [startX, startY] = color.start;
    const offset = main_path.findIndex(([x, y]) => x === startX && y === startY);
    for (let i = 0; i <= 50; i++) {
        colorPaths[colorKey].push(main_path[(offset + i) % main_path.length]);
    }
    colorPaths[colorKey].push(...color.home_column);
}

const colors: Record<PlayerColor, string> = {
    yellow: "#F5CC01",
    green: "#229746",
    red: "#D43230",
    blue: "#1088D6"
};

let preloadedAssets: PreloadedAssets | null = null;

// -- Preloading Media Start ----------
export async function Preload(): Promise<PreloadedAssets> {
    if (preloadedAssets) return preloadedAssets;

    const Text = async (url: string) => (await fetch(url)).text();

    const preload_promises = {
        count: {
            multi: [
                "https://raw.githubusercontent.com/Mangaka-bot/Ludo/refs/heads/main/MC2.svg",
                "https://raw.githubusercontent.com/Mangaka-bot/Ludo/refs/heads/main/MC3.svg",
                "https://raw.githubusercontent.com/Mangaka-bot/Ludo/refs/heads/main/MC4.svg"
            ].map(Text),
            single: [
                "https://raw.githubusercontent.com/Mangaka-bot/Ludo/refs/heads/main/C2.svg",
                "https://raw.githubusercontent.com/Mangaka-bot/Ludo/refs/heads/main/C3.svg",
                "https://raw.githubusercontent.com/Mangaka-bot/Ludo/refs/heads/main/C4.svg"
            ].map(Text)
        },
        piece: [
            "https://raw.githubusercontent.com/Mangaka-bot/Ludo/refs/heads/main/P1.svg",
            "https://raw.githubusercontent.com/Mangaka-bot/Ludo/refs/heads/main/P2.svg",
            "https://raw.githubusercontent.com/Mangaka-bot/Ludo/refs/heads/main/P3.svg",
            "https://raw.githubusercontent.com/Mangaka-bot/Ludo/refs/heads/main/P4.svg"
        ].map(Text),
        bg: loadImageAsync("https://raw.githubusercontent.com/Mangaka-bot/Ludo/refs/heads/main/BG.svg")
    };

    const [multi, single, piece, bg] = await Promise.all([
        Promise.all(preload_promises.count.multi),
        Promise.all(preload_promises.count.single),
        Promise.all(preload_promises.piece),
        preload_promises.bg
    ]);

    preloadedAssets = {
        count: { multi, single },
        piece,
        bg
    };
    return preloadedAssets;
}
// -- Preloading Media End ----------

// -- Helpers Functions Start ----------
function Pose(color: PlayerColor, progress: number): [number, number] | undefined {
    return colorPaths[color][progress - 1];
}

function Progress(color: PlayerColor, [x, y]: [number, number]): number {
    return colorPaths[color].findIndex(([px, py]) => px === x && py === y) + 1;
}

function Map(game: GameState): [number, number, PlayerColor[]][] {
    const game_pos: Partial<Record<PlayerColor, [number, number][]>> = {};
    for (const color of Object.keys(game) as PlayerColor[]) {
        game_pos[color] = game[color]
            .filter(p => p >= 1 && p <= 57)
            .map(progress => Pose(color, progress)!)
            .filter(p => p);
    }

    const coordsMap = (Object.entries(game_pos) as [PlayerColor, [number, number][]][]).reduce((acc, [color, coordsArray]) => {
        coordsArray.forEach(coord => {
            const key = JSON.stringify(coord);
            acc[key] = (acc[key] || []).concat(color);
        });
        return acc;
    }, {} as Record<string, PlayerColor[]>);

    return Object.entries(coordsMap).map(([key, colors]) => {
        return [...(JSON.parse(key) as [number, number]), colors];
    });
}
// -- Helpers Functions End ----------

// -- UI Display Start ----------
function count_svg_text(count: number, multi: boolean): string | null {
    if (count <= 1 || count > 4 || !preloadedAssets) return null;
    return multi ? preloadedAssets.count.multi[count - 2] : preloadedAssets.count.single[count - 2];
}

async function CountSVG(color: PlayerColor, count: number, multi: boolean): Promise<HTMLImageElement | null> {
    let svg_text = count_svg_text(count, multi);
    if (!svg_text) return null;

    svg_text = svg_text.replace(new RegExp("#FFFF33", "g"), colors[color]);
    
    const svg_blob = new Blob([svg_text], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svg_blob);
    const image = await loadImageAsync(url);
    URL.revokeObjectURL(url);
    return image;
}

function piece_svg_text(pieces: PlayerColor[]): string | null {
    if (!preloadedAssets || pieces.length < 1 || pieces.length > 4) return null;
    return preloadedAssets.piece[pieces.length - 1];
}

async function PieceSVG(pieces: PlayerColor[]): Promise<HTMLImageElement | null> {
    const base_colors = ["#FFFF00", "#00FF00", "#ff0000", "#0000FF"];
    let svg_text = piece_svg_text(pieces);
    if (!svg_text) return null;

    pieces.forEach((piece, i) => {
        svg_text = svg_text.replace(new RegExp(`${base_colors[i]}`, "g"), colors[piece]);
    });

    const svg_blob = new Blob([svg_text], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svg_blob);
    const image = await loadImageAsync(url);
    URL.revokeObjectURL(url);
    return image;
}

export async function Display(color: PlayerColor, game: GameState, r = 1): Promise<string> {
    if (!preloadedAssets) await Preload();
    if (!preloadedAssets) throw new Error("Assets not loaded");

    const width = r * 1500;
    const height = r * 1500;
    const cell = width / 15;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(preloadedAssets.bg, 0, 0, width, height);

    const piecePromises: Promise<void>[] = [];
    const countPromises: Promise<void>[] = [];

    // Draw on-board pieces
    const map = Map(game);
    for (const [x, y, pieceColors] of map) {
        const uniquePieces = [...new Set(pieceColors)];
        
        const piecePromise = async () => {
            const piece_img = await PieceSVG(uniquePieces);
            if (piece_img) ctx.drawImage(piece_img, (x - 1) * cell, (y - 1) * cell, cell, cell);
        };
        piecePromises.push(piecePromise());

        // Prepare count promises to be drawn on top
        const multi = uniquePieces.length > 1;
        const relevantPlayersForCount = uniquePieces.some(c => c === color) ? [color] : uniquePieces;
        
        relevantPlayersForCount.forEach(player => {
            const count = pieceColors.filter(e => e === player).length;
            if (count > 1) {
                const countPromise = async () => {
                    const count_img = await CountSVG(player, count, multi);
                    if (count_img) ctx.drawImage(count_img, (x - 1) * cell, (y - 1) * cell, cell, cell);
                };
                countPromises.push(countPromise());
            }
        });
    }

    // Draw home base pieces
    for (const pColor of Object.keys(game) as PlayerColor[]) {
        const home_base_count = game[pColor].filter(e => e === 0).length;
        for (let i = 0; i < home_base_count; i++) {
            const [bx, by] = colorData[pColor].home_base[i];
            const homePiecePromise = async () => {
                const piece_img = await PieceSVG([pColor]);
                if (piece_img) {
                    ctx.drawImage(piece_img, bx * r, by * r, cell, cell);
                }
            };
            piecePromises.push(homePiecePromise());
        }
    }

    await Promise.all(piecePromises);
    await Promise.all(countPromises); // Draw counts after all pieces are drawn
    
    return canvas.toDataURL();
}
// -- UI Display End ----------


// -- Game Functions Start ----------
const captions = [
    "*Great move!* Your piece advanced *@move step@s*.",
    "*Oops!* You can't move that piece as it would *exceed* the final position. Choose another piece.",
    "*Amazing!* Your piece reached finally to *Home Triangle* and got an *Additional Turn*.",
    "*Congratulations!* You have won the game!",
    "*Nice!* Your piece advanced *@move step@s* and landed on a *Safe Spot*.",
    "*Awesome!* Your piece advanced *@move step@s* and got an *Additional Turn* by sending an opponent's piece back to home base.",
];

export async function Move(color: PlayerColor, game: GameState, pieceIndex: number, move: number): Promise<[string, boolean, boolean, GameState, string]> {
    let newGame = JSON.parse(JSON.stringify(game));
    newGame[color].sort((a: number, b: number) => b - a);

    let caption = captions[0].replace("@move", String(move)).replace("@s", move > 1 ? "s" : "");
    let repeat_turn = false;
    let win = false;

    const safe_pos: [number, number][] = [
        ...Object.values(colorData).map(e => e.start),
        [3, 9], [9, 13], [13, 7], [7, 3]
    ];

    if ((newGame[color][pieceIndex] + move) > 57) {
        const board = await Display(color, game);
        return [captions[1], repeat_turn, win, game, board];
    }
    newGame[color][pieceIndex] += move;

    if (newGame[color][pieceIndex] === 57) {
        caption = captions[2];
        repeat_turn = true;
    }

    if (newGame[color].every((e: number) => e === 57)) {
        caption = captions[3];
        win = true;
    }

    const current_pos = Pose(color, newGame[color][pieceIndex]);
    if (current_pos) {
        const [px, py] = current_pos;
        const isSafe = safe_pos.some(([sx, sy]) => sx === px && sy === py);
        
        if (isSafe) {
            caption = captions[4].replace("@move", String(move)).replace("@s", move > 1 ? "s" : "");
        } else {
            const map = Map(newGame);
            const block = map.find(([x, y]) => x === px && y === py);
            if (block) {
                const pieces = [...new Set(block[2])];
                const opponents = pieces.filter(c => c !== color);

                if (opponents.length > 0) {
                    let opponentSentHome = false;
                    opponents.forEach(opponent => {
                        const target_progress = Progress(opponent, [px, py]);
                        newGame[opponent].forEach((progress: number, i: number) => {
                            if (progress === target_progress) {
                                newGame[opponent][i] = 0;
                                opponentSentHome = true;
                            }
                        });
                    });
                    if (opponentSentHome) {
                      caption = captions[5].replace("@move", String(move)).replace("@s", move > 1 ? "s" : "");
                      repeat_turn = true;
                    }
                }
            }
        }
    }

    const newBoard = await Display(color, newGame);
    return [caption, repeat_turn, win, newGame, newBoard];
}

export async function GetOut(color: PlayerColor, game: GameState): Promise<[string, GameState, string]> {
    let newGame = JSON.parse(JSON.stringify(game));
    const i = newGame[color].findIndex((e: number) => e === 0);
    if (i > -1) {
      newGame[color][i] = 1;
    }

    const newBoard = await Display(color, newGame);
    return ["*Great!* You have moved a piece out of the home base.", newGame, newBoard];
}

const dice_captions = [
    "You rolled a *@dice*.",
    "You rolled a *@dice* but moving any of your pieces would *exceed* the final position. Your turn is skipped.",
    "You rolled a *@dice* but you don't have any pieces on the board. Your turn is skipped.",
    "*Lucky roll!* You rolled a 6 and get an *Additional Turn*!",
];

export function Dice(color: PlayerColor, game: GameState): [number, string, boolean] {
    const dice = Math.floor(Math.random() * 6) + 1;
    let caption = dice_captions[0].replace("@dice", String(dice));
    let skip_turn = false;

    const activePieces = game[color].filter(p => p > 0);
    if (activePieces.length > 0 && activePieces.every(progress => (progress + dice) > 57)) {
        caption = dice_captions[1].replace("@dice", String(dice));
        skip_turn = true;
    }

    if (game[color].every(e => e === 0) && dice !== 6) {
        caption = dice_captions[2].replace("@dice", String(dice));
        skip_turn = true;
    }

    if (dice === 6) {
        caption = dice_captions[3];
    }

    return [dice, caption, skip_turn];
}
// -- Game Functions End ----
