import { FOURIER_SHAPES, type FourierShape } from "./types";
import { isOneOf, isPacked, speedParam, toQuery, type LinkCodec } from "@/modules/link";

/** A Fourier run as a link carries it: how many circles, and which drawing (a hand-drawn one packed in `path`). */
export type FourierLink = { circles?: number; shape?: FourierShape; path?: string };

export const fourierLink: LinkCodec<FourierLink> = {
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
  write: (link, speed) =>
    toQuery({
      circles: link.circles?.toString(),
      ...(link.shape && { shape: link.shape }),
      ...(link.path && { path: link.path }),
      ...speedParam(speed),
    }),
};
