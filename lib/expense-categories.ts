// Expense category taxonomy and tagging utilities

export interface ExpenseCategory {
  id: string
  name: string
  icon: string
  color: string
  keywords: string[] // for auto-categorization
  subcategories?: string[]
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    id: "payroll",
    name: "Payroll",
    icon: "👥",
    color: "#3b82f6",
    keywords: ["payroll", "salary", "wages", "bonus", "employee", "contractor", "freelancer"],
    subcategories: ["Salaries", "Wages", "Bonuses", "Contractor Fees", "Benefits"],
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "📢",
    color: "#f59e0b",
    keywords: ["marketing", "ads", "advertising", "promotion", "campaign", "social media", "seo", "ppc", "branding"],
    subcategories: ["Digital Ads", "Print Ads", "Social Media", "SEO", "Events", "Branding"],
  },
  {
    id: "rent",
    name: "Rent & Lease",
    icon: "🏢",
    color: "#8b5cf6",
    keywords: ["rent", "lease", "office space", "warehouse", "storage"],
    subcategories: ["Office Rent", "Warehouse", "Storage", "Parking"],
  },
  {
    id: "utilities",
    name: "Utilities",
    icon: "⚡",
    color: "#06b6d4",
    keywords: ["utility", "electric", "electricity", "water", "gas", "internet", "phone", "wifi", "broadband"],
    subcategories: ["Electricity", "Water", "Gas", "Internet", "Phone"],
  },
  {
    id: "insurance",
    name: "Insurance",
    icon: "🛡️",
    color: "#14b8a6",
    keywords: ["insurance", "coverage", "policy", "premium", "liability"],
    subcategories: ["Health", "Property", "Liability", "Workers Comp"],
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    icon: "🔄",
    color: "#a855f7",
    keywords: ["subscription", "saas", "monthly", "annual", "membership", "plan"],
    subcategories: ["Software", "Services", "Media", "Memberships"],
  },
  {
    id: "travel",
    name: "Travel",
    icon: "✈️",
    color: "#ec4899",
    keywords: ["travel", "flight", "hotel", "airfare", "accommodation", "trip", "conference"],
    subcategories: ["Flights", "Hotels", "Ground Transport", "Meals", "Conference"],
  },
  {
    id: "office",
    name: "Office Supplies",
    icon: "📎",
    color: "#f97316",
    keywords: ["office", "supplies", "stationery", "paper", "printer", "ink", "furniture"],
    subcategories: ["Stationery", "Furniture", "Equipment", "Cleaning"],
  },
  {
    id: "software",
    name: "Software & Tools",
    icon: "💻",
    color: "#6366f1",
    keywords: ["software", "license", "tool", "app", "platform", "cloud", "hosting", "domain"],
    subcategories: ["Licenses", "Cloud Services", "Hosting", "Domains"],
  },
  {
    id: "professional",
    name: "Professional Services",
    icon: "👔",
    color: "#0ea5e9",
    keywords: ["consult", "consulting", "professional", "legal", "accounting", "audit", "lawyer", "attorney"],
    subcategories: ["Legal", "Accounting", "Consulting", "Audit"],
  },
  {
    id: "equipment",
    name: "Equipment",
    icon: "🔧",
    color: "#84cc16",
    keywords: ["equipment", "hardware", "machine", "device", "computer", "laptop", "server"],
    subcategories: ["Computers", "Machinery", "Vehicles", "Maintenance"],
  },
  {
    id: "meals",
    name: "Meals & Entertainment",
    icon: "🍽️",
    color: "#ef4444",
    keywords: ["meal", "food", "dinner", "lunch", "breakfast", "entertainment", "catering", "restaurant"],
    subcategories: ["Client Meals", "Team Meals", "Entertainment", "Catering"],
  },
  {
    id: "transport",
    name: "Transportation",
    icon: "🚗",
    color: "#78716c",
    keywords: ["transport", "uber", "taxi", "fuel", "gas", "parking", "toll", "vehicle", "commute"],
    subcategories: ["Fuel", "Parking", "Tolls", "Ride-share", "Vehicle Maintenance"],
  },
  {
    id: "taxes",
    name: "Taxes & Fees",
    icon: "🏛️",
    color: "#dc2626",
    keywords: ["tax", "fee", "government", "permit", "license", "filing", "compliance"],
    subcategories: ["Income Tax", "Sales Tax", "Permits", "Filing Fees"],
  },
  {
    id: "other",
    name: "Other",
    icon: "📦",
    color: "#9ca3af",
    keywords: [],
    subcategories: ["Miscellaneous", "Uncategorized"],
  },
]

// Auto-categorize a spending reason using keyword matching
export function autoCategorize(reason: string): ExpenseCategory {
  const lower = (reason || "").toLowerCase()
  for (const cat of EXPENSE_CATEGORIES) {
    if (cat.keywords.some((k) => lower.includes(k))) {
      return cat
    }
  }
  return EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1] // "Other"
}

// Get category by ID
export function getCategoryById(id: string): ExpenseCategory | undefined {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)
}

// Compute category breakdown from spending entries
export interface CategoryBreakdown {
  category: ExpenseCategory
  total: number
  count: number
  percentage: number
  entries: Array<{ reason: string; amount: number; date: string; tags?: string[] }>
}

export function computeCategoryBreakdown(
  spendingEntries: Array<{ reason: string; amount: number; date: string; category?: string; tags?: string[] }>
): CategoryBreakdown[] {
  const totals: Record<string, { total: number; count: number; entries: any[] }> = {}

  for (const entry of spendingEntries) {
    const cat = entry.category
      ? getCategoryById(entry.category) || autoCategorize(entry.reason)
      : autoCategorize(entry.reason)

    if (!totals[cat.id]) {
      totals[cat.id] = { total: 0, count: 0, entries: [] }
    }
    totals[cat.id].total += entry.amount
    totals[cat.id].count++
    totals[cat.id].entries.push(entry)
  }

  const grandTotal = Object.values(totals).reduce((sum, t) => sum + t.total, 0)

  return Object.entries(totals)
    .map(([catId, data]) => ({
      category: getCategoryById(catId) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1],
      total: data.total,
      count: data.count,
      percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      entries: data.entries,
    }))
    .sort((a, b) => b.total - a.total)
}

// Common predefined tags
export const PREDEFINED_TAGS: string[] = [
  "essential", "discretionary", "one-time", "recurring",
  "tax-deductible", "reimbursable", "client-billable",
  "urgent", "planned", "overdue", "quarterly", "annual",
]

// Parse tags from a comma-separated string
export function parseTags(tagString: string): string[] {
  return tagString
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
}
