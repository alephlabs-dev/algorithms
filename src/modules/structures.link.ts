import { structurePresets, structureSizes, type StructurePreset, type StructureSize } from "@/structures/presets";
import type { SpeedPreset } from "@/utils/speed";
import { isOneOf, speedParam, toQuery } from "./link";

/** A data structure's run as a link carries it: the operations so far, and what "new values" makes. */
export type StructuresLink = { ops?: string; size?: StructureSize; preset?: StructurePreset };

export const structuresLink = {
  read: (params: URLSearchParams): StructuresLink => {
    const link: StructuresLink = {};
    const ops = params.get("ops");
    if (ops && /^[isd0-9.]+$/.test(ops)) link.ops = ops;
    const size = params.get("values");
    if (isOneOf(structureSizes, size)) link.size = size;
    const preset = params.get("order");
    if (isOneOf(structurePresets, preset)) link.preset = preset;
    return link;
  },
  write: (link: Required<StructuresLink>, speed: SpeedPreset) =>
    toQuery({ ops: link.ops, values: link.size, order: link.preset, ...speedParam(speed) }),
};
