# Algorithms

An interactive visualizer where learners watch algorithms run step by step, race them against each other, and test what they've understood.

## Language

**Guess mode**:
A way of playing a run where playback stops just before a key moment and asks the learner what happens next, keeping score and streak.
_Avoid_: Game mode, quiz

**Key moment**:
The decision in a run that best shows how its algorithm works, such as how far insertion sort slides a value or where quick sort's pivot lands. Guess mode asks about key moments.
_Avoid_: Step, event

### Backtracking

**Problem**:
A puzzle the backtracking module solves, such as N-Queens or Sudoku. In this module the learner picks a problem, not an algorithm, because the algorithm is always backtracking.
_Avoid_: Algorithm, puzzle type

**Choice**:
Placing a value in a slot of a problem, such as a queen in a column of a row or a digit in a cell.
_Avoid_: Move, placement, try

**Conflict**:
A value tried in a slot that breaks a constraint, so it is skipped on the spot instead of becoming a choice.
_Avoid_: Clash, prune, failure

**Dead end**:
A slot where no value is left to try, which forces a backtrack.
_Avoid_: Failure, stuck

**Backtrack**:
Undoing the most recent choice that still stands, so the next value can be tried there.
_Avoid_: Undo, rollback, retreat
