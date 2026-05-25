"use client";

export const client = "Unresolved Crime";
export const platformRows = [
  { platform:"Meta", spend:45620, prevSpend:42960, storeSales:166400, prevStoreSales:141800, attributedRevenue:156532, ctr:2.2, cpa:34.4, roas:3.43, mer:3.65, benchmarkMer:3.25, benchmarkCpa:40, benchmarkCtr:1.8, scaleSignal:"Scale", recommendation:"Scale winning prospecting campaigns by 12-15% while watching MER." },
  { platform:"Google", spend:28430, prevSpend:32480, storeSales:72600, prevStoreSales:86600, attributedRevenue:78996, ctr:4.59, cpa:44.9, roas:2.78, mer:2.55, benchmarkMer:3.0, benchmarkCpa:38, benchmarkCtr:5.2, scaleSignal:"Fix", recommendation:"Audit Search terms, brand overlap, and weak campaigns before scaling." },
  { platform:"TikTok", spend:18770, prevSpend:16210, storeSales:59300, prevStoreSales:51900, attributedRevenue:61430, ctr:1.73, cpa:52.11, roas:3.27, mer:3.16, benchmarkMer:3.05, benchmarkCpa:42, benchmarkCtr:1.6, scaleSignal:"Hold", recommendation:"Hold spend. Creative cost is rising; test new hooks before scaling." },
  { platform:"Snap", spend:9610, prevSpend:9960, storeSales:26200, prevStoreSales:20637, attributedRevenue:23256, ctr:1.31, cpa:33.21, roas:2.42, mer:2.73, benchmarkMer:2.25, benchmarkCpa:36, benchmarkCtr:1.2, scaleSignal:"Hold", recommendation:"Keep stable. Use as support channel, not primary scale source." },
];
export const storeTruth = { storeSales:348214, prevStoreSales:300937, orders:2642, prevOrders:2352, sessions:85247, prevSessions:80220, productViews:24690, addToCart:8642, checkoutStarted:4521, purchases:2642, aov:131.76, prevAov:127.8 };
export const trend = [
  { day:"Mon", spend:12800, storeSales:38200 }, { day:"Tue", spend:13600, storeSales:42100 }, { day:"Wed", spend:15100, storeSales:51800 }, { day:"Thu", spend:14800, storeSales:49300 }, { day:"Fri", spend:17100, storeSales:62200 }, { day:"Sat", spend:17700, storeSales:67900 }, { day:"Sun", spend:17320, storeSales:56714 },
];
export const campaigns = [
  { platform:"Meta", campaign:"Prospecting | Advantage+", type:"Prospecting", spend:12450, storeSales:52400, orders:438, ctr:2.4, cpa:28.41, mer:4.21, status:"Scale", nextAction:"Increase budget 12-15%" },
  { platform:"Meta", campaign:"Remarketing | 7D", type:"Retargeting", spend:9230, storeSales:47210, orders:381, ctr:3.8, cpa:24.23, mer:5.12, status:"Watch", nextAction:"Refresh creatives due to frequency" },
  { platform:"Google", campaign:"Google | Brand", type:"Brand", spend:6780, storeSales:20880, orders:218, ctr:9.4, cpa:31.12, mer:3.08, status:"Stable", nextAction:"Check brand cannibalization" },
  { platform:"TikTok", campaign:"TikTok | Prospecting", type:"Prospecting", spend:5430, storeSales:11460, orders:126, ctr:1.21, cpa:54.23, mer:2.11, status:"Fix", nextAction:"Test new hooks before more spend" },
  { platform:"Snap", campaign:"Snap | Lookalike", type:"Prospecting", spend:3220, storeSales:8950, orders:98, ctr:1.4, cpa:33.12, mer:2.78, status:"Stable", nextAction:"Maintain support budget" },
];
export const creativeDiagnostics = [ { label:"Winning creatives", value:25, color:"#22c55e" }, { label:"Average creatives", value:77, color:"#3b82f6" }, { label:"Weak creatives", value:26, color:"#ef4444" } ];
export function money(v:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(v)}
export function num(v:number,d=0){return new Intl.NumberFormat("en-US",{maximumFractionDigits:d,minimumFractionDigits:d}).format(v)}
export function pct(c:number,p:number){return p?((c-p)/p)*100:0}
export function signed(v:number,d=1){return `${v>0?"+":""}${num(v,d)}%`}
