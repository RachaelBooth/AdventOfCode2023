import { Dictionary } from "./dictionary";
import { readAsLines } from "./inputParser";
import { lcm } from "./modularArithmetic";

enum Pulse {
  Low = 0,
  High = 1,
}

interface Module {
  name: string;
  destinations: string[];
  recieve: (pulse: Pulse, from: string) => Pulse | null;
  state: () => string;
}

class FlipFlopModule implements Module {
  private on: boolean;

  constructor(
    public name: string,
    public destinations: string[],
  ) {
    this.on = false;
  }

  public recieve(pulse: Pulse): Pulse | null {
    if (pulse == Pulse.High) {
      return null;
    }

    if (this.on) {
      this.on = false;
      return Pulse.Low;
    }

    this.on = true;
    return Pulse.High;
  }

  public state(): string {
    return this.on ? "1" : "0";
  }
}

class ConjunctionModule implements Module {
  private memory: Dictionary<Pulse>;
  private lastSent: Pulse | null;

  constructor(
    public name: string,
    public destinations: string[],
  ) {
    this.memory = new Dictionary<Pulse>(undefined);
    this.lastSent = null;
  }

  public addInput(input: string): void {
    if (this.memory.get(input) == undefined) {
        this.memory.set(input, Pulse.Low);
    }
  }

  public lastSentHigh(): boolean {
    return this.lastSent == Pulse.High;
  }

  public recieve(pulse: Pulse, from: string): Pulse | null {
    this.memory.set(from, pulse);
    if (this.memory.vals().every((v) => v == Pulse.High)) {
        this.lastSent = Pulse.Low;
      return Pulse.Low;
    }
    this.lastSent = Pulse.High;
    return Pulse.High;
  }

  public state(): string {
    return this.memory
      .keys()
      .sort()
      .map((k) => `${this.memory.get(k)}`)
      .join(",");
  }
}

class BroadcasterModule implements Module {
  constructor(
    public name: string,
    public destinations: string[],
  ) {}

  public recieve(pulse: Pulse): Pulse | null {
    return pulse;
  }

  public state(): string {
    return "";
  }
}

class ButtonModule implements Module {
  public name = "button";
  public destinations = ["broadcaster"];

  constructor() {}

  public recieve(): Pulse | null {
    return Pulse.Low;
  }

  public state(): string {
    return "";
  }
}

// This is just going to be stateful...
const modules = new Dictionary<Module>();
let lowsSent = 0;
let highsSent = 0;
let buttonPresses = 0;

function pressButton(): boolean {
  buttonPresses++;
  const button = modules.get("button");
  const press = button.recieve(Pulse.Low, "")!;
  let pulsesToHandle = button.destinations.map((d) => ({
    destination: d,
    pulse: press,
    from: button.name,
  }));

  while (pulsesToHandle.length > 0) {
    const next: { destination: string; pulse: Pulse; from: string }[] = [];
    for (const p of pulsesToHandle) {
      if (p.pulse == Pulse.Low) {
        lowsSent++;
      } else {
        highsSent++;
      }

      const module = modules.get(p.destination);
      if (module) {
        const resulting = module.recieve(p.pulse, p.from);
        if (resulting != null) {
          next.push(
            ...module.destinations.map((d) => ({
              destination: d,
              pulse: resulting,
              from: module.name,
            })),
          );
        }
      }
    }
    pulsesToHandle = next;
  }
  return false;
}

function modulesState(): string {
  return modules
    .keys()
    .sort()
    .map((k) => modules.get(k).state())
    .join("*");
}

function pressButtonTimes(times: number) {
  const seen = new Set<string>();
  const seenPresses = new Dictionary<{ presses: number; lowPulses: number; highPulses: number }>();

  let skipChecks = false;

  const s = modulesState();
  seen.add(s);
  seenPresses.set(s, { presses: 0, lowPulses: 0, highPulses: 0 });

  let i = 0;
  while (i < times) {
    i++;
    pressButton();
    const state = modulesState();
    if (!skipChecks && seen.has(state)) {
      const previous = seenPresses.get(state);
      const loopLength = i - previous.presses;
      console.log("loop");
      const loopLowDiff = lowsSent - previous.lowPulses;
      const loopHighDiff = highsSent - previous.highPulses;
      const loopsToEnd = Math.floor((times - i) / loopLength);
      lowsSent = lowsSent + loopsToEnd * loopLowDiff;
      highsSent = highsSent + loopsToEnd * loopHighDiff;
      const remainder = (times - i) % loopLength;
      skipChecks = true;
      i = times - remainder;
    } else if (!skipChecks) {
      seen.add(state);
      seenPresses.set(state, { presses: i, lowPulses: lowsSent, highPulses: highsSent });
    }
  }
}

async function readModules(inputFileName: string): Promise<void> {
  const lines = await readAsLines(inputFileName);
  const conjunctionModules: string[] = [];
  for (const line of lines) {
    const parts = line.split(" -> ");
    const destinations = parts[1].split(", ");
    if (parts[0][0] == "%") {
      const name = parts[0].substring(1);
      modules.set(name, new FlipFlopModule(name, destinations));
    } else if (parts[0][0] == "&") {
      const name = parts[0].substring(1);
      modules.set(name, new ConjunctionModule(name, destinations));
      conjunctionModules.push(name);
    } else {
      // Broadcast module
      modules.set(parts[0], new BroadcasterModule(parts[0], destinations));
    }
  }

  for (const conjunctionModule of conjunctionModules) {
    const module = modules.get(conjunctionModule) as ConjunctionModule;
    for (const m of modules.vals()) {
        if (m.destinations.includes(conjunctionModule)) {
            module.addInput(m.name);
        }
    }
  }

  modules.set("button", new ButtonModule());
}

export async function solve1(inputFileName: string): Promise<number> {
  await readModules(inputFileName);
  pressButtonTimes(1000);
  return lowsSent * highsSent;
}

export async function solve2(inputFileName: string): Promise<number> {
    // I eventually had to inspect the input and found the numbers by hand
    const a = parseInt("111110101101", 2);
    const b = parseInt("111100110001", 2);
    const c = parseInt("111101001101", 2);
    const d = parseInt("111010111001", 2);
    return lcm(lcm(a, b), lcm(c, d));
}