import { FOURIER_SHAPES, type FourierShape } from "@/fourier/types";
import type { SpeedPreset } from "@/utils/speed";
import { isOneOf, isPacked, speedParam, toQuery } from "./link";

/** A Fourier run as a link carries it: how many circles, and which drawing (a hand-drawn one packed in `path`). */
export type FourierLink = { circles?: number; shape?: FourierShape; path?: string };

export const fourierLink = {
  read: (params: URLSearchParams): FourierLink => {
    const link: FourierLink = {};
    const circles = Number(params.get("circles"));
    if (Number.isInteger(circles) && circles >= 1 && circles <= 256) link.circles = circles;
    const shape = params.get("shape");
    if (isOneOf(FOURIER_SHAPES, shape)) link.shape = shape;
    const path = params.get("path");
    if (isPacked(path)) link.path = path;
    return link;
  },
  write: (link: FourierLink & { circles: number }, speed: SpeedPreset) =>
    toQuery({
      circles: String(link.circles),
      ...(link.shape && { shape: link.shape }),
      ...(link.path && { path: link.path }),
      ...speedParam(speed),
    }),
};
