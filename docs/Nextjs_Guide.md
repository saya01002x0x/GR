# Next.js Knowledge Base

Các concept và patterns được sử dụng trong dự án Next.js.

---

## Authentication (Clerk)

#### ClerkProvider

- **Là gì:** Context provider từ `@clerk/nextjs` để wrap ứng dụng và cung cấp authentication state
- **Cách dùng:**
  ```tsx
  import { ClerkProvider } from '@clerk/nextjs';
  
  <ClerkProvider
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
    signInFallbackRedirectUrl="/discover"
  >
    {children}
  </ClerkProvider>
  ```
- **Ứng dụng:** Wrap trong `(auth)/layout.tsx` để cung cấp auth context cho các trang sign-in, sign-up

#### SignIn / SignUp Components

- **Là gì:** Pre-built auth forms từ Clerk, hỗ trợ email, social login (Google, Facebook, etc.)
- **Cách dùng:**
  ```tsx
  import { SignIn } from '@clerk/nextjs';
  
  <SignIn 
    path="/sign-in"
    appearance={{
      elements: {
        formButtonPrimary: { backgroundColor: '#e52e5c' }
      }
    }}
  />
  ```
- **Ứng dụng:** Dùng trong `/sign-in` và `/sign-up` pages với custom styling qua `appearance` prop

---

## Routing

#### Route Groups `(groupName)`

- **Là gì:** Cách nhóm routes trong Next.js App Router mà không ảnh hưởng đến URL path
- **Cách dùng:**
  ```
  app/
  ├── (auth)/           # Route group - không xuất hiện trong URL
  │   ├── layout.tsx    # Layout chung cho auth pages
  │   ├── sign-in/
  │   └── sign-up/
  ```
- **Ứng dụng:** Nhóm các trang auth (`sign-in`, `sign-up`) để share layout với ClerkProvider

#### Catch-all Segments `[[...slug]]`

- **Là gì:** Dynamic route bắt tất cả các segments, optional (có thể match cả path gốc)
- **Cách dùng:**
  ```
  app/
  └── sign-in/
      └── [[...sign-in]]/   # Matches /sign-in, /sign-in/factor-one, etc.
          └── page.tsx
  ```
- **Ứng dụng:** Clerk cần catch-all để handle multi-step auth flows (verification, 2FA, etc.)

---

## Layouts

#### Mantine với Next.js App Router

- **Là gì:** Kết hợp Mantine UI components trong Next.js server components
- **Cách dùng:**
  ```tsx
  // Server component can use Mantine, but interactive features need 'use client'
  import { Box, Flex, Title } from '@mantine/core';
  
  export default function Page() {
    return (
      <Flex>
        <Box>Content</Box>
      </Flex>
    );
  }
  ```
- **Ứng dụng:** `AuthPageLayout` dùng Mantine cho layout 2 cột (hero image + auth form)

---

## Environment Variables

#### Server vs Client Variables

- **Là gì:** Next.js phân biệt env vars cho server và client
- **Cách dùng:**
  ```bash
  # Server only (không expose ra client)
  CLERK_SECRET_KEY=sk_test_xxx
  
  # Client accessible (prefix NEXT_PUBLIC_)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
  ```
- **Ứng dụng:** Clerk cần cả 2 keys - secret cho server, publishable cho client
