# Implementation Guide - Top Priority Features

This guide provides detailed implementation steps for the **highest priority** features identified in the Feature Enhancement Roadmap.

---

## 1. Invoice Management System

### Overview
Build a complete invoice lifecycle management system integrated with the existing client and income modules.

### Database Schema

**New Collection: `invoices`**
```javascript
{
  _id: ObjectId,
  userId: String,           // Supabase user ID
  clientId: String,         // Link to clients collection
  invoiceNumber: String,    // Auto-generated: INV-2024-001
  status: String,           // 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  items: [{
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number
  }],
  subtotal: Number,
  tax: Number,              // Tax percentage
  taxAmount: Number,
  total: Number,
  currency: String,         // 'USD', 'EUR', etc.
  issueDate: Date,
  dueDate: Date,
  paidDate: Date,           // When payment received
  notes: String,
  terms: String,            // Payment terms
  __encrypted: Boolean,     // Support encryption
  encrypted: String,        // Encrypted payload if __encrypted
  createdAt: Date,
  updatedAt: Date
}
```

### Implementation Steps

#### Phase 1: Backend API (Week 1)

1. **Create Invoice API Routes** (`/app/api/invoices/route.js`)

```javascript
// POST /api/invoices - Create invoice
// GET /api/invoices - List invoices
// PUT /api/invoices/[id] - Update invoice
// DELETE /api/invoices/[id] - Delete invoice
```

2. **Add Invoice Number Generator**
```javascript
// lib/invoice-utils.js
export async function generateInvoiceNumber(db, userId) {
  const year = new Date().getFullYear();
  const count = await db.collection('invoices')
    .countDocuments({ 
      userId, 
      createdAt: { 
        $gte: new Date(`${year}-01-01`) 
      } 
    });
  return `INV-${year}-${String(count + 1).padStart(3, '0')}`;
}
```

3. **Status Management Functions**
```javascript
// Automatically mark overdue
export function updateInvoiceStatus(invoice) {
  if (invoice.status === 'sent' && new Date(invoice.dueDate) < new Date()) {
    return 'overdue';
  }
  return invoice.status;
}
```

#### Phase 2: UI Components (Week 1-2)

1. **Invoice List Page** (`/app/invoices/page.tsx`)
   - Table showing all invoices
   - Filter by status, client, date range
   - Quick actions (view, edit, delete, send)
   - Status badges with color coding

2. **Invoice Form** (`/components/invoice-form.tsx`)
   - Client selection dropdown
   - Dynamic line items (add/remove)
   - Automatic calculations (subtotal, tax, total)
   - Date pickers for issue/due dates
   - Save as draft or send immediately

3. **Invoice View** (`/app/invoices/[id]/page.tsx`)
   - Professional invoice layout
   - Print-friendly CSS
   - Actions: Edit, Send, Mark as Paid, Download PDF

#### Phase 3: PDF Generation (Week 2)

1. **Extend PDF Library** (`/lib/pdf-generator.js`)

```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generateInvoicePDF(invoice, client, companyInfo) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.text('INVOICE', 20, 20);
  
  // Invoice details
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 35);
  doc.text(`Date: ${formatDate(invoice.issueDate)}`, 20, 42);
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 20, 49);
  
  // Client info
  doc.text('Bill To:', 20, 65);
  doc.text(client.name, 20, 72);
  doc.text(client.company, 20, 79);
  
  // Line items table
  doc.autoTable({
    startY: 95,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: invoice.items.map(item => [
      item.description,
      item.quantity,
      formatCurrency(item.rate),
      formatCurrency(item.amount)
    ]),
  });
  
  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Subtotal: ${formatCurrency(invoice.subtotal)}`, 140, finalY);
  doc.text(`Tax (${invoice.tax}%): ${formatCurrency(invoice.taxAmount)}`, 140, finalY + 7);
  doc.setFontSize(12);
  doc.text(`Total: ${formatCurrency(invoice.total)}`, 140, finalY + 17);
  
  return doc;
}
```

#### Phase 4: Email Integration (Week 2)

1. **Send Invoice Email** (`/app/api/invoices/send/route.js`)

```javascript
import nodemailer from 'nodemailer';

export async function POST(req) {
  const { invoiceId } = await req.json();
  
  // Get invoice and client
  const invoice = await getInvoice(invoiceId);
  const client = await getClient(invoice.clientId);
  
  // Generate PDF
  const pdf = generateInvoicePDF(invoice, client);
  
  // Send email
  const transporter = nodemailer.createTransport({...});
  await transporter.sendMail({
    to: client.email,
    subject: `Invoice ${invoice.invoiceNumber}`,
    html: `
      <h2>Invoice from ${companyName}</h2>
      <p>Please find attached invoice #${invoice.invoiceNumber}</p>
      <p>Total: ${invoice.total}</p>
      <p>Due: ${invoice.dueDate}</p>
    `,
    attachments: [{
      filename: `invoice-${invoice.invoiceNumber}.pdf`,
      content: pdf.output('arraybuffer')
    }]
  });
  
  // Update status
  await updateInvoiceStatus(invoiceId, 'sent');
  
  return NextResponse.json({ success: true });
}
```

#### Phase 5: Integration with Income (Week 2)

1. **Link Invoice to Income**
   - When invoice marked as paid, create income entry
   - Add `invoiceId` field to income model
   - Show invoice reference in income list

### Testing Checklist

- [ ] Create invoice with multiple line items
- [ ] Calculations are correct (subtotal, tax, total)
- [ ] Invoice numbers auto-increment properly
- [ ] Save as draft
- [ ] Send invoice via email
- [ ] PDF generates correctly
- [ ] Mark invoice as paid creates income entry
- [ ] Overdue invoices automatically flagged
- [ ] Filter and search work
- [ ] Edit existing invoice
- [ ] Delete invoice
- [ ] Encryption works for invoices

---

## 2. Expense Categorization & Budgets

### Overview
Add categories to expenses and enable budget tracking with alerts.

### Database Changes

**Update `spending` collection:**
```javascript
{
  // ... existing fields
  category: String,         // 'Marketing', 'Operations', 'Payroll', etc.
  subcategory: String,      // Optional sub-category
  tags: [String],           // Additional tags
}
```

**New Collection: `budgets`**
```javascript
{
  _id: ObjectId,
  userId: String,
  category: String,
  amount: Number,           // Budget amount
  period: String,           // 'monthly', 'quarterly', 'annual'
  startDate: Date,
  endDate: Date,
  alertThreshold: Number,   // Alert at 80%, 90%, 100%
  createdAt: Date
}
```

**New Collection: `categories`**
```javascript
{
  _id: ObjectId,
  userId: String,
  name: String,
  type: String,             // 'expense' or 'income'
  color: String,            // For charts
  icon: String,             // Lucide icon name
  isDefault: Boolean,       // System vs. user-created
  parentCategory: String,   // For subcategories
}
```

### Implementation Steps

#### Phase 1: Default Categories (Day 1)

1. **Seed Default Categories** (`/lib/default-categories.js`)

```javascript
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Marketing & Advertising', color: '#3b82f6', icon: 'Megaphone' },
  { name: 'Operations', color: '#10b981', icon: 'Cog' },
  { name: 'Payroll & Contractors', color: '#f59e0b', icon: 'Users' },
  { name: 'Software & Tools', color: '#8b5cf6', icon: 'Laptop' },
  { name: 'Office & Supplies', color: '#ec4899', icon: 'Building' },
  { name: 'Travel & Meals', color: '#14b8a6', icon: 'Plane' },
  { name: 'Professional Services', color: '#f97316', icon: 'Briefcase' },
  { name: 'Utilities', color: '#06b6d4', icon: 'Zap' },
  { name: 'Other', color: '#6b7280', icon: 'MoreHorizontal' },
];
```

#### Phase 2: Category Management (Days 2-3)

1. **Category API** (`/app/api/categories/route.js`)
   - GET: List all categories (default + user-created)
   - POST: Create custom category
   - PUT: Edit category
   - DELETE: Delete custom category (not defaults)

2. **Category UI** (`/app/settings/categories/page.tsx`)
   - Display category grid with colors
   - Add new category modal
   - Edit category inline
   - Drag to reorder

#### Phase 3: Update Spending Form (Days 3-4)

1. **Add Category Selector** (`/components/spending-form.tsx`)
   - Dropdown with category icons and colors
   - Search/filter categories
   - "Create new" option inline
   - Optional subcategory field

2. **AI-Powered Auto-Categorization**

```javascript
// lib/categorize-expense.js
export async function suggestCategory(description, amount) {
  // Simple rule-based for offline
  const rules = {
    'google ads': 'Marketing & Advertising',
    'facebook': 'Marketing & Advertising',
    'aws': 'Software & Tools',
    'github': 'Software & Tools',
    'figma': 'Software & Tools',
    'uber': 'Travel & Meals',
    'hotel': 'Travel & Meals',
    // ... more rules
  };
  
  const lower = description.toLowerCase();
  for (const [keyword, category] of Object.entries(rules)) {
    if (lower.includes(keyword)) {
      return category;
    }
  }
  
  // Optionally use Gemini AI for smarter categorization
  return 'Other';
}
```

#### Phase 4: Budget Management (Days 5-7)

1. **Budget API** (`/app/api/budgets/route.js`)
   - CRUD operations for budgets

2. **Budget Page** (`/app/budgets/page.tsx`)
   - List budgets by category
   - Progress bars showing spent vs. budget
   - Color coding (green < 80%, yellow 80-100%, red > 100%)
   - Quick add budget button

3. **Budget Alert System**

```javascript
// lib/budget-alerts.js
export async function checkBudgetAlerts(userId, category, newExpenseAmount) {
  const budget = await getBudgetForCategory(userId, category);
  if (!budget) return null;
  
  const spent = await getSpentInPeriod(userId, category, budget.period);
  const percentage = (spent / budget.amount) * 100;
  
  if (percentage >= 100) {
    return {
      level: 'critical',
      message: `You've exceeded your ${category} budget by ${formatCurrency(spent - budget.amount)}`
    };
  } else if (percentage >= budget.alertThreshold) {
    return {
      level: 'warning',
      message: `You've used ${percentage.toFixed(0)}% of your ${category} budget`
    };
  }
  
  return null;
}
```

#### Phase 5: Analytics & Reports (Days 8-10)

1. **Category Breakdown Chart** (`/components/category-chart.tsx`)
   - Pie chart of expenses by category
   - Bar chart for budget vs. actual
   - Trend over time

2. **Budget Report**
   - Month-over-month comparisons
   - Categories over/under budget
   - Spending trends by category

### Testing Checklist

- [ ] Default categories load on first login
- [ ] Create custom category
- [ ] Edit category (name, color, icon)
- [ ] Delete custom category
- [ ] Add expense with category
- [ ] Auto-categorization suggests correctly
- [ ] Create budget for category
- [ ] Budget alerts trigger at thresholds
- [ ] Budget page shows accurate spent amounts
- [ ] Category charts display correctly
- [ ] Filter expenses by category
- [ ] Export categorized expense report

---

## 3. Quick Wins (1-2 days each)

### 3a. Export to Excel

**Implementation:**

```javascript
// lib/excel-export.js
export function exportToExcel(data, filename) {
  // Simple CSV export (Excel opens CSV files)
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => row[h]).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
}

// Usage in component
<Button onClick={() => exportToExcel(expenses, 'expenses')}>
  Export to Excel
</Button>
```

### 3b. Keyboard Shortcuts

**Implementation:**

```javascript
// hooks/use-keyboard-shortcuts.ts
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new income
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        router.push('/income/new');
      }
      
      // Ctrl/Cmd + E for new expense
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        router.push('/spending/new');
      }
      
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
}
```

### 3c. Global Search

**Implementation:**

```javascript
// components/global-search.tsx
export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    if (query.length < 2) return;
    
    const search = async () => {
      const res = await fetch(`/api/search?q=${query}`);
      const data = await res.json();
      setResults(data);
    };
    
    const timeout = setTimeout(search, 300); // Debounce
    return () => clearTimeout(timeout);
  }, [query]);
  
  return (
    <CommandDialog>
      <CommandInput 
        placeholder="Search transactions, clients, todos..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {results.map(result => (
          <CommandItem key={result.id} onSelect={() => navigate(result.url)}>
            {result.type}: {result.title}
          </CommandItem>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
```

### 3d. Transaction Notes Field

**Implementation:**

```javascript
// Just add to models
{
  // ... existing fields
  notes: String,  // Add this to income, spending, loans
}

// Update forms
<Textarea
  label="Notes"
  placeholder="Add any additional details..."
  {...register('notes')}
/>
```

---

## Implementation Priority

**Week 1-2: Invoice Management** (Highest ROI)
- Day 1-2: Backend API
- Day 3-5: UI Components
- Day 6-7: PDF & Email
- Day 8-10: Testing & Refinement

**Week 3-4: Expense Categories & Budgets**
- Day 1-2: Category system
- Day 3-5: Budget management
- Day 6-8: Analytics & charts
- Day 9-10: Testing

**Quick Wins: Sprinkle between major features**
- Excel export (2 hours)
- Keyboard shortcuts (4 hours)
- Global search (1 day)
- Transaction notes (2 hours)

---

## Resources

### Libraries to Add

```bash
npm install xlsx                    # For Excel export
npm install cmdk                    # For command palette (already installed)
npm install @tanstack/react-table  # For advanced table features
npm install react-to-print         # For print invoices
```

### Useful Helpers

```javascript
// lib/date-utils.js
export function isOverdue(date) {
  return new Date(date) < new Date();
}

export function daysUntil(date) {
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// lib/currency-utils.js
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function calculateTax(amount, taxRate) {
  return (amount * taxRate) / 100;
}
```

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Create GitHub issues** for each feature
3. **Set up project board** with milestones
4. **Start with Invoice Management** (Week 1-2)
5. **Gather user feedback** after each feature
6. **Iterate based on usage data**

Happy building! 🚀
