import { readAsLines } from "./inputParser";

type instruction = {
  direction: string;
  length: number;
};

type location = {
  x: number;
  y: number;
};

type trench = {
  corners: location[];
  boundaryPointCount: number;
};

async function readDigPlan(inputFileName: string): Promise<instruction[]> {
  const lines = await readAsLines(inputFileName);
  return lines.map((line) => {
    const parts = line.split(" ");
    return {
      direction: parts[0],
      length: parseInt(parts[1]),
    };
  });
}

async function readDigPlan2(inputFileName: string): Promise<instruction[]> {
  const lines = await readAsLines(inputFileName);
  return lines.map((line) => {
    const parts = line.split(" ");
    const length = parseInt(parts[2].substring(2, parts[2].length - 2), 16);
    return {
      direction: parts[2][parts[2].length - 2],
      length,
    };
  });
}

function vectorDirection(direction: string): { x: number; y: number } {
  switch (direction) {
    case "U":
    case "3":
      return { x: 0, y: 1 };
    case "D":
    case "1":
      return { x: 0, y: -1 };
    case "L":
    case "2":
      return { x: -1, y: 0 };
    case "R":
    case "0":
      return { x: 1, y: 0 };
    default:
      throw new Error(`Unexpected direction: ${direction}`);
  }
}

function digTrench(instructions: instruction[]): trench {
  const corners = [];
  let boundaryPointCount = 0;
  let x = 0;
  let y = 0;
  for (const instruction of instructions) {
    const vector = vectorDirection(instruction.direction);

    x = x + vector.x * instruction.length;
    y = y + vector.y * instruction.length;
    corners.push({ x, y });

    boundaryPointCount = boundaryPointCount + instruction.length;
  }
  return { corners, boundaryPointCount };
}

function findEnclosedSize(trench: trench): number {
  // Corners must be in order since we found them by drawing
  let area = 0;
  let i = 0;
  while (i < trench.corners.length) {
    let x_p = i < trench.corners.length - 1 ? trench.corners[i + 1].x : trench.corners[0].x;
    let x_m = i > 0 ? trench.corners[i - 1].x : trench.corners[trench.corners.length - 1].x;
    area = area + 0.5 * trench.corners[i].y * (x_m - x_p);
    i++;
  }
  area = Math.abs(area);
  // A = i + b/2 - 1
  // i = A + 1 - b/2
  // i + b = A + 1 + b/2
  return area + 1 + trench.boundaryPointCount / 2;
}

export async function solve1(inputFileName: string): Promise<number> {
  const plan = await readDigPlan(inputFileName);
  const trench = digTrench(plan);
  return findEnclosedSize(trench);
}

export async function solve2(inputFileName: string): Promise<number> {
  const plan = await readDigPlan2(inputFileName);
  const trench = digTrench(plan);
  return findEnclosedSize(trench);
}
