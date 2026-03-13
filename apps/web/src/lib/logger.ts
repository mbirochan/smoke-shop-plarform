type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

function formatLog(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }
  const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
  return entry.data ? `${prefix} ${entry.message} ${JSON.stringify(entry.data)}` : `${prefix} ${entry.message}`;
}

function createLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
  };
}

// eslint-disable-next-line no-console
const _console = console;

export const logger = {
  debug(message: string, data?: unknown) {
    if (process.env.NODE_ENV === "development") {
      _console.debug(formatLog(createLogEntry("debug", message, data)));
    }
  },
  info(message: string, data?: unknown) {
    _console.info(formatLog(createLogEntry("info", message, data)));
  },
  warn(message: string, data?: unknown) {
    _console.warn(formatLog(createLogEntry("warn", message, data)));
  },
  error(message: string, data?: unknown) {
    _console.error(formatLog(createLogEntry("error", message, data)));
  },
};
