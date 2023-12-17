import { readAsLines } from "./inputParser";

type location = {
  x: number;
  y: number;
};

enum Direction {
  North,
  East,
  South,
  West,
}

type State = {
  position: location;
  heatLost: number;
  facing: Direction;
  blocksSinceTurn: number;
};

function locationAfterDirectionStep(location: location, direction: Direction): location {
  switch (direction) {
    case Direction.North:
      return { x: location.x, y: location.y - 1 };
    case Direction.South:
      return { x: location.x, y: location.y + 1 };
    case Direction.East:
      return { x: location.x + 1, y: location.y };
    case Direction.West:
      return { x: location.x - 1, y: location.y };
  }
}

function leftDirection(direction: Direction): Direction {
  switch (direction) {
    case Direction.North:
      return Direction.West;
    case Direction.West:
      return Direction.South;
    case Direction.South:
      return Direction.East;
    case Direction.East:
      return Direction.North;
  }
}

function rightDirection(direction: Direction): Direction {
  switch (direction) {
    case Direction.North:
      return Direction.East;
    case Direction.West:
      return Direction.North;
    case Direction.South:
      return Direction.West;
    case Direction.East:
      return Direction.South;
  }
}

async function readGrid(inputFileName: string): Promise<number[][]> {
  const lines = await readAsLines(inputFileName);
  return lines.map((line) => line.split("").map((l) => parseInt(l)));
}

function asString(state: State): string {
  return `${state.position.x},${state.position.y}:${state.facing}:${state.blocksSinceTurn}`;
}

function isInGrid(position: location, grid: number[][]): boolean {
  const maxY = grid.length;
  const maxX = grid[0].length;
  return position.y >= 0 && position.y < maxY && position.x >= 0 && position.x < maxX;
}

function potentialNeighbours(
  state: State,
  grid: number[][],
  maxBlocksBeforeTurn: number,
  minBlocksBeforeTurn: number,
): State[] {
  const neighbours: State[] = [];

  if (state.blocksSinceTurn < maxBlocksBeforeTurn) {
    const positionAfterStraightStep = locationAfterDirectionStep(state.position, state.facing);
    if (isInGrid(positionAfterStraightStep, grid)) {
      neighbours.push({
        position: positionAfterStraightStep,
        heatLost: state.heatLost + grid[positionAfterStraightStep.y][positionAfterStraightStep.x],
        facing: state.facing,
        blocksSinceTurn: state.blocksSinceTurn + 1,
      });
    }
  }

  if (state.blocksSinceTurn >= minBlocksBeforeTurn) {
    const directionLeft = leftDirection(state.facing);
    const positionAfterLeftStep = locationAfterDirectionStep(state.position, directionLeft);
    if (isInGrid(positionAfterLeftStep, grid)) {
      neighbours.push({
        position: positionAfterLeftStep,
        heatLost: state.heatLost + grid[positionAfterLeftStep.y][positionAfterLeftStep.x],
        facing: directionLeft,
        blocksSinceTurn: 1,
      });
    }

    const directionRight = rightDirection(state.facing);
    const positionAfterRightStep = locationAfterDirectionStep(state.position, directionRight);
    if (isInGrid(positionAfterRightStep, grid)) {
      neighbours.push({
        position: positionAfterRightStep,
        heatLost: state.heatLost + grid[positionAfterRightStep.y][positionAfterRightStep.x],
        facing: directionRight,
        blocksSinceTurn: 1,
      });
    }
  }
  return neighbours;
}

function findCheapestPathCost(
  grid: number[][],
  start: location,
  initialDirections: Direction[],
  minBlocksBeforeTurn: number,
  maxBlocksBeforeTurn: number,
  end: location,
): number {
  let currentStates = initialDirections.map((d) => ({
    position: start,
    heatLost: 0,
    facing: d,
    blocksSinceTurn: 0,
  }));
  const seen = new Set<string>();
  const seenCosts: { [key: string]: number } = {};
  let cost = Infinity;
  while (currentStates.length > 0) {
    const next = [];
    for (const state of currentStates) {
      const neighbours = potentialNeighbours(state, grid, maxBlocksBeforeTurn, minBlocksBeforeTurn);
      for (const neighbour of neighbours) {
        if (
          neighbour.position.x == end.x &&
          neighbour.position.y == end.y &&
          neighbour.blocksSinceTurn >= minBlocksBeforeTurn
        ) {
          if (neighbour.heatLost < cost) {
            cost = neighbour.heatLost;
          }
        } else if (neighbour.heatLost < cost) {
          const n = asString(neighbour);
          if (seen.has(n)) {
            if (seenCosts[n] > neighbour.heatLost) {
              seenCosts[n] = neighbour.heatLost;
              next.push(neighbour);
            }
          } else {
            seen.add(n);
            seenCosts[n] = neighbour.heatLost;
            next.push(neighbour);
          }
        }
      }
    }
    currentStates = next;
  }
  return cost;
}

export async function solve1(inputFileName: string): Promise<number> {
  const grid = await readGrid(inputFileName);
  const start = { x: 0, y: 0 };
  const end = { x: grid[0].length - 1, y: grid.length - 1 };
  return findCheapestPathCost(grid, start, [Direction.East, Direction.South], 0, 3, end);
}

export async function solve2(inputFileName: string): Promise<number> {
  const grid = await readGrid(inputFileName);
  const start = { x: 0, y: 0 };
  const end = { x: grid[0].length - 1, y: grid.length - 1 };
  return findCheapestPathCost(grid, start, [Direction.East, Direction.South], 4, 10, end);
}
