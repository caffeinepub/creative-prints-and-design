import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CustomOrder,
  GalleryItem,
  PaymentConfirmation,
  Product,
  StoreOrder,
  UserProfile,
} from "../backend";
import type { ExternalBlob } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// ===== Products =====

export function useGetAllProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ["products"],
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
    mutationFn: async ({
      id,
      name,
      description,
      price,
      image,
    }: {
      id: string;
      name: string;
      description: string;
      price: bigint;
      image: ExternalBlob;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addProduct(id, name, description, price, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      price,
      image,
    }: {
      id: string;
      name: string;
      description: string;
      price: bigint;
      image: ExternalBlob;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateProduct(id, name, description, price, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ===== Gallery =====

export function useGetAllGalleryItems() {
  const { actor, isFetching } = useActor();

  return useQuery<GalleryItem[]>({
    queryKey: ["galleryItems"],
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
    mutationFn: async ({
      id,
      title,
      description,
      image,
    }: {
      id: string;
      title: string;
      description: string;
      image: ExternalBlob;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addGalleryItem(id, title, description, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryItems"] });
    },
  });
}

export function useUpdateGalleryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      image,
    }: {
      id: string;
      title: string;
      description: string;
      image: ExternalBlob;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateGalleryItem(id, title, description, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryItems"] });
    },
  });
}

export function useDeleteGalleryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteGalleryItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryItems"] });
    },
  });
}

// ===== Custom Orders =====

export function useSubmitCustomOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      email,
      phone,
      description,
      modelFile,
    }: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      description: string;
      modelFile: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitCustomOrder(
        id,
        name,
        email,
        phone,
        description,
        modelFile,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customOrders"] });
    },
  });
}

export function useGetAllCustomOrders() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<CustomOrder[]>({
    queryKey: ["customOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomOrders();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// ===== Store Orders =====

export function useSubmitStoreOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      customerName,
      email,
      phone,
      productId,
      productName,
      productDescription,
      productPrice,
      paymentProof,
    }: {
      id: string;
      customerName: string;
      email: string;
      phone: string;
      productId: string;
      productName: string;
      productDescription: string;
      productPrice: bigint;
      paymentProof: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitStoreOrder(
        id,
        customerName,
        email,
        phone,
        productId,
        productName,
        productDescription,
        productPrice,
        paymentProof,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storeOrders"] });
    },
  });
}

export function useGetAllStoreOrders() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<StoreOrder[]>({
    queryKey: ["storeOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStoreOrders();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useUpdateStoreOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateStoreOrderStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storeOrders"] });
    },
  });
}

// ===== Payment Confirmations =====

export function useSubmitPaymentConfirmation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      customerName,
      orderId,
      proofFile,
    }: {
      id: string;
      customerName: string;
      orderId: string;
      proofFile: ExternalBlob;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitPaymentConfirmation(
        id,
        customerName,
        orderId,
        proofFile,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentConfirmations"] });
    },
  });
}

export function useGetAllPaymentConfirmations() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PaymentConfirmation[]>({
    queryKey: ["paymentConfirmations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPaymentConfirmations();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// ===== Admin =====

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVerifyAndEnsureAdminStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.verifyAndEnsureAdminStatus();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

// ===== User Profile =====

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

export function useRegisterUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.registerUserProfile(email, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}
