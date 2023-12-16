import { readAsLines } from "./inputParser";

enum Direction {
  Right,
  Left,
  Up,
  Down,
}

async function readGrid(inputFileName: string): Promise<string[][]> {
  const lines = await readAsLines(inputFileName);
  return lines.map((line) => line.split(""));
}

function positionAsString(position: { x: number; y: number; direction: Direction }): string {
  return `${position.x},${position.y}`;
}

function positionAndDirectionAsString(position: {
  x: number;
  y: number;
  direction: Direction;
}): string {
  return `${position.x},${position.y}:${position.direction}`;
}

function positionOnlyAfterStep(position: { x: number; y: number; direction: Direction }): {
  x: number;
  y: number;
} {
  switch (position.direction) {
    case Direction.Right:
      return { x: position.x + 1, y: position.y };
    case Direction.Left:
      return { x: position.x - 1, y: position.y };
    case Direction.Up:
      return { x: position.x, y: position.y - 1 };
    case Direction.Down:
      return { x: position.x, y: position.y + 1 };
  }
}

function directionAfterMirror(currentDirection: Direction, mirror: string): Direction {
  switch (currentDirection) {
    case Direction.Right:
      return mirror == "/" ? Direction.Up : Direction.Down;
    case Direction.Left:
      return mirror == "/" ? Direction.Down : Direction.Up;
    case Direction.Down:
      return mirror == "/" ? Direction.Left : Direction.Right;
    case Direction.Up:
      return mirror == "/" ? Direction.Right : Direction.Left;
  }
}

function directionsAfterSplitter(currentDirection: Direction, splitter: string): Direction[] {
  switch (currentDirection) {
    case Direction.Right:
      return splitter == "-" ? [Direction.Right] : [Direction.Up, Direction.Down];
    case Direction.Left:
      return splitter == "-" ? [Direction.Left] : [Direction.Up, Direction.Down];
    case Direction.Down:
      return splitter == "-" ? [Direction.Left, Direction.Right] : [Direction.Down];
    case Direction.Up:
      return splitter == "-" ? [Direction.Left, Direction.Right] : [Direction.Up];
  }
}

function isMirror(encounter: string): boolean {
  return encounter == "/" || encounter == "\\";
}

function isSplitter(encounter: string): boolean {
  return encounter == "-" || encounter == "|";
}

function positionsAfterStep(
  position: { x: number; y: number; direction: Direction },
  grid: string[][],
): { x: number; y: number; direction: Direction }[] {
  const newPosition = positionOnlyAfterStep(position);
  if (
    newPosition.y < 0 ||
    newPosition.y >= grid.length ||
    newPosition.x < 0 ||
    newPosition.x >= grid[newPosition.y].length
  ) {
    return [];
  }

  const encounter = grid[newPosition.y][newPosition.x];

  if (isMirror(encounter)) {
    return [
      {
        ...newPosition,
        direction: directionAfterMirror(position.direction, encounter),
      },
    ];
  } else if (isSplitter(encounter)) {
    return directionsAfterSplitter(position.direction, encounter).map((d) => ({
      ...newPosition,
      direction: d,
    }));
  } else {
    return [{ ...newPosition, direction: position.direction }];
  }
}

function adjustedStartingPositions(
  startingPosition: { x: number; y: number; direction: Direction },
  grid: string[][],
): { x: number; y: number; direction: Direction }[] {
  const startingEncounter = grid[startingPosition.y][startingPosition.x];
  if (isMirror(startingEncounter)) {
    return [
      {
        ...startingPosition,
        direction: directionAfterMirror(startingPosition.direction, startingEncounter),
      },
    ];
  } else if (isSplitter(startingEncounter)) {
    return directionsAfterSplitter(startingPosition.direction, startingEncounter).map((d) => ({
      ...startingPosition,
      direction: d,
    }));
  } else {
    return [{ ...startingPosition }];
  }
}

function findBeamPath(
  grid: string[][],
  startingPosition: { x: number; y: number; direction: Direction },
): { seen: Set<string>; energizedTiles: Set<string> } {
  const seen = new Set<string>();
  const energizedTiles = new Set<string>();

  let ends = adjustedStartingPositions(startingPosition, grid);

  for (const end of ends) {
    seen.add(positionAndDirectionAsString(end));
    energizedTiles.add(positionAsString(end));
  }

  while (ends.length > 0) {
    let next = [];
    for (const position of ends) {
      for (const newPosition of positionsAfterStep(position, grid)) {
        if (!seen.has(positionAndDirectionAsString(newPosition))) {
          seen.add(positionAndDirectionAsString(newPosition));
          energizedTiles.add(positionAsString(newPosition));
          next.push(newPosition);
        }
      }
    }
    ends = next;
  }
  return { seen, energizedTiles };
}

function countEnergizedTiles(
  grid: string[][],
  startingPosition: { x: number; y: number; direction: Direction },
): number {
  return findBeamPath(grid, startingPosition).energizedTiles.size;
}

export async function solve1(inputFileName: string): Promise<number> {
  const grid = await readGrid(inputFileName);
  return countEnergizedTiles(grid, { x: 0, y: 0, direction: Direction.Right });
}

export async function solve2(inputFileName: string): Promise<number> {
  const grid = await readGrid(inputFileName);
  let max = 0;
  let x = 0;
  while (x < grid[0].length) {
    const t = countEnergizedTiles(grid, { x, y: 0, direction: Direction.Down });
    if (t > max) {
      max = t;
    }
    const b = countEnergizedTiles(grid, {
      x,
      y: grid.length - 1,
      direction: Direction.Up,
    });
    if (b > max) {
      max = b;
    }
    x++;
  }

  let y = 0;
  while (y < grid.length) {
    const l = countEnergizedTiles(grid, {
      x: 0,
      y,
      direction: Direction.Right,
    });
    if (l > max) {
      max = l;
    }
    const r = countEnergizedTiles(grid, {
      x: grid[0].length - 1,
      y,
      direction: Direction.Left,
    });
    if (r > max) {
      max = r;
    }
    y++;
  }

  return max;
}
