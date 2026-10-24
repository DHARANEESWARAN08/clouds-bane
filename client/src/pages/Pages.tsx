import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "wouter";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Clock3,
  Cloud,
  Code2,
  Database,
  Gauge,
  GitBranch,
  Layers3,
  Network,
  Play,
  RefreshCw,
  Search,
  ServerCog,
  ShieldAlert,
  Target,
  Terminal,
  TriangleAlert,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { DatasetAnalytics } from "@/services/api";
import { FEATURE_GROUPS, MODEL_INFO } from "@/types";
import type {
  Alert,
  DashboardMetrics,
  HealthCheck,
  PredictionResult,
  RiskLevel,
} from "@/types";
import {
  EmptyState,
  MetricCard,
  PlatformMark,
  RiskBadge,
  SectionHeader,
  StatusBadge,
  StatusDot,
} from "@/components/CloudLayout";

const chartTooltipStyle = {
  backgroundColor: "#13232a",
  border: "1px solid rgba(148,179,181,.22)",
  borderRadius: 2,
  color: "#edf7f4",
  fontSize: 11,
};
const severityColors = ["#8b7cff", "#5da8ff", "#e7b35b", "#ff657a"];
const fallbackHealth: HealthCheck[] = [
  { name: "API Gateway", state: "unknown", detail: "Connection pending" },
  { name: "Lambda", state: "unknown", detail: "Connection pending" },
  { name: "ML Engine", state: "unknown", detail: "Connection pending" },
  { name: "DynamoDB", state: "unknown", detail: "Connection pending" },
  { name: "CloudWatch", state: "unknown", detail: "Connection pending" },
];

function useRefreshSignal() {
  const [signal, setSignal] = useState(0);
  useEffect(() => {
    const listener = () => setSignal(value => value + 1);
    window.addEventListener("cb-refresh", listener);
    return () => window.removeEventListener("cb-refresh", listener);
  }, []);
  return signal;
}

function DataError({ message }: { message: string }) {
  return (
    <div className="mb-5 flex items-start gap-3 border border-[#e7b35b]/22 bg-[#e7b35b]/[.06] p-4 text-sm text-[#dfc58f]">
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">Live data unavailable</p>
        <p className="mt-1 text-xs leading-5 text-[#aa956b]">{message}</p>
      </div>
    </div>
  );
}

function LoadingBar() {
  return (
    <div className="h-1 w-full overflow-hidden bg-white/[.06]">
      <div className="h-full w-1/3 animate-pulse bg-[#8b7cff]" />
    </div>
  );
}

function ChartFrame({
  title,
  eyebrow,
  children,
  className = "",
  action,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`cb-panel p-5 ${className}`}>
      <SectionHeader eyebrow={eyebrow} title={title} action={action} />
      {children}
    </section>
  );
}

function formatValue(value?: number | string) {
  return value == null || value === ""
    ? "Unavailable"
    : typeof value === "number"
      ? value.toLocaleString()
      : value;
}

function formatEndpoint(ip?: string, port?: number) {
  const address = ip?.trim() || "IP unavailable";
  return port == null ? address : `${address} (Port ${port})`;
}

function percent(attacks?: number, total?: number) {
  return attacks != null && total
    ? `${((attacks / total) * 100).toFixed(2)}%`
    : undefined;
}

function StatusStrip({ health }: { health: HealthCheck[] }) {
  return (
    <div className="grid gap-px border border-white/[.08] bg-white/[.08] sm:grid-cols-5">
      {(health.length ? health : fallbackHealth).map(item => (
        <div key={item.name} className="bg-[#0d1b22] px-3 py-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[.13em] text-[#779096]">
              {item.name}
            </span>
            <StatusBadge
              state={item.state}
              label={item.state === "unknown" ? "PENDING" : undefined}
            />
          </div>
          <p className="truncate text-[10px] text-[#9bb0b0]">
            {item.detail || "Reported by /health"}
          </p>
        </div>
      ))}
    </div>
  );
}

function AlertTable({
  alerts,
  compact = false,
  onSelect,
}: {
  alerts: Alert[];
  compact?: boolean;
  onSelect?: (alert: Alert) => void;
}) {
  const visible = compact ? alerts.slice(0, 5) : alerts;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[840px] border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[.08] font-mono text-[9px] uppercase tracking-[.15em] text-[#647b80]">
            {[
              "Time",
              "Source",
              "Destination",
              "Protocol",
              "Probability",
              "Risk",
              "Status",
            ].map(header => (
              <th key={header} className="px-3 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map(alert => (
            <tr
              key={alert.id}
              onClick={() => onSelect?.(alert)}
              className={`group border-b border-white/[.05] text-xs transition-colors ${onSelect ? "cursor-pointer hover:bg-[#8b7cff]/[.045]" : "hover:bg-white/[.025]"}`}
            >
              <td
                className="whitespace-nowrap px-3 py-3 font-mono text-[#8aa0a3]"
                title={alert.timestamp || "Timestamp unavailable"}
              >
                {alert.timestamp && !Number.isNaN(Date.parse(alert.timestamp))
                  ? new Date(alert.timestamp).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                      timeZone: "Asia/Kolkata",
                    }) + " IST"
                  : "Timestamp unavailable"}
              </td>
              <td className="px-3 py-3 font-mono text-[#d4e1df]">
                {formatEndpoint(alert.sourceIp, alert.sourcePort)}
              </td>
              <td className="px-3 py-3 font-mono text-[#d4e1df]">
                {formatEndpoint(alert.destinationIp, alert.destinationPort)}
              </td>
              <td className="px-3 py-3 text-[#a0b1b1]">
                {alert.protocol || "Unavailable"}
              </td>
              <td className="px-3 py-3 font-mono text-[#d4e1df]">
                {typeof alert.probability === "number"
                  ? `${(alert.probability * 100).toFixed(2)}%`
                  : "Unavailable"}
              </td>
              <td className="px-3 py-3">
                <RiskBadge risk={alert.risk} />
              </td>
              <td className="px-3 py-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] text-[#8da4a3]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${alert.status?.toLowerCase() === "closed" ? "bg-[#72848a]" : "bg-[#e7b35b]"}`}
                  />
                  {alert.status || "OPEN"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertDetail({
  alert,
  onClose,
}: {
  alert: Alert;
  onClose: () => void;
}) {
  const probability =
    typeof alert.probability === "number"
      ? `${(alert.probability * 100).toFixed(2)}%`
      : "Unavailable";
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close alert details"
      />
      <aside className="relative h-full w-full max-w-[500px] overflow-y-auto border-l border-white/10 bg-[#0b1820] p-5 shadow-2xl sm:p-7">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[.22em] text-[#8b7cff]">
              Investigation view
            </p>
            <h2 className="text-xl font-bold text-white">Security event</h2>
            <p className="mt-1 font-mono text-[10px] text-[#71868a]">
              {alert.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="border border-white/10 p-2 text-[#8fa5a5] hover:text-white"
            aria-label="Close alert details"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mb-6 flex items-center justify-between border-y border-white/[.08] py-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#6c8386]">
              Risk classification
            </p>
            <div className="mt-2">
              <RiskBadge risk={alert.risk} />
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#6c8386]">
              Probability
            </p>
            <p className="mt-2 font-mono text-xl text-[#ff8da0]">
              {probability}
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <p className="mb-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.2em] text-[#8b7cff]">
              <Target size={13} /> Why this alert fired
            </p>
            <div className="border-l border-[#ff657a]/45 pl-4 text-xs leading-5 text-[#a9bbb9]">
              The model classification and threshold are returned by the
              backend. Reason codes and feature contributions are unavailable
              unless the backend provides them.
            </div>
          </div>
          <div>
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[.2em] text-[#8b7cff]">
              Network flow
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Source", formatEndpoint(alert.sourceIp, alert.sourcePort)],
                [
                  "Destination",
                  formatEndpoint(alert.destinationIp, alert.destinationPort),
                ],
                ["Protocol", alert.protocol],
                ["Timestamp", alert.timestamp],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border border-white/[.08] bg-white/[.02] p-3"
                >
                  <p className="font-mono text-[9px] text-[#667e82]">{label}</p>
                  <p className="mt-2 truncate font-mono text-[11px] text-[#d6e3df]">
                    {value || "Unavailable"}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[.2em] text-[#8b7cff]">
              Investigation timeline
            </p>
            <div className="space-y-4 border-l border-white/[.1] pl-4">
              <TimelineItem
                title="Alert received"
                detail={alert.timestamp || "Awaiting event timestamp"}
                color="red"
              />
              <TimelineItem
                title="Model classification"
                detail={`Risk ${alert.risk || "pending"} | threshold owned by backend`}
                color="teal"
              />
              <TimelineItem
                title="Analyst review"
                detail="Awaiting operator action"
                color="muted"
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function TimelineItem({
  title,
  detail,
  color,
}: {
  title: string;
  detail: string;
  color: "red" | "teal" | "muted";
}) {
  return (
    <div className="relative">
      <span
        className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${color === "red" ? "bg-[#ff657a]" : color === "teal" ? "bg-[#8b7cff]" : "bg-[#657c81]"}`}
      />
      <p className="text-xs font-semibold text-[#d5e3df]">{title}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#71868a]">{detail}</p>
    </div>
  );
}

export function DashboardPage() {
  const refresh = useRefreshSignal();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [datasetAnalytics, setDatasetAnalytics] =
    useState<DatasetAnalytics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [health, setHealth] = useState<HealthCheck[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.allSettled([
      api.getMetrics(),
      api.getAlerts(),
      api.getHealth(),
    ]).then(results => {
      if (!active) return;
      const [metricResult, alertResult, healthResult] = results;
      if (metricResult.status === "fulfilled") setMetrics(metricResult.value);
      if (alertResult.status === "fulfilled") setAlerts(alertResult.value);
      if (healthResult.status === "fulfilled") setHealth(healthResult.value);
      const failed = results.find(result => result.status === "rejected");
      if (failed?.status === "rejected")
        setError(
          failed.reason?.message || "The live API could not be reached."
        );
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [refresh]);
  useEffect(() => {
    let active = true;

    api
      .getDatasetAnalytics()
      .then(data => {
        if (active) setDatasetAnalytics(data);
      })
      .catch(error => {
        console.error("Dataset analytics unavailable:", error);
      });

    return () => {
      active = false;
    };
  }, [refresh]);
  const detectionRate = percent(
    metrics?.attacksDetected,
    metrics?.totalInferences
  );
  const criticalAlerts = alerts.filter(
    alert => alert.risk === "CRITICAL" || alert.risk === "HIGH"
  );
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 border-b border-white/[.08] pb-5">
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.22em] text-[#8b7cff]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8b7cff]" />
            Security operations overview
          </div>
          <h2 className="text-3xl font-bold tracking-[-.045em] text-white sm:text-4xl">
            Command center
          </h2>
          <p className="mt-2 text-xs text-[#8b8baa]">
            Historical network threat analytics for Cloud's Bane.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#6e7093]">
          <Clock3 size={13} />{" "}
          {loading
            ? "Syncing telemetry"
            : metrics
              ? "Telemetry received"
              : "Telemetry pending"}
        </div>
      </div>
      {error && <DataError message={error} />}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Total flows"
          value={metrics?.totalInferences}
          icon={Gauge}
          accent="teal"
        />
        <MetricCard
          label="Attacks detected"
          value={metrics?.attacksDetected}
          icon={ShieldAlert}
          accent="red"
        />
        <MetricCard
          label="Benign flows"
          value={metrics?.benignTraffic}
          icon={CheckCircle2}
          accent="blue"
        />
        <MetricCard
          label="Critical alerts"
          value={metrics?.criticalAlerts}
          icon={TriangleAlert}
          accent="amber"
        />
        <MetricCard
          label="Detection rate"
          value={detectionRate}
          icon={Target}
          accent="amber"
        />
        <MetricCard
          label="ML detection"
          value="Unavailable"
          detail="Deployment state not reported"
          icon={Layers3}
          accent="teal"
        />
      </div>
      {loading && <LoadingBar />}
      <div className="grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
        <ChartFrame
          title="Global threat activity"
          eyebrow="AWS operations / last 24 hours"
          action={
            <span className="font-mono text-[9px] text-[#77799b]">
              SOURCE: /METRICS
            </span>
          }
          className="min-h-[420px]"
        >
          <div className="mb-4 flex items-center gap-2 text-[10px] text-[#8b8baa]">
            <span className="h-2 w-2 rounded-full bg-[#8b7cff]" />
            AWS inference telemetry
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SmallStat
              label="Inference count"
              value={formatValue(metrics?.totalInferences)}
            />
            <SmallStat
              label="Attacks detected"
              value={formatValue(metrics?.attacksDetected)}
            />
            <SmallStat
              label="Benign flows"
              value={formatValue(metrics?.benignTraffic)}
            />
            <SmallStat
              label="Critical alerts"
              value={formatValue(metrics?.criticalAlerts)}
            />
          </div>

          <div className="mt-5 border-t border-white/[.08] pt-4">
            <p className="text-xs font-semibold text-[#d5e3df]">
              How to read this panel
            </p>
            <p className="mt-2 text-[10px] leading-5 text-[#8b8baa]">
              These values summarize operational inference metrics reported by
              the backend for the last 24 hours. They are not the total number
              of rows in the historical dataset. Values depend on actual
              requests processed and metrics reported by AWS.
            </p>
          </div>
        </ChartFrame>
        <div className="space-y-5">
          <ChartFrame
            title="Stored alert severity"
            eyebrow="DynamoDB / stored alert inventory"
            action={
              <span className="font-mono text-[9px] text-[#77799b]">
                SOURCE: /METRICS
              </span>
            }
          >
            <p className="mb-3 text-[10px] leading-5 text-[#8b8baa]">
              Severity counts are calculated from stored alerts returned by the
              backend (up to 100 records). They are not limited to the last 24
              hours and are separate from the CloudWatch operational metrics in
              Global threat activity.
            </p>
            {metrics?.riskDistribution?.length ? (
              <div className="flex h-[235px] items-center justify-center gap-5">
                <ResponsiveContainer width="62%" height={210}>
                  <PieChart>
                    <Pie
                      data={metrics.riskDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {metrics.riskDistribution.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={severityColors[index % severityColors.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {metrics.riskDistribution.map((entry, index) => (
                    <div
                      key={entry.name}
                      className="flex items-center gap-2 text-xs text-[#b5b5d1]"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            severityColors[index % severityColors.length],
                        }}
                      />
                      {entry.name}
                      <span className="ml-2 font-mono text-white">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="Awaiting risk telemetry"
                description="Severity distribution will render when GET /metrics returns live classification data."
                icon={ShieldAlert}
              />
            )}
          </ChartFrame>
          <section className="cb-panel p-5">
            <SectionHeader
              eyebrow="Platform / service boundary"
              title="System health"
            />
            {health.length ? (
              <div className="space-y-1">
                {health.map(item => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 border-b border-white/[.06] py-2.5"
                  >
                    <StatusDot state={item.state} />
                    <span className="flex-1 text-xs text-[#c7c8dd]">
                      {item.name}
                    </span>
                    <StatusBadge state={item.state} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Health signals pending"
                description="AWS service state will appear when GET /health responds."
                icon={Activity}
              />
            )}
          </section>
        </div>
      </div>
      <ChartFrame
        title="Attack activity"
        eyebrow="Telemetry / time series"
        action={
          <span className="font-mono text-[9px] text-[#77799b]">
            SOURCE: /METRICS
          </span>
        }
      >
        {metrics?.attackActivity?.length ? (
          <ResponsiveContainer width="100%" height={225}>
            <AreaChart data={metrics.attackActivity}>
              <defs>
                <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff657a" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#8b7cff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(140,145,206,.10)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#77799b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#789095", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip contentStyle={chartTooltipStyle} />
              <Area
                type="monotone"
                dataKey="attacks"
                stroke="#ff657a"
                strokeWidth={2}
                fill="url(#attackGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            title="Awaiting attack telemetry"
            description="Attack volume will appear here when GET /metrics returns a time series."
            icon={Activity}
          />
        )}
      </ChartFrame>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="cb-panel p-5">
          <SectionHeader
            eyebrow="SOC / highest priority"
            title="Recent critical alerts"
            action={
              <Link href="/alerts">
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#a69dff]">
                  Open SOC <ArrowUpRight size={13} />
                </span>
              </Link>
            }
          />
          {criticalAlerts.length ? (
            <AlertTable alerts={criticalAlerts} compact />
          ) : (
            <EmptyState
              title="No critical events loaded"
              description="Recent alert data will appear here after GET /alerts is connected."
              icon={Bell}
            />
          )}
        </section>
        <section className="cb-panel p-5">
          <SectionHeader
            eyebrow="Network intelligence"
            title="Network relationships"
            action={
              <Link href="/network">
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#a69dff]">
                  Explore <ArrowUpRight size={13} />
                </span>
              </Link>
            }
          />
          {datasetAnalytics?.topRelationships?.length ? (
            <div className="space-y-3">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b7cff]">
                Historical dataset | BigFlow-NIDS v2
              </p>

              {datasetAnalytics.topRelationships
                .slice(0, 4)
                .map((item, index) => (
                  <div
                    key={`${item.sourceIp}-${item.destinationIp}-${item.destinationPort}-${index}`}
                    className="border-b border-white/[.07] pb-3"
                  >
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="min-w-0 flex-1 truncate font-mono text-[#b6dfff]">
                        {item.sourceIp}:{item.sourcePort}
                      </span>
                      <ArrowRight
                        size={13}
                        className="shrink-0 text-[#8b7cff]"
                      />
                      <span className="min-w-0 flex-1 truncate text-right font-mono text-[#d4d0ff]">
                        {item.destinationIp}:{item.destinationPort}
                      </span>
                    </div>

                    <p className="mt-2 text-right font-mono text-[10px] text-[#8b8baa]">
                      {item.flows.toLocaleString()} flows
                    </p>
                  </div>
                ))}

              <p className="text-[9px] leading-4 text-[#737da0]">
                Historical observations, not live traffic.{" "}
                {datasetAnalytics.relationshipNote ?? ""}
              </p>
            </div>
          ) : (
            <EmptyState
              title="Historical relationships pending"
              description="Endpoint relationships will appear when offline dataset analytics load."
              icon={Network}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function ThreatSurface({ analytics }: { analytics: DatasetAnalytics | null }) {
  const relationships = analytics?.topRelationships?.slice(0, 8) ?? [];

  return (
    <div className="relative min-h-[330px] overflow-hidden rounded-xl border border-[#5da8ff]/15 bg-[#080d22]/70">
      <div className="network-grid absolute inset-0 opacity-75" />

      <div className="relative z-10 space-y-2 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[.16em] text-[#8b7cff]">
            Historical endpoint relationships
          </span>
          <span className="border border-[#5da8ff]/20 px-2 py-1 font-mono text-[9px] text-[#8fcfff]">
            OFFLINE DATASET
          </span>
        </div>

        {!analytics && (
          <p className="py-12 text-center text-xs text-[#8b8baa]">
            Loading historical network relationships...
          </p>
        )}

        {analytics && relationships.length === 0 && (
          <p className="py-12 text-center text-xs text-[#8b8baa]">
            No endpoint relationships were returned by the analytics API.
          </p>
        )}

        {relationships.map((item, index) => (
          <div
            key={`${item.sourceIp}:${item.sourcePort}-${item.destinationIp}:${item.destinationPort}-${index}`}
            className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border border-white/[.07] bg-[#0b1328]/90 p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-[10px] text-[#b6dfff]">
                {item.sourceIp}:{item.sourcePort}
              </p>
              <p className="mt-1 text-[9px] text-[#737da0]">Source</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="h-px w-8 bg-[#5da8ff]/70" />
              <span className="font-mono text-[9px] text-[#9b91ff]">
                {item.flows.toLocaleString()} flows
              </span>
              <span className="h-px w-8 bg-[#5da8ff]/70" />
            </div>

            <div className="min-w-0 text-right">
              <p className="truncate font-mono text-[10px] text-[#d4d0ff]">
                {item.destinationIp}:{item.destinationPort}
              </p>
              <p className="mt-1 text-[9px] text-[#737da0]">Destination</p>
            </div>
          </div>
        ))}
      </div>

      {analytics?.relationshipNote && (
        <p className="relative z-10 px-4 pb-3 text-[9px] leading-4 text-[#737da0]">
          {analytics.relationshipNote}
        </p>
      )}
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div className="border border-white/[.08] bg-white/[.02] p-3">
      <p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#667e82]">
        {label}
      </p>
      <p className="mt-2 font-mono text-sm text-[#d5e3df]">
        {value ?? "Unavailable"}
      </p>
    </div>
  );
}

function TrafficMini({
  data,
}: {
  data: NonNullable<DashboardMetrics["attackActivity"]>;
}) {
  return (
    <ResponsiveContainer width="100%" height={115}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b7cff" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#8b7cff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="#8b7cff"
          fill="url(#miniGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DetectionPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      FEATURE_GROUPS.map((group, index) => [group.label, index < 2])
    )
  );
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "complete" | "error"
  >("idle");
  const [error, setError] = useState("");
  const updateValue = (key: string, value: string) =>
    setValues(current => ({ ...current, [key]: value }));
  const runDetection = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("submitting");
    setError("");
    setResult(null);
    const features = Object.fromEntries(
      Object.entries(values)
        .filter(([, value]) => value !== "")
        .map(([key, value]) => [
          key,
          Number.isNaN(Number(value)) ? value : Number(value),
        ])
    );
    try {
      const response = await api.predict(features);
      setResult(response);
      setStatus("complete");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Prediction request failed."
      );
      setStatus("error");
    }
  };
  return (
    <div className="grid gap-5 xl:grid-cols-[1.32fr_.68fr]">
      <form onSubmit={runDetection} className="space-y-5">
        <div className="cb-panel p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 font-mono text-[9px] uppercase tracking-[.22em] text-[#8b7cff]">
                POST /predict
              </p>
              <h2 className="text-lg font-bold text-white">
                Network flow intelligence
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-5 text-[#789095]">
                Use meaningful feature groups rather than exposing an
                undifferentiated 49-field form. The backend owns validation and
                model inference.
              </p>
            </div>
            <div className="border border-[#8b7cff]/15 bg-[#8b7cff]/[.04] px-3 py-2 text-right">
              <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#789095]">
                Production model
              </p>
              <p className="mt-1 text-[10px] font-semibold text-[#bfe9de]">
                Top-30
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {FEATURE_GROUPS.map((group, index) => {
              const open = openGroups[group.label];
              return (
                <div
                  key={group.label}
                  className="overflow-hidden border border-white/[.08] bg-white/[.015]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroups(current => ({
                        ...current,
                        [group.label]: !current[group.label],
                      }))
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-[#d8e6e3]">
                      <span className="font-mono text-[10px] text-[#8b7cff]">
                        0{index + 1}
                      </span>
                      {group.label}
                      <span className="font-mono text-[9px] text-[#647b80]">
                        {group.keys.length} signals
                      </span>
                    </span>
                    {open ? (
                      <ChevronUp size={15} className="text-[#6f8589]" />
                    ) : (
                      <ChevronDown size={15} className="text-[#6f8589]" />
                    )}
                  </button>
                  {open && (
                    <div className="grid gap-3 border-t border-white/[.06] px-4 py-4 sm:grid-cols-2">
                      {group.keys.map(key => (
                        <label key={key} className="space-y-1.5">
                          <span className="font-mono text-[10px] text-[#789095]">
                            {key}
                          </span>
                          <input
                            value={values[key] || ""}
                            onChange={event =>
                              updateValue(key, event.target.value)
                            }
                            placeholder="Optional"
                            inputMode="decimal"
                            className="h-9 w-full border border-white/[.1] bg-[#081016] px-3 font-mono text-xs text-[#dce9e6] outline-none transition-colors placeholder:text-[#445b60] focus:border-[#8b7cff]/45"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col-reverse justify-between gap-3 border-t border-white/[.07] pt-5 sm:flex-row sm:items-center">
            <p className="text-[10px] text-[#647b80]">
              {Object.values(values).filter(Boolean).length} of 30 fields
              populated | partial submission supported
            </p>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex items-center justify-center gap-2 bg-[#8b7cff] px-4 py-2.5 text-xs font-extrabold text-[#07120f] transition-all hover:bg-[#b6adff] disabled:cursor-wait disabled:opacity-60"
            >
              {status === "submitting" ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Play size={14} fill="currentColor" />
              )}{" "}
              {status === "submitting" ? "Analyzing..." : "Run detection"}
            </button>
          </div>
        </div>
      </form>
      <div className="space-y-5">
        <section className="cb-panel cb-grid p-5">
          <SectionHeader eyebrow="Inference result" title="Detection outcome" />
          {status === "idle" && (
            <EmptyState
              title="Ready for a flow"
              description="Submit a network flow to see the actual prediction response from the configured API."
              icon={Zap}
            />
          )}
          {status === "submitting" && (
            <div className="space-y-4 py-8 text-center">
              <RefreshCw
                size={23}
                className="mx-auto animate-spin text-[#8b7cff]"
              />
              <p className="text-sm font-semibold text-[#d9e8e5]">
                Analyzing flow...
              </p>
              <p className="text-xs text-[#71868a]">
                Submitting flow to the production inference endpoint.
              </p>
            </div>
          )}
          {status === "error" && <DataError message={error} />}
          {status === "complete" && result && <ResultPanel result={result} />}
        </section>
        <section className="cb-panel p-5">
          <SectionHeader
            eyebrow="Production configuration"
            title="Inference contract"
          />
          <div className="space-y-3 text-xs">
            {[
              ["Endpoint", "/predict"],
              ["Model", result?.model ? String(result.model) : MODEL_INFO.name],
              [
                "Threshold",
                result?.threshold != null
                  ? String(result.threshold)
                  : String(MODEL_INFO.threshold),
              ],
              [
                "Feature count",
                result?.feature_count != null
                  ? String(result.feature_count)
                  : `${MODEL_INFO.featureCount} expected`,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-white/[.06] pb-3"
              >
                <span className="text-[#71868a]">{label}</span>
                <span className="font-mono text-[#c8d9d5]">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: PredictionResult }) {
  const probability =
    typeof result.attack_probability === "number"
      ? result.attack_probability
      : null;
  const prediction = String(result.prediction || "Unavailable").toUpperCase();
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#71868a]">
            Prediction
          </p>
          <p
            className={`text-4xl font-extrabold tracking-tight ${prediction === "ATTACK" ? "text-[#ff657a]" : "text-[#8b7cff]"}`}
          >
            {prediction}
          </p>
        </div>
        {result.risk_level && <RiskBadge risk={result.risk_level} />}
      </div>
      <div className="border border-white/[.08] bg-[#081016]/70 p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-[#71868a]">Attack probability</span>
          <span className="font-mono text-white">
            {probability == null
              ? "Unavailable"
              : `${(probability * 100).toFixed(2)}%`}
          </span>
        </div>
        <div className="h-2 overflow-hidden bg-white/[.08]">
          <div
            className="h-full bg-[#ff657a] transition-all"
            style={{
              width: `${Math.max(0, Math.min(100, (probability || 0) * 100))}%`,
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Threshold", result.threshold],
          ["Model version", result.model_version],
          ["Features", result.feature_count],
          [
            "Alert created",
            result.alert_created == null
              ? undefined
              : result.alert_created
                ? "Yes"
                : "No",
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border border-white/[.07] bg-white/[.02] p-3"
          >
            <p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#667e82]">
              {label}
            </p>
            <p className="mt-2 truncate font-mono text-xs text-[#d5e3df]">
              {value == null ? "Unavailable" : String(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AlertsPage() {
  const refresh = useRefreshSignal();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [risk, setRisk] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Alert | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .getAlerts()
      .then(data => {
        if (active) setAlerts(data);
      })
      .catch(requestError => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Alerts endpoint unavailable."
          );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [refresh]);
  const filtered = useMemo(() => {
    const searched = alerts
      .filter(alert => {
        const query = search.toLowerCase();
        return (
          !query ||
          [alert.id, alert.sourceIp, alert.destinationIp, alert.protocol].some(
            value => value?.toLowerCase().includes(query)
          )
        );
      })
      .filter(alert => risk === "ALL" || alert.risk === risk);
    return [...searched].sort((a, b) => {
      if (sort === "highest probability")
        return (b.probability || 0) - (a.probability || 0);
      if (sort === "highest risk") return riskScore(b.risk) - riskScore(a.risk);
      const left = new Date(a.timestamp || 0).getTime();
      const right = new Date(b.timestamp || 0).getTime();
      return sort === "oldest" ? left - right : right - left;
    });
  }, [alerts, risk, search, sort]);
  return (
    <div className="space-y-5">
      {selected && (
        <AlertDetail alert={selected} onClose={() => setSelected(null)} />
      )}
      <section className="cb-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[.08] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#647b80]"
            />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search alert ID, IP, or protocol..."
              className="h-10 w-full border border-white/[.1] bg-[#081016] pl-9 pr-3 text-xs text-[#dce9e6] outline-none placeholder:text-[#536b70] focus:border-[#8b7cff]/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(item => (
              <button
                key={item}
                onClick={() => setRisk(item)}
                className={`border px-3 py-2 font-mono text-[10px] tracking-[.1em] transition-colors ${risk === item ? "border-[#8b7cff]/35 bg-[#8b7cff]/10 text-[#d5d0ff]" : "border-white/[.08] text-[#71868a] hover:text-white"}`}
              >
                {item}
              </button>
            ))}
            <select
              value={sort}
              onChange={event => setSort(event.target.value)}
              className="h-9 border border-white/[.1] bg-[#081016] px-3 font-mono text-[10px] text-[#8ea5a2] outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest probability">Highest probability</option>
              <option value="highest risk">Highest risk</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/[.08] px-4 py-3 font-mono text-[9px] uppercase tracking-[.14em] text-[#647b80]">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff657a]" />
            Critical requires review
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8b7cff]" />
            Click any row to investigate
          </span>
          <span className="ml-auto">
            {alerts.length
              ? `${filtered.length} matching events`
              : "Live data pending"}
          </span>
        </div>
        <div className="p-5">
          <SectionHeader
            eyebrow="DynamoDB / GET /alerts"
            title="Alert inventory"
          />
          {error && <DataError message={error} />}
          {loading ? (
            <LoadingBar />
          ) : filtered.length ? (
            <AlertTable alerts={filtered} onSelect={setSelected} />
          ) : (
            <EmptyState
              title={
                alerts.length
                  ? "No matching alerts"
                  : "Live data connection pending"
              }
              description={
                alerts.length
                  ? "Try clearing the search or severity filter."
                  : "This table will populate from DynamoDB through the approved backend API."
              }
              icon={Bell}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function riskScore(risk?: RiskLevel) {
  return risk === "CRITICAL"
    ? 4
    : risk === "HIGH"
      ? 3
      : risk === "MEDIUM"
        ? 2
        : risk === "LOW"
          ? 1
          : 0;
}

function NetworkSurface({ analytics }: { analytics: DatasetAnalytics | null }) {
  const relationships = analytics?.topRelationships?.slice(0, 8) ?? [];

  return (
    <div className="network-surface relative min-h-[300px] overflow-hidden border border-[#5da8ff]/15 bg-[#09161d]">
      <div className="absolute inset-0 network-grid" />

      <div className="relative p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#8b7cff]">
              Historical endpoint relationships
            </p>
            <h3 className="mt-2 text-sm font-bold text-white">
              BigFlow-NIDS v2
            </h3>
          </div>
          <span className="border border-[#5da8ff]/20 bg-[#5da8ff]/[.06] px-3 py-2 font-mono text-[9px] uppercase tracking-[.12em] text-[#a6c9da]">
            Offline dataset
          </span>
        </div>

        {relationships.length ? (
          <div className="space-y-2">
            {relationships.map((item, index) => (
              <div
                key={`${item.sourceIp}:${item.sourcePort}-${item.destinationIp}:${item.destinationPort}-${index}`}
                className="grid gap-2 border border-white/[.07] bg-[#071117]/80 p-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase text-[#647b80]">
                    Source
                  </p>
                  <p className="mt-1 break-all font-mono text-[10px] text-[#c8d9d5]">
                    {item.sourceIp}:{item.sourcePort}
                  </p>
                </div>

                <ArrowRight
                  size={14}
                  className="hidden text-[#8b7cff] sm:block"
                />

                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase text-[#647b80]">
                    Destination
                  </p>
                  <p className="mt-1 break-all font-mono text-[10px] text-[#c8d9d5]">
                    {item.destinationIp}:{item.destinationPort}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="font-mono text-[9px] uppercase text-[#647b80]">
                    Flows
                  </p>
                  <p className="mt-1 font-mono text-xs font-semibold text-[#a9e7d4]">
                    {item.flows.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No relationship records available"
            description="Endpoint relationships will appear when the offline analytics endpoint returns records."
            icon={Network}
          />
        )}

        <p className="mt-4 text-[10px] leading-5 text-[#71888b]">
          Historical dataset records only. These endpoint pairs do not represent
          current live network connections.
        </p>

        {analytics?.relationshipNote && (
          <p className="mt-2 text-[10px] leading-5 text-[#71888b]">
            {analytics.relationshipNote}
          </p>
        )}
      </div>
    </div>
  );
}

export function NetworkPage() {
  const refresh = useRefreshSignal();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<DatasetAnalytics | null>(null);
  const [liveError, setLiveError] = useState("");
  const [datasetError, setDatasetError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setLiveError("");
    setDatasetError("");

    Promise.allSettled([api.getMetrics(), api.getDatasetAnalytics()]).then(
      ([metricsResult, analyticsResult]) => {
        if (!active) return;

        if (metricsResult.status === "fulfilled") {
          setMetrics(metricsResult.value);
        } else {
          setLiveError(
            metricsResult.reason instanceof Error
              ? metricsResult.reason.message
              : "Live metrics endpoint unavailable."
          );
        }

        if (analyticsResult.status === "fulfilled") {
          setAnalytics(analyticsResult.value);
        } else {
          setDatasetError(
            analyticsResult.reason instanceof Error
              ? analyticsResult.reason.message
              : "Offline dataset analytics endpoint unavailable."
          );
        }

        setLoading(false);
      }
    );

    return () => {
      active = false;
    };
  }, [refresh]);

  const protocolData = analytics?.protocolDistribution ?? [];

  const attackLabels = (analytics?.labelDistribution ?? [])
    .filter(item => item.name.toLowerCase() !== "benign")
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const monthlyFlowData = analytics?.flowVolumeByMonth ?? [];

  return (
    <div className="space-y-5">
      {liveError && <DataError message={liveError} />}

      {datasetError && (
        <DataError message={`Offline dataset analytics: ${datasetError}`} />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Live inferences"
          value={formatValue(metrics?.totalInferences)}
          detail="GET /metrics"
          icon={Network}
        />

        <MetricCard
          label="Live attacks"
          value={formatValue(metrics?.attacksDetected)}
          detail="GET /metrics"
          icon={ShieldAlert}
          accent="red"
        />

        <MetricCard
          label="Dataset rows"
          value={formatValue(analytics?.processedRows)}
          detail="BigFlow-NIDS v2"
          icon={Database}
        />

        <MetricCard
          label="Dataset protocols"
          value={formatValue(protocolData.length)}
          detail="Distinct protocol groups"
          icon={Wifi}
        />

        <MetricCard
          label="Historical months"
          value={formatValue(monthlyFlowData.length)}
          detail="Dataset timestamp coverage"
          icon={Activity}
        />
      </div>

      {loading && <LoadingBar />}

      <section className="cb-panel p-5">
        <SectionHeader
          eyebrow="Offline dataset / historical evidence"
          title="Network intelligence"
          action={
            <span className="font-mono text-[9px] uppercase tracking-[.15em] text-[#71888b]">
              {analytics?.dataset ?? "BigFlow-NIDS v2"}
            </span>
          }
        />

        {analytics && (
          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-[#71888b]">
            <span>
              Processed rows: {analytics.processedRows.toLocaleString()}
            </span>
            <span>
              Generated:{" "}
              {analytics.generatedAt
                ? new Date(analytics.generatedAt).toLocaleString()
                : "Not provided"}
            </span>
          </div>
        )}

        <NetworkSurface analytics={analytics} />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartFrame
          title="Historical flow volume"
          eyebrow="Offline dataset / monthly records"
          action={
            <span className="font-mono text-[9px] text-[#71888b]">
              SOURCE: DATASET ANALYTICS
            </span>
          }
        >
          {monthlyFlowData.length ? (
            <TrafficChart data={monthlyFlowData} />
          ) : (
            <EmptyState
              title="Historical flow data unavailable"
              description="Monthly flow counts will appear when /dataset-analytics returns data."
              icon={Activity}
            />
          )}
        </ChartFrame>

        <ChartFrame
          title="Protocol distribution"
          eyebrow="Offline dataset / protocol mix"
        >
          {protocolData.length ? (
            <DistributionBars data={protocolData} />
          ) : (
            <EmptyState
              title="Protocol statistics unavailable"
              description="Protocol counts will appear when /dataset-analytics returns data."
              icon={Wifi}
            />
          )}
        </ChartFrame>

        <ChartFrame
          title="Historical attack labels"
          eyebrow="Offline dataset / most frequent non-benign labels"
        >
          {attackLabels.length ? (
            <DistributionBars data={attackLabels} />
          ) : (
            <EmptyState
              title="Label distribution unavailable"
              description="Non-benign label counts will appear when the dataset analytics endpoint returns data."
              icon={ShieldAlert}
            />
          )}
        </ChartFrame>

        <ChartFrame
          title="Live AWS inference activity"
          eyebrow="Production telemetry / last 24 hours"
          action={
            <span className="font-mono text-[9px] text-[#71888b]">
              SOURCE: /METRICS
            </span>
          }
        >
          {metrics?.attackActivity?.length ? (
            <TrafficChart data={metrics.attackActivity} attack />
          ) : (
            <EmptyState
              title="Live activity series unavailable"
              description="This panel uses AWS inference metrics only. Historical dataset counts are not substituted for live telemetry."
              icon={ShieldAlert}
            />
          )}
        </ChartFrame>
      </div>
    </div>
  );
}

function TrafficChart({
  data,
  attack = false,
}: {
  data: Array<{ label: string; value?: number; attacks?: number }>;
  attack?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={235}>
      <AreaChart data={data}>
        <defs>
          <linearGradient
            id={attack ? "suspiciousGradient" : "flowGradient"}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={attack ? "#ff657a" : "#5da8ff"}
              stopOpacity={0.3}
            />
            <stop
              offset="100%"
              stopColor={attack ? "#ff657a" : "#5da8ff"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,179,181,.08)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#789095", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#789095", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip contentStyle={chartTooltipStyle} />
        <Area
          type="monotone"
          dataKey={attack ? "attacks" : "value"}
          stroke={attack ? "#ff657a" : "#5da8ff"}
          fill={`url(#${attack ? "suspiciousGradient" : "flowGradient"})`}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DistributionBars({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const max = Math.max(...data.map(entry => entry.value), 1);
  return (
    <div className="space-y-4 py-3">
      {data.map((entry, index) => (
        <div key={entry.name}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-[#a9b9b7]">{entry.name}</span>
            <span className="font-mono text-[#e7f2ef]">{entry.value}</span>
          </div>
          <div className="h-2 bg-white/[.06]">
            <div
              className="h-full"
              style={{
                width: `${(entry.value / max) * 100}%`,
                backgroundColor: severityColors[index % severityColors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModelPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
        <section className="cb-panel p-5">
          <SectionHeader
            eyebrow="Production registry"
            title="Model intelligence"
          />
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold leading-tight text-white">
                HistGradientBoosting
                <br />
                Classifier
              </h3>
              <p className="mt-2 text-xs text-[#789095]">
                Top-30 selected features
              </p>
            </div>
            <span className="border border-[#8b7cff]/25 bg-[#8b7cff]/10 px-2.5 py-1.5 font-mono text-[9px] tracking-[.12em] text-[#b8adff]">
              {MODEL_INFO.productionStatus.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-px border border-white/[.08] bg-white/[.08]">
            {[
              ["Version", MODEL_INFO.version],
              ["Features", MODEL_INFO.featureCount],
              ["Threshold", MODEL_INFO.threshold],
              ["Training", MODEL_INFO.trainingStatus],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#0d1b22] p-3">
                <p className="font-mono text-[9px] uppercase tracking-[.13em] text-[#667e82]">
                  {label}
                </p>
                <p className="mt-2 font-mono text-sm text-[#d6e5e1]">{value}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="cb-panel p-5">
          <SectionHeader
            eyebrow="Offline evaluation"
            title="Detection performance"
            action={
              <span className="font-mono text-[9px] uppercase tracking-[.13em] text-[#71888b]">
                VERIFIED METRICS
              </span>
            }
          />
          <div className="grid gap-px border border-white/[.08] bg-white/[.08] sm:grid-cols-4">
            {[
              { label: "Accuracy", value: MODEL_INFO.accuracy },
              ...MODEL_INFO.metrics,
            ].map(metric => (
              <div key={metric.label} className="bg-[#0d1b22] p-4">
                <p className="text-xs text-[#789095]">{metric.label}</p>
                <p className="mt-3 font-mono text-xl text-white">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SmallStat
              label="P95 inference latency"
              value={MODEL_INFO.p95Latency}
            />
            <SmallStat
              label="Local benchmark throughput"
              value={MODEL_INFO.throughput}
            />
          </div>
          <div className="mt-5 flex items-start gap-3 border border-[#5da8ff]/15 bg-[#5da8ff]/[.05] p-4 text-xs leading-5 text-[#9cc9e8]">
            <CircleHelp size={15} className="mt-0.5 shrink-0" />
            These are model evaluation and benchmark values. They are not live
            production telemetry.
          </div>
        </section>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="cb-panel p-5">
          <SectionHeader
            eyebrow="Explainability"
            title="Top-30 feature importance"
            action={
              <span className="font-mono text-[10px] text-[#71888b]">
                RELATIVE SIGNAL
              </span>
            }
          />
          <div className="grid gap-x-10 gap-y-4 md:grid-cols-2">
            {MODEL_INFO.features.map((feature, index) => (
              <div key={feature.name} className="group">
                <div className="mb-1.5 flex items-center justify-between gap-4">
                  <span className="flex min-w-0 items-center gap-2 font-mono text-[10px] text-[#b4c5c1]">
                    <span className="text-[#526b70]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{feature.name}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#719494]">
                    {feature.importance}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden bg-white/[.06]">
                  <div
                    className="h-full bg-gradient-to-r from-[#8b7cff] to-[#514bc6] transition-all duration-500 group-hover:from-[#b6adff]"
                    style={{ width: `${feature.importance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="cb-panel p-5">
          <SectionHeader
            eyebrow="Classification view"
            title="Confusion matrix"
            action={
              <span className="font-mono text-[9px] text-[#71888b]">
                EVALUATION SET
              </span>
            }
          />
          <div className="grid grid-cols-[54px_1fr_1fr] gap-px border border-white/[.08] bg-white/[.08] text-center font-mono text-[10px]">
            <div className="bg-[#0d1b22]" />
            <div className="bg-[#0d1b22] p-3 text-[#8b7cff]">Pred. benign</div>
            <div className="bg-[#0d1b22] p-3 text-[#ff657a]">Pred. attack</div>
            <div className="bg-[#0d1b22] p-3 text-[#789095]">Actual benign</div>
            <div className="flex min-h-20 items-center justify-center bg-[#8b7cff]/10 text-[#8b7cff]">
              Not exposed
            </div>
            <div className="flex min-h-20 items-center justify-center bg-[#ff657a]/[.07] text-[#ff657a]">
              Not exposed
            </div>
            <div className="bg-[#0d1b22] p-3 text-[#789095]">Actual attack</div>
            <div className="flex min-h-20 items-center justify-center bg-[#ff657a]/[.07] text-[#ff657a]">
              Not exposed
            </div>
            <div className="flex min-h-20 items-center justify-center bg-[#8b7cff]/10 text-[#8b7cff]">
              Not exposed
            </div>
          </div>
          <p className="mt-4 text-[10px] leading-5 text-[#71888b]">
            The confusion matrix remains unpopulated because the backend has not
            exposed evaluation-set counts to this frontend.
          </p>
        </section>
      </div>
    </div>
  );
}

export function MlopsPage() {
  const stages = [
    "Data",
    "Training",
    "Validation",
    "Candidate model",
    "Evaluation",
    "Promotion / rejection",
    "Production",
    "Monitoring",
    "Drift detection",
    "Retraining",
  ];
  return (
    <div className="space-y-5">
      <section className="cb-panel p-5">
        <SectionHeader
          eyebrow="Lifecycle governance"
          title="Model lifecycle"
          action={
            <span className="font-mono text-[9px] uppercase tracking-[.15em] text-[#71888b]">
              Evidence before promotion
            </span>
          }
        />
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[900px] items-center gap-2">
            {stages.map((stage, index) => (
              <div key={stage} className="flex items-center gap-2">
                <div
                  className={`w-[118px] border p-3 ${stage === "Production" ? "border-[#8b7cff]/30 bg-[#8b7cff]/[.08]" : stage === "Candidate model" ? "border-[#5da8ff]/25 bg-[#5da8ff]/[.06]" : "border-white/[.08] bg-white/[.02]"}`}
                >
                  <p className="mb-2 font-mono text-[9px] text-[#5e777c]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] font-semibold leading-4 text-[#cbdad6]">
                    {stage}
                  </p>
                </div>
                {index < stages.length - 1 && (
                  <ArrowDownRight
                    size={15}
                    className="shrink-0 text-[#5f777c]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
        <section className="cb-panel p-5">
          <SectionHeader eyebrow="Production registry" title="Current model" />
          <div className="border border-[#8b7cff]/20 bg-[#8b7cff]/[.04] p-4">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center border border-[#8b7cff]/20 bg-[#8b7cff]/10 text-[#8b7cff]">
                <GitBranch size={19} />
              </div>
              <span className="font-mono text-[9px] tracking-[.14em] text-[#b8adff]">
                PRODUCTION
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">{MODEL_INFO.name}</h3>
            <p className="mt-1 font-mono text-xs text-[#789095]">
              v{MODEL_INFO.version}
            </p>
          </div>
          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between border-b border-white/[.06] pb-3">
              <span className="text-[#71888b]">Threshold</span>
              <span className="font-mono text-[#d4e1df]">
                {MODEL_INFO.threshold}
              </span>
            </div>
            <div className="flex justify-between border-b border-white/[.06] pb-3">
              <span className="text-[#71888b]">Promotion status</span>
              <span className="font-mono text-[#b8adff]">Approved</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#71888b]">Retraining</span>
              <span className="font-mono text-[#b4c1c1]">
                Evidence required
              </span>
            </div>
          </div>
        </section>
        <section className="cb-panel p-5">
          <SectionHeader eyebrow="Candidate decision" title="Release gate" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-[#5da8ff]/20 bg-[#5da8ff]/[.05] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[.15em] text-[#78aeca]">
                Candidate model
              </p>
              <p className="mt-4 text-lg font-semibold text-[#e2eef0]">
                No candidate payload
              </p>
              <p className="mt-2 text-xs leading-5 text-[#7c9398]">
                A pending candidate is not asserted until the backend exposes
                evaluation evidence.
              </p>
            </div>
            <div className="border border-[#e7b35b]/20 bg-[#e7b35b]/[.05] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[.15em] text-[#cda86a]">
                Decision
              </p>
              <p className="mt-4 text-lg font-semibold text-[#e6c98f]">
                Promotion gate idle
              </p>
              <p className="mt-2 text-xs leading-5 text-[#9d8963]">
                Production remains on the verified classifier.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-3 border-t border-white/[.08] pt-5 text-xs leading-5 text-[#85999b]">
            <CircleHelp size={15} className="mt-0.5 shrink-0 text-[#8b7cff]" />
            MLOps is represented as a governed lifecycle, not a claim of
            continuous learning from arbitrary real-world traffic.
          </div>
        </section>
      </div>
    </div>
  );
}

export function MonitoringPage() {
  const refresh = useRefreshSignal();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [health, setHealth] = useState<HealthCheck[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.allSettled([api.getMetrics(), api.getHealth()]).then(
      ([metricResult, healthResult]) => {
        if (!active) return;
        if (metricResult.status === "fulfilled") setMetrics(metricResult.value);
        if (healthResult.status === "fulfilled") setHealth(healthResult.value);
        const failed = [metricResult, healthResult].find(
          result => result.status === "rejected"
        );
        if (failed?.status === "rejected")
          setError(failed.reason?.message || "Monitoring data unavailable.");
      }
    );
    return () => {
      active = false;
    };
  }, [refresh]);
  const errors = metrics?.inferenceErrors;
  return (
    <div className="space-y-5">
      {error && <DataError message={error} />}
      <section className="cb-panel p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[.22em] text-[#8b7cff]">
              AWS observability / CloudWatch boundary
            </p>
            <h2 className="text-xl font-bold text-white">
              Platform monitoring
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-[#81969a]">
              Counters below reflect only the approved metrics and health
              endpoints. A zero counter means no value was reported for this
              metric window; it does not establish that the environment is
              threat-free.
            </p>
          </div>
          <PlatformMark />
        </div>
        <div className="mt-6">
          <StatusStrip health={health} />
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Inference count"
          value={formatValue(metrics?.totalInferences)}
          icon={Gauge}
        />
        <MetricCard
          label="Attack count"
          value={formatValue(metrics?.attacksDetected)}
          icon={ShieldAlert}
          accent="red"
        />
        <MetricCard
          label="Benign count"
          value={formatValue(metrics?.benignTraffic)}
          icon={CheckCircle2}
          accent="blue"
        />
        <MetricCard
          label="Critical alerts"
          value={formatValue(metrics?.criticalAlerts)}
          icon={TriangleAlert}
          accent="amber"
        />
        <MetricCard
          label="Inference errors"
          value={formatValue(errors)}
          icon={AlertCircle}
          accent={errors ? "red" : "amber"}
        />
        <MetricCard
          label="CloudWatch check"
          value={
            health.find(item => item.name === "CloudWatch")?.state === "healthy"
              ? "Healthy"
              : "Unavailable"
          }
          detail="GET /health"
          icon={Cloud}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <ChartFrame title="Inference volume" eyebrow="Operational counters">
          {metrics?.attackActivity?.length ? (
            <TrafficChart data={metrics.attackActivity} />
          ) : (
            <EmptyState
              title="Inference series pending"
              description="CloudWatch-aligned volume will render when GET /metrics returns a time series."
              icon={BarChart3}
            />
          )}
        </ChartFrame>
        <section className="cb-panel p-5">
          <SectionHeader
            eyebrow="Boundary contracts"
            title="Observed service state"
          />
          <div className="space-y-1">
            {(health.length ? health : fallbackHealth).map(item => (
              <div
                key={item.name}
                className="flex items-center gap-3 border-b border-white/[.06] py-3"
              >
                <StatusDot state={item.state} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#d9e8e5]">
                    {item.name}
                  </p>
                  <p className="truncate text-[10px] text-[#71888b]">
                    {item.detail || "No detail returned"}
                  </p>
                </div>
                <StatusBadge state={item.state} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [logLevel, setLogLevel] = useState("standard");
  const [strictMode, setStrictMode] = useState(true);
  const apiBase =
    api.baseUrl || "Unavailable (VITE_API_BASE_URL is not configured)";
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <section className="cb-panel p-5">
          <SectionHeader
            eyebrow="Control plane / read-only boundary"
            title="API configuration"
          />
          <div className="space-y-4">
            <ConfigRow label="Base URL" value={apiBase} mono />
            <ConfigRow label="Prediction endpoint" value="POST /predict" mono />
            <ConfigRow label="Alerts endpoint" value="GET /alerts" mono />
            <ConfigRow label="Metrics endpoint" value="GET /metrics" mono />
            <ConfigRow label="Health endpoint" value="GET /health" mono />
          </div>
          <div className="mt-5 flex items-start gap-3 border border-[#5da8ff]/15 bg-[#5da8ff]/[.05] p-4 text-xs leading-5 text-[#9cc9e8]">
            <Code2 size={15} className="mt-0.5 shrink-0" />
            Set{" "}
            <span className="font-mono text-[#c7e4ef]">
              VITE_API_BASE_URL
            </span>{" "}
            in the frontend environment. AWS credentials and service secrets
            never belong in this client.
          </div>
        </section>
        <section className="cb-panel p-5">
          <SectionHeader
            eyebrow="Model configuration"
            title="Detection policy"
          />
          <div className="space-y-4">
            <ConfigRow label="Model" value="HistGradientBoostingClassifier" />
            <ConfigRow label="Version" value={MODEL_INFO.version} mono />
            <ConfigRow
              label="Selected features"
              value={`Top ${MODEL_INFO.featureCount}`}
              mono
            />
            <ConfigRow
              label="Production threshold"
              value={String(MODEL_INFO.threshold)}
              mono
            />
            <ConfigRow label="Environment" value="Production boundary" />
          </div>
          <div className="mt-5 border-t border-white/[.08] pt-5">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[.16em] text-[#71888b]">
              Operator preferences
            </p>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-4 text-xs text-[#b8c8c5]">
                <span>Strict API state labeling</span>
                <input
                  type="checkbox"
                  checked={strictMode}
                  onChange={event => setStrictMode(event.target.checked)}
                  className="h-4 w-4 accent-[#8b7cff]"
                />
              </label>
              <label className="flex items-center justify-between gap-4 text-xs text-[#b8c8c5]">
                <span>Client log level</span>
                <select
                  value={logLevel}
                  onChange={event => setLogLevel(event.target.value)}
                  className="border border-white/[.1] bg-[#081016] px-3 py-2 font-mono text-[10px] text-[#c9d6d4] outline-none"
                >
                  <option value="quiet">Quiet</option>
                  <option value="standard">Standard</option>
                  <option value="verbose">Verbose</option>
                </select>
              </label>
            </div>
          </div>
        </section>
      </div>
      <section className="cb-panel p-5">
        <SectionHeader eyebrow="Security posture" title="System information" />
        <div className="grid gap-px border border-white/[.08] bg-white/[.08] sm:grid-cols-2 lg:grid-cols-4">
          <InfoBlock
            icon={ShieldAlert}
            label="Frontend boundary"
            value="API only"
          />
          <InfoBlock icon={ServerCog} label="Compute" value="AWS Lambda" />
          <InfoBlock icon={Database} label="Data store" value="DynamoDB" />
          <InfoBlock icon={Terminal} label="Observability" value="CloudWatch" />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.08] pt-5">
          <p className="text-xs text-[#71888b]">
            Settings are local interface preferences; model and infrastructure
            configuration remain backend-owned.
          </p>
          <button
            onClick={() => toast.success("Operator preferences saved locally")}
            className="border border-[#8b7cff]/25 bg-[#8b7cff]/[.06] px-4 py-2 text-xs font-semibold text-[#a9e7d4] transition-colors hover:bg-[#8b7cff]/[.12]"
          >
            Save preferences
          </button>
        </div>
      </section>
    </div>
  );
}

function ConfigRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/[.06] pb-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-[#71888b]">{label}</span>
      <span
        className={`break-all text-xs text-[#d5e3df] ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#0d1b22] p-4">
      <Icon size={16} className="mb-4 text-[#8b7cff]" />
      <p className="font-mono text-[9px] uppercase tracking-[.13em] text-[#667e82]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#d9e8e5]">{value}</p>
    </div>
  );
}
