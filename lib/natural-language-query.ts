// Natural Language Query Parser
// Parses natural language questions into structured database queries
// Uses pattern matching with Gemini fallback for complex queries

export interface ParsedQuery {
  intent: string
  collection: 'income' | 'spending' | 'loans' | 'clients' | 'todos' | 'all'
  filters: QueryFilter[]
  sortBy?: { field: string; order: 'asc' | 'desc' }
  limit?: number
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  field?: string
  timeRange?: { start: Date; end: Date }
  description: string
}

export interface QueryFilter {
  field: string
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not' | 'exists'
  value: any
}

export interface NLQueryResult {
  query: ParsedQuery
  results: any[]
  summary: string
  visualization?: 'table' | 'chart' | 'number' | 'list'
}

// Pattern definitions for natural language parsing
interface QueryPattern {
  patterns: RegExp[]
  handler: (match: RegExpMatchArray, fullQuery: string) => ParsedQuery
}

/**
 * Parse a natural language query into a structured query
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery | null {
  const q = query.toLowerCase().trim()

  // Try each pattern
  for (const pattern of queryPatterns) {
    for (const regex of pattern.patterns) {
      const match = q.match(regex)
      if (match) {
        return pattern.handler(match, q)
      }
    }
  }

  // Generic fallback — try to infer collection and intent
  return inferFromKeywords(q)
}

/**
 * Execute a parsed query against local data arrays
 */
export function executeLocalQuery(
  parsedQuery: ParsedQuery,
  data: {
    incomeEntries: any[]
    spendingEntries: any[]
    loanEntries: any[]
    clients: any[]
    todos: any[]
  }
): NLQueryResult {
  let results: any[] = []
  const collection = parsedQuery.collection

  // Select the target dataset
  switch (collection) {
    case 'income':
      results = [...data.incomeEntries]
      break
    case 'spending':
      results = [...data.spendingEntries]
      break
    case 'loans':
      results = [...data.loanEntries]
      break
    case 'clients':
      results = [...data.clients]
      break
    case 'todos':
      results = [...data.todos]
      break
    case 'all':
      // Merge all with a type tag
      results = [
        ...data.incomeEntries.map(e => ({ ...e, _type: 'income' })),
        ...data.spendingEntries.map(e => ({ ...e, _type: 'spending' })),
        ...data.loanEntries.map(e => ({ ...e, _type: 'loan' })),
        ...data.clients.map(e => ({ ...e, _type: 'client' })),
      ]
      break
  }

  // Apply time range filter
  if (parsedQuery.timeRange) {
    results = results.filter(item => {
      const itemDate = new Date(item.date || item.createdAt)
      if (isNaN(itemDate.getTime())) return false
      return itemDate >= parsedQuery.timeRange!.start && itemDate <= parsedQuery.timeRange!.end
    })
  }

  // Apply filters
  for (const filter of parsedQuery.filters) {
    results = results.filter(item => {
      const value = getNestedValue(item, filter.field)
      switch (filter.operator) {
        case 'eq': return value == filter.value
        case 'gt': return typeof value === 'number' && value > filter.value
        case 'gte': return typeof value === 'number' && value >= filter.value
        case 'lt': return typeof value === 'number' && value < filter.value
        case 'lte': return typeof value === 'number' && value <= filter.value
        case 'contains':
          return typeof value === 'string' && value.toLowerCase().includes(String(filter.value).toLowerCase())
        case 'not': return value !== filter.value
        case 'exists': return value !== undefined && value !== null
        default: return true
      }
    })
  }

  // Apply sorting
  if (parsedQuery.sortBy) {
    const { field, order } = parsedQuery.sortBy
    results.sort((a, b) => {
      const va = getNestedValue(a, field)
      const vb = getNestedValue(b, field)
      if (typeof va === 'number' && typeof vb === 'number') {
        return order === 'asc' ? va - vb : vb - va
      }
      return order === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
  }

  // Apply limit
  if (parsedQuery.limit) {
    results = results.slice(0, parsedQuery.limit)
  }

  // Apply aggregation
  let summary = ''
  let visualization: NLQueryResult['visualization'] = 'table'

  if (parsedQuery.aggregation && results.length > 0) {
    const field = parsedQuery.field || 'amount'
    const values = results.map(r => getNestedValue(r, field)).filter(v => typeof v === 'number') as number[]

    let aggResult: number
    switch (parsedQuery.aggregation) {
      case 'sum':
        aggResult = values.reduce((s, v) => s + v, 0)
        summary = `Total ${field}: $${aggResult.toLocaleString()}`
        break
      case 'avg':
        aggResult = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0
        summary = `Average ${field}: $${aggResult.toLocaleString()}`
        break
      case 'count':
        aggResult = results.length
        summary = `Count: ${aggResult}`
        break
      case 'min':
        aggResult = Math.min(...values)
        summary = `Minimum ${field}: $${aggResult.toLocaleString()}`
        break
      case 'max':
        aggResult = Math.max(...values)
        summary = `Maximum ${field}: $${aggResult.toLocaleString()}`
        break
    }
    visualization = 'number'
  } else {
    summary = `Found ${results.length} result${results.length !== 1 ? 's' : ''}`
    visualization = results.length > 0 ? 'table' : 'list'
  }

  return {
    query: parsedQuery,
    results,
    summary,
    visualization
  }
}

// Helper to get nested values like "client.name"
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, key) => o?.[key], obj)
}

// Parse relative time expressions
function parseTimeExpression(expr: string): { start: Date; end: Date } | null {
  const now = new Date()
  const end = new Date(now)

  const match = expr.match(/(\d+)\s*(day|week|month|year)s?/)
  if (match) {
    const amount = parseInt(match[1])
    const unit = match[2]
    const start = new Date(now)

    switch (unit) {
      case 'day': start.setDate(start.getDate() - amount); break
      case 'week': start.setDate(start.getDate() - amount * 7); break
      case 'month': start.setMonth(start.getMonth() - amount); break
      case 'year': start.setFullYear(start.getFullYear() - amount); break
    }
    return { start, end }
  }

  // "last month", "this month", "last year" etc.
  if (expr.includes('last month')) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return { start, end }
  }
  if (expr.includes('this month')) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start, end }
  }
  if (expr.includes('last year')) {
    const start = new Date(now.getFullYear() - 1, 0, 1)
    const end = new Date(now.getFullYear() - 1, 11, 31)
    return { start, end }
  }
  if (expr.includes('this year')) {
    const start = new Date(now.getFullYear(), 0, 1)
    return { start, end }
  }
  if (expr.includes('last quarter')) {
    const currentQuarter = Math.floor(now.getMonth() / 3)
    const start = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1)
    const end = new Date(now.getFullYear(), currentQuarter * 3, 0)
    return { start, end }
  }

  return null
}

// Query patterns — each maps regex patterns to a handler
const queryPatterns: QueryPattern[] = [
  // Clients who haven't paid / transacted in N days
  {
    patterns: [
      /clients?\s+(?:who\s+)?(?:haven'?t|have\s+not|didn'?t|not)\s+(?:paid|transacted|bought|invoiced|ordered)\s+(?:in|for|since)\s+(\d+)\s*(day|week|month|year)s?/i,
      /(?:show|find|list|get)?\s*(?:me\s+)?(?:all\s+)?clients?\s+(?:inactive|dormant|idle)\s+(?:for|since)\s+(\d+)\s*(day|week|month|year)s?/i,
      /(?:who|which)\s+clients?\s+(?:are\s+)?(?:inactive|dormant)\s+(?:for\s+)?(?:more\s+than\s+)?(\d+)\s*(day|week|month|year)s?/i,
    ],
    handler: (match, fullQuery) => {
      const amount = parseInt(match[1])
      const unit = match[2]
      let days = amount
      switch (unit) {
        case 'week': days = amount * 7; break
        case 'month': days = amount * 30; break
        case 'year': days = amount * 365; break
      }

      return {
        intent: `Find clients with no transactions in the last ${amount} ${unit}(s)`,
        collection: 'clients',
        filters: [],
        description: `Clients inactive for ${amount} ${unit}(s) (${days} days)`,
        // Special marker for post-processing with income data
        _inactiveDays: days
      } as any
    }
  },

  // Top N clients by revenue
  {
    patterns: [
      /(?:show|find|list|get|who\s+are)?\s*(?:me\s+)?(?:my\s+)?(?:top|best|highest)\s+(\d+)?\s*clients?\s*(?:by\s+)?(?:revenue|income|earnings|sales)?/i,
    ],
    handler: (match) => ({
      intent: 'Top clients by revenue',
      collection: 'clients',
      filters: [],
      sortBy: { field: 'totalRevenue', order: 'desc' },
      limit: parseInt(match[1]) || 5,
      description: `Top ${match[1] || 5} clients by revenue`
    })
  },

  // Spending over/above/more than $X
  {
    patterns: [
      /(?:show|find|list|get)?\s*(?:me\s+)?(?:all\s+)?(?:spending|expenses?|costs?)\s+(?:over|above|more\s+than|greater\s+than|exceeding)\s+\$?(\d+[\d,]*)/i,
    ],
    handler: (match) => ({
      intent: 'Spending above threshold',
      collection: 'spending',
      filters: [{ field: 'amount', operator: 'gt', value: parseFloat(match[1].replace(/,/g, '')) }],
      sortBy: { field: 'amount', order: 'desc' },
      description: `Spending entries over $${match[1]}`
    })
  },

  // Income/revenue from specific source/client
  {
    patterns: [
      /(?:show|find|list|get|how\s+much)?\s*(?:me\s+)?(?:all\s+)?(?:income|revenue|earnings|payments?)\s+(?:from|by)\s+(.+)/i,
    ],
    handler: (match) => ({
      intent: 'Income from specific source',
      collection: 'income',
      filters: [{ field: 'source', operator: 'contains', value: match[1].trim() }],
      aggregation: 'sum',
      field: 'amount',
      description: `Income from "${match[1].trim()}"`
    })
  },

  // Unpaid/outstanding loans
  {
    patterns: [
      /(?:show|find|list|get)?\s*(?:me\s+)?(?:all\s+)?(?:unpaid|outstanding|pending|active)\s+loans?/i,
      /(?:how\s+much\s+do\s+i\s+owe|total\s+(?:loan|debt)s?|what.*loans?\s+(?:are\s+)?(?:outstanding|unpaid))/i,
    ],
    handler: () => ({
      intent: 'Outstanding loans',
      collection: 'loans',
      filters: [{ field: 'isPaid', operator: 'eq', value: false }],
      aggregation: 'sum',
      field: 'amount',
      description: 'All unpaid/outstanding loans'
    })
  },

  // Overdue/incomplete todos
  {
    patterns: [
      /(?:show|find|list|get)?\s*(?:me\s+)?(?:all\s+)?(?:overdue|late|missed|incomplete|pending)\s+(?:todos?|tasks?)/i,
      /(?:what|which)\s+(?:todos?|tasks?)\s+(?:are\s+)?(?:overdue|late|incomplete|pending)/i,
    ],
    handler: () => {
      const now = new Date()
      return {
        intent: 'Overdue tasks',
        collection: 'todos',
        filters: [
          { field: 'completed', operator: 'eq', value: false },
        ],
        description: 'Incomplete/overdue tasks'
      }
    }
  },

  // Spending in last N days/months
  {
    patterns: [
      /(?:show|find|list|get|how\s+much)?\s*(?:me\s+)?(?:all\s+)?(?:total\s+)?(?:spending|expenses?|costs?)\s+(?:in\s+(?:the\s+)?)?(?:last|past)\s+(\d+)\s*(day|week|month|year)s?/i,
    ],
    handler: (match) => {
      const timeRange = parseTimeExpression(`${match[1]} ${match[2]}s`)
      return {
        intent: `Spending in the last ${match[1]} ${match[2]}(s)`,
        collection: 'spending',
        filters: [],
        timeRange: timeRange || undefined,
        aggregation: 'sum',
        field: 'amount',
        description: `Total spending in the last ${match[1]} ${match[2]}(s)`
      }
    }
  },

  // Income in last N days/months
  {
    patterns: [
      /(?:show|find|list|get|how\s+much)?\s*(?:me\s+)?(?:all\s+)?(?:total\s+)?(?:income|revenue|earnings)\s+(?:in\s+(?:the\s+)?)?(?:last|past)\s+(\d+)\s*(day|week|month|year)s?/i,
    ],
    handler: (match) => {
      const timeRange = parseTimeExpression(`${match[1]} ${match[2]}s`)
      return {
        intent: `Income in the last ${match[1]} ${match[2]}(s)`,
        collection: 'income',
        filters: [],
        timeRange: timeRange || undefined,
        aggregation: 'sum',
        field: 'amount',
        description: `Total income in the last ${match[1]} ${match[2]}(s)`
      }
    }
  },

  // Largest/biggest expenses
  {
    patterns: [
      /(?:show|find|list|get|what\s+(?:are|is))?\s*(?:me\s+)?(?:my\s+)?(?:(?:top|largest|biggest|highest)\s+(\d+)?)\s*(?:expenses?|spending|costs?)/i,
    ],
    handler: (match) => ({
      intent: 'Largest expenses',
      collection: 'spending',
      filters: [],
      sortBy: { field: 'amount', order: 'desc' },
      limit: parseInt(match[1]) || 10,
      description: `Top ${match[1] || 10} largest expenses`
    })
  },

  // Average transaction value
  {
    patterns: [
      /(?:what\s+is\s+)?(?:my\s+)?average\s+(?:income|revenue|transaction|spending|expense)\s*(?:value|amount)?/i,
    ],
    handler: (match) => {
      const isSpending = /spending|expense/.test(match[0])
      return {
        intent: `Average ${isSpending ? 'spending' : 'income'} per transaction`,
        collection: isSpending ? 'spending' : 'income',
        filters: [],
        aggregation: 'avg',
        field: 'amount',
        description: `Average ${isSpending ? 'spending' : 'income'} amount`
      }
    }
  },

  // How many clients/transactions
  {
    patterns: [
      /how\s+many\s+(clients?|customers?|transactions?|income\s+entries?|spending\s+entries?|expenses?|loans?|todos?|tasks?)/i,
    ],
    handler: (match) => {
      const subject = match[1].toLowerCase()
      let collection: ParsedQuery['collection'] = 'clients'
      if (/income|transaction/.test(subject)) collection = 'income'
      else if (/spending|expense/.test(subject)) collection = 'spending'
      else if (/loan/.test(subject)) collection = 'loans'
      else if (/todo|task/.test(subject)) collection = 'todos'
      else collection = 'clients'

      return {
        intent: `Count ${subject}`,
        collection,
        filters: [],
        aggregation: 'count',
        description: `Total number of ${subject}`
      }
    }
  },

  // Spending on specific category
  {
    patterns: [
      /(?:how\s+much\s+(?:did\s+(?:i|we)\s+)?(?:spend|spent)|(?:show|find|total)\s+(?:me\s+)?(?:all\s+)?spending)\s+on\s+(.+?)(?:\s+(?:in|during|for|last)\s+.*)?$/i,
    ],
    handler: (match) => {
      const category = match[1].trim()
      return {
        intent: `Spending on ${category}`,
        collection: 'spending',
        filters: [{ field: 'reason', operator: 'contains', value: category }],
        aggregation: 'sum',
        field: 'amount',
        description: `Total spending on "${category}"`
      }
    }
  },
]

/**
 * Fallback: infer intent from keywords
 */
function inferFromKeywords(q: string): ParsedQuery | null {
  // Determine collection
  let collection: ParsedQuery['collection'] = 'all'
  if (/income|revenue|earn|payment|paid\s+me/.test(q)) collection = 'income'
  else if (/spend|expense|cost|paid\s+for|bought/.test(q)) collection = 'spending'
  else if (/loan|debt|owe|borrow/.test(q)) collection = 'loans'
  else if (/client|customer/.test(q)) collection = 'clients'
  else if (/todo|task|reminder/.test(q)) collection = 'todos'

  if (collection === 'all') return null

  // Determine intent
  let aggregation: ParsedQuery['aggregation'] | undefined
  if (/total|sum|how\s+much/.test(q)) aggregation = 'sum'
  else if (/average|avg|mean/.test(q)) aggregation = 'avg'
  else if (/count|how\s+many|number\s+of/.test(q)) aggregation = 'count'
  else if (/max|largest|biggest|highest|most/.test(q)) aggregation = 'max'
  else if (/min|smallest|lowest|least|cheapest/.test(q)) aggregation = 'min'

  // Time range
  let timeRange: ParsedQuery['timeRange'] | undefined
  const timeMatch = q.match(/(?:last|past)\s+(\d+)\s*(day|week|month|year)s?/)
  if (timeMatch) {
    timeRange = parseTimeExpression(`${timeMatch[1]} ${timeMatch[2]}s`) || undefined
  }

  // Sort
  let sortBy: ParsedQuery['sortBy'] | undefined
  if (/top|largest|biggest|highest|most|best/.test(q)) {
    sortBy = { field: 'amount', order: 'desc' }
  } else if (/smallest|lowest|least|cheapest|worst/.test(q)) {
    sortBy = { field: 'amount', order: 'asc' }
  }

  return {
    intent: `Query ${collection}`,
    collection,
    filters: [],
    aggregation,
    field: aggregation ? 'amount' : undefined,
    timeRange,
    sortBy,
    limit: sortBy ? 10 : undefined,
    description: `Search ${collection} data`
  }
}

/**
 * Format NLQ results into a human-readable chat message
 */
export function formatNLQueryResponse(result: NLQueryResult): string {
  const { query, results, summary } = result

  let response = `🔍 **Natural Language Query**\n`
  response += `*"${query.description}"*\n\n`

  if (results.length === 0) {
    response += `No results found matching your query.\n`
    response += `\n💡 Try:\n`
    response += `• Broadening your search criteria\n`
    response += `• Checking if you have data for that time period\n`
    response += `• Using different keywords\n`
    return response
  }

  // Aggregation result
  if (query.aggregation) {
    response += `📊 **${summary}**\n\n`
    if (results.length > 0 && !['count'].includes(query.aggregation)) {
      response += `Based on ${results.length} matching record${results.length !== 1 ? 's' : ''}\n`
    }
  }

  // Table results
  if (!query.aggregation || results.length <= 15) {
    const collection = query.collection

    if (collection === 'clients') {
      response += `\n| # | Client | Company | Revenue |\n|---|--------|---------|--------|\n`
      results.slice(0, 10).forEach((c, i) => {
        response += `| ${i + 1} | ${c.name || 'N/A'} | ${c.company || 'N/A'} | $${(c.totalRevenue || 0).toLocaleString()} |\n`
      })
    } else if (collection === 'income') {
      if (!query.aggregation) {
        response += `\n| # | Source | Amount | Date |\n|---|--------|--------|------|\n`
        results.slice(0, 10).forEach((e, i) => {
          response += `| ${i + 1} | ${e.source || 'N/A'} | $${(e.amount || 0).toLocaleString()} | ${e.date || 'N/A'} |\n`
        })
      }
    } else if (collection === 'spending') {
      if (!query.aggregation) {
        response += `\n| # | Reason | Amount | Date |\n|---|--------|--------|------|\n`
        results.slice(0, 10).forEach((e, i) => {
          response += `| ${i + 1} | ${e.reason || 'N/A'} | $${(e.amount || 0).toLocaleString()} | ${e.date || 'N/A'} |\n`
        })
      }
    } else if (collection === 'loans') {
      if (!query.aggregation) {
        response += `\n| # | Description | Amount | Status |\n|---|-------------|--------|--------|\n`
        results.slice(0, 10).forEach((l, i) => {
          response += `| ${i + 1} | ${l.description || 'N/A'} | $${(l.amount || 0).toLocaleString()} | ${l.isPaid ? '✅ Paid' : '⏳ Unpaid'} |\n`
        })
      }
    } else if (collection === 'todos') {
      response += `\n| # | Task | Due Date | Status |\n|---|------|----------|--------|\n`
      results.slice(0, 10).forEach((t, i) => {
        response += `| ${i + 1} | ${t.title || 'N/A'} | ${t.dueDate || 'N/A'} | ${t.completed ? '✅' : '⏳'} |\n`
      })
    }

    if (results.length > 10) {
      response += `\n*...and ${results.length - 10} more results*\n`
    }
  }

  return response
}

/**
 * Post-process query for client inactivity (needs income data cross-reference)
 */
export function processClientInactivityQuery(
  parsedQuery: any,
  clients: any[],
  incomeEntries: any[],
  inactiveDays: number
): NLQueryResult {
  const now = new Date()
  const cutoffDate = new Date(now.getTime() - inactiveDays * 24 * 60 * 60 * 1000)

  const inactiveClients = clients.map(client => {
    const clientIncome = incomeEntries.filter(e =>
      e.clientId === client.clientId ||
      (e.source && client.name && e.source.toLowerCase().includes(client.name.toLowerCase()))
    )

    const lastTransaction = clientIncome
      .map(e => new Date(e.date))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    const daysSince = lastTransaction
      ? Math.floor((now.getTime() - lastTransaction.getTime()) / (1000 * 60 * 60 * 24))
      : Infinity

    return {
      ...client,
      lastTransactionDate: lastTransaction?.toISOString().split('T')[0] || 'Never',
      daysSinceLastTransaction: daysSince,
      totalRevenue: clientIncome.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
    }
  }).filter(c => c.daysSinceLastTransaction >= inactiveDays)

  return {
    query: parsedQuery,
    results: inactiveClients,
    summary: `Found ${inactiveClients.length} client${inactiveClients.length !== 1 ? 's' : ''} inactive for ${inactiveDays}+ days`,
    visualization: 'table'
  }
}
