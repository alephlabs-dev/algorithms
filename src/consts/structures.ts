import type { StructureAlgorithm, StructurePreset, StructureSize } from "@/structures";

type StructureDetails = {
  title: string;
  /** Short name for tight spots (pickers on phones). */
  short: string;
  shortDescription: string;
  longDescription: string;
  /** How long a search, insert or delete takes. */
  cost: string;
  /** What it guarantees about its shape. */
  shape: string;
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
