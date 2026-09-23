/** Operational measurements with a closed schema: never URL, cards, IDs or errors. */
export type BenRoute = "bid" | "play" | "lead" | "autoplay";
export interface BenMetricContext {
  attempts: number;
  cache: boolean;
  engine: "nn" | "simulation" | "other";
}
export function benEngine(value: unknown): BenMetricContext["engine"] {
  return value === "NN" ? "nn" : value === "Simulation" ? "simulation" : "other";
}
export function benMetricRecord(route: BenRoute, status: number, elapsed: number, context: BenMetricContext) {
  return {
    event: "bridgelab.ben.v1", route,
    status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : 500,
    durationMs: Number.isFinite(elapsed) ? Math.max(0, Math.round(elapsed)) : 0,
    attempts: Math.max(0, Math.min(2, Math.trunc(context.attempts) || 0)),
    cache: context.cache === true,
    engine: context.engine === "nn" || context.engine === "simulation" ? context.engine : "other",
  };
}
/** Exactly one bounded record per proxy request; no new service or DB write. */
export async function measureBenRoute<T>(route: BenRoute, request: T, handler: (request: T, metric: BenMetricContext) => Promise<Response>): Promise<Response> {
  const started = performance.now();
  const context: BenMetricContext = { attempts: 0, cache: false, engine: "other" };
  let status = 500;
  try {
    const response = await handler(request, context);
    status = response.status;
    return response;
  } finally {
    console.info(JSON.stringify(benMetricRecord(route, status, performance.now() - started, context)));
  }
}
