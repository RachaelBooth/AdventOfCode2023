import { readAsLines } from "./inputParser"

type pattern = {
    rows: { [key: number]: Set<number> },
    columns: { [key: number]: Set<number> },
    rowCount: number,
    columnCount: number,
}

type lineOfReflection = {
    type: "vertical" | "horizontal",
    afterIndex: number
}

function parsePattern(section: string[]): pattern {
    const rows = {};
    const columns = {};
    let y = 0;
    let x = 0;
    while (y < section.length) {
        rows[y] = new Set<number>();
        x = 0;
        while (x < section[y].length) {
            if (y == 0) {
                columns[x] = new Set<number>();
            }

            if (section[y][x] == '#') {
                rows[y].add(x);
                columns[x].add(y);
            }
            x++;
        }
        y++;
    }

    return { rows, columns, rowCount: y, columnCount: x };
}

async function readPatterns(inputFileName: string): Promise<pattern[]> {
    const lines = await readAsLines(inputFileName);
    const sections = [];
    let section = [];
    let i = 0;
    while (i < lines.length) {
        if (lines[i] != "") {
            section.push(lines[i]);
        } else {
            sections.push(section);
            section = [];
        }
        i++;
    }
    sections.push(section);
    return sections.map(parsePattern);
}

function symmetricDifference<T>(a: Set<T>, b: Set<T>): Set<T> {
    const _difference = new Set(a);
    for (const element of b) {
        if (_difference.has(element)) {
            _difference.delete(element);
        } else {
            _difference.add(element);
        }
    }

    return _difference;
}

function isReflection(index: number, rocks: { [key: number]: Set<number> }, size: number, blur: number): boolean {
    let b = 0;
    let i = 0;
    while (index + 1 + i < size && index - i >= 0) {
        b = b + symmetricDifference(rocks[index - i], rocks[index + 1 + i]).size;
        if (b > blur) {
            return false;
        }
        i++;
    }
    return b == blur;
}

function findReflections(pattern: pattern, blur: number): lineOfReflection[] {
    const reflections = [];

    let x = 0;
    while (x < pattern.columnCount - 1) {
        if (isReflection(x, pattern.columns, pattern.columnCount, blur)) {
            reflections.push({ afterIndex: x, type: "vertical"});
        }
        x++;
    }

    let y = 0;
    while (y < pattern.rowCount - 1) {
        if (isReflection(y, pattern.rows, pattern.rowCount, blur)) {
            reflections.push({ afterIndex: y, type: "horizontal" });
        }
        y++;
    }

    return reflections;
}

export async function solve1(inputFileName: string): Promise<number> {
    const patterns = await readPatterns(inputFileName);
    const linesOfReflection = patterns.flatMap(p => findReflections(p, 0));
    return linesOfReflection.reduce((curr, next) => next.type == "horizontal" ? curr + 100 * (next.afterIndex + 1) : curr + (next.afterIndex + 1), 0);
}

export async function solve2(inputFileName: string): Promise<number> {
    const patterns = await readPatterns(inputFileName);
    const linesOfReflection = patterns.flatMap(p => findReflections(p, 1));
    return linesOfReflection.reduce((curr, next) => next.type == "horizontal" ? curr + 100 * (next.afterIndex + 1) : curr + (next.afterIndex + 1), 0);
}