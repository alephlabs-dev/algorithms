import { CheckCircledIcon, CrossCircledIcon, ResetIcon, TargetIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useElementSize } from "@/hooks/useElementSize";
import { localized } from "@/i18n";
import { useModuleUI } from "@/modules";
import { FEEDBACK_MS, isCellQuestion, type Question } from "@/game";
import { selectGameQuestion, selectGameUnavailable, selectGuessPlaying, useStore, type StoreState } from "@/store";
import { cn } from "@/utils/cn";
import { Button } from "./ui/button";

const text = localized({
  en: {
    dialog: "Your guess",
    status: "How it went",
    streak: (n: number) => ` ${n} in a row.`,
    score: (right: number, asked: number) => `Score: ${right} right out of ${asked}`,
    reset: (right: number, asked: number) => `Score ${right} out of ${asked}: start over`,
    resetTitle: "Start the score over",
    spots: "Spots",
    yes: "Yes",
    no: "No",
    /** The keys that answer yes and no, lowercase. */
    yesKey: "y",
    noKey: "n",
    idle: "Guess is on: playback stops before key moments to ask what comes next.",
  },
  es: {
    dialog: "Tu respuesta",
    status: "Cómo te fue",
    streak: (n) => ` ${n} seguidas.`,
    score: (right, asked) => `Puntaje: ${right} ${right === 1 ? "acierto" : "aciertos"} de ${asked}`,
    reset: (right, asked) => `Puntaje: ${right} de ${asked}. Empezar de nuevo`,
    resetTitle: "Reiniciar el puntaje",
    spots: "Lugares",
    yes: "Sí",
    no: "No",
    yesKey: "s",
    noKey: "n",
    idle: "Modo adivinanza: se detiene antes de cada momento clave para preguntarte qué sigue.",
  },
});

/** The score so far, "3/5", read out in full. */
export const Tally = ({ className }: { className?: string }) => {
  const score = useStore((s) => s.gameScore);
  return (
    <span
      role="img"
      aria-label={text.score(score.right, score.asked)}
      className={cn("shrink-0 font-mono text-xs font-semibold text-foreground/70", className)}
    >
      {score.right}/{score.asked}
    </span>
  );
};

/** Guess mode's panel under the stage: at least this tall, with this much space above it (CSS pixels). */
const GAME_PANEL_MIN_HEIGHT = 112;
const GAME_PANEL_GAP = 8;
/**
 * Room the panel takes from the stage while guess mode is on, on screens wider than a phone:
 * what a stage sizing itself for it subtracts. Phones take none (the question takes the dock's place).
 */
export const GAME_ROOM = GAME_PANEL_MIN_HEIGHT + GAME_PANEL_GAP;

const optionClass =
  "tap-target relative h-10 min-w-12 rounded-full border border-line/70 px-4 font-mono text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary";

type Feedback = NonNullable<StoreState["gameFeedback"]>;

/** In the guess view, and guess mode can play the run on stage. */
const useGuessOn = () => useStore(selectGuessPlaying);

/** The card guess mode asks and answers in. */
const Card = ({
  question,
  right,
  className,
  style,
  children,
}: {
  question: boolean;
  right?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div
    role={question ? "dialog" : undefined}
    aria-label={question ? text.dialog : undefined}
    style={style}
    className={cn(
      "flex min-h-14 w-full flex-col justify-center gap-2 rounded-2xl border bg-surface px-4 py-2.5 shadow-lg",
      right ? "border-primary" : "border-edge",
      className,
    )}
  >
    {children}
  </div>
);

/** How the last answer went, with the score's reset beside it. */
const FeedbackLine = ({ feedback }: { feedback: Feedback }) => {
  const { score, reset } = useStore(useShallow((s) => ({ score: s.gameScore, reset: s.resetGame })));
  return (
    <p role="status" aria-label={text.status} className="flex items-start gap-2 text-sm text-foreground">
      {feedback.right ? (
        <CheckCircledIcon className="mt-0.5 shrink-0 text-primary" />
      ) : (
        <CrossCircledIcon className="mt-0.5 shrink-0 text-tertiary" />
      )}
      <span className="flex-1">
        {feedback.text}
        {feedback.right && score.streak > 1 && (
          <span className="font-semibold text-primary">{text.streak(score.streak)}</span>
        )}
      </span>
      <Tally className="mt-0.5" />
      <button
        type="button"
        onClick={reset}
        className="tap-target relative shrink-0 rounded-full p-1 text-foreground/60 hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={text.reset(score.right, score.asked)}
        title={text.resetTitle}
      >
        <ResetIcon />
      </button>
    </p>
  );
};

/** A question's prompt and the ways to answer it. */
const QuestionBody = ({ question }: { question: Question }) => {
  const answer = useStore((s) => s.answerGame);
  return (
    <>
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <TargetIcon className="shrink-0 text-secondary" />
        <span className="flex-1">{question.prompt}</span>
        <Tally />
      </p>
      {question.kind === "choice" && (
        <div className="flex flex-wrap gap-2">
          {question.options.map((option, k) => {
            const label = question.optionLabels?.[k] ?? String(option);
            return (
              <button
                key={option}
                type="button"
                // Numbers stay monospaced so they line up; words ("Dead end", "4 stays") read in the body font.
                className={cn(optionClass, !/^\d+$/.test(label) && "font-sans")}
                onClick={() => answer(option)}
                aria-keyshortcuts={/^[A-Z]$/.test(label) ? `${k + 1} ${label}` : String(k + 1)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {question.kind === "slot" && (
        // The spots as buttons too: for keyboards, screen readers and fingers on small trees.
        <div
          role="group"
          aria-label={text.spots}
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] pointer-coarse:-my-1.5 pointer-coarse:py-1.5"
        >
          {question.slots.map((slot) => (
            <button
              key={slot.key}
              type="button"
              className="tap-target relative h-8 shrink-0 whitespace-nowrap rounded-full border border-line/70 px-3 text-xs text-foreground/85 transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => answer(slot.key)}
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
      {question.kind === "yesno" && (
        <div className="flex gap-2">
          <button type="button" className={optionClass} onClick={() => answer(true)} aria-keyshortcuts={text.yesKey.toUpperCase()}>
            {text.yes}
          </button>
          <button type="button" className={optionClass} onClick={() => answer(false)} aria-keyshortcuts={text.noKey.toUpperCase()}>
            {text.no}
          </button>
        </div>
      )}
    </>
  );
};

/** Keys: 1–4 pick an option, Y and N (S and N in Spanish) answer yes-or-no, letters pick lettered cells. */
const useAnswerKeys = (question: Question | null) => {
  const answer = useStore((s) => s.answerGame);
  useEffect(() => {
    if (!question || question.kind === "slot") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.metaKey || event.ctrlKey) return;
      if (question.kind === "yesno") {
        if (event.key === text.yesKey) answer(true);
        if (event.key === text.noKey) answer(false);
        return;
      }
      const k = Number(event.key);
      if (k >= 1 && k <= question.options.length) answer(question.options[k - 1]);
      // Lettered options (pathfinding's A–D cells) answer to their letter too.
      const lettered = question.optionLabels?.findIndex((l) => /^[A-Z]$/.test(l) && l === event.key.toUpperCase()) ?? -1;
      if (lettered >= 0) answer(question.options[lettered]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, answer]);
};

/**
 * The last answer's explanation while it's up: a few seconds, then it gets out of the way.
 * Not over a question that letters grid cells (stepped to by hand; playback waits for it
 * to go): the explanation's letters would point at the new cells.
 */
const useShownFeedback = (question: Question | null): Feedback | null => {
  const feedback = useStore((s) => s.gameFeedback);
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (!feedback) return;
    const show = window.setTimeout(() => setShown(feedback.id), 0);
    const hide = window.setTimeout(() => setShown(null), FEEDBACK_MS);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [feedback]);
  return feedback !== null && shown === feedback.id && !isCellQuestion(question) ? feedback : null;
};

/**
 * Guess mode on the stage. Wider than a phone: under the stage, the question waiting for an
 * answer or how the last one went, in room the stage gives up once while guess mode is on.
 * Phones have no room to give: the question takes the dock's place (GameDock), and the
 * explanation floats just above the stage for a few seconds.
 */
export const GameLayer = () => {
  const { question, phone } = useStore(useShallow((s) => ({ question: selectGameQuestion(s), phone: s.isMobile })));
  const on = useGuessOn();
  const feedback = useShownFeedback(question);
  useAnswerKeys(on ? question : null);
  if (!on) return null;

  if (phone)
    return (
      // Just above the stage, over the step sentence and the pickers for those few seconds:
      // the stage stays in full view, with whatever the explanation talks about.
      <div className="pointer-events-none absolute inset-x-0 bottom-full z-10 mb-2 flex items-end justify-center">
        {feedback && (
          <Card question={false} right={feedback.right} className="pointer-events-auto">
            <FeedbackLine feedback={feedback} />
          </Card>
        )}
      </div>
    );

  return (
    // Its size comes from GAME_PANEL_MIN_HEIGHT and GAME_PANEL_GAP, so GAME_ROOM always matches it.
    <div
      className="flex shrink-0 flex-col justify-end"
      style={{ minHeight: GAME_PANEL_MIN_HEIGHT, marginTop: GAME_PANEL_GAP }}
    >
      {question || feedback ? (
        <Card question={question !== null} right={!question && feedback?.right}>
          {feedback && <FeedbackLine feedback={feedback} />}
          {question && <QuestionBody question={question} />}
        </Card>
      ) : (
        <p className="flex items-center gap-2 px-1 pb-2 text-sm text-foreground/60">
          <TargetIcon className="shrink-0" />
          <span className="flex-1">{text.idle}</span>
          <Tally />
        </p>
      )}
    </div>
  );
};

/** Why the guess view can't play the run on stage, and the one tap that makes it playable, if there is one. */
const UnavailableNote = ({ why }: { why: string }) => {
  const { gameFix } = useModuleUI();
  // Only the label: the fix itself is worked out on the tap, from the store as it is then.
  const fixLabel = useStore((s) => gameFix?.(s)?.label ?? null);
  return (
    <>
      <p className="flex items-center gap-2 text-sm text-foreground">
        <TargetIcon className="shrink-0 text-foreground/60" />
        <span className="flex-1">{why}.</span>
      </p>
      {fixLabel && (
        <Button variant="secondary" size="sm" className="self-start" onClick={() => gameFix?.(useStore.getState())?.apply()}>
          {fixLabel}
        </Button>
      )}
    </>
  );
};

/**
 * The playback dock, and in its place on phones the question waiting for an answer: at least
 * as tall as the dock was, so the stage keeps its size. Playback can't go on until it's
 * answered; then the dock is back. In the guess view, while guess mode can't play the run on
 * stage, a note says why in its place on every screen. The dock stays mounted throughout: it drives playback.
 */
export const GameDock = ({ hidden, children }: { hidden?: boolean; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { height } = useElementSize(ref);
  // The dock's height while it was last on screen (0 while hidden).
  const [dockHeight, setDockHeight] = useState(0);
  if (height > 0 && height !== dockHeight) setDockHeight(height);
  const waiting = useStore((s) => (s.isMobile ? selectGameQuestion(s) : null));
  const question = useGuessOn() ? waiting : null;
  const unavailable = useStore((s) => (s.view === "guess" ? selectGameUnavailable(s) : null));
  const replaced = question !== null || unavailable !== null;
  return (
    <>
      <div ref={ref} className={cn("w-full", (hidden || replaced) && "hidden")}>
        {children}
      </div>
      {replaced && !hidden && (
        <Card question={question !== null} className="mx-auto max-w-5xl rounded-3xl p-4" style={{ minHeight: dockHeight || undefined }}>
          {question ? <QuestionBody question={question} /> : unavailable && <UnavailableNote why={unavailable} />}
        </Card>
      )}
    </>
  );
};
