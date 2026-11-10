# Algorithms

An interactive visualizer where learners watch algorithms run step by step, race them against each other, and test what they've understood.

## Language

**Guess mode**:
A way of playing a run where playback stops just before a key moment and asks the learner what happens next, keeping score and streak.
_Avoid_: Game mode, quiz

**Key moment**:
The decision in a run that best shows how its algorithm works, such as how far insertion sort slides a value or where quick sort's pivot lands. Guess mode asks about key moments.
_Avoid_: Step, event

**Run**:
Every frame of one algorithm on one input, worked out before playback starts. The run on stage is the one the learner is watching; a race has one run per racer.
_Avoid_: Animation, execution

**Module**:
One visualizer of the app, such as sorting, pathfinding, backtracking or mazes, with its own algorithms, inputs and tour.
_Avoid_: Section, category, visualizer type

**View**:
How a module shows its runs: single (one run on stage) or race (several racers side by side on the same input).
_Avoid_: Mode, layout

**Racer**:
An algorithm taking part in a race; it gets one run and one lane.
_Avoid_: Competitor, lane, contestant

**Input**:
What a run works on: the array, the grid, the graph, the operations, the words or the bag, the board, the shape and its circles, or the walled-in grid a maze is carved from and the seed that drives its random choices.
_Avoid_: Data, dataset, array (outside sorting)

**New input**:
Swapping the module's input for another of the same kind (another array, another maze, the next word pair, more circles), so the learner can watch the same algorithm on something fresh.
_Avoid_: New run, new array (outside sorting), shuffle

**Pace**:
The pacing profile of a kind of run ("single", "pathRace", …) that sets how fast 1× plays, so the run takes a comfortable time. The speed presets are multiples of it.
_Avoid_: Base speed, tempo

**Frontier**:
The cells a run has seen but not yet taken in, waiting their turn. In pathfinding each search orders it its own way: BFS by steps from the start, DFS newest first, Dijkstra by cost, A* by cost plus distance left, greedy by distance left. In mazes, Prim's frontier is the cells next to the maze that are not yet part of it, taken at random.
_Avoid_: Open set, queue, stack (outside each algorithm's own pseudocode)

### Pathfinding

**Visit**:
Taking a cell out of the frontier and looking at it, which may add its neighbours to the frontier.
_Avoid_: Explore, expand

### Backtracking

**Problem**:
A puzzle the backtracking module solves, such as N-Queens or Sudoku. In this module the learner picks a problem, not an algorithm, because the algorithm is always backtracking. Code shared by every module still calls it the module's algorithm (a page's `algorithm`, `AlgorithmOf<"backtracking">`).
_Avoid_: Algorithm, puzzle type

**Given**:
A value the puzzle starts with, such as a Sudoku's printed digits. It is never tried or taken back, so it is not a choice.
_Avoid_: Clue, hint, fixed cell

**Choice**:
Placing a value in a slot of a problem, such as a queen in a column of a row or a digit in a cell.
_Avoid_: Move, placement, try

**Conflict**:
A value tried in a slot that breaks a constraint, so it is skipped on the spot instead of becoming a choice.
_Avoid_: Clash, prune, failure

**Dead end**:
A slot where no value is left to try, which forces a backtrack.
_Avoid_: Failure, stuck

**Fill order**:
Which empty slot a problem fills next: row by row, in reading order, or fewest options first (MRV), the slot with the fewest values left that fit.
_Avoid_: Heuristic, strategy, search order

**Backtrack**:
Undoing the most recent choice that still stands, so the next value can be tried there.
_Avoid_: Undo, rollback, retreat

### Mazes

**Perfect maze**:
A maze with exactly one route between any two cells: no loops and no closed-off areas. Every maze this module carves is perfect.
_Avoid_: Proper maze, tree maze

**Carve**:
Knocking down the wall between two cells so a passage joins them.
_Avoid_: Dig, open, remove wall

**Dead-end cell**:
A cell of a finished maze with only one way out. How many there are is the clearest sign of a maze's texture: depth-first search leaves few; Prim, Kruskal and Wilson many.
_Avoid_: Dead end (that is backtracking's term), cul-de-sac, leaf

**Region**:
In Kruskal, a set of cells already joined by passages. Every cell starts as a region of its own; carving a wall between two regions merges them, and a wall inside one region is skipped, since carving it would close a loop.
_Avoid_: Group (that is graphs' Kruskal), set, component

**Walk**:
Wilson's path in progress: from a random cell outside the maze, one random neighbour at a time, until it reaches the maze and is carved in whole. In Spanish, "caminata".
_Avoid_: Path (that is pathfinding's result), trail, random path

**Loop erasure**:
When the walk steps onto a cell it already passed, the loop it made is erased: the walk goes back to how it was when it first reached that cell. In Spanish, "borrar el ciclo".
_Avoid_: Backtrack (that is DFS's move), cycle removal

### Fourier

**Hand-drawn shape**:
A shape the learner draws in the Fourier module instead of picking a preset. It travels in the link, and whoever opens the link sees the same drawing.
_Avoid_: Custom shape, sketch
