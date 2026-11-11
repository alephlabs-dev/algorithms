import { localized } from "@/i18n";
import type { StructureAlgorithm, StructurePreset, StructureSize } from "./types";

type StructureText = {
  title: string;
  /** How the name reads mid-sentence ("How … works"), when that differs from the title. */
  named?: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** How long a search, insert or delete takes. */
  cost: string;
  /** What it guarantees about its shape, or what to watch for. */
  shape: string;
  /** The heading `shape` goes under. */
  shapeLabel: string;
};

/** Where it sits in the picker (the group's id; its label is translated where the picker is built). */
export type StructureGroup = "Trees" | "Heaps" | "Hash tables";

type StructureDetails = StructureText & { named: string; group: StructureGroup };

// Key order is the order shown in the UI.
const groups: Record<StructureAlgorithm, StructureGroup> = {
  bst: "Trees",
  avl: "Trees",
  heap: "Heaps",
  chaining: "Hash tables",
  probing: "Hash tables",
};

const text = localized<Record<StructureAlgorithm, StructureText>>({
  en: {
    bst: {
      title: "Binary Search Tree",
      short: "BST",
      shortDescription: "Smaller values to the left, bigger to the right, at every node. Finding one means walking down a single path, as long as the tree stays bushy.",
      longDescription: "A binary search tree keeps one rule at every node: everything in its left subtree is smaller, everything in its right subtree is bigger. To search, start at the root and go left or right at each node until you find the value or run out of tree; to insert, do the same and put the new value where the walk falls off. Deleting is the tricky case: a node with two children takes the value of its successor (the smallest value on its right) and that node goes instead. Each operation costs as many steps as the tree is tall. Fed values in random order the tree stays around log₂ n tall, but fed sorted values it grows into a single long chain, and every operation takes n steps.",
      cost: "O(log n) on average, O(n) worst",
      shape: "no guarantee: sorted input makes a list",
      shapeLabel: "Shape",
    },
    avl: {
      title: "AVL Tree",
      short: "AVL",
      shortDescription: "A binary search tree that keeps itself short: after each insert or delete it checks heights on the way back up and rotates wherever one side got two taller.",
      longDescription: "An AVL tree (after Adelson-Velsky and Landis, who invented it in 1962) is a binary search tree with one more rule: at every node, the two subtrees' heights differ by at most one. Each node's balance is its left height minus its right height. After an insert or a delete, the tree walks back up the path it came down, fixing heights; where a balance reaches 2 or −2 it rotates, lifting the taller side's child into the node's place. A zig-zag needs two rotations, one at the child and one at the node. Rotations keep the left-to-right order, so the tree is still a search tree, and they keep its height within about 1.44 log₂ n: every operation stays O(log n), even on sorted input.",
      cost: "O(log n), always",
      shape: "height ≤ 1.44 log₂ n",
      shapeLabel: "Shape",
    },
    heap: {
      title: "Min-Heap",
      short: "Heap",
      shortDescription: "A tree packed into an array where every parent is smaller than its children, so the minimum is always on top. Adding a value or taking the smallest out is a short walk up or down.",
      longDescription: "A binary heap is a complete binary tree, filled level by level, left to right, so it fits in a plain array with no links at all: slot i's children live at 2i+1 and 2i+2, and its parent at (i−1)/2. A min-heap keeps one rule: every parent is no bigger than its children. So the smallest value is always at the root. To insert, put the value at the end and swap it up while it's smaller than its parent. To pop the minimum, take the root, move the last value into its place, and swap it down with its smaller child while it's bigger. Both walks are at most the tree's height, about log₂ n. What a heap can't do is search: the rule says nothing about left versus right, so finding an arbitrary value means checking slot after slot. That's the trade: priority queues, Dijkstra's algorithm and heap sort only ever need the minimum.",
      cost: "insert and pop O(log n); find O(n)",
      shape: "complete: always as short as possible",
      shapeLabel: "Shape",
    },
    chaining: {
      title: "Hash Table (Chaining)",
      short: "Hash chaining",
      shortDescription: "A value's bucket is computed, not searched for: v mod m. Values that land in the same bucket share it as a short list.",
      longDescription: "A hash table turns a value straight into a place to look: here, the value mod the number of buckets m. Inserting, finding and deleting all start by jumping to that bucket, with no walk down from a root. Two values can land in the same bucket (a collision); with separate chaining, each bucket keeps a list, and the operation walks only that list. With a good hash and the table kept from getting too full (resizing when n/m, the load factor, grows past about 1), each list stays a couple of values long and every operation takes constant time on average. The catch is in that average: if many values share a bucket (here, values that differ by a multiple of m), its list grows and the table slows to a list search. And there's no order: a hash table can't give you the smallest value, or the values in sorted order, without looking at all of them.",
      cost: "O(1) on average, O(n) worst",
      shape: "chains grow with the load n / m",
      shapeLabel: "Load",
    },
    probing: {
      title: "Hash Table (Linear Probing)",
      short: "Linear probing",
      shortDescription: "One value per slot. When a value's slot is taken, it tries the next one along, and the next, until it finds room.",
      longDescription: "Linear probing (open addressing) keeps every value in the table itself, one per slot. A value starts at slot v mod m; if that's taken, it tries the next slot, and the next, wrapping around at the end. Finding a value walks the same way and can stop at the first empty slot: had the value been inserted, it would be there or before. That's why deleting can't simply empty a slot: a value further along might have probed past it. Instead the slot keeps a marker (a tombstone); finds walk past it, and inserts can reuse it. Linear probing is fast in practice because neighboring slots sit next to each other in memory. Its weakness is clustering: taken slots run together into blocks, and any value that lands in a block has to walk to its end, so the table slows sharply as it fills. Real tables resize well before that, around 70% full.",
      cost: "O(1) on average, O(n) as it fills",
      shape: "clusters form as it fills; keep it under ~70%",
      shapeLabel: "Load",
    },
  },
  es: {
    bst: {
      title: "Árbol binario de búsqueda",
      named: "el árbol binario de búsqueda",
      short: "BST",
      shortDescription: "En cada nodo, los valores menores a la izquierda y los mayores a la derecha. Encontrar uno es bajar por un solo camino, siempre que el árbol se mantenga frondoso.",
      longDescription: "Un árbol binario de búsqueda cumple una regla en cada nodo: todo lo que está en su subárbol izquierdo es menor y todo lo que está en el derecho es mayor. Para buscar, empieza en la raíz y ve a la izquierda o a la derecha en cada nodo hasta encontrar el valor o quedarte sin árbol; para insertar, haz lo mismo y pon el valor nuevo donde termina el recorrido. Borrar es el caso difícil: un nodo con dos hijos toma el valor de su sucesor (el menor valor a su derecha) y es ese nodo el que se va. Cada operación cuesta tantos pasos como alto es el árbol. Con valores en orden aleatorio el árbol queda de unos log₂ n de alto, pero con valores ordenados crece como una sola cadena larga y cada operación tarda n pasos.",
      cost: "O(log n) en promedio, O(n) en el peor caso",
      shape: "sin garantía: una entrada ordenada lo vuelve una lista",
      shapeLabel: "Forma",
    },
    avl: {
      title: "Árbol AVL",
      named: "el árbol AVL",
      short: "AVL",
      shortDescription: "Un árbol binario de búsqueda que se mantiene bajo: después de cada inserción o borrado revisa las alturas al volver hacia arriba y rota donde un lado quedó dos más alto.",
      longDescription: "Un árbol AVL (por Adelson-Velsky y Landis, que lo inventaron en 1962) es un árbol binario de búsqueda con una regla más: en cada nodo, las alturas de los dos subárboles difieren como mucho en uno. El balance de cada nodo es su altura izquierda menos su altura derecha. Después de insertar o borrar, el árbol vuelve a subir por el camino que bajó y corrige las alturas; donde un balance llega a 2 o −2, rota: sube al hijo del lado más alto al lugar del nodo. Un zigzag necesita dos rotaciones, una en el hijo y otra en el nodo. Las rotaciones conservan el orden de izquierda a derecha, así que sigue siendo un árbol de búsqueda, y mantienen su altura en unos 1,44 log₂ n: cada operación sigue siendo O(log n), incluso con entrada ordenada.",
      cost: "O(log n), siempre",
      shape: "altura ≤ 1,44 log₂ n",
      shapeLabel: "Forma",
    },
    heap: {
      title: "Montículo mínimo",
      named: "el montículo mínimo",
      short: "Montículo",
      shortDescription: "Un árbol guardado en un arreglo donde cada padre es menor que sus hijos, así que el mínimo siempre está arriba. Agregar un valor o sacar el menor es un camino corto hacia arriba o hacia abajo.",
      longDescription: "Un montículo binario es un árbol binario completo, lleno nivel por nivel y de izquierda a derecha, así que cabe en un arreglo simple sin ningún enlace: los hijos de la posición i están en 2i+1 y 2i+2, y su padre en (i−1)/2. Un montículo mínimo cumple una regla: ningún padre es mayor que sus hijos. Por eso el valor más pequeño siempre está en la raíz. Para insertar, pon el valor al final y súbelo intercambiándolo mientras sea menor que su padre. Para sacar el mínimo, toma la raíz, mueve el último valor a su lugar y bájalo intercambiándolo con su hijo menor mientras sea mayor. Los dos recorridos son como mucho la altura del árbol, unos log₂ n. Lo que un montículo no puede hacer es buscar: la regla no dice nada de izquierda o derecha, así que encontrar un valor cualquiera obliga a revisar posición tras posición. Ese es el trato: las colas de prioridad, el algoritmo de Dijkstra y Heap Sort solo necesitan el mínimo.",
      cost: "insertar y sacar O(log n); buscar O(n)",
      shape: "completo: siempre lo más bajo posible",
      shapeLabel: "Forma",
    },
    chaining: {
      title: "Tabla hash (encadenamiento)",
      named: "la tabla hash con encadenamiento",
      short: "Encadenamiento",
      shortDescription: "La cubeta de un valor se calcula, no se busca: v mod m. Los valores que caen en la misma cubeta la comparten como una lista corta.",
      longDescription: "Una tabla hash convierte un valor directamente en un lugar donde mirar: aquí, el valor mod la cantidad de cubetas m. Insertar, buscar y borrar empiezan saltando a esa cubeta, sin bajar desde ninguna raíz. Dos valores pueden caer en la misma cubeta (una colisión); con encadenamiento separado, cada cubeta guarda una lista y la operación recorre solo esa lista. Con un buen hash y sin dejar que la tabla se llene demasiado (agrandándola cuando n/m, el factor de carga, pasa de alrededor de 1), cada lista tiene un par de valores y cada operación tarda tiempo constante en promedio. La trampa está en ese promedio: si muchos valores comparten cubeta (aquí, valores que difieren en un múltiplo de m), su lista crece y la tabla se vuelve tan lenta como buscar en una lista. Y no hay orden: una tabla hash no puede darte el valor más pequeño, ni los valores ordenados, sin mirarlos todos.",
      cost: "O(1) en promedio, O(n) en el peor caso",
      shape: "las cadenas crecen con la carga n / m",
      shapeLabel: "Carga",
    },
    probing: {
      title: "Tabla hash (sondeo lineal)",
      named: "la tabla hash con sondeo lineal",
      short: "Sondeo lineal",
      shortDescription: "Un valor por casilla. Cuando la casilla de un valor está ocupada, prueba la siguiente, y la siguiente, hasta encontrar lugar.",
      longDescription: "El sondeo lineal (direccionamiento abierto) guarda cada valor en la propia tabla, uno por casilla. Un valor empieza en la casilla v mod m; si está ocupada, prueba la siguiente, y la siguiente, volviendo al principio al llegar al final. Buscar un valor recorre el mismo camino y puede detenerse en la primera casilla vacía: si el valor se hubiera insertado, estaría ahí o antes. Por eso borrar no puede simplemente vaciar una casilla: un valor más adelante podría haber pasado por ella. En cambio, la casilla guarda una marca (una lápida); las búsquedas pasan de largo y las inserciones pueden reutilizarla. El sondeo lineal es rápido en la práctica porque las casillas vecinas están juntas en memoria. Su punto débil es el agrupamiento: las casillas ocupadas se juntan en bloques, y cualquier valor que cae en un bloque tiene que recorrerlo hasta el final, así que la tabla se vuelve mucho más lenta a medida que se llena. Las tablas reales se agrandan bastante antes, alrededor del 70 % de ocupación.",
      cost: "O(1) en promedio, O(n) al llenarse",
      shape: "se forman grupos al llenarse; mantenla por debajo de ~70 %",
      shapeLabel: "Carga",
    },
  },
});

export const structures = Object.fromEntries(
  (Object.keys(groups) as StructureAlgorithm[]).map((id) => [
    id,
    { ...text[id], named: text[id].named ?? text[id].title, group: groups[id] },
  ])
) as Record<StructureAlgorithm, StructureDetails>;

export const structurePresetOptions = localized<{ value: StructurePreset; label: string; title: string }[]>({
  en: [
    { value: "example", label: "Example", title: "A hand-picked order that shows every kind of rotation" },
    { value: "random", label: "Random", title: "Values in random order: a plain BST stays fairly bushy" },
    { value: "ascending", label: "Ascending", title: "Sorted values: a plain BST turns into a list" },
  ],
  es: [
    { value: "example", label: "Ejemplo", title: "Un orden elegido a mano que muestra cada tipo de rotación" },
    { value: "random", label: "Aleatorio", title: "Valores en orden aleatorio: un BST simple queda bastante frondoso" },
    { value: "ascending", label: "Ascendente", title: "Valores ordenados: un BST simple se vuelve una lista" },
  ],
});

export const structureSizeLabels: Record<StructureSize, string> = { small: "7", medium: "12", large: "20" };

export const structurePresetLabel = (preset: StructurePreset) =>
  structurePresetOptions.find((p) => p.value === preset)!.label;
