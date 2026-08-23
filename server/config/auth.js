let warnedAboutFallback = false

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production')
  }

  if (!warnedAboutFallback) {
    console.warn('JWT_SECRET is not set; using a local development secret.')
    warnedAboutFallback = true
  }

  return 'knowledge-platform-local-development-secret'
}

module.exports = { getJwtSecret }
