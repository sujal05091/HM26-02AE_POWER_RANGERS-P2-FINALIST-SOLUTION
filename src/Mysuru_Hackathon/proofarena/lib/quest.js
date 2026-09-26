import { aiQuestQuiz, aiQuestCode, aiProvider } from './ai';
import { questFromBank } from './questBank';
import { verifyTask } from './codeRunner';

// The four stages of a 3D Quest, in order. The Community Camp opens after the last one.
export const QUEST_STAGES = [
  { id: 'mcq', title: 'Gate Quiz', place: 'Quest Gate', reward: 'Entry to the 3D world' },
  { id: 'arrow', title: 'Arrow Range', place: 'Arrow Range', reward: 'Your rifle' },
  { id: 'debug', title: 'Debug Den', place: 'Debug Den', reward: 'Key to the Algorithm Grove' },
  { id: 'dsa', title: 'Algorithm Grove', place: 'Algorithm Grove', reward: 'Community access' },
];

const parseCases = (cases) =>
  (cases || []).map((c) => ({ args: JSON.parse(c.argsJson), expected: JSON.parse(c.expectedJson) })).filter((c) => Array.isArray(c.args));

function cleanQuiz(ai) {
  const mcq = (ai?.mcq || [])
    .filter((m) => m.q && m.options?.length === 4 && m.answer >= 0 && m.answer < 4)
    .slice(0, 5)
    .map((m) => ({ q: m.q.trim(), options: m.options.map((o) => o.trim()), answer: m.answer, explain: m.explain.trim() }));
  const arrows = (ai?.arrows || [])
    .filter((a) => a.prompt && a.choices?.length === 3 && a.answer >= 0 && a.answer < 3)
    .slice(0, 5)
    .map((a) => ({ prompt: a.prompt.trim().slice(0, 48), choices: a.choices.map((c) => c.trim().slice(0, 18)), answer: a.answer }));
  return { mcq, arrows };
}

async function cleanCode(ai) {
  const out = { debug: null, dsa: null };
  if (!ai) return out;
  try {
    const d = ai.debug;
    const tests = parseCases(d.tests);
    const hidden = parseCases(d.hidden);
    // The bug must show in the VISIBLE tests (the student needs to see it), and the fix must pass everything.
    if (
      tests.length >= 2 &&
      (await verifyTask({ reference: d.reference, broken: d.buggyCode, functionName: d.functionName, tests })) &&
      (await verifyTask({ reference: d.reference, functionName: d.functionName, tests: [...tests, ...hidden] }))
    ) {
      out.debug = { title: d.title, story: d.story, functionName: d.functionName, buggyCode: d.buggyCode, reference: d.reference, tests, hidden, hint: d.hint };
    }
  } catch {}
  try {
    const s = ai.dsa;
    const examples = parseCases(s.examples);
    const hidden = parseCases(s.hidden);
    if (examples.length && hidden.length >= 3 && (await verifyTask({ reference: s.reference, functionName: s.functionName, tests: [...examples, ...hidden] }))) {
      out.dsa = { title: s.title, statement: s.statement, functionName: s.functionName, starterCode: s.starterCode, reference: s.reference, examples, hidden };
    }
  } catch {}
  return out;
}

// Generates a whole quest. AI content is used where it passes checks; the verified bank fills any gap.
export async function generateQuestContent({ title, jobDescription, skills }) {
  const bank = questFromBank(skills);
  const [quiz, code] = await Promise.all([aiQuestQuiz({ title, jobDescription, skills }), aiQuestCode({ title, skills })]);
  const q = cleanQuiz(quiz);
  const c = await cleanCode(code);
  const provider = aiProvider()?.label;
  const source = {
    mcq: q.mcq.length === 5 ? provider : 'Verified bank',
    arrows: q.arrows.length === 5 ? provider : 'Verified bank',
    debug: c.debug ? `${provider} · machine-verified` : 'Verified bank',
    dsa: c.dsa ? `${provider} · machine-verified` : 'Verified bank',
  };
  return {
    mcq: q.mcq.length === 5 ? q.mcq : bank.mcq,
    arrows: q.arrows.length === 5 ? q.arrows : bank.arrows,
    debug: c.debug || bank.debug,
    dsa: c.dsa || bank.dsa,
    source,
  };
}

// What the 3D world may see: no answers, no reference solutions, no hidden tests.
export function publicQuest(quest, company) {
  return {
    id: quest.id,
    title: quest.title,
    jobDescription: quest.jobDescription,
    skills: quest.skills,
    passMark: quest.passMark,
    company: company ? { name: company.name, color: company.color } : null,
    mcq: quest.mcq.map(({ q, options }) => ({ q, options })),
    arrows: quest.arrows.map(({ prompt, choices }) => ({ prompt, choices })),
    debug: { title: quest.debug.title, story: quest.debug.story, functionName: quest.debug.functionName, buggyCode: quest.debug.buggyCode, hint: quest.debug.hint, tests: quest.debug.tests, hiddenCount: (quest.debug.hidden || []).length },
    dsa: { title: quest.dsa.title, statement: quest.dsa.statement, functionName: quest.dsa.functionName, starterCode: quest.dsa.starterCode, examples: quest.dsa.examples, hiddenCount: quest.dsa.hidden.length },
  };
}
