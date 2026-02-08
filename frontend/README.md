# Frontend - Next.js 16+ Todo Application

This is the frontend for the Todo application built with Next.js 16+ App Router, TypeScript, and Better Auth.

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Better Auth
- **Linting**: ESLint

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility functions and configurations
├── .env.local            # Environment variables (not committed)
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET=<your-secure-secret>
BETTER_AUTH_URL=http://localhost:3000

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Next Steps

- Configure Better Auth in `lib/auth.ts`
- Create authentication pages (login, register)
- Build task management UI components
- Integrate with backend API
