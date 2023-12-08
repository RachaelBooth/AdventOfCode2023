import * as _ from "lodash";

// Should make this nicer to use than a collection of functions, but I haven't
export type congruence = {
  value: number;
  modulus: number;
};

export function lcm(a: number, b: number): number {
  if (b < a) {
    return lcm(b, a);
  }

  let m = b;
  while (m % a !== 0) {
    m = m + b;
  }
  return m;
}

// gcd = sa + tb
function bezoutCoefficients(
  a: number,
  b: number,
): { gcd: number; s: number; t: number } {
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

export function reduceModularEquations(
  ...congruences: congruence[]
): congruence {
  return _.reduce(congruences, (c, next) => reduceModularEquationPair(c, next));
}

export function normaliseCongruence(congruence: congruence): congruence {
  let v = congruence.value;
  while (v < 0) {
    v = v + congruence.modulus;
  }
  return { value: v % congruence.modulus, modulus: congruence.modulus };
}

export function reduceModularEquationPair(
  first: congruence,
  second: congruence,
) {
  const bezout = bezoutCoefficients(first.modulus, second.modulus);
  if (bezout.gcd != 1 && (first.value - second.value) % bezout.gcd != 0) {
    console.log("GCD != 1 and values are incompatible - no solution");
    console.log(first, second);
    throw new Error();
  }

  var modulus = (first.modulus * second.modulus) / bezout.gcd;
  var value =
    (multiplyMod(modulus, first.value, bezout.t, second.modulus) +
      multiplyMod(modulus, second.value, bezout.s, first.modulus)) /
    bezout.gcd;
  return { value: value % modulus, modulus };
}

export function multiplyMod(modulus: number, ...values: number[]): number {
  if (values.length > 2) {
    return _.reduce(
      values,
      (c, next) => multiplyMod(modulus, c, next),
      values[0] % modulus,
    );
  }

  if (values.length == 1) {
    return values[0] % modulus;
  }

  return (values[0] * values[1]) % modulus;
}
