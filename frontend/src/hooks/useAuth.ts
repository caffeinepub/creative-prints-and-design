import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  requestPasswordReset: (email: string) => Promise<boolean>;
  setBackendRegistrationCallback: (callback: (email: string, name: string, isAdmin: boolean) => Promise<void>) => void;
}

// Predefined admin credentials - PERMANENT ADMIN ACCOUNT
const ADMIN_EMAIL = 'lanepeevy@gmail.com';
const ADMIN_PASSWORD = 'peevytriplets12!';
const ADMIN_NAME = 'Lane Peevy';

// User database stored in localStorage
const USERS_KEY = 'creativeprints_users';

interface StoredUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

const getUsers = (): StoredUser[] => {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    // Initialize with predefined admin account
    const predefinedAdmin: StoredUser = {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      role: 'admin',
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([predefinedAdmin]));
    return [predefinedAdmin];
  }
  
  const users = JSON.parse(stored);
  
  // Ensure predefined admin exists and has correct credentials
  const adminIndex = users.findIndex((u: StoredUser) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (adminIndex === -1) {
    // Add predefined admin if not found
    const predefinedAdmin: StoredUser = {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      role: 'admin',
    };
    users.push(predefinedAdmin);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } else {
    // Update existing admin to ensure correct credentials and role
    users[adminIndex] = {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      role: 'admin',
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  
  return users;
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const findUser = (email: string): StoredUser | undefined => {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
};

const createUser = (email: string, password: string, name: string): StoredUser => {
  const users = getUsers();
  const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  // Prevent creating duplicate admin account
  if (isAdminEmail) {
    throw new Error('This email is reserved for the admin account');
  }
  
  const newUser: StoredUser = {
    email,
    password,
    name,
    role: 'user',
  };
  
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

let backendRegistrationCallback: ((email: string, name: string, isAdmin: boolean) => Promise<void>) | null = null;

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setBackendRegistrationCallback: (callback) => {
        backendRegistrationCallback = callback;
      },

      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true });
        
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          const user = findUser(email);
          
          if (!user) {
            set({ isLoading: false });
            return false;
          }
          
          if (user.password !== password) {
            set({ isLoading: false });
            return false;
          }
          
          // Recognize guaranteed admin email
          const isGuaranteedAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
          const role = isGuaranteedAdmin ? 'admin' : user.role;
          
          const userProfile = {
            email: user.email,
            name: user.name,
            role: role,
          };
          
          set({
            user: userProfile,
            isAuthenticated: true,
            isLoading: false,
          });
          
          console.log('[useAuth] Login successful for:', user.email, 'isAdmin:', isGuaranteedAdmin);
          
          // Register with backend after successful login
          // This establishes the principal-to-email mapping and admin role
          if (backendRegistrationCallback) {
            try {
              console.log('[useAuth] Registering user profile with backend...');
              await backendRegistrationCallback(user.email, user.name, isGuaranteedAdmin);
              console.log('[useAuth] User profile registered with backend successfully');
            } catch (error) {
              console.error('[useAuth] Failed to sync with backend:', error);
              // For admin users, log warning but don't fail login
              // The backend will recognize the admin email on subsequent calls
              if (isGuaranteedAdmin) {
                console.warn('[useAuth] Admin user failed initial backend sync. Backend will recognize admin email on next operation.');
              }
            }
          }
          
          return true;
        } catch (error) {
          console.error('[useAuth] Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      signup: async (email: string, password: string, name: string): Promise<boolean> => {
        set({ isLoading: true });
        
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          // Check if trying to sign up with admin email
          if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            set({ isLoading: false });
            return false;
          }
          
          const existingUser = findUser(email);
          
          if (existingUser) {
            set({ isLoading: false });
            return false;
          }
          
          const newUser = createUser(email, password, name);
          
          const userProfile = {
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
          };
          
          set({
            user: userProfile,
            isAuthenticated: true,
            isLoading: false,
          });
          
          console.log('[useAuth] Signup successful for:', newUser.email);
          
          // Register with backend after successful signup
          if (backendRegistrationCallback) {
            try {
              console.log('[useAuth] Registering new user profile with backend...');
              await backendRegistrationCallback(newUser.email, newUser.name, false);
              console.log('[useAuth] New user profile registered with backend');
            } catch (error) {
              console.error('[useAuth] Failed to register user profile with backend:', error);
            }
          }
          
          return true;
        } catch (error) {
          console.error('[useAuth] Signup error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        console.log('[useAuth] Logging out');
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      isAdmin: () => {
        const state = get();
        // Check if user is authenticated and has admin role
        const isGuaranteedAdmin = state.user?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        return state.isAuthenticated && (state.user?.role === 'admin' || isGuaranteedAdmin);
      },

      requestPasswordReset: async (email: string): Promise<boolean> => {
        set({ isLoading: true });
        
        try {
          await new Promise((resolve) => setTimeout(resolve, 800));
          
          const user = findUser(email);
          
          set({ isLoading: false });
          
          // Always return true for security (don't reveal if email exists)
          return true;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'creativeprints-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
