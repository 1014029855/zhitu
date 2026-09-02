module.exports = function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      real_name VARCHAR(100) NOT NULL,
      student_id VARCHAR(20),
      account_type VARCHAR(20) NOT NULL CHECK(account_type IN ('student','teacher','admin')),
      avatar_url VARCHAR(255),
      phone VARCHAR(20),
      bio TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      category VARCHAR(50),
      level VARCHAR(20),
      status VARCHAR(20),
      start_date DATE,
      end_date DATE,
      deadline DATE,
      organizer VARCHAR(200),
      website VARCHAR(500),
      max_team_size INTEGER,
      image_url VARCHAR(500),
      tags TEXT,
      prize_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      category VARCHAR(50),
      difficulty VARCHAR(20),
      estimated_hours INTEGER,
      image_url VARCHAR(500),
      tags TEXT,
      learning_objectives TEXT,
      resources TEXT,
      chapters TEXT,
      course_status VARCHAR(20) DEFAULT 'published',
      instructor_name VARCHAR(100) DEFAULT '知途教研组',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(500) NOT NULL,
      authors VARCHAR(500),
      abstract TEXT,
      keywords TEXT,
      category VARCHAR(50),
      year INTEGER,
      source VARCHAR(200),
      publication_date DATE,
      citations INTEGER DEFAULT 0,
      pdf_url VARCHAR(500),
      pages INTEGER,
      image_url VARCHAR(500),
      paper_source VARCHAR(20) DEFAULT 'local',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      type VARCHAR(20) NOT NULL CHECK(type IN ('competition','skill','paper')),
      author_id INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      review_comment TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS carousel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      link_url VARCHAR(500),
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type VARCHAR(20) NOT NULL CHECK(content_type IN ('competition','skill','paper')),
      content_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      difficulty VARCHAR(20) CHECK(difficulty IN ('easy','medium','hard')),
      category VARCHAR(50),
      language VARCHAR(20) DEFAULT 'all' CHECK(language IN ('c++','java','python','all')),
      template_code TEXT,
      test_cases TEXT NOT NULL,
      solution_code TEXT,
      hint TEXT,
      created_by_user_id INTEGER,
      status VARCHAR(20) DEFAULT 'approved' CHECK(status IN ('pending','approved','rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS code_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      language VARCHAR(20) NOT NULL CHECK(language IN ('c++','java','python')),
      status VARCHAR(20) CHECK(status IN ('passed','failed','error','timeout')),
      execution_result TEXT,
      ai_feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      source_type VARCHAR(20) DEFAULT 'custom' CHECK(source_type IN ('competition','skill','paper','custom')),
      source_id INTEGER,
      status VARCHAR(20) DEFAULT 'active' CHECK(status IN ('active','paused','completed','archived')),
      target_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS goal_milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      due_date DATE,
      sort_order INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES user_goals(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS goal_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      milestone_id INTEGER,
      title VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      content_type VARCHAR(20) DEFAULT 'custom' CHECK(content_type IN ('competition','skill','exercise','paper','custom')),
      content_id INTEGER,
      content_key VARCHAR(80) DEFAULT '',
      due_date DATE,
      priority INTEGER DEFAULT 2 CHECK(priority BETWEEN 1 AND 3),
      sort_order INTEGER DEFAULT 0,
      source VARCHAR(20) DEFAULT 'user' CHECK(source IN ('user','system','ai')),
      status VARCHAR(20) DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES user_goals(id) ON DELETE CASCADE,
      FOREIGN KEY (milestone_id) REFERENCES goal_milestones(id) ON DELETE SET NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content_type VARCHAR(20) NOT NULL CHECK(content_type IN ('competition','skill','exercise','paper')),
      content_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, content_type, content_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS competition_participations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      competition_id INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'interested' CHECK(status IN ('interested','preparing','registered','submitted','completed','withdrawn')),
      team_name VARCHAR(120) DEFAULT '',
      notes TEXT DEFAULT '',
      registered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, competition_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS paper_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      paper_id INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'to_read' CHECK(status IN ('to_read','reading','read')),
      notes TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, paper_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS exercise_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'review' CHECK(status IN ('review','mastered')),
      attempts INTEGER DEFAULT 0,
      last_result VARCHAR(20) DEFAULT 'failed',
      next_review_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, exercise_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      goal_id INTEGER,
      type VARCHAR(30) DEFAULT 'project' CHECK(type IN ('project','competition','paper','code','certificate','reflection')),
      title VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      evidence_url VARCHAR(1000) DEFAULT '',
      is_public INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (goal_id) REFERENCES user_goals(id) ON DELETE SET NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS content_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type VARCHAR(20) NOT NULL CHECK(source_type IN ('competition','skill','exercise','paper')),
      source_id INTEGER NOT NULL,
      target_type VARCHAR(20) NOT NULL CHECK(target_type IN ('competition','skill','exercise','paper')),
      target_id INTEGER NOT NULL,
      relation_type VARCHAR(30) DEFAULT 'related' CHECK(relation_type IN ('related','requires','prepares','supports','references')),
      weight REAL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(source_type, source_id, target_type, target_id, relation_type)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash VARCHAR(128) UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS course_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id INTEGER NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(skill_id, sort_order),
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS course_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER NOT NULL,
      legacy_chapter_order INTEGER,
      title VARCHAR(200) NOT NULL,
      summary TEXT DEFAULT '',
      lesson_type VARCHAR(30) NOT NULL DEFAULT 'reading'
        CHECK(lesson_type IN ('interactive','reading','quiz','reflection')),
      estimated_minutes INTEGER NOT NULL DEFAULT 12,
      sort_order INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'published'
        CHECK(status IN ('draft','published','archived')),
      prerequisite_lesson_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(module_id, sort_order),
      FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE,
      FOREIGN KEY (prerequisite_lesson_id) REFERENCES course_lessons(id) ON DELETE SET NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id INTEGER NOT NULL,
      title VARCHAR(120) NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(skill_id, title),
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_knowledge_points (
      lesson_id INTEGER NOT NULL,
      knowledge_point_id INTEGER NOT NULL,
      weight REAL NOT NULL DEFAULT 1,
      PRIMARY KEY (lesson_id, knowledge_point_id),
      FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      type VARCHAR(30) NOT NULL DEFAULT 'text'
        CHECK(type IN ('scenario','text','explanation','key_points','reflection','divider')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      content_json TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(lesson_id, sort_order),
      FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      knowledge_point_id INTEGER,
      type VARCHAR(30) NOT NULL
        CHECK(type IN ('single_choice','multiple_choice','sequence','classify')),
      prompt TEXT NOT NULL,
      config_json TEXT NOT NULL DEFAULT '{}',
      explanation TEXT DEFAULT '',
      points INTEGER NOT NULL DEFAULT 10,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_required INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
      FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE SET NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS course_enrollments (
      user_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK(status IN ('active','completed','paused')),
      active_lesson_id INTEGER,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      PRIMARY KEY (user_id, skill_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      FOREIGN KEY (active_lesson_id) REFERENCES course_lessons(id) ON DELETE SET NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'not_started'
        CHECK(status IN ('not_started','in_progress','completed')),
      progress INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
      best_score INTEGER NOT NULL DEFAULT 0,
      started_at DATETIME,
      completed_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, lesson_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS lesson_notes (
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      explanation TEXT NOT NULL DEFAULT '',
      example TEXT NOT NULL DEFAULT '',
      question TEXT NOT NULL DEFAULT '',
      confidence INTEGER NOT NULL DEFAULT 1 CHECK(confidence BETWEEN 1 AND 4),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, lesson_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_id INTEGER NOT NULL,
      attempt_number INTEGER NOT NULL DEFAULT 1,
      answer_json TEXT NOT NULL DEFAULT '{}',
      is_correct INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      feedback_json TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (activity_id) REFERENCES learning_activities(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS learner_mastery (
      user_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      knowledge_point_id INTEGER NOT NULL,
      level VARCHAR(20) NOT NULL DEFAULT 'initial'
        CHECK(level IN ('initial','familiar','proficient','mastered')),
      score INTEGER NOT NULL DEFAULT 0 CHECK(score BETWEEN 0 AND 100),
      evidence_count INTEGER NOT NULL DEFAULT 0,
      correct_streak INTEGER NOT NULL DEFAULT 0,
      last_practiced_at DATETIME,
      next_review_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, knowledge_point_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS course_content_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id INTEGER NOT NULL,
      lesson_id INTEGER,
      version_number INTEGER NOT NULL,
      event_type VARCHAR(20) NOT NULL DEFAULT 'save'
        CHECK(event_type IN ('save','publish')),
      snapshot_json TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_goals_user_status ON user_goals(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_goal_tasks_goal_status ON goal_tasks(goal_id, status);
    CREATE INDEX IF NOT EXISTS idx_goal_tasks_content ON goal_tasks(content_type, content_id, content_key);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user_type ON bookmarks(user_id, content_type);
    CREATE INDEX IF NOT EXISTS idx_participations_user ON competition_participations(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_paper_library_user ON paper_library(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_course_modules_skill ON course_modules(skill_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_lesson_blocks_lesson ON lesson_blocks(lesson_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_learning_activities_lesson ON learning_activities(lesson_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_attempts_user_activity ON activity_attempts(user_id, activity_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_mastery_user_review ON learner_mastery(user_id, next_review_at);
    CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_lesson_notes_user ON lesson_notes(user_id, updated_at);
    CREATE INDEX IF NOT EXISTS idx_course_versions_skill ON course_content_versions(skill_id, version_number);
  `)

  // Migration: add paper_source column to existing papers table
  try { db.exec(`ALTER TABLE papers ADD COLUMN paper_source VARCHAR(20) DEFAULT 'local'`) } catch {}
  // Migration: add url column for external paper links
  try { db.exec(`ALTER TABLE papers ADD COLUMN url VARCHAR(1000)`) } catch {}
  // Migration: add data column to submissions table
  try { db.exec(`ALTER TABLE submissions ADD COLUMN data TEXT`) } catch {}
  // Migration: add context columns to ai_conversations
  try { db.exec(`CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) DEFAULT '未命名对话',
    context_type VARCHAR(20) DEFAULT '',
    context_id INTEGER DEFAULT 0,
    messages TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`) } catch {}
  // Migration: add chapters column to skills
  try { db.exec(`ALTER TABLE skills ADD COLUMN chapters TEXT DEFAULT '[]'`) } catch {}
  // Migration: skill progress table
  try { db.exec(`CREATE TABLE IF NOT EXISTS skill_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, skill_id INTEGER NOT NULL, chapter_order INTEGER NOT NULL,
    completed INTEGER DEFAULT 0, notes TEXT DEFAULT '', updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id, chapter_order)
  )`) } catch {}

  try { db.exec(`ALTER TABLE skills ADD COLUMN course_status VARCHAR(20) DEFAULT 'published'`) } catch {}
  try { db.exec(`ALTER TABLE skills ADD COLUMN instructor_name VARCHAR(100) DEFAULT '知途教研组'`) } catch {}
  try { db.exec(`ALTER TABLE skills ADD COLUMN updated_at DATETIME`) } catch {}
  try { db.exec(`UPDATE skills SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)`) } catch {}

}
