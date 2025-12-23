# 📁 Cấu trúc thư mục Frontend

Hướng dẫn chi tiết về cấu trúc thư mục `src/` và workflow khi phát triển tính năng mới.

## 🗂️ Tổng quan cấu trúc

```
src/
├── app/                    # Next.js App Router (Pages & Layouts)
│   └── [locale]/           # Routing theo ngôn ngữ (i18n)
│       ├── (auth)/         # Route group yêu cầu đăng nhập
│       │   ├── dashboard/  # Dashboard pages
│       │   └── (center)/   # Layout centered (sign-in, sign-up)
│       ├── (marketing)/    # Route group công khai
│       │   ├── about/
│       │   └── portfolio/
│       └── api/            # API Routes (Route Handlers)
│
├── components/             # React Components tái sử dụng
│   ├── analytics/          # Components cho tracking/analytics
│   └── auth/               # Components cho auth
│
├── templates/              # Page Templates & File mẫu
│   └── BaseTemplate.tsx    # Template chính cho layout
│
├── libs/                   # Cấu hình thư viện
│   ├── api.ts              # API client cho backend
│   ├── Env.ts              # Environment variables (type-safe)
│   ├── I18n.ts             # Cấu hình next-intl
│   ├── MantineProvider.tsx # Mantine theme config
│   └── QueryProvider.tsx   # TanStack Query setup
│
├── stores/                 # Zustand stores (Client state)
│   └── useUIStore.ts       # UI state management
│
├── validations/            # Zod schemas cho form validation
│
├── models/                 # Data models / DTOs
│
├── types/                  # TypeScript type definitions
│   └── I18n.ts             # i18n types
│
├── locales/                # Translation files (JSON)
│   ├── en.json             # English
│   └── vi.json             # Vietnamese
│
├── styles/                 # Global CSS styles
│
└── utils/                  # Utility functions
    ├── AppConfig.ts        # App configuration
    └── Helpers.ts          # Helper functions
```

---

## 🔄 Workflow: Tạo một Page mới

### Bước 1: Xác định loại Page

| Loại | Đường dẫn | Mô tả |
|------|-----------|-------|
| **Public** | `app/[locale]/(marketing)/` | Trang công khai (landing, about,...) |
| **Protected** | `app/[locale]/(auth)/dashboard/` | Yêu cầu đăng nhập |
| **Centered Auth** | `app/[locale]/(auth)/(center)/` | Sign-in, sign-up |

### Bước 2: Tạo các file theo thứ tự

```
1. Types/Models     → src/types/ hoặc src/models/
2. Validation       → src/validations/
3. API Hooks        → src/libs/queries/ (TanStack Query hooks)
4. Store (nếu cần)  → src/stores/
5. Components       → src/components/
6. Page             → src/app/[locale]/...
7. Translations     → src/locales/*.json
```

---

## 🧩 Quy tắc đặt tên

| Loại | Convention | Ví dụ |
|------|------------|-------|
| **Components** | PascalCase | `ProductCard.tsx` |
| **Hooks** | camelCase với prefix `use` | `useProducts.ts` |
| **Stores** | camelCase với prefix `use` | `useProductStore.ts` |
| **Types** | PascalCase | `Product.ts` |
| **Validations** | PascalCase + Validation | `ProductValidation.ts` |
| **Utils** | camelCase | `formatPrice.ts` |

---

## 🔗 Import Aliases

Sử dụng `@/` để import từ `src/`:

```typescript
import { api } from '@/libs/api';
import { useUIStore } from '@/stores/useUIStore';
import { ProductCard } from '@/components/products/ProductCard';
import type { Product } from '@/types/Product';
```

---

## 🛠️ Tech Stack

| Công nghệ | Mục đích | Docs |
|-----------|----------|------|
| **Next.js 16** | Framework | [nextjs.org](https://nextjs.org) |
| **Mantine UI** | Components | [mantine.dev](https://mantine.dev) |
| **Tailwind CSS** | Styling | [tailwindcss.com](https://tailwindcss.com) |
| **TanStack Query** | Server state | [tanstack.com/query](https://tanstack.com/query) |
| **Zustand** | Client state | [zustand-demo.pmnd.rs](https://zustand-demo.pmnd.rs) |
| **React Hook Form** | Forms | [react-hook-form.com](https://react-hook-form.com) |
| **Zod** | Validation | [zod.dev](https://zod.dev) |
| **next-intl** | i18n | [next-intl-docs.vercel.app](https://next-intl-docs.vercel.app) |

---

# 📋 Code Templates

Các mẫu code dưới đây dùng để tham khảo khi tạo tính năng mới.

---

## 📄 1. Page Template

```typescript
// 📍 src/app/[locale]/(auth)/dashboard/products/page.tsx

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
// import { ProductList } from '@/components/products/ProductList';

type ProductsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// SEO Metadata
export async function generateMetadata(
  props: ProductsPageProps,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Products' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

// Page Component (Server Component)
export default async function ProductsPage(props: ProductsPageProps) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Products' });

  // Sử dụng searchParams
  const page = searchParams?.page ?? '1';

  return (
    <div className="py-5">
      <h1 className="mb-4 text-2xl font-bold">{t('title')}</h1>
      <p>Current page: {page}</p>
      {/* <ProductList /> */}
    </div>
  );
}
```

---

## 🧩 2. Component Template

```typescript
// 📍 src/components/products/ProductCard.tsx

'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

// Types
export type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  description?: string;
  isActive?: boolean;
  onClick?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

// Component
export function ProductCard({
  id,
  name,
  price,
  description,
  isActive = false,
  onClick,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const t = useTranslations('ProductCard');
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    onClick?.(id);
  }, [id, onClick]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(id);
  }, [id, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(id);
  }, [id, onDelete]);

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      } ${isHovered ? 'shadow-md' : 'shadow-sm'}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <h3 className="font-semibold">{name}</h3>
      <p className="text-gray-600">${price}</p>
      {description && <p className="mt-2 text-sm">{description}</p>}

      {(onEdit || onDelete) && (
        <div className="mt-3 flex gap-2">
          {onEdit && (
            <button onClick={handleEdit} className="text-blue-600">
              {t('edit')}
            </button>
          )}
          {onDelete && (
            <button onClick={handleDelete} className="text-red-600">
              {t('delete')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border p-4">
      <div className="h-4 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
    </div>
  );
}
```

---

## 📖 3. Storybook Template

```typescript
// 📍 src/components/products/ProductCard.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { ProductCard } from './ProductCard';

const meta: Meta<typeof ProductCard> = {
  title: 'Components/ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
  args: {
    id: '1',
    name: 'Example Product',
    price: 99.99,
    description: 'Product description',
    onClick: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: { isActive: true },
};

export const WithoutActions: Story = {
  args: { onEdit: undefined, onDelete: undefined },
};
```

---

## 🧪 4. Test Template

```typescript
// 📍 src/components/products/ProductCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from './ProductCard';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ProductCard', () => {
  const defaultProps = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
  };

  it('renders correctly', () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<ProductCard {...defaultProps} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith('1');
  });

  it('shows edit/delete buttons when handlers provided', () => {
    render(
      <ProductCard
        {...defaultProps}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    
    expect(screen.getByText('edit')).toBeInTheDocument();
    expect(screen.getByText('delete')).toBeInTheDocument();
  });
});
```

---

## 🗃️ 5. Zustand Store Template

```typescript
// 📍 src/stores/useProductStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Product = {
  id: string;
  name: string;
  price: number;
};

type ProductState = {
  products: Product[];
  selectedId: string | null;
  isLoading: boolean;
};

type ProductActions = {
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  selectProduct: (id: string | null) => void;
  reset: () => void;
};

const initialState: ProductState = {
  products: [],
  selectedId: null,
  isLoading: false,
};

export const useProductStore = create<ProductState & ProductActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setProducts: (products) => set({ products }),

        addProduct: (product) =>
          set((state) => ({ products: [...state.products, product] })),

        updateProduct: (id, updates) =>
          set((state) => ({
            products: state.products.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          })),

        removeProduct: (id) =>
          set((state) => ({
            products: state.products.filter((p) => p.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId,
          })),

        selectProduct: (id) => set({ selectedId: id }),

        reset: () => set(initialState),
      }),
      { name: 'product-storage' }
    ),
    { name: 'ProductStore' }
  )
);

// Selectors
export const useSelectedProduct = () =>
  useProductStore((state) =>
    state.products.find((p) => p.id === state.selectedId)
  );
```

---

## 🔄 6. TanStack Query Hook Template

```typescript
// 📍 src/libs/queries/useProducts.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/libs/api';

type Product = {
  id: string;
  name: string;
  price: number;
};

type CreateProductInput = Omit<Product, 'id'>;

// Query Keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: object) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// GET all products
export function useProducts(filters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => apiGet<Product[]>('/products', filters),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// GET single product
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id!),
    queryFn: () => apiGet<Product>(`/products/${id}`),
    enabled: !!id,
  });
}

// POST create product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductInput) =>
      apiPost<Product>('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// PUT update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      apiPut<Product>(`/products/${id}`, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// DELETE product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/products/${id}`),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
```

---

## ✅ 7. Zod Validation Template

```typescript
// 📍 src/validations/ProductValidation.ts

import { z } from 'zod';

// Basic schemas
export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên sản phẩm là bắt buộc')
    .max(100, 'Tên không được quá 100 ký tự'),

  price: z
    .number()
    .min(0, 'Giá phải >= 0')
    .max(1_000_000, 'Giá không được quá 1,000,000'),

  description: z
    .string()
    .max(500, 'Mô tả không được quá 500 ký tự')
    .optional(),

  status: z.enum(['draft', 'published', 'archived']),

  tags: z
    .array(z.string())
    .max(5, 'Không được quá 5 tags')
    .default([]),

  isActive: z.boolean().default(true),
});

// Partial schema for updates
export const updateProductSchema = productSchema.partial();

// Inferred types
export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Validation helper
export function validateProduct(data: unknown) {
  return productSchema.safeParse(data);
}
```

---

## 🌍 8. Translation Template

```json
// 📍 src/locales/en.json (thêm vào file)

{
  "Products": {
    "meta_title": "Products",
    "meta_description": "Manage your products",
    "title": "Products",
    "add_product": "Add Product",
    "edit_product": "Edit Product",
    "delete_confirm": "Are you sure?"
  },
  "ProductCard": {
    "edit": "Edit",
    "delete": "Delete"
  }
}
```

---

## 📝 Checklist tạo tính năng mới

- [ ] Định nghĩa Types trong `src/types/`
- [ ] Tạo Validation schema trong `src/validations/`
- [ ] Tạo API hooks trong `src/libs/queries/`
- [ ] Tạo Store (nếu cần) trong `src/stores/`
- [ ] Tạo Components trong `src/components/`
- [ ] Tạo Page trong `src/app/[locale]/`
- [ ] Thêm Translations trong `src/locales/`
- [ ] Viết Tests
- [ ] Tạo Storybook stories
