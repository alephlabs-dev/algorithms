import { localized } from "@/i18n";
import type { DpAlgorithm } from "./types";
import type { Method } from "./work";

type DpText = {
  title: string;
  /** How the name reads mid-sentence ("How … works"), when that differs from the title. */
  named?: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** Time and space for the inputs. */
  cost: string;
  /** What a cell holds. */
  cell: string;
};

type DpDetails = DpText & { named: string };

// Key order is the order shown in the UI.
const text = localized<Record<DpAlgorithm, DpText>>({
  en: {
    edit: {
      title: "Edit Distance",
      short: "Edit distance",
      shortDescription: "The fewest single-letter inserts, deletes and replacements that turn one word into another, worked out one table cell at a time.",
      longDescription: "Edit distance (or Levenshtein distance, after Vladimir Levenshtein, 1965) counts the fewest single-letter edits that turn one word into another: insert a letter, delete one, or replace one. Trying every sequence of edits would take forever, but the question breaks into smaller ones that overlap. Cell D[i][j] holds the distance between the first i letters of the first word and the first j of the second. The first row and column are easy: turning i letters into nothing takes i deletes. Every other cell comes from three neighbors already filled in: if the two letters match, it's the same as the diagonal; if not, it's one more than the cheapest of the diagonal (replace), the cell above (delete) or the cell to the left (insert). The bottom-right corner is the answer, and walking back from it, the way each value came, spells out the edits themselves. Spell checkers, DNA alignment and diff tools all use versions of it.",
      cost: "O(m·n) time and space",
      cell: "edits between two prefixes",
    },
    lcs: {
      title: "Longest Common Subsequence",
      short: "LCS",
      shortDescription: "The longest run of letters two words share in the same order, not necessarily side by side, built up from shorter prefixes.",
      longDescription: "A subsequence keeps some of a word's letters, in order, and drops the rest: ACE is a subsequence of ABCDE. The longest common subsequence of two words is the longest one they share. There are 2ⁿ subsequences of a word of n letters, too many to try, but the table makes it quick. Cell L[i][j] holds the length of the longest common subsequence of the first i letters of one word and the first j of the other. With nothing to compare (row or column 0) it's 0. Where the two letters match, they extend whatever the prefixes before them shared: the diagonal plus one. Where they don't, one of the two letters isn't in the answer, so the cell takes the better of dropping one (the cell above) or the other (the cell to the left). The corner holds the length; walking back, taking the diagonal at each match, picks out the letters. It's how diff finds the lines two files have in common, and a cousin of the DNA alignments biologists run.",
      cost: "O(m·n) time and space",
      cell: "letters shared by two prefixes",
    },
    knapsack: {
      title: "0/1 Knapsack",
      short: "Knapsack",
      shortDescription: "The most value that fits in a bag of limited weight, taking each item once or not at all, decided one smaller bag at a time.",
      longDescription: "You have a bag that holds a set weight and some items, each with a weight and a value. Which ones should go in? Grabbing the most valuable first, or the best value per kilo, can both go wrong; trying every subset means 2ⁿ of them. Dynamic programming asks a smaller question in each cell: K[i][w] is the most value you can get from the first i items in a bag of capacity w. With no items it's 0. For item i there are two choices. Leave it, and the best is whatever the first i − 1 items managed with the same room: the cell above. Or, if it fits, take it: its value plus the best the first i − 1 items managed in the room left over, w − its weight, which is the cell above and that many columns to the left. The cell keeps the better. The bottom-right corner is the answer, and walking back up, every place the value changes from the cell above is an item that was taken. The table has (n + 1) × (W + 1) cells, so it's quick when the capacity is a small number; the same idea schedules jobs, budgets and cargo.",
      cost: "O(n·W) time and space",
      cell: "best value from the first i items in room w",
    },
  },
  es: {
    edit: {
      title: "Distancia de edición",
      named: "la distancia de edición",
      short: "Distancia de edición",
      shortDescription: "La menor cantidad de inserciones, borrados y reemplazos de una letra que convierten una palabra en otra, calculada celda por celda.",
      longDescription: "La distancia de edición (o distancia de Levenshtein, por Vladimir Levenshtein, 1965) cuenta la menor cantidad de ediciones de una letra que convierten una palabra en otra: insertar una letra, borrar una o reemplazar una. Probar todas las secuencias de ediciones llevaría una eternidad, pero la pregunta se divide en otras más pequeñas que se superponen. La celda D[i][j] guarda la distancia entre las primeras i letras de la primera palabra y las primeras j de la segunda. La primera fila y la primera columna son fáciles: convertir i letras en nada lleva i borrados. Cada una de las demás celdas sale de tres vecinas ya calculadas: si las dos letras coinciden, vale lo mismo que la diagonal; si no, vale uno más que la más barata entre la diagonal (reemplazar), la de arriba (borrar) y la de la izquierda (insertar). La esquina inferior derecha es la respuesta, y al volver desde ella por el camino de donde vino cada valor aparecen las ediciones. Los correctores ortográficos, la alineación de ADN y las herramientas de diff usan versiones de este algoritmo.",
      cost: "O(m·n) en tiempo y espacio",
      cell: "ediciones entre dos prefijos",
    },
    lcs: {
      title: "Subsecuencia común más larga",
      named: "la subsecuencia común más larga",
      short: "LCS",
      shortDescription: "La secuencia más larga de letras que dos palabras comparten en el mismo orden, no necesariamente juntas, construida a partir de prefijos más cortos.",
      longDescription: "Una subsecuencia conserva algunas letras de una palabra, en orden, y descarta el resto: ACE es una subsecuencia de ABCDE. La subsecuencia común más larga de dos palabras es la más larga que comparten. Una palabra de n letras tiene 2ⁿ subsecuencias, demasiadas para probarlas todas, pero la tabla lo resuelve rápido. La celda L[i][j] guarda la longitud de la subsecuencia común más larga entre las primeras i letras de una palabra y las primeras j de la otra. Sin nada que comparar (fila o columna 0) vale 0. Donde las dos letras coinciden, extienden lo que compartían los prefijos anteriores: la diagonal más uno. Donde no, una de las dos letras no está en la respuesta, así que la celda toma lo mejor entre descartar una (la celda de arriba) o la otra (la de la izquierda). La esquina guarda la longitud; al volver hacia atrás, tomando la diagonal en cada coincidencia, aparecen las letras. Así es como diff encuentra las líneas que dos archivos tienen en común, y es pariente de las alineaciones de ADN que hacen los biólogos.",
      cost: "O(m·n) en tiempo y espacio",
      cell: "letras compartidas por dos prefijos",
    },
    knapsack: {
      title: "Mochila 0/1",
      named: "la mochila 0/1",
      short: "Mochila",
      shortDescription: "El mayor valor que cabe en una mochila de peso limitado, tomando cada objeto una vez o ninguna, decidido con mochilas cada vez más grandes.",
      longDescription: "Tienes una mochila que aguanta cierto peso y algunos objetos, cada uno con un peso y un valor. ¿Cuáles deberían ir? Tomar primero el más valioso, o el de mejor valor por kilo, puede salir mal; probar todos los subconjuntos son 2ⁿ. La programación dinámica hace una pregunta más pequeña en cada celda: K[i][w] es el mayor valor que se puede obtener con los primeros i objetos en una mochila de capacidad w. Sin objetos vale 0. Para el objeto i hay dos opciones. Dejarlo, y lo mejor es lo que lograron los primeros i − 1 objetos con el mismo espacio: la celda de arriba. O, si entra, tomarlo: su valor más lo mejor que lograron los primeros i − 1 objetos en el espacio que sobra, w − su peso, que es la celda de arriba y tantas columnas a la izquierda. La celda se queda con lo mejor. La esquina inferior derecha es la respuesta, y al subir desde ella, cada lugar donde el valor cambia respecto de la celda de arriba es un objeto que se tomó. La tabla tiene (n + 1) × (W + 1) celdas, así que es rápida cuando la capacidad es un número pequeño; la misma idea sirve para planificar tareas, presupuestos y cargas.",
      cost: "O(n·W) en tiempo y espacio",
      cell: "mejor valor con los primeros i objetos en un espacio w",
    },
  },
});

export const dpProblems = Object.fromEntries(
  (Object.keys(text) as DpAlgorithm[]).map((id) => [id, { ...text[id], named: text[id].named ?? text[id].title }])
) as Record<DpAlgorithm, DpDetails>;

/** The race's three ways to solve the knapsack. */
export const dpMethods = localized<Record<Method, { title: string; short: string }>>({
  en: {
    table: { title: "Table (bottom-up)", short: "Table" },
    memo: { title: "Memoized recursion", short: "Memoized" },
    recursion: { title: "Plain recursion", short: "Recursion" },
  },
  es: {
    table: { title: "Tabla (de abajo hacia arriba)", short: "Tabla" },
    memo: { title: "Recursión con memoización", short: "Memoización" },
    recursion: { title: "Recursión simple", short: "Recursión" },
  },
});
