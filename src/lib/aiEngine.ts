import type {
  Question,
  Blueprint,
  Syllabus,
  AssessmentAnalysis,
  BlindSpot,
  AnalysisIssue,
  AmbiguityIssue,
  MarkingStep,
} from '@/types';
import { BLOOM_LEVELS, DIFFICULTY_LEVELS } from '@/types';

// ─── BLOOM CLASSIFICATION ──────────────────────────────────────────────────

const BLOOM_KEYWORDS: Record<string, string[]> = {
  Remember: ['define', 'list', 'name', 'identify', 'recall', 'state', 'label', 'what is', 'who', 'when', 'where'],
  Understand: ['explain', 'describe', 'summarize', 'discuss', 'interpret', 'classify', 'compare', 'contrast', 'outline'],
  Apply: ['apply', 'solve', 'calculate', 'demonstrate', 'implement', 'use', 'compute', 'determine', 'find'],
  Analyze: ['analyze', 'differentiate', 'examine', 'investigate', 'break down', 'distinguish', 'test', 'diagnose'],
  Evaluate: ['evaluate', 'justify', 'critique', 'assess', 'argue', 'defend', 'judge', 'recommend', 'rate'],
  Create: ['design', 'create', 'develop', 'formulate', 'construct', 'propose', 'invent', 'generate', 'plan'],
};

export function classifyBloom(questionText: string): string {
  const lower = questionText.toLowerCase();
  let bestMatch = 'Understand';
  let bestScore = 0;

  for (const level of BLOOM_LEVELS) {
    const keywords = BLOOM_KEYWORDS[level];
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = level;
    }
  }
  return bestMatch;
}

// ─── DIFFICULTY ESTIMATION ──────────────────────────────────────────────────

export function estimateDifficulty(questionText: string, marks: number, bloomLevel: string): string {
  const wordCount = questionText.split(/\s+/).length;
  let score = 0;

  if (wordCount > 40) score += 2;
  else if (wordCount > 20) score += 1;

  if (marks >= 10) score += 2;
  else if (marks >= 5) score += 1;

  const bloomIdx = BLOOM_LEVELS.indexOf(bloomLevel as typeof BLOOM_LEVELS[number]);
  if (bloomIdx >= 4) score += 2;
  else if (bloomIdx >= 2) score += 1;

  const complexWords = ['analyze', 'compare', 'evaluate', 'design', 'derive', 'prove', 'optimize', 'critique'];
  const lower = questionText.toLowerCase();
  for (const w of complexWords) {
    if (lower.includes(w)) score += 1;
  }

  if (score >= 5) return 'Hard';
  if (score >= 2) return 'Medium';
  return 'Easy';
}

// ─── AMBIGUITY DETECTION ────────────────────────────────────────────────────

const AMBIGUITY_PATTERNS: { pattern: RegExp; problem: string; suggestion: string }[] = [
  {
    pattern: /^(explain|describe|discuss)\s+\w+$/i,
    problem: 'Question is too broad and may lead to inconsistent answers.',
    suggestion: 'Add specificity: include a particular aspect, scenario, or constraint to narrow the scope.',
  },
  {
    pattern: /\b(briefly|shortly|in short)\b/i,
    problem: 'Vague length qualifier makes marking subjective.',
    suggestion: 'Specify expected length or key points to cover (e.g., "in 3-4 sentences" or "covering these 3 aspects").',
  },
  {
    pattern: /^(what|why|how)\s+\w+\??$/i,
    problem: 'Single-word question stem lacks context and scope.',
    suggestion: 'Add context: specify the domain, scenario, or framework the answer should address.',
  },
  {
    pattern: /\betc\b/i,
    problem: 'Use of "etc" makes the expected answer set unclear.',
    suggestion: 'List the specific items expected, or use "including but not limited to" with examples.',
  },
  {
    pattern: /\b(some|few|several|various)\b/i,
    problem: 'Quantifier is vague — students may not know how many items to provide.',
    suggestion: 'Replace with a specific number (e.g., "three" instead of "several").',
  },
];

export function detectAmbiguity(questionText: string): AmbiguityIssue[] {
  const issues: AmbiguityIssue[] = [];
  for (const { pattern, problem, suggestion } of AMBIGUITY_PATTERNS) {
    if (pattern.test(questionText.trim())) {
      issues.push({ problem, suggestion });
    }
  }
  if (questionText.split(/\s+/).length < 5) {
    issues.push({
      problem: 'Question is very short and may lack sufficient context.',
      suggestion: 'Expand the question with a scenario, context, or specific domain reference.',
    });
  }
  return issues;
}

// ─── SECURITY ANALYSIS ──────────────────────────────────────────────────────

export interface SecurityAnalysis {
  ai_vulnerability: string;
  public_risk: string;
  reasoning_requirement: string;
  security_risk: string;
  reason: string;
}

export function analyzeSecurity(questionText: string, bloomLevel: string): SecurityAnalysis {
  const lower = questionText.toLowerCase();
  let vulnScore = 0;
  let publicScore = 0;
  let reasoningScore = 0;

  // Generic/common textbook phrases increase AI vulnerability
  const genericPhrases = ['define', 'what is', 'explain', 'list', 'state', 'name the'];
  for (const p of genericPhrases) {
    if (lower.includes(p)) vulnScore += 1;
  }

  // Short questions are more AI-vulnerable
  if (questionText.split(/\s+/).length < 15) vulnScore += 2;

  // Lower Bloom = more AI vulnerable
  const bloomIdx = BLOOM_LEVELS.indexOf(bloomLevel as typeof BLOOM_LEVELS[number]);
  if (bloomIdx <= 1) vulnScore += 2;
  else if (bloomIdx <= 3) vulnScore += 1;

  // Scenario-based questions are safer
  if (lower.includes('scenario') || lower.includes('given') || lower.includes('case study')) {
    vulnScore -= 2;
    publicScore -= 1;
  }

  // Specific numbers/data reduce public risk
  if (/\d/.test(questionText) && questionText.split(/\s+/).length > 20) {
    publicScore -= 1;
  }

  // Very common textbook topics
  const commonTopics = ['networking', 'sorting', 'data structure', 'oop', 'database', 'operating system'];
  for (const t of commonTopics) {
    if (lower.includes(t)) publicScore += 1;
  }

  // Reasoning requirement
  if (bloomIdx >= 3) reasoningScore += 2;
  else if (bloomIdx >= 1) reasoningScore += 1;
  if (lower.includes('why') || lower.includes('justify') || lower.includes('compare')) reasoningScore += 1;

  const aiVuln = vulnScore >= 4 ? 'High' : vulnScore >= 2 ? 'Medium' : 'Low';
  const pubRisk = publicScore >= 2 ? 'High' : publicScore >= 1 ? 'Medium' : 'Low';
  const reasoning = reasoningScore >= 3 ? 'High' : reasoningScore >= 1 ? 'Medium' : 'Low';
  const secRisk = (vulnScore + publicScore) >= 5 ? 'High' : (vulnScore + publicScore) >= 2 ? 'Medium' : 'Low';

  const reasons: string[] = [];
  if (aiVuln === 'High') reasons.push('This question is generic and can be answered using common memorized explanations.');
  if (pubRisk === 'High') reasons.push('This topic commonly appears in publicly available question banks.');
  if (reasoning === 'Low') reasons.push('The question requires minimal reasoning beyond recall.');
  if (reasons.length === 0) reasons.push('The question shows reasonable specificity and cognitive demand.');

  return {
    ai_vulnerability: aiVuln,
    public_risk: pubRisk,
    reasoning_requirement: reasoning,
    security_risk: secRisk,
    reason: reasons.join(' '),
  };
}

// ─── QUESTION IMPROVEMENT ───────────────────────────────────────────────────

export function improveQuestion(question: Question): string {
  const sec = analyzeSecurity(question.question_text, question.bloom_level);
  let improved = question.question_text;

  if (sec.ai_vulnerability === 'High' || sec.public_risk === 'High') {
    const topic = question.topic || question.unit || 'the given context';
    if (question.bloom_level === 'Remember' || question.bloom_level === 'Understand') {
      improved = `Given a real-world scenario in ${topic}, ${improved.charAt(0).toLowerCase()}${improved.slice(1)} Justify your answer with a specific example.`;
    } else {
      improved = `In the context of ${topic}, ${improved.charAt(0).toLowerCase()}${improved.slice(1)} Support your response with a concrete example or case study.`;
    }
  }

  const amb = detectAmbiguity(question.question_text);
  if (amb.length > 0) {
    if (improved === question.question_text) {
      improved = `${improved} Provide a structured response covering key aspects, supported by relevant examples.`;
    }
  }

  return improved;
}

// ─── QUESTION GENERATION ───────────────────────────────────────────────────

export interface GeneratedQuestion {
  question_text: string;
  marks: number;
  unit: string;
  topic: string;
  bloom_level: string;
  difficulty: string;
  co_code: string;
  po_codes: string[];
  question_type: string;
  source_reference: string;
}

const QUESTION_TEMPLATES: Record<string, { stem: (topic: string) => string; bloom: string; type: string }[]> = {
  Remember: [
    { stem: (t) => `Define the concept of ${t} and list its key characteristics.`, bloom: 'Remember', type: 'Short Answer' },
    { stem: (t) => `Identify the fundamental principles underlying ${t}.`, bloom: 'Remember', type: 'Short Answer' },
  { stem: (t) => `State the primary components and terminology associated with ${t}.`, bloom: 'Remember', type: 'Short Answer' },
  ],
  Understand: [
    { stem: (t) => `Explain the working mechanism of ${t} with a suitable example.`, bloom: 'Understand', type: 'Long Answer' },
    { stem: (t) => `Describe the significance of ${t} in the broader context of the subject.`, bloom: 'Understand', type: 'Long Answer' },
    { stem: (t) => `Summarize the key concepts of ${t} and how they relate to each other.`, bloom: 'Understand', type: 'Long Answer' },
  ],
  Apply: [
    { stem: (t) => `Given a practical scenario involving ${t}, solve the problem and show all steps.`, bloom: 'Apply', type: 'Long Answer' },
    { stem: (t) => `Apply the principles of ${t} to solve a real-world problem. Justify your approach.`, bloom: 'Apply', type: 'Long Answer' },
    { stem: (t) => `Demonstrate how ${t} can be implemented in a practical system. Provide a worked example.`, bloom: 'Apply', type: 'Long Answer' },
  ],
  Analyze: [
    { stem: (t) => `Analyze the time and space complexity of ${t}, and compare it with an alternative approach.`, bloom: 'Analyze', type: 'Long Answer' },
    { stem: (t) => `Compare and contrast different approaches to ${t}. Discuss trade-offs and suitability.`, bloom: 'Analyze', type: 'Long Answer' },
    { stem: (t) => `Examine the limitations of ${t} and propose areas for improvement.`, bloom: 'Analyze', type: 'Long Answer' },
  ],
  Evaluate: [
    { stem: (t) => `Evaluate the effectiveness of ${t} in solving the given class of problems. Justify with evidence.`, bloom: 'Evaluate', type: 'Long Answer' },
    { stem: (t) => `Critically assess the design decisions in ${t}. Recommend improvements with reasoning.`, bloom: 'Evaluate', type: 'Long Answer' },
  ],
  Create: [
    { stem: (t) => `Design a complete solution using ${t} for a given problem statement. Include architecture and justification.`, bloom: 'Create', type: 'Long Answer' },
    { stem: (t) => `Propose a novel approach based on ${t} to address a current limitation. Provide a detailed plan.`, bloom: 'Create', type: 'Long Answer' },
  ],
};

export function generateQuestions(
  syllabus: Syllabus,
  blueprint: Blueprint,
  coCodes: string[],
  poCodes: string[]
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const numQ = blueprint.num_questions || 10;
  const totalMarks = 50;

  // Collect all topics from syllabus units
  const allTopics: { unit: string; topic: string }[] = [];
  for (const unit of syllabus.units) {
    for (const topic of unit.topics) {
      allTopics.push({ unit: unit.name, topic });
    }
  }

  if (allTopics.length === 0) {
    // Fallback topics
    allTopics.push({ unit: 'General', topic: 'the subject fundamentals' });
  }

  // Distribute questions by Bloom
  const bloomDist = blueprint.bloom_distribution || {};
  const bloomCounts: Record<string, number> = {};
  let assigned = 0;
  for (const level of BLOOM_LEVELS) {
    const pct = bloomDist[level] || 0;
    const count = Math.round((pct / 100) * numQ);
    bloomCounts[level] = count;
    assigned += count;
  }
  // Adjust to match numQ
  if (assigned < numQ) {
    bloomCounts['Apply'] = (bloomCounts['Apply'] || 0) + (numQ - assigned);
  } else if (assigned > numQ) {
    const excess = assigned - numQ;
    for (const level of [...BLOOM_LEVELS].reverse()) {
      if (bloomCounts[level] > excess) {
        bloomCounts[level] -= excess;
        break;
      }
    }
  }

  // Difficulty distribution
  const diffDist = blueprint.difficulty_distribution || {};
  const diffCounts: Record<string, number> = {};
  let diffAssigned = 0;
  for (const d of DIFFICULTY_LEVELS) {
    const pct = diffDist[d] || 0;
    const count = Math.round((pct / 100) * numQ);
    diffCounts[d] = count;
    diffAssigned += count;
  }
  if (diffAssigned < numQ) {
    diffCounts['Medium'] = (diffCounts['Medium'] || 0) + (numQ - diffAssigned);
  }

  // Generate questions
  let topicIdx = 0;
  let qNum = 0;
  const marksPerQ = Math.ceil(totalMarks / numQ);

  for (const level of BLOOM_LEVELS) {
    const count = bloomCounts[level] || 0;
    const templates = QUESTION_TEMPLATES[level] || QUESTION_TEMPLATES['Understand'];
    for (let i = 0; i < count && qNum < numQ; i++) {
      const topicInfo = allTopics[topicIdx % allTopics.length];
      topicIdx++;
      const template = templates[i % templates.length];
      const difficulty = pickDifficulty(diffCounts);
      const co = coCodes[qNum % Math.max(coCodes.length, 1)] || `CO${(qNum % 3) + 1}`;
      const po = poCodes ? [poCodes[qNum % Math.max(poCodes.length, 1)] || `PO${(qNum % 3) + 1}`] : [`PO${(qNum % 3) + 1}`];

      questions.push({
        question_text: template.stem(topicInfo.topic),
        marks: marksPerQ,
        unit: topicInfo.unit,
        topic: topicInfo.topic,
        bloom_level: template.bloom,
        difficulty,
        co_code: co,
        po_codes: po,
        question_type: template.type,
        source_reference: `${topicInfo.unit} → ${topicInfo.topic}`,
      });
      qNum++;
    }
  }

  return questions;
}

function pickDifficulty(diffCounts: Record<string, number>): string {
  for (const d of DIFFICULTY_LEVELS) {
    if (diffCounts[d] > 0) {
      diffCounts[d]--;
      return d;
    }
  }
  return 'Medium';
}

// ─── SYLLABUS COVERAGE & BLIND SPOTS ────────────────────────────────────────

export function calculateSyllabusCoverage(questions: Question[], syllabus: Syllabus): {
  coverage: number;
  blindSpots: BlindSpot[];
  unitCoverage: Record<string, number>;
} {
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0) || 1;
  const unitMarks: Record<string, number> = {};

  for (const q of questions) {
    unitMarks[q.unit] = (unitMarks[q.unit] || 0) + q.marks;
  }

  const blindSpots: BlindSpot[] = [];
  const unitCoverage: Record<string, number> = {};
  let coveredUnits = 0;
  const totalUnits = syllabus.units.length || 1;

  for (const unit of syllabus.units) {
    const marks = unitMarks[unit.name] || 0;
    const pct = (marks / totalMarks) * 100;
    unitCoverage[unit.name] = Math.round(pct);

    const expected = unit.weightage || Math.round(100 / totalUnits);

    if (pct === 0) {
      blindSpots.push({
        unit: unit.name,
        coverage: 0,
        expected,
        recommendation: `No questions assess ${unit.name}. Add at least one question covering key topics from this unit.`,
      });
    } else if (pct < expected * 0.5) {
      const missingTopics = unit.topics.filter(
        (t) => !questions.some((q) => q.topic === t)
      );
      blindSpots.push({
        unit: unit.name,
        coverage: Math.round(pct),
        expected,
        recommendation: missingTopics.length > 0
          ? `${unit.name} is underrepresented. Consider adding a question on ${missingTopics[0]}.`
          : `${unit.name} is underrepresented. Consider adding more questions from this unit.`,
      });
    } else {
      coveredUnits++;
    }
  }

  const coverage = Math.round((coveredUnits / totalUnits) * 100);
  return { coverage, blindSpots, unitCoverage };
}

// ─── BLOOM DISTRIBUTION ANALYSIS ─────────────────────────────────────────────

export function calculateBloomDistribution(questions: Question[]): Record<string, number> {
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0) || 1;
  const dist: Record<string, number> = {};
  for (const level of BLOOM_LEVELS) {
    const marks = questions.filter((q) => q.bloom_level === level).reduce((s, q) => s + q.marks, 0);
    dist[level] = Math.round((marks / totalMarks) * 100);
  }
  return dist;
}

export function calculateDifficultyDistribution(questions: Question[]): Record<string, number> {
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0) || 1;
  const dist: Record<string, number> = {};
  for (const d of DIFFICULTY_LEVELS) {
    const marks = questions.filter((q) => q.difficulty === d).reduce((s, q) => s + q.marks, 0);
    dist[d] = Math.round((marks / totalMarks) * 100);
  }
  return dist;
}

export function calculateBloomBalance(actual: Record<string, number>, target: Record<string, number>): {
  score: number;
  issues: string[];
} {
  let totalDiff = 0;
  let levels = 0;
  const issues: string[] = [];

  for (const level of BLOOM_LEVELS) {
    const a = actual[level] || 0;
    const t = target[level] || 0;
    const diff = Math.abs(a - t);
    totalDiff += diff;
    levels++;
    if (diff > 10) {
      if (a < t) {
        issues.push(`${level}-level questions are below the blueprint requirement (target ${t}%, actual ${a}%).`);
      } else {
        issues.push(`${level}-level questions exceed the blueprint target (target ${t}%, actual ${a}%).`);
      }
    }
  }

  const avgDiff = levels > 0 ? totalDiff / levels : 0;
  const score = Math.max(0, Math.round(100 - avgDiff * 2));
  return { score, issues };
}

// ─── CO / PO COVERAGE ───────────────────────────────────────────────────────

export function calculateCOCoverage(questions: Question[]): Record<string, number> {
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0) || 1;
  const dist: Record<string, number> = {};
  for (const q of questions) {
    if (q.co_code) {
      dist[q.co_code] = (dist[q.co_code] || 0) + q.marks;
    }
  }
  for (const key of Object.keys(dist)) {
    dist[key] = Math.round((dist[key] / totalMarks) * 100);
  }
  return dist;
}

export function calculatePOCoverage(questions: Question[]): Record<string, number> {
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0) || 1;
  const dist: Record<string, number> = {};
  for (const q of questions) {
    for (const po of q.po_codes || []) {
      dist[po] = (dist[po] || 0) + q.marks;
    }
  }
  for (const key of Object.keys(dist)) {
    dist[key] = Math.round((dist[key] / totalMarks) * 100);
  }
  return dist;
}

export function calculateCOPOMatrix(questions: Question[]): Record<string, Record<string, string>> {
  const matrix: Record<string, Record<string, number>> = {};
  for (const q of questions) {
    if (!q.co_code) continue;
    if (!matrix[q.co_code]) matrix[q.co_code] = {};
    for (const po of q.po_codes || []) {
      matrix[q.co_code][po] = (matrix[q.co_code][po] || 0) + q.marks;
    }
  }

  // Convert to High/Med/Low/None
  const result: Record<string, Record<string, string>> = {};
  const allPOs = new Set<string>();
  for (const co of Object.keys(matrix)) {
    for (const po of Object.keys(matrix[co])) {
      allPOs.add(po);
    }
  }

  for (const co of Object.keys(matrix)) {
    result[co] = {};
    for (const po of allPOs) {
      const marks = matrix[co][po] || 0;
      if (marks === 0) result[co][po] = 'None';
      else if (marks >= 10) result[co][po] = 'High';
      else if (marks >= 5) result[co][po] = 'Med';
      else result[co][po] = 'Low';
    }
  }
  return result;
}

// ─── ANSWER KEY GENERATION ──────────────────────────────────────────────────

export function generateAnswerKey(question: Question): { answer: string; markingScheme: MarkingStep[] } {
  const bloom = question.bloom_level;
  const topic = question.topic || 'the topic';
  const marks = question.marks;

  let answer = '';
  let scheme: MarkingStep[] = [];

  if (bloom === 'Remember') {
    answer = `Key answer: Provide the definition and key characteristics of ${topic}. Include the fundamental terminology and list the primary components.`;
    scheme = [
      { label: 'Correct definition', marks: Math.ceil(marks * 0.4) },
      { label: 'Key characteristics listed', marks: Math.ceil(marks * 0.3) },
      { label: 'Proper terminology used', marks: Math.ceil(marks * 0.3) },
    ];
  } else if (bloom === 'Understand') {
    answer = `Expected answer: Explain the concept of ${topic} with a clear description of how it works. Include a relevant example to illustrate understanding.`;
    scheme = [
      { label: 'Concept explanation', marks: Math.ceil(marks * 0.3) },
      { label: 'Working mechanism described', marks: Math.ceil(marks * 0.3) },
      { label: 'Relevant example provided', marks: Math.ceil(marks * 0.2) },
      { label: 'Clarity and coherence', marks: Math.ceil(marks * 0.2) },
    ];
  } else if (bloom === 'Apply') {
    answer = `Expected answer: Apply the principles of ${topic} to the given scenario. Show all steps of the solution and justify the approach used.`;
    scheme = [
      { label: 'Correct approach identified', marks: Math.ceil(marks * 0.2) },
      { label: 'Step-by-step solution', marks: Math.ceil(marks * 0.4) },
      { label: 'Correct final answer', marks: Math.ceil(marks * 0.2) },
      { label: 'Justification of approach', marks: Math.ceil(marks * 0.2) },
    ];
  } else if (bloom === 'Analyze') {
    answer = `Expected answer: Analyze ${topic} by breaking it down into components. Compare alternatives and discuss trade-offs with supporting evidence.`;
    scheme = [
      { label: 'Component breakdown', marks: Math.ceil(marks * 0.25) },
      { label: 'Comparison of alternatives', marks: Math.ceil(marks * 0.3) },
      { label: 'Trade-off discussion', marks: Math.ceil(marks * 0.25) },
      { label: 'Evidence and reasoning', marks: Math.ceil(marks * 0.2) },
    ];
  } else if (bloom === 'Evaluate') {
    answer = `Expected answer: Evaluate ${topic} critically. Provide a justified assessment with evidence, and recommend improvements where applicable.`;
    scheme = [
      { label: 'Assessment criteria defined', marks: Math.ceil(marks * 0.2) },
      { label: 'Evidence-based evaluation', marks: Math.ceil(marks * 0.3) },
      { label: 'Justified conclusion', marks: Math.ceil(marks * 0.3) },
      { label: 'Improvement recommendations', marks: Math.ceil(marks * 0.2) },
    ];
  } else {
    answer = `Expected answer: Design/propose a solution using ${topic}. Include architecture, justification, and a detailed plan.`;
    scheme = [
      { label: 'Design/architecture', marks: Math.ceil(marks * 0.3) },
      { label: 'Justification of choices', marks: Math.ceil(marks * 0.25) },
      { label: 'Implementation plan', marks: Math.ceil(marks * 0.25) },
      { label: 'Originality and feasibility', marks: Math.ceil(marks * 0.2) },
    ];
  }

  // Adjust scheme to sum to marks
  const sum = scheme.reduce((s, step) => s + step.marks, 0);
  if (sum !== marks && scheme.length > 0) {
    scheme[0].marks += marks - sum;
  }

  return { answer, markingScheme: scheme };
}

// ─── FULL STRESS TEST ANALYSIS ──────────────────────────────────────────────

export function runStressTest(
  questions: Question[],
  syllabus: Syllabus | null,
  blueprint: Blueprint | null
): AssessmentAnalysis {
  // Bloom distribution
  const bloomActual = calculateBloomDistribution(questions);
  const bloomTarget = blueprint?.bloom_distribution || {
    Remember: 10, Understand: 20, Apply: 30, Analyze: 25, Evaluate: 10, Create: 5,
  };

  // Difficulty distribution
  const difficultyActual = calculateDifficultyDistribution(questions);
  const difficultyTarget = blueprint?.difficulty_distribution || {
    Easy: 20, Medium: 50, Hard: 30,
  };

  // Bloom balance
  const { score: bloomScore, issues: bloomIssues } = calculateBloomBalance(bloomActual, bloomTarget);

  // Syllabus coverage
  let syllabusCoverage = 90;
  let blindSpots: BlindSpot[] = [];
  if (syllabus && syllabus.units.length > 0) {
    const result = calculateSyllabusCoverage(questions, syllabus);
    syllabusCoverage = result.coverage;
    blindSpots = result.blindSpots;
  }

  // CO/PO coverage
  const coCoverageDetail = calculateCOCoverage(questions);
  const poCoverageDetail = calculatePOCoverage(questions);
  const coCoverage = Object.keys(coCoverageDetail).length > 0
    ? Math.round(Object.values(coCoverageDetail).reduce((a, b) => a + b, 0) / Object.keys(coCoverageDetail).length)
    : 0;
  const poCoverage = Object.keys(poCoverageDetail).length > 0
    ? Math.round(Object.values(poCoverageDetail).reduce((a, b) => a + b, 0) / Object.keys(poCoverageDetail).length)
    : 0;

  // CO-PO matrix
  const coPoMatrix = calculateCOPOMatrix(questions);

  // Difficulty balance
  let diffScore = 100;
  for (const d of DIFFICULTY_LEVELS) {
    const a = difficultyActual[d] || 0;
    const t = difficultyTarget[d] || 0;
    diffScore -= Math.abs(a - t);
  }
  diffScore = Math.max(0, diffScore);

  // Ambiguity
  const allAmbiguityIssues: string[] = [];
  let clarityScore = 100;
  for (const q of questions) {
    const amb = detectAmbiguity(q.question_text);
    if (amb.length > 0) {
      clarityScore -= 10;
      allAmbiguityIssues.push(`Q${questions.indexOf(q) + 1}: ${amb[0].problem}`);
    }
  }
  clarityScore = Math.max(0, clarityScore);

  // Security
  const securityIssues: string[] = [];
  let securityScore = 100;
  for (const q of questions) {
    const sec = analyzeSecurity(q.question_text, q.bloom_level);
    if (sec.security_risk === 'High') {
      securityScore -= 15;
      securityIssues.push(`Q${questions.indexOf(q) + 1} has high AI vulnerability — generic and easily answered by AI tools.`);
    } else if (sec.security_risk === 'Medium') {
      securityScore -= 5;
    }
  }
  securityScore = Math.max(0, securityScore);

  // Overall health
  const overall = Math.round(
    (syllabusCoverage * 0.2 + bloomScore * 0.2 + coCoverage * 0.15 + poCoverage * 0.1 +
     diffScore * 0.15 + clarityScore * 0.1 + securityScore * 0.1)
  );

  // Build issues list
  const issues: AnalysisIssue[] = [];
  for (const bs of blindSpots) {
    issues.push({
      severity: bs.coverage === 0 ? 'critical' : 'warn',
      title: `${bs.unit} is ${bs.coverage === 0 ? 'completely missing' : 'underrepresented'}`,
      detail: `Coverage: ${bs.coverage}% (expected ${bs.expected}%). ${bs.recommendation}`,
    });
  }
  for (const bi of bloomIssues) {
    issues.push({ severity: 'warn', title: 'Bloom distribution imbalance', detail: bi });
  }
  for (const ai of allAmbiguityIssues) {
    issues.push({ severity: 'warn', title: 'Ambiguity detected', detail: ai });
  }
  for (const si of securityIssues) {
    issues.push({ severity: 'warn', title: 'AI security concern', detail: si });
  }

  return {
    id: '',
    assessment_id: '',
    syllabus_coverage: syllabusCoverage,
    bloom_balance: bloomScore,
    co_coverage: coCoverage,
    po_coverage: poCoverage,
    difficulty_balance: diffScore,
    question_clarity: clarityScore,
    security_risk_score: securityScore,
    overall_health: overall,
    blind_spots: blindSpots,
    bloom_issues: bloomIssues,
    ambiguity_issues: allAmbiguityIssues,
    security_issues: securityIssues,
    co_po_matrix: coPoMatrix,
    bloom_actual: bloomActual,
    bloom_target: bloomTarget,
    difficulty_actual: difficultyActual,
    difficulty_target: difficultyTarget,
    co_coverage_detail: coCoverageDetail,
    po_coverage_detail: poCoverageDetail,
    issues,
    created_at: '',
  };
}

// ─── WHAT-IF SIMULATOR ──────────────────────────────────────────────────────

export function simulateWhatIf(
  questions: Question[],
  changes: { bloomChanges?: Record<string, number> }
): {
  beforeBloom: Record<string, number>;
  afterBloom: Record<string, number>;
  beforeDifficulty: Record<string, number>;
  afterDifficulty: Record<string, number>;
  beforeCO: Record<string, number>;
  afterCO: Record<string, number>;
} {
  const beforeBloom = calculateBloomDistribution(questions);
  const beforeDifficulty = calculateDifficultyDistribution(questions);
  const beforeCO = calculateCOCoverage(questions);

  const afterBloom = { ...beforeBloom };
  if (changes.bloomChanges) {
    for (const [level, delta] of Object.entries(changes.bloomChanges)) {
      afterBloom[level] = Math.max(0, (afterBloom[level] || 0) + delta);
    }
    // Normalize
    const total = Object.values(afterBloom).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const k of Object.keys(afterBloom)) {
        afterBloom[k] = Math.round((afterBloom[k] / total) * 100);
      }
    }
  }

  // Simulate difficulty shift based on bloom changes
  const afterDifficulty = { ...beforeDifficulty };
  if (changes.bloomChanges) {
    const higherOrder = (changes.bloomChanges['Analyze'] || 0) + (changes.bloomChanges['Evaluate'] || 0) + (changes.bloomChanges['Create'] || 0);
    if (higherOrder > 0) {
      afterDifficulty['Hard'] = Math.min(100, (afterDifficulty['Hard'] || 0) + Math.round(higherOrder / 3));
      afterDifficulty['Easy'] = Math.max(0, (afterDifficulty['Easy'] || 0) - Math.round(higherOrder / 3));
    }
  }

  return {
    beforeBloom,
    afterBloom,
    beforeDifficulty,
    afterDifficulty,
    beforeCO,
    afterCO: beforeCO, // CO coverage wouldn't change from bloom shifts alone
  };
}

// ─── SYLLABUS PARSING (SIMULATED) ────────────────────────────────────────────

export function parseSyllabusContent(content: string): { units: { name: string; topics: string[]; weightage?: number }[] } {
  // Simple parsing: look for "Unit" headers and bullet points
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const units: { name: string; topics: string[]; weightage?: number }[] = [];
  let currentUnit: { name: string; topics: string[]; weightage?: number } | null = null;

  for (const line of lines) {
    const unitMatch = line.match(/^unit\s*[\dIVx]+[:\-\s]*(.+)/i) || line.match(/^module\s*[\d]+[:\-\s]*(.+)/i);
    if (unitMatch) {
      if (currentUnit) units.push(currentUnit);
      currentUnit = { name: line, topics: [] };
    } else if (currentUnit) {
      // Remove bullet markers
      const topic = line.replace(/^[\-\*\d\.\)]+\s*/, '').trim();
      if (topic) currentUnit.topics.push(topic);
    }
  }
  if (currentUnit) units.push(currentUnit);

  return { units: units.length > 0 ? units : [{ name: 'General', topics: ['Subject fundamentals'] }] };
}
