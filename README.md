# LoanOps - Loan Management System

A comprehensive, modern loan operations management platform built with Next.js 14, React 18, TypeScript, and Tailwind CSS.

## Features

### Dual Data Mode 🆕

LoanOps supports two data modes for maximum flexibility:

- **Mock Mode** (Default) - In-memory demo data, perfect for development and demos
- **Database Mode** - PostgreSQL with Prisma ORM for production use

Switch between modes instantly by changing `NEXT_PUBLIC_DATA_MODE` in `.env`. See [DATA_MODE_GUIDE.md](DATA_MODE_GUIDE.md) for details.

### Core Modules

- **Customer Management** - Complete CRUD operations for customer data with geographic coordinates
- **Loan Management** - Create and track loans with EMI calculations
- **Collections** - Record payments via cash, UPI, or bank transfer
- **Daily Operations** - Monitor expected vs collected amounts with real-time metrics
- **Risk Management** - Track high-risk accounts and default rates
- **Alerts & Notifications** - Priority-based alert system for critical events
- **Reports** - Generate daily, agent, and custom reports
- **Map View** - Geographic visualization of customers with status indicators
- **Map Analytics** - Heatmaps and cluster analysis (requires Mapbox)
- **Configuration** - Manage interest rates, grace periods, and penalties
- **SaaS Admin** - Multi-tenant management with subscription plans

### Technical Features

- **Role-Based Access Control** - Admin, Agent, Viewer, and Super Admin roles
- **White-Label Branding** - Customizable colors and company names per tenant
- **Responsive Design** - Mobile-friendly UI with Tailwind CSS
- **Modern UI Components** - Reusable Card, Button, Badge components
- **Mock Data Layer** - In-memory data store for rapid prototyping
- **Type Safety** - Full TypeScript implementation

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Maps**: Mapbox GL JS (optional)
- **State Management**: React Context API

## Project Structure

```
loanops-web/
├── app/
│   ├── (auth)/
│   │   └── login/              # Authentication page
│   ├── (dashboard)/
│   │   ├── customers/          # Customer CRUD
│   │   ├── loans/              # Loan creation & management
│   │   ├── collections/        # Payment recording
│   │   ├── daily-ops/          # Daily operations dashboard
│   │   ├── risk/               # Risk management
│   │   ├── alerts/             # Alerts & notifications
│   │   ├── reports/            # Report generation
│   │   ├── map/                # Customer map view
│   │   ├── map-analytics/      # Heatmap analytics
│   │   ├── config/             # System configuration
│   │   ├── saas/               # Multi-tenant admin
│   │   └── layout.tsx          # Dashboard layout
│   ├── api/
│   │   ├── customers/          # Customer API routes
│   │   ├── loans/              # Loan API routes
│   │   ├── collections/        # Collection API routes
│   │   └── branding/           # Branding API routes
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── Sidebar.tsx             # Navigation sidebar
│   └── ui/
│       ├── Badge.tsx           # Badge component
│       ├── Button.tsx          # Button component
│       └── Card.tsx            # Card component
├── lib/
│   ├── AuthProvider.tsx        # Authentication context
│   ├── BrandingProvider.tsx    # Branding context
│   ├── navigation.ts           # Navigation configuration
│   └── mock/
│       └── index.ts            # Mock data store
├── public/                     # Static assets
├── .env.example                # Environment variables template
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd loanops-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Mapbox token (optional):
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   NEXT_PUBLIC_TENANT_ID=t1
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### First Login

The app starts in demo mode with mock authentication:

1. Go to `/login`
2. Select a role:
   - **Admin** - Full access to all features
   - **Agent** - Customer, loan, and collection management
   - **Super Admin** - Multi-tenant administration
3. Click "Sign In" (no credentials required)

## Usage Guide

### Customer Management

1. Navigate to **Customers** from the sidebar
2. Click **Add Customer** to create new customers
3. Fill in name, phone, address, coordinates, status, and agent
4. View, edit, or delete customers from the table

### Loan Creation

1. Go to **Loans**
2. Click **Create Loan**
3. Select customer, enter amount, interest rate, and tenure
4. EMI is calculated automatically
5. Track loan status and outstanding amounts

### Recording Collections

1. Navigate to **Collections**
2. Click **Add Collection**
3. Select active loan
4. Enter amount and payment method (cash/UPI/bank)
5. Outstanding amount updates automatically

### Daily Operations

- View expected vs collected amounts
- Monitor collection rates
- Track EMI schedules for active loans

### Risk Management

- Identify high-risk and defaulted accounts
- View total amount at risk
- Monitor default rates

### Map Features

- **Customer Map**: Geographic view with color-coded status markers
  - Green: Active
  - Yellow: At Risk
  - Red: Default
- **Map Analytics**: Heatmaps and cluster analysis (requires Mapbox token)

### Configuration

Admins can configure:
- Default interest rates
- Grace periods
- Late payment fees
- Default thresholds

### Multi-Tenant (Super Admin)

- Manage multiple tenant organizations
- Assign subscription plans (Basic/Pro)
- Monitor user counts and status

## Customization

### Branding

Edit `/app/api/branding/route.ts` to customize per-tenant branding:

```typescript
const brandingConfig = {
  t1: {
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    companyName: 'Your Company',
    logo: '/logo.svg'
  }
};
```

### Navigation

Modify `/lib/navigation.ts` to add/remove menu items:

```typescript
export const navigationItems: NavItem[] = [
  { label: 'New Page', href: '/new-page', icon: 'Star', roles: ['admin'] }
];
```

### Mock Data

Update `/lib/mock/index.ts` to change sample data:

```typescript
export let customers: Customer[] = [
  // Add your sample customers
];
```

## API Routes

All API routes return JSON and support standard HTTP methods:

- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `DELETE /api/customers?id=c1` - Delete customer
- `GET /api/loans` - List all loans with customer details
- `POST /api/loans` - Create loan
- `GET /api/collections` - List all collections
- `POST /api/collections` - Record collection
- `GET /api/branding` - Get branding configuration

## Building for Production

```bash
npm run build
npm start
```

## Roadmap

### Phase 1 (Current)
- ✅ Core CRUD operations
- ✅ Role-based navigation
- ✅ Mock data layer
- ✅ Modern UI components

### Phase 2 (Next)
- [ ] Real database integration (PostgreSQL/MongoDB)
- [ ] Authentication with JWT
- [ ] File uploads for documents
- [ ] SMS/Email notifications
- [ ] Advanced reporting with charts

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] Offline support
- [ ] Payment gateway integration
- [ ] AI-powered risk scoring
- [ ] Automated collections

## Contributing

This is a merged codebase from 18 development phases. To contribute:

1. Create feature branches from `main`
2. Follow the existing code structure
3. Use TypeScript for type safety
4. Test with multiple roles
5. Update documentation

## License

MIT License - feel free to use for commercial projects

## Support

For issues or questions:
- Check the code comments
- Review the mock data structure
- Examine existing API routes
- Test with different user roles

## Notes

- This version uses **mock data** stored in memory
- Data resets on server restart
- Map features require a Mapbox token
- Designed for rapid prototyping and demos
- Ready for backend integration

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
