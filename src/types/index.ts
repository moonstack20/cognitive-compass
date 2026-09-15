export interface Profile {
  id: string;
  full_name: string;
  institution: string;
  department: string;
  created_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  name: string;
  code: string;
  semester: string;
  description: string;
  created_at: string;
}

export interface CourseOutcome {
  id: string;
  course_id: string;
  code: string;
  description: string;
  created_at: string;
}

export interface ProgramOutcome {
  id: string;
  course_id: string;
  code: string;
  description: string;
  created_at: string;
}

export interface SyllabusUnit {
  name: string;
  topics: string[];
  weightage?: number;
}

export interface Syllabus {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  content: string;
  units: SyllabusUnit[];
  created_at: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  course_id: string | null;
  syllabus_id: string | null;
  title: string;
  subject: string;
  total_marks: number;
  duration: string;
  status: string;
  type: string;
  health_score: number;
  created_at: string;
}

export interface Blueprint {
  id: string;
  assessment_id: string;
  bloom_distribution: Record<string, number>;
  difficulty_distribution: Record<string, number>;
  unit_weightage: { unit: string; weight: number }[];
  question_types: string[];
  section_structure: { name: string; questions: number; marks: number }[];
  co_requirements: string[];
  po_requirements: string[];
  num_questions: number;
  created_at: string;
}

export interface MarkingStep {
  label: string;
  marks: number;
}

export interface AmbiguityIssue {
  problem: string;
  suggestion: string;
}

export interface Question {
  id: string;
  assessment_id: string | null;
  user_id: string;
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
  security_risk: string;
  ai_vulnerability: string;
  public_risk: string;
  reasoning_requirement: string;
  ambiguity_issues: AmbiguityIssue[];
  answer_key: string;
  marking_scheme: MarkingStep[];
  status: string;
  created_at: string;
}

export interface QuestionBankItem {
  id: string;
  user_id: string;
  question_text: string;
  subject: string;
  unit: string;
  topic: string;
  bloom_level: string;
  difficulty: string;
  co_code: string;
  po_codes: string[];
  question_type: string;
  source: string;
  security_risk: string;
  status: string;
  marks: number;
  created_at: string;
}

export interface AssessmentAnalysis {
  id: string;
  assessment_id: string;
  syllabus_coverage: number;
  bloom_balance: number;
  co_coverage: number;
  po_coverage: number;
  difficulty_balance: number;
  question_clarity: number;
  security_risk_score: number;
  overall_health: number;
  blind_spots: BlindSpot[];
  bloom_issues: string[];
  ambiguity_issues: string[];
  security_issues: string[];
  co_po_matrix: Record<string, Record<string, string>>;
  bloom_actual: Record<string, number>;
  bloom_target: Record<string, number>;
  difficulty_actual: Record<string, number>;
  difficulty_target: Record<string, number>;
  co_coverage_detail: Record<string, number>;
  po_coverage_detail: Record<string, number>;
  issues: AnalysisIssue[];
  created_at: string;
}

export interface BlindSpot {
  unit: string;
  coverage: number;
  expected: number;
  recommendation: string;
}

export interface AnalysisIssue {
  severity: 'good' | 'warn' | 'critical';
  title: string;
  detail: string;
  question_ref?: string;
}

export const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] as const;
export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;
