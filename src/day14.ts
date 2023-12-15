import { Dictionary } from "./dictionary";
import { readAsLines } from "./inputParser";

type platform = {
  roundedRocks: { [key: number]: Set<number> };
  cubeRocks: { [key: number]: Set<number> };
  sizeX: number;
  sizeY: number;
};

async function readPlatform(inputFileName: string): Promise<platform> {
  const lines = await readAsLines(inputFileName);
  const roundedRocks = {};
  const cubeRocks = {};
  let y = 0;
  let x = 0;
  while (y < lines.length) {
    roundedRocks[y] = new Set<number>();
    cubeRocks[y] = new Set<number>();
    x = 0;
    while (x < lines.length) {
      const c = lines[y][x];
      if (c == "O") {
        roundedRocks[y].add(x);
      } else if (c == "#") {
        cubeRocks[y].add(x);
      }
      x++;
    }
    y++;
  }
  return { roundedRocks, cubeRocks, sizeX: x, sizeY: y };
}

function tiltNorth(platform: platform): platform {
  const newRoundedRocks = {};
  let y = 0;
  while (y < platform.sizeY) {
    newRoundedRocks[y] = new Set<number>();
    let x = 0;
    while (x < platform.sizeX) {
      if (platform.roundedRocks[y].has(x)) {
        let z = 0;
        while (
          y - z - 1 >= 0 &&
          !newRoundedRocks[y - z - 1].has(x) &&
          !platform.cubeRocks[y - z - 1].has(x)
        ) {
          z++;
        }
        newRoundedRocks[y - z].add(x);
      }
      x++;
    }
    y++;
  }
  return { ...platform, roundedRocks: newRoundedRocks };
}

function tiltSouth(platform: platform): platform {
  const newRoundedRocks = {};
  let y = platform.sizeY - 1;
  while (y >= 0) {
    newRoundedRocks[y] = new Set<number>();
    let x = 0;
    while (x < platform.sizeX) {
      if (platform.roundedRocks[y].has(x)) {
        let z = 0;
        while (
          y + z + 1 < platform.sizeY &&
          !newRoundedRocks[y + z + 1].has(x) &&
          !platform.cubeRocks[y + z + 1].has(x)
        ) {
          z++;
        }
        newRoundedRocks[y + z].add(x);
      }
      x++;
    }
    y--;
  }
  return { ...platform, roundedRocks: newRoundedRocks };
}

function tiltWest(platform: platform): platform {
  const newRoundedRocks = {};
  let x = 0;
  while (x < platform.sizeX) {
    let y = 0;
    while (y < platform.sizeY) {
      if (x == 0) {
        newRoundedRocks[y] = new Set<number>();
      }

      if (platform.roundedRocks[y].has(x)) {
        let z = 0;
        while (
          x - z - 1 >= 0 &&
          !newRoundedRocks[y].has(x - z - 1) &&
          !platform.cubeRocks[y].has(x - z - 1)
        ) {
          z++;
        }
        newRoundedRocks[y].add(x - z);
      }
      y++;
    }
    x++;
  }
  return { ...platform, roundedRocks: newRoundedRocks };
}

function tiltEast(platform: platform): platform {
  const newRoundedRocks = {};
  let x = platform.sizeX - 1;
  while (x >= 0) {
    let y = 0;
    while (y < platform.sizeY) {
      if (x == platform.sizeX - 1) {
        newRoundedRocks[y] = new Set<number>();
      }

      if (platform.roundedRocks[y].has(x)) {
        let z = 0;
        while (
          x + z + 1 < platform.sizeX &&
          !newRoundedRocks[y].has(x + z + 1) &&
          !platform.cubeRocks[y].has(x + z + 1)
        ) {
          z++;
        }
        newRoundedRocks[y].add(x + z);
      }
      y++;
    }
    x--;
  }
  return { ...platform, roundedRocks: newRoundedRocks };
}

function calculateNorthLoad(platform: platform): number {
  let load = 0;
  let y = 0;
  while (y < platform.sizeY) {
    load = load + platform.roundedRocks[y].size * (platform.sizeY - y);
    y++;
  }
  return load;
}

export async function solve1(inputFileName: string): Promise<number> {
  let platform = await readPlatform(inputFileName);
  platform = tiltNorth(platform);
  return calculateNorthLoad(platform);
}

function roundedRocksAsString(platform: platform): string {
  let s = "";
  let y = 0;
  while (y < platform.sizeY) {
    s = s + `${y}=`;
    let x = 0;
    while (x < platform.sizeX) {
      if (platform.roundedRocks[y].has(x)) {
        s = s + `${x},`;
      }
      x++;
    }
    s = s + ":";
    y++;
  }
  return s;
}

export async function solve2(inputFileName: string): Promise<number> {
  let platform = await readPlatform(inputFileName);
  const seen = new Set<string>();
  const map = new Dictionary<platform>();
  const when = new Dictionary<number>();
  let cycles = 0;
  while (cycles < 1000000000) {
    if (seen.has(roundedRocksAsString(platform))) {
      const loopLength = cycles - when.get(roundedRocksAsString(platform));
      const remainingCycles = (1000000000 - cycles) % loopLength;
      let c = 0;
      while (c < remainingCycles) {
        platform = map.get(roundedRocksAsString(platform));
        c++;
      }
      return calculateNorthLoad(platform);
    } else {
      seen.add(roundedRocksAsString(platform));
      when.set(roundedRocksAsString(platform), cycles);
      const n = tiltNorth(platform);
      const w = tiltWest(n);
      const s = tiltSouth(w);
      const e = tiltEast(s);
      map.set(roundedRocksAsString(platform), e);
      platform = e;
    }
    cycles++;
  }
  return calculateNorthLoad(platform);
}
