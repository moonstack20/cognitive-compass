/*
# Cognitive Compass - Core Database Schema

## Overview
Creates the complete database schema for Cognitive Compass, an AI-powered assessment creation and quality intelligence platform for teachers.

## New Tables
1. `profiles` - Teacher profile information (extends auth.users)
2. `courses` - Subject/course information
3. `course_outcomes` - Course Outcomes (COs) per course
4. `program_outcomes` - Program Outcomes (POs) per course
5. `syllabi` - Uploaded syllabus documents with extracted topics
6. `assessments` - Assessment papers (created or uploaded existing)
7. `assessment_blueprints` - Blueprint configuration for assessment generation
8. `questions` - Questions within assessments
9. `question_bank_items` - Reusable question bank entries
10. `assessment_analyses` - Stress test / health analysis results

## Security
- All tables have RLS enabled
- All tables are owner-scoped via `user_id` with `DEFAULT auth.uid()`
- CRUD policies for authenticated users on their own data only

## Notes
- Uses `auth.uid()` for ownership checks
- Owner columns default to `auth.uid()` so inserts work without explicitly passing user_id
- All tables have created_at timestamps
*/

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  institution text DEFAULT '',
  department text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text DEFAULT '',
  semester text DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_courses" ON courses;
CREATE POLICY "select_own_courses" ON courses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_courses" ON courses;
CREATE POLICY "insert_own_courses" ON courses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_courses" ON courses;
CREATE POLICY "update_own_courses" ON courses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_courses" ON courses;
CREATE POLICY "delete_own_courses" ON courses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 3. COURSE OUTCOMES TABLE
CREATE TABLE IF NOT EXISTS course_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE course_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cos" ON course_outcomes;
CREATE POLICY "select_own_cos" ON course_outcomes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_outcomes.course_id AND courses.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_cos" ON course_outcomes;
CREATE POLICY "insert_own_cos" ON course_outcomes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_outcomes.course_id AND courses.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_cos" ON course_outcomes;
CREATE POLICY "update_own_cos" ON course_outcomes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_outcomes.course_id AND courses.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_outcomes.course_id AND courses.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_cos" ON course_outcomes;
CREATE POLICY "delete_own_cos" ON course_outcomes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = course_outcomes.course_id AND courses.user_id = auth.uid())
  );

-- 4. PROGRAM OUTCOMES TABLE
CREATE TABLE IF NOT EXISTS program_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE program_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_pos" ON program_outcomes;
CREATE POLICY "select_own_pos" ON program_outcomes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = program_outcomes.course_id AND courses.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_pos" ON program_outcomes;
CREATE POLICY "insert_own_pos" ON program_outcomes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = program_outcomes.course_id AND courses.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_pos" ON program_outcomes;
CREATE POLICY "update_own_pos" ON program_outcomes FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = program_outcomes.course_id AND courses.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = program_outcomes.course_id AND courses.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_pos" ON program_outcomes;
CREATE POLICY "delete_own_pos" ON program_outcomes FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = program_outcomes.course_id AND courses.user_id = auth.uid())
  );

-- 5. SYLLABI TABLE
CREATE TABLE IF NOT EXISTS syllabi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text DEFAULT '',
  units jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_syllabi" ON syllabi;
CREATE POLICY "select_own_syllabi" ON syllabi FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_syllabi" ON syllabi;
CREATE POLICY "insert_own_syllabi" ON syllabi FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_syllabi" ON syllabi;
CREATE POLICY "update_own_syllabi" ON syllabi FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_syllabi" ON syllabi;
CREATE POLICY "delete_own_syllabi" ON syllabi FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 6. ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  syllabus_id uuid REFERENCES syllabi(id) ON DELETE SET NULL,
  title text NOT NULL,
  subject text DEFAULT '',
  total_marks integer DEFAULT 100,
  duration text DEFAULT '3 hours',
  status text DEFAULT 'draft',
  type text DEFAULT 'created',
  health_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_assessments" ON assessments;
CREATE POLICY "select_own_assessments" ON assessments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_assessments" ON assessments;
CREATE POLICY "insert_own_assessments" ON assessments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_assessments" ON assessments;
CREATE POLICY "update_own_assessments" ON assessments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_assessments" ON assessments;
CREATE POLICY "delete_own_assessments" ON assessments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 7. ASSESSMENT BLUEPRINTS TABLE
CREATE TABLE IF NOT EXISTS assessment_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  bloom_distribution jsonb DEFAULT '{}'::jsonb,
  difficulty_distribution jsonb DEFAULT '{}'::jsonb,
  unit_weightage jsonb DEFAULT '[]'::jsonb,
  question_types jsonb DEFAULT '[]'::jsonb,
  section_structure jsonb DEFAULT '[]'::jsonb,
  co_requirements jsonb DEFAULT '[]'::jsonb,
  po_requirements jsonb DEFAULT '[]'::jsonb,
  num_questions integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessment_blueprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_blueprints" ON assessment_blueprints;
CREATE POLICY "select_own_blueprints" ON assessment_blueprints FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_blueprints.assessment_id AND assessments.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_blueprints" ON assessment_blueprints;
CREATE POLICY "insert_own_blueprints" ON assessment_blueprints FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_blueprints.assessment_id AND assessments.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_blueprints" ON assessment_blueprints;
CREATE POLICY "update_own_blueprints" ON assessment_blueprints FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_blueprints.assessment_id AND assessments.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_blueprints.assessment_id AND assessments.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_blueprints" ON assessment_blueprints;
CREATE POLICY "delete_own_blueprints" ON assessment_blueprints FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_blueprints.assessment_id AND assessments.user_id = auth.uid())
  );

-- 8. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  marks integer DEFAULT 5,
  unit text DEFAULT '',
  topic text DEFAULT '',
  bloom_level text DEFAULT 'Understand',
  difficulty text DEFAULT 'Medium',
  co_code text DEFAULT '',
  po_codes text[] DEFAULT '{}',
  question_type text DEFAULT 'Long Answer',
  source_reference text DEFAULT '',
  security_risk text DEFAULT 'Low',
  ai_vulnerability text DEFAULT 'Low',
  public_risk text DEFAULT 'Low',
  reasoning_requirement text DEFAULT 'Medium',
  ambiguity_issues jsonb DEFAULT '[]'::jsonb,
  answer_key text DEFAULT '',
  marking_scheme jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'approved',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_questions" ON questions;
CREATE POLICY "select_own_questions" ON questions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_questions" ON questions;
CREATE POLICY "insert_own_questions" ON questions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_questions" ON questions;
CREATE POLICY "update_own_questions" ON questions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_questions" ON questions;
CREATE POLICY "delete_own_questions" ON questions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 9. QUESTION BANK ITEMS TABLE
CREATE TABLE IF NOT EXISTS question_bank_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  subject text DEFAULT '',
  unit text DEFAULT '',
  topic text DEFAULT '',
  bloom_level text DEFAULT 'Understand',
  difficulty text DEFAULT 'Medium',
  co_code text DEFAULT '',
  po_codes text[] DEFAULT '{}',
  question_type text DEFAULT 'Long Answer',
  source text DEFAULT '',
  security_risk text DEFAULT 'Low',
  status text DEFAULT 'available',
  marks integer DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE question_bank_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_qbank" ON question_bank_items;
CREATE POLICY "select_own_qbank" ON question_bank_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_qbank" ON question_bank_items;
CREATE POLICY "insert_own_qbank" ON question_bank_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_qbank" ON question_bank_items;
CREATE POLICY "update_own_qbank" ON question_bank_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_qbank" ON question_bank_items;
CREATE POLICY "delete_own_qbank" ON question_bank_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 10. ASSESSMENT ANALYSES TABLE
CREATE TABLE IF NOT EXISTS assessment_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  syllabus_coverage numeric DEFAULT 0,
  bloom_balance numeric DEFAULT 0,
  co_coverage numeric DEFAULT 0,
  po_coverage numeric DEFAULT 0,
  difficulty_balance numeric DEFAULT 0,
  question_clarity numeric DEFAULT 0,
  security_risk_score numeric DEFAULT 0,
  overall_health numeric DEFAULT 0,
  blind_spots jsonb DEFAULT '[]'::jsonb,
  bloom_issues jsonb DEFAULT '[]'::jsonb,
  ambiguity_issues jsonb DEFAULT '[]'::jsonb,
  security_issues jsonb DEFAULT '[]'::jsonb,
  co_po_matrix jsonb DEFAULT '{}'::jsonb,
  bloom_actual jsonb DEFAULT '{}'::jsonb,
  bloom_target jsonb DEFAULT '{}'::jsonb,
  difficulty_actual jsonb DEFAULT '{}'::jsonb,
  difficulty_target jsonb DEFAULT '{}'::jsonb,
  co_coverage_detail jsonb DEFAULT '{}'::jsonb,
  po_coverage_detail jsonb DEFAULT '{}'::jsonb,
  issues jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessment_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_analyses" ON assessment_analyses;
CREATE POLICY "select_own_analyses" ON assessment_analyses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_analyses.assessment_id AND assessments.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_analyses" ON assessment_analyses;
CREATE POLICY "insert_own_analyses" ON assessment_analyses FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_analyses.assessment_id AND assessments.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_analyses" ON assessment_analyses;
CREATE POLICY "update_own_analyses" ON assessment_analyses FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_analyses.assessment_id AND assessments.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_analyses.assessment_id AND assessments.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_analyses" ON assessment_analyses;
CREATE POLICY "delete_own_analyses" ON assessment_analyses FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_analyses.assessment_id AND assessments.user_id = auth.uid())
  );

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_syllabi_user_id ON syllabi(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_assessment_id ON questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_qbank_user_id ON question_bank_items(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_assessment_id ON assessment_analyses(assessment_id);

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();