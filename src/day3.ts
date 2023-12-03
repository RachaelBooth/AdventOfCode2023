import * as _ from "lodash";
import { readAsLines } from "./inputParser";

type location = {
  x: number;
  y: number;
};

type symbolWithLocation = {
  symbol: string;
  location: location;
};

type numberWithLocation = {
  value: number;
  length: number;
  start: location;
};

type schematic = {
  numbers: numberWithLocation[];
  symbols: symbolWithLocation[];
};

function isPartNumber(
  number: numberWithLocation,
  schematic: schematic,
): boolean {
  return _.some(
    schematic.symbols,
    (s) =>
      s.location.x >= number.start.x - 1 &&
      s.location.x <= number.start.x + number.length + 1 &&
      s.location.y >= number.start.y - 1 &&
      s.location.y <= number.start.y + 1,
  );
}

async function readSchematic(inputFileName: string): Promise<schematic> {
  const lines = await readAsLines(inputFileName);
  const numbers = [];
  const symbols = [];
  let y = 0;
  while (y < lines.length) {
    let x = 0;
    while (x < lines[y].length) {
      const c = lines[y][x];
      if (c.match(/\d/)) {
        let number = c;
        const start = { x, y };
        while (x + 1 < lines[y].length && lines[y][x + 1].match(/\d/)) {
          x++;
          number = number + lines[y][x];
        }
        numbers.push({ value: parseInt(number), start, length: x - start.x });
      } else if (c != ".") {
        symbols.push({ symbol: c, location: { x, y } });
      }
      x++;
    }
    y++;
  }

  return { numbers, symbols };
}

export async function solve1(inputFileName: string): Promise<number> {
  const schematic = await readSchematic(inputFileName);
  const partNumbers = schematic.numbers.filter((n) =>
    isPartNumber(n, schematic),
  );
  return _.sumBy(partNumbers, (n) => n.value);
}

function findGears(schematic: schematic) {
  const potentialGears = schematic.symbols.filter((s) => s.symbol == "*");
  const gears = [];
  for (let gear of potentialGears) {
    // Don't need to separately check they are a part number - if adjacent to this symbol then they must be
    const adjacentPartNumbers = schematic.numbers.filter(
      (number) =>
        gear.location.x >= number.start.x - 1 &&
        gear.location.x <= number.start.x + number.length + 1 &&
        gear.location.y >= number.start.y - 1 &&
        gear.location.y <= number.start.y + 1,
    );
    if (adjacentPartNumbers.length == 2) {
      gears.push({
        gear,
        ratio: adjacentPartNumbers[0].value * adjacentPartNumbers[1].value,
      });
    }
  }
  return gears;
}

export async function solve2(inputFileName: string): Promise<number> {
  const schematic = await readSchematic(inputFileName);
  const gears = findGears(schematic);
  return _.sumBy(gears, (gear) => gear.ratio);
}
