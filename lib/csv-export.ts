// Generic CSV export utility for any data table

interface ExportConfig {
  filename: string
  headers: string[]
  rows: (string | number)[][]
}

function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  // Escape quotes and wrap in quotes if the value contains commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCSV(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCSV).join(",")
  const dataLines = rows.map((row) => row.map(escapeCSV).join(","))
  return [headerLine, ...dataLines].join("\n")
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\uFEFF" + content], { type: mimeType }) // BOM for Excel compatibility
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ==================== INCOME ====================
export function exportIncomeCSV(
  entries: Array<{ source: string; amount: number; date: string; id?: string }>,
  filename?: string
) {
  const headers = ["Date", "Source", "Amount ($)"]
  const rows = entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((e) => [
      new Date(e.date).toLocaleDateString("en-US"),
      e.source,
      e.amount,
    ])

  const total = entries.reduce((s, e) => s + e.amount, 0)
  rows.push(["", "TOTAL", total])

  const csv = buildCSV(headers, rows)
  downloadBlob(csv, filename || `income_export_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8")
}

// ==================== SPENDING ====================
export function exportSpendingCSV(
  entries: Array<{ reason: string; amount: number; date: string; id?: string }>,
  filename?: string
) {
  const headers = ["Date", "Reason", "Amount ($)"]
  const rows = entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((e) => [
      new Date(e.date).toLocaleDateString("en-US"),
      e.reason,
      e.amount,
    ])

  const total = entries.reduce((s, e) => s + e.amount, 0)
  rows.push(["", "TOTAL", total])

  const csv = buildCSV(headers, rows)
  downloadBlob(csv, filename || `spending_export_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8")
}

// ==================== CLIENTS ====================
export function exportClientsCSV(
  clients: Array<{ name: string; company: string; clientId?: string; email?: string; phone?: string }>,
  filename?: string
) {
  const headers = ["Name", "Company", "Client ID", "Email", "Phone"]
  const rows = clients.map((c) => [
    c.name || "",
    c.company || "",
    c.clientId || "",
    c.email || "",
    c.phone || "",
  ])

  const csv = buildCSV(headers, rows)
  downloadBlob(csv, filename || `clients_export_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8")
}

// ==================== TODOS ====================
export function exportTodosCSV(
  todos: Array<{ title: string; dueDate?: string; dueTime?: string; completed: boolean; id?: string }>,
  filename?: string
) {
  const headers = ["Title", "Due Date", "Due Time", "Status"]
  const rows = todos.map((t) => [
    t.title,
    t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US") : "",
    t.dueTime || "",
    t.completed ? "Completed" : "Pending",
  ])

  const csv = buildCSV(headers, rows)
  downloadBlob(csv, filename || `todos_export_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8")
}

// ==================== LOANS ====================
export function exportLoansCSV(
  loans: Array<{ amount: number; description: string; isPaid: boolean; date: string; id?: string }>,
  filename?: string
) {
  const headers = ["Date", "Description", "Amount ($)", "Status"]
  const rows = loans
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((l) => [
      new Date(l.date).toLocaleDateString("en-US"),
      l.description,
      l.amount,
      l.isPaid ? "Paid" : "Outstanding",
    ])

  const totalOutstanding = loans.filter((l) => !l.isPaid).reduce((s, l) => s + l.amount, 0)
  rows.push(["", "TOTAL OUTSTANDING", totalOutstanding, ""])

  const csv = buildCSV(headers, rows)
  downloadBlob(csv, filename || `loans_export_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8")
}

// ==================== GENERIC (any table) ====================
export function exportGenericCSV(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  filename: string
) {
  const csv = buildCSV(headers, rows)
  downloadBlob(csv, filename, "text/csv;charset=utf-8")
}
