import { localized } from "@/i18n";
import type { HashFrame, StructureRun, TreeFrame } from "@/structures";

type Side = "left" | "right";
type Kind = "insert" | "search" | "delete";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

const text = localized({
  en: {
    idleHeap: "Press play to build the heap, or type a value below and insert or find it, or pop the minimum.",
    idleTable: "Press play to fill the table, or type a value below and insert, find or delete it.",
    idleTree: "Press play to build the tree, or type a value below and insert, find or delete it.",
    // Trees
    treeVerb: { insert: "Insert", search: "Search for", delete: "Delete" } as Record<Kind, string>,
    emptyRoot: (verb: string, v: number) => `${verb} ${v}: the tree is empty, so it becomes the root.`,
    startRoot: (verb: string, v: number) => `${verb} ${v}: start at the root.`,
    here: (v: number, at: number | string) => `${v} = ${at}: this is it.`,
    goLeft: (v: number, at: number | string) => `${v} < ${at}: go left.`,
    goRight: (v: number, at: number | string) => `${v} > ${at}: go right.`,
    isRoot: (v: number | string) => `${v} is the root.`,
    goesSide: (v: number | string, side: Side, parent: number | string) => `Nothing there: ${v} goes ${side} of ${parent}.`,
    duplicateTree: (v: number | string) => `${v} is already in the tree: nothing to insert.`,
    foundAfter: (v: number | string, steps: number) => `Found ${v}, after ${steps} ${steps === 1 ? "step" : "steps"} down.`,
    ranOut: (v: number) => `Ran out of tree: ${v} isn't there.`,
    noChildren: (v: number) => `${v} has no children: just take it out.`,
    oneChild: (v: number) => `${v} has one child, which takes its place.`,
    twoChildren: (v: number) => `${v} has two children: find its successor, the smallest value on its right.`,
    successor: (v: number) => `The successor is ${v}: copy it up, then remove the node it came from.`,
    gone: (v: number) => `${v} is gone.`,
    goneReplaced: (v: number, child: number | string) => `${v} is gone; ${child} took its place.`,
    rotateNeeded: (v: number, balance: number) => `Back up at ${v}: balance ${signed(balance)}, one side is two taller. Rotate.`,
    stillFine: (v: number, height: number, balance: number) =>
      `Back up at ${v}: height ${height}, balance ${signed(balance)}. Still fine.`,
    rotate: (direction: Side, at: string, up: number | string, pivot: number | string) =>
      `Rotate ${direction} at ${at}: ${up} comes up, ${pivot} goes down to its ${direction}.`,
    theTop: "the top",
    balanced: (rotations: number, height: number) =>
      `Balanced again, after ${rotations === 1 ? "one rotation" : `${rotations} rotations`}. ${height} tall.`,
    treeDone: (values: number, height: number) =>
      `Done. The tree has ${values} ${values === 1 ? "value" : "values"} and is ${height} tall.`,
    // Heaps
    heapInsert: (v: number) => `Insert ${v}: it starts at the end, in the next free slot.`,
    heapFind: (v: number) => `Find ${v}: a heap has no left-or-right order to steer by, so check slot after slot.`,
    popMin: (v: number) => `Pop the minimum, ${v}: it's always at the root, slot 0.`,
    deleteFind: (v: number) => `Delete ${v}: find it first.`,
    intoRoot: (v: number | string) => `${v} goes into slot 0: the root.`,
    intoSlot: (v: number | string, slot: number, parent: number, parentSlot: number) =>
      `${v} goes into slot ${slot}, under ${parent} (slot ${parentSlot}).`,
    swapUp: (me: number | string, other: number | string) => `${me} < ${other}, its parent: out of order. Swap up.`,
    staysUp: (me: number | string, other: number | string) => `${me} ≥ ${other}, its parent: in order. It stays.`,
    swapDown: (me: number | string, other: number | string) => `${me} > ${other}, the smaller child: out of order. Swap down.`,
    staysDown: (me: number | string, other: number | string) => `${me} ≤ ${other}, the smaller child: in order. It stays.`,
    movesUp: (v: number | string, slot: number, other: number | string) => `${v} moves up to slot ${slot}; ${other} comes down.`,
    movesDown: (v: number | string, slot: number, other: number | string) => `${v} moves down to slot ${slot}; ${other} comes up.`,
    scanMatch: (slot: number, v: number) => `Slot ${slot}: ${v}. Found it.`,
    scanMiss: (slot: number, held: number | string, v: number) => `Slot ${slot} holds ${held}, not ${v}. Next slot.`,
    foundChecking: (v: number | string, slots: number) => `Found ${v}, after checking ${plural(slots, "slot")}.`,
    notInHeap: (v: number) => `Checked every slot: ${v} isn't in the heap.`,
    take: (v: number, slot: number) => `Take ${v} out of slot ${slot}, leaving a hole.`,
    lift: (v: number) => `The last value, ${v}, moves into the hole. Now it has to find its level.`,
    lastSlot: (v: number) => `${v} was in the last slot: just remove it.`,
    heapEmpty: "Done. The heap is empty.",
    heapDone: (swaps: number, min: number) =>
      `Done${swaps ? `, after ${plural(swaps, "swap")}` : ""}. The minimum, ${min}, is at the root.`,
    // Hash tables
    unit: { bucket: "bucket", slot: "slot" },
    hashVerb: { insert: "Insert", search: "Find", delete: "Delete" } as Record<Kind, string>,
    hashStart: (verb: string, v: number, unit: string) => `${verb} ${v}: first, work out its ${unit}.`,
    hash: (v: number, m: number, b: number, unit: string) => `${v} mod ${m} = ${b}: ${unit} ${b}. No searching to get there.`,
    chainMatch: (v: number) => `${v} = ${v}: there it is.`,
    chainNext: (held: number | string, v: number) => `${held} ≠ ${v}: next in the bucket.`,
    slotEmpty: (b: number) => `Slot ${b} is empty: the walk stops here.`,
    slotMarker: (b: number) => `Slot ${b} has a marker from a delete: keep going.`,
    slotMatch: (b: number, v: number) => `Slot ${b} holds ${v}: there it is.`,
    slotTaken: (b: number, held: number | string, next: number) => `Slot ${b} holds ${held}: taken. Try slot ${next}.`,
    chainAdd: (v: number | string, b: number) => `Not in the bucket: add ${v} to the end of bucket ${b}.`,
    probedPast: (v: number | string, b: number, past: number) =>
      `${v} goes in slot ${b}, ${plural(past, "slot")} past where it started.`,
    straightIn: (v: number | string, b: number) => `${v} goes straight into slot ${b}.`,
    duplicateTable: (v: number | string) => `${v} is already in the table: nothing to insert.`,
    foundIn: (v: number | string, unit: string, b: number) => `Found ${v} in ${unit} ${b}.`,
    endOfBucket: (v: number) => `End of the bucket: ${v} isn't in the table.`,
    notInTable: (v: number) =>
      `${v} isn't in the table: had it been inserted, the walk would have reached it before an empty slot.`,
    marker: (b: number) => `Leave a marker in slot ${b}: a find for a value further along mustn't stop here.`,
    unlink: (v: number, b: number) => `Unlink ${v} from bucket ${b}.`,
    full: (v: number) => `Every slot is taken: there's no room for ${v}. Real tables grow before this happens.`,
    tableDone: (count: number, m: number, unit: string, load: string) =>
      `Done. ${plural(count, "value")} in ${m} ${unit}s: a load of ${load}.`,
  },
  es: {
    idleHeap: "Presiona play para armar el montículo. Abajo: inserta o busca un valor, o saca el mínimo.",
    idleTable: "Presiona play para llenar la tabla, o escribe un valor abajo para insertarlo, buscarlo o borrarlo.",
    idleTree: "Presiona play para construir el árbol, o escribe un valor abajo para insertarlo, buscarlo o borrarlo.",
    treeVerb: { insert: "Inserta", search: "Busca", delete: "Borra" },
    emptyRoot: (verb, v) => `${verb} ${v}: el árbol está vacío, así que se vuelve la raíz.`,
    startRoot: (verb, v) => `${verb} ${v}: empieza en la raíz.`,
    here: (v, at) => `${v} = ${at}: es este.`,
    goLeft: (v, at) => `${v} < ${at}: ve a la izquierda.`,
    goRight: (v, at) => `${v} > ${at}: ve a la derecha.`,
    isRoot: (v) => `${v} es la raíz.`,
    goesSide: (v, side, parent) => `No hay nada ahí: ${v} va a la ${side === "left" ? "izquierda" : "derecha"} de ${parent}.`,
    duplicateTree: (v) => `${v} ya está en el árbol: no hay nada que insertar.`,
    foundAfter: (v, steps) => `Encontrado ${v}, tras bajar ${steps} ${steps === 1 ? "paso" : "pasos"}.`,
    ranOut: (v) => `Se acabó el árbol: ${v} no está.`,
    noChildren: (v) => `${v} no tiene hijos: basta con sacarlo.`,
    oneChild: (v) => `${v} tiene un hijo, que ocupa su lugar.`,
    twoChildren: (v) => `${v} tiene dos hijos: busca su sucesor, el menor valor a su derecha.`,
    successor: (v) => `El sucesor es ${v}: cópialo arriba y después borra el nodo de donde vino.`,
    gone: (v) => `${v} ya no está.`,
    goneReplaced: (v, child) => `${v} ya no está; ${child} ocupó su lugar.`,
    rotateNeeded: (v, balance) => `De vuelta en ${v}: balance ${signed(balance)}, un lado es dos más alto. Rota.`,
    stillFine: (v, height, balance) => `De vuelta en ${v}: altura ${height}, balance ${signed(balance)}. Sigue bien.`,
    rotate: (direction, at, up, pivot) => {
      const side = direction === "left" ? "izquierda" : "derecha";
      return `Rota a la ${side} en ${at}: ${up} sube y ${pivot} baja a su ${side}.`;
    },
    theTop: "la cima",
    balanced: (rotations, height) =>
      `Balanceado de nuevo, tras ${rotations === 1 ? "una rotación" : `${rotations} rotaciones`}. Altura ${height}.`,
    treeDone: (values, height) =>
      `Listo. El árbol tiene ${values} ${values === 1 ? "valor" : "valores"} y altura ${height}.`,
    heapInsert: (v) => `Inserta ${v}: empieza al final, en la siguiente posición libre.`,
    heapFind: (v) =>
      `Busca ${v}: el montículo no ordena de izquierda a derecha, así que revisa cada posición.`,
    popMin: (v) => `Saca el mínimo, ${v}: siempre está en la raíz, la posición 0.`,
    deleteFind: (v) => `Borra ${v}: primero hay que encontrarlo.`,
    intoRoot: (v) => `${v} va a la posición 0: la raíz.`,
    intoSlot: (v, slot, parent, parentSlot) => `${v} va a la posición ${slot}, debajo de ${parent} (posición ${parentSlot}).`,
    swapUp: (me, other) => `${me} < ${other}, su padre: fuera de orden. Intercambia hacia arriba.`,
    staysUp: (me, other) => `${me} ≥ ${other}, su padre: en orden. Se queda.`,
    swapDown: (me, other) => `${me} > ${other}, el hijo menor: fuera de orden. Intercambia hacia abajo.`,
    staysDown: (me, other) => `${me} ≤ ${other}, el hijo menor: en orden. Se queda.`,
    movesUp: (v, slot, other) => `${v} sube a la posición ${slot}; ${other} baja.`,
    movesDown: (v, slot, other) => `${v} baja a la posición ${slot}; ${other} sube.`,
    scanMatch: (slot, v) => `Posición ${slot}: ${v}. Encontrado.`,
    scanMiss: (slot, held, v) => `La posición ${slot} tiene ${held}, no ${v}. Siguiente posición.`,
    foundChecking: (v, slots) => `Encontrado ${v}, tras revisar ${slots} ${slots === 1 ? "posición" : "posiciones"}.`,
    notInHeap: (v) => `Se revisaron todas las posiciones: ${v} no está en el montículo.`,
    take: (v, slot) => `Saca ${v} de la posición ${slot}, dejando un hueco.`,
    lift: (v) => `El último valor, ${v}, pasa al hueco. Ahora tiene que encontrar su nivel.`,
    lastSlot: (v) => `${v} estaba en la última posición: basta con quitarlo.`,
    heapEmpty: "Listo. El montículo está vacío.",
    heapDone: (swaps, min) =>
      `Listo${swaps ? `, tras ${swaps} ${swaps === 1 ? "intercambio" : "intercambios"}` : ""}. El mínimo, ${min}, está en la raíz.`,
    unit: { bucket: "cubeta", slot: "casilla" },
    hashVerb: { insert: "Inserta", search: "Busca", delete: "Borra" },
    hashStart: (verb, v, unit) => `${verb} ${v}: primero, calcula su ${unit}.`,
    hash: (v, m, b, unit) => `${v} mod ${m} = ${b}: ${unit} ${b}. No hace falta buscar para llegar.`,
    chainMatch: (v) => `${v} = ${v}: ahí está.`,
    chainNext: (held, v) => `${held} ≠ ${v}: el siguiente de la cubeta.`,
    slotEmpty: (b) => `La casilla ${b} está vacía: el recorrido termina aquí.`,
    slotMarker: (b) => `La casilla ${b} tiene una marca de un borrado: sigue de largo.`,
    slotMatch: (b, v) => `La casilla ${b} tiene ${v}: ahí está.`,
    slotTaken: (b, held, next) => `La casilla ${b} tiene ${held}: ocupada. Prueba la casilla ${next}.`,
    chainAdd: (v, b) => `No está en la cubeta: agrega ${v} al final de la cubeta ${b}.`,
    probedPast: (v, b, past) =>
      `${v} va a la casilla ${b}, ${past} ${past === 1 ? "casilla" : "casillas"} después de donde empezó.`,
    straightIn: (v, b) => `${v} va directo a la casilla ${b}.`,
    duplicateTable: (v) => `${v} ya está en la tabla: no hay nada que insertar.`,
    foundIn: (v, unit, b) => `Encontrado ${v} en la ${unit} ${b}.`,
    endOfBucket: (v) => `Fin de la cubeta: ${v} no está en la tabla.`,
    notInTable: (v) =>
      `${v} no está en la tabla: si estuviera, el recorrido lo habría encontrado antes de una casilla vacía.`,
    marker: (b) => `Deja una marca en la casilla ${b}: una búsqueda de un valor más adelante no debe detenerse aquí.`,
    unlink: (v, b) => `Quita ${v} de la cubeta ${b}.`,
    full: (v) => `Todas las casillas están ocupadas: no hay lugar para ${v}. Las tablas reales crecen antes.`,
    tableDone: (count, m, unit, load) =>
      `Listo. ${count} ${count === 1 ? "valor" : "valores"} en ${m} ${unit}s: una carga de ${load}.`,
  },
});

const idle = (algorithm: StructureRun["algorithm"]) =>
  algorithm === "heap"
    ? text.idleHeap
    : algorithm === "chaining" || algorithm === "probing"
      ? text.idleTable
      : text.idleTree;

const valueOf = (frame: TreeFrame, id: number) => frame.nodes.find((n) => n.id === id)?.value ?? "?";

const slotOf = (frame: TreeFrame, id: number) => frame.nodes.findIndex((n) => n.id === id);

/** The step into frame `index`, in one or two plain sentences. */
export const narrateTree = (run: StructureRun, index: number): string => {
  if (index === 0) return idle(run.algorithm);
  const frame = run.frames[index];
  if (frame.shape === "table") return narrateHash(run, frame);
  if (run.algorithm === "heap") return narrateHeap(run, frame);
  const before = run.frames[index - 1] as TreeFrame;
  const e = frame.event;
  switch (e.type) {
    case "start": {
      const verb = text.treeVerb[e.op.kind];
      return frame.root === null && e.op.kind === "insert" ? text.emptyRoot(verb, e.op.value) : text.startRoot(verb, e.op.value);
    }
    case "compare": {
      const at = valueOf(frame, e.node);
      if (e.go === "here") return text.here(e.value, at);
      return e.go === "left" ? text.goLeft(e.value, at) : text.goRight(e.value, at);
    }
    case "place":
      return e.parent === null
        ? text.isRoot(valueOf(frame, e.node))
        : text.goesSide(valueOf(frame, e.node), e.side!, valueOf(frame, e.parent));
    case "duplicate":
      return text.duplicateTree(valueOf(frame, e.node));
    case "found":
      return text.foundAfter(valueOf(frame, e.node), frame.path.length);
    case "missing":
      return text.ranOut(e.value);
    case "remove":
      if (e.children === 0) return text.noChildren(e.value);
      if (e.children === 1) return text.oneChild(e.value);
      return text.twoChildren(e.value);
    case "successor":
      return text.successor(e.value);
    case "removed":
      return e.child === null ? text.gone(e.value) : text.goneReplaced(e.value, valueOf(frame, e.child));
    case "height": {
      const node = frame.nodes.find((n) => n.id === e.node)!;
      return Math.abs(e.balance) > 1
        ? text.rotateNeeded(node.value, e.balance)
        : text.stillFine(node.value, node.height, e.balance);
    }
    case "rotate": {
      const pivot = valueOf(frame, e.pivot);
      const up = valueOf(frame, e.up);
      const zigzag = before.event.type === "rotate";
      return text.rotate(e.direction, zigzag ? text.theTop : String(pivot), up, pivot);
    }
    case "done": {
      const start = run.frames[run.opStarts[frame.opIndex]];
      const rotations = frame.stats.rotations - start.stats.rotations;
      if (rotations > 0) return text.balanced(rotations, Math.max(0, frame.height));
      return text.treeDone(frame.nodes.length, Math.max(0, frame.height));
    }
    default:
      return "";
  }
};

const narrateHeap = (run: StructureRun, frame: TreeFrame): string => {
  const e = frame.event;
  const value = (id: number) => valueOf(frame, id);
  switch (e.type) {
    case "start":
      if (e.op.kind === "insert") return text.heapInsert(e.op.value);
      if (e.op.kind === "search") return text.heapFind(e.op.value);
      return frame.nodes[0]?.value === e.op.value ? text.popMin(e.op.value) : text.deleteFind(e.op.value);
    case "append": {
      if (e.index === 0) return text.intoRoot(value(e.node));
      const parentSlot = Math.floor((e.index - 1) / 2);
      return text.intoSlot(value(e.node), e.index, frame.nodes[parentSlot].value, parentSlot);
    }
    case "sift": {
      const me = value(e.node);
      const other = value(e.other);
      if (e.direction === "up") return e.swap ? text.swapUp(me, other) : text.staysUp(me, other);
      return e.swap ? text.swapDown(me, other) : text.staysDown(me, other);
    }
    case "swap":
      return e.direction === "up"
        ? text.movesUp(value(e.node), slotOf(frame, e.node), value(e.other))
        : text.movesDown(value(e.node), slotOf(frame, e.node), value(e.other));
    case "scan":
      return e.match ? text.scanMatch(e.index, e.value) : text.scanMiss(e.index, value(e.node), e.value);
    case "found":
      return text.foundChecking(value(e.node), frame.path.length);
    case "missing":
      return text.notInHeap(e.value);
    case "take":
      return text.take(e.value, slotOf(frame, e.node));
    case "lift":
      return text.lift(e.value);
    case "removed":
      return text.lastSlot(e.value);
    case "done": {
      const start = run.frames[run.opStarts[frame.opIndex]];
      const swaps = frame.stats.swaps - start.stats.swaps;
      if (!frame.nodes.length) return text.heapEmpty;
      return text.heapDone(swaps, frame.nodes[0].value);
    }
    default:
      return "";
  }
};

const narrateHash = (run: StructureRun, frame: HashFrame): string => {
  const e = frame.event;
  const m = frame.buckets.length;
  const chaining = run.algorithm === "chaining";
  const unit = chaining ? text.unit.bucket : text.unit.slot;
  const valueOfItem = (id: number) => frame.buckets.flat().find((i) => i.id === id)?.value ?? "?";
  switch (e.type) {
    case "start":
      return text.hashStart(text.hashVerb[e.op.kind], e.op.value, unit);
    case "hash":
      return text.hash(e.value, m, e.bucket, unit);
    case "probe":
      if (chaining) return e.match ? text.chainMatch(e.value) : text.chainNext(valueOfItem(e.item!), e.value);
      if (e.item === null) return text.slotEmpty(e.bucket);
      if (e.deleted) return text.slotMarker(e.bucket);
      if (e.match) return text.slotMatch(e.bucket, e.value);
      return text.slotTaken(e.bucket, valueOfItem(e.item), (e.bucket + 1) % m);
    case "place":
      if (chaining) return text.chainAdd(valueOfItem(e.item), e.bucket);
      return e.probes > 1 ? text.probedPast(valueOfItem(e.item), e.bucket, e.probes - 1) : text.straightIn(valueOfItem(e.item), e.bucket);
    case "duplicate":
      return text.duplicateTable(valueOfItem(e.item));
    case "found":
      return text.foundIn(valueOfItem(e.item), unit, e.bucket);
    case "missing":
      return chaining ? text.endOfBucket(e.value) : text.notInTable(e.value);
    case "removed":
      return e.marker ? text.marker(e.bucket) : text.unlink(e.value, e.bucket);
    case "full":
      return text.full(e.value);
    case "done":
      return text.tableDone(frame.count, m, unit, (frame.count / m).toFixed(2));
  }
};
