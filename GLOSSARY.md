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
One visualizer of the app, such as sorting, pathfinding or backtracking, with its own algorithms, inputs and tour.
_Avoid_: Section, category, visualizer type

**View**:
How a module shows its runs: single (one run on stage) or race (several racers side by side on the same input).
_Avoid_: Mode, layout

**Racer**:
An algorithm taking part in a race; it gets one run and one lane.
_Avoid_: Competitor, lane, contestant

**Input**:
What a run works on: the array, the grid, the graph, the operations, the words or the bag, the board, or the shape and its circles.
_Avoid_: Data, dataset, array (outside sorting)

**New input**:
Swapping the module's input for another of the same kind (another array, another maze, the next word pair, more circles), so the learner can watch the same algorithm on something fresh.
_Avoid_: New run, new array (outside sorting), shuffle

**Pace**:
The pacing profile of a kind of run ("single", "pathRace", …) that sets how fast 1× plays, so the run takes a comfortable time. The speed presets are multiples of it.
_Avoid_: Base speed, tempo

### Backtracking

**Problem**:
A puzzle the backtracking module solves, such as N-Queens or Sudoku. In this module the learner picks a problem, not an algorithm, because the algorithm is always backtracking.
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
