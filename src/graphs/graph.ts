import { MAX_NODES, type Graph, type GraphEdge, type GraphNode } from "./types";

export type GraphSize = "small" | "medium" | "large";
export const graphSizes: GraphSize[] = ["small", "medium", "large"];

export type GraphPreset = "random" | "tree" | "grid";
export const graphPresets: GraphPreset[] = ["random", "tree", "grid"];

/** Wide screens get landscape layouts; narrow ones (phones, upright windows) get taller ones that fit their stage. */
export const graphAspect = (narrow: boolean) => (narrow ? 0.9 : 1.8);

// Phones show fewer nodes, so circles, weights and badges keep room to breathe.
const NODE_COUNT: Record<GraphSize, { wide: number; phone: number }> = {
  small: { wide: 7, phone: 6 },
  medium: { wide: 11, phone: 9 },
  large: { wide: 16, phone: 12 },
};
const GRID: Record<GraphSize, { wide: [number, number]; phone: [number, number] }> = {
  small: { wide: [2, 4], phone: [3, 3] },
  medium: { wide: [3, 5], phone: [4, 3] },
  large: { wide: [4, 6], phone: [5, 4] },
};

const MARGIN = 0.07;

/** "A", "B"… the name a node goes by on screen and in sentences. */
export const nodeName = (node: number) => String.fromCharCode(65 + node);

/** The other end of an edge. */
export const otherEnd = (edge: GraphEdge, node: number) => (edge.a === node ? edge.b : edge.a);

/** A node's edges, in the order searches look at them: by the neighbour's letter. */
export const neighbors = (graph: Graph, node: number): { edge: number; node: number }[] =>
  graph.edges
    .map((e, edge) => ({ edge, e }))
    .filter(({ e }) => e.a === node || e.b === node)
    .map(({ edge, e }) => ({ edge, node: otherEnd(e, node) }))
    .sort((p, q) => p.node - q.node);

const randomWeight = (random: () => number) => 1 + Math.floor(random() * 9);

/** Distance in the layout's own proportions, so "close" looks close on screen. */
const span = (aspect: number, p: GraphNode, q: GraphNode) => Math.hypot((p.x - q.x) * aspect, p.y - q.y);

const orient = (p: GraphNode, q: GraphNode, r: GraphNode) =>
  Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));

const crosses = (nodes: GraphNode[], e: { a: number; b: number }, f: { a: number; b: number }) => {
  if (e.a === f.a || e.a === f.b || e.b === f.a || e.b === f.b) return false;
  const [p, q, r, s] = [nodes[e.a], nodes[e.b], nodes[f.a], nodes[f.b]];
  return orient(p, q, r) !== orient(p, q, s) && orient(r, s, p) !== orient(r, s, q);
};

/** How close a node comes to the segment a–b, so edges don't run through nodes they don't join. */
const clearance = (aspect: number, p: GraphNode, q: GraphNode, n: GraphNode) => {
  const [px, py, qx, qy, nx, ny] = [p.x * aspect, p.y, q.x * aspect, q.y, n.x * aspect, n.y];
  const length = (qx - px) ** 2 + (qy - py) ** 2;
  const t = Math.max(0, Math.min(1, ((nx - px) * (qx - px) + (ny - py) * (qy - py)) / length));
  return Math.hypot(nx - (px + t * (qx - px)), ny - (py + t * (qy - py)));
};

/** Renumbers nodes left to right, so letters read in order across the screen. */
const sortedLeftToRight = (graph: Graph): Graph => {
  const order = graph.nodes
    .map((_, k) => k)
    .sort((p, q) => graph.nodes[p].x - graph.nodes[q].x || graph.nodes[p].y - graph.nodes[q].y);
  const index = new Map(order.map((old, k) => [old, k]));
  return {
    ...graph,
    nodes: order.map((k) => graph.nodes[k]),
    edges: graph.edges.map((e) => ({ ...e, a: index.get(e.a)!, b: index.get(e.b)! })),
    start: index.get(graph.start)!,
  };
};

/** Scattered nodes joined by short edges that never cross: first a tree so it's connected, then a few more. */
const randomGraph = (count: number, aspect: number, random: () => number): Graph => {
  const nodes: GraphNode[] = [];
  let gap = 0.62 / Math.sqrt(count);
  for (let tries = 0; nodes.length < count; tries++) {
    if (tries > 0 && tries % 400 === 0) gap *= 0.9;
    const p = { x: MARGIN + random() * (1 - 2 * MARGIN), y: MARGIN + random() * (1 - 2 * MARGIN) };
    if (nodes.every((q) => span(aspect, p, q) >= gap)) nodes.push(p);
  }
  const pairs: { a: number; b: number; length: number }[] = [];
  for (let a = 0; a < count; a++)
    for (let b = a + 1; b < count; b++) pairs.push({ a, b, length: span(aspect, nodes[a], nodes[b]) });
  pairs.sort((p, q) => p.length - q.length);

  // Kruskal on distance: the shortest tree that joins every node is connected and never crosses itself.
  const root = nodes.map((_, k) => k);
  const find = (k: number): number => (root[k] === k ? k : (root[k] = find(root[k])));
  const chosen: { a: number; b: number }[] = [];
  for (const pair of pairs) {
    const [ra, rb] = [find(pair.a), find(pair.b)];
    if (ra === rb) continue;
    root[ra] = rb;
    chosen.push(pair);
  }
  // Then more short edges, never crossing and never brushing past another node, so there are cycles to find.
  const degree = new Array(count).fill(0);
  for (const e of chosen) {
    degree[e.a]++;
    degree[e.b]++;
  }
  const target = Math.round(count * 1.5);
  const has = new Set(chosen.map((e) => `${e.a}-${e.b}`));
  for (const pair of pairs) {
    if (chosen.length >= target) break;
    if (has.has(`${pair.a}-${pair.b}`) || degree[pair.a] >= 4 || degree[pair.b] >= 4) continue;
    if (chosen.some((e) => crosses(nodes, e, pair))) continue;
    const others = nodes.filter((_, k) => k !== pair.a && k !== pair.b);
    if (others.some((n) => clearance(aspect, nodes[pair.a], nodes[pair.b], n) < 0.06)) continue;
    chosen.push(pair);
    degree[pair.a]++;
    degree[pair.b]++;
  }
  const edges = chosen.map(({ a, b }) => ({ a, b, w: randomWeight(random) }));
  // Start from the leftmost node, A, so the search reads left to right.
  return { ...sortedLeftToRight({ nodes, edges, aspect, start: 0 }), start: 0 };
};

/** A tree drawn top down: each node has one to three children (two on narrow layouts), leaves spread evenly. */
const treeGraph = (count: number, aspect: number, random: () => number): Graph => {
  const children: number[][] = [[]];
  const depth = [0];
  const queue = [0];
  while (children.length < count && queue.length) {
    const parent = queue.shift()!;
    // Narrow (phone) layouts branch at most in two, so leaves don't run out of width.
    const kids = Math.min(count - children.length, 1 + Math.floor(random() * (aspect < 1 ? 2 : 3)));
    for (let k = 0; k < kids; k++) {
      const node = children.length;
      children.push([]);
      depth.push(depth[parent] + 1);
      children[parent].push(node);
      queue.push(node);
    }
    if (!queue.length && children.length < count) queue.push(parent);
  }
  const levels = Math.max(...depth) + 1;
  // Leaves get evenly spaced columns in depth-first order; parents sit above the middle of their children.
  const x = new Array(children.length).fill(0);
  let leaf = 0;
  const leaves = children.filter((c) => c.length === 0).length;
  const place = (node: number): number => {
    if (children[node].length === 0) return (x[node] = (leaf++ + 0.5) / leaves);
    const xs = children[node].map(place);
    return (x[node] = (Math.min(...xs) + Math.max(...xs)) / 2);
  };
  place(0);
  const nodes = x.map((value, k) => ({
    x: MARGIN + value * (1 - 2 * MARGIN),
    y: MARGIN + ((depth[k] + 0.5) / levels) * (1 - 2 * MARGIN),
  }));
  const edges = children.flatMap((kids, parent) =>
    kids.map((child) => ({ a: parent, b: child, w: randomWeight(random) })),
  );
  // Numbered by level from the top, so the root is A and the letters read like the tree.
  return { nodes, edges, aspect, start: 0 };
};

const connected = (count: number, edges: { a: number; b: number }[]) => {
  const seen = new Set([0]);
  const queue = [0];
  while (queue.length) {
    const node = queue.shift()!;
    for (const e of edges) {
      const next = e.a === node ? e.b : e.b === node ? e.a : -1;
      if (next >= 0 && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === count;
};

/** A lattice with some links missing (never so many that part of it is cut off). */
const gridGraph = (rows: number, cols: number, aspect: number, random: () => number): Graph => {
  const nodes: GraphNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      nodes.push({
        x: MARGIN + ((c + 0.5) / cols) * (1 - 2 * MARGIN),
        y: MARGIN + ((r + 0.5) / rows) * (1 - 2 * MARGIN),
      });
    }
  }
  let edges: { a: number; b: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const node = r * cols + c;
      if (c + 1 < cols) edges.push({ a: node, b: node + 1 });
      if (r + 1 < rows) edges.push({ a: node, b: node + cols });
    }
  }
  const drops = Math.floor(edges.length * 0.2);
  for (let k = 0, tries = 0; k < drops && tries < 200; tries++) {
    const pick = Math.floor(random() * edges.length);
    const rest = edges.filter((_, i) => i !== pick);
    if (connected(nodes.length, rest)) {
      edges = rest;
      k++;
    }
  }
  return { nodes, edges: edges.map((e) => ({ ...e, w: randomWeight(random) })), aspect, start: 0 };
};

/** A new graph of the given kind and size. */
export const makeGraph = (preset: GraphPreset, size: GraphSize, narrow: boolean, random: () => number): Graph => {
  const aspect = graphAspect(narrow);
  const count = NODE_COUNT[size][narrow ? "phone" : "wide"];
  if (preset === "tree") return treeGraph(count, aspect, random);
  if (preset === "grid") {
    const [rows, cols] = GRID[size][narrow ? "phone" : "wide"];
    return gridGraph(rows, cols, aspect, random);
  }
  return randomGraph(count, aspect, random);
};

// Editing: each returns a new graph (or the same one when nothing changes).

const clamp = (value: number) => Math.min(1 - MARGIN / 2, Math.max(MARGIN / 2, value));

export const withNodeAt = (graph: Graph, node: number, x: number, y: number): Graph => ({
  ...graph,
  nodes: graph.nodes.map((n, k) => (k === node ? { x: clamp(x), y: clamp(y) } : n)),
});

/** Joins two nodes, or takes the edge away if they're already joined. New edges get a weight from their ends. */
export const withEdgeToggled = (graph: Graph, a: number, b: number): Graph => {
  if (a === b) return graph;
  const existing = graph.edges.findIndex((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
  if (existing >= 0) return { ...graph, edges: graph.edges.filter((_, k) => k !== existing) };
  return { ...graph, edges: [...graph.edges, { a: Math.min(a, b), b: Math.max(a, b), w: 1 + ((a * 7 + b * 13) % 9) }] };
};

export const withStart = (graph: Graph, node: number): Graph =>
  node === graph.start ? graph : { ...graph, start: node };

// Links carry the whole graph: places rounded to 1/255 of the layout, then edges and weights.

const toBase64Url = (bytes: number[]) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export const encodeGraph = (graph: Graph): string => {
  const bytes = [1, Math.round(graph.aspect * 100), graph.nodes.length, graph.start];
  for (const n of graph.nodes) bytes.push(Math.round(n.x * 255), Math.round(n.y * 255));
  bytes.push(graph.edges.length);
  for (const e of graph.edges) bytes.push(e.a, e.b, e.w);
  return toBase64Url(bytes);
};

/** The graph a link carries, or null if it's malformed. */
export const decodeGraph = (text: string): Graph | null => {
  let bytes: number[];
  try {
    bytes = [...atob(text.replace(/-/g, "+").replace(/_/g, "/"))].map((c) => c.charCodeAt(0));
  } catch {
    return null;
  }
  const [version, aspect100, count, start] = bytes;
  if (version !== 1 || !count || count > MAX_NODES || start >= count || !aspect100) return null;
  const nodes: GraphNode[] = [];
  let k = 4;
  for (let i = 0; i < count; i++, k += 2) {
    if (k + 1 >= bytes.length) return null;
    nodes.push({ x: bytes[k] / 255, y: bytes[k + 1] / 255 });
  }
  const edgeCount = bytes[k++];
  if (edgeCount === undefined || bytes.length !== k + edgeCount * 3) return null;
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < edgeCount; i++, k += 3) {
    const [a, b, w] = [bytes[k], bytes[k + 1], bytes[k + 2]];
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (a >= count || b >= count || a === b || w < 1 || w > 9 || seen.has(key)) return null;
    seen.add(key);
    edges.push({ a, b, w });
  }
  return { nodes, edges, aspect: aspect100 / 100, start };
};
