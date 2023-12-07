import { readAsLines } from "./inputParser";

type race = {
  time: number;
  recordDistance: number;
};

async function readRaces(inputFileName: string): Promise<race[]> {
  const lines = await readAsLines(inputFileName);
  const parts = lines.map((line) => line.split(/\s+/));
  const races: race[] = [];
  let i = 1;
  while (i < parts[0].length) {
    races.push({
      time: parseInt(parts[0][i]),
      recordDistance: parseInt(parts[1][i]),
    });
    i++;
  }
  return races;
}

function countWaysToBeat(race: race): number {
  // Hold button for b milliseconds
  // Win if b * (race.time - b) > race.recordDistance <=> b^2 - race.time * b + race.recordDistance <= 0
  // i.e. b is between the two solutions to the quadratic b^2 - race.time * b + race.recordDistance = 0
  // Solutions are b = (race.time +- sqrt(race.time ^2 - 4 * race.recordDistance)) / 2
  const s = Math.sqrt(race.time * race.time - 4 * race.recordDistance);
  // Note that s is positive
  const minWinner = Math.ceil((race.time - s) / 2);
  const maxWinner = Math.floor((race.time + s) / 2);
  // Could have minWinner = maxWinner + 1 from the ceil/floor if no ints between them, but then this comes out as 0 which is right
  return maxWinner - minWinner + 1;
}

export async function solve1(inputFileName: string): Promise<number> {
  const races = await readRaces(inputFileName);
  return races.map(countWaysToBeat).reduce((curr, next) => curr * next);
}

async function readRace(inputFileName: string): Promise<race> {
  const lines = await readAsLines(inputFileName);
  const linesWithoutSpaces = lines.map((line) => line.replaceAll(/\s+/g, ""));
  const values = linesWithoutSpaces.map((line) => parseInt(line.split(":")[1]));
  return {
    time: values[0],
    recordDistance: values[1],
  };
}

export async function solve2(inputFileName: string): Promise<number> {
  const race = await readRace(inputFileName);
  const result = countWaysToBeat(race);
  return Promise.resolve(result);
}
