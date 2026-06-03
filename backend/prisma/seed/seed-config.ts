import { UserRole } from '@prisma/client';

export const FAKER_SEED = 42;

// Real Users - User will update Clerk IDs here
export const REAL_USERS = {
  superAdmin: {
    clerkId: 'user_3BZwaxSVVIOKeu32kniwXONqhm6',
    email: 'superadmin+clerk_test@example.com',
    username: 'superadmin',
    displayName: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    isArtist: false,
  },
  mod: {
    clerkId: 'user_3BcZvazPpUXwsiLPhNcbbZnHBHt',
    email: 'mod+clerk_test@example.com',
    username: 'moder',
    displayName: 'Moder Moder',
    role: UserRole.MODERATOR,
    isArtist: false,
  },
  admin: {
    clerkId: 'user_3BcZzMReURZrbQDYbLnR4DgW6Ub',
    email: 'admin+clerk_test@example.com',
    username: 'admin',
    displayName: 'Admin Admin',
    role: UserRole.ADMIN,
    isArtist: false,
  },
  artist: {
    clerkId: 'user_390a5VQo4DNkkuzHKY5iDulZ1aA',
    email: 'hoangchithanh2004@gmail.com',
    username: 'saya0212',
    displayName: 'Thanh Hoang',
    role: UserRole.USER,
    isArtist: true,
  },
  user1: {
    clerkId: 'user_3Ed07BQWKqe6YgMCadEIjSeuHeT',
    email: 'nguoidung+clerk_test@example.com',
    username: 'nguoidung',
    displayName: 'Nguoi Dung',
    role: UserRole.USER,
    isArtist: false,
  },
  user2: {
    clerkId: 'user_3CyfhSFJ91AllNqprgykr1U2pmn',
    email: 'nguoimua+clerk_test@example.com',
    username: 'nguoimua',
    displayName: 'Nguoi Mua',
    role: UserRole.USER,
    isArtist: false,
  }
};

// Folders are dynamically assigned based on alphabetical order of folders in seed-data/images
export const FAKE_ARTISTS = [
  { clerkId: 'fake_artist_02', username: 'luna_art', displayName: 'Luna Art' },
  { clerkId: 'fake_artist_03', username: 'cyber_neon', displayName: 'Cyber Neon' },
  { clerkId: 'fake_artist_04', username: 'portrait_master', displayName: 'Portrait Master' },
  { clerkId: 'fake_artist_05', username: 'fantasy_realm', displayName: 'Fantasy Realm' },
  { clerkId: 'fake_artist_06', username: 'chibi_chan', displayName: 'Chibi Chan' },
  { clerkId: 'fake_artist_07', username: 'concept_studio', displayName: 'Concept Studio' },
  { clerkId: 'fake_artist_08', username: 'water_colors', displayName: 'Watercolor Magic' },
  { clerkId: 'fake_artist_09', username: 'digital_abstract', displayName: 'Digital Abstract' },
  { clerkId: 'fake_artist_10', username: 'manga_ka', displayName: 'Manga Ka' },
];

export const FAKE_USERS = [
  { clerkId: 'fake_user_01', username: 'art_lover_1', displayName: 'Art Lover 1' },
  { clerkId: 'fake_user_02', username: 'art_lover_2', displayName: 'Art Lover 2' },
  { clerkId: 'fake_user_03', username: 'art_lover_3', displayName: 'Art Lover 3' },
  { clerkId: 'fake_user_04', username: 'art_lover_4', displayName: 'Art Lover 4' },
  { clerkId: 'fake_user_05', username: 'art_lover_5', displayName: 'Art Lover 5' },
  { clerkId: 'fake_user_06', username: 'art_lover_6', displayName: 'Art Lover 6' },
  { clerkId: 'fake_user_07', username: 'art_lover_7', displayName: 'Art Lover 7' },
  { clerkId: 'fake_user_08', username: 'art_lover_8', displayName: 'Art Lover 8' },
];

export const FAKE_MODS = [
  { clerkId: 'fake_mod_01', username: 'helper_mod', displayName: 'Helper Mod', role: UserRole.MODERATOR },
];

// Extra tags to generate for a specific base theme. The script will automatically create the base theme tag (e.g. 'football' for 'a04-football').
export const EXTRA_TAGS_MAP: Record<string, string[]> = {
  'anime': ['girl', 'kawaii', 'shoujo', 'shounen'],
  'landscape': ['scenery', 'nature', 'mountain', 'sky'],
  'cyberpunk': ['neon', 'futuristic', 'sci-fi', 'city'],
  'portrait': ['face', 'character', 'realistic', 'eyes'],
  'fantasy': ['magic', 'dragon', 'sword', 'castle'],
  'chibi': ['cute', 'tiny', 'super-deformed', 'funny'],
  'concept-art': ['design', 'sketch', 'world-building', 'character-design'],
  'watercolor': ['traditional', 'painting', 'soft', 'brush'],
  'digital-art': ['abstract', 'colorful', 'modern', 'surreal'],
  'manga': ['comic', 'monochrome', 'panel', 'story'],
  'car': ['vehicle', 'speed', 'automotive', 'racing'],
  'football': ['goal', 'sport', 'match', 'stadium'],
  'war': ['military', 'battle', 'combat', 'history'],
  'politics': ['news', 'debate', 'leader', 'government'],
};

export const POPULARITY_TIERS = {
  TOP: {
    viewRange: [5000, 10000] as [number, number],
    likeRatio: 0.15,
    commentRatio: 0.05,
  },
  MID: {
    viewRange: [1000, 3000] as [number, number],
    likeRatio: 0.10,
    commentRatio: 0.03,
  },
  LOW: {
    viewRange: [100, 500] as [number, number],
    likeRatio: 0.08,
    commentRatio: 0.02,
  },
};

export const COMMENT_POOL = [
  'Đẹp quá! 🔥',
  'Tuyệt vời luôn, xin wallpaper được không ạ?',
  'Style này mình thích quá!',
  'Có tutorial không bạn?',
  'Amazing work! Keep it up! 💯',
  'Wow, màu sắc đỉnh thật!',
  'Bức này vẽ mất bao lâu vậy bạn?',
  'Nhìn cuốn quá!',
  'Đỉnh của chóp 👏👏',
  'Quá xuất sắc!'
];
