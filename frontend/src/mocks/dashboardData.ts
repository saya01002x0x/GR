// Types
export type UserProfile = {
  displayName: string;
  handle: string;
  bio: string;
  avatar: string;
  banner: string;
  social: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  visibility: {
    showLikedArtworks: boolean;
    displayFollowerCount: boolean;
    allowDirectMessages: boolean;
  };
  sensitiveContent: {
    showR18: boolean;
    showR18G: boolean;
  };
};

export type MenuItem = {
  id: string;
  label: string;
  href: string;
};

// Mock Data
export const mockUserProfile: UserProfile = {
  displayName: 'Yuki Artworks',
  handle: 'yukireal',
  bio: '',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxQOVJSpSRDA2gRFg73dmTYjzmsw-gcDjw05jBwxfW_cgLVCPjga0IWp_PE6LFz0J03kKF-xp4J4B5uXIpaBsStpzJPVDrWTrIXr0sIIW5kiaBt9aWierKp88u1S9n3gziovOBzUrCi2zvq7v2ab-Wn7AzUaAQUJ3NoK1qIFQvn8DFdSFE51WNJWW-TQbz0j93cCJ_tbGs2n7T0EVEtbsdJpH2qrbFk0qSI0spBw-rx1Wq_-R0AjyFwGpcUqjE5EsPL4_tMwIgyDU',
  banner: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsWkKepOvaAsT5c8o-VVWPirAjqRsQPdRH-t15QqWcR1Ls7EdJusyrGTM8Apf-i2Q2STy8OSgcPqv34I7M-Ozb_EdFeSLAPOpJ9ZLV6DPdlAw5B34fJBiRJO77DCif84sNRBCaVmVNGzNyc60SsLQlIb0RbpclTfkKLR4cChnQu1_XiKKBjhqwLUHKBLbPOXLpg83k2tfIuE0VmKbBWTI-pTVFdo8GZLN2x_Hravd72HKW1a2K2rrUbrNmd88RMN-EXUO-reILEGQ',
  social: {
    twitter: '',
    instagram: '',
    website: '',
  },
  visibility: {
    showLikedArtworks: true,
    displayFollowerCount: true,
    allowDirectMessages: false,
  },
  sensitiveContent: {
    showR18: false,
    showR18G: false,
  },
};

// Sidebar menu items
export const settingsMenuItems: MenuItem[] = [
  { id: 'general', label: 'General', href: '/dashboard/general' },
  { id: 'profile', label: 'Profile', href: '/dashboard/profile' },
  { id: 'content', label: 'Content Preferences', href: '/dashboard/content' },
  { id: 'notifications', label: 'Notifications', href: '/dashboard/notifications' },
  { id: 'membership', label: 'Membership', href: '/dashboard/membership' },
  { id: 'security', label: 'Security', href: '/dashboard/security' },
];

export const creatorMenuItems: MenuItem[] = [
  { id: 'my-works', label: 'My Works', href: '/dashboard/works' },
  { id: 'upload', label: 'Upload New', href: '/upload' }, // Link ra ngoài Dashboard
  { id: 'analytics', label: 'Analytics', href: '/dashboard/analytics' },
  { id: 'commissions', label: 'Commissions', href: '/dashboard/commissions' },
];
