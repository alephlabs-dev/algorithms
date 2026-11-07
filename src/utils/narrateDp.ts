import { alignment, itemName, keptLetters, KnapsackRun, takenItems, type DpRun, type TableRun } from "@/dp";
import { localized } from "@/i18n";

type Move = "diag" | "up" | "left";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const text = localized({
  en: {
    moves: { diag: "diagonal", up: "up", left: "left" } as Record<Move, string>,
    edits: { diag: "replace", up: "delete", left: "insert" } as Record<Move, string>,
    // Knapsack
    label: (name: string, weight: number, value: number) => `${name} (weight ${weight}, worth ${value})`,
    knapsackStart: (capacity: number) =>
      `What's the most value that fits in a bag of ${capacity}? Each cell answers it for fewer items and less room.`,
    knapsackBase: "Row 0 first: with no items to choose from, any bag is worth 0.",
    doesntFit: (label: string, room: number, leave: number) =>
      `${label} doesn't fit in room ${room}: leave it, and keep ${leave} from the row above.`,
    take: (room: number, name: string, rest: number, value: number, total: number, leave: number) =>
      `Room ${room}: take ${name}, ${rest} + ${value} = ${total}, beats leaving it (${leave}).`,
    leave: (room: number, name: string, take: number, leave: number) =>
      `Room ${room}: taking ${name} gets ${take}, no better than leaving it (${leave}). Leave it.`,
    inBag: (label: string, weight: number) => `Different from the cell above: ${label} is in the bag. Go up and ${weight} left.`,
    staysOut: (name: string) => `Same as the cell above: ${name} stays out. Go up.`,
    takeAll: (names: string, answer: number, weight: number, capacity: number) =>
      `Take ${names}: worth ${answer}, weighing ${weight} of ${capacity}.`,
    nothingFits: (capacity: number) => `Nothing fits in a bag of ${capacity}.`,
    // Two words
    // Sentences about both words don't name them: they're on the table's edges, and two
    // ten-letter words in wide letters fill a line of the caption on their own.
    editStart: "How many edits turn one word into the other? Each cell solves it for two prefixes.",
    lcsStart: "How many letters do the words share in order? Each cell solves it for two prefixes.",
    editBase:
      "Row and column ε first: emptying a word takes a delete per letter, building one an insert per letter.",
    lcsBase: "Row and column ε first: a word shares nothing with an empty one, so they're all 0.",
    editMatch: (x: string, y: string, value: number) => `${x} = ${y}: no edit needed, so it costs what the diagonal does: ${value}.`,
    option: (name: string, value: number) => `${name} ${value}`,
    editCheapest: (x: string, y: string, options: string, value: number, pick: string) =>
      `${x} ≠ ${y}: the cheapest of ${options} is ${value}, by ${pick}.`,
    lcsMatch: (x: string, y: string, value: number) =>
      `${x} = ${y}: one more shared letter than the diagonal, ${value - 1} + 1 = ${value}.`,
    lcsBetter: (x: string, y: string, up: number, left: number, value: number) =>
      `${x} ≠ ${y}: the better of up (${up}) and left (${left}) is ${value}.`,
    traceMatch: (x: string, y: string) => `${x} = ${y}: keep it, and go diagonally.`,
    traceReplace: (x: string, y: string) => `Came from the diagonal plus one: replace ${x} with ${y}.`,
    traceDelete: (x: string) => `Came from above plus one: delete ${x}.`,
    traceInsert: (y: string) => `Came from the left plus one: insert ${y}.`,
    traceKeep: (x: string, y: string) => `${x} = ${y}: it's one of the shared letters. Go diagonally.`,
    traceSkip: (x: string, y: string, move: string) => `${x} ≠ ${y}: go ${move}, toward the bigger value.`,
    sameWord: "Both words are the same: distance 0.",
    editDone: (edits: number, answer: number) =>
      `Distance ${answer}: the corner's value. ${edits === 1 ? "The 1 edit is" : `The ${edits} edits are`} listed under the table.`,
    noShared: (a: string, b: string) => `${a} and ${b} share no letters at all.`,
    lcsDone: (letters: string, answer: number) =>
      `The longest common subsequence has ${plural(answer, "letter")}: ${letters}.`,
  },
  es: {
    moves: { diag: "en diagonal", up: "hacia arriba", left: "hacia la izquierda" },
    edits: { diag: "reemplazar", up: "borrar", left: "insertar" },
    label: (name, weight, value) => `${name} (peso ${weight}, vale ${value})`,
    knapsackStart: (capacity) =>
      `¿Cuánto valor cabe en una mochila de ${capacity}? Cada celda lo responde con menos objetos y espacio.`,
    knapsackBase: "Primero la fila 0: sin objetos para elegir, cualquier mochila vale 0.",
    doesntFit: (label, room, leave) => `${label} no entra en un espacio de ${room}: déjalo y quédate con ${leave} de la fila de arriba.`,
    take: (room, name, rest, value, total, leave) =>
      `Espacio ${room}: tomar ${name}, ${rest} + ${value} = ${total}, supera a dejarlo (${leave}).`,
    leave: (room, name, take, leave) => `Espacio ${room}: tomar ${name} da ${take}, no mejora dejarlo (${leave}). Déjalo.`,
    inBag: (label, weight) => `Distinto de la celda de arriba: ${label} está en la mochila. Sube y ve ${weight} a la izquierda.`,
    staysOut: (name) => `Igual que la celda de arriba: ${name} queda afuera. Sube.`,
    takeAll: (names, answer, weight, capacity) => `Toma ${names}: valen ${answer} y pesan ${weight} de ${capacity}.`,
    nothingFits: (capacity) => `Nada entra en una mochila de ${capacity}.`,
    editStart: "¿Cuántas ediciones llevan de una palabra a la otra? Cada celda, para dos prefijos.",
    lcsStart: "¿Cuántas letras comparten en orden las dos palabras? Cada celda, para dos prefijos.",
    editBase:
      "Primero la fila y la columna ε: con una palabra vacía, cada letra es un borrado o una inserción.",
    lcsBase: "Primero la fila y la columna ε: nada se comparte con una palabra vacía, así que valen 0.",
    editMatch: (x, y, value) => `${x} = ${y}: no hace falta editar, así que cuesta lo mismo que la diagonal: ${value}.`,
    option: (name, value) => `${name} ${value}`,
    editCheapest: (x, y, options, value, pick) => `${x} ≠ ${y}: lo más barato entre ${options} es ${value}, al ${pick}.`,
    lcsMatch: (x, y, value) => `${x} = ${y}: una letra compartida más que la diagonal, ${value - 1} + 1 = ${value}.`,
    lcsBetter: (x, y, up, left, value) => `${x} ≠ ${y}: lo mejor entre arriba (${up}) e izquierda (${left}) es ${value}.`,
    traceMatch: (x, y) => `${x} = ${y}: se queda, y sigue en diagonal.`,
    traceReplace: (x, y) => `Vino de la diagonal más uno: reemplaza ${x} por ${y}.`,
    traceDelete: (x) => `Vino de arriba más uno: borra ${x}.`,
    traceInsert: (y) => `Vino de la izquierda más uno: inserta ${y}.`,
    traceKeep: (x, y) => `${x} = ${y}: es una de las letras compartidas. Sigue en diagonal.`,
    traceSkip: (x, y, move) => `${x} ≠ ${y}: ve ${move}, hacia el valor más grande.`,
    sameWord: "Las dos palabras son iguales: distancia 0.",
    editDone: (edits, answer) =>
      `Distancia ${answer}: lo que vale la esquina. ${edits === 1 ? "La edición está" : `Las ${edits} ediciones están`} debajo de la tabla.`,
    noShared: (a, b) => `${a} y ${b} no comparten ninguna letra.`,
    lcsDone: (letters, answer) =>
      `La subsecuencia común más larga tiene ${answer} ${answer === 1 ? "letra" : "letras"}: ${letters}.`,
  },
});

/** The step into frame `index`, in one or two plain sentences. */
export const narrateDp = (run: TableRun, index: number): string =>
  run instanceof KnapsackRun ? narrateKnapsack(run, index) : narrateWords(run as DpRun, index);

const narrateKnapsack = (run: KnapsackRun, index: number): string => {
  const { items, capacity } = run;
  const frame = run.frames[index];
  const e = frame.event;
  const label = (k: number) => text.label(itemName(k), items[k].weight, items[k].value);
  switch (e.type) {
    case "start":
      return text.knapsackStart(capacity);
    case "base":
      return text.knapsackBase;
    case "cell": {
      const k = e.i - 1;
      const [leave, take] = e.options;
      if (!take) return text.doesntFit(label(k), e.j, leave.value);
      if (e.pick === "take")
        return text.take(e.j, itemName(k), take.value - items[k].value, items[k].value, take.value, leave.value);
      return text.leave(e.j, itemName(k), take.value, leave.value);
    }
    case "trace": {
      const k = e.step.i - 1;
      return e.step.kind === "take" ? text.inBag(label(k), items[k].weight) : text.staysOut(itemName(k));
    }
    case "done": {
      const chosen = takenItems(run.trace);
      const weight = chosen.reduce((sum, k) => sum + items[k].weight, 0);
      return chosen.length
        ? text.takeAll(chosen.map(itemName).join(", "), e.answer, weight, capacity)
        : text.nothingFits(capacity);
    }
  }
};

const narrateWords = (run: DpRun, index: number): string => {
  const { a, b } = run;
  const frame = run.frames[index];
  const e = frame.event;
  const edit = run.algorithm === "edit";
  switch (e.type) {
    case "start":
      return edit ? text.editStart : text.lcsStart;
    case "base":
      return edit ? text.editBase : text.lcsBase;
    case "cell": {
      const x = a[e.i - 1];
      const y = b[e.j - 1];
      if (edit) {
        if (e.match) return text.editMatch(x, y, e.value);
        const name = (w: string) => text.edits[w as Move];
        const options = e.options.map((o) => text.option(name(o.from), o.value)).join(", ");
        return text.editCheapest(x, y, options, e.value, name(e.pick));
      }
      if (e.match) return text.lcsMatch(x, y, e.value);
      const [up, left] = e.options;
      return text.lcsBetter(x, y, up.value, left.value, e.value);
    }
    case "trace": {
      const s = e.step;
      const x = a[s.i - 1];
      const y = b[s.j - 1];
      switch (s.kind) {
        case "match":
          return text.traceMatch(x, y);
        case "replace":
          return text.traceReplace(x, y);
        case "delete":
          return text.traceDelete(x);
        case "insert":
          return text.traceInsert(y);
        case "keep":
          return text.traceKeep(x, y);
        case "skip":
          return text.traceSkip(x, y, text.moves[s.move as Move]);
      }
      return "";
    }
    case "done": {
      if (edit) {
        const edits = alignment(a, b, run.trace).filter((c) => c.kind !== "match").length;
        return e.answer === 0 ? text.sameWord : text.editDone(edits, e.answer);
      }
      const letters = keptLetters(a, run.trace);
      return e.answer === 0 ? text.noShared(a, b) : text.lcsDone(letters, e.answer);
    }
  }
};
