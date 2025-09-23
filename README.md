# 🕉️ Ganesh Chanda Tracker

A comprehensive web application for tracking donations (Chandas) and expenses for Ganesh Chavithi festivals. Built with modern web technologies and designed for seamless festival management.

## ✨ Features

### 🎯 Core Functionality
- **Festival Management**: Create and manage multiple festival instances
- **Donation Tracking**: Track Chandas and sponsorships with detailed categorization
- **Expense Management**: Record and monitor all festival-related expenses
- **Image Management**: Upload and organize festival photos and memories
- **Multi-language Support**: Full Telugu and English language support

### 🎨 User Experience
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Auto-hiding Navigation**: Smart navigation that maximizes screen space
- **Touch Gestures**: Swipe navigation for mobile users
- **Loading States**: Professional loading indicators and error handling

### ♿ Accessibility
- **WCAG Compliant**: Full accessibility standards support
- **Screen Reader Support**: Comprehensive ARIA labels and semantic HTML
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast**: Excellent contrast ratios for visibility

### 🚀 Performance
- **Fast Loading**: Optimized with Vite and React Query
- **Efficient Rendering**: Minimal re-renders and optimized state management
- **Error Boundaries**: Robust error handling with graceful recovery
- **Mobile Optimized**: Smooth performance on all devices

## 🛠️ Technology Stack

### Frontend Framework
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety and better developer experience
- **Vite** - Fast build tool and development server

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible component library
- **Lucide React** - Beautiful, consistent icon library
- **Custom Design System** - Festival-themed color palette and components

### State Management
- **React Query** - Powerful data fetching and caching
- **Context API** - Lightweight state management for app-wide data
- **Local State** - Optimized component-level state management

### Routing & Navigation
- **React Router** - Declarative routing with nested routes
- **Custom Navigation** - Auto-hiding navigation with smooth transitions

### Backend Integration
- **Supabase** - Backend-as-a-Service for data storage and authentication
- **Real-time Updates** - Live data synchronization
- **Secure Authentication** - User authentication and authorization

## 📱 Pages & Features

### 🏠 Festival Selection
- Browse and select from existing festivals
- Create new festivals for different years/locations
- Visual festival cards with key information

### 📊 Dashboard
- Overview of festival statistics and totals
- Quick access to all major features
- Balance calculations and financial summaries
- Previous amount tracking for continuity

### 💰 Chandas (Donations)
- Track regular donations and sponsorships
- Categorize by type (Chanda, Sponsorship)
- Search and filter functionality
- Export and reporting capabilities

### 💸 Expenses
- Record all festival-related expenses
- Categorize expenses by type and purpose
- Track spending against budget
- Detailed expense history

### 📸 Images
- Upload festival photos and memories
- Organize images by category
- Gallery view with search functionality
- Integration with festival data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git (for cloning the repository)

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd ganesh-chanda-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Configure your Supabase credentials in .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Environment Configuration

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📖 Usage Guide

### Creating a Festival
1. Navigate to the Festival Selection page
2. Click "Add Festival" button
3. Fill in festival details (name, year, description)
4. Save to create the festival

### Managing Donations
1. Select a festival from the list
2. Navigate to the Chandas page
3. Click "Add Chanda" to record new donations
4. Use filters to search and organize donations

### Tracking Expenses
1. From the Dashboard, click "Expenses"
2. Click "Add Expense" to record new expenses
3. Categorize expenses and add descriptions
4. Monitor spending against donations

### Managing Images
1. Navigate to the Images page
2. Click "Upload Image" to add photos
3. Organize images by category
4. View in gallery format

## 🎯 Key Features Explained

### Multi-language Support
- Toggle between Telugu and English throughout the app
- All text and labels are translated
- Consistent language switching across all components

### Responsive Design
- Mobile-first approach with touch-friendly interfaces
- Tablet-optimized layouts with proper spacing
- Desktop experience with full feature access
- Adaptive navigation that works on all screen sizes

### Smart Navigation
- Auto-hiding navigation bar when scrolling
- Smooth animations and transitions
- Visual indicators for current page
- Touch gesture support for mobile users

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages in both languages
- Automatic recovery options
- Development-friendly error details

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Navigation.tsx  # Main navigation component
│   ├── PageHeader.tsx  # Page header component
│   └── ...
├── contexts/           # React context providers
│   ├── LanguageContext.tsx
│   ├── FestivalContext.tsx
│   ├── AuthContext.tsx
│   └── ...
├── pages/              # Page components
│   ├── FestivalSelection.tsx
│   ├── Dashboard.tsx
│   ├── Chandas.tsx
│   ├── Expenses.tsx
│   ├── Images.tsx
│   └── ...
├── lib/                # Utility functions
│   ├── database.ts     # Database operations
│   ├── expenses.ts     # Expense management
│   ├── images.ts       # Image handling
│   └── ...
└── hooks/              # Custom React hooks
    ├── use-toast.ts    # Toast notifications
    └── use-mobile.tsx  # Mobile detection
```

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Build for development
npm run build:dev
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
Make sure to set these environment variables in your production environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Deployment Platforms
- **Vercel**: Recommended for React applications
- **Netlify**: Alternative deployment option
- **Railway**: Full-stack deployment with database
- **Custom Server**: Deploy to any Node.js hosting provider

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev) for rapid development
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Powered by [Supabase](https://supabase.com/) for backend services

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**Happy Festival Management! 🕉️✨**
