import { readAsLines } from "./inputParser";
import * as _ from "lodash";

type location = {
  x: number;
  y: number;
};

type map = {
  galaxies: location[];
  emptyRows: number[];
  emptyColumns: number[];
};

async function readMap(inputFileName: string): Promise<map> {
  const lines = await readAsLines(inputFileName);
  const galaxies = [];
  const emptyRows = [];
  let y = 0;
  let x = 0;
  while (y < lines.length) {
    x = 0;
    let empty = true;
    while (x < lines[y].length) {
      if (lines[y][x] == "#") {
        galaxies.push({ x, y });
        empty = false;
      }
      x++;
    }
    if (empty) {
      emptyRows.push(y);
    }
    y++;
  }
  const emptyColumns = _.range(x).filter((c) => !galaxies.some((g) => g.x == c));
  return { galaxies, emptyRows, emptyColumns };
}

function findShortestPathDistance(
  map: map,
  start: location,
  end: location,
  emptynessWeight: number,
): number {
  const baseDistance = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);
  const emptyRowsCrossed = map.emptyRows.filter(
    (y) => y > Math.min(start.y, end.y) && y < Math.max(start.y, end.y),
  ).length;
  const emptyColumnsCrossed = map.emptyColumns.filter(
    (x) => x > Math.min(start.x, end.x) && x < Math.max(start.x, end.x),
  ).length;
  return baseDistance + (emptynessWeight - 1) * (emptyRowsCrossed + emptyColumnsCrossed);
}

function sumShortestGalaxyDistances(map: map, emptynessWeight: number) {
  let sum = 0;
  let g = 0;
  while (g < map.galaxies.length - 1) {
    let h = g + 1;
    while (h < map.galaxies.length) {
      const path = findShortestPathDistance(map, map.galaxies[g], map.galaxies[h], emptynessWeight);
      sum = sum + path;
      h++;
    }
    g++;
  }
  return sum;
}

export async function solve1(inputFileName: string): Promise<number> {
  const map = await readMap(inputFileName);
  return sumShortestGalaxyDistances(map, 2);
}

export async function solve2(inputFileName: string): Promise<number> {
  const map = await readMap(inputFileName);
  return sumShortestGalaxyDistances(map, 1000000);
}
