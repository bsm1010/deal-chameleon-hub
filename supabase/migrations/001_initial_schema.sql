-- =====================================================
-- MOUALIM DATABASE SCHEMA
-- Algerian Online Tutoring Marketplace
-- =====================================================

-- USERS EXTENSION (extends Supabase auth.users)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role text CHECK (role IN ('student', 'teacher', 'admin')) NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  phone text,
  wilaya text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE student_profiles (
  id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  birth_year int,
  education_level text CHECK (education_level IN (
    'primaire', 'moyen', 'lycee_1', 'lycee_2', 'lycee_3_bac',
    'universite_licence', 'universite_master', 'autre'
  )),
  subjects_of_interest text[]
);

CREATE TABLE teacher_profiles (
  id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  subjects text[] NOT NULL,
  education_levels text[] NOT NULL,
  years_experience int DEFAULT 0,
  diploma text,
  verification_status text CHECK (
    verification_status IN ('pending', 'approved', 'rejected')
  ) DEFAULT 'pending',
  verified_at timestamptz,
  ccp_number text,
  iban text,
  rating numeric(3,2) DEFAULT 0,
  total_reviews int DEFAULT 0,
  total_students int DEFAULT 0,
  is_featured boolean DEFAULT false
);

-- COURSES
CREATE TABLE courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  education_level text NOT NULL,
  price int NOT NULL DEFAULT 0,
  thumbnail_url text,
  trailer_url text,
  is_published boolean DEFAULT false,
  is_free boolean DEFAULT false,
  total_duration_minutes int DEFAULT 0,
  total_lessons int DEFAULT 0,
  language text DEFAULT 'ar' CHECK (language IN ('ar', 'fr', 'ar_fr')),
  rating numeric(3,2) DEFAULT 0,
  total_reviews int DEFAULT 0,
  total_students int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE course_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  position int NOT NULL DEFAULT 0
);

CREATE TABLE course_lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid REFERENCES course_sections(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  video_url text,
  duration_minutes int DEFAULT 0,
  position int NOT NULL DEFAULT 0,
  is_free_preview boolean DEFAULT false
);

-- LIVE SESSIONS
CREATE TABLE session_slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  subject text NOT NULL,
  education_level text NOT NULL,
  price int NOT NULL,
  max_students int DEFAULT 1,
  current_students int DEFAULT 0,
  is_available boolean DEFAULT true,
  meeting_link text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- PURCHASES & ENROLLMENTS
CREATE TABLE purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  session_slot_id uuid REFERENCES session_slots(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES profiles(id) NOT NULL,
  amount int NOT NULL,
  platform_fee int NOT NULL,
  teacher_earnings int NOT NULL,
  payment_method text DEFAULT 'chargily',
  chargily_checkout_id text,
  status text CHECK (status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

CREATE TABLE enrollments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  purchase_id uuid REFERENCES purchases(id),
  progress_percent int DEFAULT 0,
  last_watched_lesson_id uuid REFERENCES course_lessons(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

CREATE TABLE lesson_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  watched_seconds int DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE(student_id, lesson_id)
);

-- REVIEWS
CREATE TABLE reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  session_slot_id uuid REFERENCES session_slots(id) ON DELETE CASCADE,
  rating int CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment text,
  reply_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id),
  UNIQUE(student_id, session_slot_id)
);

-- EARNINGS & PAYOUTS
CREATE TABLE teacher_earnings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  purchase_id uuid REFERENCES purchases(id) NOT NULL,
  amount int NOT NULL,
  status text CHECK (status IN ('pending', 'paid')) DEFAULT 'pending',
  paid_at timestamptz,
  payout_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE payout_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount int NOT NULL,
  ccp_number text NOT NULL,
  status text CHECK (status IN ('requested', 'processing', 'paid', 'rejected')) DEFAULT 'requested',
  admin_note text,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  is_read boolean DEFAULT false,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

-- CONTACT REQUESTS
CREATE TABLE contact_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_edit_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Student profiles
CREATE POLICY "student_profiles_own" ON student_profiles FOR ALL USING (auth.uid() = id);

-- Teacher profiles
CREATE POLICY "teacher_profiles_read_approved" ON teacher_profiles FOR SELECT
  USING (verification_status = 'approved' OR id = auth.uid());
CREATE POLICY "teacher_profiles_own" ON teacher_profiles FOR ALL USING (auth.uid() = id);

-- Courses
CREATE POLICY "courses_read_published" ON courses FOR SELECT
  USING (is_published = true OR teacher_id = auth.uid());
CREATE POLICY "courses_teacher_manage" ON courses FOR ALL
  USING (teacher_id = auth.uid());

-- Course sections
CREATE POLICY "sections_read_published" ON course_sections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM courses WHERE courses.id = course_sections.course_id
    AND (courses.is_published = true OR courses.teacher_id = auth.uid())
  ));
CREATE POLICY "sections_teacher_manage" ON course_sections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM courses WHERE courses.id = course_sections.course_id
    AND courses.teacher_id = auth.uid()
  ));

-- Course lessons
CREATE POLICY "lessons_preview" ON course_lessons FOR SELECT
  USING (is_free_preview = true);
CREATE POLICY "lessons_enrolled" ON course_lessons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = course_lessons.course_id
    AND enrollments.student_id = auth.uid()
  ));
CREATE POLICY "lessons_teacher_manage" ON course_lessons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM courses WHERE courses.id = course_lessons.course_id
    AND courses.teacher_id = auth.uid()
  ));

-- Session slots
CREATE POLICY "slots_read" ON session_slots FOR SELECT USING (true);
CREATE POLICY "slots_teacher_manage" ON session_slots FOR ALL
  USING (teacher_id = auth.uid());

-- Purchases
CREATE POLICY "purchases_own" ON purchases FOR SELECT
  USING (student_id = auth.uid() OR teacher_id = auth.uid());
CREATE POLICY "purchases_insert_own" ON purchases FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Enrollments
CREATE POLICY "enrollments_own" ON enrollments FOR ALL
  USING (student_id = auth.uid());
CREATE POLICY "enrollments_teacher_view" ON enrollments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM courses WHERE courses.id = enrollments.course_id
    AND courses.teacher_id = auth.uid()
  ));

-- Lesson progress
CREATE POLICY "lesson_progress_own" ON lesson_progress FOR ALL
  USING (student_id = auth.uid());

-- Reviews
CREATE POLICY "reviews_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_write" ON reviews FOR INSERT
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "reviews_teacher_reply" ON reviews FOR UPDATE
  USING (teacher_id = auth.uid());

-- Teacher earnings
CREATE POLICY "earnings_own" ON teacher_earnings FOR SELECT
  USING (teacher_id = auth.uid());

-- Payout requests
CREATE POLICY "payouts_own" ON payout_requests FOR ALL
  USING (teacher_id = auth.uid());
CREATE POLICY "payouts_admin" ON payout_requests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Notifications
CREATE POLICY "notifications_own" ON notifications FOR ALL
  USING (user_id = auth.uid());

-- Contact requests
CREATE POLICY "contact_insert" ON contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_admin" ON contact_requests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX profiles_role_idx ON profiles(role);
CREATE INDEX courses_teacher_idx ON courses(teacher_id);
CREATE INDEX courses_subject_idx ON courses(subject);
CREATE INDEX courses_level_idx ON courses(education_level);
CREATE INDEX courses_published_idx ON courses(is_published);
CREATE INDEX enrollments_student_idx ON enrollments(student_id);
CREATE INDEX enrollments_course_idx ON enrollments(course_id);
CREATE INDEX purchases_student_idx ON purchases(student_id);
CREATE INDEX purchases_teacher_idx ON purchases(teacher_id);
CREATE INDEX purchases_status_idx ON purchases(status);
CREATE INDEX session_slots_teacher_idx ON session_slots(teacher_id);
CREATE INDEX session_slots_date_idx ON session_slots(date);
CREATE INDEX session_slots_available_idx ON session_slots(is_available);
CREATE INDEX teacher_earnings_teacher_idx ON teacher_earnings(teacher_id);
CREATE INDEX teacher_earnings_status_idx ON teacher_earnings(status);
CREATE INDEX notifications_user_idx ON notifications(user_id);
CREATE INDEX notifications_read_idx ON notifications(is_read);
CREATE INDEX reviews_teacher_idx ON reviews(teacher_id);
CREATE INDEX reviews_course_idx ON reviews(course_id);
CREATE INDEX payout_requests_teacher_idx ON payout_requests(teacher_id);
CREATE INDEX payout_requests_status_idx ON payout_requests(status);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS 
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS 
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
 LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate teacher average rating on review insert
CREATE OR REPLACE FUNCTION update_teacher_rating()
RETURNS trigger AS 
BEGIN
  UPDATE teacher_profiles
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating), 2)
      FROM reviews WHERE teacher_id = NEW.teacher_id
    ), 0),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews WHERE teacher_id = NEW.teacher_id
    )
  WHERE id = NEW.teacher_id;
  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_teacher_rating();

-- Calculate course average rating on review insert
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS trigger AS 
BEGIN
  UPDATE courses
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating), 2)
      FROM reviews WHERE course_id = NEW.course_id
    ), 0),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews WHERE course_id = NEW.course_id
    )
  WHERE id = NEW.course_id;
  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_course_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_course_rating();

-- Update teacher total_students on enrollment
CREATE OR REPLACE FUNCTION update_teacher_student_count()
RETURNS trigger AS 
BEGIN
  UPDATE teacher_profiles
  SET total_students = (
    SELECT COUNT(DISTINCT e.student_id)
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE c.teacher_id = (
      SELECT teacher_id FROM courses WHERE id = NEW.course_id
    )
  )
  WHERE id = (
    SELECT teacher_id FROM courses WHERE id = NEW.course_id
  );
  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_enrollment_insert
  AFTER INSERT ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_teacher_student_count();

-- Update course total_lessons and total_duration on lesson change
CREATE OR REPLACE FUNCTION update_course_counts()
RETURNS trigger AS 
BEGIN
  UPDATE courses
  SET total_lessons = (
    SELECT COUNT(*) FROM course_lessons WHERE course_id = NEW.course_id
  ),
  total_duration_minutes = (
    SELECT COALESCE(SUM(duration_minutes), 0)
    FROM course_lessons WHERE course_id = NEW.course_id
  )
  WHERE id = NEW.course_id;
  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lesson_change
  AFTER INSERT OR UPDATE OR DELETE ON course_lessons
  FOR EACH ROW EXECUTE FUNCTION update_course_counts();

-- Update enrollment progress_percent on lesson completion
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS trigger AS 
DECLARE
  total_count int;
  completed_count int;
  course_id_val uuid;
BEGIN
  SELECT cl.course_id INTO course_id_val
  FROM course_lessons cl WHERE cl.id = NEW.lesson_id;

  SELECT COUNT(*) INTO total_count
  FROM course_lessons WHERE course_id = course_id_val;

  SELECT COUNT(*) INTO completed_count
  FROM lesson_progress lp
  JOIN course_lessons cl ON cl.id = lp.lesson_id
  WHERE cl.course_id = course_id_val
  AND lp.is_completed = true
  AND lp.student_id = NEW.student_id;

  UPDATE enrollments
  SET
    progress_percent = CASE
      WHEN total_count > 0 THEN ROUND((completed_count::numeric / total_count) * 100)
      ELSE 0
    END,
    completed_at = CASE
      WHEN completed_count = total_count AND total_count > 0 THEN now()
      ELSE completed_at
    END
  WHERE student_id = NEW.student_id AND course_id = course_id_val;

  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_lesson_progress_update
  AFTER INSERT OR UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_enrollment_progress();

-- Update session_slot current_students on purchase
CREATE OR REPLACE FUNCTION update_slot_student_count()
RETURNS trigger AS 
BEGIN
  IF NEW.status = 'paid' AND NEW.session_slot_id IS NOT NULL THEN
    UPDATE session_slots
    SET current_students = current_students + 1,
        is_available = CASE
          WHEN current_students + 1 >= max_students THEN false
          ELSE true
        END
    WHERE id = NEW.session_slot_id;
  END IF;
  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_purchase_paid
  AFTER UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_slot_student_count();

-- Update course total_students on enrollment
CREATE OR REPLACE FUNCTION update_course_student_count()
RETURNS trigger AS 
BEGIN
  UPDATE courses
  SET total_students = (
    SELECT COUNT(DISTINCT student_id) FROM enrollments WHERE course_id = NEW.course_id
  )
  WHERE id = NEW.course_id;
  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_enrollment_course_count
  AFTER INSERT OR DELETE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_course_student_count();
