import { Link, useLocation } from "wouter";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleGauge,
  Cloud,
  LayoutDashboard,
  Menu,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import type { HealthState, RiskLevel } from "@/types";

export const navItems = [
  {
    href: "/",
    label: "Command center",
    meta: "Overview",
    icon: LayoutDashboard,
    group: "Operations",
  },
  {
    href: "/detection",
    label: "Threat detection",
    meta: "Inference",
    icon: Zap,
    group: "Operations",
  },
  {
    href: "/alerts",
    label: "Alerts / SOC",
    meta: "Triage",
    icon: Bell,
    group: "Operations",
  },
  {
    href: "/network",
    label: "Network activity",
    meta: "Telemetry",
    icon: Network,
    group: "Operations",
  },
  {
    href: "/model",
    label: "ML model",
    meta: "Intelligence",
    icon: BrainCircuit,
    group: "Intelligence",
  },
  {
    href: "/mlops",
    label: "MLOps",
    meta: "Lifecycle",
    icon: SlidersHorizontal,
    group: "Intelligence",
  },
  {
    href: "/monitoring",
    label: "Monitoring",
    meta: "CloudWatch",
    icon: Activity,
    group: "Platform",
  },
  {
    href: "/settings",
    label: "Settings",
    meta: "Control plane",
    icon: Settings,
    group: "Platform",
  },
];

const titleMap: Record<
  string,
  { eyebrow: string; title: string; description: string }
> = {
  "/": {
    eyebrow: "Security operations / overview",
    title: "Command center",
    description:
      "A measured operational picture across network telemetry, detection, and the production boundary.",
  },
  "/detection": {
    eyebrow: "Inference workspace / live contract",
    title: "Threat detection",
    description:
      "Submit a network flow to the Cloud’s Bane inference engine without exposing infrastructure credentials.",
  },
  "/alerts": {
    eyebrow: "Security operations / triage",
    title: "Alerts / SOC",
    description:
      "Prioritize, investigate, and track events returned by the production data plane.",
  },
  "/network": {
    eyebrow: "Telemetry / relationships",
    title: "Network activity",
    description:
      "Read flow volume and network relationships without inventing traffic that the API has not returned.",
  },
  "/model": {
    eyebrow: "ML intelligence / production",
    title: "ML model",
    description:
      "Model performance, thresholding, and feature signal for the production classifier.",
  },
  "/mlops": {
    eyebrow: "Lifecycle / governance",
    title: "MLOps",
    description:
      "Move candidates through evidence-based evaluation and release control.",
  },
  "/monitoring": {
    eyebrow: "Observability / AWS",
    title: "Monitoring",
    description: "CloudWatch-aligned counters, alarms, and system health.",
  },
  "/settings": {
    eyebrow: "Control plane / configuration",
    title: "Settings",
    description:
      "Application configuration without exposing infrastructure credentials.",
  },
};

const stateColors: Record<HealthState, string> = {
  healthy: "#66d6a8",
  degraded: "#e7b35b",
  error: "#ff657a",
  unknown: "#72848a",
};

export function StatusDot({ state = "unknown" }: { state?: HealthState }) {
  const color = stateColors[state];
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span
        className="absolute inset-0 animate-ping rounded-full opacity-35"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

export function RiskBadge({ risk }: { risk?: RiskLevel | string }) {
  const normalized = risk?.toUpperCase();
  const styles: Record<string, string> = {
    LOW: "border-[#6fcdb4]/25 bg-[#6fcdb4]/10 text-[#8de2c9]",
    MEDIUM: "border-[#e7b35b]/25 bg-[#e7b35b]/10 text-[#f0c985]",
    HIGH: "border-[#e89161]/30 bg-[#e89161]/10 text-[#f2ac83]",
    CRITICAL: "border-[#ff657a]/35 bg-[#ff657a]/10 text-[#ff8da0]",
  };
  if (!normalized)
    return <span className="font-mono text-[10px] text-[#71858a]">—</span>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] font-medium tracking-[.16em] ${styles[normalized] || "border-white/10 bg-white/5 text-[#a8b7bb]"}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized}
    </span>
  );
}

export function StatusBadge({
  state,
  label,
}: {
  state: HealthState;
  label?: string;
}) {
  const text =
    label ||
    {
      healthy: "HEALTHY",
      degraded: "DEGRADED",
      error: "ERROR",
      unknown: "UNKNOWN",
    }[state];
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[.16em] text-[#a5b6b9]">
      <StatusDot state={state} />
      {text}
    </span>
  );
}

export function EmptyState({
  title = "Awaiting live data",
  description = "Connect the approved API endpoint to populate this view with production data.",
  icon: Icon = Activity,
}: {
  title?: string;
  description?: string;
  icon?: typeof Activity;
}) {
  return (
    <div className="cb-empty flex min-h-[190px] flex-col items-center justify-center border border-dashed border-[#8b7cff]/15 px-6 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center border border-[#8b7cff]/15 bg-[#8b7cff]/5 text-[#8b7cff]">
        <Icon size={17} />
      </div>
      <p className="mb-1 text-sm font-semibold text-[#d8e7e5]">{title}</p>
      <p className="max-w-sm text-xs leading-5 text-[#74878b]">{description}</p>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 font-mono text-[9px] uppercase tracking-[.24em] text-[#8b7cff]/75">
          {eyebrow || "Overview"}
        </p>
        <h2 className="text-[15px] font-semibold tracking-[-.01em] text-[#f2f7f5]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = "teal",
}: {
  label: string;
  value?: string | number;
  detail?: string;
  icon: typeof Activity;
  accent?: "teal" | "red" | "amber" | "blue";
}) {
  const accents = {
    teal: "#8b7cff",
    red: "#ff657a",
    amber: "#e7b35b",
    blue: "#5da8ff",
  };
  const color = accents[accent];
  const empty = value == null || value === "—";
  return (
    <div className="cb-panel cb-panel-hover relative overflow-hidden p-4">
      <div
        className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[.06] blur-2xl"
        style={{ backgroundColor: color }}
      />
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[.17em] text-[#9696b7]">
          {label}
        </span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl border"
          style={{
            color,
            borderColor: color + "44",
            backgroundColor: color + "12",
          }}
        >
          <Icon size={14} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="block font-mono text-[21px] font-medium tracking-[-.04em] text-[#f6f5ff]">
            {empty ? "—" : value}
          </span>
          {empty && (
            <span className="mt-1 block text-[9px] text-[#77799b]">
              Awaiting telemetry
            </span>
          )}
        </div>
        {detail && (
          <span className="pb-0.5 text-[9px] text-[#8a8bab]">{detail}</span>
        )}
      </div>
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="cb-brand-mark relative flex h-9 w-9 shrink-0 items-center justify-center border border-[#8b7cff]/30 bg-[#8b7cff]/10 text-[#8b7cff]">
        <Shield size={17} strokeWidth={1.7} />
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#8b7cff] shadow-[0_0_9px_#8b7cff]" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-[.28em] text-[#8b7cff]/75">
            NIDS · ML · SECURITY
          </div>
          <div className="truncate text-[14px] font-extrabold tracking-[-.02em] text-white">
            Cloud’s Bane
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse: () => void;
}) {
  const [location] = useLocation();
  let currentGroup = "";
  return (
    <aside
      className={`hidden shrink-0 border-r border-white/[.07] bg-[#070a16]/58 backdrop-blur-2xl shadow-[14px_0_45px_rgba(0,0,0,.18)] transition-[width] duration-200 lg:flex lg:flex-col ${collapsed ? "w-[78px]" : "w-[250px]"}`}
    >
      <div
        className={`flex h-[78px] items-center border-b border-white/[.07] ${collapsed ? "justify-center" : "px-5"}`}
      >
        <BrandMark compact={collapsed} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5 cb-scrollbar">
        {navItems.map(item => {
          const active = location === item.href;
          const Icon = item.icon;
          const showGroup = item.group !== currentGroup;
          currentGroup = item.group;
          return (
            <div key={item.href}>
              {showGroup && (
                <p
                  className={`mb-2 mt-2 px-3 font-mono text-[9px] uppercase tracking-[.24em] text-[#52696e] ${collapsed ? "text-center" : ""}`}
                >
                  {collapsed ? "·" : item.group}
                </p>
              )}
              <Link href={item.href}>
                <span
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center gap-3 border px-3 py-2.5 text-[11px] font-semibold transition-all ${active ? "border-[#8b7cff]/20 bg-[#8b7cff]/[.09] text-[#f1efff] shadow-[inset_2px_0_0_#8b7cff]" : "border-transparent text-[#819498] hover:bg-white/[.035] hover:text-[#dce8e6]"} ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <Icon size={15} strokeWidth={active ? 2 : 1.7} />
                  <span className={collapsed ? "sr-only" : ""}>
                    {item.label}
                  </span>
                  {active && !collapsed && (
                    <ChevronRight
                      size={13}
                      className="ml-auto text-[#8b7cff]"
                    />
                  )}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
      <div
        className={`border-t border-white/[.07] p-3 ${collapsed ? "px-2" : "p-4"}`}
      >
        <div
          className={`border border-[#8b7cff]/10 bg-[#8b7cff]/[.035] ${collapsed ? "p-2" : "p-3"}`}
        >
          <div
            className={`mb-3 flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}
          >
            <StatusDot state="unknown" />
            <span
              className={
                collapsed
                  ? "sr-only"
                  : "font-mono text-[9px] tracking-[.17em] text-[#8b7cff]"
              }
            >
              STATUS VIA MONITORING
            </span>
          </div>
          {!collapsed && (
            <p className="text-[10px] leading-4 text-[#789095]">
              Open Monitoring to view health returned by the API.
            </p>
          )}
        </div>
        <button
          onClick={onCollapse}
          className="mt-3 hidden w-full items-center justify-center gap-2 border border-white/[.07] py-2 text-[#6f858a] transition-colors hover:bg-white/[.04] hover:text-white lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} />
          ) : (
            <>
              <PanelLeftClose size={15} />
              <span className="text-[10px]">Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close navigation"
      />
      <aside className="relative flex h-full w-[286px] flex-col border-r border-white/10 bg-[#080a17]/78 backdrop-blur-2xl shadow-2xl">
        <div className="flex h-[78px] items-center justify-between border-b border-white/[.07] px-5">
          <BrandMark />
          <button
            onClick={onClose}
            className="text-[#809397] hover:text-white"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <span
                  className={`flex items-center gap-3 border px-3 py-3 text-sm ${active ? "border-[#8b7cff]/20 bg-[#8b7cff]/10 text-[#d8fff3]" : "border-transparent text-[#809397]"}`}
                >
                  <Icon size={16} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}

export function CloudLayout({
  children,
  onRefresh,
  refreshing,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const [location] = useLocation();
  useEffect(() => {
    const moveGlassLight = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const panel = target?.closest<HTMLElement>(".cb-panel");
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty(
        "--mouse-x",
        String(((event.clientX - rect.left) / rect.width) * 100) + "%"
      );
      panel.style.setProperty(
        "--mouse-y",
        String(((event.clientY - rect.top) / rect.height) * 100) + "%"
      );
    };
    document.addEventListener("pointermove", moveGlassLight, { passive: true });
    return () => document.removeEventListener("pointermove", moveGlassLight);
  }, []);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = titleMap[location] || titleMap["/"];
  return (
    <div className="flex min-h-screen bg-transparent text-[#e7f0ee]">
      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(value => !value)}
      />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#070a16]/42 px-4 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,.12)] sm:px-6 lg:px-8">
          <div className="flex min-h-[78px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center border border-white/10 text-[#91a6a4] lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={17} />
              </button>
              <div className="min-w-0">
                <p className="hidden font-mono text-[9px] uppercase tracking-[.22em] text-[#8b7cff]/70 sm:block">
                  {meta.eyebrow}
                </p>
                <h1 className="truncate text-[18px] font-bold tracking-[-.025em] text-white sm:text-xl">
                  {meta.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden items-center gap-2 border border-[#8b7cff]/15 bg-[#8b7cff]/[.05] px-3 py-1.5 lg:flex">
                <Search size={13} className="text-[#9e96ff]" />
                <input
                  aria-label="Search workspace"
                  placeholder="Search workspace"
                  className="w-28 bg-transparent font-mono text-[9px] text-[#dcd9ff] outline-none placeholder:text-[#6f7197]"
                />
              </div>
              <div className="hidden items-center gap-2 border border-[#8b7cff]/15 bg-[#8b7cff]/[.05] px-3 py-1.5 md:flex">
                <StatusDot state="unknown" />
                <span className="font-mono text-[9px] tracking-[.15em] text-[#a4d9ca]">
                  API BOUNDARY
                </span>
              </div>
              <button
                aria-label="View notifications"
                className="relative flex h-9 w-9 items-center justify-center border border-white/10 text-[#91a6a4] transition-colors hover:border-[#8b7cff]/30 hover:text-[#b6adff]"
              >
                <Bell size={15} />
              </button>
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="flex h-9 w-9 items-center justify-center border border-white/10 text-[#91a6a4] transition-colors hover:border-[#8b7cff]/30 hover:text-[#8b7cff] disabled:opacity-50"
                aria-label="Refresh data"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
              <div className="flex items-center gap-2 border-l border-white/[.09] pl-2 sm:pl-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#8b7cff]/20 bg-[#8b7cff]/10 font-mono text-xs font-medium text-[#8b7cff]">
                  CB
                </div>
                <div className="hidden sm:block">
                  <p className="text-[11px] font-semibold text-[#dce8e5]">
                    Security operator
                  </p>
                  <p className="font-mono text-[9px] text-[#6e8584]">
                    API CLIENT
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1660px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="hidden">{meta.description}</div>
          {children}
        </div>
        <footer className="border-t border-white/[.06] px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1660px] items-center justify-between font-mono text-[9px] uppercase tracking-[.16em] text-[#536b70]">
            <span>CB / NIDS / MLOPS</span>
            <span className="hidden sm:inline">
              Approved API boundary · No credentials in frontend
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export function PlatformMark() {
  return (
    <div className="flex items-center gap-2 text-[#8b7cff]">
      <CircleGauge size={14} />
      <span className="font-mono text-[9px] tracking-[.18em]">
        CB CONTROL PLANE
      </span>
    </div>
  );
}

export { Cloud };
