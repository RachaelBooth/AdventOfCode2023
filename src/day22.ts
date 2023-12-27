import { Dictionary, ListDictionary } from "./dictionary";
import { readAsLines } from "./inputParser";

type location = {
  x: number;
  y: number;
  z: number;
};

// I'm going back to C# next year, tuples as value types are just too useful
function locationAsString(location: location): string {
  return `${location.x},${location.y},${location.z}`;
}

function add(location: location, vector: location): location {
  return {
    x: location.x + vector.x,
    y: location.y + vector.y,
    z: location.z + vector.z,
  };
}

function times(vector: location, scalar: number): location {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
    z: vector.z * scalar,
  };
}

type brick = {
  start: location;
  length: number;
  vector: location;
  ref: string;
  restingOn: Set<string>;
};

async function readBricks(inputFileName: string): Promise<brick[]> {
  const lines = await readAsLines(inputFileName);
  const bricks = [];
  let c = 1;
  for (const line of lines) {
    const ends = line.split("~").map((p) => p.split(","));
    const start = {
      x: Math.min(parseInt(ends[0][0]), parseInt(ends[1][0])),
      y: Math.min(parseInt(ends[0][1]), parseInt(ends[1][1])),
      z: Math.min(parseInt(ends[0][2]), parseInt(ends[1][2])),
    };
    const end = {
      x: Math.max(parseInt(ends[0][0]), parseInt(ends[1][0])),
      y: Math.max(parseInt(ends[0][1]), parseInt(ends[1][1])),
      z: Math.max(parseInt(ends[0][2]), parseInt(ends[1][2])),
    };
    // We're told it's single direction...
    const vector = {
      x: start.x == end.x ? 0 : 1,
      y: start.y == end.y ? 0 : 1,
      z: start.z == end.z ? 0 : 1,
    };
    const length = end.x - start.x + end.y - start.y + end.z - start.z;
    const ref = `${c}`;
    c++;
    bricks.push({ start, vector, length, ref, restingOn: new Set<string>() });
  }
  return bricks;
}

function occupiedBrickLocations(brick: brick): location[] {
  const locations = [brick.start];
  let i = 1;
  // N.B. Length is 0 for a single location brick, because there are fewer +1s around that way
  while (i <= brick.length) {
    locations.push(add(brick.start, times(brick.vector, i)));
    i++;
  }
  return locations;
}

function zLocations(brick: brick): number[] {
  const z = [brick.start.z];
  if (brick.vector.z == 0) {
    return z;
  }

  let i = 1;
  while (i <= brick.length) {
    z.push(brick.start.z + i * brick.vector.z);
    i++;
  }
  return z;
}

let falls = 0;

function settleBricks(bricks: brick[]): Dictionary<brick> {
  let occupied = new Set<string>();
  for (const brick of bricks) {
    for (const location of occupiedBrickLocations(brick)) {
      occupied.add(locationAsString(location));
    }
  }

  let unsettledBricks = [...bricks];
  const settledBricks = new Dictionary<brick>();
  const settledOccupied = new Set<string>();
  const settledOccupiedRefs = new Dictionary<string>("");

  while (unsettledBricks.length > 0) {
    let nextUnsettled = [];
    let nextOccupied = new Set<string>(settledOccupied);
    for (const brick of unsettledBricks) {
      const locations = occupiedBrickLocations(brick);
      const locationsAsStrings = locations.map(locationAsString);
      if (brick.start.z == 1 || (brick.vector.z < 0 && brick.start.z - brick.length == 1)) {
        // Settled on ground
        const restingOn = new Set<string>();
        restingOn.add("Floor");
        settledBricks.set(brick.ref, { ...brick, restingOn });
        for (const location of locationsAsStrings) {
          settledOccupied.add(location);
          settledOccupiedRefs.set(location, brick.ref);
          nextOccupied.add(location);
        }
      } else {
        const fallenLocations = locations
          .map((l) => add(l, { x: 0, y: 0, z: -1 }))
          .map(locationAsString);
        if (fallenLocations.some((l) => settledOccupied.has(l))) {
          // Settled on brick
          const restingOn = new Set<string>();
          for (const location of fallenLocations) {
            const ref = settledOccupiedRefs.get(location);
            if (ref) {
              restingOn.add(settledOccupiedRefs.get(location));
            }
          }
          settledBricks.set(brick.ref, { ...brick, restingOn });
          for (const location of locationsAsStrings) {
            settledOccupied.add(location);
            settledOccupiedRefs.set(location, brick.ref);
            nextOccupied.add(location);
          }
        } else if (
          fallenLocations.every((l) => !occupied.has(l) || locationsAsStrings.includes(l))
        ) {
          // Can fall
          falls++;
          nextUnsettled.push({ ...brick, start: add(brick.start, { x: 0, y: 0, z: -1 }) });
          for (const location of fallenLocations) {
            nextOccupied.add(location);
          }
        } else {
          nextUnsettled.push(brick);
          for (const location of locationsAsStrings) {
            nextOccupied.add(location);
          }
        }
      }
    }
    unsettledBricks = nextUnsettled;
    occupied = nextOccupied;
  }
  return settledBricks;
}

export async function solve1(inputFileName: string): Promise<number> {
  const bricks = await readBricks(inputFileName);
  const settled = settleBricks(bricks);
  const brickRefs = bricks.map((b) => b.ref);
  const supporting = new ListDictionary<string>();
  for (const ref of brickRefs) {
    const brick = settled.get(ref);
    for (const supporter of brick.restingOn) {
      // Will include Floor
      supporting.addTo(supporter, ref);
    }
  }

  let disintegratable = 0;
  for (const ref of brickRefs) {
    if (supporting.get(ref).every((s) => settled.get(s).restingOn.size > 1)) {
      disintegratable++;
    }
  }

  return disintegratable;
}

export async function solve2(inputFileName: string): Promise<number> {
  const bricks = await readBricks(inputFileName);
  const settled = settleBricks(bricks);
  const brickRefs = bricks.map((b) => b.ref);
  const supporting = new ListDictionary<string>();
  for (const ref of brickRefs) {
    const brick = settled.get(ref);
    for (const supporter of brick.restingOn) {
      // Will include Floor
      supporting.addTo(supporter, ref);
    }
  }

  let totalFalls = 0;
  for (const ref of brickRefs) {
    const falling = new Set<string>();
    let newFalling = [settled.get(ref)];
    while (newFalling.length > 0) {
      let nextNew = [];
      for (const brick of newFalling) {
        falling.add(brick.ref);
        const s = supporting.get(brick.ref);
        for (const sb of s) {
          const sbrick = settled.get(sb);
          let fall = true;
          for (const supporter of sbrick.restingOn) {
            if (!falling.has(supporter)) {
              fall = false;
            }
          }
          if (fall) {
            falling.add(sb);
            nextNew.push(sbrick);
          }
        }
      }
      newFalling = nextNew;
    }
    totalFalls = totalFalls + falling.size - 1;
  }
  return totalFalls;
}
