import { apiBaseUrl } from "./env";

type LogLevel = "debug" | "info" | "warn" | "error";

async function sendLog(level: LogLevel, message: string, meta?: Record<string, any>) {
  try {
    const payload = {
      level,
      source: "frontend",
      message: `[frontend] ${message}`,
      meta: meta ?? {},
      timestamp: new Date().toISOString(),
    };

    // Try navigator.sendBeacon first for non-blocking delivery
    const url = `${apiBaseUrl.replace(/\/$/, "")}/api/v1/logs`;

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }

    // Fallback to fetch; don't await the result to avoid blocking.
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch (e) {
    // swallow errors in logger
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, any>) => {
    console.debug("[frontend][debug]", msg, meta ?? "");
    void sendLog("debug", msg, meta);
  },
  info: (msg: string, meta?: Record<string, any>) => {
    console.info("[frontend][info]", msg, meta ?? "");
    void sendLog("info", msg, meta);
  },
  warn: (msg: string, meta?: Record<string, any>) => {
    console.warn("[frontend][warn]", msg, meta ?? "");
    void sendLog("warn", msg, meta);
  },
  error: (msg: string, meta?: Record<string, any>) => {
    console.error("[frontend][error]", msg, meta ?? "");
    void sendLog("error", msg, meta);
  },
};
