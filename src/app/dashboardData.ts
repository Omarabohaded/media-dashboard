export const overviewRows = [
  [
    "eCommerce Dashboard Metric Dictionary"
  ],
  [
    "Use website/store metrics as the business truth for sessions, orders, and revenue. Use platform metrics to read delivery, traffic cost, and creative performance. Use blended and custom metrics to decide budget, scaling, and profitability."
  ],
  [
    "How to Use This File",
    "Section Summary"
  ],
  [
    "1",
    "Start in the Metric Dictionary sheet and review metrics by section.",
    "Section",
    "Metric Count"
  ],
  [
    "2",
    "Use the Equation column as the dashboard formula reference.",
    "Executive Summary",
    "6"
  ],
  [
    "3",
    "Use the Healthy / Warning columns as your quick operator guide.",
    "Traffic & Awareness",
    "9"
  ],
  [
    "4",
    "Use the Benchmarks sheet to design account-specific normal ranges.",
    "Site Quality",
    "6"
  ],
  [
    "5",
    "Treat MER and store revenue as the final business read, not platform ROAS alone.",
    "Funnel Metrics",
    "8"
  ],
  [
    "6",
    "If data sources disagree, label the truth type instead of forcing one blended number.",
    "Revenue & Order Economics",
    "5"
  ],
  [
    "Paid Media Efficiency",
    "8"
  ],
  [
    "Truth Type",
    "Meaning",
    "Best Use",
    "Watch Out For",
    "Customer Quality",
    "5"
  ],
  [
    "Website / Store",
    "Business truth from the site or store",
    "Revenue, orders, sessions, CVR",
    "May lag attribution reporting",
    "Profitability",
    "5"
  ],
  [
    "Platform-Specific",
    "Channel-level ad truth",
    "Delivery, CPC, CPM, CTR, ROAS",
    "Can over-credit revenue",
    "Diagnostics & Alerts",
    "7"
  ],
  [
    "Blended",
    "Combined channel view",
    "Budget allocation and executive reading",
    "Can hide tracking differences"
  ],
  [
    "Custom",
    "Business logic metric",
    "Profitability, fatigue, scaling, benchmarks",
    "Needs clear formula governance"
  ]
] as const;

export const metricDictionary = [
  {
    "Section": "Executive Summary",
    "Metric Name": "Total Ad Spend",
    "Source": "Custom",
    "Level": "Account",
    "Priority": "Must Have",
    "Formula": "Sum of spend from Meta + Google + Snap + TikTok",
    "Where It Appears in the Dashboard": "Executive summary cards",
    "What It Means": "Total paid media investment across channels for the selected period.",
    "Healthy / Good Signal": "Healthy when spend grows with stable or improving MER/Blended ROAS.",
    "Warning / Bad Signal": "Warning if spend rises faster than revenue or contribution margin.",
    "Best Paired With": "MER, Blended ROAS, Revenue, Contribution Margin After Ad Spend",
    "Benchmark Basis": "Trailing 30d/60d trend plus channel share trend",
    "Scope Type": "Blended cross-platform"
  },
  {
    "Section": "Executive Summary",
    "Metric Name": "Store Revenue",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Must Have",
    "Formula": "Total website/store revenue for the selected period",
    "Where It Appears in the Dashboard": "Executive summary cards",
    "What It Means": "The main sales truth from your store or analytics stack.",
    "Healthy / Good Signal": "Healthy when revenue rises with stable efficiency and margin quality.",
    "Warning / Bad Signal": "Warning if revenue is up only because of discounting or weak profit quality.",
    "Best Paired With": "Orders, AOV, MER, Gross Profit",
    "Benchmark Basis": "Day-of-week baseline plus trailing 30d median",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Executive Summary",
    "Metric Name": "Orders",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Must Have",
    "Formula": "Count of completed purchases",
    "Where It Appears in the Dashboard": "Executive summary cards",
    "What It Means": "Shows how many purchase events turned into real orders.",
    "Healthy / Good Signal": "Healthy when order growth is supported by stable CAC and CVR.",
    "Warning / Bad Signal": "Warning if orders rise but AOV or profit quality falls sharply.",
    "Best Paired With": "Revenue, AOV, Purchase CVR",
    "Benchmark Basis": "Trailing 30d average and same-weekday baseline",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Executive Summary",
    "Metric Name": "MER",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Store Revenue / Total Ad Spend",
    "Where It Appears in the Dashboard": "Executive summary cards",
    "What It Means": "Top-line blended efficiency metric for the whole business.",
    "Healthy / Good Signal": "Healthy when stable or improving at your target spend level.",
    "Warning / Bad Signal": "Warning if MER falls while spend increases.",
    "Best Paired With": "Blended ROAS, Contribution Margin After Ad Spend, New Customer CAC",
    "Benchmark Basis": "Trailing median plus mature operating range",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Executive Summary",
    "Metric Name": "Blended ROAS",
    "Source": "Custom",
    "Level": "Account",
    "Priority": "Must Have",
    "Formula": "Total attributed revenue across channels / Total ad spend",
    "Where It Appears in the Dashboard": "Executive summary cards",
    "What It Means": "Shows return from channel-attributed revenue in one blended view.",
    "Healthy / Good Signal": "Healthy when improving without hiding weak store-level truth.",
    "Warning / Bad Signal": "Warning if strong here but weak on MER or store revenue.",
    "Best Paired With": "MER, Store Revenue, Tracking Gap Signal",
    "Benchmark Basis": "Trailing 30d average and platform-to-store variance",
    "Scope Type": "Blended cross-platform"
  },
  {
    "Section": "Executive Summary",
    "Metric Name": "AOV",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Must Have",
    "Formula": "Revenue / Orders",
    "Where It Appears in the Dashboard": "Executive summary cards",
    "What It Means": "Shows average order size and offer quality.",
    "Healthy / Good Signal": "Healthy when stable or rising without hurting CVR too much.",
    "Warning / Bad Signal": "Warning if AOV rises only because order volume collapses.",
    "Best Paired With": "Orders, Purchase CVR, Profit per Order",
    "Benchmark Basis": "Trailing 60d median",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "Impressions",
    "Source": "Meta / Google / TikTok / Snap",
    "Level": "Account / Campaign / Ad Set / Ad",
    "Priority": "Must Have",
    "Formula": "Total ad impressions",
    "Where It Appears in the Dashboard": "Traffic and paid media overview",
    "What It Means": "How many times ads were served.",
    "Healthy / Good Signal": "Healthy when impressions scale with useful clicks and conversions.",
    "Warning / Bad Signal": "Warning if impressions rise with weak CTR and rising frequency.",
    "Best Paired With": "Reach, Frequency, CTR",
    "Benchmark Basis": "Channel baseline and trend",
    "Scope Type": "Platform-specific"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "Reach",
    "Source": "Meta / Google / TikTok / Snap",
    "Level": "Account / Campaign / Ad Set / Ad",
    "Priority": "Must Have",
    "Formula": "Unique accounts/users reached",
    "Where It Appears in the Dashboard": "Traffic and paid media overview",
    "What It Means": "Shows audience breadth.",
    "Healthy / Good Signal": "Healthy when reach grows before frequency becomes excessive.",
    "Warning / Bad Signal": "Warning if reach stalls while frequency climbs.",
    "Best Paired With": "Frequency, CPM, CTR",
    "Benchmark Basis": "Channel baseline and prospecting benchmark",
    "Scope Type": "Platform-specific"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "Frequency",
    "Source": "Meta / Google / TikTok / Snap",
    "Level": "Account / Campaign / Ad Set / Ad",
    "Priority": "Must Have",
    "Formula": "Impressions / Reach",
    "Where It Appears in the Dashboard": "Traffic and paid media overview",
    "What It Means": "Shows how often the average person saw your ad.",
    "Healthy / Good Signal": "Healthy when controlled and paired with stable CTR and CVR.",
    "Warning / Bad Signal": "Warning when rising frequency is paired with falling CTR.",
    "Best Paired With": "CTR, CPM, Purchase CVR",
    "Benchmark Basis": "Prospecting and retargeting ranges separately",
    "Scope Type": "Platform-specific"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "Clicks",
    "Source": "Meta / Google / TikTok / Snap",
    "Level": "Account / Campaign / Ad Set / Ad",
    "Priority": "Must Have",
    "Formula": "Total ad clicks",
    "Where It Appears in the Dashboard": "Traffic and paid media overview",
    "What It Means": "Basic response volume from paid traffic.",
    "Healthy / Good Signal": "Healthy when clicks rise with stable CPC and good downstream quality.",
    "Warning / Bad Signal": "Warning if click growth does not convert into sessions or purchases.",
    "Best Paired With": "CPC, Sessions, Revenue per Click",
    "Benchmark Basis": "Trend only",
    "Scope Type": "Platform-specific"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "CTR",
    "Source": "Meta / Google / TikTok / Snap",
    "Level": "Account / Campaign / Ad Set / Ad",
    "Priority": "Must Have",
    "Formula": "Clicks / Impressions",
    "Where It Appears in the Dashboard": "Traffic and paid media overview",
    "What It Means": "Measures how well the ad hook and audience match are working.",
    "Healthy / Good Signal": "Healthy when stable or rising while CVR also holds.",
    "Warning / Bad Signal": "Warning if low CTR limits scale or drops as frequency rises.",
    "Best Paired With": "Frequency, CVR, CPC",
    "Benchmark Basis": "Channel-specific baseline by campaign type",
    "Scope Type": "Platform-specific"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "CPC",
    "Source": "Meta / Google / TikTok / Snap",
    "Level": "Account / Campaign / Ad Set / Ad",
    "Priority": "Must Have",
    "Formula": "Spend / Clicks",
    "Where It Appears in the Dashboard": "Traffic and paid media overview",
    "What It Means": "Shows the cost paid for each click.",
    "Healthy / Good Signal": "Healthy when CPC is stable relative to CVR and AOV.",
    "Warning / Bad Signal": "Warning if CPC rises because CTR weakens or auction costs rise.",
    "Best Paired With": "CTR, CPM, Revenue per Click",
    "Benchmark Basis": "Channel baseline plus trailing 30d",
    "Scope Type": "Platform-specific"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "CPM",
    "Source": "Meta / Google / TikTok / Snap",
    "Level": "Account / Campaign / Ad Set / Ad",
    "Priority": "Must Have",
    "Formula": "Spend / Impressions x 1000",
    "Where It Appears in the Dashboard": "Traffic and paid media overview",
    "What It Means": "Shows auction cost pressure per thousand impressions.",
    "Healthy / Good Signal": "Healthy when CPM is justified by conversion quality.",
    "Warning / Bad Signal": "Warning if CPM rises while CVR and CTR weaken.",
    "Best Paired With": "CTR, Reach, Frequency",
    "Benchmark Basis": "Channel baseline and seasonal comparison",
    "Scope Type": "Platform-specific"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "Landing Page Views",
    "Source": "Meta / Google / TikTok / Snap",
    "Level": "Account / Campaign / Ad Set / Ad",
    "Priority": "Nice to Have",
    "Formula": "Sessions that successfully loaded the landing page after an ad click",
    "Where It Appears in the Dashboard": "Traffic and paid media overview",
    "What It Means": "A cleaner post-click quality metric than clicks alone.",
    "Healthy / Good Signal": "Healthy when LPVs track closely with clicks and sessions.",
    "Warning / Bad Signal": "Warning if LPVs lag far behind clicks.",
    "Best Paired With": "Clicks, Sessions, LPV Rate",
    "Benchmark Basis": "Trend and click-to-LPV gap",
    "Scope Type": "Platform-specific"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "LPV Rate",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Nice to Have",
    "Formula": "Landing Page Views / Clicks",
    "Where It Appears in the Dashboard": "Traffic and paid media overview",
    "What It Means": "Shows how efficiently clicks become real page loads.",
    "Healthy / Good Signal": "Healthy when stable and close to your normal range.",
    "Warning / Bad Signal": "Warning if low due to slow pages, broken links, or low-quality placements.",
    "Best Paired With": "Clicks, Sessions, Bounce Rate",
    "Benchmark Basis": "Trailing 30d normal range",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "Sessions",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Must Have",
    "Formula": "Total website sessions",
    "Where It Appears in the Dashboard": "Traffic and site quality",
    "What It Means": "Main website traffic truth for the selected period.",
    "Healthy / Good Signal": "Healthy when session growth converts into quality funnel activity.",
    "Warning / Bad Signal": "Warning if sessions rise without corresponding funnel progress.",
    "Best Paired With": "Engagement Rate, View Content Rate, Purchase CVR",
    "Benchmark Basis": "Day-of-week baseline",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "Engaged Sessions",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Nice to Have",
    "Formula": "Sessions that meet your engagement threshold",
    "Where It Appears in the Dashboard": "Traffic and site quality",
    "What It Means": "Shows better traffic quality than raw sessions alone.",
    "Healthy / Good Signal": "Healthy when a high share of sessions are engaged.",
    "Warning / Bad Signal": "Warning if paid traffic is creating many low-intent visits.",
    "Best Paired With": "Sessions, Engagement Rate, Purchase CVR",
    "Benchmark Basis": "Trailing median",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "Engagement Rate",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Nice to Have",
    "Formula": "Engaged Sessions / Sessions",
    "Where It Appears in the Dashboard": "Traffic and site quality",
    "What It Means": "Quick read on session quality and on-site relevance.",
    "Healthy / Good Signal": "Healthy when stable or improving while traffic scales.",
    "Warning / Bad Signal": "Warning if it falls after a creative or audience expansion.",
    "Best Paired With": "Bounce Rate, View Content Rate, Purchase CVR",
    "Benchmark Basis": "Trailing median and source-level baseline",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "Bounce Rate",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Nice to Have",
    "Formula": "Single-page or non-engaged sessions / Sessions",
    "Where It Appears in the Dashboard": "Traffic and site quality",
    "What It Means": "Helpful for spotting poor traffic quality or message mismatch.",
    "Healthy / Good Signal": "Healthy when lower over time for comparable traffic.",
    "Warning / Bad Signal": "Warning if high after a landing page or targeting change.",
    "Best Paired With": "Sessions, CTR, Purchase CVR",
    "Benchmark Basis": "Source-level baseline",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "View Content",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Must Have",
    "Formula": "Count of product-detail or content-view events",
    "Where It Appears in the Dashboard": "Traffic and site quality",
    "What It Means": "Shows whether visitors are actually reaching product interest pages.",
    "Healthy / Good Signal": "Healthy when rising with qualified traffic and strong ATC rate.",
    "Warning / Bad Signal": "Warning if sessions rise but view content stays flat.",
    "Best Paired With": "Sessions, View Content Rate, Add to Cart Rate",
    "Benchmark Basis": "Trailing 30d range",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "View Content Rate",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "View Content / Sessions",
    "Where It Appears in the Dashboard": "Traffic and site quality",
    "What It Means": "Early signal for traffic quality and landing page relevance.",
    "Healthy / Good Signal": "Healthy when strong traffic reaches product detail pages quickly.",
    "Warning / Bad Signal": "Warning if low because users bounce before seeing product detail.",
    "Best Paired With": "Engagement Rate, Add to Cart Rate, CTR",
    "Benchmark Basis": "Day-of-week baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Add to Cart",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Must Have",
    "Formula": "Count of add-to-cart events",
    "Where It Appears in the Dashboard": "Funnel metrics",
    "What It Means": "Shows strong product intent before checkout.",
    "Healthy / Good Signal": "Healthy when it scales with sessions and product views.",
    "Warning / Bad Signal": "Warning if product interest is weak despite good traffic volume.",
    "Best Paired With": "Add to Cart Rate, Begin Checkout, Purchase CVR",
    "Benchmark Basis": "Trend and source mix",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Add to Cart Rate",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Add to Cart / Sessions",
    "Where It Appears in the Dashboard": "Funnel metrics",
    "What It Means": "Quick read on how convincing the landing page and offer are.",
    "Healthy / Good Signal": "Healthy when stable or rising with similar traffic quality.",
    "Warning / Bad Signal": "Warning if it drops after traffic scale or pricing changes.",
    "Best Paired With": "View Content Rate, Purchase CVR, AOV",
    "Benchmark Basis": "Day-of-week baseline and traffic-source baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Cart-to-Checkout Rate",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Begin Checkout / Add to Cart",
    "Where It Appears in the Dashboard": "Funnel metrics",
    "What It Means": "Shows how many carts move forward into checkout.",
    "Healthy / Good Signal": "Healthy when cart interest turns into real purchase intent.",
    "Warning / Bad Signal": "Warning if carts are created but checkout starts stay weak.",
    "Best Paired With": "Add to Cart, Begin Checkout, Checkout-to-Purchase Rate",
    "Benchmark Basis": "Trailing 30d normal range",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Begin Checkout",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Must Have",
    "Formula": "Count of checkout-start events",
    "Where It Appears in the Dashboard": "Funnel metrics",
    "What It Means": "Shows serious buying intent after cart creation.",
    "Healthy / Good Signal": "Healthy when checkout starts rise with add to cart volume.",
    "Warning / Bad Signal": "Warning if checkout friction appears before payment.",
    "Best Paired With": "Cart-to-Checkout Rate, Purchase CVR",
    "Benchmark Basis": "Trend and device split",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Checkout Initiation Rate",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Nice to Have",
    "Formula": "Begin Checkout / Sessions",
    "Where It Appears in the Dashboard": "Funnel metrics",
    "What It Means": "Blends traffic quality and pre-checkout friction into one rate.",
    "Healthy / Good Signal": "Healthy when quality traffic moves steadily into checkout.",
    "Warning / Bad Signal": "Warning if traffic looks healthy but checkout starts stay low.",
    "Best Paired With": "Add to Cart Rate, Purchase CVR, Device Split",
    "Benchmark Basis": "Day-of-week baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Purchases",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Must Have",
    "Formula": "Count of completed purchase events",
    "Where It Appears in the Dashboard": "Funnel metrics",
    "What It Means": "The final conversion event in the site funnel.",
    "Healthy / Good Signal": "Healthy when purchases grow with acceptable CAC and margin.",
    "Warning / Bad Signal": "Warning if attributed purchases diverge sharply from website orders.",
    "Best Paired With": "Orders, Purchase CVR, Tracking Gap Signal",
    "Benchmark Basis": "Website baseline and platform comparison",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Purchase Conversion Rate",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Purchases / Sessions",
    "Where It Appears in the Dashboard": "Funnel metrics",
    "What It Means": "Main site conversion efficiency metric.",
    "Healthy / Good Signal": "Healthy when stable or rising at target traffic scale.",
    "Warning / Bad Signal": "Warning if it falls after creative or audience expansion.",
    "Best Paired With": "CTR, AOV, Add to Cart Rate",
    "Benchmark Basis": "Day-of-week baseline plus maturity-adjusted range",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Checkout-to-Purchase Rate",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Purchases / Begin Checkout",
    "Where It Appears in the Dashboard": "Funnel metrics",
    "What It Means": "Measures checkout completion quality.",
    "Healthy / Good Signal": "Healthy when checkout completion stays strong across devices.",
    "Warning / Bad Signal": "Warning if payment, shipping, trust, or speed issues appear.",
    "Best Paired With": "Begin Checkout, Device Split, Refund Rate",
    "Benchmark Basis": "Trailing 30d normal range",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Revenue & Order Economics",
    "Metric Name": "Gross Revenue",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Nice to Have",
    "Formula": "Total sales before refunds or returns",
    "Where It Appears in the Dashboard": "Revenue and order economics",
    "What It Means": "Top-line sales output before deductions.",
    "Healthy / Good Signal": "Healthy when paired with solid margin and low refund pressure.",
    "Warning / Bad Signal": "Warning if gross revenue looks strong but net revenue is weak.",
    "Best Paired With": "Net Revenue, Refund Rate, Gross Margin %",
    "Benchmark Basis": "Trend only",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Revenue & Order Economics",
    "Metric Name": "Net Revenue",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Must Have",
    "Formula": "Gross revenue minus refunds, returns, and cancellations",
    "Where It Appears in the Dashboard": "Revenue and order economics",
    "What It Means": "A more decision-useful revenue truth than gross sales alone.",
    "Healthy / Good Signal": "Healthy when it scales with stable CAC and profit quality.",
    "Warning / Bad Signal": "Warning if refund drag grows.",
    "Best Paired With": "Gross Revenue, Refund Rate, Contribution Margin",
    "Benchmark Basis": "Trailing median and profit baseline",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Revenue & Order Economics",
    "Metric Name": "Revenue per Session",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Store Revenue / Sessions",
    "Where It Appears in the Dashboard": "Revenue and order economics",
    "What It Means": "Shows monetization efficiency of site traffic.",
    "Healthy / Good Signal": "Healthy when steady or rising as traffic scales.",
    "Warning / Bad Signal": "Warning if sessions grow faster than revenue.",
    "Best Paired With": "Purchase CVR, AOV, Revenue per Click",
    "Benchmark Basis": "Day-of-week baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Revenue & Order Economics",
    "Metric Name": "Revenue per Click",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Attributed or store revenue / Clicks",
    "Where It Appears in the Dashboard": "Revenue and order economics",
    "What It Means": "Quick way to connect media traffic to money outcome.",
    "Healthy / Good Signal": "Healthy when enough value is produced per click to cover CPC.",
    "Warning / Bad Signal": "Warning if clicks are cheap but still unproductive.",
    "Best Paired With": "CPC, Purchase CVR, AOV",
    "Benchmark Basis": "Channel-specific baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Revenue & Order Economics",
    "Metric Name": "Refund Rate",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Nice to Have",
    "Formula": "Refund value or refunded orders / total revenue or total orders",
    "Where It Appears in the Dashboard": "Revenue and order economics",
    "What It Means": "Shows revenue quality and post-purchase satisfaction risk.",
    "Healthy / Good Signal": "Healthy when stable and low relative to your category.",
    "Warning / Bad Signal": "Warning if higher promo volume drives poor-quality orders.",
    "Best Paired With": "Net Revenue, Gross Revenue, Profit per Order",
    "Benchmark Basis": "Trailing 90d and promo-period comparison",
    "Scope Type": "Website/store metric"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "CPA / CAC",
    "Source": "Meta / Google / TikTok / Snap",
    "Level": "Account / Campaign / Ad Set / Ad",
    "Priority": "Must Have",
    "Formula": "Spend / Purchases or Spend / New Customers based on chosen definition",
    "Where It Appears in the Dashboard": "Paid media efficiency and channel comparison",
    "What It Means": "Core acquisition efficiency metric.",
    "Healthy / Good Signal": "Healthy when stable at your target scale and margin profile.",
    "Warning / Bad Signal": "Warning if it rises faster than AOV or contribution margin.",
    "Best Paired With": "AOV, MER, New Customer Rate",
    "Benchmark Basis": "Trailing 30d and channel benchmark",
    "Scope Type": "Platform-specific or blended"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "New Customer CAC",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Spend / New Customers",
    "Where It Appears in the Dashboard": "Paid media efficiency and channel comparison",
    "What It Means": "Best efficiency metric for growth-focused paid media.",
    "Healthy / Good Signal": "Healthy when new customer cost still leaves room for margin or LTV payback.",
    "Warning / Bad Signal": "Warning if revenue is coming mainly from existing customers while this worsens.",
    "Best Paired With": "New Customer Rate, Contribution Margin, Repeat Purchase Rate",
    "Benchmark Basis": "Trailing 60d mature baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "ROAS by Channel",
    "Source": "Meta / Google / TikTok / Snap",
    "Level": "Account / Campaign / Ad Set / Ad",
    "Priority": "Must Have",
    "Formula": "Channel-attributed revenue / channel spend",
    "Where It Appears in the Dashboard": "Paid media efficiency and channel comparison",
    "What It Means": "Platform-level return reading for Meta, Google, Snap, and TikTok separately.",
    "Healthy / Good Signal": "Healthy when strong without conflicting with MER.",
    "Warning / Bad Signal": "Warning if platform ROAS is strong but store truth is weak.",
    "Best Paired With": "MER, Store Revenue, Tracking Gap Signal",
    "Benchmark Basis": "Channel-specific baseline by funnel stage",
    "Scope Type": "Platform-specific"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "Cost per Add to Cart",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Nice to Have",
    "Formula": "Spend / Add to Cart",
    "Where It Appears in the Dashboard": "Paid media efficiency and channel comparison",
    "What It Means": "Useful early-funnel efficiency metric.",
    "Healthy / Good Signal": "Healthy when cheap ATCs still convert into checkouts and purchases.",
    "Warning / Bad Signal": "Warning if cheap carts do not become sales.",
    "Best Paired With": "Cart-to-Checkout Rate, Purchase CVR",
    "Benchmark Basis": "Traffic-source baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "Cost per Checkout",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Nice to Have",
    "Formula": "Spend / Begin Checkout",
    "Where It Appears in the Dashboard": "Paid media efficiency and channel comparison",
    "What It Means": "Mid-funnel efficiency read before final purchase.",
    "Healthy / Good Signal": "Healthy when checkouts convert into purchases at a good rate.",
    "Warning / Bad Signal": "Warning if checkout costs look fine but completion is poor.",
    "Best Paired With": "Checkout-to-Purchase Rate, CPA",
    "Benchmark Basis": "Traffic-source baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "Spend Share",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Channel Spend / Total Ad Spend",
    "Where It Appears in the Dashboard": "Paid media efficiency and channel comparison",
    "What It Means": "Shows how budget is distributed across channels.",
    "Healthy / Good Signal": "Healthy when spend share broadly matches scalable contribution.",
    "Warning / Bad Signal": "Warning if one channel absorbs budget without revenue support.",
    "Best Paired With": "Revenue Share, Channel Efficiency Index",
    "Benchmark Basis": "Rolling channel mix",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "Revenue Share",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Channel Revenue / Total Revenue",
    "Where It Appears in the Dashboard": "Paid media efficiency and channel comparison",
    "What It Means": "Shows how much of business output each channel is driving.",
    "Healthy / Good Signal": "Healthy when higher spend share is justified by revenue share and margin quality.",
    "Warning / Bad Signal": "Warning if revenue share lags spend share for too long.",
    "Best Paired With": "Spend Share, MER, Channel Efficiency Index",
    "Benchmark Basis": "Rolling channel mix",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "Channel Efficiency Index",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Nice to Have",
    "Formula": "A custom score comparing channel share of spend vs share of revenue and/or profit",
    "Where It Appears in the Dashboard": "Paid media efficiency and channel comparison",
    "What It Means": "Helps spot underfunded winners and overfunded laggards.",
    "Healthy / Good Signal": "Healthy when strong channels keep outperforming their spend share.",
    "Warning / Bad Signal": "Warning if a channel takes budget but under-contributes.",
    "Best Paired With": "Spend Share, Revenue Share, MER",
    "Benchmark Basis": "Trailing 30d and 90d comparison",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Customer Quality",
    "Metric Name": "New Customer Rate",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Must Have",
    "Formula": "New Customers / Total Customers or Orders",
    "Where It Appears in the Dashboard": "New vs returning customer performance",
    "What It Means": "Shows how much of performance comes from true acquisition.",
    "Healthy / Good Signal": "Healthy when growth periods increase new customer contribution without breaking CAC.",
    "Warning / Bad Signal": "Warning if reported growth is mostly existing customer harvest.",
    "Best Paired With": "New Customer CAC, Returning Customer Rate, MER",
    "Benchmark Basis": "Trailing 60d mature baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Customer Quality",
    "Metric Name": "Returning Customer Rate",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Nice to Have",
    "Formula": "Returning Customers / Total Customers or Orders",
    "Where It Appears in the Dashboard": "New vs returning customer performance",
    "What It Means": "Shows repeat demand and brand loyalty.",
    "Healthy / Good Signal": "Healthy when balanced with your growth objective and channel mix.",
    "Warning / Bad Signal": "Warning if it rises only because new customer acquisition weakens.",
    "Best Paired With": "New Customer Rate, Repeat Purchase Rate",
    "Benchmark Basis": "Trailing 90d",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Customer Quality",
    "Metric Name": "New Customer Revenue Share",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Revenue from new customers / total revenue",
    "Where It Appears in the Dashboard": "New vs returning customer performance",
    "What It Means": "Shows how much revenue is truly expansion-oriented.",
    "Healthy / Good Signal": "Healthy when new-customer revenue is efficient and profitable.",
    "Warning / Bad Signal": "Warning if revenue growth comes from returning buyers only.",
    "Best Paired With": "New Customer CAC, Contribution Margin",
    "Benchmark Basis": "Trailing 60d",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Customer Quality",
    "Metric Name": "Returning Customer Revenue Share",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Nice to Have",
    "Formula": "Revenue from returning customers / total revenue",
    "Where It Appears in the Dashboard": "New vs returning customer performance",
    "What It Means": "Shows dependence on existing demand and retention strength.",
    "Healthy / Good Signal": "Healthy when strong retention supports profitable scaling.",
    "Warning / Bad Signal": "Warning if it hides weak acquisition performance.",
    "Best Paired With": "New Customer Rate, Repeat Purchase Rate",
    "Benchmark Basis": "Trailing 90d",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Customer Quality",
    "Metric Name": "Repeat Purchase Rate",
    "Source": "Website",
    "Level": "Website",
    "Priority": "Nice to Have",
    "Formula": "Customers with more than one purchase / total customers",
    "Where It Appears in the Dashboard": "New vs returning customer performance",
    "What It Means": "Helps estimate downstream customer quality and payback potential.",
    "Healthy / Good Signal": "Healthy when rising cohorts support broader CAC tolerance.",
    "Warning / Bad Signal": "Warning if first-order growth does not convert into repeat behavior.",
    "Best Paired With": "New Customer CAC, LTV if available",
    "Benchmark Basis": "Cohort-based baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Profitability",
    "Metric Name": "Gross Margin %",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "(Revenue - COGS) / Revenue",
    "Where It Appears in the Dashboard": "Profitability and contribution metrics",
    "What It Means": "Shows the share of sales left after product cost.",
    "Healthy / Good Signal": "Healthy when stable enough to support your acquisition model.",
    "Warning / Bad Signal": "Warning if margin compresses while CAC rises.",
    "Best Paired With": "Gross Profit, Contribution Margin, AOV",
    "Benchmark Basis": "Trailing 90d and product mix comparison",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Profitability",
    "Metric Name": "Gross Profit",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Revenue - COGS",
    "Where It Appears in the Dashboard": "Profitability and contribution metrics",
    "What It Means": "Better than revenue alone for judging business quality.",
    "Healthy / Good Signal": "Healthy when gross profit scales with controlled CAC.",
    "Warning / Bad Signal": "Warning if revenue grows but gross profit does not.",
    "Best Paired With": "Gross Margin %, Ad Spend, Contribution Margin",
    "Benchmark Basis": "Trailing 60d",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Profitability",
    "Metric Name": "Contribution Margin",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Revenue - COGS - variable non-ad costs",
    "Where It Appears in the Dashboard": "Profitability and contribution metrics",
    "What It Means": "Shows whether orders still create useful contribution before ad cost.",
    "Healthy / Good Signal": "Healthy when contribution is stable enough to support paid growth.",
    "Warning / Bad Signal": "Warning if hidden costs erode apparent success.",
    "Best Paired With": "Gross Profit, Refund Rate, AOV",
    "Benchmark Basis": "Trailing 90d",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Profitability",
    "Metric Name": "Contribution Margin After Ad Spend",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Revenue - COGS - variable non-ad costs - ad spend",
    "Where It Appears in the Dashboard": "Profitability and contribution metrics",
    "What It Means": "Best single read on whether paid growth is truly profitable.",
    "Healthy / Good Signal": "Healthy when positive and improving at target scale.",
    "Warning / Bad Signal": "Warning if ROAS looks fine but this turns weak or negative.",
    "Best Paired With": "MER, New Customer CAC, Gross Margin %",
    "Benchmark Basis": "Trailing median plus maturity range",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Profitability",
    "Metric Name": "Profit per Order",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Nice to Have",
    "Formula": "Contribution Margin After Ad Spend / Orders",
    "Where It Appears in the Dashboard": "Profitability and contribution metrics",
    "What It Means": "Shows how much economic value each order is really creating.",
    "Healthy / Good Signal": "Healthy when stable enough to justify scale.",
    "Warning / Bad Signal": "Warning if order growth is profitable only on paper.",
    "Best Paired With": "AOV, CPA, Gross Margin %",
    "Benchmark Basis": "Trailing 60d",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Creative Fatigue Signal",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "A rule-based signal using frequency up + CTR down + CPC up and/or CVR down",
    "Where It Appears in the Dashboard": "Diagnostics, benchmarks, and alert modules",
    "What It Means": "Helps catch ad wear-out before performance collapses.",
    "Healthy / Good Signal": "Healthy when frequency can rise without hurting CTR or CVR.",
    "Warning / Bad Signal": "Warning when frequency rises while CTR falls and CPC rises.",
    "Best Paired With": "Frequency, CTR, CPC, Purchase CVR",
    "Benchmark Basis": "7d vs 30d directional check",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Scaling Efficiency Signal",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Checks whether higher spend is still producing proportional revenue, MER, or contribution",
    "Where It Appears in the Dashboard": "Diagnostics, benchmarks, and alert modules",
    "What It Means": "Helps judge whether budget increases are healthy.",
    "Healthy / Good Signal": "Healthy when more spend still maintains acceptable economics.",
    "Warning / Bad Signal": "Warning when spend grows but MER, CAC, or contribution worsen materially.",
    "Best Paired With": "Spend, Store Revenue, MER, Contribution Margin After Ad Spend",
    "Benchmark Basis": "Current period vs previous period and vs trailing baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Under-Scaling Signal",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Nice to Have",
    "Formula": "Flags campaigns/channels with strong efficiency, low spend, and low saturation",
    "Where It Appears in the Dashboard": "Diagnostics, benchmarks, and alert modules",
    "What It Means": "Helps identify winners that may deserve more budget.",
    "Healthy / Good Signal": "Healthy when strong units can still absorb more spend.",
    "Warning / Bad Signal": "Warning if the dashboard never distinguishes true winners from just stable small spend.",
    "Best Paired With": "ROAS by Channel, Frequency, Spend Share",
    "Benchmark Basis": "Efficiency percentile plus low-saturation check",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Tracking Gap Signal",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "Compares platform-attributed revenue/purchases vs website/store truth",
    "Where It Appears in the Dashboard": "Diagnostics, benchmarks, and alert modules",
    "What It Means": "Highlights over-attribution, under-attribution, or broken tracking.",
    "Healthy / Good Signal": "Healthy when differences stay inside the expected range for your setup.",
    "Warning / Bad Signal": "Warning if the gap widens sharply after setup or campaign changes.",
    "Best Paired With": "Store Revenue, Platform ROAS, Purchases",
    "Benchmark Basis": "Historical normal gap range",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Benchmark Variance",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "(Current metric - expected baseline) / expected baseline",
    "Where It Appears in the Dashboard": "Diagnostics, benchmarks, and alert modules",
    "What It Means": "Shows how far current performance sits from normal.",
    "Healthy / Good Signal": "Healthy when variance is explainable and within normal control bands.",
    "Warning / Bad Signal": "Warning when key efficiency metrics move materially outside normal range.",
    "Best Paired With": "Volatility Score, Anomaly Flag",
    "Benchmark Basis": "Day-of-week and seasonal adjusted baseline",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Volatility Score",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Nice to Have",
    "Formula": "A rolling measure of how unstable a metric is over time",
    "Where It Appears in the Dashboard": "Diagnostics, benchmarks, and alert modules",
    "What It Means": "Helps judge whether a move is meaningful or just noisy.",
    "Healthy / Good Signal": "Healthy when core metrics are stable enough for confident decisions.",
    "Warning / Bad Signal": "Warning when decisions are being made on highly unstable signals.",
    "Best Paired With": "Benchmark Variance, Anomaly Flag",
    "Benchmark Basis": "Rolling 30d standard-deviation style method",
    "Scope Type": "Custom business metric"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Anomaly Flag",
    "Source": "Custom",
    "Level": "Account / Website",
    "Priority": "Must Have",
    "Formula": "A signal triggered when a metric moves outside its expected operating band",
    "Where It Appears in the Dashboard": "Diagnostics, benchmarks, and alert modules",
    "What It Means": "Makes it easier to notice real breaks quickly.",
    "Healthy / Good Signal": "Healthy when alerts are rare and meaningful.",
    "Warning / Bad Signal": "Warning if too many alerts create noise or if large moves are missed.",
    "Best Paired With": "Benchmark Variance, Volatility Score, Spend",
    "Benchmark Basis": "Expected range plus confidence weighting",
    "Scope Type": "Custom business metric"
  }
] as const;

export const dashboardLayout = [
  {
    "Dashboard Section": "Executive Summary",
    "Widget Name": "Top KPI Cards",
    "Widget Type": "KPI cards",
    "Key Metrics Included": "Store Revenue, Orders, Total Ad Spend, MER, Blended ROAS, AOV",
    "Suggested Placement": "Top row",
    "Decision It Supports": "Fast business read",
    "Build Note": "Show current period vs previous period and benchmark status",
    "Priority": "Must Have"
  },
  {
    "Dashboard Section": "Executive Summary",
    "Widget Name": "Performance Change Strip",
    "Widget Type": "Change summary strip",
    "Key Metrics Included": "Revenue change %, Spend change %, MER change, Orders change",
    "Suggested Placement": "Below KPI cards",
    "Decision It Supports": "What changed fast",
    "Build Note": "Use green/red directional cues carefully",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Traffic & Site Quality",
    "Widget Name": "Traffic Overview",
    "Widget Type": "Line/column chart",
    "Key Metrics Included": "Sessions, Engaged Sessions, Clicks, CPC",
    "Suggested Placement": "Upper middle",
    "Decision It Supports": "Traffic quality and cost trend",
    "Build Note": "Default to daily trend with previous-period comparison",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Traffic & Site Quality",
    "Widget Name": "Traffic Quality Table",
    "Widget Type": "Table",
    "Key Metrics Included": "CTR, LPV Rate, Engagement Rate, Bounce Rate, View Content Rate",
    "Suggested Placement": "Upper middle",
    "Decision It Supports": "Spot traffic quality problems",
    "Build Note": "Break down by channel and landing page if possible",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Funnel Metrics",
    "Widget Name": "Funnel Snapshot",
    "Widget Type": "Funnel chart",
    "Key Metrics Included": "Sessions, View Content, Add to Cart, Begin Checkout, Purchases",
    "Suggested Placement": "Center",
    "Decision It Supports": "Find biggest drop-off step",
    "Build Note": "Show step-to-step rates next to counts",
    "Priority": "Must Have"
  },
  {
    "Dashboard Section": "Funnel Metrics",
    "Widget Name": "Funnel Conversion Cards",
    "Widget Type": "KPI cards",
    "Key Metrics Included": "View Content Rate, Add to Cart Rate, Cart-to-Checkout Rate, Checkout-to-Purchase Rate, Purchase Conversion Rate",
    "Suggested Placement": "Center",
    "Decision It Supports": "Quick funnel health read",
    "Build Note": "Benchmark each step vs account norm",
    "Priority": "Must Have"
  },
  {
    "Dashboard Section": "Revenue & Order Economics",
    "Widget Name": "Revenue Trend",
    "Widget Type": "Line chart",
    "Key Metrics Included": "Store Revenue, Orders, AOV, Revenue per Session",
    "Suggested Placement": "Upper right",
    "Decision It Supports": "See sales quality trend",
    "Build Note": "Allow daily/weekly toggle",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Revenue & Order Economics",
    "Widget Name": "Order Economics Table",
    "Widget Type": "Table",
    "Key Metrics Included": "Gross Revenue, Net Revenue, AOV, Revenue per Session, Revenue per Click, Refund Rate",
    "Suggested Placement": "Upper right",
    "Decision It Supports": "Read sales quality and monetization",
    "Build Note": "Include warning notes if refund rate rises",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Paid Media Efficiency",
    "Widget Name": "Channel Scorecard",
    "Widget Type": "Comparison table",
    "Key Metrics Included": "Spend, Revenue Share, Spend Share, CPA/CAC, ROAS by Channel, MER contribution",
    "Suggested Placement": "Middle right",
    "Decision It Supports": "Allocate budget better",
    "Build Note": "One row per channel: Meta, Google, TikTok, Snap",
    "Priority": "Must Have"
  },
  {
    "Dashboard Section": "Paid Media Efficiency",
    "Widget Name": "Efficiency Trend",
    "Widget Type": "Multi-series line chart",
    "Key Metrics Included": "CPA/CAC, Blended ROAS, MER, CPC, CPM",
    "Suggested Placement": "Middle right",
    "Decision It Supports": "See efficiency trend over time",
    "Build Note": "Best with 30-day view",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Customer Quality",
    "Widget Name": "Customer Mix Cards",
    "Widget Type": "KPI cards",
    "Key Metrics Included": "New Customer Rate, Returning Customer Rate, New Customer Revenue Share, Returning Customer Revenue Share",
    "Suggested Placement": "Lower middle",
    "Decision It Supports": "Check growth quality",
    "Build Note": "Keep this separated from total revenue widgets",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Customer Quality",
    "Widget Name": "Customer Quality Table",
    "Widget Type": "Table",
    "Key Metrics Included": "New Customer CAC, Repeat Purchase Rate, New Customer Revenue Share",
    "Suggested Placement": "Lower middle",
    "Decision It Supports": "Judge acquisition quality",
    "Build Note": "Mark rows requiring extra data clearly",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Profitability",
    "Widget Name": "Profitability Cards",
    "Widget Type": "KPI cards",
    "Key Metrics Included": "Gross Margin %, Gross Profit, Contribution Margin, Contribution Margin After Ad Spend, Profit per Order",
    "Suggested Placement": "Lower right",
    "Decision It Supports": "Know if growth is actually profitable",
    "Build Note": "Use store truth, not platform revenue alone",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Profitability",
    "Widget Name": "Profitability Trend",
    "Widget Type": "Line chart",
    "Key Metrics Included": "Gross Profit, Contribution Margin After Ad Spend, MER",
    "Suggested Placement": "Lower right",
    "Decision It Supports": "See whether scale is improving the business",
    "Build Note": "Good for daily and weekly views",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Diagnostics & Alerts",
    "Widget Name": "Alerts Panel",
    "Widget Type": "Alert list",
    "Key Metrics Included": "Anomaly Flag, Tracking Gap Signal, Creative Fatigue Signal, Scaling Efficiency Signal",
    "Suggested Placement": "Far right or bottom",
    "Decision It Supports": "Catch issues quickly",
    "Build Note": "Only show high-confidence alerts",
    "Priority": "Must Have"
  },
  {
    "Dashboard Section": "Diagnostics & Alerts",
    "Widget Name": "Benchmark Status Table",
    "Widget Type": "Table",
    "Key Metrics Included": "Benchmark Variance, Volatility Score, Weak/Acceptable/Strong/Exceptional status",
    "Suggested Placement": "Far right or bottom",
    "Decision It Supports": "Know what is normal vs abnormal",
    "Build Note": "Show benchmark confidence level",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Diagnostics & Alerts",
    "Widget Name": "Creative Diagnostics",
    "Widget Type": "Table",
    "Key Metrics Included": "Frequency, CTR, CPC, Purchase CVR, Creative Fatigue Signal",
    "Suggested Placement": "Bottom",
    "Decision It Supports": "Find ad fatigue and refresh needs",
    "Build Note": "Break down by campaign, ad set, and ad",
    "Priority": "Nice to Have"
  },
  {
    "Dashboard Section": "Diagnostics & Alerts",
    "Widget Name": "Scaling Watchlist",
    "Widget Type": "Table",
    "Key Metrics Included": "Spend change, MER change, CPA/CAC change, Under-Scaling Signal, Scaling Efficiency Signal",
    "Suggested Placement": "Bottom",
    "Decision It Supports": "Spot winners to scale and losers to cut",
    "Build Note": "Highlight major deviations from baseline",
    "Priority": "Nice to Have"
  }
] as const;

export const benchmarks = [
  {
    "Benchmark Layer": "Trailing 30-Day Average",
    "Purpose": "Short-term operating baseline",
    "How to Use It": "Use for daily pace reading and fast comparisons.",
    "Notes": "Best for most daily metrics",
    "Suggested Status": "Weak",
    "Definition": "Below expected range",
    "Example Reading": "CAC high, MER weak, CVR below normal",
    "Action Bias": "Investigate quickly"
  },
  {
    "Benchmark Layer": "Trailing 60-Day Average",
    "Purpose": "Medium-stability baseline",
    "How to Use It": "Useful when 30-day performance is noisy.",
    "Notes": "Use when 30-day is too noisy",
    "Suggested Status": "Acceptable",
    "Definition": "Inside normal band",
    "Example Reading": "Performance is near recent norm",
    "Action Bias": "Monitor and optimize steadily"
  },
  {
    "Benchmark Layer": "Trailing 90-Day Average",
    "Purpose": "Longer-term operating baseline",
    "How to Use It": "Better for mature account norms.",
    "Notes": "Good for mature account norms",
    "Suggested Status": "Strong",
    "Definition": "Better than normal",
    "Example Reading": "Efficiency is above baseline with stable volume",
    "Action Bias": "Consider scaling carefully"
  },
  {
    "Benchmark Layer": "Historical Median",
    "Purpose": "Noise-resistant baseline",
    "How to Use It": "Best for unstable metrics such as CAC, CVR, and MER.",
    "Notes": "Very useful for CAC, CVR, MER",
    "Suggested Status": "Exceptional",
    "Definition": "Top historical range",
    "Example Reading": "Performance is unusually strong and stable",
    "Action Bias": "Protect and scale with guardrails"
  },
  {
    "Benchmark Layer": "Day-of-Week Baseline",
    "Purpose": "Daily behavior baseline",
    "How to Use It": "Compare Tuesday to a normal Tuesday, not just to yesterday.",
    "Notes": "Important for daily dashboard reading",
    "Suggested Status": "",
    "Definition": "",
    "Example Reading": "",
    "Action Bias": ""
  },
  {
    "Benchmark Layer": "Seasonal Baseline",
    "Purpose": "Period-adjusted baseline",
    "How to Use It": "Use only when enough history exists.",
    "Notes": "Only if the account has enough historical depth",
    "Suggested Status": "",
    "Definition": "",
    "Example Reading": "",
    "Action Bias": ""
  },
  {
    "Benchmark Layer": "Percentile Bands",
    "Purpose": "Weak / Acceptable / Strong / Exceptional ranges",
    "How to Use It": "Create decision-ready ranges without false precision.",
    "Notes": "Lets you classify weak / acceptable / strong / exceptional",
    "Suggested Status": "",
    "Definition": "",
    "Example Reading": "",
    "Action Bias": ""
  },
  {
    "Benchmark Layer": "Low-Volume Confidence Rule",
    "Purpose": "Confidence modifier",
    "How to Use It": "Mark benchmark confidence as low when volume is too small.",
    "Notes": "Avoid overreacting to tiny samples",
    "Suggested Status": "",
    "Definition": "",
    "Example Reading": "",
    "Action Bias": ""
  },
  {
    "Benchmark Layer": "Maturity Logic",
    "Purpose": "Learning vs mature classification",
    "How to Use It": "Do not benchmark fresh campaigns like stable campaigns.",
    "Notes": "Fresh campaigns need softer expectations",
    "Suggested Status": "",
    "Definition": "",
    "Example Reading": "",
    "Action Bias": ""
  },
  {
    "Benchmark Layer": "Prospecting vs Retargeting Split",
    "Purpose": "Separate benchmark families",
    "How to Use It": "These traffic types should not share one benchmark range.",
    "Notes": "Prospecting and retargeting should not share one norm",
    "Suggested Status": "",
    "Definition": "",
    "Example Reading": "",
    "Action Bias": ""
  }
] as const;

export const sourceMapping = [
  {
    "Metric Name": "Total Ad Spend",
    "Primary Source": "Meta / Google / TikTok / Snap",
    "Raw Fields Needed": "spend",
    "Logic Note": "Sum by date and selected breakdown",
    "Integration Note": "Date plus channel is enough for blended spend"
  },
  {
    "Metric Name": "Store Revenue",
    "Primary Source": "Website / Shopify / GA4",
    "Raw Fields Needed": "total_revenue or purchase_revenue",
    "Logic Note": "Use store truth for final business reading",
    "Integration Note": "Date should align to store timezone"
  },
  {
    "Metric Name": "Orders",
    "Primary Source": "Website / Shopify / GA4",
    "Raw Fields Needed": "transactions or orders_count",
    "Logic Note": "Completed paid orders only if possible",
    "Integration Note": "Exclude canceled orders if your business uses net-order logic"
  },
  {
    "Metric Name": "MER",
    "Primary Source": "Custom",
    "Raw Fields Needed": "store_revenue, total_ad_spend",
    "Logic Note": "Store Revenue / Total Ad Spend",
    "Integration Note": "Uses website/store truth and blended spend"
  },
  {
    "Metric Name": "Blended ROAS",
    "Primary Source": "Custom",
    "Raw Fields Needed": "platform_attributed_revenue, total_ad_spend",
    "Logic Note": "Attributed revenue blended across channels / total spend",
    "Integration Note": "Keep separate from MER"
  },
  {
    "Metric Name": "AOV",
    "Primary Source": "Website / Shopify / GA4",
    "Raw Fields Needed": "revenue, orders",
    "Logic Note": "Revenue / Orders",
    "Integration Note": "Use store revenue source consistently"
  },
  {
    "Metric Name": "Impressions",
    "Primary Source": "Meta / Google / TikTok / Snap",
    "Raw Fields Needed": "impressions",
    "Logic Note": "Platform-native delivery metric",
    "Integration Note": "Available at account/campaign/ad set/ad level"
  },
  {
    "Metric Name": "Reach",
    "Primary Source": "Meta / TikTok / Snap where available",
    "Raw Fields Needed": "reach",
    "Logic Note": "Unique users/accounts reached",
    "Integration Note": "Google may not always expose equivalent in same way"
  },
  {
    "Metric Name": "Frequency",
    "Primary Source": "Meta / TikTok / Snap where available",
    "Raw Fields Needed": "impressions, reach",
    "Logic Note": "Impressions / Reach",
    "Integration Note": "If source does not provide reach, calculate only where valid"
  },
  {
    "Metric Name": "Clicks",
    "Primary Source": "Meta / Google / TikTok / Snap",
    "Raw Fields Needed": "clicks",
    "Logic Note": "Use outbound or link click variant consistently if needed",
    "Integration Note": "Document click definition by source"
  },
  {
    "Metric Name": "CTR",
    "Primary Source": "Meta / Google / TikTok / Snap",
    "Raw Fields Needed": "clicks, impressions",
    "Logic Note": "Clicks / Impressions",
    "Integration Note": "Keep source-specific CTR definitions documented"
  },
  {
    "Metric Name": "CPC",
    "Primary Source": "Meta / Google / TikTok / Snap",
    "Raw Fields Needed": "spend, clicks",
    "Logic Note": "Spend / Clicks",
    "Integration Note": "Consistent click definition matters"
  },
  {
    "Metric Name": "CPM",
    "Primary Source": "Meta / Google / TikTok / Snap",
    "Raw Fields Needed": "spend, impressions",
    "Logic Note": "Spend / Impressions * 1000",
    "Integration Note": "Useful for auction pressure"
  },
  {
    "Metric Name": "Landing Page Views",
    "Primary Source": "Meta / Google where available",
    "Raw Fields Needed": "landing_page_views or equivalent",
    "Logic Note": "Use as post-click quality metric",
    "Integration Note": "Not always directly comparable across platforms"
  },
  {
    "Metric Name": "LPV Rate",
    "Primary Source": "Custom",
    "Raw Fields Needed": "landing_page_views, clicks",
    "Logic Note": "LPV / Clicks",
    "Integration Note": "Only where LPV exists"
  },
  {
    "Metric Name": "Sessions",
    "Primary Source": "Website / GA4",
    "Raw Fields Needed": "sessions",
    "Logic Note": "Main website traffic truth",
    "Integration Note": "Use GA4 or store analytics consistently"
  },
  {
    "Metric Name": "Engaged Sessions",
    "Primary Source": "Website / GA4",
    "Raw Fields Needed": "engaged_sessions",
    "Logic Note": "Better site quality signal than sessions alone",
    "Integration Note": "Requires GA4-style engagement definition"
  },
  {
    "Metric Name": "Engagement Rate",
    "Primary Source": "Website / GA4",
    "Raw Fields Needed": "engaged_sessions, sessions",
    "Logic Note": "Engaged Sessions / Sessions",
    "Integration Note": "GA4 preferred"
  },
  {
    "Metric Name": "Bounce Rate",
    "Primary Source": "Website / GA4",
    "Raw Fields Needed": "bounce_rate or engaged_sessions, sessions",
    "Logic Note": "Use native GA4 bounce rate or derived logic",
    "Integration Note": "Must document exact GA4 definition used"
  },
  {
    "Metric Name": "View Content",
    "Primary Source": "Website / Shopify / GA4",
    "Raw Fields Needed": "view_item or view_content events",
    "Logic Note": "Product-detail view event count",
    "Integration Note": "Pick one naming convention and standardize"
  },
  {
    "Metric Name": "View Content Rate",
    "Primary Source": "Custom",
    "Raw Fields Needed": "view_content, sessions",
    "Logic Note": "View Content / Sessions",
    "Integration Note": "Good early quality signal"
  },
  {
    "Metric Name": "Add to Cart",
    "Primary Source": "Website / Shopify / GA4",
    "Raw Fields Needed": "add_to_cart events",
    "Logic Note": "Count of cart-add events",
    "Integration Note": "Prefer website truth"
  },
  {
    "Metric Name": "Add to Cart Rate",
    "Primary Source": "Custom",
    "Raw Fields Needed": "add_to_cart, sessions",
    "Logic Note": "Add to Cart / Sessions",
    "Integration Note": "Could optionally use view_content denominator in an alternate version"
  },
  {
    "Metric Name": "Cart-to-Checkout Rate",
    "Primary Source": "Custom",
    "Raw Fields Needed": "begin_checkout, add_to_cart",
    "Logic Note": "Begin Checkout / Add to Cart",
    "Integration Note": "Useful for cart friction"
  },
  {
    "Metric Name": "Begin Checkout",
    "Primary Source": "Website / Shopify / GA4",
    "Raw Fields Needed": "begin_checkout events",
    "Logic Note": "Checkout-start count",
    "Integration Note": "Prefer website truth"
  },
  {
    "Metric Name": "Checkout Initiation Rate",
    "Primary Source": "Custom",
    "Raw Fields Needed": "begin_checkout, sessions",
    "Logic Note": "Begin Checkout / Sessions",
    "Integration Note": "Blended funnel-quality signal"
  },
  {
    "Metric Name": "Purchases",
    "Primary Source": "Website / Shopify / GA4 plus platform copies",
    "Raw Fields Needed": "purchases / transactions",
    "Logic Note": "Use website/store as truth, platforms as attribution layer",
    "Integration Note": "Keep both fields if possible"
  },
  {
    "Metric Name": "Purchase Conversion Rate",
    "Primary Source": "Custom",
    "Raw Fields Needed": "purchases, sessions",
    "Logic Note": "Purchases / Sessions",
    "Integration Note": "Main website CVR"
  },
  {
    "Metric Name": "Checkout-to-Purchase Rate",
    "Primary Source": "Custom",
    "Raw Fields Needed": "purchases, begin_checkout",
    "Logic Note": "Purchases / Begin Checkout",
    "Integration Note": "Checkout completion quality"
  },
  {
    "Metric Name": "Gross Revenue",
    "Primary Source": "Website / Shopify",
    "Raw Fields Needed": "gross_sales",
    "Logic Note": "Revenue before refunds/returns",
    "Integration Note": "Optional if net revenue exists"
  },
  {
    "Metric Name": "Net Revenue",
    "Primary Source": "Website / Shopify",
    "Raw Fields Needed": "net_sales or total_revenue net of refunds",
    "Logic Note": "Better business truth than gross sales",
    "Integration Note": "Define refund treatment clearly"
  },
  {
    "Metric Name": "Revenue per Session",
    "Primary Source": "Custom",
    "Raw Fields Needed": "revenue, sessions",
    "Logic Note": "Revenue / Sessions",
    "Integration Note": "Traffic monetization"
  },
  {
    "Metric Name": "Revenue per Click",
    "Primary Source": "Custom",
    "Raw Fields Needed": "revenue or attributed_revenue, clicks",
    "Logic Note": "Revenue / Clicks",
    "Integration Note": "Specify whether using store or attributed revenue"
  },
  {
    "Metric Name": "Refund Rate",
    "Primary Source": "Website / Shopify",
    "Raw Fields Needed": "refund_value or refunded_orders, revenue or orders",
    "Logic Note": "Refunds / Revenue or Orders",
    "Integration Note": "Document chosen denominator"
  },
  {
    "Metric Name": "CPA / CAC",
    "Primary Source": "Custom or Platform",
    "Raw Fields Needed": "spend, purchases or new_customers",
    "Logic Note": "Spend / Purchases or New Customers",
    "Integration Note": "Need exact business definition"
  },
  {
    "Metric Name": "New Customer CAC",
    "Primary Source": "Custom",
    "Raw Fields Needed": "spend, new_customers",
    "Logic Note": "Spend / New Customers",
    "Integration Note": "Requires customer-type data"
  },
  {
    "Metric Name": "ROAS by Channel",
    "Primary Source": "Meta / Google / TikTok / Snap",
    "Raw Fields Needed": "attributed_revenue, spend",
    "Logic Note": "Attributed Revenue / Spend",
    "Integration Note": "Channel-specific only"
  },
  {
    "Metric Name": "Cost per Add to Cart",
    "Primary Source": "Custom",
    "Raw Fields Needed": "spend, add_to_cart",
    "Logic Note": "Spend / Add to Cart",
    "Integration Note": "Early-funnel efficiency"
  },
  {
    "Metric Name": "Cost per Checkout",
    "Primary Source": "Custom",
    "Raw Fields Needed": "spend, begin_checkout",
    "Logic Note": "Spend / Begin Checkout",
    "Integration Note": "Mid-funnel efficiency"
  },
  {
    "Metric Name": "Spend Share",
    "Primary Source": "Custom",
    "Raw Fields Needed": "channel_spend, total_spend",
    "Logic Note": "Channel Spend / Total Spend",
    "Integration Note": "Budget allocation metric"
  },
  {
    "Metric Name": "Revenue Share",
    "Primary Source": "Custom",
    "Raw Fields Needed": "channel_revenue, total_revenue",
    "Logic Note": "Channel Revenue / Total Revenue",
    "Integration Note": "Use same revenue truth consistently"
  },
  {
    "Metric Name": "Channel Efficiency Index",
    "Primary Source": "Custom",
    "Raw Fields Needed": "spend_share, revenue_share and/or profit_share",
    "Logic Note": "Custom score comparing contribution vs budget",
    "Integration Note": "Requires business rule definition"
  },
  {
    "Metric Name": "New Customer Rate",
    "Primary Source": "Website / CRM / Shopify",
    "Raw Fields Needed": "new_customers, total_customers or orders",
    "Logic Note": "New / Total",
    "Integration Note": "Requires customer classification"
  },
  {
    "Metric Name": "Returning Customer Rate",
    "Primary Source": "Website / CRM / Shopify",
    "Raw Fields Needed": "returning_customers, total_customers or orders",
    "Logic Note": "Returning / Total",
    "Integration Note": "Requires customer classification"
  },
  {
    "Metric Name": "New Customer Revenue Share",
    "Primary Source": "Custom",
    "Raw Fields Needed": "new_customer_revenue, total_revenue",
    "Logic Note": "New Customer Revenue / Total Revenue",
    "Integration Note": "Needs customer tagging"
  },
  {
    "Metric Name": "Returning Customer Revenue Share",
    "Primary Source": "Custom",
    "Raw Fields Needed": "returning_customer_revenue, total_revenue",
    "Logic Note": "Returning Revenue / Total Revenue",
    "Integration Note": "Needs customer tagging"
  },
  {
    "Metric Name": "Repeat Purchase Rate",
    "Primary Source": "Website / CRM / Shopify",
    "Raw Fields Needed": "repeat_customers, total_customers",
    "Logic Note": "Repeat Customers / Total Customers",
    "Integration Note": "Best from customer/order history table"
  },
  {
    "Metric Name": "Gross Margin %",
    "Primary Source": "Custom / ERP / Store",
    "Raw Fields Needed": "revenue, cogs",
    "Logic Note": "(Revenue - COGS) / Revenue",
    "Integration Note": "Requires cost-of-goods data"
  },
  {
    "Metric Name": "Gross Profit",
    "Primary Source": "Custom / ERP / Store",
    "Raw Fields Needed": "revenue, cogs",
    "Logic Note": "Revenue - COGS",
    "Integration Note": "Requires cost-of-goods data"
  },
  {
    "Metric Name": "Contribution Margin",
    "Primary Source": "Custom",
    "Raw Fields Needed": "revenue, cogs, variable_costs",
    "Logic Note": "Revenue - COGS - variable non-ad costs",
    "Integration Note": "Need clear cost model"
  },
  {
    "Metric Name": "Contribution Margin After Ad Spend",
    "Primary Source": "Custom",
    "Raw Fields Needed": "revenue, cogs, variable_costs, ad_spend",
    "Logic Note": "Revenue - COGS - variable non-ad costs - ad spend",
    "Integration Note": "Best profitability metric if data exists"
  },
  {
    "Metric Name": "Profit per Order",
    "Primary Source": "Custom",
    "Raw Fields Needed": "contribution_margin_after_ad_spend, orders",
    "Logic Note": "Contribution Margin After Ad Spend / Orders",
    "Integration Note": "Derived profitability efficiency"
  },
  {
    "Metric Name": "Creative Fatigue Signal",
    "Primary Source": "Custom",
    "Raw Fields Needed": "frequency, ctr, cpc, purchase_cvr",
    "Logic Note": "Rule-based signal from deteriorating ad response",
    "Integration Note": "Needs defined threshold logic"
  },
  {
    "Metric Name": "Scaling Efficiency Signal",
    "Primary Source": "Custom",
    "Raw Fields Needed": "spend_change, revenue_change, mer_change, cac_change",
    "Logic Note": "Rule-based scaling health signal",
    "Integration Note": "Needs comparison window logic"
  },
  {
    "Metric Name": "Under-Scaling Signal",
    "Primary Source": "Custom",
    "Raw Fields Needed": "roas, mer, frequency, spend",
    "Logic Note": "Rule-based opportunity signal for efficient low-spend units",
    "Integration Note": "Needs threshold logic"
  },
  {
    "Metric Name": "Tracking Gap Signal",
    "Primary Source": "Custom",
    "Raw Fields Needed": "platform_attributed_revenue, store_revenue, platform_purchases, store_orders",
    "Logic Note": "Gap between platform truth and website truth",
    "Integration Note": "Very useful for attribution trust"
  },
  {
    "Metric Name": "Benchmark Variance",
    "Primary Source": "Custom",
    "Raw Fields Needed": "current_metric, expected_baseline",
    "Logic Note": "(Current - Baseline) / Baseline",
    "Integration Note": "Needs benchmark framework"
  },
  {
    "Metric Name": "Volatility Score",
    "Primary Source": "Custom",
    "Raw Fields Needed": "historical_metric_series",
    "Logic Note": "Rolling variability score",
    "Integration Note": "Needs time-series method definition"
  },
  {
    "Metric Name": "Anomaly Flag",
    "Primary Source": "Custom",
    "Raw Fields Needed": "benchmark_variance, volatility_score, confidence_flag",
    "Logic Note": "Triggered when metric moves outside expected range",
    "Integration Note": "Needs alert thresholds and low-volume logic"
  }
] as const;

export const metricDefinitions = [
  {
    "Section": "Executive Summary",
    "Metric Name": "Total Ad Spend",
    "What It Means": "Total paid media investment across channels for the selected period.",
    "What Good Looks Like": "Healthy when spend grows with stable or improving MER/Blended ROAS.",
    "What Bad Looks Like": "Warning if spend rises faster than revenue or contribution margin.",
    "What to Check Next": "Review paired metrics and compare to the benchmark range.",
    "Best Paired With": "MER, Blended ROAS, Revenue, Contribution Margin After Ad Spend",
    "Benchmark Basis": "Trailing 30d/60d trend plus channel share trend"
  },
  {
    "Section": "Executive Summary",
    "Metric Name": "Store Revenue",
    "What It Means": "The main sales truth from your store or analytics stack.",
    "What Good Looks Like": "Healthy when revenue rises with stable efficiency and margin quality.",
    "What Bad Looks Like": "Warning if revenue is up only because of discounting or weak profit quality.",
    "What to Check Next": "Review paired metrics and compare to the benchmark range.",
    "Best Paired With": "Orders, AOV, MER, Gross Profit",
    "Benchmark Basis": "Day-of-week baseline plus trailing 30d median"
  },
  {
    "Section": "Executive Summary",
    "Metric Name": "Orders",
    "What It Means": "Shows how many purchase events turned into real orders.",
    "What Good Looks Like": "Healthy when order growth is supported by stable CAC and CVR.",
    "What Bad Looks Like": "Warning if orders rise but AOV or profit quality falls sharply.",
    "What to Check Next": "Review paired metrics and compare to the benchmark range.",
    "Best Paired With": "Revenue, AOV, Purchase CVR",
    "Benchmark Basis": "Trailing 30d average and same-weekday baseline"
  },
  {
    "Section": "Executive Summary",
    "Metric Name": "MER",
    "What It Means": "Top-line blended efficiency metric for the whole business.",
    "What Good Looks Like": "Healthy when stable or improving at your target spend level.",
    "What Bad Looks Like": "Warning if MER falls while spend increases.",
    "What to Check Next": "Review paired metrics and compare to the benchmark range.",
    "Best Paired With": "Blended ROAS, Contribution Margin After Ad Spend, New Customer CAC",
    "Benchmark Basis": "Trailing median plus mature operating range"
  },
  {
    "Section": "Executive Summary",
    "Metric Name": "Blended ROAS",
    "What It Means": "Shows return from channel-attributed revenue in one blended view.",
    "What Good Looks Like": "Healthy when improving without hiding weak store-level truth.",
    "What Bad Looks Like": "Warning if strong here but weak on MER or store revenue.",
    "What to Check Next": "Review paired metrics and compare to the benchmark range.",
    "Best Paired With": "MER, Store Revenue, Tracking Gap Signal",
    "Benchmark Basis": "Trailing 30d average and platform-to-store variance"
  },
  {
    "Section": "Executive Summary",
    "Metric Name": "AOV",
    "What It Means": "Shows average order size and offer quality.",
    "What Good Looks Like": "Healthy when stable or rising without hurting CVR too much.",
    "What Bad Looks Like": "Warning if AOV rises only because order volume collapses.",
    "What to Check Next": "Review paired metrics and compare to the benchmark range.",
    "Best Paired With": "Orders, Purchase CVR, Profit per Order",
    "Benchmark Basis": "Trailing 60d median"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "Impressions",
    "What It Means": "How many times ads were served.",
    "What Good Looks Like": "Healthy when impressions scale with useful clicks and conversions.",
    "What Bad Looks Like": "Warning if impressions rise with weak CTR and rising frequency.",
    "What to Check Next": "Check creative, audience, placement mix, and downstream site quality.",
    "Best Paired With": "Reach, Frequency, CTR",
    "Benchmark Basis": "Channel baseline and trend"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "Reach",
    "What It Means": "Shows audience breadth.",
    "What Good Looks Like": "Healthy when reach grows before frequency becomes excessive.",
    "What Bad Looks Like": "Warning if reach stalls while frequency climbs.",
    "What to Check Next": "Check creative, audience, placement mix, and downstream site quality.",
    "Best Paired With": "Frequency, CPM, CTR",
    "Benchmark Basis": "Channel baseline and prospecting benchmark"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "Frequency",
    "What It Means": "Shows how often the average person saw your ad.",
    "What Good Looks Like": "Healthy when controlled and paired with stable CTR and CVR.",
    "What Bad Looks Like": "Warning when rising frequency is paired with falling CTR.",
    "What to Check Next": "Check creative, audience, placement mix, and downstream site quality.",
    "Best Paired With": "CTR, CPM, Purchase CVR",
    "Benchmark Basis": "Prospecting and retargeting ranges separately"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "Clicks",
    "What It Means": "Basic response volume from paid traffic.",
    "What Good Looks Like": "Healthy when clicks rise with stable CPC and good downstream quality.",
    "What Bad Looks Like": "Warning if click growth does not convert into sessions or purchases.",
    "What to Check Next": "Check creative, audience, placement mix, and downstream site quality.",
    "Best Paired With": "CPC, Sessions, Revenue per Click",
    "Benchmark Basis": "Trend only"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "CTR",
    "What It Means": "Measures how well the ad hook and audience match are working.",
    "What Good Looks Like": "Healthy when stable or rising while CVR also holds.",
    "What Bad Looks Like": "Warning if low CTR limits scale or drops as frequency rises.",
    "What to Check Next": "Check creative, audience, placement mix, and downstream site quality.",
    "Best Paired With": "Frequency, CVR, CPC",
    "Benchmark Basis": "Channel-specific baseline by campaign type"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "CPC",
    "What It Means": "Shows the cost paid for each click.",
    "What Good Looks Like": "Healthy when CPC is stable relative to CVR and AOV.",
    "What Bad Looks Like": "Warning if CPC rises because CTR weakens or auction costs rise.",
    "What to Check Next": "Check creative, audience, placement mix, and downstream site quality.",
    "Best Paired With": "CTR, CPM, Revenue per Click",
    "Benchmark Basis": "Channel baseline plus trailing 30d"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "CPM",
    "What It Means": "Shows auction cost pressure per thousand impressions.",
    "What Good Looks Like": "Healthy when CPM is justified by conversion quality.",
    "What Bad Looks Like": "Warning if CPM rises while CVR and CTR weaken.",
    "What to Check Next": "Check creative, audience, placement mix, and downstream site quality.",
    "Best Paired With": "CTR, Reach, Frequency",
    "Benchmark Basis": "Channel baseline and seasonal comparison"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "Landing Page Views",
    "What It Means": "A cleaner post-click quality metric than clicks alone.",
    "What Good Looks Like": "Healthy when LPVs track closely with clicks and sessions.",
    "What Bad Looks Like": "Warning if LPVs lag far behind clicks.",
    "What to Check Next": "Check creative, audience, placement mix, and downstream site quality.",
    "Best Paired With": "Clicks, Sessions, LPV Rate",
    "Benchmark Basis": "Trend and click-to-LPV gap"
  },
  {
    "Section": "Traffic & Awareness",
    "Metric Name": "LPV Rate",
    "What It Means": "Shows how efficiently clicks become real page loads.",
    "What Good Looks Like": "Healthy when stable and close to your normal range.",
    "What Bad Looks Like": "Warning if low due to slow pages, broken links, or low-quality placements.",
    "What to Check Next": "Check creative, audience, placement mix, and downstream site quality.",
    "Best Paired With": "Clicks, Sessions, Bounce Rate",
    "Benchmark Basis": "Trailing 30d normal range"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "Sessions",
    "What It Means": "Main website traffic truth for the selected period.",
    "What Good Looks Like": "Healthy when session growth converts into quality funnel activity.",
    "What Bad Looks Like": "Warning if sessions rise without corresponding funnel progress.",
    "What to Check Next": "Check landing pages, traffic source quality, and message match.",
    "Best Paired With": "Engagement Rate, View Content Rate, Purchase CVR",
    "Benchmark Basis": "Day-of-week baseline"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "Engaged Sessions",
    "What It Means": "Shows better traffic quality than raw sessions alone.",
    "What Good Looks Like": "Healthy when a high share of sessions are engaged.",
    "What Bad Looks Like": "Warning if paid traffic is creating many low-intent visits.",
    "What to Check Next": "Check landing pages, traffic source quality, and message match.",
    "Best Paired With": "Sessions, Engagement Rate, Purchase CVR",
    "Benchmark Basis": "Trailing median"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "Engagement Rate",
    "What It Means": "Quick read on session quality and on-site relevance.",
    "What Good Looks Like": "Healthy when stable or improving while traffic scales.",
    "What Bad Looks Like": "Warning if it falls after a creative or audience expansion.",
    "What to Check Next": "Check landing pages, traffic source quality, and message match.",
    "Best Paired With": "Bounce Rate, View Content Rate, Purchase CVR",
    "Benchmark Basis": "Trailing median and source-level baseline"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "Bounce Rate",
    "What It Means": "Helpful for spotting poor traffic quality or message mismatch.",
    "What Good Looks Like": "Healthy when lower over time for comparable traffic.",
    "What Bad Looks Like": "Warning if high after a landing page or targeting change.",
    "What to Check Next": "Check landing pages, traffic source quality, and message match.",
    "Best Paired With": "Sessions, CTR, Purchase CVR",
    "Benchmark Basis": "Source-level baseline"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "View Content",
    "What It Means": "Shows whether visitors are actually reaching product interest pages.",
    "What Good Looks Like": "Healthy when rising with qualified traffic and strong ATC rate.",
    "What Bad Looks Like": "Warning if sessions rise but view content stays flat.",
    "What to Check Next": "Check landing pages, traffic source quality, and message match.",
    "Best Paired With": "Sessions, View Content Rate, Add to Cart Rate",
    "Benchmark Basis": "Trailing 30d range"
  },
  {
    "Section": "Site Quality",
    "Metric Name": "View Content Rate",
    "What It Means": "Early signal for traffic quality and landing page relevance.",
    "What Good Looks Like": "Healthy when strong traffic reaches product detail pages quickly.",
    "What Bad Looks Like": "Warning if low because users bounce before seeing product detail.",
    "What to Check Next": "Check landing pages, traffic source quality, and message match.",
    "Best Paired With": "Engagement Rate, Add to Cart Rate, CTR",
    "Benchmark Basis": "Day-of-week baseline"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Add to Cart",
    "What It Means": "Shows strong product intent before checkout.",
    "What Good Looks Like": "Healthy when it scales with sessions and product views.",
    "What Bad Looks Like": "Warning if product interest is weak despite good traffic volume.",
    "What to Check Next": "Check the next funnel step, device split, checkout friction, and offer strength.",
    "Best Paired With": "Add to Cart Rate, Begin Checkout, Purchase CVR",
    "Benchmark Basis": "Trend and source mix"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Add to Cart Rate",
    "What It Means": "Quick read on how convincing the landing page and offer are.",
    "What Good Looks Like": "Healthy when stable or rising with similar traffic quality.",
    "What Bad Looks Like": "Warning if it drops after traffic scale or pricing changes.",
    "What to Check Next": "Check the next funnel step, device split, checkout friction, and offer strength.",
    "Best Paired With": "View Content Rate, Purchase CVR, AOV",
    "Benchmark Basis": "Day-of-week baseline and traffic-source baseline"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Cart-to-Checkout Rate",
    "What It Means": "Shows how many carts move forward into checkout.",
    "What Good Looks Like": "Healthy when cart interest turns into real purchase intent.",
    "What Bad Looks Like": "Warning if carts are created but checkout starts stay weak.",
    "What to Check Next": "Check the next funnel step, device split, checkout friction, and offer strength.",
    "Best Paired With": "Add to Cart, Begin Checkout, Checkout-to-Purchase Rate",
    "Benchmark Basis": "Trailing 30d normal range"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Begin Checkout",
    "What It Means": "Shows serious buying intent after cart creation.",
    "What Good Looks Like": "Healthy when checkout starts rise with add to cart volume.",
    "What Bad Looks Like": "Warning if checkout friction appears before payment.",
    "What to Check Next": "Check the next funnel step, device split, checkout friction, and offer strength.",
    "Best Paired With": "Cart-to-Checkout Rate, Purchase CVR",
    "Benchmark Basis": "Trend and device split"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Checkout Initiation Rate",
    "What It Means": "Blends traffic quality and pre-checkout friction into one rate.",
    "What Good Looks Like": "Healthy when quality traffic moves steadily into checkout.",
    "What Bad Looks Like": "Warning if traffic looks healthy but checkout starts stay low.",
    "What to Check Next": "Check the next funnel step, device split, checkout friction, and offer strength.",
    "Best Paired With": "Add to Cart Rate, Purchase CVR, Device Split",
    "Benchmark Basis": "Day-of-week baseline"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Purchases",
    "What It Means": "The final conversion event in the site funnel.",
    "What Good Looks Like": "Healthy when purchases grow with acceptable CAC and margin.",
    "What Bad Looks Like": "Warning if attributed purchases diverge sharply from website orders.",
    "What to Check Next": "Check the next funnel step, device split, checkout friction, and offer strength.",
    "Best Paired With": "Orders, Purchase CVR, Tracking Gap Signal",
    "Benchmark Basis": "Website baseline and platform comparison"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Purchase Conversion Rate",
    "What It Means": "Main site conversion efficiency metric.",
    "What Good Looks Like": "Healthy when stable or rising at target traffic scale.",
    "What Bad Looks Like": "Warning if it falls after creative or audience expansion.",
    "What to Check Next": "Check the next funnel step, device split, checkout friction, and offer strength.",
    "Best Paired With": "CTR, AOV, Add to Cart Rate",
    "Benchmark Basis": "Day-of-week baseline plus maturity-adjusted range"
  },
  {
    "Section": "Funnel Metrics",
    "Metric Name": "Checkout-to-Purchase Rate",
    "What It Means": "Measures checkout completion quality.",
    "What Good Looks Like": "Healthy when checkout completion stays strong across devices.",
    "What Bad Looks Like": "Warning if payment, shipping, trust, or speed issues appear.",
    "What to Check Next": "Check the next funnel step, device split, checkout friction, and offer strength.",
    "Best Paired With": "Begin Checkout, Device Split, Refund Rate",
    "Benchmark Basis": "Trailing 30d normal range"
  },
  {
    "Section": "Revenue & Order Economics",
    "Metric Name": "Gross Revenue",
    "What It Means": "Top-line sales output before deductions.",
    "What Good Looks Like": "Healthy when paired with solid margin and low refund pressure.",
    "What Bad Looks Like": "Warning if gross revenue looks strong but net revenue is weak.",
    "What to Check Next": "Check AOV, conversion rate, refund pressure, and traffic monetization.",
    "Best Paired With": "Net Revenue, Refund Rate, Gross Margin %",
    "Benchmark Basis": "Trend only"
  },
  {
    "Section": "Revenue & Order Economics",
    "Metric Name": "Net Revenue",
    "What It Means": "A more decision-useful revenue truth than gross sales alone.",
    "What Good Looks Like": "Healthy when it scales with stable CAC and profit quality.",
    "What Bad Looks Like": "Warning if refund drag grows.",
    "What to Check Next": "Check AOV, conversion rate, refund pressure, and traffic monetization.",
    "Best Paired With": "Gross Revenue, Refund Rate, Contribution Margin",
    "Benchmark Basis": "Trailing median and profit baseline"
  },
  {
    "Section": "Revenue & Order Economics",
    "Metric Name": "Revenue per Session",
    "What It Means": "Shows monetization efficiency of site traffic.",
    "What Good Looks Like": "Healthy when steady or rising as traffic scales.",
    "What Bad Looks Like": "Warning if sessions grow faster than revenue.",
    "What to Check Next": "Check AOV, conversion rate, refund pressure, and traffic monetization.",
    "Best Paired With": "Purchase CVR, AOV, Revenue per Click",
    "Benchmark Basis": "Day-of-week baseline"
  },
  {
    "Section": "Revenue & Order Economics",
    "Metric Name": "Revenue per Click",
    "What It Means": "Quick way to connect media traffic to money outcome.",
    "What Good Looks Like": "Healthy when enough value is produced per click to cover CPC.",
    "What Bad Looks Like": "Warning if clicks are cheap but still unproductive.",
    "What to Check Next": "Check AOV, conversion rate, refund pressure, and traffic monetization.",
    "Best Paired With": "CPC, Purchase CVR, AOV",
    "Benchmark Basis": "Channel-specific baseline"
  },
  {
    "Section": "Revenue & Order Economics",
    "Metric Name": "Refund Rate",
    "What It Means": "Shows revenue quality and post-purchase satisfaction risk.",
    "What Good Looks Like": "Healthy when stable and low relative to your category.",
    "What Bad Looks Like": "Warning if higher promo volume drives poor-quality orders.",
    "What to Check Next": "Check AOV, conversion rate, refund pressure, and traffic monetization.",
    "Best Paired With": "Net Revenue, Gross Revenue, Profit per Order",
    "Benchmark Basis": "Trailing 90d and promo-period comparison"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "CPA / CAC",
    "What It Means": "Core acquisition efficiency metric.",
    "What Good Looks Like": "Healthy when stable at your target scale and margin profile.",
    "What Bad Looks Like": "Warning if it rises faster than AOV or contribution margin.",
    "What to Check Next": "Check spend allocation, CAC, MER, and channel contribution quality.",
    "Best Paired With": "AOV, MER, New Customer Rate",
    "Benchmark Basis": "Trailing 30d and channel benchmark"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "New Customer CAC",
    "What It Means": "Best efficiency metric for growth-focused paid media.",
    "What Good Looks Like": "Healthy when new customer cost still leaves room for margin or LTV payback.",
    "What Bad Looks Like": "Warning if revenue is coming mainly from existing customers while this worsens.",
    "What to Check Next": "Check spend allocation, CAC, MER, and channel contribution quality.",
    "Best Paired With": "New Customer Rate, Contribution Margin, Repeat Purchase Rate",
    "Benchmark Basis": "Trailing 60d mature baseline"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "ROAS by Channel",
    "What It Means": "Platform-level return reading for Meta, Google, Snap, and TikTok separately.",
    "What Good Looks Like": "Healthy when strong without conflicting with MER.",
    "What Bad Looks Like": "Warning if platform ROAS is strong but store truth is weak.",
    "What to Check Next": "Check spend allocation, CAC, MER, and channel contribution quality.",
    "Best Paired With": "MER, Store Revenue, Tracking Gap Signal",
    "Benchmark Basis": "Channel-specific baseline by funnel stage"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "Cost per Add to Cart",
    "What It Means": "Useful early-funnel efficiency metric.",
    "What Good Looks Like": "Healthy when cheap ATCs still convert into checkouts and purchases.",
    "What Bad Looks Like": "Warning if cheap carts do not become sales.",
    "What to Check Next": "Check spend allocation, CAC, MER, and channel contribution quality.",
    "Best Paired With": "Cart-to-Checkout Rate, Purchase CVR",
    "Benchmark Basis": "Traffic-source baseline"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "Cost per Checkout",
    "What It Means": "Mid-funnel efficiency read before final purchase.",
    "What Good Looks Like": "Healthy when checkouts convert into purchases at a good rate.",
    "What Bad Looks Like": "Warning if checkout costs look fine but completion is poor.",
    "What to Check Next": "Check spend allocation, CAC, MER, and channel contribution quality.",
    "Best Paired With": "Checkout-to-Purchase Rate, CPA",
    "Benchmark Basis": "Traffic-source baseline"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "Spend Share",
    "What It Means": "Shows how budget is distributed across channels.",
    "What Good Looks Like": "Healthy when spend share broadly matches scalable contribution.",
    "What Bad Looks Like": "Warning if one channel absorbs budget without revenue support.",
    "What to Check Next": "Check spend allocation, CAC, MER, and channel contribution quality.",
    "Best Paired With": "Revenue Share, Channel Efficiency Index",
    "Benchmark Basis": "Rolling channel mix"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "Revenue Share",
    "What It Means": "Shows how much of business output each channel is driving.",
    "What Good Looks Like": "Healthy when higher spend share is justified by revenue share and margin quality.",
    "What Bad Looks Like": "Warning if revenue share lags spend share for too long.",
    "What to Check Next": "Check spend allocation, CAC, MER, and channel contribution quality.",
    "Best Paired With": "Spend Share, MER, Channel Efficiency Index",
    "Benchmark Basis": "Rolling channel mix"
  },
  {
    "Section": "Paid Media Efficiency",
    "Metric Name": "Channel Efficiency Index",
    "What It Means": "Helps spot underfunded winners and overfunded laggards.",
    "What Good Looks Like": "Healthy when strong channels keep outperforming their spend share.",
    "What Bad Looks Like": "Warning if a channel takes budget but under-contributes.",
    "What to Check Next": "Check spend allocation, CAC, MER, and channel contribution quality.",
    "Best Paired With": "Spend Share, Revenue Share, MER",
    "Benchmark Basis": "Trailing 30d and 90d comparison"
  },
  {
    "Section": "Customer Quality",
    "Metric Name": "New Customer Rate",
    "What It Means": "Shows how much of performance comes from true acquisition.",
    "What Good Looks Like": "Healthy when growth periods increase new customer contribution without breaking CAC.",
    "What Bad Looks Like": "Warning if reported growth is mostly existing customer harvest.",
    "What to Check Next": "Check new vs returning mix, CAC quality, and repeat behavior.",
    "Best Paired With": "New Customer CAC, Returning Customer Rate, MER",
    "Benchmark Basis": "Trailing 60d mature baseline"
  },
  {
    "Section": "Customer Quality",
    "Metric Name": "Returning Customer Rate",
    "What It Means": "Shows repeat demand and brand loyalty.",
    "What Good Looks Like": "Healthy when balanced with your growth objective and channel mix.",
    "What Bad Looks Like": "Warning if it rises only because new customer acquisition weakens.",
    "What to Check Next": "Check new vs returning mix, CAC quality, and repeat behavior.",
    "Best Paired With": "New Customer Rate, Repeat Purchase Rate",
    "Benchmark Basis": "Trailing 90d"
  },
  {
    "Section": "Customer Quality",
    "Metric Name": "New Customer Revenue Share",
    "What It Means": "Shows how much revenue is truly expansion-oriented.",
    "What Good Looks Like": "Healthy when new-customer revenue is efficient and profitable.",
    "What Bad Looks Like": "Warning if revenue growth comes from returning buyers only.",
    "What to Check Next": "Check new vs returning mix, CAC quality, and repeat behavior.",
    "Best Paired With": "New Customer CAC, Contribution Margin",
    "Benchmark Basis": "Trailing 60d"
  },
  {
    "Section": "Customer Quality",
    "Metric Name": "Returning Customer Revenue Share",
    "What It Means": "Shows dependence on existing demand and retention strength.",
    "What Good Looks Like": "Healthy when strong retention supports profitable scaling.",
    "What Bad Looks Like": "Warning if it hides weak acquisition performance.",
    "What to Check Next": "Check new vs returning mix, CAC quality, and repeat behavior.",
    "Best Paired With": "New Customer Rate, Repeat Purchase Rate",
    "Benchmark Basis": "Trailing 90d"
  },
  {
    "Section": "Customer Quality",
    "Metric Name": "Repeat Purchase Rate",
    "What It Means": "Helps estimate downstream customer quality and payback potential.",
    "What Good Looks Like": "Healthy when rising cohorts support broader CAC tolerance.",
    "What Bad Looks Like": "Warning if first-order growth does not convert into repeat behavior.",
    "What to Check Next": "Check new vs returning mix, CAC quality, and repeat behavior.",
    "Best Paired With": "New Customer CAC, LTV if available",
    "Benchmark Basis": "Cohort-based baseline"
  },
  {
    "Section": "Profitability",
    "Metric Name": "Gross Margin %",
    "What It Means": "Shows the share of sales left after product cost.",
    "What Good Looks Like": "Healthy when stable enough to support your acquisition model.",
    "What Bad Looks Like": "Warning if margin compresses while CAC rises.",
    "What to Check Next": "Check margin inputs, cost assumptions, and whether ad scale is still profitable.",
    "Best Paired With": "Gross Profit, Contribution Margin, AOV",
    "Benchmark Basis": "Trailing 90d and product mix comparison"
  },
  {
    "Section": "Profitability",
    "Metric Name": "Gross Profit",
    "What It Means": "Better than revenue alone for judging business quality.",
    "What Good Looks Like": "Healthy when gross profit scales with controlled CAC.",
    "What Bad Looks Like": "Warning if revenue grows but gross profit does not.",
    "What to Check Next": "Check margin inputs, cost assumptions, and whether ad scale is still profitable.",
    "Best Paired With": "Gross Margin %, Ad Spend, Contribution Margin",
    "Benchmark Basis": "Trailing 60d"
  },
  {
    "Section": "Profitability",
    "Metric Name": "Contribution Margin",
    "What It Means": "Shows whether orders still create useful contribution before ad cost.",
    "What Good Looks Like": "Healthy when contribution is stable enough to support paid growth.",
    "What Bad Looks Like": "Warning if hidden costs erode apparent success.",
    "What to Check Next": "Check margin inputs, cost assumptions, and whether ad scale is still profitable.",
    "Best Paired With": "Gross Profit, Refund Rate, AOV",
    "Benchmark Basis": "Trailing 90d"
  },
  {
    "Section": "Profitability",
    "Metric Name": "Contribution Margin After Ad Spend",
    "What It Means": "Best single read on whether paid growth is truly profitable.",
    "What Good Looks Like": "Healthy when positive and improving at target scale.",
    "What Bad Looks Like": "Warning if ROAS looks fine but this turns weak or negative.",
    "What to Check Next": "Check margin inputs, cost assumptions, and whether ad scale is still profitable.",
    "Best Paired With": "MER, New Customer CAC, Gross Margin %",
    "Benchmark Basis": "Trailing median plus maturity range"
  },
  {
    "Section": "Profitability",
    "Metric Name": "Profit per Order",
    "What It Means": "Shows how much economic value each order is really creating.",
    "What Good Looks Like": "Healthy when stable enough to justify scale.",
    "What Bad Looks Like": "Warning if order growth is profitable only on paper.",
    "What to Check Next": "Check margin inputs, cost assumptions, and whether ad scale is still profitable.",
    "Best Paired With": "AOV, CPA, Gross Margin %",
    "Benchmark Basis": "Trailing 60d"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Creative Fatigue Signal",
    "What It Means": "Helps catch ad wear-out before performance collapses.",
    "What Good Looks Like": "Healthy when frequency can rise without hurting CTR or CVR.",
    "What Bad Looks Like": "Warning when frequency rises while CTR falls and CPC rises.",
    "What to Check Next": "Validate the signal against recent changes, volume, and benchmark confidence.",
    "Best Paired With": "Frequency, CTR, CPC, Purchase CVR",
    "Benchmark Basis": "7d vs 30d directional check"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Scaling Efficiency Signal",
    "What It Means": "Helps judge whether budget increases are healthy.",
    "What Good Looks Like": "Healthy when more spend still maintains acceptable economics.",
    "What Bad Looks Like": "Warning when spend grows but MER, CAC, or contribution worsen materially.",
    "What to Check Next": "Validate the signal against recent changes, volume, and benchmark confidence.",
    "Best Paired With": "Spend, Store Revenue, MER, Contribution Margin After Ad Spend",
    "Benchmark Basis": "Current period vs previous period and vs trailing baseline"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Under-Scaling Signal",
    "What It Means": "Helps identify winners that may deserve more budget.",
    "What Good Looks Like": "Healthy when strong units can still absorb more spend.",
    "What Bad Looks Like": "Warning if the dashboard never distinguishes true winners from just stable small spend.",
    "What to Check Next": "Validate the signal against recent changes, volume, and benchmark confidence.",
    "Best Paired With": "ROAS by Channel, Frequency, Spend Share",
    "Benchmark Basis": "Efficiency percentile plus low-saturation check"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Tracking Gap Signal",
    "What It Means": "Highlights over-attribution, under-attribution, or broken tracking.",
    "What Good Looks Like": "Healthy when differences stay inside the expected range for your setup.",
    "What Bad Looks Like": "Warning if the gap widens sharply after setup or campaign changes.",
    "What to Check Next": "Validate the signal against recent changes, volume, and benchmark confidence.",
    "Best Paired With": "Store Revenue, Platform ROAS, Purchases",
    "Benchmark Basis": "Historical normal gap range"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Benchmark Variance",
    "What It Means": "Shows how far current performance sits from normal.",
    "What Good Looks Like": "Healthy when variance is explainable and within normal control bands.",
    "What Bad Looks Like": "Warning when key efficiency metrics move materially outside normal range.",
    "What to Check Next": "Validate the signal against recent changes, volume, and benchmark confidence.",
    "Best Paired With": "Volatility Score, Anomaly Flag",
    "Benchmark Basis": "Day-of-week and seasonal adjusted baseline"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Volatility Score",
    "What It Means": "Helps judge whether a move is meaningful or just noisy.",
    "What Good Looks Like": "Healthy when core metrics are stable enough for confident decisions.",
    "What Bad Looks Like": "Warning when decisions are being made on highly unstable signals.",
    "What to Check Next": "Validate the signal against recent changes, volume, and benchmark confidence.",
    "Best Paired With": "Benchmark Variance, Anomaly Flag",
    "Benchmark Basis": "Rolling 30d standard-deviation style method"
  },
  {
    "Section": "Diagnostics & Alerts",
    "Metric Name": "Anomaly Flag",
    "What It Means": "Makes it easier to notice real breaks quickly.",
    "What Good Looks Like": "Healthy when alerts are rare and meaningful.",
    "What Bad Looks Like": "Warning if too many alerts create noise or if large moves are missed.",
    "What to Check Next": "Validate the signal against recent changes, volume, and benchmark confidence.",
    "Best Paired With": "Benchmark Variance, Volatility Score, Spend",
    "Benchmark Basis": "Expected range plus confidence weighting"
  }
] as const;

export const customMetricsLogic = [
  {
    "Custom Metric / Signal": "MER",
    "Equation or Rule": "Store Revenue / Total Ad Spend",
    "Inputs Needed": "store_revenue, total_ad_spend",
    "Implementation Logic": "Use store truth for revenue and blended ad spend across all channels.",
    "Suggested Alert / Interpretation Rule": "Show warning if below target MER or below trailing median by a meaningful margin."
  },
  {
    "Custom Metric / Signal": "Blended ROAS",
    "Equation or Rule": "Total Attributed Revenue / Total Ad Spend",
    "Inputs Needed": "platform_attributed_revenue, total_ad_spend",
    "Implementation Logic": "Keep separate from MER because attributed revenue is not the same as store revenue.",
    "Suggested Alert / Interpretation Rule": "Show caution if strong here but weak on MER."
  },
  {
    "Custom Metric / Signal": "LPV Rate",
    "Equation or Rule": "Landing Page Views / Clicks",
    "Inputs Needed": "landing_page_views, clicks",
    "Implementation Logic": "Use only for sources where LPV exists.",
    "Suggested Alert / Interpretation Rule": "Flag when LPV rate drops materially vs recent baseline."
  },
  {
    "Custom Metric / Signal": "View Content Rate",
    "Equation or Rule": "View Content / Sessions",
    "Inputs Needed": "view_content, sessions",
    "Implementation Logic": "Good early signal for landing page relevance and product interest.",
    "Suggested Alert / Interpretation Rule": "Flag when sessions rise but this rate falls."
  },
  {
    "Custom Metric / Signal": "Add to Cart Rate",
    "Equation or Rule": "Add to Cart / Sessions",
    "Inputs Needed": "add_to_cart, sessions",
    "Implementation Logic": "Can optionally have a second version using view content as denominator.",
    "Suggested Alert / Interpretation Rule": "Flag when traffic scales but cart intent weakens."
  },
  {
    "Custom Metric / Signal": "Cart-to-Checkout Rate",
    "Equation or Rule": "Begin Checkout / Add to Cart",
    "Inputs Needed": "begin_checkout, add_to_cart",
    "Implementation Logic": "Measures whether cart intent progresses into checkout.",
    "Suggested Alert / Interpretation Rule": "Flag when carts are healthy but checkout starts weaken."
  },
  {
    "Custom Metric / Signal": "Checkout Initiation Rate",
    "Equation or Rule": "Begin Checkout / Sessions",
    "Inputs Needed": "begin_checkout, sessions",
    "Implementation Logic": "Blended read of traffic quality plus mid-funnel movement.",
    "Suggested Alert / Interpretation Rule": "Flag when session quality looks fine but checkout starts stay weak."
  },
  {
    "Custom Metric / Signal": "Purchase Conversion Rate",
    "Equation or Rule": "Purchases / Sessions",
    "Inputs Needed": "purchases, sessions",
    "Implementation Logic": "Use website/store purchase truth.",
    "Suggested Alert / Interpretation Rule": "Flag when traffic grows but CVR declines materially."
  },
  {
    "Custom Metric / Signal": "Checkout-to-Purchase Rate",
    "Equation or Rule": "Purchases / Begin Checkout",
    "Inputs Needed": "purchases, begin_checkout",
    "Implementation Logic": "Tracks checkout completion quality.",
    "Suggested Alert / Interpretation Rule": "Flag when checkout completion drops sharply by device or market."
  },
  {
    "Custom Metric / Signal": "Revenue per Session",
    "Equation or Rule": "Revenue / Sessions",
    "Inputs Needed": "revenue, sessions",
    "Implementation Logic": "Useful monetization metric for site traffic.",
    "Suggested Alert / Interpretation Rule": "Flag when sessions rise but monetization weakens."
  },
  {
    "Custom Metric / Signal": "Revenue per Click",
    "Equation or Rule": "Revenue / Clicks",
    "Inputs Needed": "revenue or attributed_revenue, clicks",
    "Implementation Logic": "Must define whether the revenue source is store truth or attributed.",
    "Suggested Alert / Interpretation Rule": "Flag when click volume rises without enough value."
  },
  {
    "Custom Metric / Signal": "CPA / CAC",
    "Equation or Rule": "Spend / Purchases or Spend / New Customers",
    "Inputs Needed": "spend, purchases or new_customers",
    "Implementation Logic": "Business must choose whether default uses total purchases or new customers.",
    "Suggested Alert / Interpretation Rule": "Flag when it rises above acceptable benchmark band."
  },
  {
    "Custom Metric / Signal": "New Customer CAC",
    "Equation or Rule": "Spend / New Customers",
    "Inputs Needed": "spend, new_customers",
    "Implementation Logic": "Requires reliable new customer classification.",
    "Suggested Alert / Interpretation Rule": "Flag when acquisition cost rises while new customer share weakens."
  },
  {
    "Custom Metric / Signal": "Spend Share",
    "Equation or Rule": "Channel Spend / Total Ad Spend",
    "Inputs Needed": "channel_spend, total_ad_spend",
    "Implementation Logic": "Best used next to revenue share and efficiency metrics.",
    "Suggested Alert / Interpretation Rule": "Flag when spend share increases without matching revenue share."
  },
  {
    "Custom Metric / Signal": "Revenue Share",
    "Equation or Rule": "Channel Revenue / Total Revenue",
    "Inputs Needed": "channel_revenue, total_revenue",
    "Implementation Logic": "Use same revenue truth consistently across channels.",
    "Suggested Alert / Interpretation Rule": "Flag when revenue share consistently trails spend share."
  },
  {
    "Custom Metric / Signal": "Channel Efficiency Index",
    "Equation or Rule": "Example: Revenue Share / Spend Share",
    "Inputs Needed": "revenue_share, spend_share",
    "Implementation Logic": "You can extend this with profit share if margin data exists.",
    "Suggested Alert / Interpretation Rule": "Flag low values as overfunded channels and high values as underfunded winners."
  },
  {
    "Custom Metric / Signal": "New Customer Rate",
    "Equation or Rule": "New Customers / Total Customers or Orders",
    "Inputs Needed": "new_customers, total_customers or orders",
    "Implementation Logic": "Choose one denominator and keep it consistent.",
    "Suggested Alert / Interpretation Rule": "Flag when growth periods rely too much on returning customers."
  },
  {
    "Custom Metric / Signal": "Returning Customer Rate",
    "Equation or Rule": "Returning Customers / Total Customers or Orders",
    "Inputs Needed": "returning_customers, total_customers or orders",
    "Implementation Logic": "Useful for retention read but should not hide weak acquisition.",
    "Suggested Alert / Interpretation Rule": "Flag when it rises because new customer acquisition is weakening."
  },
  {
    "Custom Metric / Signal": "New Customer Revenue Share",
    "Equation or Rule": "New Customer Revenue / Total Revenue",
    "Inputs Needed": "new_customer_revenue, total_revenue",
    "Implementation Logic": "Requires customer revenue tagging.",
    "Suggested Alert / Interpretation Rule": "Flag when revenue growth comes mostly from existing demand."
  },
  {
    "Custom Metric / Signal": "Returning Customer Revenue Share",
    "Equation or Rule": "Returning Customer Revenue / Total Revenue",
    "Inputs Needed": "returning_customer_revenue, total_revenue",
    "Implementation Logic": "Best used with new customer share.",
    "Suggested Alert / Interpretation Rule": "Flag when it dominates growth during prospecting pushes."
  },
  {
    "Custom Metric / Signal": "Repeat Purchase Rate",
    "Equation or Rule": "Repeat Customers / Total Customers",
    "Inputs Needed": "repeat_customers, total_customers",
    "Implementation Logic": "Best built from customer order history.",
    "Suggested Alert / Interpretation Rule": "Flag when paid acquisition quality does not convert into repeat behavior."
  },
  {
    "Custom Metric / Signal": "Gross Margin %",
    "Equation or Rule": "(Revenue - COGS) / Revenue",
    "Inputs Needed": "revenue, cogs",
    "Implementation Logic": "Requires cost-of-goods data by order, SKU, or blended period.",
    "Suggested Alert / Interpretation Rule": "Flag when margin compression combines with rising CAC."
  },
  {
    "Custom Metric / Signal": "Gross Profit",
    "Equation or Rule": "Revenue - COGS",
    "Inputs Needed": "revenue, cogs",
    "Implementation Logic": "Better quality signal than revenue alone.",
    "Suggested Alert / Interpretation Rule": "Flag when revenue rises but gross profit stays flat."
  },
  {
    "Custom Metric / Signal": "Contribution Margin",
    "Equation or Rule": "Revenue - COGS - Variable Non-Ad Costs",
    "Inputs Needed": "revenue, cogs, variable_non_ad_costs",
    "Implementation Logic": "Need an agreed variable-cost model.",
    "Suggested Alert / Interpretation Rule": "Flag when hidden costs erode apparent success."
  },
  {
    "Custom Metric / Signal": "Contribution Margin After Ad Spend",
    "Equation or Rule": "Revenue - COGS - Variable Non-Ad Costs - Ad Spend",
    "Inputs Needed": "revenue, cogs, variable_non_ad_costs, ad_spend",
    "Implementation Logic": "One of the best scale-quality metrics if the data exists.",
    "Suggested Alert / Interpretation Rule": "Flag when ROAS looks healthy but this turns weak or negative."
  },
  {
    "Custom Metric / Signal": "Profit per Order",
    "Equation or Rule": "Contribution Margin After Ad Spend / Orders",
    "Inputs Needed": "contribution_margin_after_ad_spend, orders",
    "Implementation Logic": "Helps compare growth quality across periods.",
    "Suggested Alert / Interpretation Rule": "Flag when order growth lowers real profit per order."
  },
  {
    "Custom Metric / Signal": "Creative Fatigue Signal",
    "Equation or Rule": "Rule-based signal",
    "Inputs Needed": "frequency, ctr, cpc, purchase_cvr",
    "Implementation Logic": "Suggested rule: frequency up vs 7d/30d baseline, CTR down, and CPC up or CVR down.",
    "Suggested Alert / Interpretation Rule": "Flag when at least 2 fatigue conditions are met with enough spend or impressions."
  },
  {
    "Custom Metric / Signal": "Scaling Efficiency Signal",
    "Equation or Rule": "Rule-based signal",
    "Inputs Needed": "spend_change, revenue_change, mer_change, cac_change",
    "Implementation Logic": "Suggested rule: spend rises faster than revenue while MER falls or CAC rises beyond tolerance.",
    "Suggested Alert / Interpretation Rule": "Flag when scaling worsens efficiency beyond the acceptable band."
  },
  {
    "Custom Metric / Signal": "Under-Scaling Signal",
    "Equation or Rule": "Rule-based opportunity signal",
    "Inputs Needed": "spend, roas, mer, frequency",
    "Implementation Logic": "Suggested rule: low spend, strong efficiency, low saturation, stable conversion quality.",
    "Suggested Alert / Interpretation Rule": "Flag as opportunity when efficient units remain unsaturated."
  },
  {
    "Custom Metric / Signal": "Tracking Gap Signal",
    "Equation or Rule": "Compare platform truth vs website truth",
    "Inputs Needed": "platform_attributed_revenue, store_revenue, platform_purchases, store_orders",
    "Implementation Logic": "Suggested rule: calculate % gap between platform totals and site totals.",
    "Suggested Alert / Interpretation Rule": "Flag when the gap moves outside historical normal range."
  },
  {
    "Custom Metric / Signal": "Benchmark Variance",
    "Equation or Rule": "(Current Metric - Expected Baseline) / Expected Baseline",
    "Inputs Needed": "current_metric, expected_baseline",
    "Implementation Logic": "Core benchmark comparison metric.",
    "Suggested Alert / Interpretation Rule": "Flag when variance exceeds acceptable range adjusted for volatility."
  },
  {
    "Custom Metric / Signal": "Volatility Score",
    "Equation or Rule": "Rolling variability measure",
    "Inputs Needed": "historical_metric_series",
    "Implementation Logic": "Suggested method: rolling coefficient of variation or rolling std dev vs mean.",
    "Suggested Alert / Interpretation Rule": "Use to reduce confidence when a metric is noisy."
  },
  {
    "Custom Metric / Signal": "Anomaly Flag",
    "Equation or Rule": "Alert when metric is outside expected band",
    "Inputs Needed": "benchmark_variance, volatility_score, confidence_flag",
    "Implementation Logic": "Suggested rule: trigger only when variance is large and confidence is not low.",
    "Suggested Alert / Interpretation Rule": "Do not alert aggressively on low-volume data."
  }
] as const;
