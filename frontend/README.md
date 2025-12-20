# GR Frontend

Next.js 16+ frontend application với Mantine UI, Tailwind CSS và TypeScript, được thiết kế để hoạt động trong môi trường Monorepo với NestJS backend.

## Tech Stack

### Core

- **[Next.js 16+](https://nextjs.org)** - React framework với App Router
- **[TypeScript](https://www.typescriptlang.org)** - Type checking
- **[React 19](https://react.dev)** - UI library

### Styling

- **[Mantine UI v8](https://mantine.dev)** - Component library với theming
- **[Tailwind CSS 4](https://tailwindcss.com)** - Utility-first CSS

### State Management

- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[TanStack Query](https://tanstack.com/query)** - Server state & data fetching

### Authentication

- **[Clerk](https://clerk.com)** - Authentication & User Management

### Developer Experience

- **ESLint** - Linting với Antfu config
- **Lefthook** - Git hooks
- **Commitlint** - Commit message linting
- **Vitest** - Unit testing
- **Storybook** - UI component development

### Monitoring & Logging

- **[Sentry](https://sentry.io)** - Error monitoring
- **LogTape** - Logging
- **[Better Stack](https://betterstack.com)** - Log management (optional)

### Internationalization

- **next-intl** - Multi-language support (i18n)

## Getting Started

### Requirements

- Node.js 20+
- pnpm (recommended) hoặc npm

### Installation

```bash
# Từ thư mục root của monorepo
cd frontend
npm install
```

### Environment Variables

Tạo file `.env.local` với các biến sau:

```bash
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Sentry (Optional - để trống để disable)
NEXT_PUBLIC_SENTRY_DISABLED=true
# NEXT_PUBLIC_SENTRY_DSN=
# SENTRY_ORGANIZATION=
# SENTRY_PROJECT=
```

### Development

```bash
npm run dev
```

Mở http://localhost:3000 trong trình duyệt.

### Build

```bash
npm run build
npm run start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   └── [locale]/           # Locale-based routing
│   │       ├── (auth)/         # Auth routes (sign-in, dashboard)
│   │       └── (marketing)/    # Public routes
│   ├── components/             # React components
│   ├── libs/                   # Library configurations
│   │   ├── api.ts              # API client for NestJS backend
│   │   ├── Env.ts              # Environment variables
│   │   ├── MantineProvider.tsx # Mantine theme config
│   │   ├── QueryProvider.tsx   # TanStack Query setup
│   │   └── ...
│   ├── stores/                 # Zustand stores
│   │   └── useUIStore.ts       # UI state management
│   ├── locales/                # i18n messages
│   ├── styles/                 # Global styles
│   ├── templates/              # Page templates
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utility functions
├── public/                     # Static assets
├── .storybook/                 # Storybook config
└── tests/                      # Test files
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run check:types` | TypeScript type checking |
| `npm run check:deps` | Check unused dependencies |
| `npm run check:i18n` | Validate translations |
| `npm run test` | Run unit tests |
| `npm run storybook` | Start Storybook |
| `npm run commit` | Interactive commit helper |

## API Integration

Frontend sử dụng TanStack Query để fetch data từ NestJS backend. API client được cấu hình tại `src/libs/api.ts`:

```typescript
import { apiGet, apiPost } from '@/libs/api';

// GET request
const data = await apiGet<User[]>('/users');

// POST request
const user = await apiPost<User>('/users', { name: 'John' });
```

### Với TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/libs/api';

function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet<User[]>('/users'),
  });
}
```

## State Management

### Zustand Store

UI state được quản lý bởi Zustand tại `src/stores/useUIStore.ts`:

```typescript
import { useUIStore } from '@/stores/useUIStore';

function Component() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <button onClick={toggleSidebar}>
      {sidebarOpen ? 'Close' : 'Open'}
    </button>
  );
}
```

## Mantine UI

Theme được cấu hình tại `src/libs/MantineProvider.tsx`. Để sử dụng Mantine components:

```typescript
import { Button, TextInput, Group } from '@mantine/core';

function MyForm() {
  return (
    <Group>
      <TextInput label="Name" placeholder="Enter name" />
      <Button>Submit</Button>
    </Group>
  );
}
```

## Authentication

Sử dụng Clerk cho authentication:

```typescript
import { useAuth, useUser } from '@clerk/nextjs';

function Profile() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isSignedIn) return <div>Please sign in</div>;

  return <div>Hello, {user?.firstName}</div>;
}
```

Protected routes được cấu hình trong `src/proxy.ts` (middleware).

## i18n (Internationalization)

Translations nằm trong `src/locales/`. Để sử dụng:

```typescript
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('Common');

  return <h1>{t('title')}</h1>;
}
```

## Testing

### Unit Tests

```bash
npm run test
```

Tests nằm cùng thư mục với source code, theo pattern `*.test.ts` hoặc `*.test.tsx`.

### Storybook

```bash
npm run storybook
```

Mở http://localhost:6006 để xem components.

## Error Monitoring

### Development

Sentry Spotlight tự động capture errors tại http://localhost:8969.

### Production

Cấu hình các biến môi trường Sentry trong `.env.production`:

```bash
NEXT_PUBLIC_SENTRY_DSN=your_dsn
SENTRY_ORGANIZATION=your_org
SENTRY_PROJECT=your_project
```

## Customization

Tìm kiếm `FIXME:` trong project để tùy chỉnh nhanh:

- `public/favicon.ico` - Website favicon
- `src/utils/AppConfig.ts` - App configuration
- `src/libs/MantineProvider.tsx` - Theme configuration
- `next.config.ts` - Next.js configuration

## Commit Convention

Project sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```bash
npm run commit
```

## License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.
