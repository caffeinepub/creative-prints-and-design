import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useAuth } from './useAuth';
import type { Product, GalleryItem, CustomOrder, StoreOrder, PaymentConfirmation, UnifiedOrder, UserProfile } from '../backend';
import { ExternalBlob } from '../backend';

// ─── Products ────────────────────────────────────────────────────────────────

export function useGetAllProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string; name: string; description: string; price: bigint; image: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addProduct(data.id, data.name, data.description, data.price, data.image);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string; name: string; description: string; price: bigint; image: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProduct(data.id, data.name, data.description, data.price, data.image);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteProduct(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

export function useGetAllGalleryItems() {
  const { actor, isFetching } = useActor();
  return useQuery<GalleryItem[]>({
    queryKey: ['galleryItems'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGalleryItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddGalleryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string; title: string; description: string; image: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addGalleryItem(data.id, data.title, data.description, data.image);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['galleryItems'] }),
  });
}

export function useUpdateGalleryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string; title: string; description: string; image: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateGalleryItem(data.id, data.title, data.description, data.image);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['galleryItems'] }),
  });
}

export function useDeleteGalleryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteGalleryItem(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['galleryItems'] }),
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useGetAllUnifiedOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<UnifiedOrder[]>({
    queryKey: ['unifiedOrders'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllUnifiedOrders();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useGetAllCustomOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<CustomOrder[]>({
    queryKey: ['customOrders'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllCustomOrders();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useGetAllStoreOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<StoreOrder[]>({
    queryKey: ['storeOrders'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllStoreOrders();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useSubmitCustomOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string; name: string; email: string | null; phone: string | null;
      description: string; modelFile: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitCustomOrder(
        data.id, data.name, data.email, data.phone, data.description, data.modelFile
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customOrders'] }),
  });
}

export function useSubmitStoreOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string; customerName: string; email: string; phone: string;
      productId: string; productName: string; productDescription: string;
      productPrice: bigint; paymentProof: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitStoreOrder(
        data.id, data.customerName, data.email, data.phone,
        data.productId, data.productName, data.productDescription,
        data.productPrice, data.paymentProof
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storeOrders'] }),
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function useGetAllPaymentConfirmations() {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentConfirmation[]>({
    queryKey: ['paymentConfirmations'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllPaymentConfirmations();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useSubmitPaymentConfirmation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string; customerName: string; orderId: string; proofFile: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitPaymentConfirmation(data.id, data.customerName, data.orderId, data.proofFile);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentConfirmations'] }),
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useRegisterUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; name: string; isAdmin: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerUserProfile(data.email, data.name, data.isAdmin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStatus'] });
      queryClient.invalidateQueries({ queryKey: ['callerUserProfile'] });
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ['callerUserProfile'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['callerUserProfile'] }),
  });
}

// ─── Admin Verification ───────────────────────────────────────────────────────
//
// Strategy:
//   1. Call verifyAndEnsureAdminStatus() (update) to register/elevate the admin
//      principal in the backend's access-control state.
//   2. Then call isCallerAdmin() (query) to confirm the result.
//
// We run this whenever the actor is ready AND the local auth says the user is
// authenticated.  We do NOT gate on the local isAdmin() flag so that the
// backend is always the source of truth.

export function useVerifyAdminStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated, user } = useAuth();

  return useQuery<boolean>({
    queryKey: ['adminStatus', user?.email ?? 'anonymous'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        // Step 1: ensure the backend has the admin role set for this principal
        await actor.verifyAndEnsureAdminStatus();
        // Step 2: authoritative query check
        const result = await actor.isCallerAdmin();
        return result;
      } catch (err) {
        // If verifyAndEnsureAdminStatus traps, fall back to isCallerAdmin alone
        try {
          return await actor.isCallerAdmin();
        } catch {
          return false;
        }
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: false,
    staleTime: 0,
  });
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export function useRequestPasswordReset() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestPasswordReset(email);
    },
  });
}

export function useCompletePasswordReset() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.completePasswordReset(email);
    },
  });
}
