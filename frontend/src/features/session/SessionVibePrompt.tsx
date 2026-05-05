/**
 * SessionVibePrompt — "Where to Tonight?"
 *
 * Shown to returning users at the start of each session (once per day).
 * Presents 3 quick multiple-choice questions. Answers are sent to Claude
 * which blends them with the user's base profile into a session vector.
 *
 * Skip → proceed directly to discovery with the base profile.
 */

import { useState } from 'react';
import { useStore } from '../../store/index';
import { inferSessionVector } from '../../lib/claude';
import type { VenueVector } from '@venuematch/shared';

// ── Question bank (3 are shown per session, rotating) ───────────────────────

interface Question {
  id: string;
  text: string;
  options: Array<{ label: string; value: string }>;
}

const ALL_QUESTIONS: Question[] = [
  {
    id: 'energy',
    text: 'What energy are you bringing tonight?',
    options: [
      { label: '😌 Chill',        value: 'chill — low energy, relaxed' },
      { label: '🙂 Moderate',     value: 'moderate — social, easygoing' },
      { label: '⚡ High energy',  value: 'high energy — ready to dance and go hard' },
    ],
  },
  {
    id: 'intent',
    text: "Who's coming out tonight?",
    options: [
      { label: '🚶 Just me',       value: 'solo — open to meeting people' },
      { label: '💑 Date night',    value: 'date night — intimate vibe, good conversation' },
      { label: '👥 Small group',   value: 'small friend group — 3-6 people' },
      { label: '🎉 Big group',     value: 'big group — 7+ people, we take over a corner' },
    ],
  },
  {
    id: 'genre_mood',
    text: "What's calling to you musically?",
    options: [
      { label: '🎛️ Electronic / dance',  value: 'electronic or dance music — techno, house, disco' },
      { label: '🎤 Hip-hop / R&B',        value: 'hip-hop or R&B vibes' },
      { label: '🎸 Live / indie',          value: 'live music or indie / rock' },
      { label: '🎺 Jazz / soul',           value: 'jazz or soul — something timeless' },
      { label: '🎲 Surprise me',           value: 'surprise me — open to anything good' },
    ],
  },
  {
    id: 'timing',
    text: 'How are you pacing tonight?',
    options: [
      { label: '🌅 Early bird',    value: 'getting there early — dinner drinks, maybe home by midnight' },
      { label: '🌙 Prime time',    value: 'standard — out by 10pm, home by 2am' },
      { label: '🌑 Late night',    value: 'late night — nothing starts before midnight' },
      { label: '🤷 Wherever',      value: "doesn't matter — going wherever the night takes me" },
    ],
  },
  {
    id: 'cost',
    text: "What's the vibe on spending tonight?",
    options: [
      { label: '💸 Whatever',     value: 'spending freely — bottle service is on the table' },
      { label: '🍸 Normal night', value: 'normal — $15 drinks, maybe a cover' },
      { label: '🍺 Budget night', value: 'budget — keeping it cheap, no covers' },
    ],
  },
];

// Pick 3 questions for this session (deterministic by day)
function pickQuestions(): Question[] {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const start = dayIndex % (ALL_QUESTIONS.length - 2);
  return [
    ALL_QUESTIONS[start % ALL_QUESTIONS.length],
    ALL_QUESTIONS[(start + 1) % ALL_QUESTIONS.length],
    ALL_QUESTIONS[(start + 2) % ALL_QUESTIONS.length],
  ];
}

// ── Component ────────────────────────────────────────────────────────────────

interface SessionVibePromptProps {
  onDone: () => void;
}

export function SessionVibePrompt({ onDone }: SessionVibePromptProps) {
  const { userVectors, setSessionVector, clearSession } = useStore();
  const [questions] = useState<Question[]>(() => pickQuestions());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const allAnswered = questions.every((q) => answers[q.id]);

  function answer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleGo() {
    if (!allAnswered) return;
    setLoading(true);

    try {
      if (userVectors) {
        const sessionVec: VenueVector = await inferSessionVector(answers, userVectors);
        setSessionVector(sessionVec);
      }
    } catch (err) {
      console.error('inferSessionVector failed:', err);
      // Still proceed; base vector will be used
    } finally {
      setLoading(false);
      onDone();
    }
  }

  function handleSkip() {
    clearSession();
    onDone();
  }

  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-[var(--bg-base)] px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-3">🌃</div>
          <h1 className="text-2xl font-bold text-white">Where to tonight?</h1>
          <p className="text-soft text-sm mt-1">
            Answer 3 quick questions and we'll tune tonight's picks just for you.
          </p>
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-5">
          {questions.map((q, qi) => (
            <div key={q.id} className="glass rounded-2xl p-4">
              <p className="text-white text-sm font-medium mb-3">
                <span className="text-brand-purple mr-1">{qi + 1}.</span> {q.text}
              </p>
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => answer(q.id, opt.value)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] ${
                        selected
                          ? 'bg-brand-purple text-white font-medium'
                          : 'bg-white/5 text-soft hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGo}
            disabled={!allAnswered || loading}
            className="w-full bg-brand-purple text-white py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-900/40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Tuning tonight's picks…
              </span>
            ) : (
              "Let's go →"
            )}
          </button>
          <button
            onClick={handleSkip}
            className="w-full text-soft text-sm py-2 hover:text-white transition-colors"
          >
            Skip — use my regular profile
          </button>
        </div>
      </div>
    </div>
  );
}
