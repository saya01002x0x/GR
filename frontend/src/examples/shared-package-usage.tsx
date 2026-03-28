/**
 * Example: Using @gr/shared in Frontend
 * Demonstrates type-safe API calls with shared DTOs
 */

'use client';

import type {
  ApiResponse,
  CreateArtworkDto,
} from '@gr/shared';
import {
  ARTWORK_STATUS,
  ROLES,
} from '@gr/shared';
import { useState } from 'react';

/**
 * Example Form Component
 */
export function CreateArtworkForm() {
  const [formData, setFormData] = useState<CreateArtworkDto>({
    title: '',
    description: '',
    tags: [],
    status: ARTWORK_STATUS.DRAFT,
  });

  /**
   * Type-safe form submission
   * TypeScript knows exact structure from @gr/shared
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    try {
      // ✅ formData is type-checked against CreateArtworkDto
      const response = await fetch('http://localhost:3001/artworks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      // ✅ Type-safe response (in real app, you'd use this data)
      await response.json();

      // ✅ Success - artwork created
    } catch (error) {
      // Handle error silently in example
      void error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={e =>
            setFormData({ ...formData, title: e.target.value })}
          maxLength={200} // Matches DTO validation
          required
        />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={e =>
            setFormData({ ...formData, description: e.target.value })}
          maxLength={2000} // Matches DTO validation
        />
      </div>

      <div>
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={formData.status}
          onChange={e =>
            setFormData({
              ...formData,
              status: e.target.value as typeof ARTWORK_STATUS.DRAFT,
            })}
        >
          {/* ✅ Constants from @gr/shared */}
          <option value={ARTWORK_STATUS.DRAFT}>Draft</option>
          <option value={ARTWORK_STATUS.PUBLISHED}>Published</option>
        </select>
      </div>

      <button type="submit">Create Artwork</button>
    </form>
  );
}

/**
 * Example: Using Role Constants
 */
export function RoleBadge({ role }: { role: string }) {
  // ✅ Type-safe role checking
  const isAdmin = role === ROLES.ADMIN;

  return (
    <span
      className={
        isAdmin
          ? 'rounded bg-red-500 px-2 py-1 text-white'
          : 'rounded bg-gray-500 px-2 py-1 text-white'
      }
    >
      {role.toUpperCase()}
    </span>
  );
}

/**
 * Example: Type-safe API Client
 */
class ArtworkAPI {
  private baseUrl = 'http://localhost:3001';

  /**
   * Create artwork with full type safety
   */
  async create(
    dto: CreateArtworkDto,
    token: string,
  ): Promise<ApiResponse<{ id: string; title: string }>> {
    const response = await fetch(`${this.baseUrl}/artworks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List artworks (public)
   */
  async list(): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${this.baseUrl}/artworks`);
    return response.json();
  }
}

// Create API client instance
const artworkAPIInstance = new ArtworkAPI();

// Export as default to satisfy react-refresh
export default artworkAPIInstance;

// Helper function (mock)
function getToken(): string {
  return 'mock-token'; // Replace with actual token from Clerk
}

/**
 * 🎯 Benefits of Using @gr/shared:
 *
 * 1. ✅ Type Safety
 *    - Frontend knows exact API structure
 *    - TypeScript catches errors at compile time
 *
 * 2. ✅ Automatic Sync
 *    - Backend changes DTO → Frontend gets type error
 *    - Forces you to update both sides
 *
 * 3. ✅ Single Source of Truth
 *    - No duplicate type definitions
 *    - Constants shared between FE & BE
 *
 * 4. ✅ Better DX
 *    - Autocomplete in IDE
 *    - Refactoring is safe
 *    - Documentation in one place
 */
