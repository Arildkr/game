// Kruseduller for Squiggle Story
// Forhåndsdefinerte former som spillere bygger videre på

const squiggles = [
  {
    id: 'wave',
    name: 'Bølge',
    points: [
      { x: 50, y: 150 },
      { x: 100, y: 100 },
      { x: 150, y: 150 },
      { x: 200, y: 100 },
      { x: 250, y: 150 },
      { x: 300, y: 100 },
      { x: 350, y: 150 }
    ],
    color: '#000000'
  },
  {
    id: 'zigzag',
    name: 'Sikk-sakk',
    points: [
      { x: 50, y: 200 },
      { x: 100, y: 100 },
      { x: 150, y: 200 },
      { x: 200, y: 100 },
      { x: 250, y: 200 },
      { x: 300, y: 100 },
      { x: 350, y: 200 }
    ],
    color: '#000000'
  },
  {
    id: 'spiral',
    name: 'Spiral',
    points: (() => {
      const points = [];
      const centerX = 200;
      const centerY = 150;
      for (let i = 0; i < 720; i += 20) {
        const angle = (i * Math.PI) / 180;
        const radius = 10 + i / 20;
        points.push({
          x: Math.round(centerX + radius * Math.cos(angle)),
          y: Math.round(centerY + radius * Math.sin(angle))
        });
      }
      return points;
    })(),
    color: '#000000'
  },
  {
    id: 'loop',
    name: 'Løkke',
    points: (() => {
      const points = [];
      for (let i = 0; i <= 360; i += 15) {
        const angle = (i * Math.PI) / 180;
        points.push({
          x: Math.round(200 + 80 * Math.cos(angle)),
          y: Math.round(150 + 60 * Math.sin(angle))
        });
      }
      return points;
    })(),
    color: '#000000'
  },
  {
    id: 'hook',
    name: 'Krok',
    points: [
      { x: 100, y: 50 },
      { x: 100, y: 150 },
      { x: 120, y: 200 },
      { x: 160, y: 220 },
      { x: 200, y: 220 },
      { x: 240, y: 200 },
      { x: 260, y: 160 }
    ],
    color: '#000000'
  },
  {
    id: 'stairs',
    name: 'Trapp',
    points: [
      { x: 50, y: 250 },
      { x: 50, y: 200 },
      { x: 100, y: 200 },
      { x: 100, y: 150 },
      { x: 150, y: 150 },
      { x: 150, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 50 },
      { x: 250, y: 50 }
    ],
    color: '#000000'
  },
  {
    id: 'bump',
    name: 'Bue',
    points: (() => {
      const points = [];
      for (let i = 0; i <= 180; i += 10) {
        const angle = (i * Math.PI) / 180;
        points.push({
          x: Math.round(100 + i),
          y: Math.round(200 - 80 * Math.sin(angle))
        });
      }
      return points;
    })(),
    color: '#000000'
  },
  {
    id: 'lightning',
    name: 'Lyn',
    points: [
      { x: 200, y: 50 },
      { x: 150, y: 130 },
      { x: 190, y: 130 },
      { x: 140, y: 250 },
      { x: 210, y: 150 },
      { x: 170, y: 150 },
      { x: 220, y: 70 }
    ],
    color: '#000000'
  },
  {
    id: 'heart-half',
    name: 'Halvt hjerte',
    points: [
      { x: 200, y: 250 },
      { x: 150, y: 180 },
      { x: 120, y: 120 },
      { x: 140, y: 80 },
      { x: 180, y: 70 },
      { x: 200, y: 100 }
    ],
    color: '#000000'
  },
  {
    id: 'random1',
    name: 'Tilfeldig 1',
    points: [
      { x: 80, y: 180 },
      { x: 120, y: 100 },
      { x: 180, y: 160 },
      { x: 220, y: 80 },
      { x: 280, y: 140 },
      { x: 320, y: 200 }
    ],
    color: '#000000'
  },
  {
    id: 'random2',
    name: 'Tilfeldig 2',
    points: [
      { x: 100, y: 150 },
      { x: 150, y: 200 },
      { x: 200, y: 100 },
      { x: 250, y: 180 },
      { x: 300, y: 120 }
    ],
    color: '#000000'
  },
  {
    id: 'squiggle',
    name: 'Krusedull',
    points: [
      { x: 60, y: 150 },
      { x: 100, y: 100 },
      { x: 140, y: 180 },
      { x: 180, y: 90 },
      { x: 220, y: 170 },
      { x: 260, y: 110 },
      { x: 300, y: 160 },
      { x: 340, y: 130 }
    ],
    color: '#000000'
  },
  {
    id: 'curl',
    name: 'Krøll',
    points: [
      { x: 100, y: 200 },
      { x: 120, y: 150 },
      { x: 100, y: 100 },
      { x: 150, y: 80 },
      { x: 200, y: 100 },
      { x: 180, y: 150 },
      { x: 200, y: 200 }
    ],
    color: '#000000'
  },
  {
    id: 'snake',
    name: 'Slange',
    points: [
      { x: 50, y: 150 },
      { x: 80, y: 100 },
      { x: 120, y: 150 },
      { x: 160, y: 100 },
      { x: 200, y: 150 },
      { x: 240, y: 100 },
      { x: 280, y: 150 },
      { x: 320, y: 100 },
      { x: 350, y: 120 }
    ],
    color: '#000000'
  },
  {
    id: 'mountain',
    name: 'Fjell',
    points: [
      { x: 50, y: 250 },
      { x: 100, y: 100 },
      { x: 150, y: 180 },
      { x: 200, y: 50 },
      { x: 250, y: 180 },
      { x: 300, y: 120 },
      { x: 350, y: 250 }
    ],
    color: '#000000'
  },
  {
    id: 'infinity',
    name: 'Uendelig',
    points: (() => {
      const points = [];
      for (let i = 0; i <= 360; i += 15) {
        const angle = (i * Math.PI) / 180;
        points.push({
          x: Math.round(200 + 100 * Math.sin(angle)),
          y: Math.round(150 + 50 * Math.sin(2 * angle))
        });
      }
      return points;
    })(),
    color: '#000000'
  },
  {
    id: 'scribble1',
    name: 'Krusedull 2',
    points: [
      { x: 80, y: 120 },
      { x: 130, y: 200 },
      { x: 180, y: 80 },
      { x: 230, y: 180 },
      { x: 280, y: 100 },
      { x: 320, y: 160 }
    ],
    color: '#000000'
  },
  {
    id: 'scribble2',
    name: 'Krusedull 3',
    points: [
      { x: 60, y: 180 },
      { x: 100, y: 80 },
      { x: 160, y: 220 },
      { x: 220, y: 60 },
      { x: 280, y: 200 },
      { x: 340, y: 100 }
    ],
    color: '#000000'
  },
  {
    id: 'arc',
    name: 'Bue 2',
    points: [
      { x: 80, y: 200 },
      { x: 120, y: 100 },
      { x: 200, y: 60 },
      { x: 280, y: 100 },
      { x: 320, y: 200 }
    ],
    color: '#000000'
  },
  {
    id: 'cross',
    name: 'Kryss',
    points: [
      { x: 150, y: 50 },
      { x: 200, y: 150 },
      { x: 250, y: 50 },
      { x: 200, y: 150 },
      { x: 200, y: 250 }
    ],
    color: '#000000'
  },
  {
    id: 'zigzag2',
    name: 'Sikk-sakk 2',
    points: [
      { x: 50, y: 100 },
      { x: 100, y: 200 },
      { x: 150, y: 80 },
      { x: 200, y: 220 },
      { x: 250, y: 100 },
      { x: 300, y: 200 },
      { x: 350, y: 80 }
    ],
    color: '#000000'
  },
  {
    id: 'swirl',
    name: 'Virvel',
    points: (() => {
      const points = [];
      for (let i = 0; i < 540; i += 30) {
        const angle = (i * Math.PI) / 180;
        const radius = 20 + i / 15;
        points.push({
          x: Math.round(180 + radius * Math.cos(angle)),
          y: Math.round(150 + radius * Math.sin(angle))
        });
      }
      return points;
    })(),
    color: '#000000'
  },
  {
    id: 'wave2',
    name: 'Bølge 2',
    points: [
      { x: 50, y: 150 },
      { x: 90, y: 80 },
      { x: 130, y: 150 },
      { x: 170, y: 220 },
      { x: 210, y: 150 },
      { x: 250, y: 80 },
      { x: 290, y: 150 },
      { x: 330, y: 220 },
      { x: 370, y: 150 }
    ],
    color: '#000000'
  },
  {
    id: 'blob',
    name: 'Klump',
    points: [
      { x: 150, y: 100 },
      { x: 200, y: 80 },
      { x: 250, y: 100 },
      { x: 270, y: 150 },
      { x: 250, y: 200 },
      { x: 200, y: 220 },
      { x: 150, y: 200 },
      { x: 130, y: 150 },
      { x: 150, y: 100 }
    ],
    color: '#000000'
  },
  {
    id: 'abstract1',
    name: 'Abstrakt 1',
    points: [
      { x: 100, y: 150 },
      { x: 150, y: 50 },
      { x: 200, y: 150 },
      { x: 250, y: 80 },
      { x: 300, y: 200 },
      { x: 200, y: 250 },
      { x: 100, y: 200 }
    ],
    color: '#000000'
  },
  {
    id: 'abstract2',
    name: 'Abstrakt 2',
    points: [
      { x: 80, y: 100 },
      { x: 180, y: 60 },
      { x: 120, y: 160 },
      { x: 220, y: 120 },
      { x: 160, y: 220 },
      { x: 260, y: 180 },
      { x: 320, y: 140 }
    ],
    color: '#000000'
  }
];

/**
 * Get all squiggles
 */
export function getAllSquiggles() {
  return squiggles;
}

/**
 * Get a random squiggle
 */
export function getRandomSquiggle() {
  return squiggles[Math.floor(Math.random() * squiggles.length)];
}

/**
 * Get a squiggle by ID
 */
export function getSquiggleById(id) {
  return squiggles.find(s => s.id === id);
}

/**
 * Generate a truly random squiggle
 */
export function generateRandomSquiggle() {
  const points = [];
  const numPoints = 5 + Math.floor(Math.random() * 4);
  let x = 50 + Math.floor(Math.random() * 50);

  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: x,
      y: 50 + Math.floor(Math.random() * 200)
    });
    x += 40 + Math.floor(Math.random() * 40);
  }

  return {
    id: 'generated',
    name: 'Tilfeldig',
    points,
    color: '#000000'
  };
}

export default squiggles;
