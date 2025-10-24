
import React, { useState, useEffect, useCallback } from 'react';

interface DiceProps {
  value: number;
  isRolling: boolean;
  onRollEnd: () => void;
}

const Dice: React.FC<DiceProps> = ({ value, isRolling, onRollEnd }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [noTransition, setNoTransition] = useState(false);

  const getFinalRotation = useCallback((val: number) => {
    switch (val) {
      case 1: return { x: 0, y: 0 };
      case 6: return { x: 180, y: 0 };
      case 5: return { x: -90, y: 0 };
      case 2: return { x: 90, y: 0 };
      case 4: return { x: 0, y: -90 };
      case 3: return { x: 0, y: 90 };
      default: return { x: 0, y: 0 };
    }
  }, []);

  useEffect(() => {
    if (isRolling) {
      setNoTransition(false);
      const finalRotation = getFinalRotation(value);
      // A simpler, more controlled rotation instead of a long, random tumble.
      const predictableTumbleX = 360;
      const predictableTumbleY = 360;
      setRotation({ x: predictableTumbleX + finalRotation.x, y: predictableTumbleY + finalRotation.y });
    }
  }, [isRolling, value, getFinalRotation]);

  const handleTransitionEnd = () => {
    if (isRolling) {
      onRollEnd();
      setNoTransition(true);
      setRotation(getFinalRotation(value));
    }
  };

  const faceClasses = "absolute w-full h-full backface-hidden bg-white rounded-lg shadow-md p-3";
  const dot = <div className="w-4 h-4 bg-black rounded-full"></div>;

  return (
    <div className="w-24 h-24 perspective-1000">
      <div
        className="relative w-full h-full preserve-3d"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: noTransition ? 'none' : 'transform 0.9s ease-out',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Front - 1 */}
        <div className={`${faceClasses} flex items-center justify-center`} style={{transform: 'rotateY(0deg) translateZ(3rem)'}}>
          {dot}
        </div>
        
        {/* Back - 6 */}
        <div className={`${faceClasses} flex justify-between`} style={{transform: 'rotateY(180deg) translateZ(3rem)'}}>
          <div className="flex flex-col justify-between">{dot}{dot}{dot}</div>
          <div className="flex flex-col justify-between">{dot}{dot}{dot}</div>
        </div>

        {/* Top - 5 */}
        <div className={`${faceClasses} flex flex-col justify-between`} style={{transform: 'rotateX(90deg) translateZ(3rem)'}}>
          <div className="flex justify-between">{dot}{dot}</div>
          <div className="flex justify-center">{dot}</div>
          <div className="flex justify-between">{dot}{dot}</div>
        </div>

        {/* Bottom - 2 */}
        <div className={`${faceClasses} flex justify-between`} style={{transform: 'rotateX(-90deg) translateZ(3rem)'}}>
          <div className="self-start">{dot}</div>
          <div className="self-end">{dot}</div>
        </div>

        {/* Left - 4 */}
        <div className={`${faceClasses} flex justify-between`} style={{transform: 'rotateY(90deg) translateZ(3rem)'}}>
          <div className="flex flex-col justify-between">{dot}{dot}</div>
          <div className="flex flex-col justify-between">{dot}{dot}</div>
        </div>

        {/* Right - 3 */}
        <div className={`${faceClasses} flex flex-col justify-between items-center`} style={{transform: 'rotateY(-90deg) translateZ(3rem)'}}>
          <div className="self-start">{dot}</div>
          {dot}
          <div className="self-end">{dot}</div>
        </div>
      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
};

export default Dice;
