import { readAsLines } from "./inputParser";

type location = {
  x: number;
  y: number;
};

type locationWithMap = {
  location: location;
  map: location;
};

function coordinatesToLocationString(x: number, y: number): string {
  return `${x},${y}`;
}

function locationToString(location: location): string {
  return `${location.x},${location.y}`;
}

// ...I really want C#'s tuples for this
function stringToLocation(location: string): location {
  const parts = location.split(",");
  return { x: parseInt(parts[0]), y: parseInt(parts[1]) };
}

function neighbours(location: location): location[] {
  return [
    { x: location.x + 1, y: location.y },
    { x: location.x - 1, y: location.y },
    { x: location.x, y: location.y + 1 },
    { x: location.x, y: location.y - 1 },
  ];
}

function countReachablePlotsInExactSteps(
  start: location,
  plots: Set<string>,
  steps: number,
): number {
  const reachable = new Set<string>();
  // We can always exclude something that's been seen in fewer steps
  // Note that the parity of number of steps in any path from A -> B is fixed, so we can't add solutions by first taking a slower path to A
  const seen = new Set<string>();

  let s = 0;
  let ends = new Set<string>();
  ends.add(locationToString(start));
  while (s < steps) {
    s++;
    let next = new Set<string>();
    for (const end of ends) {
      const location = stringToLocation(end);
      const potentials = neighbours(location)
        .map(locationToString)
        .filter((p) => plots.has(p) && !seen.has(p));
      for (const potential of potentials) {
        seen.add(potential);
        next.add(potential);
        // If a plot is reachable in s steps, then also reachable in (exactly) s+2n steps (e.g. go back and forth between a neighbour and the plot)
        if (steps % 2 == s % 2) {
          reachable.add(potential);
        }
      }
    }
    ends = next;
  }

  return reachable.size;
}

async function readMap(inputFileName: string): Promise<{
  plots: Set<string>;
  rocks: Set<string>;
  start: location;
  width: number;
  height: number;
}> {
  const lines = await readAsLines(inputFileName);

  const plots = new Set<string>();
  const rocks = new Set<string>();
  let start: location;

  let y = 0;
  let x = 0;
  while (y < lines.length) {
    x = 0;
    while (x < lines[y].length) {
      const l = lines[y][x];
      switch (l) {
        case "S":
          start = { x, y };
        case ".":
          plots.add(coordinatesToLocationString(x, y));
          break;
        case "#":
          rocks.add(coordinatesToLocationString(x, y));
          break;
        default:
          console.log(l);
          throw new Error("Unknown value");
      }
      x++;
    }
    y++;
  }

  return { plots, rocks, start, width: x, height: y };
}

export async function solve1(inputFileName: string): Promise<number> {
  const { plots, start } = await readMap(inputFileName);
  return countReachablePlotsInExactSteps(start, plots, 64);
}

export async function solve2(inputFileName: string): Promise<number> {
  // Notes:
  // From the input; The outer edges are all plots, as are the row and column of the starting location
  // Width and Height both 131
  // Distance to any edge location is manhattan distance
  // If reachable from start of map within k steps then reachable in the neighbouring copy in k + 131 steps
  // Ran some code - within my map, can reach every point that's reachable in any odd number of steps within 129 steps, and in an even number of steps within 130 steps
  // 26501365 / 131 is 202300 with remainder 65
  // Start is 65,65 - in 65 steps from S can't pass edge - but going straight can be on edge
  // Can do any set of steps from S to the equivalent in another map (for all maps in range) then 65 steps from S
  // Maps with S in range: n=202300. (n + 1)^2 an even number of map-steps away, n^2 an odd number of map-steps away - think about the diamond
  // Can calculate number we can reach within a map in large even steps / large odd steps
  // If we can reach everything in a map, have found that if it's an even number of map-steps away then that's 7250, if odd number of map-steps then 7334
  // For the edges, need to exclude the far corners of the furthest reached maps and include the near corners of the nearest not quite reached
  // That's a total of n full-way exclusions of things more than 65 steps away in the even-map-steps away squares (combining across all squares around the edge)
  // And need to add n-1 times things that can be reached from a corner odd-map-steps away (which is also going to be those things not reachable in 65)

  const { plots, start } = await readMap(inputFileName);

  // These will catch everything reachable in one map in large even / large odd number of steps
  const evenFromS = countReachablePlotsInExactSteps(start, plots, 130);
  const oddFromS = countReachablePlotsInExactSteps(start, plots, 129);

  // 64 because counting even things
  const evenFromSCorners = evenFromS - countReachablePlotsInExactSteps(start, plots, 64);
  const oddFromSCorners = oddFromS - countReachablePlotsInExactSteps(start, plots, 65);

  const n = 202300;
  const total =
    n * n * evenFromS +
    (n + 1) * (n + 1) * oddFromS -
    (n + 1) * oddFromSCorners +
    n * evenFromSCorners;

  return total;
}
