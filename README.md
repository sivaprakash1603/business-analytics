# Business Analytics Platform 📊

A comprehensive business analytics and financial management platform built with Next.js, powered by AI for intelligent insights.

## 🚀 Features

### Current Capabilities

- **Financial Tracking**: Track income, expenses, and loans with detailed categorization
- **Client Management**: Manage clients with performance analytics and risk assessment
- **AI-Powered Insights**: Get intelligent business advice from Gemini AI
- **Advanced Analytics**: Client churn prediction, revenue concentration risk, trend analysis
- **Task Management**: Todo system with email reminders
- **Real-time Dashboard**: Live updates of business metrics
- **Data Security**: Client-side encryption with passphrase protection
- **PDF Reports**: Generate and download comprehensive business reports

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **Authentication**: Supabase (Email + Google OAuth)
- **AI**: Google Gemini API with offline fallbacks
- **UI Components**: Radix UI, shadcn/ui, Recharts
- **Email**: Nodemailer with Gmail integration

## 📚 Documentation

### Planning & Features
- **[Feature Discovery Summary](./docs/FEATURE_DISCOVERY_SUMMARY.md)** - Executive summary of feature analysis
- **[Feature Enhancement Roadmap](./docs/FEATURE_ENHANCEMENTS.md)** - Comprehensive list of 48+ potential features
- **[Implementation Guide](./docs/IMPLEMENTATION_GUIDE.md)** - Detailed build instructions for top features

### Setup & Usage
- **[Gemini AI Setup](./docs/GEMINI_SETUP.md)** - Configure AI integration
- **[Advanced Analytics Guide](./docs/ADVANCED_ANALYTICS.md)** - How to use advanced analytics features

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- MongoDB instance
- Supabase account
- Gemini API key (optional, has fallback)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sivaprakash1603/business-analytics.git
cd business-analytics
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI (Optional)
GEMINI_API_KEY=your_gemini_api_key

# Email (Optional)
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password

# Cron (Optional)
CRON_SECRET=your_cron_secret
EMAIL_API_URL=your_email_api_url

# News API (Optional)
NEXT_PUBLIC_NEWS_API_KEY=your_news_api_key
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Getting Started

1. **Sign Up**: Create an account using email or Google
2. **Set Passphrase**: Secure your data with encryption (optional)
3. **Add Data**: Start tracking income, expenses, and clients
4. **View Dashboard**: See real-time analytics and insights
5. **Ask AI**: Get intelligent business recommendations

### Key Pages

- `/dashboard` - Main analytics dashboard
- `/ai-insights` - AI-powered business advisor
- `/clients` - Client management
- `/todos` - Task and reminder management
- `/news` - Business news feed

## 🔐 Security

- **Client-side Encryption**: Optional passphrase-based encryption for all sensitive data
- **Supabase Auth**: Secure authentication with row-level security
- **Environment Variables**: Sensitive keys stored securely
- **HTTPS**: All API communications encrypted

## 🎯 Roadmap

See [FEATURE_ENHANCEMENTS.md](./docs/FEATURE_ENHANCEMENTS.md) for a comprehensive list of potential features including:

### High Priority
- Invoice Management System
- Expense Categorization & Budgets  
- Cash Flow Forecasting
- Bank Account Integration
- Multi-User Access & Permissions

### Medium Priority
- Recurring Transactions
- Tax Reporting & Export
- Project/Job Tracking
- Advanced Reporting Suite
- Document Management

### Long-term
- Mobile Application
- Marketplace Integrations
- Industry Benchmarking
- Payroll Management

## 🧪 Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Production

```bash
npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙋 Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ using Next.js, MongoDB, and AI**
