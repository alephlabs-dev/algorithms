/* How different two colors look to a person: CIEDE2000 on CIELAB (D65), for tests that keep tones apart. */

import type { RGB } from "./theme";

export type Lab = [number, number, number];

const linear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

/** An sRGB color in CIELAB, with the D65 white point. */
export const rgbToLab = ([r, g, b]: RGB): Lab => {
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)];
  const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

const deg = (rad: number) => (rad * 180) / Math.PI;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** CIEDE2000 color difference between two CIELAB colors (Sharma, Wu and Dalal, 2005). */
export const deltaE2000Lab = ([l1, a1, b1]: Lab, [l2, a2, b2]: Lab) => {
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const cMean7 = ((c1 + c2) / 2) ** 7;
  const g = 0.5 * (1 - Math.sqrt(cMean7 / (cMean7 + 25 ** 7)));
  const ap1 = (1 + g) * a1;
  const ap2 = (1 + g) * a2;
  const cp1 = Math.hypot(ap1, b1);
  const cp2 = Math.hypot(ap2, b2);
  const hue = (b: number, ap: number) => (b === 0 && ap === 0 ? 0 : (deg(Math.atan2(b, ap)) + 360) % 360);
  const hp1 = hue(b1, ap1);
  const hp2 = hue(b2, ap2);

  const dL = l2 - l1;
  const dC = cp2 - cp1;
  let dh = 0;
  if (cp1 * cp2 !== 0) {
    dh = hp2 - hp1;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(cp1 * cp2) * Math.sin(rad(dh / 2));

  const lMean = (l1 + l2) / 2;
  const cpMean = (cp1 + cp2) / 2;
  let hMean = hp1 + hp2;
  if (cp1 * cp2 !== 0) {
    if (Math.abs(hp1 - hp2) <= 180) hMean /= 2;
    else hMean = hMean < 360 ? (hMean + 360) / 2 : (hMean - 360) / 2;
  }
  const t =
    1 -
    0.17 * Math.cos(rad(hMean - 30)) +
    0.24 * Math.cos(rad(2 * hMean)) +
    0.32 * Math.cos(rad(3 * hMean + 6)) -
    0.2 * Math.cos(rad(4 * hMean - 63));
  const sl = 1 + (0.015 * (lMean - 50) ** 2) / Math.sqrt(20 + (lMean - 50) ** 2);
  const sc = 1 + 0.045 * cpMean;
  const sh = 1 + 0.015 * cpMean * t;
  const cpMean7 = cpMean ** 7;
  const rt =
    -2 * Math.sqrt(cpMean7 / (cpMean7 + 25 ** 7)) * Math.sin(rad(60 * Math.exp(-(((hMean - 275) / 25) ** 2))));
  return Math.sqrt((dL / sl) ** 2 + (dC / sc) ** 2 + (dH / sh) ** 2 + rt * (dC / sc) * (dH / sh));
};

/** CIEDE2000 color difference between two sRGB colors. */
export const deltaE2000 = (a: RGB, b: RGB) => deltaE2000Lab(rgbToLab(a), rgbToLab(b));
