import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  productName: string;
  productDescription: string;
  productPrice: bigint;
  imageUrl?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

/** Safely convert a BigInt/string/number price to a plain JS number. */
function toNumber(price: unknown): number {
  if (typeof price === "bigint") return Number(price);
  if (typeof price === "number") return Number.isNaN(price) ? 0 : price;
  const n = Number.parseInt(String(price), 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Compute total items from an items array. */
export function computeTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Compute total price (in cents) from an items array. */
export function computeTotalPrice(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + toNumber(item.productPrice) * item.quantity,
    0,
  );
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "creative-prints-cart",
      // Serialize BigInt for localStorage
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const parsed = JSON.parse(str);
            // Convert price strings back to BigInt
            if (parsed?.state?.items) {
              parsed.state.items = parsed.state.items.map((item: CartItem) => ({
                ...item,
                productPrice: BigInt(
                  (item as CartItem & { productPrice: unknown }).productPrice ??
                    0,
                ),
              }));
            }
            return parsed;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const serialized = JSON.stringify(value, (_, v) =>
              typeof v === "bigint" ? v.toString() : v,
            );
            localStorage.setItem(name, serialized);
          } catch {
            // ignore
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
