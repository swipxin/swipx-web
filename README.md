# Swipx - Video Chat & Swipe App

A modern video chat and swipe application built with React, TypeScript, and Tailwind CSS.

## Features

- 🎥 Random 1:1 video chats
- 🔄 Swipe functionality to connect with new people
- 💎 Premium features with country/gender filtering
- 💰 Token-based economy system
- 🌓 Dark/Light mode support
- 📱 Mobile-first responsive design
- ✨ Glassmorphism UI design

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS v4, CSS Custom Properties
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically build and deploy your app

Or use the Vercel CLI:
```bash
npx vercel
```

### Environment Variables

For production deployment with backend features, you may need to set up:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Project Structure

```
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── admin/          # Admin panel components
├── styles/             # Global CSS and design tokens
├── src/                # Main application entry point
└── public/             # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is private and proprietary.