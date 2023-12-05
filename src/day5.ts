import { readAsLines } from "./inputParser";
import * as _ from "lodash";

type map = {
  source: { min: number; max: number };
  destination: { min: number; max: number };
  diff: number;
};

type range = { min: number, max: number };

type almanac = {
  initialSeeds: number[];
  rangeSeeds: range[];

  seedToSoil: map[];
  soilToFertilizer: map[];
  fertilizerToWater: map[];
  waterToLight: map[];
  lightToTemperature: map[];
  temeratureToHumidity: map[];
  humidityToLocation: map[];
};

async function readAlmanac(inputFileName: string): Promise<almanac> {
  const lines = await readAsLines(inputFileName);
  let almanac: almanac = {
    initialSeeds: [],
    rangeSeeds: [],
    seedToSoil: [],
    soilToFertilizer: [],
    fertilizerToWater: [],
    waterToLight: [],
    lightToTemperature: [],
    temeratureToHumidity: [],
    humidityToLocation: [],
  };
  let i = 0;
  let section = [];
  while (i < lines.length) {
    if (lines[i].startsWith("seeds:")) {
      const s = lines[i].split(" ");
      almanac.initialSeeds = _.tail(s).map((seed) => parseInt(seed));
      let j = 0;
      while (j < almanac.initialSeeds.length - 1) {
        const range = { min: almanac.initialSeeds[j], max: almanac.initialSeeds[j] + almanac.initialSeeds[j + 1] - 1 };
        almanac.rangeSeeds.push(range);
        j = j + 2;
      }
    } else if (lines[i].startsWith("seed-to-soil")) {
      section = almanac.seedToSoil;
    } else if (lines[i].startsWith("soil-to")) {
      section = almanac.soilToFertilizer;
    } else if (lines[i].startsWith("fertilizer-to")) {
      section = almanac.fertilizerToWater;
    } else if (lines[i].startsWith("water-to")) {
      section = almanac.waterToLight;
    } else if (lines[i].startsWith("light-to")) {
      section = almanac.lightToTemperature;
    } else if (lines[i].startsWith("temperature-to")) {
      section = almanac.temeratureToHumidity;
    } else if (lines[i].startsWith("humidity-to")) {
      section = almanac.humidityToLocation;
    } else if (lines[i] != "") {
      const parts = lines[i].split(" ").map((p) => parseInt(p));
      const map: map = {
        source: { min: parts[1], max: parts[1] + parts[2] - 1 },
        destination: { min: parts[0], max: parts[0] + parts[2] - 1 },
        diff: parts[0] - parts[1],
      };
      section.push(map);
    }
    i++;
  }
  return almanac;
}

function mapForwards(s: number, maps: map[]): number {
  // Assume max one of these
  const relevantMap = _.find(
    maps,
    (m) => m.source.min <= s && m.source.max >= s,
  );
  if (!relevantMap) {
    return s;
  }
  return s + relevantMap.diff;
}

function mapBackwards(d: number, maps: map[]): number[] {
  const relevantMaps = _.filter(
    maps,
    (m) => m.destination.min <= d && m.destination.max >= d,
  );
  const results = relevantMaps.map(m => d - m.diff);
  const alsoDefaultSource = _.every(maps, m => m.source.min > d || m.source.max < d);
  if (alsoDefaultSource) {
    results.push(d);
  }
  return results;
}

function mapLocationToSeeds(l: number, almanac: almanac): number[] {
    const maps = [
        almanac.seedToSoil,
        almanac.soilToFertilizer,
        almanac.fertilizerToWater,
        almanac.waterToLight,
        almanac.lightToTemperature,
        almanac.temeratureToHumidity,
        almanac.humidityToLocation,
      ];
      let i = maps.length - 1;
      let values = [l];
      while (i >= 0) {
        const mapSet = maps[i];
        values = values.flatMap(v => mapBackwards(v, mapSet));
        i--;
      }
      return values;
}

function mapSeedToLocation(seed: number, almanac: almanac): number {
  const maps = [
    almanac.seedToSoil,
    almanac.soilToFertilizer,
    almanac.fertilizerToWater,
    almanac.waterToLight,
    almanac.lightToTemperature,
    almanac.temeratureToHumidity,
    almanac.humidityToLocation,
  ];
  let s = seed;
  for (let mapSet of maps) {
    s = mapForwards(s, mapSet);
  }
  return s;
}

export async function solve1(inputFileName: string): Promise<number> {
  const almanac = await readAlmanac(inputFileName);
  const locationsFromInitialSeeds = almanac.initialSeeds.map(s => mapSeedToLocation(s, almanac));
  return Math.min(...locationsFromInitialSeeds);
}

export async function solve2(inputFileName: string): Promise<number> {
    // Feel like I should combine maps and do something clever, but this worked so :shrug:
    const almanac = await readAlmanac(inputFileName);
    let l = 0;
    // Actually this might not still be in the list, but lets hope for now
    while (l <= 424490994) {
        const seeds = mapLocationToSeeds(l, almanac);
        if (_.some(seeds, s => _.some(almanac.rangeSeeds, r => r.min <= s && r.max >= s))) {
            return l;
        }
        l++;
    }
    return -1;
}
