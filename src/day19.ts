import { readAsLines } from "./inputParser";

type Part = {
  x: number;
  m: number;
  a: number;
  s: number;
};

type CoordinateRange = {
  min: number;
  max: number;
  minInclusive: boolean;
  maxInclusive: boolean;
};

type PartRange = {
  x: CoordinateRange;
  m: CoordinateRange;
  a: CoordinateRange;
  s: CoordinateRange;
};

function everything(): PartRange {
  return {
    x: { min: -Infinity, minInclusive: false, max: Infinity, maxInclusive: false },
    m: { min: -Infinity, minInclusive: false, max: Infinity, maxInclusive: false },
    a: { min: -Infinity, minInclusive: false, max: Infinity, maxInclusive: false },
    s: { min: -Infinity, minInclusive: false, max: Infinity, maxInclusive: false },
  };
}

function isPointlessCoordinateRange(range: CoordinateRange): boolean {
  if (range.min > range.max) {
    return true;
  }

  if (range.min < range.max) {
    return false;
  }

  if (range.min == Infinity || range.max == -Infinity) {
    return true;
  }

  // Single value
  return range.minInclusive && range.maxInclusive;
}

function isPointless(range: PartRange): boolean {
  return (
    isPointlessCoordinateRange(range.x) ||
    isPointlessCoordinateRange(range.m) ||
    isPointlessCoordinateRange(range.a) ||
    isPointlessCoordinateRange(range.s)
  );
}

function intersectCoordinate(first: CoordinateRange, second: CoordinateRange): CoordinateRange {
  const min = Math.max(first.min, second.min);
  const max = Math.min(first.max, second.max);
  const minInclusive =
    (first.minInclusive || first.min < min) && (second.minInclusive || second.min < min);
  const maxInclusive =
    (first.maxInclusive || first.max > max) && (second.maxInclusive || second.max > max);
  // This range may be nonsensical
  return { min, minInclusive, max, maxInclusive };
}

function intersect(first: PartRange, second: PartRange): PartRange {
  return {
    x: intersectCoordinate(first.x, second.x),
    m: intersectCoordinate(first.m, second.m),
    a: intersectCoordinate(first.a, second.a),
    s: intersectCoordinate(first.s, second.s),
  };
}

function notRange(range: PartRange): PartRange[] {
  const result: PartRange[] = [];

  if (range.x.min > -Infinity) {
    result.push({
      ...everything(),
      x: {
        min: -Infinity,
        minInclusive: false,
        max: range.x.min,
        maxInclusive: !range.x.minInclusive,
      },
    });
  }

  if (range.x.max < Infinity) {
    result.push({
      ...everything(),
      x: {
        min: range.x.max,
        minInclusive: !range.x.maxInclusive,
        max: Infinity,
        maxInclusive: false,
      },
    });
  }

  if (range.m.min > -Infinity) {
    result.push({
      ...everything(),
      x: range.x,
      m: {
        min: -Infinity,
        minInclusive: false,
        max: range.m.min,
        maxInclusive: !range.m.minInclusive,
      },
    });
  }

  if (range.m.max < Infinity) {
    result.push({
      ...everything(),
      x: range.x,
      m: {
        min: range.m.max,
        minInclusive: !range.m.maxInclusive,
        max: Infinity,
        maxInclusive: false,
      },
    });
  }

  if (range.a.min > -Infinity) {
    result.push({
      ...everything(),
      x: range.x,
      m: range.m,
      a: {
        min: -Infinity,
        minInclusive: false,
        max: range.a.min,
        maxInclusive: !range.a.minInclusive,
      },
    });
  }

  if (range.a.max < Infinity) {
    result.push({
      ...everything(),
      x: range.x,
      m: range.m,
      a: {
        min: range.a.max,
        minInclusive: !range.a.maxInclusive,
        max: Infinity,
        maxInclusive: false,
      },
    });
  }

  if (range.s.min > -Infinity) {
    result.push({
      ...range,
      s: {
        min: -Infinity,
        minInclusive: false,
        max: range.s.min,
        maxInclusive: !range.s.minInclusive,
      },
    });
  }

  if (range.s.max < Infinity) {
    result.push({
      ...range,
      s: {
        min: range.s.max,
        minInclusive: !range.s.maxInclusive,
        max: Infinity,
        maxInclusive: false,
      },
    });
  }

  return result;
}

function without(current: PartRange, remove: PartRange): PartRange[] {
  return notRange(remove).map((r) => intersect(current, r));
}

// Combine to one list of accepted ranges
function readWorkflows(lines: string[]): PartRange[] {
  const workflows = {};
  for (const line of lines) {
    const n = line.split("{");
    const name = n[0];
    const rules = n[1].substring(0, n[1].length - 1).split(",");
    const ranges: { range: PartRange; result: string }[] = [];
    let remainingRanges = [everything()];
    let i = 0;
    while (i < rules.length) {
      const rule = rules[i];
      const s = rule.split(":");
      if (s.length == 1) {
        // No condition
        ranges.push(...remainingRanges.map((r) => ({ range: r, result: rule })));
      } else {
        const comparator = s[0].includes(">") ? ">" : "<";
        const parts = s[0].split(comparator);
        const r = everything();
        if (comparator == ">") {
          r[parts[0]].min = parseInt(parts[1]);
        } else {
          r[parts[0]].max = parseInt(parts[1]);
        }
        ranges.push(...remainingRanges.map((rr) => ({ range: intersect(rr, r), result: s[1] })));
        remainingRanges = remainingRanges.flatMap((rr) => without(rr, r));
      }
      i++;
    }
    workflows[name] = ranges;
  }

  const acceptedRanges: PartRange[] = [];

  const start = "in";
  const toProcess = [
    {
      nextWorkflow: start,
      range: everything(),
    },
  ];

  while (toProcess.length > 0) {
    const current = toProcess.pop()!;
    const workflow = workflows[current.nextWorkflow];
    const after = workflow
      .map((w) => ({ range: intersect(w.range, current.range), nextWorkflow: w.result }))
      .filter((a) => !isPointless(a.range));
    for (const item of after) {
      if (item.nextWorkflow == "A") {
        acceptedRanges.push(item.range);
      } else if (item.nextWorkflow != "R") {
        toProcess.push(item);
      }
    }
  }

  return acceptedRanges;
}

function readParts(lines: string[]): Part[] {
  const parts: Part[] = [];
  for (const line of lines) {
    const sections = line
      .substring(1, line.length - 1)
      .split(",")
      .map((l) => parseInt(l.split("=")[1]));
    // Conveniently all in the same order
    parts.push({
      x: sections[0],
      m: sections[1],
      a: sections[2],
      s: sections[3],
    });
  }
  return parts;
}

function coordinateRangeContainsCoordinate(range: CoordinateRange, coordinate: number) {
  if (coordinate < range.min || coordinate > range.max) {
    return false;
  }

  if (coordinate == range.min && !range.minInclusive) {
    return false;
  }

  if (coordinate == range.max && !range.maxInclusive) {
    return false;
  }

  return true;
}

function rangeContainsPart(range: PartRange, part: Part) {
  return (
    coordinateRangeContainsCoordinate(range.x, part.x) &&
    coordinateRangeContainsCoordinate(range.m, part.m) &&
    coordinateRangeContainsCoordinate(range.a, part.a) &&
    coordinateRangeContainsCoordinate(range.s, part.s)
  );
}

async function readInput(
  inputFileName: string,
): Promise<{ acceptedRanges: PartRange[]; parts: Part[] }> {
  const lines = await readAsLines(inputFileName);
  const workflows: string[] = [];
  const parts: string[] = [];
  let inWorkflowsSection = true;
  for (const line of lines) {
    if (line == "") {
      inWorkflowsSection = false;
    } else if (inWorkflowsSection) {
      workflows.push(line);
    } else {
      parts.push(line);
    }
  }

  const acceptedRanges = readWorkflows(workflows);
  const parsedParts = readParts(parts);
  return { acceptedRanges, parts: parsedParts };
}

export async function solve1(inputFileName: string): Promise<number> {
  const { acceptedRanges, parts } = await readInput(inputFileName);

  const acceptedParts = parts.filter((part) =>
    acceptedRanges.some((r) => rangeContainsPart(r, part)),
  );
  return acceptedParts.reduce((curr, next) => curr + next.x + next.m + next.a + next.s, 0);
}

function countPointsIn(range: CoordinateRange): number {
  const points = range.max - range.min;
  if (range.maxInclusive && range.minInclusive) {
    return points + 1;
  }

  if (!range.maxInclusive && !range.minInclusive) {
    return points - 1;
  }

  return points;
}

export async function solve2(inputFileName: string): Promise<number> {
  const { acceptedRanges } = await readInput(inputFileName);

  const box: PartRange = {
    x: { min: 1, minInclusive: true, max: 4000, maxInclusive: true },
    m: { min: 1, minInclusive: true, max: 4000, maxInclusive: true },
    a: { min: 1, minInclusive: true, max: 4000, maxInclusive: true },
    s: { min: 1, minInclusive: true, max: 4000, maxInclusive: true },
  };
  const acceptedInBox = acceptedRanges.map((ar) => intersect(ar, box));

  let points = 0;
  // Think I've defined these so they should be non-overlapping
  for (const r of acceptedInBox) {
    const x = countPointsIn(r.x);
    const m = countPointsIn(r.m);
    const a = countPointsIn(r.a);
    const s = countPointsIn(r.s);
    points = points + x * m * a * s;
  }
  return points;
}
