/**
 * Global type declarations for Clerk
 */

type ClerkSession = {
  getToken: () => Promise<string | null>;
};

type ClerkUser = {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
};

type ClerkInstance = {
  session?: ClerkSession;
  user?: ClerkUser;
};

declare global {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Window {
    Clerk?: ClerkInstance;
  }
}

export { };
