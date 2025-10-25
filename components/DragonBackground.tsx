import React from 'react';
import { Dragon } from './Dragon';

const NUM_DRAGONS = 15;

export const DragonBackground: React.FC = () => {
    const dragons = React.useMemo(() => 
        Array.from({ length: NUM_DRAGONS }).map((_, i) => ({
            id: i,
            style: {
                top: `${Math.random() * 80}%`, // Position from top, avoid very top/bottom
                transform: `scale(${Math.random() * 0.3 + 0.1})`, // Varying sizes for depth
                opacity: Math.random() * 0.4 + 0.1, // Semi-transparent
                animationName: 'fly',
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationDelay: `${Math.random() * -30}s`, // Negative delay to start at different points
                animationDuration: `${Math.random() * 20 + 25}s`, // Varying speeds
            }
        }))
    , []);

    return (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
            {dragons.map(dragon => (
                <Dragon
                    key={dragon.id}
                    className="absolute right-0 will-change-transform"
                    style={dragon.style}
                />
            ))}
        </div>
    );
};
