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

class Logger {
  _timestamp() {
    return new Date().toTimeString().slice(0, 8);
  }

  _log(level, category, message, data) {
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

  section(title) {
    console.log(`\n${'─'.repeat(40)}\n  ${title}\n${'─'.repeat(40)}`);
  }

  async timed(category, name, fn) {
    this.info(category, `${name}: start`);
    const t0 = performance.now();
    try {
      const result = await fn();
      const ms = (performance.now() - t0).toFixed(0);
      this.info(category, `${name}: done (${ms}ms)`);
      return result;
    } catch (err) {
      const ms = (performance.now() - t0).toFixed(0);
      this.error(category, `${name}: failed (${ms}ms)`, err?.message);
      throw err;
    }
  }
}

export const logger = new Logger();
