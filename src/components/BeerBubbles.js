import React from 'react';
import './BeerBubbles.scss';

export default function BeerBubbles() {
  // Generate 50 bubbles with random properties
  const bubbles = Array.from({ length: 50 }).map((_, i) => {
    const size = Math.random() * 8 + 4; // 4px to 12px diameter
    const left = Math.random() * 100; // 0% to 100% across the screen
    const animDuration = Math.random() * 8 + 5; // 5s to 13s duration
    const animDelay = Math.random() * 10; // 0s to 10s delay start
    // Alternate wobble direction
    const wobbleType = i % 2 === 0 ? 'riseAndWobbleLeft' : 'riseAndWobbleRight';

    return (
      <div 
        key={i} 
        className="beer-bubble"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          animationDuration: `${animDuration}s`,
          animationDelay: `${animDelay}s`,
          animationName: wobbleType
        }}
      />
    );
  });

  return (
    <div className="beer-bubbles-container">
      {bubbles}
    </div>
  );
}
