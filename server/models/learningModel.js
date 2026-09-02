const { db } = require('../db/connection')

const LEVELS = [
  { key: 'initial', min: 0, label: '初识' },
  { key: 'familiar', min: 30, label: '熟悉' },
  { key: 'proficient', min: 60, label: '熟练' },
  { key: 'mastered', min: 85, label: '掌握' }
]

function parseJson(value, fallback = {}) {
  try {
    return JSON.parse(value || '')
  } catch {
    return fallback
  }
}

function toSqlDate(date) {
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

function levelForScore(score) {
  return [...LEVELS].reverse().find(level => score >= level.min)?.key || 'initial'
}

function nextReviewDate(score, correct) {
  const hours = !correct ? 12 : score >= 85 ? 24 * 7 : score >= 60 ? 24 * 3 : 24
  return toSqlDate(new Date(Date.now() + hours * 60 * 60 * 1000))
}

function getCatalogMeta(userId) {
  const rows = db.prepare(`
    SELECT
      s.id AS skill_id,
      (SELECT COUNT(*) FROM course_modules m WHERE m.skill_id = s.id AND m.is_published = 1) AS module_count,
      (SELECT COUNT(*) FROM course_lessons l
        JOIN course_modules m ON m.id = l.module_id
        WHERE m.skill_id = s.id AND m.is_published = 1 AND l.status = 'published') AS lesson_count,
      (SELECT COUNT(*) FROM course_lessons l
        JOIN course_modules m ON m.id = l.module_id
        WHERE m.skill_id = s.id AND l.status = 'published' AND l.lesson_type = 'interactive') AS interactive_count,
      e.status AS enrollment_status,
      e.active_lesson_id,
      (SELECT COUNT(*) FROM lesson_progress lp
        JOIN course_lessons l ON l.id = lp.lesson_id
        JOIN course_modules m ON m.id = l.module_id
        WHERE m.skill_id = s.id AND lp.user_id = ? AND lp.status = 'completed') AS completed_lessons,
      COALESCE((SELECT CASE WHEN SUM(lm.score) > 0 THEN MAX(1, ROUND(AVG(lm.score))) ELSE 0 END
        FROM learner_mastery lm WHERE lm.skill_id = s.id AND lm.user_id = ?), 0) AS mastery_score
    FROM skills s
    LEFT JOIN course_enrollments e ON e.skill_id = s.id AND e.user_id = ?
  `).all(userId, userId, userId)
  return Object.fromEntries(rows.map(row => [row.skill_id, row]))
}

function findCourse(skillId) {
  return db.prepare(`
    SELECT id, title, description, category, difficulty, estimated_hours,
      tags, course_status, instructor_name, updated_at
    FROM skills WHERE id = ?
  `).get(skillId)
}

function getCourseOverview(skillId, userId, options = {}) {
  const course = findCourse(skillId)
  if (!course) return null
  if (!options.includeDraft && course.course_status === 'draft') return null

  course.tags = parseJson(course.tags, [])
  const lessonStatus = options.includeDraft ? "l.status != 'archived'" : "l.status = 'published'"
  const moduleStatus = options.includeDraft ? '1 = 1' : 'm.is_published = 1'
  const modules = db.prepare(`
    SELECT m.id, m.title, m.description, m.sort_order, m.is_published,
      l.id AS lesson_id, l.title AS lesson_title, l.summary AS lesson_summary,
      l.lesson_type, l.estimated_minutes, l.sort_order AS lesson_order,
      l.status AS lesson_publish_status, l.prerequisite_lesson_id,
      COALESCE(lp.status, 'not_started') AS learner_status,
      COALESCE(lp.progress, 0) AS learner_progress,
      COALESCE(lp.best_score, 0) AS best_score,
      (SELECT COUNT(*) FROM learning_activities a
        WHERE a.lesson_id = l.id AND a.is_active = 1) AS activity_count
    FROM course_modules m
    LEFT JOIN course_lessons l ON l.module_id = m.id AND ${lessonStatus}
    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
    WHERE m.skill_id = ? AND ${moduleStatus}
    ORDER BY m.sort_order, l.sort_order
  `).all(userId, skillId)

  const grouped = []
  for (const row of modules) {
    let module = grouped.find(item => item.id === row.id)
    if (!module) {
      module = {
        id: row.id,
        title: row.title,
        description: row.description,
        sortOrder: row.sort_order,
        isPublished: Boolean(row.is_published),
        lessons: []
      }
      grouped.push(module)
    }
    if (row.lesson_id) {
      module.lessons.push({
        id: row.lesson_id,
        title: row.lesson_title,
        summary: row.lesson_summary,
        type: row.lesson_type,
        estimatedMinutes: row.estimated_minutes,
        sortOrder: row.lesson_order,
        publishStatus: row.lesson_publish_status,
        prerequisiteLessonId: row.prerequisite_lesson_id,
        status: row.learner_status,
        progress: row.learner_progress,
        bestScore: row.best_score,
        activityCount: row.activity_count
      })
    }
  }

  const mastery = db.prepare(`
    SELECT kp.id, kp.title, kp.description, kp.sort_order,
      COALESCE(lm.score, 0) AS score,
      COALESCE(lm.level, 'initial') AS level,
      COALESCE(lm.evidence_count, 0) AS evidence_count,
      lm.last_practiced_at, lm.next_review_at
    FROM knowledge_points kp
    LEFT JOIN learner_mastery lm ON lm.knowledge_point_id = kp.id AND lm.user_id = ?
    WHERE kp.skill_id = ?
    ORDER BY kp.sort_order, kp.id
  `).all(userId, skillId)

  const enrollment = db.prepare(`
    SELECT status, active_lesson_id, started_at, last_activity_at, completed_at
    FROM course_enrollments WHERE user_id = ? AND skill_id = ?
  `).get(userId, skillId) || null
  const allLessons = grouped.flatMap(module => module.lessons)
  const completedLessons = allLessons.filter(lesson => lesson.status === 'completed').length
  const firstIncomplete = allLessons.find(lesson => lesson.status !== 'completed')
  const continueLessonId = enrollment?.active_lesson_id || firstIncomplete?.id || allLessons[0]?.id || null
  const masteryTotal = mastery.reduce((sum, item) => sum + item.score, 0)
  const masteryScore = mastery.length && masteryTotal > 0
    ? Math.max(1, Math.round(masteryTotal / mastery.length))
    : 0
  const dueReviewCount = mastery.filter(item => item.next_review_at && new Date(`${item.next_review_at}Z`) <= new Date()).length
  const masteryDistribution = Object.fromEntries(LEVELS.map(level => [level.key, mastery.filter(item => item.level === level.key).length]))

  return {
    course,
    modules: grouped,
    mastery,
    enrollment,
    summary: {
      moduleCount: grouped.length,
      lessonCount: allLessons.length,
      completedLessons,
      progress: allLessons.length ? Math.round(completedLessons / allLessons.length * 100) : 0,
      masteryScore,
      masteryDistribution,
      dueReviewCount,
      continueLessonId
    }
  }
}

function enroll(userId, skillId) {
  const course = findCourse(skillId)
  if (!course) return null
  const firstLesson = db.prepare(`
    SELECT l.id FROM course_lessons l
    JOIN course_modules m ON m.id = l.module_id
    WHERE m.skill_id = ? AND m.is_published = 1 AND l.status = 'published'
    ORDER BY m.sort_order, l.sort_order LIMIT 1
  `).get(skillId)
  db.prepare(`
    INSERT INTO course_enrollments (user_id, skill_id, active_lesson_id)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, skill_id) DO UPDATE SET
      status = CASE WHEN course_enrollments.status = 'paused' THEN 'active' ELSE course_enrollments.status END,
      active_lesson_id = COALESCE(course_enrollments.active_lesson_id, excluded.active_lesson_id),
      last_activity_at = CURRENT_TIMESTAMP
  `).run(userId, skillId, firstLesson?.id || null)
  return db.prepare('SELECT * FROM course_enrollments WHERE user_id = ? AND skill_id = ?').get(userId, skillId)
}

function sanitizeActivity(row) {
  const config = parseJson(row.config_json, {})
  const safeConfig = { ...config }
  delete safeConfig.correctAnswer
  delete safeConfig.correctAnswers
  delete safeConfig.correctOrder
  delete safeConfig.correctMatches
  delete safeConfig.correctConclusion
  delete safeConfig.expectedKeywords
  if (Array.isArray(safeConfig.choices)) {
    safeConfig.choices = safeConfig.choices.map(({ id, label }) => ({ id, label }))
  }
  return {
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    config: safeConfig,
    points: row.points,
    sortOrder: row.sort_order,
    isRequired: Boolean(row.is_required),
    knowledgePoint: row.knowledge_point_title ? {
      id: row.knowledge_point_id,
      title: row.knowledge_point_title
    } : null,
    attempts: row.attempt_count || 0,
    solved: Boolean(row.solved)
  }
}

function startLesson(userId, lessonId, skillId) {
  db.prepare(`
    INSERT INTO lesson_progress (user_id, lesson_id, status, progress, started_at)
    VALUES (?, ?, 'in_progress', 0, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, lesson_id) DO UPDATE SET
      status = CASE WHEN lesson_progress.status = 'completed' THEN 'completed' ELSE 'in_progress' END,
      started_at = COALESCE(lesson_progress.started_at, CURRENT_TIMESTAMP),
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, lessonId)
  db.prepare(`
    INSERT INTO course_enrollments (user_id, skill_id, active_lesson_id)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, skill_id) DO UPDATE SET
      active_lesson_id = CASE WHEN course_enrollments.status = 'completed' THEN course_enrollments.active_lesson_id ELSE excluded.active_lesson_id END,
      last_activity_at = CURRENT_TIMESTAMP
  `).run(userId, skillId, lessonId)
}

function getLesson(userId, skillId, lessonId) {
  const lesson = db.prepare(`
    SELECT l.*, m.title AS module_title, m.sort_order AS module_order,
      m.skill_id, s.title AS course_title, s.instructor_name, s.course_status
    FROM course_lessons l
    JOIN course_modules m ON m.id = l.module_id
    JOIN skills s ON s.id = m.skill_id
    WHERE l.id = ? AND m.skill_id = ? AND l.status = 'published' AND m.is_published = 1
  `).get(lessonId, skillId)
  if (!lesson || lesson.course_status === 'draft') return null

  startLesson(userId, lessonId, skillId)
  const overview = getCourseOverview(skillId, userId)
  const blocks = db.prepare(`
    SELECT id, type, sort_order, content_json FROM lesson_blocks
    WHERE lesson_id = ? ORDER BY sort_order, id
  `).all(lessonId).map(row => ({
    id: row.id,
    type: row.type,
    sortOrder: row.sort_order,
    content: parseJson(row.content_json, {})
  }))
  const activities = db.prepare(`
    SELECT a.*, kp.title AS knowledge_point_title,
      COUNT(at.id) AS attempt_count,
      MAX(CASE WHEN at.is_correct = 1 THEN 1 ELSE 0 END) AS solved
    FROM learning_activities a
    LEFT JOIN knowledge_points kp ON kp.id = a.knowledge_point_id
    LEFT JOIN activity_attempts at ON at.activity_id = a.id AND at.user_id = ?
    WHERE a.lesson_id = ? AND a.is_active = 1
    GROUP BY a.id
    ORDER BY a.sort_order, a.id
  `).all(userId, lessonId).map(sanitizeActivity)
  const mastery = db.prepare(`
    SELECT kp.id, kp.title, COALESCE(lm.score, 0) AS score,
      COALESCE(lm.level, 'initial') AS level,
      COALESCE(lm.evidence_count, 0) AS evidence_count,
      lm.next_review_at
    FROM lesson_knowledge_points lkp
    JOIN knowledge_points kp ON kp.id = lkp.knowledge_point_id
    LEFT JOIN learner_mastery lm ON lm.knowledge_point_id = kp.id AND lm.user_id = ?
    WHERE lkp.lesson_id = ? ORDER BY kp.sort_order
  `).all(userId, lessonId)
  const progress = db.prepare('SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?').get(userId, lessonId)
  const note = db.prepare(`
    SELECT explanation, example, question, confidence, updated_at
    FROM lesson_notes WHERE user_id = ? AND lesson_id = ?
  `).get(userId, lessonId) || { explanation: '', example: '', question: '', confidence: 1, updated_at: null }

  const content = [
    ...blocks.map(item => ({ ...item, kind: 'block' })),
    ...activities.map(item => ({ ...item, kind: 'activity' }))
  ].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)

  return {
    course: { id: skillId, title: lesson.course_title, instructorName: lesson.instructor_name },
    lesson: {
      id: lesson.id,
      moduleId: lesson.module_id,
      moduleTitle: lesson.module_title,
      title: lesson.title,
      summary: lesson.summary,
      type: lesson.lesson_type,
      estimatedMinutes: lesson.estimated_minutes,
      progress
    },
    content,
    mastery,
    note,
    outline: overview?.modules || [],
    courseSummary: overview?.summary || {}
  }
}

function sameStringSet(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false
  return [...left].map(String).sort().every((value, index) => value === [...right].map(String).sort()[index])
}

function evaluateActivity(activity, answer) {
  const config = parseJson(activity.config_json, {})
  if (config.variant === 'simulation') {
    const selected = answer && typeof answer === 'object' ? String(answer.conclusion || '') : ''
    const correct = selected === String(config.correctConclusion || '')
    return {
      correct,
      message: correct
        ? '你把操控变量、观察结果和结论连成了一条完整证据链。'
        : '先比较只改变提问措辞时，估计车速是否随之系统变化。'
    }
  }
  if (config.variant === 'short_answer') {
    const text = String(answer || '').trim()
    const normalized = text.toLowerCase()
    const expected = Array.isArray(config.expectedKeywords) ? config.expectedKeywords : []
    const matches = expected.filter(keyword => normalized.includes(String(keyword).toLowerCase())).length
    const minimumMatches = Math.max(0, Number(config.minimumMatches) || 0)
    const minimumLength = Math.max(12, Number(config.minLength) || 24)
    const correct = text.length >= minimumLength && matches >= minimumMatches
    return {
      correct,
      message: correct
        ? '你的方案同时包含了可执行步骤和减少记忆污染的约束。'
        : `再具体一些：至少写 ${minimumLength} 个字，并说明如何避免调查者把答案带进问题。`
    }
  }
  if (activity.type === 'single_choice') {
    const selected = String(answer || '')
    const choice = (config.choices || []).find(item => String(item.id) === selected)
    return {
      correct: selected === String(config.correctAnswer),
      message: choice?.feedback || '回到题干，检查这个选项是否解释了全部证据。'
    }
  }
  if (activity.type === 'multiple_choice') {
    const correct = sameStringSet(answer, config.correctAnswers)
    return {
      correct,
      message: correct ? '你同时抓住了两个必要条件。' : '有些选项只制造熟悉感，并没有要求你主动从记忆中提取。'
    }
  }
  if (activity.type === 'sequence') {
    const expected = config.correctOrder || []
    const selected = Array.isArray(answer) ? answer.map(String) : []
    const correct = selected.length === expected.length && selected.every((item, index) => item === String(expected[index]))
    return {
      correct,
      message: correct ? '事件顺序与条件刺激形成的过程一致。' : '先找到不需要学习就会发生的反应，再追踪中性线索怎样获得预测意义。'
    }
  }
  if (activity.type === 'classify') {
    const expected = config.correctMatches || {}
    const selected = answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {}
    const keys = Object.keys(expected)
    const matched = keys.filter(key => String(selected[key]) === String(expected[key])).length
    return {
      correct: matched === keys.length,
      message: matched === keys.length
        ? '每条证据都放到了它最直接支持的解释中。'
        : `你已经判断对 ${matched}/${keys.length} 条。注意区分“最初没看清”和“后来被新信息改写”。`
    }
  }
  return { correct: false, message: '这个活动暂时无法判定，请刷新后再试。' }
}

function saveLessonNote(userId, lessonId, payload = {}) {
  const lesson = db.prepare('SELECT id FROM course_lessons WHERE id = ?').get(lessonId)
  if (!lesson) return null
  const explanation = String(payload.explanation || '').trim().slice(0, 4000)
  const example = String(payload.example || '').trim().slice(0, 4000)
  const question = String(payload.question || '').trim().slice(0, 4000)
  const confidence = Math.max(1, Math.min(4, Number(payload.confidence) || 1))
  db.prepare(`
    INSERT INTO lesson_notes (user_id, lesson_id, explanation, example, question, confidence, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, lesson_id) DO UPDATE SET
      explanation = excluded.explanation,
      example = excluded.example,
      question = excluded.question,
      confidence = excluded.confidence,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, lessonId, explanation, example, question, confidence)
  return db.prepare(`
    SELECT explanation, example, question, confidence, updated_at
    FROM lesson_notes WHERE user_id = ? AND lesson_id = ?
  `).get(userId, lessonId)
}

function updateMastery(userId, activity, correct, attemptNumber) {
  if (!activity.knowledge_point_id) return null
  const current = db.prepare(`
    SELECT * FROM learner_mastery WHERE user_id = ? AND knowledge_point_id = ?
  `).get(userId, activity.knowledge_point_id)
  const previousScore = current?.score || 0
  const delta = correct ? (attemptNumber === 1 ? 34 : attemptNumber === 2 ? 24 : 16) : -7
  const score = Math.max(0, Math.min(100, previousScore + delta))
  const level = levelForScore(score)
  const streak = correct ? (current?.correct_streak || 0) + 1 : 0
  const reviewAt = nextReviewDate(score, correct)
  db.prepare(`
    INSERT INTO learner_mastery (
      user_id, skill_id, knowledge_point_id, level, score, evidence_count,
      correct_streak, last_practiced_at, next_review_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, knowledge_point_id) DO UPDATE SET
      level = excluded.level,
      score = excluded.score,
      evidence_count = learner_mastery.evidence_count + 1,
      correct_streak = excluded.correct_streak,
      last_practiced_at = CURRENT_TIMESTAMP,
      next_review_at = excluded.next_review_at,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, activity.skill_id, activity.knowledge_point_id, level, score, streak, reviewAt)
  return db.prepare(`
    SELECT lm.*, kp.title FROM learner_mastery lm
    JOIN knowledge_points kp ON kp.id = lm.knowledge_point_id
    WHERE lm.user_id = ? AND lm.knowledge_point_id = ?
  `).get(userId, activity.knowledge_point_id)
}

function recalculateLessonProgress(userId, lessonId) {
  const required = db.prepare(`
    SELECT COUNT(*) AS count FROM learning_activities
    WHERE lesson_id = ? AND is_required = 1 AND is_active = 1
  `).get(lessonId).count
  const solved = db.prepare(`
    SELECT COUNT(DISTINCT a.id) AS count
    FROM learning_activities a
    JOIN activity_attempts at ON at.activity_id = a.id AND at.user_id = ? AND at.is_correct = 1
    WHERE a.lesson_id = ? AND a.is_required = 1 AND a.is_active = 1
  `).get(userId, lessonId).count
  const progress = required ? Math.round(solved / required * 90) : 90
  db.prepare(`
    UPDATE lesson_progress SET progress = MAX(progress, ?), best_score = MAX(best_score, ?),
      status = CASE WHEN status = 'completed' THEN 'completed' ELSE 'in_progress' END,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND lesson_id = ?
  `).run(progress, required ? Math.round(solved / required * 100) : 100, userId, lessonId)
  return {
    required,
    solved,
    completionReady: solved >= required,
    progress: db.prepare('SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?').get(userId, lessonId)
  }
}

function submitAttempt(userId, activityId, answer) {
  const activity = db.prepare(`
    SELECT a.*, m.skill_id FROM learning_activities a
    JOIN course_lessons l ON l.id = a.lesson_id
    JOIN course_modules m ON m.id = l.module_id
    WHERE a.id = ? AND a.is_active = 1 AND l.status = 'published'
  `).get(activityId)
  if (!activity) return null

  return db.transaction(() => {
    startLesson(userId, activity.lesson_id, activity.skill_id)
    const attemptNumber = db.prepare(`
      SELECT COUNT(*) AS count FROM activity_attempts WHERE user_id = ? AND activity_id = ?
    `).get(userId, activityId).count + 1
    const result = evaluateActivity(activity, answer)
    const config = parseJson(activity.config_json, {})
    const feedback = {
      tone: result.correct ? 'success' : 'retry',
      title: result.correct ? '判断成立' : '再想一步',
      message: result.message,
      hint: result.correct ? '' : config.hint || '',
      explanation: result.correct ? activity.explanation : '',
      canRetry: !result.correct
    }
    const inserted = db.prepare(`
      INSERT INTO activity_attempts (
        user_id, activity_id, attempt_number, answer_json, is_correct,
        score, feedback_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      activityId,
      attemptNumber,
      JSON.stringify(answer),
      result.correct ? 1 : 0,
      result.correct ? activity.points : 0,
      JSON.stringify(feedback)
    )
    const mastery = updateMastery(userId, activity, result.correct, attemptNumber)
    const lessonProgress = recalculateLessonProgress(userId, activity.lesson_id)
    return {
      attempt: {
        id: Number(inserted.lastInsertRowid),
        attemptNumber,
        correct: result.correct,
        score: result.correct ? activity.points : 0,
        feedback
      },
      mastery,
      lessonProgress
    }
  })()
}

function completeLesson(userId, skillId, lessonId) {
  const lesson = db.prepare(`
    SELECT l.*, m.skill_id, m.sort_order AS module_order
    FROM course_lessons l JOIN course_modules m ON m.id = l.module_id
    WHERE l.id = ? AND m.skill_id = ? AND l.status = 'published'
  `).get(lessonId, skillId)
  if (!lesson) return null
  const readiness = recalculateLessonProgress(userId, lessonId)
  if (!readiness.completionReady) {
    return { blocked: true, missingActivities: readiness.required - readiness.solved }
  }

  return db.transaction(() => {
    db.prepare(`
      INSERT INTO lesson_progress (user_id, lesson_id, status, progress, best_score, started_at, completed_at, updated_at)
      VALUES (?, ?, 'completed', 100, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET
        status = 'completed', progress = 100,
        completed_at = COALESCE(lesson_progress.completed_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
    `).run(userId, lessonId)

    if (lesson.legacy_chapter_order !== null) {
      db.prepare(`
        INSERT INTO skill_progress (user_id, skill_id, chapter_order, completed, notes, updated_at)
        VALUES (?, ?, ?, 1, '', CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, skill_id, chapter_order) DO UPDATE SET completed = 1, updated_at = CURRENT_TIMESTAMP
      `).run(userId, skillId, lesson.legacy_chapter_order)
    }

    const nextLesson = db.prepare(`
      SELECT l.id, l.title FROM course_lessons l
      JOIN course_modules m ON m.id = l.module_id
      WHERE m.skill_id = ? AND m.is_published = 1 AND l.status = 'published'
        AND (m.sort_order > ? OR (m.sort_order = ? AND l.sort_order > ?))
      ORDER BY m.sort_order, l.sort_order LIMIT 1
    `).get(skillId, lesson.module_order, lesson.module_order, lesson.sort_order)

    if (nextLesson) {
      db.prepare(`
        UPDATE course_enrollments SET active_lesson_id = ?, last_activity_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND skill_id = ?
      `).run(nextLesson.id, userId, skillId)
    } else {
      db.prepare(`
        UPDATE course_enrollments SET status = 'completed', active_lesson_id = ?,
          completed_at = CURRENT_TIMESTAMP, last_activity_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND skill_id = ?
      `).run(lessonId, userId, skillId)
    }
    return { blocked: false, completed: true, nextLesson }
  })()
}

function getLearningDashboard(userId) {
  const activeCourses = db.prepare(`
    SELECT s.id, s.title, s.category, s.instructor_name,
      e.active_lesson_id, e.last_activity_at, l.title AS active_lesson_title,
      (SELECT COUNT(*) FROM course_lessons cl JOIN course_modules cm ON cm.id = cl.module_id
        WHERE cm.skill_id = s.id AND cl.status = 'published') AS lesson_count,
      (SELECT COUNT(*) FROM lesson_progress lp JOIN course_lessons cl ON cl.id = lp.lesson_id
        JOIN course_modules cm ON cm.id = cl.module_id
        WHERE cm.skill_id = s.id AND lp.user_id = ? AND lp.status = 'completed') AS completed_lessons,
      COALESCE((SELECT CASE WHEN SUM(score) > 0 THEN MAX(1, ROUND(AVG(score))) ELSE 0 END
        FROM learner_mastery lm WHERE lm.skill_id = s.id AND lm.user_id = ?), 0) AS mastery_score
    FROM course_enrollments e
    JOIN skills s ON s.id = e.skill_id
    LEFT JOIN course_lessons l ON l.id = e.active_lesson_id
    WHERE e.user_id = ? AND e.status = 'active'
    ORDER BY e.last_activity_at DESC LIMIT 4
  `).all(userId, userId, userId)

  const reviews = db.prepare(`
    SELECT lm.knowledge_point_id, kp.title AS knowledge_point, lm.level, lm.score,
      lm.next_review_at, s.id AS skill_id, s.title AS course_title,
      (SELECT a.id FROM learning_activities a
        JOIN course_lessons l ON l.id = a.lesson_id
        WHERE a.knowledge_point_id = kp.id AND a.is_active = 1 AND l.status = 'published'
        ORDER BY a.id DESC LIMIT 1) AS activity_id,
      (SELECT a.lesson_id FROM learning_activities a
        JOIN course_lessons l ON l.id = a.lesson_id
        WHERE a.knowledge_point_id = kp.id AND a.is_active = 1 AND l.status = 'published'
        ORDER BY a.id DESC LIMIT 1) AS lesson_id
    FROM learner_mastery lm
    JOIN knowledge_points kp ON kp.id = lm.knowledge_point_id
    JOIN skills s ON s.id = lm.skill_id
    WHERE lm.user_id = ? AND lm.next_review_at IS NOT NULL
      AND datetime(lm.next_review_at) <= datetime('now')
    ORDER BY lm.next_review_at LIMIT 12
  `).all(userId)

  return { activeCourses, reviews }
}

function getAdminLesson(lessonId) {
  const lesson = db.prepare(`
    SELECT l.*, m.skill_id, m.title AS module_title
    FROM course_lessons l JOIN course_modules m ON m.id = l.module_id
    WHERE l.id = ?
  `).get(lessonId)
  if (!lesson) return null
  const blocks = db.prepare('SELECT * FROM lesson_blocks WHERE lesson_id = ? ORDER BY sort_order, id').all(lessonId)
    .map(row => ({ id: row.id, type: row.type, sortOrder: row.sort_order, content: parseJson(row.content_json, {}) }))
  const activities = db.prepare(`
    SELECT a.*, kp.title AS knowledge_point_title FROM learning_activities a
    LEFT JOIN knowledge_points kp ON kp.id = a.knowledge_point_id
    WHERE a.lesson_id = ? AND a.is_active = 1 ORDER BY a.sort_order, a.id
  `).all(lessonId).map(row => ({
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    config: parseJson(row.config_json, {}),
    explanation: row.explanation,
    points: row.points,
    sortOrder: row.sort_order,
    isRequired: Boolean(row.is_required),
    knowledgePoint: row.knowledge_point_title || ''
  }))
  const knowledgePoints = db.prepare(`
    SELECT kp.id, kp.title FROM lesson_knowledge_points lkp
    JOIN knowledge_points kp ON kp.id = lkp.knowledge_point_id
    WHERE lkp.lesson_id = ? ORDER BY kp.sort_order
  `).all(lessonId)
  return {
    lesson: {
      id: lesson.id,
      skillId: lesson.skill_id,
      moduleId: lesson.module_id,
      moduleTitle: lesson.module_title,
      title: lesson.title,
      summary: lesson.summary,
      type: lesson.lesson_type,
      estimatedMinutes: lesson.estimated_minutes,
      status: lesson.status
    },
    blocks,
    activities,
    knowledgePoints
  }
}

function getAdminStudio(skillId, userId) {
  const overview = getCourseOverview(skillId, userId, { includeDraft: true })
  if (!overview) return null
  const versions = db.prepare(`
    SELECT v.id, v.version_number, v.event_type, v.note, v.created_at,
      u.real_name AS created_by_name
    FROM course_content_versions v
    LEFT JOIN users u ON u.id = v.created_by
    WHERE v.skill_id = ? ORDER BY v.version_number DESC LIMIT 12
  `).all(skillId)
  return { ...overview, versions }
}

function snapshotLesson(lessonId) {
  return getAdminLesson(lessonId)
}

function nextVersion(skillId) {
  return (db.prepare(`
    SELECT COALESCE(MAX(version_number), 0) AS value FROM course_content_versions WHERE skill_id = ?
  `).get(skillId).value || 0) + 1
}

function saveAdminLesson(lessonId, payload, userId) {
  const current = getAdminLesson(lessonId)
  if (!current) return null
  const allowedLessonTypes = new Set(['interactive', 'reading', 'quiz', 'reflection'])
  const allowedStatuses = new Set(['draft', 'published', 'archived'])
  const allowedBlockTypes = new Set(['scenario', 'text', 'explanation', 'key_points', 'reflection', 'divider'])
  const allowedActivityTypes = new Set(['single_choice', 'multiple_choice', 'sequence', 'classify'])

  return db.transaction(() => {
    db.prepare(`
      INSERT INTO course_content_versions (
        skill_id, lesson_id, version_number, event_type, snapshot_json, note, created_by
      ) VALUES (?, ?, ?, 'save', ?, ?, ?)
    `).run(
      current.lesson.skillId,
      lessonId,
      nextVersion(current.lesson.skillId),
      JSON.stringify(current),
      payload.note || '保存课时内容',
      userId
    )

    const title = String(payload.title || current.lesson.title).trim().slice(0, 200)
    const summary = String(payload.summary ?? current.lesson.summary).trim().slice(0, 1000)
    const lessonType = allowedLessonTypes.has(payload.type) ? payload.type : current.lesson.type
    const status = allowedStatuses.has(payload.status) ? payload.status : current.lesson.status
    const estimatedMinutes = Math.max(1, Math.min(240, Number(payload.estimatedMinutes) || current.lesson.estimatedMinutes))
    db.prepare(`
      UPDATE course_lessons SET title = ?, summary = ?, lesson_type = ?,
        estimated_minutes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, summary, lessonType, estimatedMinutes, status, lessonId)

    if (Array.isArray(payload.knowledgePoints)) {
      db.prepare('DELETE FROM lesson_knowledge_points WHERE lesson_id = ?').run(lessonId)
      const maxOrder = db.prepare(`
        SELECT COALESCE(MAX(sort_order), 0) AS value FROM knowledge_points WHERE skill_id = ?
      `).get(current.lesson.skillId).value
      payload.knowledgePoints.map(item => String(item.title || item).trim()).filter(Boolean).forEach((point, index) => {
        db.prepare(`
          INSERT INTO knowledge_points (skill_id, title, description, sort_order)
          VALUES (?, ?, '', ?) ON CONFLICT(skill_id, title) DO NOTHING
        `).run(current.lesson.skillId, point.slice(0, 120), maxOrder + index + 1)
        const row = db.prepare('SELECT id FROM knowledge_points WHERE skill_id = ? AND title = ?').get(current.lesson.skillId, point.slice(0, 120))
        db.prepare(`
          INSERT INTO lesson_knowledge_points (lesson_id, knowledge_point_id, weight) VALUES (?, ?, 1)
        `).run(lessonId, row.id)
      })
    }

    if (Array.isArray(payload.blocks)) {
      const keptIds = []
      payload.blocks.forEach((block, index) => {
        const type = allowedBlockTypes.has(block.type) ? block.type : 'text'
        const contentJson = JSON.stringify(block.content && typeof block.content === 'object' ? block.content : {})
        if (block.id) {
          const result = db.prepare(`
            UPDATE lesson_blocks SET type = ?, sort_order = ?, content_json = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND lesson_id = ?
          `).run(type, index * 10, contentJson, block.id, lessonId)
          if (result.changes) keptIds.push(Number(block.id))
        } else {
          const inserted = db.prepare(`
            INSERT INTO lesson_blocks (lesson_id, type, sort_order, content_json) VALUES (?, ?, ?, ?)
          `).run(lessonId, type, index * 10, contentJson)
          keptIds.push(Number(inserted.lastInsertRowid))
        }
      })
      if (keptIds.length) {
        db.prepare(`DELETE FROM lesson_blocks WHERE lesson_id = ? AND id NOT IN (${keptIds.map(() => '?').join(',')})`)
          .run(lessonId, ...keptIds)
      } else {
        db.prepare('DELETE FROM lesson_blocks WHERE lesson_id = ?').run(lessonId)
      }
    }

    if (Array.isArray(payload.activities)) {
      const keptIds = []
      payload.activities.forEach((activity, index) => {
        if (!allowedActivityTypes.has(activity.type) || !String(activity.prompt || '').trim()) return
        const pointTitle = String(activity.knowledgePoint || '').trim()
        let pointId = null
        if (pointTitle) {
          db.prepare(`
            INSERT INTO knowledge_points (skill_id, title, description, sort_order)
            VALUES (?, ?, '', 999) ON CONFLICT(skill_id, title) DO NOTHING
          `).run(current.lesson.skillId, pointTitle.slice(0, 120))
          pointId = db.prepare('SELECT id FROM knowledge_points WHERE skill_id = ? AND title = ?')
            .get(current.lesson.skillId, pointTitle.slice(0, 120)).id
        }
        const values = [
          pointId,
          activity.type,
          String(activity.prompt).trim().slice(0, 4000),
          JSON.stringify(activity.config && typeof activity.config === 'object' ? activity.config : {}),
          String(activity.explanation || '').trim().slice(0, 8000),
          Math.max(1, Math.min(100, Number(activity.points) || 10)),
          index * 10 + 5,
          activity.isRequired === false ? 0 : 1
        ]
        if (activity.id) {
          const result = db.prepare(`
            UPDATE learning_activities SET knowledge_point_id = ?, type = ?, prompt = ?,
              config_json = ?, explanation = ?, points = ?, sort_order = ?, is_required = ?,
              is_active = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND lesson_id = ?
          `).run(...values, activity.id, lessonId)
          if (result.changes) keptIds.push(Number(activity.id))
        } else {
          const inserted = db.prepare(`
            INSERT INTO learning_activities (
              lesson_id, knowledge_point_id, type, prompt, config_json,
              explanation, points, sort_order, is_required
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(lessonId, ...values)
          keptIds.push(Number(inserted.lastInsertRowid))
        }
      })
      if (keptIds.length) {
        db.prepare(`
          UPDATE learning_activities SET is_active = 0, updated_at = CURRENT_TIMESTAMP
          WHERE lesson_id = ? AND id NOT IN (${keptIds.map(() => '?').join(',')})
        `).run(lessonId, ...keptIds)
      } else {
        db.prepare('UPDATE learning_activities SET is_active = 0 WHERE lesson_id = ?').run(lessonId)
      }
    }
    return getAdminLesson(lessonId)
  })()
}

function createModule(skillId, title) {
  if (!findCourse(skillId)) return null
  const sortOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM course_modules WHERE skill_id = ?').get(skillId).value
  const inserted = db.prepare(`
    INSERT INTO course_modules (skill_id, title, description, sort_order, is_published)
    VALUES (?, ?, '', ?, 0)
  `).run(skillId, String(title || '新单元').trim().slice(0, 200), sortOrder)
  return db.prepare('SELECT * FROM course_modules WHERE id = ?').get(inserted.lastInsertRowid)
}

function createLesson(moduleId, title) {
  const module = db.prepare('SELECT * FROM course_modules WHERE id = ?').get(moduleId)
  if (!module) return null
  const sortOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS value FROM course_lessons WHERE module_id = ?').get(moduleId).value
  const inserted = db.prepare(`
    INSERT INTO course_lessons (module_id, title, summary, lesson_type, estimated_minutes, sort_order, status)
    VALUES (?, ?, '', 'reading', 12, ?, 'draft')
  `).run(moduleId, String(title || '新课时').trim().slice(0, 200), sortOrder)
  const lessonId = Number(inserted.lastInsertRowid)
  db.prepare(`
    INSERT INTO lesson_blocks (lesson_id, type, sort_order, content_json)
    VALUES (?, 'text', 0, '{"title":"","body":""}')
  `).run(lessonId)
  return getAdminLesson(lessonId)
}

function publishCourse(skillId, status, userId, note = '') {
  const course = findCourse(skillId)
  if (!course || !['draft', 'published'].includes(status)) return null
  const snapshot = getAdminStudio(skillId, userId)
  return db.transaction(() => {
    db.prepare(`
      INSERT INTO course_content_versions (
        skill_id, version_number, event_type, snapshot_json, note, created_by
      ) VALUES (?, ?, 'publish', ?, ?, ?)
    `).run(skillId, nextVersion(skillId), JSON.stringify(snapshot), note || (status === 'published' ? '发布课程' : '转为草稿'), userId)
    db.prepare('UPDATE skills SET course_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, skillId)
    return findCourse(skillId)
  })()
}

module.exports = {
  LEVELS,
  getCatalogMeta,
  getCourseOverview,
  enroll,
  getLesson,
  submitAttempt,
  saveLessonNote,
  completeLesson,
  getLearningDashboard,
  getAdminStudio,
  getAdminLesson,
  saveAdminLesson,
  createModule,
  createLesson,
  publishCourse
}
