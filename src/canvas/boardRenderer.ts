import { hexToRgb, mix, readColors, type CanvasColors, type RGB } from "./theme";

export type Square = { row: number; col: number };

/** What sits on a square: a queen, or text such as a Sudoku digit. */
export type BoardPiece = { kind: "queen" } | { kind: "text"; value: string };

/** What a square shows: a piece on it, and how it's marked. */
export type BoardCell = {
  piece?: BoardPiece;
  /**
   * placed: in place. focus: the piece that just moved. conflict: tried and broken a rule.
   * attacker: the piece that rules a square out. ghost: just taken back.
   */
  tone?: "placed" | "focus" | "conflict" | "attacker" | "ghost";
  /** Part of the puzzle from the start: drawn in ink, bold, whatever its tone. */
  given?: boolean;
  /** A small note in a corner, such as how many digits still fit; `lit` draws it in the focus color. */
  note?: { text: string; lit?: boolean };
  /** A soft dot: ruled out for now (a square a queen attacks). */
  shade?: boolean;
};

export type BoardInput = {
  rows: number;
  cols: number;
  /** Row by row. */
  cells: BoardCell[];
  /** Lines from square to square, such as from a conflict to the queen that attacks it. */
  lines: { from: Square; to: Square }[];
  /** A block of squares with no value left to try: a row of N-Queens, a Sudoku cell. */
  deadEnd?: { from: Square; to: Square } | null;
  /** Squares a guess-mode question asks about, such as the columns left to try in a row: outlined, dashed. */
  ask?: { from: Square; to: Square } | null;
  /** Labels down the side and across the top. */
  rowLabels?: string[];
  colLabels?: string[];
  /** Plain squares instead of a checkerboard (a Sudoku grid). */
  plain?: boolean;
  /** Thicker lines between boxes of this many squares (3 for a Sudoku). */
  box?: number;
};

// Rounds each channel (theme.ts's css truncates), so its colors can differ by 1: keep it separate.
const css = ([r, g, b]: RGB, alpha = 1) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;

/**
 * Draws a checkered board (a chessboard, a Sudoku grid) with pieces, marks
 * and lines between squares. Any problem that fills squares one by one can
 * describe its frame as cells and hand it over.
 */
export class BoardRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private input: BoardInput | null = null;
  private colors = readColors();

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }

  refreshColors() {
    this.colors = readColors();
    this.draw();
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.draw();
  }

  update(input: BoardInput) {
    this.input = input;
    this.draw();
  }

  private palette(colors: CanvasColors) {
    const background = hexToRgb(colors.background);
    const edge = hexToRgb(colors.edge);
    const isLight = background[0] + background[1] + background[2] > 384;
    return {
      light: mix(background, edge, isLight ? 0.35 : 0.45),
      dark: mix(background, edge, isLight ? 0.85 : 1),
      shade: hexToRgb(colors.muted),
      shadeAlpha: isLight ? 0.7 : 0.75,
      placed: hexToRgb(colors.primary),
      conflict: hexToRgb(colors.conflict),
      ghost: hexToRgb(colors.dim),
      label: hexToRgb(colors.muted),
      ink: hexToRgb(colors.foreground),
      outline: hexToRgb(colors.outline),
      background,
    };
  }

  private draw() {
    const { ctx, input } = this;
    if (!input || this.width === 0 || this.height === 0) return;
    const p = this.palette(this.colors);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const labels = input.rowLabels || input.colLabels ? 1 : 0;
    // Labels take a thin band on the left and top, a fraction of a square.
    const size = Math.max(
      4,
      Math.floor(Math.min(this.width / (input.cols + labels * 0.6), this.height / (input.rows + labels * 0.6))),
    );
    const band = labels * size * 0.6;
    const boardW = size * input.cols;
    const boardH = size * input.rows;
    const left = Math.round((this.width - boardW - band) / 2 + band);
    const top = Math.round((this.height - boardH - band) / 2 + band);
    const at = (row: number, col: number) => ({ x: left + col * size, y: top + row * size });

    // Squares, and a dot on the ones ruled out (a dot reads apart from the checkering, a wash doesn't).
    for (let row = 0; row < input.rows; row++) {
      for (let col = 0; col < input.cols; col++) {
        const { x, y } = at(row, col);
        ctx.fillStyle = css(input.plain || (row + col) % 2 === 0 ? p.light : p.dark);
        ctx.fillRect(x, y, size, size);
        const cell = input.cells[row * input.cols + col];
        if (cell?.shade && !cell.piece) {
          ctx.fillStyle = css(p.shade, p.shadeAlpha);
          ctx.beginPath();
          ctx.arc(x + size / 2, y + size / 2, Math.max(1.5, size * 0.07), 0, Math.PI * 2);
          ctx.fill();
        }
        if (cell?.note && !cell.piece) {
          ctx.fillStyle = css(cell.note.lit ? p.placed : p.label);
          ctx.font = `${cell.note.lit ? 700 : 500} ${Math.max(8, Math.round(size * 0.24))}px "JetBrains Mono Variable", ui-monospace, monospace`;
          // Bottom right: lines along a row or column run by the top and left edges.
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          ctx.fillText(cell.note.text, x + size * 0.9, y + size * 0.94);
        }
      }
    }

    // A plain grid needs its lines: thin between squares, thick between boxes.
    if (input.plain) {
      for (let k = 0; k <= Math.max(input.rows, input.cols); k++) {
        const thick = input.box !== undefined && k % input.box === 0;
        ctx.strokeStyle = css(thick ? p.label : p.dark);
        ctx.lineWidth = thick ? Math.max(2, size * 0.06) : 1;
        ctx.beginPath();
        if (k <= input.cols) {
          ctx.moveTo(left + k * size, top);
          ctx.lineTo(left + k * size, top + boardH);
        }
        if (k <= input.rows) {
          ctx.moveTo(left, top + k * size);
          ctx.lineTo(left + boardW, top + k * size);
        }
        ctx.stroke();
      }
    }

    if (input.deadEnd) {
      const { from, to } = input.deadEnd;
      const { x, y } = at(from.row, from.col);
      const w = (to.col - from.col + 1) * size;
      const h = (to.row - from.row + 1) * size;
      ctx.fillStyle = css(p.conflict, 0.18);
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = css(p.conflict);
      ctx.lineWidth = Math.max(2, size * 0.05);
      ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
    }

    if (input.ask) {
      const { from, to } = input.ask;
      const { x, y } = at(from.row, from.col);
      const w = (to.col - from.col + 1) * size;
      const h = (to.row - from.row + 1) * size;
      const width = Math.max(2, size * 0.05);
      ctx.fillStyle = css(p.outline, 0.12);
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = css(p.outline);
      ctx.lineWidth = width;
      ctx.setLineDash([size * 0.14, size * 0.1]);
      ctx.strokeRect(x + width / 2, y + width / 2, w - width, h - width);
      ctx.setLineDash([]);
    }

    // Lines from square to square, kept clear of what sits on them.
    for (const line of input.lines) {
      const a = at(line.from.row, line.from.col);
      const b = at(line.to.row, line.to.col);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      const gap = Math.min(size * 0.38, length / 2);
      const ux = length ? dx / length : 0;
      const uy = length ? dy / length : 0;
      ctx.strokeStyle = css(p.conflict);
      ctx.lineWidth = Math.max(2, size * 0.06);
      ctx.lineCap = "round";
      ctx.setLineDash([size * 0.14, size * 0.1]);
      ctx.beginPath();
      // On a grid of digits, a line along a row or column runs by the squares' edge, clear of the digits between.
      const edge = size * 0.12;
      if (input.plain && line.from.row === line.to.row) {
        ctx.moveTo(a.x + size / 2, a.y + edge);
        ctx.lineTo(b.x + size / 2, b.y + edge);
      } else if (input.plain && line.from.col === line.to.col) {
        ctx.moveTo(a.x + edge, a.y + size / 2);
        ctx.lineTo(b.x + edge, b.y + size / 2);
      } else {
        ctx.moveTo(a.x + size / 2 + ux * gap, a.y + size / 2 + uy * gap);
        ctx.lineTo(b.x + size / 2 - ux * gap, b.y + size / 2 - uy * gap);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (let row = 0; row < input.rows; row++) {
      for (let col = 0; col < input.cols; col++) {
        const cell = input.cells[row * input.cols + col];
        if (!cell?.tone && !cell?.piece) continue;
        const { x, y } = at(row, col);
        const tone = cell.tone ?? "placed";
        // A ring marks the square itself: the queen that just moved, the square ruled out, its attacker.
        if (tone === "focus" || tone === "conflict" || tone === "attacker") {
          const color = tone === "focus" ? p.outline : p.conflict;
          const width = Math.max(2, size * 0.07);
          if (tone === "conflict") {
            ctx.fillStyle = css(p.conflict, 0.28);
            ctx.fillRect(x, y, size, size);
          }
          ctx.strokeStyle = css(color);
          ctx.lineWidth = width;
          ctx.strokeRect(x + width / 2, y + width / 2, size - width, size - width);
        }
        if (!cell.piece) continue;
        // The attacker stays a placed queen; only its ring says it's the one ruling the square out.
        const color =
          tone === "conflict" ? p.conflict : tone === "ghost" ? p.ghost : cell.given ? p.ink : p.placed;
        if (cell.piece.kind === "queen") this.queen(x, y, size, color, tone === "ghost" || tone === "conflict", p.background);
        else this.text(cell.piece.value, x, y, size, color, cell.given ? 700 : 500);
      }
    }

    // Labels: 1, 2, 3… down the side and across the top.
    ctx.fillStyle = css(p.label);
    ctx.font = `500 ${Math.max(9, Math.round(size * 0.24))}px "JetBrains Mono Variable", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    input.rowLabels?.forEach((label, row) => ctx.fillText(label, left - band / 2, at(row, 0).y + size / 2));
    input.colLabels?.forEach((label, col) => ctx.fillText(label, at(0, col).x + size / 2, top - band / 2));
  }

  /** A crown: five points on a band. Hollow for a queen only being tried, or one just taken back. */
  private queen(x: number, y: number, size: number, color: RGB, hollow: boolean, background: RGB) {
    const { ctx } = this;
    const s = size * 0.62;
    const cx = x + size / 2;
    const left = cx - s / 2;
    const right = cx + s / 2;
    const base = y + size / 2 + s * 0.36;
    const band = base - s * 0.2;
    const tipY = y + size / 2 - s * 0.32;
    const valleyY = band - s * 0.28;
    ctx.beginPath();
    ctx.moveTo(left, base);
    ctx.lineTo(left, tipY + s * 0.08);
    ctx.lineTo(left + s * 0.22, valleyY);
    ctx.lineTo(left + s * 0.33, tipY - s * 0.04);
    ctx.lineTo(cx, valleyY - s * 0.04);
    ctx.lineTo(right - s * 0.33, tipY - s * 0.04);
    ctx.lineTo(right - s * 0.22, valleyY);
    ctx.lineTo(right, tipY + s * 0.08);
    ctx.lineTo(right, base);
    ctx.closePath();
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1.5, size * 0.05);
    ctx.strokeStyle = css(color);
    ctx.fillStyle = css(hollow ? background : color, hollow ? 0.6 : 1);
    ctx.fill();
    ctx.stroke();
    // A band across the bottom, in the background color, so the crown reads at a glance.
    ctx.beginPath();
    ctx.moveTo(left + s * 0.06, band);
    ctx.lineTo(right - s * 0.06, band);
    ctx.strokeStyle = css(hollow ? color : background, 0.9);
    ctx.lineWidth = Math.max(1, size * 0.035);
    ctx.stroke();
  }

  private text(value: string, x: number, y: number, size: number, color: RGB, weight: number) {
    const { ctx } = this;
    ctx.fillStyle = css(color);
    ctx.font = `${weight} ${Math.round(size * 0.55)}px "Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, x + size / 2, y + size / 2);
  }
}
