"use client";

import React, { useMemo, useState } from "react";
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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Database,
  DollarSign,
  Filter,
  Gauge,
  Globe2,
  Home,
  Megaphone,
  MousePointer2,
  RefreshCw,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

type Platform = "All" | "Meta" | "Google" | "TikTok" | "Snap";
type DateRange = "Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "MTD" | "QTD" | "Last 90 Days";

type PlatformRow = {
  platform: Exclude<Platform, "All">;
  spend: number;
  prevSpend: number;
  attributedRevenue: number;
  prevAttributedRevenue: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  roas: number;
  benchmarkRoas: number;
  benchmarkCpa: number;
  benchmarkCtr: number;
};

type CampaignRow = {
  platform: Exclude<Platform, "All">;
  campaign: string;
  type: "Prospecting" | "Retargeting" | "Brand" | "Creative Test";
  spend: number;
  revenue: number;
  orders: number;
  ctr: number;
  cpa: number;
  mer: number;
  frequency: number;
  status: "Scale" | "Stable" | "Watch" | "Fix";
  prevTrend: "up" | "down" | "flat";
};

const client = "Unresolved Crime";

const ranges: DateRange[] = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "MTD", "QTD", "Last 90 Days"];
const platforms: Platform[] = ["All", "Meta", "Google", "TikTok", "Snap"];

const platformRows: PlatformRow[] = [
  { platform: "Meta", spend: 45620, prevSpend: 42960, attributedRevenue: 156532, prevAttributedRevenue: 142170, impressions: 3240000, clicks: 71240, ctr: 2.2, cpc: 0.64, cpm: 14.08, cpa: 36.31, roas: 3.43, benchmarkRoas: 3.1, benchmarkCpa: 40, benchmarkCtr: 1.8 },
  { platform: "Google", spend: 28430, prevSpend: 32480, attributedRevenue: 78996, prevAttributedRevenue: 86200, impressions: 920000, clicks: 42180, ctr: 4.59, cpc: 0.67, cpm: 30.9, cpa: 41.92, roas: 2.78, benchmarkRoas: 2.75, benchmarkCpa: 38, benchmarkCtr: 5.2 },
  { platform: "TikTok", spend: 18770, prevSpend: 16210, attributedRevenue: 61430, prevAttributedRevenue: 50100, impressions: 2110000, clicks: 36520, ctr: 1.73, cpc: 0.51, cpm: 8.9, cpa: 52.11, roas: 3.27, benchmarkRoas: 2.4, benchmarkCpa: 42, benchmarkCtr: 1.6 },
  { platform: "Snap", spend: 9610, prevSpend: 9960, attributedRevenue: 23256, prevAttributedRevenue: 24100, impressions: 1180000, clicks: 15430, ctr: 1.31, cpc: 0.62, cpm: 8.14, cpa: 33.21, roas: 2.42, benchmarkRoas: 2.1, benchmarkCpa: 36, benchmarkCtr: 1.2 },
];

const websiteTruth = {
  revenue: 348214,
  prevRevenue: 300937,
  orders: 2642,
  prevOrders: 2352,
  sessions: 85247,
  prevSessions: 80220,
  productViews: 24690,
  addToCart: 8642,
  prevAddToCart: 9204,
  checkoutStarted: 4521,
  prevCheckoutStarted: 4815,
  purchases: 2642,
  prevPurchases: 2352,
  aov: 131.76,
  prevAov: 127.8,
  grossMargin: 0.54,
  variableCosts: 27620,
  refunds: 4210,
};

const trend = [
  { day: "Mon", spend: 12800, revenue: 38200, mer: 2.98, orders: 312 },
  { day: "Tue", spend: 13600, revenue: 42100, mer: 3.1, orders: 336 },
  { day: "Wed", spend: 15100, revenue: 51800, mer: 3.43, orders: 402 },
  { day: "Thu", spend: 14800, revenue: 49300, mer: 3.33, orders: 374 },
  { day: "Fri", spend: 17100, revenue: 62200, mer: 3.64, orders: 468 },
  { day: "Sat", spend: 17700, revenue: 67900, mer: 3.84, orders: 512 },
  { day: "Sun", spend: 17320, revenue: 56714, mer: 3.27, orders: 238 },
];

const campaigns: CampaignRow[] = [
  { platform: "Meta", campaign: "Prospecting | Advantage+", type: "Prospecting", spend: 12450, revenue: 52400, orders: 438, ctr: 2.4, cpa: 28.41, mer: 4.21, frequency: 2.7, status: "Scale", prevTrend: "up" },
  { platform: "Meta", campaign: "Remarketing | 7D", type: "Retargeting", spend: 9230, revenue: 47210, orders: 381, ctr: 3.8, cpa: 24.23, mer: 5.12, frequency: 7.4, status: "Watch", prevTrend: "up" },
  { platform: "Google", campaign: "Google | Brand", type: "Brand", spend: 6780, revenue: 20880, orders: 218, ctr: 9.4, cpa: 31.12, mer: 3.08, frequency: 0, status: "Stable", prevTrend: "down" },
  { platform: "TikTok", campaign: "TikTok | Prospecting", type: "Prospecting", spend: 5430, revenue: 11460, orders: 126, ctr: 1.21, cpa: 54.23, mer: 2.11, frequency: 2.1, status: "Fix", prevTrend: "down" },
  { platform: "Snap", campaign: "Snap | Lookalike", type: "Prospecting", spend: 3220, revenue: 8950, orders: 98, ctr: 1.4, cpa: 33.12, mer: 2.78, frequency: 2.6, status: "Stable", prevTrend: "up" },
];

const creatives = {
  total: 128,
  top: 25,
  middle: 77,
  bottom: 26,
  fatigued: 14,
  ctrAll: 1.42,
  cpaAll: 38.76,
  creativeMer: 3.4,
};

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

function MiniSpark({ color = "#00d19a", reverse = false }: { color?: string; reverse?: boolean }) {
  const points = reverse
    ? "0,20 10,24 20,18 30,26 40,23 50,29 60,31 70,36 80,33 90,39 100,42"
    : "0,36 10,42 20,31 30,34 40,22 50,27 60,24 70,29 80,21 90,28 100,23";
  return (
    <svg viewBox="0 0 100 52" className="h-12 w-full">
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Sidebar() {
  const items = [
    [Home, "Executive Overview", "executive"],
    [BarChart3, "Performance Scorecard", "scorecard"],
    [Globe2, "Website & Funnel", "funnel"],
    [Megaphone, "Campaigns", "campaigns"],
    [Zap, "Creatives", "creatives"],
    [Gauge, "Benchmarks", "benchmarks"],
    [Bell, "Alerts & Insights", "alerts"],
    [BookOpen, "Operator Guide", "operator"],
    [Database, "Truth Layers", "truth"],
    [Database, "Source Mapping", "sources"],
    [Sparkles, "Custom Signals", "signals"],
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
            <p className="text-sm text-slate-400">One-client operator dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-5 pb-4 pr-3">
        {items.map(([Icon, label, id], index) => (
          <a
            key={label as string}
            href={`#${id}`}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
              index === 0 ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
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
            <span className="font-black">Data Status</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Mock source layer active</p>
        </div>
      </div>
    </aside>
  );
}

function Header({ range, setRange, platform, setPlatform }: { range: DateRange; setRange: (v: DateRange) => void; platform: Platform; setPlatform: (v: Platform) => void }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-[#07111f]/95 px-6 py-5 backdrop-blur">
      <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1 text-sm font-bold text-blue-200">{client}</span>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-sm font-bold text-emerald-200">Website truth + ads truth separated</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">Performance Marketing Dashboard</h2>
          <p className="mt-2 text-lg text-slate-400">Executive Overview · ecommerce operating logic · one client only</p>
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

function KpiCard({ title, value, change, note, icon: Icon, color, reverse }: { title: string; value: string; change: number; note: string; icon: React.ElementType; color: string; reverse?: boolean }) {
  const positive = change >= 0;
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-blue-100">{title}</p>
          <h3 className="mt-3 text-3xl font-black text-white">{value}</h3>
          <p className={`mt-2 flex items-center gap-1 text-base font-black ${positive ? "text-emerald-400" : "text-red-400"}`}>
            {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {positive ? "+" : ""}{num(change, 1)}%
          </p>
        </div>
        <div className="rounded-full border p-3" style={{ color, borderColor: color + "55", background: color + "15" }}><Icon size={24} /></div>
      </div>
      <div className="mt-6"><MiniSpark color={color} reverse={reverse} /></div>
      <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-400">{note}</p>
    </div>
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

function StatusPill({ level }: { level: "High" | "Medium" | "Info" | "Good" }) {
  const styles = {
    High: "bg-red-500/20 text-red-300 border-red-500/30",
    Medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Good: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };
  return <span className={`rounded-lg border px-3 py-1 text-xs font-black uppercase ${styles[level]}`}>{level}</span>;
}

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>("Last 7 Days");
  const [platform, setPlatform] = useState<Platform>("All");

  const filteredPlatforms = useMemo(() => platform === "All" ? platformRows : platformRows.filter((row) => row.platform === platform), [platform]);
  const filteredCampaigns = useMemo(() => platform === "All" ? campaigns : campaigns.filter((row) => row.platform === platform), [platform]);

  const spend = filteredPlatforms.reduce((sum, row) => sum + row.spend, 0);
  const prevSpend = filteredPlatforms.reduce((sum, row) => sum + row.prevSpend, 0);
  const attributedRevenue = filteredPlatforms.reduce((sum, row) => sum + row.attributedRevenue, 0);
  const prevAttributedRevenue = filteredPlatforms.reduce((sum, row) => sum + row.prevAttributedRevenue, 0);
  const mer = websiteTruth.revenue / spend;
  const prevMer = websiteTruth.prevRevenue / prevSpend;
  const blendedRoas = attributedRevenue / spend;
  const prevBlendedRoas = prevAttributedRevenue / prevSpend;
  const cpa = spend / websiteTruth.orders;
  const prevCpa = prevSpend / websiteTruth.prevOrders;
  const purchaseCvr = websiteTruth.orders / websiteTruth.sessions;
  const prevPurchaseCvr = websiteTruth.prevOrders / websiteTruth.prevSessions;
  const atcRate = websiteTruth.addToCart / websiteTruth.sessions;
  const checkoutRate = websiteTruth.checkoutStarted / websiteTruth.addToCart;
  const grossProfit = websiteTruth.revenue * websiteTruth.grossMargin;
  const contributionAfterAds = grossProfit - spend - websiteTruth.variableCosts - websiteTruth.refunds;
  const operatorScore = Math.round(Math.min(100, mer * 18 + purchaseCvr * 500 + (atcRate > 0.09 ? 15 : 0)));

  const changes = [
    { label: "Store Revenue", value: money(websiteTruth.revenue - websiteTruth.prevRevenue), pct: pct(websiteTruth.revenue, websiteTruth.prevRevenue), good: true },
    { label: "MER", value: `+${num(mer - prevMer, 2)}x`, pct: pct(mer, prevMer), good: true },
    { label: "Orders", value: `+${numberDelta(websiteTruth.orders - websiteTruth.prevOrders)}`, pct: pct(websiteTruth.orders, websiteTruth.prevOrders), good: true },
    { label: "CPA", value: `${money(cpa - prevCpa)}`, pct: pct(cpa, prevCpa), good: false },
    { label: "Spend", value: money(spend - prevSpend), pct: pct(spend, prevSpend), good: false },
  ];

  const attention = useMemo(() => {
    const items = [];
    const google = platformRows.find((row) => row.platform === "Google");
    const tiktok = platformRows.find((row) => row.platform === "TikTok");
    if (google && google.roas < google.benchmarkRoas) items.push({ level: "High" as const, title: "Google ROAS below benchmark", desc: `ROAS ${google.roas}x vs benchmark ${google.benchmarkRoas}x` });
    if (tiktok && tiktok.cpa > tiktok.benchmarkCpa) items.push({ level: "High" as const, title: "TikTok CPA above benchmark", desc: `CPA ${money(tiktok.cpa)} vs benchmark ${money(tiktok.benchmarkCpa)}` });
    if (atcRate < websiteTruth.prevAddToCart / websiteTruth.prevSessions) items.push({ level: "Medium" as const, title: "Add to Cart rate dropped", desc: "ATC rate down vs previous period" });
    if (campaigns.some((campaign) => campaign.frequency > 6 && campaign.ctr < 4)) items.push({ level: "Medium" as const, title: "Creative fatigue detected", desc: "Frequency is high while CTR is not improving" });
    items.push({ level: "Info" as const, title: "Website truth and platform truth separated", desc: "Use MER for business truth and platform ROAS for platform optimization" });
    return items;
  }, [atcRate]);

  const funnel = [
    { name: "Sessions", value: websiteTruth.sessions, rate: 100 },
    { name: "Add to Cart", value: websiteTruth.addToCart, rate: atcRate * 100 },
    { name: "Checkout Started", value: websiteTruth.checkoutStarted, rate: checkoutRate * 100 },
    { name: "Purchases", value: websiteTruth.purchases, rate: purchaseCvr * 100 },
  ];

  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <Sidebar />
      <div className="xl:pl-[280px]">
        <Header range={range} setRange={setRange} platform={platform} setPlatform={setPlatform} />
        <div className="space-y-5 p-6">
          <div id="executive" className="scroll-mt-28 grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
            <KpiCard title="Total Ad Spend" value={money(spend)} change={pct(spend, prevSpend)} icon={DollarSign} color="#ff4d4d" note="Total paid media investment across channels for the selected period." reverse />
            <KpiCard title="Store Revenue" value={money(websiteTruth.revenue)} change={pct(websiteTruth.revenue, websiteTruth.prevRevenue)} icon={ShoppingCart} color="#22c55e" note="The main sales truth from your website/store analytics stack." />
            <KpiCard title="MER" value={`${num(mer, 2)}x`} change={pct(mer, prevMer)} icon={Target} color="#14b8a6" note="Top-line blended efficiency metric for the whole business." />
            <KpiCard title="Blended ROAS" value={`${num(blendedRoas, 2)}x`} change={pct(blendedRoas, prevBlendedRoas)} icon={Target} color="#3b82f6" note="Shows return from channel-attributed revenue in one blended view." />
            <KpiCard title="Orders" value={num(websiteTruth.orders)} change={pct(websiteTruth.orders, websiteTruth.prevOrders)} icon={ShoppingBag} color="#f59e0b" note="Shows how many purchase events turned into real orders." />
            <KpiCard title="CPA / CAC" value={money(cpa)} change={pct(cpa, prevCpa)} icon={Gauge} color="#a855f7" note="Core acquisition efficiency metric. Lower is usually better." reverse={pct(cpa, prevCpa) > 0} />
            <KpiCard title="AOV" value={money(websiteTruth.aov)} change={pct(websiteTruth.aov, websiteTruth.prevAov)} icon={Gauge} color="#8b5cf6" note="Shows average order size and offer quality." />
            <KpiCard title="Purchase Conversion Rate" value={`${num(purchaseCvr * 100, 2)}%`} change={pct(purchaseCvr, prevPurchaseCvr)} icon={Gauge} color="#22c55e" note="Main website conversion efficiency metric." />
          </div>

          <div className="grid gap-5 2xl:grid-cols-3">
            <Section id="scorecard" title="What Changed?" subtitle="Current period vs previous period" icon={TrendingUp}>
              <div className="space-y-3">
                {changes.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${item.good ? "bg-emerald-400" : "bg-red-400"}`} /><span className="font-semibold text-slate-200">{item.label}</span></div>
                    <div className="text-right"><p className={item.good ? "text-emerald-400" : "text-red-400"}>{item.value}</p><p className={item.good ? "text-emerald-400" : "text-red-400"}>{item.pct > 0 ? "+" : ""}{num(item.pct, 1)}%</p></div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="alerts" title="What Needs Attention?" subtitle="Prioritized by operator impact" icon={AlertTriangle}>
              <div className="space-y-3">
                {attention.map((item) => (
                  <div key={item.title} className="flex items-start gap-3 border-b border-slate-800 pb-3 last:border-none last:pb-0">
                    <AlertTriangle className={item.level === "High" ? "text-red-400" : item.level === "Medium" ? "text-amber-400" : "text-blue-400"} size={20} />
                    <div className="flex-1"><div className="flex items-center gap-2"><StatusPill level={item.level} /><p className="font-bold text-white">{item.title}</p></div><p className="mt-1 text-sm text-slate-400">{item.desc}</p></div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="scorecard" title="Paid Media Scorecard" subtitle="Channel truth, not final store truth" icon={BarChart3}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400"><tr><th className="pb-3">Platform</th><th>Spend</th><th>Attributed Revenue</th><th>CPA</th><th>ROAS</th><th>Benchmark</th></tr></thead>
                  <tbody>
                    {filteredPlatforms.map((row) => (
                      <tr key={row.platform} className="border-t border-slate-800">
                        <td className="py-4 text-xl font-black">{row.platform}</td>
                        <td>{money(row.spend)}<br /><span className={pct(row.spend, row.prevSpend) > 0 ? "text-red-400" : "text-emerald-400"}>{pct(row.spend, row.prevSpend) > 0 ? "+" : ""}{num(pct(row.spend, row.prevSpend), 1)}%</span></td>
                        <td>{money(row.attributedRevenue)}<br /><span className="text-emerald-400">{pct(row.attributedRevenue, row.prevAttributedRevenue) > 0 ? "+" : ""}{num(pct(row.attributedRevenue, row.prevAttributedRevenue), 1)}%</span></td>
                        <td className={row.cpa > row.benchmarkCpa ? "text-red-300" : "text-emerald-300"}>{money(row.cpa)}</td>
                        <td className={row.roas < row.benchmarkRoas ? "text-red-300" : "text-emerald-300"}>{num(row.roas, 2)}x</td>
                        <td>{row.roas >= row.benchmarkRoas ? <StatusPill level="Good" /> : <StatusPill level="High" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

          <div className="grid gap-5 2xl:grid-cols-5">
            <Section title="Executive Revenue vs Spend" subtitle="Business truth vs paid media investment" icon={BarChart3}>
              <div className="h-[320px] 2xl:col-span-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22c55e" stopOpacity={0.35} /><stop offset="1" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} />
                    <Area dataKey="revenue" stroke="#22c55e" fill="url(#rev)" strokeWidth={3} />
                    <Area dataKey="spend" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section id="funnel" title="Website & Funnel Snapshot" subtitle="Store truth funnel" icon={Globe2}>
              <div className="space-y-3">
                {funnel.map((step, index) => (
                  <div key={step.name} className="grid grid-cols-[1fr_100px_80px] items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 px-4 py-3 font-bold" style={{ width: `${Math.max(36, 100 - index * 16)}%` }}>{step.name}</div>
                    <div className="text-right font-black">{num(step.value)}</div>
                    <div className="rounded-lg bg-slate-800 px-2 py-1 text-center text-sm">{num(step.rate, 2)}%</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-950/50 p-3"><p className="text-slate-400">ATC Rate</p><p className="text-xl font-black text-white">{num(atcRate * 100, 2)}%</p></div>
                <div className="rounded-xl bg-slate-950/50 p-3"><p className="text-slate-400">Checkout Rate</p><p className="text-xl font-black text-white">{num(checkoutRate * 100, 2)}%</p></div>
              </div>
            </Section>
          </div>

          <div className="grid gap-5 2xl:grid-cols-3">
            <Section id="campaigns" title="Campaign Performance Top 5" subtitle="Filtered by selected platform" icon={Megaphone}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400"><tr><th className="pb-3">Campaign</th><th>Platform</th><th>Spend</th><th>MER</th><th>CPA</th><th>Orders</th><th>Status</th></tr></thead>
                  <tbody>{filteredCampaigns.map((row) => <tr key={row.campaign} className="border-t border-slate-800"><td className="py-4 font-bold">{row.campaign}</td><td>{row.platform}</td><td>{money(row.spend)}</td><td className={row.mer < 2.5 ? "text-red-300" : "text-emerald-300"}>{num(row.mer, 2)}x</td><td>{money(row.cpa)}</td><td>{row.orders}</td><td><StatusPill level={row.status === "Fix" ? "High" : row.status === "Watch" ? "Medium" : "Good"} /></td></tr>)}</tbody>
                </table>
              </div>
            </Section>

            <Section id="creatives" title="Creative Diagnostics" subtitle="Creative quality and fatigue" icon={Zap}>
              <div className="grid items-center gap-4 md:grid-cols-[200px_1fr]">
                <div className="h-[190px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: "Top", value: creatives.top }, { name: "Middle", value: creatives.middle }, { name: "Bottom", value: creatives.bottom }]} dataKey="value" innerRadius={55} outerRadius={85}><Cell fill="#22c55e" /><Cell fill="#3b82f6" /><Cell fill="#ef4444" /></Pie><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} /></PieChart></ResponsiveContainer></div>
                <div className="space-y-3"><p><span className="text-emerald-400">●</span> Top 20% High Performers: <b>{creatives.top}</b></p><p><span className="text-blue-400">●</span> Middle 60% Average: <b>{creatives.middle}</b></p><p><span className="text-red-400">●</span> Bottom 20% Low Performers: <b>{creatives.bottom}</b></p></div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4"><MiniMetric label="Fatigued" value={`${creatives.fatigued}`} warn /><MiniMetric label="CTR All" value={`${num(creatives.ctrAll, 2)}%`} warn /><MiniMetric label="CPA All" value={money(creatives.cpaAll)} warn /><MiniMetric label="Creative MER" value={`${num(creatives.creativeMer, 2)}x`} good /></div>
            </Section>

            <Section id="operator" title="Operator Guidance" subtitle="Check this next" icon={Sparkles}>
              <div className="grid gap-4 md:grid-cols-2">
                <div><h4 className="mb-3 font-black text-blue-200">Check This Next</h4><Checklist items={["Review Google Search campaigns", "Investigate TikTok CPA increase", "Analyze Add to Cart drop-off", "Refresh fatigued creatives"]} /></div>
                <div><h4 className="mb-3 font-black text-amber-200">Likely Actions</h4><Checklist items={["Reallocate budget to Meta", "Improve product page speed", "Test new UGC creatives", "Scale winning campaigns"]} lightning /></div>
              </div>
            </Section>
          </div>

          <div className="grid gap-5 2xl:grid-cols-4">
            <Section id="benchmarks" title="Benchmark Engine" subtitle="Account-specific health" icon={Gauge}>
              <div className="text-center"><div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-[14px] border-emerald-500/60 bg-slate-950"><div><p className="text-4xl font-black">{operatorScore}</p><p className="text-sm text-emerald-300">Good</p></div></div><p className="mt-4 text-slate-300">+12% vs benchmark</p><p className="text-emerald-400">+8% vs 30-day average</p></div>
            </Section>
            <Section id="truth" title="Truth Layers" subtitle="Data interpretation status" icon={Database}><StatusList items={["UTM Integrity|Good", "Server-Side Tracking|Partial", "Event Match Quality|Good", "Data Freshness|Good"]} /></Section>
            <Section title="Profitability Snapshot" subtitle="Requires margin data" icon={DollarSign}><MiniMetric label="Gross Profit" value={money(grossProfit)} good /><MiniMetric label="Contribution After Ads" value={money(contributionAfterAds)} good /><MiniMetric label="Refunds" value={money(websiteTruth.refunds)} warn /></Section>
            <Section id="sources" title="Data Source Status" subtitle="Connection readiness" icon={Database}><StatusList items={["Meta Ads|Connected", "Google Ads|Connected", "TikTok Ads|Connected", "Snap Ads|Connected", "Client Website|Planned"]} /></Section>
          </div>

          <footer className="flex flex-col justify-between gap-3 border-t border-slate-800 py-6 text-xs text-slate-500 md:flex-row"><p>All metrics follow the defined formulas and benchmarks from the Performance Marketing Dashboard framework.</p><p>Data is mocked now. Next phase: source mapping + live API sync.</p></footer>
        </div>
      </div>
    </main>
  );
}

function numberDelta(value: number) {
  return new Intl.NumberFormat("en-US", { signDisplay: "exceptZero" }).format(value);
}

function MiniMetric({ label, value, good, warn }: { label: string; value: string; good?: boolean; warn?: boolean }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs text-slate-400">{label}</p><p className={`mt-1 text-lg font-black ${good ? "text-emerald-300" : warn ? "text-amber-300" : "text-white"}`}>{value}</p></div>;
}

function Checklist({ items, lightning }: { items: string[]; lightning?: boolean }) {
  return <div className="space-y-2">{items.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-slate-300">{lightning ? <Zap size={15} className="text-amber-300" /> : <CheckCircle2 size={15} className="text-purple-300" />} {item}</div>)}</div>;
}

function StatusList({ items }: { items: string[] }) {
  return <div className="space-y-3">{items.map((item) => { const [label, status] = item.split("|"); const good = status === "Good" || status === "Connected"; return <div key={item} className="flex items-center justify-between rounded-xl bg-slate-950/40 p-3"><span className="text-sm text-slate-300">{label}</span><span className={`rounded-lg px-3 py-1 text-xs font-black ${good ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>{status}</span></div>; })}</div>;
}
