"use client";

import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  BookOpen,
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Database,
  DollarSign,
  Eye,
  Filter,
  Flame,
  Gauge,
  Globe2,
  Home,
  Lightbulb,
  Megaphone,
  MousePointer2,
  RefreshCw,
  Rocket,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { generateActions } from "@/lib/actionEngine";
import { detectRootCauses } from "@/lib/crossMetricEngine";
import { buildDecisionFeed } from "@/lib/decisionEngine";
import { prioritizeSignals } from "@/lib/priorityEngine";
import { evaluateRelationships } from "@/lib/relationshipEngine";
import { evaluateScaling } from "@/lib/scalingEngine";

type Platform = "All" | "Meta" | "Google" | "TikTok" | "Snap";
type DateRange = "Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "MTD" | "QTD" | "Last 90 Days" | "Custom";

type PlatformRow = {
  platform: Exclude<Platform, "All">;
  spend: number;
  prevSpend: number;
  storeSales: number;
  prevStoreSales: number;
  attributedRevenue: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  cpa: number;
  roas: number;
  mer: number;
  benchmarkMer: number;
  benchmarkCpa: number;
  benchmarkCtr: number;
  recommendation: string;
  scaleSignal: "Scale" | "Hold" | "Reduce" | "Fix";
};

type CampaignRow = {
  platform: Exclude<Platform, "All">;
  campaign: string;
  type: "Prospecting" | "Retargeting" | "Brand" | "Creative Test";
  spend: number;
  storeSales: number;
  orders: number;
  ctr: number;
  cpa: number;
  mer: number;
  frequency: number;
  status: "Scale" | "Stable" | "Watch" | "Fix";
  nextAction: string;
};

const client = "Unresolved Crime";
const ranges: DateRange[] = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "MTD", "QTD", "Last 90 Days", "Custom"];
const platforms: Platform[] = ["All", "Meta", "Google", "TikTok", "Snap"];

const platformRows: PlatformRow[] = [
  {
    platform: "Meta",
    spend: 45620,
    prevSpend: 42960,
    storeSales: 166400,
    prevStoreSales: 141800,
    attributedRevenue: 156532,
    impressions: 3240000,
    reach: 1180000,
    clicks: 71240,
    ctr: 2.2,
    cpc: 0.64,
    cpm: 14.08,
    frequency: 2.74,
    cpa: 34.4,
    roas: 3.43,
    mer: 3.65,
    benchmarkMer: 3.25,
    benchmarkCpa: 40,
    benchmarkCtr: 1.8,
    recommendation: "Scale winning prospecting campaigns by 12–15% while watching MER.",
    scaleSignal: "Scale",
  },
  {
    platform: "Google",
    spend: 28430,
    prevSpend: 32480,
    storeSales: 72600,
    prevStoreSales: 86600,
    attributedRevenue: 78996,
    impressions: 920000,
    reach: 0,
    clicks: 42180,
    ctr: 4.59,
    cpc: 0.67,
    cpm: 30.9,
    frequency: 0,
    cpa: 44.9,
    roas: 2.78,
    mer: 2.55,
    benchmarkMer: 3.0,
    benchmarkCpa: 38,
    benchmarkCtr: 5.2,
    recommendation: "Audit Search terms, brand overlap, and weak campaigns before scaling.",
    scaleSignal: "Fix",
  },
  {
    platform: "TikTok",
    spend: 18770,
    prevSpend: 16210,
    storeSales: 59300,
    prevStoreSales: 51900,
    attributedRevenue: 61430,
    impressions: 2110000,
    reach: 980000,
    clicks: 36520,
    ctr: 1.73,
    cpc: 0.51,
    cpm: 8.9,
    frequency: 2.15,
    cpa: 52.11,
    roas: 3.27,
    mer: 3.16,
    benchmarkMer: 3.05,
    benchmarkCpa: 42,
    benchmarkCtr: 1.6,
    recommendation: "Hold spend. Creative cost is rising; test new hooks before scaling.",
    scaleSignal: "Hold",
  },
  {
    platform: "Snap",
    spend: 9610,
    prevSpend: 9960,
    storeSales: 26200,
    prevStoreSales: 20637,
    attributedRevenue: 23256,
    impressions: 1180000,
    reach: 640000,
    clicks: 15430,
    ctr: 1.31,
    cpc: 0.62,
    cpm: 8.14,
    frequency: 1.84,
    cpa: 33.21,
    roas: 2.42,
    mer: 2.73,
    benchmarkMer: 2.25,
    benchmarkCpa: 36,
    benchmarkCtr: 1.2,
    recommendation: "Keep stable. Use as support channel, not primary scale source.",
    scaleSignal: "Hold",
  },
];

const storeTruth = {
  storeSales: 348214,
  prevStoreSales: 300937,
  orders: 2642,
  prevOrders: 2352,
  sessions: 85247,
  prevSessions: 80220,
  productViews: 24690,
  prevProductViews: 23880,
  addToCart: 8642,
  prevAddToCart: 9204,
  checkoutStarted: 4521,
  prevCheckoutStarted: 4815,
  purchases: 2642,
  prevPurchases: 2352,
  aov: 131.76,
  prevAov: 127.8,
  shipping: 18420,
  vat: 13220,
  refunds: 4210,
};

const trend = [
  { day: "Mon", spend: 12800, storeSales: 38200, mer: 2.98, orders: 312, cpa: 41 },
  { day: "Tue", spend: 13600, storeSales: 42100, mer: 3.1, orders: 336, cpa: 40 },
  { day: "Wed", spend: 15100, storeSales: 51800, mer: 3.43, orders: 402, cpa: 37 },
  { day: "Thu", spend: 14800, storeSales: 49300, mer: 3.33, orders: 374, cpa: 39 },
  { day: "Fri", spend: 17100, storeSales: 62200, mer: 3.64, orders: 468, cpa: 36 },
  { day: "Sat", spend: 17700, storeSales: 67900, mer: 3.84, orders: 512, cpa: 34 },
  { day: "Sun", spend: 17320, storeSales: 56714, mer: 3.27, orders: 238, cpa: 73 },
];

const campaigns: CampaignRow[] = [
  { platform: "Meta", campaign: "Prospecting | Advantage+", type: "Prospecting", spend: 12450, storeSales: 52400, orders: 438, ctr: 2.4, cpa: 28.41, mer: 4.21, frequency: 2.7, status: "Scale", nextAction: "Increase budget 12–15%" },
  { platform: "Meta", campaign: "Remarketing | 7D", type: "Retargeting", spend: 9230, storeSales: 47210, orders: 381, ctr: 3.8, cpa: 24.23, mer: 5.12, frequency: 7.4, status: "Watch", nextAction: "Refresh creatives due to frequency" },
  { platform: "Google", campaign: "Google | Brand", type: "Brand", spend: 6780, storeSales: 20880, orders: 218, ctr: 9.4, cpa: 31.12, mer: 3.08, frequency: 0, status: "Stable", nextAction: "Check brand cannibalization" },
  { platform: "TikTok", campaign: "TikTok | Prospecting", type: "Prospecting", spend: 5430, storeSales: 11460, orders: 126, ctr: 1.21, cpa: 54.23, mer: 2.11, frequency: 2.1, status: "Fix", nextAction: "Test new hooks before more spend" },
  { platform: "Snap", campaign: "Snap | Lookalike", type: "Prospecting", spend: 3220, storeSales: 8950, orders: 98, ctr: 1.4, cpa: 33.12, mer: 2.78, frequency: 2.6, status: "Stable", nextAction: "Maintain support budget" },
];

const creativeDiagnostics = [
  { label: "Winning creatives", value: 25, color: "#22c55e" },
  { label: "Average creatives", value: 77, color: "#3b82f6" },
  { label: "Weak creatives", value: 26, color: "#ef4444" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function num(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

function pct(current: number, previous: number) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function signed(value: number, digits = 1) {
  return `${value > 0 ? "+" : ""}${num(value, digits)}%`;
}

function deltaClass(value: number, goodWhenUp = true) {
  const good = goodWhenUp ? value >= 0 : value <= 0;
  return good ? "text-emerald-400" : "text-red-400";
}

function spark(reverse = false) {
  return reverse
    ? "0,20 10,24 20,18 30,26 40,23 50,29 60,31 70,36 80,33 90,39 100,42"
    : "0,36 10,42 20,31 30,34 40,22 50,27 60,24 70,29 80,21 90,28 100,23";
}

function Sidebar() {
  const items = [
    [Home, "Command Center", "command"],
    [ShieldCheck, "Business Health", "health"],
    [Rocket, "Scaling Engine", "scaling"],
    [Bell, "What Needs Action", "action"],
    [BarChart3, "Platform Breakdown", "platforms"],
    [Globe2, "Funnel Intelligence", "funnel"],
    [Zap, "Creative Intelligence", "creative"],
    [Megaphone, "Campaigns", "campaigns"],
    [Gauge, "Benchmarks", "benchmarks"],
    [BookOpen, "Reporting Layer", "reporting"],
    [Database, "Source Mapping", "sources"],
    [Settings, "Settings", "settings"],
  ];

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[280px] border-r border-slate-800/80 bg-[#071421] text-slate-100 xl:flex xl:flex-col">
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-900/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Gauge size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black">Performance OS</h1>
            <p className="text-sm text-slate-400">Scaler command center</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-5 pb-4 pr-3">
        {items.map(([Icon, label, id], index) => (
          <a
            key={label as string}
            href={`#${id}`}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${index === 0 ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"}`}
          >
            <Icon size={19} />
            <span>{label as string}</span>
          </a>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={16} />
            <span className="font-black">Live Prototype</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Mock data now · API mapping later</p>
        </div>
      </div>
    </aside>
  );
}

function Header({ range, setRange, platform, setPlatform }: { range: DateRange; setRange: (v: DateRange) => void; platform: Platform; setPlatform: (v: Platform) => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#07111f]/95 px-6 py-5 backdrop-blur">
      <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1 text-sm font-bold text-blue-200">{client}</span>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-sm font-bold text-emerald-200">Primary goal: scale safely</span>
            <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-1 text-sm font-bold text-purple-200">Store sales truth, not platform revenue</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">Performance Marketing Command Center</h2>
          <p className="mt-2 text-lg text-slate-400">Daily decisions first · reporting second · one client phase</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select label="Date Range" icon={Calendar} value={range} onChange={(v) => setRange(v as DateRange)} options={ranges} />
          <Select label="Platform" icon={Filter} value={platform} onChange={(v) => setPlatform(v as Platform)} options={platforms} />
          <button className="flex min-w-[170px] items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 text-lg font-black text-white">
            <RefreshCw size={20} /> Refresh
          </button>
        </div>
      </div>
    </header>
  );
}

function Select({ label, value, options, onChange, icon: Icon }: { label: string; value: string; options: string[]; onChange: (v: string) => void; icon: React.ElementType }) {
  return (
    <label className="relative min-w-[190px] rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300">
      <div className="mb-1 flex items-center gap-2 text-sm text-slate-400"><Icon size={16} /> {label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none bg-transparent text-lg font-black text-white outline-none">
        {options.map((option) => <option key={option} className="bg-slate-950">{option}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-9 text-slate-400" size={18} />
    </label>
  );
}

function Section({ id, title, subtitle, icon: Icon, children }: { id?: string; title: string; subtitle?: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-2xl border border-slate-800 bg-slate-900/65 p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex items-start gap-3">
        {Icon && <div className="rounded-xl bg-slate-800 p-2 text-blue-300"><Icon size={20} /></div>}
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function KPI({ title, value, previous, change, icon: Icon, note, color = "#3b82f6", goodWhenUp = true }: { title: string; value: string; previous?: string; change: number; icon: React.ElementType; note: string; color?: string; goodWhenUp?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-slate-400">{title}</p>
          <h4 className="mt-3 text-3xl font-black text-white">{value}</h4>
          {previous && <p className="mt-1 text-xs text-slate-500">Previous: {previous}</p>}
        </div>
        <div className="rounded-full border p-3" style={{ color, borderColor: `${color}55`, background: `${color}15` }}><Icon size={23} /></div>
      </div>
      <div className={`mt-4 flex items-center gap-1 text-sm font-black ${deltaClass(change, goodWhenUp)}`}>
        {change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {signed(change)} vs previous
      </div>
      <svg viewBox="0 0 100 52" className="mt-4 h-10 w-full"><polyline points={spark(!goodWhenUp && change > 0)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <p className="mt-2 min-h-[42px] text-sm leading-6 text-slate-400">{note}</p>
    </div>
  );
}

function Signal({ type, title, body, action }: { type: "risk" | "scale" | "info"; title: string; body: string; action: string }) {
  const style = type === "risk" ? "border-red-500/30 bg-red-500/10 text-red-300" : type === "scale" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-blue-500/30 bg-blue-500/10 text-blue-300";
  const Icon = type === "risk" ? AlertTriangle : type === "scale" ? Rocket : Lightbulb;
  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <div className="flex items-center gap-2"><Icon size={18} /><h4 className="font-black text-white">{title}</h4></div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
      <div className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-sm font-bold text-white">Action: {action}</div>
    </div>
  );
}

function StatusPill({ status }: { status: "Scale" | "Hold" | "Reduce" | "Fix" | "Good" | "Watch" | "Stable" }) {
  const styles: Record<string, string> = {
    Scale: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    Good: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    Stable: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Hold: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Watch: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Reduce: "bg-red-500/20 text-red-300 border-red-500/30",
    Fix: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return <span className={`rounded-lg border px-3 py-1 text-xs font-black uppercase ${styles[status]}`}>{status}</span>;
}

function MiniMetric({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "good" | "bad" | "warn" | "default" }) {
  const color = tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-red-300" : tone === "warn" ? "text-amber-300" : "text-white";
  return <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs text-slate-400">{label}</p><p className={`mt-1 text-xl font-black ${color}`}>{value}</p>{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}</div>;
}

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>("Last 7 Days");
  const [platform, setPlatform] = useState<Platform>("All");

  const filteredPlatforms = useMemo(() => platform === "All" ? platformRows : platformRows.filter((row) => row.platform === platform), [platform]);
  const filteredCampaigns = useMemo(() => platform === "All" ? campaigns : campaigns.filter((row) => row.platform === platform), [platform]);

  const totalSpend = filteredPlatforms.reduce((sum, row) => sum + row.spend, 0);
  const prevSpend = filteredPlatforms.reduce((sum, row) => sum + row.prevSpend, 0);
  const attributedRevenue = filteredPlatforms.reduce((sum, row) => sum + row.attributedRevenue, 0);
  const storeSalesFromFiltered = filteredPlatforms.reduce((sum, row) => sum + row.storeSales, 0);
  const prevStoreSalesFromFiltered = filteredPlatforms.reduce((sum, row) => sum + row.prevStoreSales, 0);

  const storeSales = platform === "All" ? storeTruth.storeSales : storeSalesFromFiltered;
  const prevStoreSales = platform === "All" ? storeTruth.prevStoreSales : prevStoreSalesFromFiltered;
  const orders = platform === "All" ? storeTruth.orders : Math.round(storeTruth.orders * (storeSalesFromFiltered / storeTruth.storeSales));
  const prevOrders = platform === "All" ? storeTruth.prevOrders : Math.round(storeTruth.prevOrders * (prevStoreSalesFromFiltered / storeTruth.prevStoreSales));

  const mer = storeSales / totalSpend;
  const prevMer = prevStoreSales / prevSpend;
  const blendedRoas = attributedRevenue / totalSpend;
  const cpa = totalSpend / orders;
  const prevCpa = prevSpend / prevOrders;
  const purchaseCvr = storeTruth.orders / storeTruth.sessions;
  const prevPurchaseCvr = storeTruth.prevOrders / storeTruth.prevSessions;
  const atcRate = storeTruth.addToCart / storeTruth.sessions;
  const prevAtcRate = storeTruth.prevAddToCart / storeTruth.prevSessions;
  const checkoutRate = storeTruth.checkoutStarted / storeTruth.addToCart;
  const prevCheckoutRate = storeTruth.prevCheckoutStarted / storeTruth.prevAddToCart;

  const bottleneck = atcRate < prevAtcRate
    ? { area: "Funnel / Offer", reason: "Add to Cart rate declined while sessions stayed healthy.", action: "Check product page, offer clarity, pricing, and traffic quality." }
    : platformRows.some((row) => row.frequency > 6 && row.ctr < row.benchmarkCtr)
      ? { area: "Creative", reason: "Frequency rising while CTR weakens.", action: "Refresh creatives and rotate hooks." }
      : { area: "Paid Media", reason: "Google and TikTok efficiency are weaker than benchmark.", action: "Reallocate budget toward better MER channels." };

  const scaleCandidates = filteredPlatforms.filter((row) => row.scaleSignal === "Scale");
  const riskChannels = filteredPlatforms.filter((row) => row.scaleSignal === "Fix" || row.mer < row.benchmarkMer);
  const averageCtr = filteredPlatforms.reduce((sum, row) => sum + row.ctr, 0) / filteredPlatforms.length;
  const averageCpc = filteredPlatforms.reduce((sum, row) => sum + row.cpc, 0) / filteredPlatforms.length;
  const averageFrequency = filteredPlatforms.reduce((sum, row) => sum + row.frequency, 0) / filteredPlatforms.length;
  const averageRoas = filteredPlatforms.reduce((sum, row) => sum + row.roas, 0) / filteredPlatforms.length;
  const averageBounceRate = 62;
  const averageSessionDuration = 42;
  const backendConversions = orders;
  const platformConversions = Math.round(orders * 1.14);
  const trackingMismatch = Math.abs(platformConversions - backendConversions) > backendConversions * 0.1;
  const checkoutFailure = checkoutRate < 0.55;
  const relationshipSignals = prioritizeSignals(
    evaluateRelationships({
      mer,
      ctr: averageCtr,
      cvr: purchaseCvr * 100,
      roas: averageRoas,
      ncac: cpa,
      frequency: averageFrequency,
      spendGrowth: pct(totalSpend, prevSpend),
      revenueGrowth: pct(storeSales, prevStoreSales),
      bounceRate: averageBounceRate,
      sessionDuration: averageSessionDuration,
      checkoutCompletionRate: checkoutRate * 100,
      backendConversions,
      platformConversions,
      trackingMismatch,
      checkoutFailure,
      merBelowThreshold: mer < 3,
    })
  );
  const decisionFeed = buildDecisionFeed(relationshipSignals);
  const scalingDecision = evaluateScaling({
    merStatus: mer >= prevMer ? "healthy" : mer >= prevMer * 0.92 ? "warning" : "danger",
    merTrend: mer >= prevMer ? "stable" : "declining",
    hasCreativeFatigue: averageFrequency > 2.5 && averageCtr < 2,
    revenueGrowth: pct(storeSales, prevStoreSales),
    spendGrowth: pct(totalSpend, prevSpend),
    priorityScore: relationshipSignals[0]?.score ?? 0,
    trackingMismatch,
    businessTruthFailure: relationshipSignals.some((signal) => signal.id === "sales_up_mer_down"),
    checkoutFailure,
    trafficQualityIssue: relationshipSignals.some((signal) => signal.id === "traffic_quality_issue"),
  });
  const homepageActions = generateActions(relationshipSignals);
  const riskActions = homepageActions.filter((action) => action.lane === "risk");
  const opportunityActions = homepageActions.filter((action) => action.lane === "opportunity");
  const rootCauses = detectRootCauses({
    ctr: averageCtr,
    frequency: averageFrequency,
    mer,
    cpc: averageCpc,
    cvr: purchaseCvr * 100,
    bounceRate: averageBounceRate,
    sessionDuration: averageSessionDuration,
    checkoutRate: checkoutRate * 100,
    purchaseCvr: purchaseCvr * 100,
    revenueGrowth: pct(storeSales, prevStoreSales),
    spendGrowth: pct(totalSpend, prevSpend),
    backendConversions,
    platformConversions,
  });

  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <Sidebar />
      <div className="xl:pl-[280px]">
        <Header range={range} setRange={setRange} platform={platform} setPlatform={setPlatform} />
        <div className="space-y-5 p-6">
          <section id="command" className="scroll-mt-28 grid gap-5 2xl:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-[#0b2035] to-slate-950 p-6 shadow-2xl shadow-blue-950/20">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-600 p-3"><Sparkles size={24} /></div>
                <div>
                  <p className="text-sm font-black uppercase text-blue-300">Operator Summary</p>
                  <h3 className="text-3xl font-black">{decisionFeed.headline}</h3>
                </div>
              </div>
              <p className="max-w-4xl text-lg leading-8 text-slate-300">{decisionFeed.summary}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <MiniMetric label="Scale Status" value={scalingDecision.status.toUpperCase()} hint={scalingDecision.recommendation} tone={scalingDecision.status === "safe" ? "good" : scalingDecision.status === "cautious" ? "warn" : "bad"} />
                <MiniMetric label="Risk Area" value={riskChannels.length ? riskChannels.map((row) => row.platform).join(" + ") : "Low"} hint="Based on MER/CPA benchmark" tone={riskChannels.length ? "warn" : "good"} />
                <MiniMetric label="Bottleneck" value={relationshipSignals[0]?.title ?? bottleneck.area} hint={relationshipSignals[0]?.recommendation ?? bottleneck.reason} tone="warn" />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-sm font-black uppercase text-slate-400">Today’s Priority Order</p>
              <div className="mt-5 space-y-4">
                {riskActions.slice(0, 2).map((action, index) => (
                  <Signal key={action.id} type="risk" title={`${index + 1}. ${action.title}`} body={action.reason} action={action.recommendation} />
                ))}
                {opportunityActions[0] ? (
                  <Signal type="scale" title={`${Math.min(riskActions.length, 2) + 1}. ${opportunityActions[0].title}`} body={opportunityActions[0].reason} action={opportunityActions[0].recommendation} />
                ) : (
                  <Signal type="info" title="Scaling held back" body="Opportunity signals stay suppressed while higher-priority business risks are active." action="Resolve the risk lane first" />
                )}
              </div>
            </div>
          </section>

          <section id="health" className="scroll-mt-28 grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
            <KPI title="Store Sales" value={money(storeSales)} previous={money(prevStoreSales)} change={pct(storeSales, prevStoreSales)} icon={ShoppingCart} color="#22c55e" note="Business truth: website/store sales including shipping/VAT when available." />
            <KPI title="MER" value={`${num(mer, 2)}x`} previous={`${num(prevMer, 2)}x`} change={pct(mer, prevMer)} icon={Target} color="#14b8a6" note="Master scaling KPI: store sales divided by total ad spend." />
            <KPI title="Total Spend" value={money(totalSpend)} previous={money(prevSpend)} change={pct(totalSpend, prevSpend)} icon={DollarSign} color="#ef4444" goodWhenUp={false} note="Spend increase is good only when MER and sales quality hold." />
            <KPI title="Orders" value={num(orders)} previous={num(prevOrders)} change={pct(orders, prevOrders)} icon={ShoppingBag} color="#f59e0b" note="Core sales volume indicator for daily decisions." />
            <KPI title="CPA / CAC" value={money(cpa)} previous={money(prevCpa)} change={pct(cpa, prevCpa)} icon={Gauge} color="#a855f7" goodWhenUp={false} note="Acquisition cost. Rising CPA needs channel or funnel diagnosis." />
            <KPI title="AOV" value={money(storeTruth.aov)} previous={money(storeTruth.prevAov)} change={pct(storeTruth.aov, storeTruth.prevAov)} icon={CircleDollarSign} color="#8b5cf6" note="Offer strength and order quality indicator." />
            <KPI title="Purchase CVR" value={`${num(purchaseCvr * 100, 2)}%`} previous={`${num(prevPurchaseCvr * 100, 2)}%`} change={pct(purchaseCvr, prevPurchaseCvr)} icon={MousePointer2} color="#22c55e" note="Website conversion efficiency. Helps separate traffic vs site issue." />
            <KPI title="Blended ROAS" value={`${num(blendedRoas, 2)}x`} change={4.8} icon={Target} color="#3b82f6" note="Platform-attributed return blended across selected channels." />
          </section>

          <div className="grid gap-5 2xl:grid-cols-3">
            <Section id="scaling" title="Growth / Scaling Engine" subtitle="Can we increase spend safely?" icon={Rocket}>
              <div className="space-y-4">
                <div className={`rounded-2xl border p-5 ${
                  scalingDecision.status === "danger"
                    ? "border-red-500 bg-red-950/20"
                    : scalingDecision.status === "cautious"
                    ? "border-yellow-500 bg-yellow-950/20"
                    : "border-emerald-500 bg-emerald-950/20"
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-sm uppercase text-slate-400">Account Decision</div>
                      <div className="mt-2 text-3xl font-black text-white">{scalingDecision.status.toUpperCase()}</div>
                      <div className="mt-2 text-sm text-slate-300">{scalingDecision.summary}</div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <MiniMetric label="Confidence" value={`${scalingDecision.confidence}%`} tone={scalingDecision.status === "safe" ? "good" : scalingDecision.status === "cautious" ? "warn" : "bad"} />
                      <MiniMetric label="Risk Level" value={scalingDecision.riskLevel} tone={scalingDecision.status === "danger" ? "bad" : "warn"} />
                      <MiniMetric label="Recommended Scale" value={`${scalingDecision.recommendedScalePercent}%`} tone={scalingDecision.recommendedScalePercent > 0 ? "good" : "bad"} />
                    </div>
                  </div>
                </div>
                {filteredPlatforms.map((row) => (
                  <div key={row.platform} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><h4 className="text-xl font-black">{row.platform}</h4><p className="text-sm text-slate-400">{row.recommendation}</p></div>
                      <StatusPill status={row.scaleSignal} />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <MiniMetric label="MER" value={`${num(row.mer, 2)}x`} hint={`Bench ${num(row.benchmarkMer, 2)}x`} tone={row.mer >= row.benchmarkMer ? "good" : "bad"} />
                      <MiniMetric label="CPA" value={money(row.cpa)} hint={`Bench ${money(row.benchmarkCpa)}`} tone={row.cpa <= row.benchmarkCpa ? "good" : "bad"} />
                      <MiniMetric label="CTR" value={`${num(row.ctr, 2)}%`} hint={`Bench ${num(row.benchmarkCtr, 2)}%`} tone={row.ctr >= row.benchmarkCtr ? "good" : "warn"} />
                      <MiniMetric label="Spend" value={money(row.spend)} hint={signed(pct(row.spend, row.prevSpend))} tone="default" />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="action" title="What Needs Action?" subtitle="Diagnosis before decisions" icon={AlertTriangle}>
              <div className="space-y-4">
                {riskActions.slice(0, 3).map((action) => (
                  <Signal key={action.id} type="risk" title={action.title} body={action.reason} action={action.recommendation} />
                ))}
                {opportunityActions[0] ? (
                  <Signal type="scale" title={opportunityActions[0].title} body={opportunityActions[0].reason} action={opportunityActions[0].recommendation} />
                ) : (
                  <Signal type="info" title="No active scaling promotion" body="Opportunities are intentionally capped while business risks are still unresolved." action="Clear blockers before expanding budgets" />
                )}
              </div>
            </Section>

            <Section id="platforms" title="Platform Breakdown" subtitle="Platform truth: diagnose why business truth changed" icon={BarChart3}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400"><tr><th className="pb-3">Platform</th><th>Spend</th><th>Store Sales</th><th>MER</th><th>ROAS</th><th>CPA</th><th>Signal</th></tr></thead>
                  <tbody>
                    {filteredPlatforms.map((row) => (
                      <tr key={row.platform} className="border-t border-slate-800">
                        <td className="py-4 text-lg font-black">{row.platform}</td>
                        <td>{money(row.spend)}</td>
                        <td>{money(row.storeSales)}</td>
                        <td className={row.mer >= row.benchmarkMer ? "text-emerald-300" : "text-red-300"}>{num(row.mer, 2)}x</td>
                        <td>{num(row.roas, 2)}x</td>
                        <td className={row.cpa <= row.benchmarkCpa ? "text-emerald-300" : "text-red-300"}>{money(row.cpa)}</td>
                        <td><StatusPill status={row.scaleSignal} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

          <div className="grid gap-5 2xl:grid-cols-5">
            <Section id="funnel" title="Funnel Intelligence" subtitle="Where are users dropping?" icon={Globe2}>
              <div className="space-y-3">
                {[
                  { name: "Sessions", value: storeTruth.sessions, rate: 100 },
                  { name: "Product Views", value: storeTruth.productViews, rate: storeTruth.productViews / storeTruth.sessions * 100 },
                  { name: "Add to Cart", value: storeTruth.addToCart, rate: atcRate * 100 },
                  { name: "Checkout Started", value: storeTruth.checkoutStarted, rate: checkoutRate * 100 },
                  { name: "Purchases", value: storeTruth.purchases, rate: purchaseCvr * 100 },
                ].map((step, index) => (
                  <div key={step.name} className="grid grid-cols-[1fr_100px_80px] items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 px-4 py-3 font-bold" style={{ width: `${Math.max(34, 100 - index * 13)}%` }}>{step.name}</div>
                    <div className="text-right font-black">{num(step.value)}</div>
                    <div className="rounded-lg bg-slate-800 px-2 py-1 text-center text-sm">{num(step.rate, 2)}%</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniMetric label="ATC Rate" value={`${num(atcRate * 100, 2)}%`} hint={`Prev ${num(prevAtcRate * 100, 2)}%`} tone={atcRate >= prevAtcRate ? "good" : "warn"} />
                <MiniMetric label="Checkout Rate" value={`${num(checkoutRate * 100, 2)}%`} hint={`Prev ${num(prevCheckoutRate * 100, 2)}%`} tone={checkoutRate >= prevCheckoutRate ? "good" : "warn"} />
              </div>
              <div className="mt-5 space-y-3">
                {rootCauses.slice(0, 2).map((cause) => (
                  <div key={cause.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-white">{cause.title}</div>
                      <StatusPill status={cause.severity === "danger" ? "Fix" : cause.severity === "warning" ? "Watch" : "Stable"} />
                    </div>
                    <div className="mt-2 text-sm text-slate-300">{cause.diagnosis}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Executive Trend" subtitle="Store sales, spend, and MER" icon={BarChart3}>
              <div className="h-[360px] 2xl:col-span-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} />
                    <Area dataKey="storeSales" stroke="#22c55e" fill="#22c55e" fillOpacity={0.16} strokeWidth={3} />
                    <Area dataKey="spend" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>

          <div className="grid gap-5 2xl:grid-cols-3">
            <Section id="creative" title="Creative Intelligence" subtitle="Fatigue and winning angles" icon={Zap}>
              <div className="grid items-center gap-4 md:grid-cols-[200px_1fr]">
                <div className="h-[190px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={creativeDiagnostics} dataKey="value" innerRadius={55} outerRadius={85}>{creativeDiagnostics.map((entry) => <Cell key={entry.label} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} /></PieChart></ResponsiveContainer></div>
                <div className="space-y-3">{creativeDiagnostics.map((item) => <p key={item.label}><span style={{ color: item.color }}>●</span> {item.label}: <b>{item.value}</b></p>)}</div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4"><MiniMetric label="Fatigue Risk" value={averageFrequency > 2.5 && averageCtr < 2 ? "High" : "Medium"} tone={averageFrequency > 2.5 && averageCtr < 2 ? "bad" : "warn"} /><MiniMetric label="Avg CTR" value={`${num(averageCtr, 2)}%`} tone={averageCtr >= 2 ? "good" : "warn"} /><MiniMetric label="Creative CPA" value={money(cpa)} tone={cpa <= 40 ? "good" : "warn"} /><MiniMetric label="Next Action" value={rootCauses.find((cause) => cause.id === "creative_fatigue") ? "Refresh" : "Monitor"} tone={rootCauses.find((cause) => cause.id === "creative_fatigue") ? "bad" : "warn"} /></div>
            </Section>

            <Section id="campaigns" title="Campaign Action Table" subtitle="What should be scaled, held, or fixed?" icon={Megaphone}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400"><tr><th className="pb-3">Campaign</th><th>Platform</th><th>Type</th><th>Spend</th><th>MER</th><th>CPA</th><th>Status</th><th>Next Action</th></tr></thead>
                  <tbody>{filteredCampaigns.map((row) => <tr key={row.campaign} className="border-t border-slate-800"><td className="py-4 font-bold">{row.campaign}</td><td>{row.platform}</td><td>{row.type}</td><td>{money(row.spend)}</td><td className={row.mer < 2.5 ? "text-red-300" : "text-emerald-300"}>{num(row.mer, 2)}x</td><td>{money(row.cpa)}</td><td><StatusPill status={row.status === "Scale" ? "Scale" : row.status === "Fix" ? "Fix" : row.status === "Watch" ? "Watch" : "Stable"} /></td><td className="text-slate-300">{row.nextAction}</td></tr>)}</tbody>
                </table>
              </div>
            </Section>

            <Section id="benchmarks" title="Benchmark Engine" subtitle="Account-specific health classification" icon={Gauge}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/50 p-5 text-center"><div className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full border-[14px] ${scalingDecision.status === "safe" ? "border-emerald-500/60" : scalingDecision.status === "cautious" ? "border-amber-500/60" : "border-red-500/60"}`}><div><p className="text-4xl font-black">{relationshipSignals[0]?.score ?? 0}</p><p className={`text-sm ${scalingDecision.status === "safe" ? "text-emerald-300" : scalingDecision.status === "cautious" ? "text-amber-300" : "text-red-300"}`}>{scalingDecision.status === "safe" ? "Healthy" : scalingDecision.status === "cautious" ? "Watch" : "Blocked"}</p></div></div><p className="mt-4 text-slate-400">Decision score based on Lamba priority weighting and override rules.</p></div>
                <div className="space-y-3"><MiniMetric label="MER vs Baseline" value={mer >= prevMer ? "Strong" : "Weak"} tone={mer >= prevMer ? "good" : "warn"} /><MiniMetric label="CPA Stability" value={cpa <= prevCpa ? "Stable" : "Watch"} tone={cpa <= prevCpa ? "good" : "warn"} /><MiniMetric label="Creative Fatigue" value={rootCauses.find((cause) => cause.id === "creative_fatigue") ? "High" : "Medium"} tone={rootCauses.find((cause) => cause.id === "creative_fatigue") ? "bad" : "warn"} /><MiniMetric label="Tracking Confidence" value={trackingMismatch ? "Low" : "Good"} tone={trackingMismatch ? "bad" : "good"} /></div>
              </div>
            </Section>
          </div>

          <div className="grid gap-5 2xl:grid-cols-3">
            <Section id="reporting" title="Reporting Layer" subtitle="Weekly/monthly summary, lower priority than daily decisions" icon={BookOpen}>
              <div className="grid gap-3 md:grid-cols-2"><MiniMetric label="Sales Growth" value={signed(pct(storeSales, prevStoreSales))} tone="good" /><MiniMetric label="MER Change" value={signed(pct(mer, prevMer))} tone={pct(mer, prevMer) >= 0 ? "good" : "warn"} /><MiniMetric label="Order Growth" value={signed(pct(orders, prevOrders))} tone="good" /><MiniMetric label="Spend Change" value={signed(pct(totalSpend, prevSpend))} tone="warn" /></div>
            </Section>
            <Section id="sources" title="Source Mapping" subtitle="Admin layer later" icon={Database}>
              <div className="space-y-3">{["Store Sales → Client Website", "Spend → Ad Platforms", "Orders → Client Website", "MER → Custom Calculation", "ROAS → Platform Attribution", "Funnel → Website/Analytics"].map((item) => <div key={item} className="rounded-xl bg-slate-950/40 p-3 text-sm text-slate-300">{item}</div>)}</div>
            </Section>
            <Section id="settings" title="Dashboard Rules" subtitle="Current operating logic" icon={Settings}>
              <div className="space-y-3 text-sm text-slate-300"><p>1. Scale safely is the primary goal.</p><p>2. Protect MER before increasing total spend.</p><p>3. Store Sales is the business truth.</p><p>4. Platform ROAS is diagnostic, not final truth.</p><p>5. Daily decisions first, reporting second.</p></div>
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
}