
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { GameState, PlayerColor, GameStatus } from './types';
import { PLAYER_COLORS, UI_COLORS, PLAYER_NAMES } from './constants';
import { Preload, Display, Dice as DiceLogic, Move, GetOut } from './services/ludoLogic';
import DiceComponent from './components/Dice';

const initialGameState: GameState = {
    yellow: [0, 0, 0, 0],
    green: [0, 0, 0, 0],
    red: [0, 0, 0, 0],
    blue: [0, 0, 0, 0],
};

// Brutalist GameBoard
const GameBoard: React.FC<{
    boardImage: string;
    status: GameStatus;
}> = ({ boardImage, status }) => (
    <div className="p-1.5 bg-black">
        <div className="relative aspect-square w-full bg-neutral-300">
            {boardImage && (
                <img
                    src={boardImage}
                    alt="Ludo Board"
                    className="w-full h-full object-contain"
                />
            )}
            {status === 'loading' && (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                    <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    </div>
);

// Brutalist PlayerIndicators with correct order
const PlayerIndicators: React.FC<{ activePlayer: PlayerColor }> = ({ activePlayer }) => {
    const playerOrder: PlayerColor[] = ['yellow', 'blue', 'green', 'red'];
    return (
        <div className="grid grid-cols-2 gap-2 md:gap-4">
            {playerOrder.map(color => {
                const isActive = color === activePlayer;
                const colors = UI_COLORS[color];
                return (
                     <div key={color} className={`p-2 md:p-4 border-2 border-black ${isActive ? `${colors.bg}` : 'bg-white'}`}>
                         <div className="flex items-center justify-between">
                             <h3 className={`text-sm md:text-base font-bold ${isActive ? 'text-white' : 'text-black'}`}>{PLAYER_NAMES[color]}</h3>
                             {isActive && <div className="w-3 h-3 bg-white animate-pulse"></div>}
                         </div>
                     </div>
                );
            })}
        </div>
    );
};


const App: React.FC = () => {
    const [game, setGame] = useState<GameState>(initialGameState);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [status, setStatus] = useState<GameStatus>('loading');
    const [boardImage, setBoardImage] = useState<string>('');
    const [diceValue, setDiceValue] = useState(1);
    const [isDiceRolling, setIsDiceRolling] = useState(false);
    const [consecutiveSixes, setConsecutiveSixes] = useState(0);
    const [winner, setWinner] = useState<PlayerColor | null>(null);
    const [skipTurn, setSkipTurn] = useState(false);
    const [rolledValueDisplay, setRolledValueDisplay] = useState<number | null>(null);

    const currentPlayer = useMemo(() => PLAYER_COLORS[currentPlayerIndex], [currentPlayerIndex]);

    const advanceTurn = useCallback(() => {
        setConsecutiveSixes(0);
        setStatus('switching_turn');
    }, []);
    
    useEffect(() => {
        const initGame = async () => {
            await Preload();
            const initialBoard = await Display(PLAYER_COLORS[0], initialGameState);
            setBoardImage(initialBoard);
            setStatus('rolling');
        };
        initGame();
    }, []);

    const handleRollDice = useCallback(() => {
        if (status !== 'rolling' || winner || isDiceRolling) return;

        const [diceResult, caption, shouldSkip] = DiceLogic(currentPlayer, game);
        setDiceValue(diceResult);
        setSkipTurn(shouldSkip);
        setIsDiceRolling(true); 

    }, [status, winner, isDiceRolling, currentPlayer, game]);


    const handleMove = useCallback(async (pieceIndex: number | 'get_out') => {
        if (status !== 'awaiting_move' || winner) return;
        setStatus('loading');

        let caption: string, repeatTurn: boolean, isWin: boolean, newGame: GameState, newBoard: string;

        if (pieceIndex === 'get_out') {
            [caption, newGame, newBoard] = await GetOut(currentPlayer, game);
            repeatTurn = true;
            isWin = false;
        } else {
            [caption, repeatTurn, isWin, newGame, newBoard] = await Move(currentPlayer, game, pieceIndex, diceValue);
        }

        setGame(newGame);
        setBoardImage(newBoard);

        if (isWin) {
            setWinner(currentPlayer);
            setStatus('game_over');
            return;
        }

        if (diceValue === 6 || repeatTurn) {
            setStatus('rolling');
            setConsecutiveSixes(c => diceValue === 6 ? c : 0);
        } else {
            advanceTurn();
        }
    }, [status, winner, currentPlayer, game, diceValue, advanceTurn]);
    
    const executeAIMove = useCallback(async (currentDiceValue: number) => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to simulate thinking
        
        const localGame = game;
        const localCurrentPlayer = currentPlayer;
        
        let caption: string, repeatTurn: boolean, isWin: boolean, newGame: GameState, newBoard: string;

        const canGetOut = currentDiceValue === 6 && localGame[localCurrentPlayer].some(p => p === 0);
        const movablePieces = localGame[localCurrentPlayer]
            .map((progress, index) => ({ progress, index }))
            .filter(p => p.progress > 0 && p.progress + currentDiceValue <= 57)
            .sort((a,b) => b.progress - a.progress);
        
        if (canGetOut) {
            [caption, newGame, newBoard] = await GetOut(localCurrentPlayer, localGame);
            repeatTurn = true;
            isWin = false;
        } else if (movablePieces.length > 0) {
            const sortedProgress = [...localGame[localCurrentPlayer]].sort((a,b) => b - a);
            const pieceIndexInSortedArray = sortedProgress.indexOf(movablePieces[0].progress);
            [caption, repeatTurn, isWin, newGame, newBoard] = await Move(localCurrentPlayer, localGame, pieceIndexInSortedArray, currentDiceValue);
        } else {
            advanceTurn();
            return;
        }

        setGame(newGame);
        setBoardImage(newBoard);

        if (isWin) {
            setWinner(localCurrentPlayer);
            setStatus('game_over');
            return;
        }
        
        const getsAnotherTurn = currentDiceValue === 6 || repeatTurn;
        if (getsAnotherTurn) {
            const newSixesCount = currentDiceValue === 6 ? consecutiveSixes + 1 : 0;
            if (newSixesCount === 3) {
                 setTimeout(advanceTurn, 1000);
                 return;
            }
            setConsecutiveSixes(newSixesCount);
            setStatus('ai_thinking');
        } else {
            advanceTurn();
        }
    }, [game, currentPlayer, advanceTurn, consecutiveSixes]);
    
    const validMoves = useMemo(() => {
        if (status !== 'awaiting_move') return [];
        
        const moves: { pieceIndex: number | 'get_out', text: string }[] = [];
        const sortedPieces = [...game[currentPlayer]].map((progress, originalIndex) => ({ progress, originalIndex })).sort((a, b) => b.progress - a.progress);

        if (diceValue === 6 && game[currentPlayer].some(p => p === 0)) {
            moves.push({ pieceIndex: 'get_out', text: "Get a Piece Out" });
        }
        
        sortedPieces.forEach(({ progress }, sortedIndex) => {
            if (progress > 0 && progress + diceValue <= 57) {
                moves.push({ pieceIndex: sortedIndex, text: `Move Piece (from pos ${progress})` });
            }
        });
        
        return moves;
    }, [status, game, currentPlayer, diceValue]);

    const handleRollEnd = useCallback(() => {
        setIsDiceRolling(false);
        
        if (diceValue === 6) {
            const newSixesCount = consecutiveSixes + 1;
            setConsecutiveSixes(newSixesCount);
            if (newSixesCount === 3) {
                setTimeout(advanceTurn, 1000);
                return;
            }
        } else {
            setConsecutiveSixes(0);
        }
        
        if (skipTurn) {
            setTimeout(advanceTurn, 1000);
        } else {
             if (currentPlayer === 'yellow') {
                setStatus('awaiting_move');
            } else {
                setRolledValueDisplay(diceValue);
                setTimeout(() => {
                    setRolledValueDisplay(null);
                    setStatus('ai_making_move');
                    executeAIMove(diceValue);
                }, 1200);
            }
        }
    }, [currentPlayer, diceValue, consecutiveSixes, advanceTurn, skipTurn, executeAIMove]);


    // Turn Switching & AI thinking trigger
    useEffect(() => {
        if (status === 'switching_turn') {
            const timer = setTimeout(async () => {
                const nextPlayerIndex = (currentPlayerIndex + 1) % PLAYER_COLORS.length;
                const newBoard = await Display(PLAYER_COLORS[nextPlayerIndex], game, 1);
                setBoardImage(newBoard);
                setCurrentPlayerIndex(nextPlayerIndex);
                setStatus(nextPlayerIndex === 0 ? 'rolling' : 'ai_thinking');
            }, 750);
            return () => clearTimeout(timer);
        }

        if (status === 'ai_thinking' && currentPlayer !== 'yellow' && !winner) {
            setTimeout(() => {
                const [diceResult, rollCaption, shouldSkip] = DiceLogic(currentPlayer, game);
                setDiceValue(diceResult);
                setSkipTurn(shouldSkip);
                setIsDiceRolling(true);
            }, 500);
        }
    }, [status, currentPlayer, currentPlayerIndex, game, winner]);
    

    return (
        <div className="min-h-screen text-black font-sans p-2 md:p-4 flex flex-col md:flex-row gap-4 items-start justify-center">
            <main className="w-full md:w-auto md:flex-1 max-w-3xl mx-auto md:mx-0">
                <GameBoard boardImage={boardImage} status={status} />
            </main>
            <aside className="w-full md:w-96 flex-shrink-0 flex flex-col gap-3">
                <h1 className="text-3xl md:text-4xl font-bold text-center">Ludo Challenge</h1>
                <PlayerIndicators activePlayer={currentPlayer} />
                
                <div className="bg-white border-2 border-black p-3 flex flex-col items-center gap-3">
                     <h2 className="text-xl font-bold">
                        {status === 'switching_turn' 
                            ? 'Switching Turn...'
                            : (currentPlayer === 'yellow' ? 'Your Turn' : `${PLAYER_NAMES[currentPlayer]}'s Turn`)}
                     </h2>
                     <div className="h-24 md:h-28 flex items-center justify-center relative">
                        <div className="transform scale-75 md:scale-100">
                            <DiceComponent value={diceValue} isRolling={isDiceRolling} onRollEnd={handleRollEnd}/>
                        </div>
                        {rolledValueDisplay && (
                            <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center z-10 pointer-events-none animate-pop-in">
                                <span 
                                    className="text-6xl md:text-8xl font-black text-white" 
                                    style={{ WebkitTextStroke: '4px black', textShadow: '4px 4px 0 black' }}
                                >
                                    {rolledValueDisplay}
                                </span>
                            </div>
                        )}
                     </div>
                     {winner ? (
                        <div className="text-center p-4 bg-green-400 border-2 border-black w-full">
                            <h2 className="text-2xl font-bold">{PLAYER_NAMES[winner]} Wins!</h2>
                            <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-white text-black font-bold border-2 border-black hover:bg-neutral-200">Play Again</button>
                        </div>
                     ) : (
                        <>
                         {(status === 'rolling' && currentPlayer === 'yellow') && (
                             <button onClick={handleRollDice} className={`w-full px-4 md:px-8 py-2 ${UI_COLORS[currentPlayer].bg} text-white font-bold border-2 border-black disabled:bg-neutral-400 disabled:cursor-not-allowed`} disabled={isDiceRolling}>
                                 {isDiceRolling ? 'Rolling...' : 'Roll Dice'}
                             </button>
                         )}
                         {status === 'awaiting_move' && currentPlayer === 'yellow' && (
                            <div className="w-full flex flex-col items-center gap-2">
                                <p className="font-bold text-lg">You rolled a {diceValue}. Select a move:</p>
                                {validMoves.length > 0 ? (
                                    validMoves.map((move, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleMove(move.pieceIndex)}
                                            className={`w-full px-4 py-2 ${UI_COLORS[currentPlayer].bg} text-white font-bold border-2 border-black hover:opacity-90`}
                                        >
                                            {move.text}
                                        </button>
                                    ))
                                ) : (
                                    <p>No valid moves available.</p>
                                )}
                            </div>
                         )}
                        </>
                     )}
                </div>
            </aside>
            <style>{`
                @keyframes pop-in {
                    0% { transform: scale(0.5); opacity: 0; }
                    70% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-pop-in {
                    animation: pop-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default App;
