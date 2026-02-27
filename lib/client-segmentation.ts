// Client Segmentation Engine
// Auto-groups clients by revenue tier, risk level, activity, and custom tags

export interface ClientForSegmentation {
  id: string
  clientId?: string
  name: string
  company: string
  totalIncome: number
  createdAt: string
  description?: string
  // Computed externally
  activityCount?: number
  lastActivityDate?: string
  contractCount?: number
  activeContractValue?: number
}

export interface Segment {
  id: string
  label: string
  color: string       // tailwind color class like "blue" | "green" etc.
  bgClass: string
  textClass: string
  badgeClass: string
  clients: ClientForSegmentation[]
  count: number
  totalRevenue: number
  avgRevenue: number
}

export interface SegmentationResult {
  segments: Segment[]
  segmentMap: Record<string, string[]> // segmentId → clientIds[]
  clientSegments: Record<string, string[]> // clientId → segmentIds[]
  summary: {
    totalClients: number
    totalRevenue: number
    segmentCount: number
    topSegment: string
    atRiskCount: number
  }
}

// Revenue tier thresholds (configurable)
const REVENUE_TIERS = [
  { id: "tier-enterprise", label: "Enterprise", min: 50000, color: "purple", bgClass: "bg-purple-100 dark:bg-purple-950/30", textClass: "text-purple-700 dark:text-purple-300", badgeClass: "bg-purple-500" },
  { id: "tier-premium", label: "Premium", min: 10000, color: "blue", bgClass: "bg-blue-100 dark:bg-blue-950/30", textClass: "text-blue-700 dark:text-blue-300", badgeClass: "bg-blue-500" },
  { id: "tier-standard", label: "Standard", min: 1000, color: "cyan", bgClass: "bg-cyan-100 dark:bg-cyan-950/30", textClass: "text-cyan-700 dark:text-cyan-300", badgeClass: "bg-cyan-500" },
  { id: "tier-starter", label: "Starter", min: 0, color: "gray", bgClass: "bg-gray-100 dark:bg-gray-800/30", textClass: "text-gray-700 dark:text-gray-300", badgeClass: "bg-gray-500" },
]

// Risk assessment
function assessRisk(client: ClientForSegmentation): "low" | "medium" | "high" {
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  // High risk: no revenue and older than 60 days, or no activity in 90+ days
  if (client.totalIncome === 0 && daysSinceCreated > 60) return "high"
  if (client.lastActivityDate) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(client.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceActivity > 90) return "high"
    if (daysSinceActivity > 45) return "medium"
  } else if (daysSinceCreated > 30 && client.activityCount === 0) {
    return "medium"
  }

  // Medium risk: very low revenue relative to age
  if (daysSinceCreated > 90 && client.totalIncome < 500) return "medium"

  return "low"
}

// Activity level assessment
function assessActivityLevel(client: ClientForSegmentation): "active" | "moderate" | "inactive" {
  if (!client.activityCount || client.activityCount === 0) return "inactive"
  if (client.activityCount >= 10) return "active"
  if (client.activityCount >= 3) return "moderate"
  return "inactive"
}

// Industry guess from company name / description (simple heuristic)
function guessIndustry(client: ClientForSegmentation): string {
  const text = `${client.company} ${client.description || ""}`.toLowerCase()
  const industries: Record<string, string[]> = {
    "Technology": ["tech", "software", "saas", "app", "digital", "cloud", "ai", "data", "cyber", "web", "dev", "code", "it services"],
    "Finance": ["bank", "finance", "fintech", "capital", "invest", "insurance", "fund", "trading", "wealth"],
    "Healthcare": ["health", "medical", "pharma", "biotech", "clinic", "hospital", "care", "dental", "wellness"],
    "Retail": ["retail", "shop", "store", "ecommerce", "commerce", "market", "brand", "fashion", "apparel"],
    "Consulting": ["consult", "advisory", "strategy", "management consult"],
    "Real Estate": ["real estate", "property", "realty", "housing", "construction", "building"],
    "Marketing": ["marketing", "agency", "media", "advertising", "creative", "design", "pr ", "branding"],
    "Education": ["education", "school", "university", "training", "learn", "academy", "tutor"],
    "Manufacturing": ["manufactur", "factory", "industrial", "production", "supply chain"],
    "Legal": ["law", "legal", "attorney", "firm", "litigation"],
  }

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some((kw) => text.includes(kw))) return industry
  }
  return "Other"
}

export function segmentClients(clients: ClientForSegmentation[]): SegmentationResult {
  const segmentMap: Record<string, string[]> = {}
  const clientSegments: Record<string, string[]> = {}

  function addToSegment(segmentId: string, clientId: string) {
    if (!segmentMap[segmentId]) segmentMap[segmentId] = []
    segmentMap[segmentId].push(clientId)
    if (!clientSegments[clientId]) clientSegments[clientId] = []
    clientSegments[clientId].push(segmentId)
  }

  // --- Revenue Tier segmentation ---
  for (const client of clients) {
    const cid = client.clientId || client.id
    for (const tier of REVENUE_TIERS) {
      if (client.totalIncome >= tier.min) {
        addToSegment(tier.id, cid)
        break // only highest tier
      }
    }
  }

  // --- Risk Level segmentation ---
  const riskSegments = {
    "risk-high": { label: "High Risk", bgClass: "bg-red-100 dark:bg-red-950/30", textClass: "text-red-700 dark:text-red-300", badgeClass: "bg-red-500", color: "red" },
    "risk-medium": { label: "Medium Risk", bgClass: "bg-amber-100 dark:bg-amber-950/30", textClass: "text-amber-700 dark:text-amber-300", badgeClass: "bg-amber-500", color: "amber" },
    "risk-low": { label: "Low Risk", bgClass: "bg-green-100 dark:bg-green-950/30", textClass: "text-green-700 dark:text-green-300", badgeClass: "bg-green-500", color: "green" },
  }
  for (const client of clients) {
    const cid = client.clientId || client.id
    const risk = assessRisk(client)
    addToSegment(`risk-${risk}`, cid)
  }

  // --- Activity Level segmentation ---
  const activitySegments = {
    "activity-active": { label: "Active", bgClass: "bg-emerald-100 dark:bg-emerald-950/30", textClass: "text-emerald-700 dark:text-emerald-300", badgeClass: "bg-emerald-500", color: "emerald" },
    "activity-moderate": { label: "Moderate", bgClass: "bg-sky-100 dark:bg-sky-950/30", textClass: "text-sky-700 dark:text-sky-300", badgeClass: "bg-sky-500", color: "sky" },
    "activity-inactive": { label: "Inactive", bgClass: "bg-slate-100 dark:bg-slate-800/30", textClass: "text-slate-600 dark:text-slate-400", badgeClass: "bg-slate-500", color: "slate" },
  }
  for (const client of clients) {
    const cid = client.clientId || client.id
    const level = assessActivityLevel(client)
    addToSegment(`activity-${level}`, cid)
  }

  // --- Industry segmentation ---
  const industryColors: Record<string, { bgClass: string; textClass: string; badgeClass: string; color: string }> = {
    Technology: { bgClass: "bg-violet-100 dark:bg-violet-950/30", textClass: "text-violet-700 dark:text-violet-300", badgeClass: "bg-violet-500", color: "violet" },
    Finance: { bgClass: "bg-emerald-100 dark:bg-emerald-950/30", textClass: "text-emerald-700 dark:text-emerald-300", badgeClass: "bg-emerald-500", color: "emerald" },
    Healthcare: { bgClass: "bg-pink-100 dark:bg-pink-950/30", textClass: "text-pink-700 dark:text-pink-300", badgeClass: "bg-pink-500", color: "pink" },
    Retail: { bgClass: "bg-orange-100 dark:bg-orange-950/30", textClass: "text-orange-700 dark:text-orange-300", badgeClass: "bg-orange-500", color: "orange" },
    Consulting: { bgClass: "bg-teal-100 dark:bg-teal-950/30", textClass: "text-teal-700 dark:text-teal-300", badgeClass: "bg-teal-500", color: "teal" },
    "Real Estate": { bgClass: "bg-amber-100 dark:bg-amber-950/30", textClass: "text-amber-700 dark:text-amber-300", badgeClass: "bg-amber-500", color: "amber" },
    Marketing: { bgClass: "bg-fuchsia-100 dark:bg-fuchsia-950/30", textClass: "text-fuchsia-700 dark:text-fuchsia-300", badgeClass: "bg-fuchsia-500", color: "fuchsia" },
    Education: { bgClass: "bg-indigo-100 dark:bg-indigo-950/30", textClass: "text-indigo-700 dark:text-indigo-300", badgeClass: "bg-indigo-500", color: "indigo" },
    Manufacturing: { bgClass: "bg-stone-100 dark:bg-stone-800/30", textClass: "text-stone-700 dark:text-stone-300", badgeClass: "bg-stone-500", color: "stone" },
    Legal: { bgClass: "bg-rose-100 dark:bg-rose-950/30", textClass: "text-rose-700 dark:text-rose-300", badgeClass: "bg-rose-500", color: "rose" },
    Other: { bgClass: "bg-gray-100 dark:bg-gray-800/30", textClass: "text-gray-600 dark:text-gray-400", badgeClass: "bg-gray-500", color: "gray" },
  }

  for (const client of clients) {
    const cid = client.clientId || client.id
    const industry = guessIndustry(client)
    addToSegment(`industry-${industry.toLowerCase().replace(/\s+/g, "-")}`, cid)
  }

  // Build segment objects
  const allSegmentsDefs: Record<string, { label: string; bgClass: string; textClass: string; badgeClass: string; color: string }> = {}
  for (const tier of REVENUE_TIERS) allSegmentsDefs[tier.id] = { label: tier.label, bgClass: tier.bgClass, textClass: tier.textClass, badgeClass: tier.badgeClass, color: tier.color }
  Object.assign(allSegmentsDefs, riskSegments, activitySegments)
  for (const [ind, style] of Object.entries(industryColors)) {
    allSegmentsDefs[`industry-${ind.toLowerCase().replace(/\s+/g, "-")}`] = { label: ind, ...style }
  }

  const segments: Segment[] = []
  for (const [segId, clientIds] of Object.entries(segmentMap)) {
    if (clientIds.length === 0) continue
    const segClients = clientIds
      .map((cid) => clients.find((c) => (c.clientId || c.id) === cid))
      .filter(Boolean) as ClientForSegmentation[]
    const totalRevenue = segClients.reduce((s, c) => s + c.totalIncome, 0)
    const def = allSegmentsDefs[segId] || { label: segId, bgClass: "bg-gray-100", textClass: "text-gray-700", badgeClass: "bg-gray-500", color: "gray" }
    segments.push({
      id: segId,
      label: def.label,
      color: def.color,
      bgClass: def.bgClass,
      textClass: def.textClass,
      badgeClass: def.badgeClass,
      clients: segClients,
      count: segClients.length,
      totalRevenue,
      avgRevenue: segClients.length > 0 ? totalRevenue / segClients.length : 0,
    })
  }

  // Sort: revenue tiers first, then risk, then activity, then industry
  const orderPrefix = ["tier-", "risk-", "activity-", "industry-"]
  segments.sort((a, b) => {
    const aIdx = orderPrefix.findIndex((p) => a.id.startsWith(p))
    const bIdx = orderPrefix.findIndex((p) => b.id.startsWith(p))
    if (aIdx !== bIdx) return aIdx - bIdx
    return b.totalRevenue - a.totalRevenue
  })

  const totalRevenue = clients.reduce((s, c) => s + c.totalIncome, 0)
  const atRiskCount = (segmentMap["risk-high"]?.length || 0) + (segmentMap["risk-medium"]?.length || 0)
  const topSegment = segments.length > 0 ? segments[0].label : "None"

  return {
    segments,
    segmentMap,
    clientSegments,
    summary: {
      totalClients: clients.length,
      totalRevenue,
      segmentCount: segments.length,
      topSegment,
      atRiskCount,
    },
  }
}

// Utility: get all segment badges for a single client
export function getClientBadges(
  clientId: string,
  segResult: SegmentationResult
): Array<{ id: string; label: string; color: string; bgClass: string; textClass: string; badgeClass: string }> {
  const segIds = segResult.clientSegments[clientId] || []
  return segIds
    .map((sid) => {
      const seg = segResult.segments.find((s) => s.id === sid)
      return seg ? { id: seg.id, label: seg.label, color: seg.color, bgClass: seg.bgClass, textClass: seg.textClass, badgeClass: seg.badgeClass } : null
    })
    .filter(Boolean) as Array<{ id: string; label: string; color: string; bgClass: string; textClass: string; badgeClass: string }>
}
