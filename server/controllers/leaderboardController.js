const { db } = require('../db/connection')

exports.list = (req, res) => {
  const rows = db.prepare(`
    SELECT u.username, u.real_name, u.avatar_url,
      COUNT(DISTINCT s.exercise_id) as solved,
      COUNT(*) as total_submitted,
      ROUND(CAST(SUM(CASE WHEN s.status = 'passed' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 1) as pass_rate
    FROM code_submissions s
    JOIN users u ON s.user_id = u.id
    GROUP BY s.user_id
    ORDER BY solved DESC, pass_rate DESC
    LIMIT 50
  `).all()

  res.json({ success: true, data: rows })
}
