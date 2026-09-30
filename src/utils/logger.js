const CATEGORY_EMOJI = {
  auth: '🔐',
  api: '🌐',
  storage: '💾',
  ui: '🎨',
  network: '📡',
  data: '📊',
  household: '🏠',
  categories: '🏷️',
  entries: '📝',
  cache: '🗄️',
  error: '🔴',
  warning: '⚠️',
  success: '✅',
  info: 'ℹ️',
};

// Never log in production — avoids leaking user emails, route paths, and timing data
const IS_DEV = import.meta.env?.DEV ?? false;

class Logger {
  _timestamp() {
    return new Date().toTimeString().slice(0, 8);
  }

  _log(level, category, message, data) {
    if (!IS_DEV) return;
    const emoji = CATEGORY_EMOJI[category] ?? CATEGORY_EMOJI[level] ?? '•';
    const prefix = `[${this._timestamp()}] ${emoji} ${category}:`;
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    data !== undefined ? fn(prefix, message, data) : fn(prefix, message);
  }

  info(category, message, data)  { this._log('info',  category, message, data); }
  error(category, message, data) { this._log('error', category, message, data); }
  warn(category, message, data)  { this._log('warn',  category, message, data); }

  // Shorthand helpers matching Mobile
  auth(message, data)     { this.info('auth',       message, data); }
  api(message, data)      { this.info('api',        message, data); }
  network(message, data)  { this.info('network',    message, data); }
  ui(message, data)       { this.info('ui',         message, data); }
}

export const logger = new Logger();
