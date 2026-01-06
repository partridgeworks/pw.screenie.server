type LogLevel = "debug" | "info" | "warn" | "error";

function formatTimestamp(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
  const month = monthNames[date.getMonth()];
  const year = String(date.getFullYear() % 100).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const centis = String(Math.floor(date.getMilliseconds() / 10)).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.${centis}`;
}

function shouldLog(_level: LogLevel): boolean {
  return true; // Always log in client for now return (level )
}

function format(prefix: string | undefined, message: unknown, ...optionalParams: unknown[]) {
  const ts = formatTimestamp();
  // Guard: if only one argument was provided by the caller (common usage like logger.info("Message")),
  // it lands in `prefix` and `message` is undefined. In that case, treat `prefix` as the message
  // to avoid logging a trailing `undefined`.
  if (typeof message === "undefined" && optionalParams.length === 0) {
    return [ts, prefix];
  }
  if (prefix) return [ts, prefix, message, ...optionalParams];
  return [ts, message, ...optionalParams];
}

export const logger = {
  debug(prefix: string | undefined, message?: unknown, ...optionalParams: unknown[]): void {
    if (shouldLog("debug")) console.debug(...format(prefix, message, ...optionalParams));
  },
  info(prefix: string | undefined, message?: unknown, ...optionalParams: unknown[]): void {
    if (shouldLog("info")) console.info(...format(prefix, message, ...optionalParams));
  },
  // Alias: route generic log calls to info
  log(prefix: string | undefined, message?: unknown, ...optionalParams: unknown[]): void {
    this.info(prefix, message, ...optionalParams);
  },
  warn(prefix: string | undefined, message?: unknown, ...optionalParams: unknown[]): void {
    if (shouldLog("warn")) console.warn(...format(prefix, message, ...optionalParams));
  },
  error(prefix: string | undefined, message?: unknown, ...optionalParams: unknown[]): void {
    if (shouldLog("error")) console.error(...format(prefix, message, ...optionalParams));
  }
};

export default logger;
