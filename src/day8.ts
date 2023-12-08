import { Dictionary, ListDictionary } from "./dictionary";
import { readAsLines } from "./inputParser";
import * as _ from "lodash";

type nodeNeighbours = {
    left: string;
    right: string;
}

type maps = {
    instructions: string;
    network: Dictionary<nodeNeighbours>;
}

async function parseInput(inputFileName: string): Promise<maps> {
    const lines = await readAsLines(inputFileName);
    const instructions = lines[0];
    const network = new Dictionary<nodeNeighbours>();
    let i = 2;
    while (i < lines.length) {
        const parts = lines[i].split(" = ");
        const neighbours = parts[1].split(",").map(n => _.trim(n, "() "));
        network.set(parts[0], { left: neighbours[0], right: neighbours[1] });
        i++;
    }
    return { instructions, network };
}

function stepsNeeded(start: string, end: string, maps: maps): number {
    const { instructions, network } = maps;
    let steps = 0;
    let current = start;
    while (true) {
        let instruction = instructions[steps % instructions.length];
        steps++;
        let neighbours = network.get(current);
        current = instruction == "L" ? neighbours.left : neighbours.right;

        if (current == end && steps % instructions.length == 0) {
            return steps;
        }
        // N.B. Only have a loop if at the same point in the instructions, so can't help here
        // If there is a solution then by the time you find a loop you'll already have seen end at the right point
    }
}

function stepsNeededWithLoopLength(start: string, maps: maps): { steps: number, loopLength: number } {
    const { instructions, network } = maps;
    let steps = 0;
    let current = start;
    let seen = new ListDictionary<number>();
    seen.addTo(start, 0);
    let path = [start];
    let endAtEndSteps = [];
    while (true) {
        let instruction = instructions[steps % instructions.length];
        steps++;
        let neighbours = network.get(current);
        current = instruction == "L" ? neighbours.left : neighbours.right;

        let i = steps % instructions.length;
        if (seen.includesWhere(current, s => s % instructions.length == i)) {
            // Completed a loop
            // Expect this to be length 1
            const previous = seen.valuesWhere(current, s => s % instructions.length == i)[0];
            const loopLength = steps - previous;

            // N.B. Either this must already have seen the end at the end of the instructions or it never will
            const endsInLoop = endAtEndSteps.filter(s => s >= previous);
            if (endsInLoop.length == 0) {
                console.log("Help, end not seen at expected point");
                throw new Error();
            }
            if (endsInLoop.length > 1) {
                console.log("More than one potential end, rethink logic");
                throw new Error();
            }

            // This might ignore a solution where we haven't started looping yet for one or more ghosts
            // But the input is probably designed so that isn't a problem
            return { steps: endsInLoop[0], loopLength };
        } 
        
        if (current.endsWith("Z") && steps % instructions.length == 0) {
            // Reached end at end of instruction loop
            endAtEndSteps.push(steps);
        } 

        path.push(current);
        seen.addTo(current, steps);
    }
}

export async function solve1(inputFileName: string): Promise<number> {
    const maps = await parseInput(inputFileName);
    return stepsNeeded("AAA", "ZZZ", maps);
}

export async function solve2(inputFileName: string): Promise<number> {
    const maps = await parseInput(inputFileName);
    const { network } = maps;
    const starts = network.keys().filter(k => k.toString().endsWith("A"));
    const stepsToEnds = starts.map(s => stepsNeededWithLoopLength(s.toString(), maps))
    const congruence = reduceModularEquations(...stepsToEnds.map(s => normaliseCongruence({ value: s.steps, modulus: s.loopLength })));
    let result = congruence.value;
    // To check each has actually reached the loop
    while (stepsToEnds.some(s => s.steps > result)) {
        result = result + congruence.modulus;
    }
    return result;
}

function lcm(a: number, b: number): number {
    const [l, h] = [Math.min(a, b), Math.max(a, b)];
    let m = h;
    while (m % l !== 0) {
        m = m + h;
    }
    return m;
}

function bezoutCoefficients(a: number, b: number): { gcd: number, s: number, t: number } {
    if (a < b) {
        var flipped = bezoutCoefficients(b, a);
        return { gcd: flipped.gcd, s: flipped.t, t: flipped.s };
    }

    var R = [a, b];
    var Q = [0];
    var S = [1, 0];
    var T = [0, 1];

    var i = 1;
    while (true) {
        R.push(R[i - 1] % R[i]);
        if (R[i + 1] == 0) {
            return { gcd: R[i], s: S[i], t: T[i] };
        }

        Q.push((R[i - 1] - R[i + 1]) / R[i]);
        S.push(S[i - 1] - Q[i] * S[i]);
        T.push(T[i - 1] - Q[i] * T[i]);
        i++;
    }
}

function reduceModularEquations(...congruences: { value: number, modulus: number}[]): { value: number, modulus: number } {
    return _.reduce(congruences, (c, next) => reduceModularEquationPair(c, next));
}

function normaliseCongruence(congruence: { value: number, modulus: number}): { value: number, modulus: number } {
    let v = congruence.value;
    while (v < 0) {
        v = v + congruence.modulus;
    }
    return { value: v % congruence.modulus, modulus: congruence.modulus };
}

function reduceModularEquationPair(first: { value: number, modulus: number}, second: { value: number, modulus: number }) {
    const coefficients = bezoutCoefficients(first.modulus, second.modulus);
    if (coefficients.gcd != 1 && (first.value - second.value) % coefficients.gcd != 0) {
        console.log("GCD != 1 and values are incompatible - no solution");
        console.log(first, second);
        throw new Error();
    }

    var modulus = first.modulus * second.modulus / coefficients.gcd;
    var value = (multiplyMod(modulus, first.value, coefficients.t, second.modulus) + multiplyMod(modulus, second.value, coefficients.s, first.modulus)) / coefficients.gcd;
    return { value: value % modulus, modulus };
}

function multiplyMod(modulus: number, ...values: number[]): number {
    if (values.length > 2) {
        return _.reduce(values, (c, next) => multiplyMod(modulus, c, next));
    }

    if (values.length == 1) {
        return values[0] % modulus;
    }

    return (values[0] * values[1]) % modulus;
}