import type { StructureAlgorithm, StructurePreset, StructureSize } from "@/structures";

type StructureDetails = {
  title: string;
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
  /** Where it sits in the picker. */
  group: "Trees" | "Heaps" | "Hash tables";
};

// Key order is the order shown in the UI.
export const structures: Record<StructureAlgorithm, StructureDetails> = {
  bst: {
    title: "Binary Search Tree",
    short: "BST",
    shortDescription:
      "Smaller values to the left, bigger to the right, at every node. Finding one means walking down a single path, as long as the tree stays bushy.",
    longDescription:
      "A binary search tree keeps one rule at every node: everything in its left subtree is smaller, everything in its right subtree is bigger. To search, start at the root and go left or right at each node until you find the value or run out of tree; to insert, do the same and put the new value where the walk falls off. Deleting is the tricky case: a node with two children takes the value of its successor (the smallest value on its right) and that node goes instead. Each operation costs as many steps as the tree is tall. Fed values in random order the tree stays around log₂ n tall, but fed sorted values it grows into a single long chain, and every operation takes n steps.",
    cost: "O(log n) on average, O(n) worst",
    shape: "no guarantee: sorted input makes a list",
    shapeLabel: "Shape",
    group: "Trees",
  },
  avl: {
    title: "AVL Tree",
    short: "AVL",
    shortDescription:
      "A binary search tree that keeps itself short: after each insert or delete it checks heights on the way back up and rotates wherever one side got two taller.",
    longDescription:
      "An AVL tree (after Adelson-Velsky and Landis, who invented it in 1962) is a binary search tree with one more rule: at every node, the two subtrees' heights differ by at most one. Each node's balance is its left height minus its right height. After an insert or a delete, the tree walks back up the path it came down, fixing heights; where a balance reaches 2 or −2 it rotates, lifting the taller side's child into the node's place. A zig-zag needs two rotations, one at the child and one at the node. Rotations keep the left-to-right order, so the tree is still a search tree, and they keep its height within about 1.44 log₂ n: every operation stays O(log n), even on sorted input.",
    cost: "O(log n), always",
    shape: "height ≤ 1.44 log₂ n",
    shapeLabel: "Shape",
    group: "Trees",
  },
  heap: {
    title: "Min-Heap",
    short: "Heap",
    shortDescription:
      "A tree packed into an array where every parent is smaller than its children, so the minimum is always on top. Adding a value or taking the smallest out is a short walk up or down.",
    longDescription:
      "A binary heap is a complete binary tree, filled level by level, left to right, so it fits in a plain array with no links at all: slot i's children live at 2i+1 and 2i+2, and its parent at (i−1)/2. A min-heap keeps one rule: every parent is no bigger than its children. So the smallest value is always at the root. To insert, put the value at the end and swap it up while it's smaller than its parent. To pop the minimum, take the root, move the last value into its place, and swap it down with its smaller child while it's bigger. Both walks are at most the tree's height, about log₂ n. What a heap can't do is search: the rule says nothing about left versus right, so finding an arbitrary value means checking slot after slot. That's the trade: priority queues, Dijkstra's algorithm and heap sort only ever need the minimum.",
    cost: "insert and pop O(log n); find O(n)",
    shape: "complete: always as short as possible",
    shapeLabel: "Shape",
    group: "Heaps",
  },
  chaining: {
    title: "Hash Table (Chaining)",
    short: "Hash chaining",
    shortDescription:
      "A value's bucket is computed, not searched for: v mod m. Values that land in the same bucket share it as a short list.",
    longDescription:
      "A hash table turns a value straight into a place to look: here, the value mod the number of buckets m. Inserting, finding and deleting all start by jumping to that bucket, with no walk down from a root. Two values can land in the same bucket (a collision); with separate chaining, each bucket keeps a list, and the operation walks only that list. With a good hash and the table kept from getting too full (resizing when n/m, the load factor, grows past about 1), each list stays a couple of values long and every operation takes constant time on average. The catch is in that average: if many values share a bucket (here, values that differ by a multiple of m), its list grows and the table slows to a list search. And there's no order: a hash table can't give you the smallest value, or the values in sorted order, without looking at all of them.",
    cost: "O(1) on average, O(n) worst",
    shape: "chains grow with the load n / m",
    shapeLabel: "Load",
    group: "Hash tables",
  },
  probing: {
    title: "Hash Table (Linear Probing)",
    short: "Linear probing",
    shortDescription:
      "One value per slot. When a value's slot is taken, it tries the next one along, and the next, until it finds room.",
    longDescription:
      "Linear probing (open addressing) keeps every value in the table itself, one per slot. A value starts at slot v mod m; if that's taken, it tries the next slot, and the next, wrapping around at the end. Finding a value walks the same way and can stop at the first empty slot: had the value been inserted, it would be there or before. That's why deleting can't simply empty a slot: a value further along might have probed past it. Instead the slot keeps a marker (a tombstone); finds walk past it, and inserts can reuse it. Linear probing is fast in practice because neighboring slots sit next to each other in memory. Its weakness is clustering: taken slots run together into blocks, and any value that lands in a block has to walk to its end, so the table slows sharply as it fills. Real tables resize well before that, around 70% full.",
    cost: "O(1) on average, O(n) as it fills",
    shape: "clusters form as it fills; keep it under ~70%",
    shapeLabel: "Load",
    group: "Hash tables",
  },
};

export const structurePresetOptions: { value: StructurePreset; label: string; title: string }[] = [
  { value: "example", label: "Example", title: "A hand-picked order that shows every kind of rotation" },
  { value: "random", label: "Random", title: "Values in random order: a plain BST stays fairly bushy" },
  { value: "ascending", label: "Ascending", title: "Sorted values: a plain BST turns into a list" },
];

export const structureSizeLabels: Record<StructureSize, string> = { small: "7", medium: "12", large: "20" };

export const structurePresetLabel = (preset: StructurePreset) =>
  structurePresetOptions.find((p) => p.value === preset)!.label;
