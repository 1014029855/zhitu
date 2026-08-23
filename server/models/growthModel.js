const { db } = require('../db/connection')

function parseJson(value, fallback = []) {
  try {
    return JSON.parse(value || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function goalSelect(where = '') {
  return `
    SELECT g.*,
      COUNT(t.id) AS task_count,
      COALESCE(SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END), 0) AS completed_task_count,
      CASE WHEN COUNT(t.id) = 0 THEN 0
        ELSE ROUND(100.0 * SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) / COUNT(t.id))
      END AS progress
    FROM user_goals g
    LEFT JOIN goal_tasks t ON t.goal_id = g.id
    ${where}
    GROUP BY g.id
  `
}

function ensureGoalOwner(goalId, userId) {
  const goal = db.prepare('SELECT * FROM user_goals WHERE id = ? AND user_id = ?').get(goalId, userId)
  if (!goal) throw Object.assign(new Error('目标不存在'), { statusCode: 404 })
  return goal
}

function refreshGoal(goalId) {
  const milestoneIds = db.prepare('SELECT id FROM goal_milestones WHERE goal_id = ?').all(goalId)
  const taskSummary = db.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS doing
    FROM goal_tasks WHERE milestone_id = ?
  `)
  const updateMilestone = db.prepare(`
    UPDATE goal_milestones SET status = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `)

  for (const { id } of milestoneIds) {
    const summary = taskSummary.get(id)
    const status = summary.total > 0 && summary.done === summary.total
      ? 'done'
      : (summary.done > 0 || summary.doing > 0 ? 'in_progress' : 'todo')
    updateMilestone.run(status, status === 'done' ? new Date().toISOString() : null, id)
  }

  const summary = db.prepare(`
    SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done
    FROM goal_tasks WHERE goal_id = ?
  `).get(goalId)
  const goal = db.prepare('SELECT * FROM user_goals WHERE id = ?').get(goalId)
  if (!goal || ['archived', 'paused'].includes(goal.status)) return

  const completed = summary.total > 0 && summary.done === summary.total
  db.prepare('UPDATE user_goals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(completed ? 'completed' : 'active', goalId)

  if (completed) {
    const exists = db.prepare(`SELECT id FROM achievements WHERE goal_id = ? AND type = 'project'`).get(goalId)
    if (!exists) {
      db.prepare(`
        INSERT INTO achievements (user_id, goal_id, type, title, description)
        VALUES (?, ?, 'project', ?, ?)
      `).run(goal.user_id, goalId, `完成目标：${goal.title}`, goal.description || '目标任务已全部完成')
    }
  }
}

function insertPlan(userId, plan, sourceType = 'custom', sourceId = null) {
  const create = db.transaction(() => {
    const goalResult = db.prepare(`
      INSERT INTO user_goals (user_id, title, description, source_type, source_id, target_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, plan.title, plan.description || '', sourceType, sourceId, plan.targetDate || null)
    const goalId = Number(goalResult.lastInsertRowid)

    const addMilestone = db.prepare(`
      INSERT INTO goal_milestones (goal_id, title, description, due_date, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `)
    const addTask = db.prepare(`
      INSERT INTO goal_tasks (
        goal_id, milestone_id, title, description, content_type, content_id,
        content_key, due_date, priority, sort_order, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    let taskOrder = 0
    for (const [milestoneIndex, milestone] of (plan.milestones || []).entries()) {
      const milestoneResult = addMilestone.run(
        goalId,
        milestone.title,
        milestone.description || '',
        milestone.dueDate || null,
        milestoneIndex
      )
      const milestoneId = Number(milestoneResult.lastInsertRowid)
      for (const task of (milestone.tasks || [])) {
        addTask.run(
          goalId,
          milestoneId,
          task.title,
          task.description || '',
          task.contentType || 'custom',
          task.contentId || null,
          task.contentKey || '',
          task.dueDate || milestone.dueDate || null,
          task.priority || 2,
          taskOrder++,
          task.source || plan.source || 'user'
        )
      }
    }

    for (const task of (plan.tasks || [])) {
      addTask.run(
        goalId,
        null,
        task.title,
        task.description || '',
        task.contentType || 'custom',
        task.contentId || null,
        task.contentKey || '',
        task.dueDate || null,
        task.priority || 2,
        taskOrder++,
        task.source || plan.source || 'user'
      )
    }
    return goalId
  })

  return exports.getGoal(userId, create())
}

exports.listGoals = (userId, status) => {
  const params = [userId]
  let where = 'WHERE g.user_id = ?'
  if (status) {
    where += ' AND g.status = ?'
    params.push(status)
  }
  return db.prepare(`${goalSelect(where)} ORDER BY g.updated_at DESC`).all(...params)
}

exports.getGoal = (userId, goalId) => {
  const goal = db.prepare(goalSelect('WHERE g.id = ? AND g.user_id = ?')).get(goalId, userId)
  if (!goal) return null
  goal.milestones = db.prepare('SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY sort_order, id').all(goalId)
  goal.tasks = db.prepare('SELECT * FROM goal_tasks WHERE goal_id = ? ORDER BY sort_order, id').all(goalId)
  return goal
}

exports.createGoal = (userId, plan) => insertPlan(userId, plan, plan.sourceType || 'custom', plan.sourceId || null)

exports.createFromCompetition = (userId, competition) => {
  const existing = db.prepare(`
    SELECT id FROM user_goals
    WHERE user_id = ? AND source_type = 'competition' AND source_id = ? AND status != 'archived'
  `).get(userId, competition.id)
  if (existing) return exports.getGoal(userId, existing.id)

  const plan = {
    title: `备赛：${competition.title}`,
    description: competition.description || '',
    targetDate: competition.deadline || competition.end_date || null,
    source: 'system',
    milestones: [
      {
        title: '确定方向',
        tasks: [
          { title: '确认参赛与组队安排', contentType: 'competition', contentId: competition.id, contentKey: 'preparing', priority: 1 },
          { title: '完成报名', contentType: 'competition', contentId: competition.id, contentKey: 'registered', priority: 1 }
        ]
      },
      {
        title: '集中准备',
        tasks: [
          { title: '完成一次阶段复盘', contentType: 'custom', priority: 2 },
          { title: '整理提交材料', contentType: 'competition', contentId: competition.id, contentKey: 'submitted', priority: 1 }
        ]
      },
      {
        title: '收尾沉淀',
        tasks: [
          { title: '记录参赛结果与经验', contentType: 'competition', contentId: competition.id, contentKey: 'completed', priority: 2 }
        ]
      }
    ]
  }
  return insertPlan(userId, plan, 'competition', competition.id)
}

exports.createFromConfirmedPlan = (userId, plan) => {
  return insertPlan(userId, { ...plan, source: 'ai' }, plan.sourceType || 'custom', plan.sourceId || null)
}

exports.updateGoal = (userId, goalId, changes) => {
  ensureGoalOwner(goalId, userId)
  db.prepare(`
    UPDATE user_goals SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      target_date = COALESCE(?, target_date),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(changes.title ?? null, changes.description ?? null, changes.targetDate ?? null, changes.status ?? null, goalId)
  return exports.getGoal(userId, goalId)
}

exports.addTask = (userId, goalId, task) => {
  ensureGoalOwner(goalId, userId)
  if (task.milestoneId) {
    const milestone = db.prepare('SELECT id FROM goal_milestones WHERE id = ? AND goal_id = ?').get(task.milestoneId, goalId)
    if (!milestone) throw Object.assign(new Error('阶段不存在'), { statusCode: 404 })
  }
  const result = db.prepare(`
    INSERT INTO goal_tasks (
      goal_id, milestone_id, title, description, content_type, content_id,
      content_key, due_date, priority, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user')
  `).run(
    goalId,
    task.milestoneId || null,
    task.title,
    task.description || '',
    task.contentType || 'custom',
    task.contentId || null,
    task.contentKey || '',
    task.dueDate || null,
    task.priority || 2
  )
  return db.prepare('SELECT * FROM goal_tasks WHERE id = ?').get(result.lastInsertRowid)
}

exports.updateTask = (userId, goalId, taskId, changes) => {
  ensureGoalOwner(goalId, userId)
  const task = db.prepare('SELECT * FROM goal_tasks WHERE id = ? AND goal_id = ?').get(taskId, goalId)
  if (!task) throw Object.assign(new Error('任务不存在'), { statusCode: 404 })
  const status = changes.status ?? task.status
  db.prepare(`
    UPDATE goal_tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      due_date = COALESCE(?, due_date),
      priority = COALESCE(?, priority),
      status = ?,
      completed_at = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    changes.title ?? null,
    changes.description ?? null,
    changes.dueDate ?? null,
    changes.priority ?? null,
    status,
    status === 'done' ? (task.completed_at || new Date().toISOString()) : null,
    taskId
  )
  refreshGoal(goalId)
  return db.prepare('SELECT * FROM goal_tasks WHERE id = ?').get(taskId)
}

exports.completeMatchingTasks = (userId, contentType, contentId, contentKey) => {
  const params = [userId, contentType, contentId]
  let keyClause = ''
  if (contentKey !== undefined && contentKey !== null) {
    keyClause = ' AND t.content_key = ?'
    params.push(String(contentKey))
  }
  const rows = db.prepare(`
    SELECT t.id, t.goal_id FROM goal_tasks t
    JOIN user_goals g ON g.id = t.goal_id
    WHERE g.user_id = ? AND g.status IN ('active', 'paused')
      AND t.content_type = ? AND t.content_id = ? AND t.status != 'done'${keyClause}
  `).all(...params)
  if (!rows.length) return 0

  const complete = db.prepare(`
    UPDATE goal_tasks SET status = 'done', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `)
  const apply = db.transaction(() => rows.forEach(row => complete.run(row.id)))
  apply()
  for (const goalId of new Set(rows.map(row => row.goal_id))) refreshGoal(goalId)
  return rows.length
}

exports.listBookmarks = (userId, contentType) => {
  const params = [userId]
  let where = 'WHERE user_id = ?'
  if (contentType) {
    where += ' AND content_type = ?'
    params.push(contentType)
  }
  return db.prepare(`SELECT * FROM bookmarks ${where} ORDER BY created_at DESC`).all(...params)
}

exports.addBookmark = (userId, contentType, contentId) => {
  db.prepare(`INSERT OR IGNORE INTO bookmarks (user_id, content_type, content_id) VALUES (?, ?, ?)`)
    .run(userId, contentType, contentId)
  return db.prepare(`SELECT * FROM bookmarks WHERE user_id = ? AND content_type = ? AND content_id = ?`)
    .get(userId, contentType, contentId)
}

exports.removeBookmark = (userId, contentType, contentId) => {
  return db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND content_type = ? AND content_id = ?')
    .run(userId, contentType, contentId).changes > 0
}

exports.getParticipation = (userId, competitionId) => {
  return db.prepare('SELECT * FROM competition_participations WHERE user_id = ? AND competition_id = ?')
    .get(userId, competitionId) || null
}

exports.upsertParticipation = (userId, competitionId, data) => {
  db.prepare(`
    INSERT INTO competition_participations (user_id, competition_id, status, team_name, notes, registered_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, competition_id) DO UPDATE SET
      status = excluded.status,
      team_name = excluded.team_name,
      notes = excluded.notes,
      registered_at = COALESCE(excluded.registered_at, competition_participations.registered_at),
      updated_at = CURRENT_TIMESTAMP
  `).run(
    userId,
    competitionId,
    data.status,
    data.teamName || '',
    data.notes || '',
    ['registered', 'submitted', 'completed'].includes(data.status) ? new Date().toISOString() : null
  )
  const progression = ['preparing', 'registered', 'submitted', 'completed']
  const currentIndex = progression.indexOf(data.status)
  if (currentIndex >= 0) {
    for (const status of progression.slice(0, currentIndex + 1)) {
      exports.completeMatchingTasks(userId, 'competition', competitionId, status)
    }
  }
  return exports.getParticipation(userId, competitionId)
}

exports.listPaperLibrary = (userId, status) => {
  const params = [userId]
  let where = 'WHERE l.user_id = ?'
  if (status) {
    where += ' AND l.status = ?'
    params.push(status)
  }
  return db.prepare(`
    SELECT l.*, p.title, p.authors, p.year, p.category
    FROM paper_library l JOIN papers p ON p.id = l.paper_id
    ${where} ORDER BY l.updated_at DESC
  `).all(...params).map(row => ({ ...row, tags: parseJson(row.tags) }))
}

exports.upsertPaperLibrary = (userId, paperId, data) => {
  db.prepare(`
    INSERT INTO paper_library (user_id, paper_id, status, notes, tags)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, paper_id) DO UPDATE SET
      status = excluded.status, notes = excluded.notes, tags = excluded.tags, updated_at = CURRENT_TIMESTAMP
  `).run(userId, paperId, data.status, data.notes || '', JSON.stringify(data.tags || []))
  if (data.status === 'read') exports.completeMatchingTasks(userId, 'paper', paperId)
  const row = db.prepare('SELECT * FROM paper_library WHERE user_id = ? AND paper_id = ?').get(userId, paperId)
  return { ...row, tags: parseJson(row.tags) }
}

exports.recordExerciseResult = (userId, exerciseId, passed) => {
  const nextReviewAt = passed ? null : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  db.prepare(`
    INSERT INTO exercise_reviews (user_id, exercise_id, status, attempts, last_result, next_review_at)
    VALUES (?, ?, ?, 1, ?, ?)
    ON CONFLICT(user_id, exercise_id) DO UPDATE SET
      status = excluded.status,
      attempts = exercise_reviews.attempts + 1,
      last_result = excluded.last_result,
      next_review_at = excluded.next_review_at,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, exerciseId, passed ? 'mastered' : 'review', passed ? 'passed' : 'failed', nextReviewAt)
  if (passed) exports.completeMatchingTasks(userId, 'exercise', exerciseId)
  return db.prepare('SELECT * FROM exercise_reviews WHERE user_id = ? AND exercise_id = ?').get(userId, exerciseId)
}

exports.listExerciseReviews = (userId, status) => {
  const params = [userId]
  let where = 'WHERE r.user_id = ?'
  if (status) {
    where += ' AND r.status = ?'
    params.push(status)
  }
  return db.prepare(`
    SELECT r.*, e.title, e.difficulty, e.category, e.language
    FROM exercise_reviews r JOIN exercises e ON e.id = r.exercise_id
    ${where} ORDER BY COALESCE(r.next_review_at, r.updated_at) ASC
  `).all(...params)
}

exports.listAchievements = (userId) => {
  return db.prepare('SELECT * FROM achievements WHERE user_id = ? ORDER BY created_at DESC').all(userId)
}

exports.createAchievement = (userId, data) => {
  if (data.goalId) ensureGoalOwner(data.goalId, userId)
  const result = db.prepare(`
    INSERT INTO achievements (user_id, goal_id, type, title, description, evidence_url, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, data.goalId || null, data.type || 'reflection', data.title, data.description || '', data.evidenceUrl || '', data.isPublic ? 1 : 0)
  return db.prepare('SELECT * FROM achievements WHERE id = ?').get(result.lastInsertRowid)
}

exports.dashboard = (userId) => {
  const activeGoals = db.prepare(`${goalSelect("WHERE g.user_id = ? AND g.status = 'active'")} ORDER BY g.updated_at DESC LIMIT 6`).all(userId)
  const nextTasks = db.prepare(`
    SELECT t.*, g.title AS goal_title
    FROM goal_tasks t JOIN user_goals g ON g.id = t.goal_id
    WHERE g.user_id = ? AND g.status = 'active' AND t.status != 'done'
    ORDER BY CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END, t.due_date, t.priority, t.sort_order
    LIMIT 8
  `).all(userId)
  const deadlines = db.prepare(`
    SELECT t.id, t.title, t.due_date, g.id AS goal_id, g.title AS goal_title
    FROM goal_tasks t JOIN user_goals g ON g.id = t.goal_id
    WHERE g.user_id = ? AND g.status = 'active' AND t.status != 'done'
      AND t.due_date IS NOT NULL AND date(t.due_date) >= date('now')
    ORDER BY t.due_date LIMIT 8
  `).all(userId)
  const recentAchievements = db.prepare(`
    SELECT * FROM achievements WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(userId)
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM user_goals WHERE user_id = ? AND status = 'active') AS active_goals,
      (SELECT COUNT(*) FROM goal_tasks t JOIN user_goals g ON g.id = t.goal_id WHERE g.user_id = ? AND t.status = 'done') AS completed_tasks,
      (SELECT COUNT(*) FROM paper_library WHERE user_id = ? AND status = 'read') AS papers_read,
      (SELECT COUNT(*) FROM exercise_reviews WHERE user_id = ? AND status = 'mastered') AS exercises_mastered,
      (SELECT COUNT(*) FROM achievements WHERE user_id = ?) AS achievements
  `).get(userId, userId, userId, userId, userId)
  return { activeGoals, nextTasks, deadlines, recentAchievements, stats }
}

exports.refreshGoal = refreshGoal
