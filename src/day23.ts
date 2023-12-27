import { Dictionary, ListDictionary } from "./dictionary";
import { readAsLines } from "./inputParser";

type location = {
  x: number;
  y: number;
};

function coordinatesAsString(x: number, y: number): string {
  return locationAsString({ x, y });
}

function locationAsString(location: location): string {
  return `${location.x},${location.y}`;
}

function stringToLocation(location: string): location {
  const parts = location.split(",");
  return {
    x: parseInt(parts[0]),
    y: parseInt(parts[1]),
  };
}

async function readMap(
  inputFileName: string,
): Promise<{ map: Dictionary<string>; start: location; end: location; paths: Set<string> }> {
  const lines = await readAsLines(inputFileName);
  const map = new Dictionary<string>();
  const paths = new Set<string>(); // Save us needing to loop through all map keys later
  let start: location;
  let end: location;

  let y = 0;
  while (y < lines.length) {
    let x = 0;
    while (x < lines.length) {
      map.set(coordinatesAsString(x, y), lines[y][x]);
      if (lines[y][x] != "#") {
        paths.add(coordinatesAsString(x, y));
      }

      if (y == 0 && lines[y][x] == ".") {
        start = { x, y };
      }
      if (y == lines.length - 1 && lines[y][x] == ".") {
        end = { x, y };
      }
      x++;
    }
    y++;
  }

  return { map, start, end, paths };
}

function findNodes(
  map: Dictionary<string>,
  start: location,
  end: location,
  paths: Set<string>,
  canClimb: boolean,
): { nodes: location[]; nodeSet: Set<string> } {
  const nodes = [start, end];
  const nodeSet = new Set<string>();
  nodeSet.add(locationAsString(start));
  nodeSet.add(locationAsString(end));
  for (const l of paths) {
    if (!nodeSet.has(l as string)) {
      const location = stringToLocation(l as string);
      if (potentialNeighbours(location, map, canClimb).length > 2) {
        nodes.push(location);
        nodeSet.add(l as string);
      }
    }
  }
  return { nodes, nodeSet };
}

function buildCondensedMap(
  map: Dictionary<string>,
  start: location,
  end: location,
  paths: Set<string>,
  canClimb: boolean,
): ListDictionary<{ node: string; steps: number }> {
  const { nodes, nodeSet } = findNodes(map, start, end, paths, canClimb);
  const condensedMap = new ListDictionary<{ node: string; steps: number }>();

  for (const n of nodes) {
    if (n.y != end.y) {
      // end has unique y
      const immediateNeighbours = potentialNeighbours(n, map, canClimb);
      for (const pathStart of immediateNeighbours) {
        let previous = n;
        let current = pathStart;
        let length = 1;
        while (!nodeSet.has(locationAsString(current))) {
          const next = potentialNeighbours(current, map, canClimb).filter(
            (p) => p.x != previous.x || p.y != previous.y,
          );
          // Can't be > 1 or would have reached another node
          if (next.length == 1) {
            length++;
            previous = current;
            current = next[0];
          } else {
            break;
          }
        }
        condensedMap.addTo(locationAsString(n), { node: locationAsString(current), steps: length });
      }
    }
  }
  return condensedMap;
}

function potentialNeighbours(
  current: location,
  map: Dictionary<string>,
  canClimb: boolean,
): location[] {
  const currentType = map.get(locationAsString(current));
  const potentials = [];
  if (canClimb || currentType == ">" || currentType == ".") {
    potentials.push({ x: current.x + 1, y: current.y });
  }
  if (canClimb || currentType == "<" || currentType == ".") {
    potentials.push({ x: current.x - 1, y: current.y });
  }
  if (canClimb || currentType == "v" || currentType == ".") {
    potentials.push({ x: current.x, y: current.y + 1 });
  }
  if (canClimb || currentType == "^" || currentType == ".") {
    // N.B. Property of the input that all edges except start and end are forest, and won't be checking after hitting end
    if (current.y > 0) {
      potentials.push({ x: current.x, y: current.y - 1 });
    }
  }
  return potentials.filter((p) => map.get(locationAsString(p)) != "#");
}

function findLongestHikeFromCondensedMap(
  condensedMap: ListDictionary<{ node: string; steps: number }>,
  start: location,
  end: location,
): number {
  let maxLength = 0;
  const toCheck: { seen: Set<string>; current: string; length: number }[] = [];
  const initial = new Set<string>();
  initial.add(locationAsString(start));
  toCheck.push({ seen: initial, current: locationAsString(start), length: 0 });

  while (toCheck.length > 0) {
    const path = toCheck.pop();
    const potentialSteps = condensedMap.get(path.current);
    const validSteps = potentialSteps.filter((p) => !path.seen.has(p.node));

    const ended = validSteps.filter((v) => v.node == locationAsString(end));
    const continuing = validSteps.filter((v) => v.node != locationAsString(end));

    let i = 0;
    while (i < continuing.length) {
      const seen = new Set<string>(path.seen);
      seen.add(continuing[i].node);
      toCheck.push({
        seen,
        current: continuing[i].node,
        length: path.length + continuing[i].steps,
      });
      i++;
    }

    // Should be 0 or 1
    if (ended.length == 1) {
      const length = path.length + ended[0].steps;
      if (length > maxLength) {
        maxLength = length;
      }
    }

    if (ended.length > 1) {
      console.log("help?");
    }
  }

  return maxLength;
}

export async function solve1(inputFileName: string): Promise<number> {
  const { map, start, end, paths } = await readMap(inputFileName);
  const condensedMap = buildCondensedMap(map, start, end, paths, false);
  return findLongestHikeFromCondensedMap(condensedMap, start, end);
}

export async function solve2(inputFileName: string): Promise<number> {
  const { map, start, end, paths } = await readMap(inputFileName);
  const condensedMap = buildCondensedMap(map, start, end, paths, true);
  return findLongestHikeFromCondensedMap(condensedMap, start, end);
}
