const { db } = require('../db/connection')

exports.findAllActive = () => {
  return db.prepare('SELECT * FROM carousel WHERE is_active = TRUE ORDER BY sort_order ASC').all()
}
