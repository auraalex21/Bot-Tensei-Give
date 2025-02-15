class DebugLogger {
  constructor() {
    this.logs = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
    console.log(`[${timestamp}] ${message}`);
  }

  getLogs() {
    return this.logs;
  }
}

const debugLogger = new DebugLogger();
export default debugLogger;
