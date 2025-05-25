# Weight Challenge Web App

A modern web application built with Next.js 14+ for the Weight Challenge platform, providing a Progressive Web App (PWA) experience that complements the existing mobile applications.

## 🚀 Live Demo

The application is deployed and available at:
**https://weight-challenge-app-dev.web.app**

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Firebase Auth with Magic Link
- **Database**: Firestore
- **Deployment**: Firebase Hosting
- **Language**: TypeScript

## 🏗️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase CLI

### Setup

1. Clone the repository and navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp ../env.example .env.local
# Edit .env.local with your Firebase configuration
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 📦 Deployment

### Automatic Deployment

Use the deployment script from the project root:

```bash
./scripts/deploy-web.sh
```

This script will:
1. Install dependencies
2. Run linting
3. Build the application
4. Deploy to Firebase Hosting

### Manual Deployment

From the web directory:

```bash
# Build the application
npm run build

# Deploy to Firebase Hosting
cd ..
firebase deploy --only hosting:web-app
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build and export static application
- `npm run start` - Start production server (not used for static export)
- `npm run lint` - Run ESLint
- `npm run export` - Build and export static files
- `npm run deploy` - Build and deploy to Firebase Hosting

## 🏗️ Architecture

### Route Structure

```
src/app/
├── (auth)/          # Protected routes
│   ├── dashboard/   # User dashboard
│   └── layout.tsx   # Auth layout with ProtectedRoute
├── (public)/        # Public routes
│   ├── login/       # Login page
│   └── layout.tsx   # Public layout
├── layout.tsx       # Root layout with AuthProvider
└── page.tsx         # Landing page with auth routing
```

### Key Features

- **Magic Link Authentication**: Passwordless login via email
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Static Export**: Optimized for Firebase Hosting
- **Type Safety**: Full TypeScript support

## 🔐 Authentication Flow

1. User enters email on login page
2. Magic link sent to email
3. User clicks link to authenticate
4. Automatic redirect to dashboard
5. Protected routes enforce authentication

## 🌐 Deployment Configuration

The app is configured for static export and deployed to Firebase Hosting with:

- **Static Generation**: All pages pre-rendered at build time
- **Client-side Routing**: SPA behavior with Next.js App Router
- **Firebase Integration**: Real-time authentication and data sync
- **Performance Optimization**: Code splitting and asset optimization

## 📱 Progressive Web App (PWA)

PWA features will be added in future phases:
- Service Worker for offline functionality
- App manifest for installation
- Background sync for data synchronization

## 🔄 CI/CD Pipeline

The deployment pipeline includes:
1. Dependency installation
2. Code linting
3. TypeScript compilation
4. Static export generation
5. Firebase Hosting deployment

## 📊 Performance Targets

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Bundle Size**: < 500KB initial load

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request
5. Deploy will happen automatically after merge

## 📝 Environment Variables

Required environment variables (see `env.example`):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
