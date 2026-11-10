import { HashRecorder } from "./hash";
import { HeapRecorder } from "./heap";
import { TreeRecorder } from "./tree";
import type { Operation, StructureAlgorithm, StructureRun } from "./types";

/** Applies the operations to a fresh structure of the given kind, recording every step. */
export const recordStructure = (algorithm: StructureAlgorithm, ops: Operation[]): StructureRun => {
  if (algorithm === "heap") return new HeapRecorder(ops);
  if (algorithm === "chaining" || algorithm === "probing") return new HashRecorder(algorithm, ops);
  return new TreeRecorder(algorithm, ops);
};
