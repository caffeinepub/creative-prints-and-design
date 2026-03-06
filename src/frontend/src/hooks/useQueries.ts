import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CustomOrder,
  GalleryItem,
  PaymentConfirmation,
  Product,
  StoreOrder,
  UserProfile,
} from "../backend";
import type { ExternalBlob, backendInterface } from "../backend";
import { useActor } from "./useActor";

/**
 * Polls until the actor is available or the timeout expires.
 * This prevents "Actor not available" errors during the brief init window.
 */
async function waitForActor(
  getActor: () => backendInterface | null,
  maxWaitMs = 10000,
): Promise<backendInterface> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const actor = getActor();
    if (actor) return actor;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(
    "Backend connection timed out. Please refresh the page and try again.",
  );
}

// ===== Products =====

export function useGetAllProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.getAllProducts();
    },
    enabled: !isFetching,
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.addProduct(id, name, description, price, image);
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.updateProduct(id, name, description, price, image);
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.deleteProduct(id);
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.getAllGalleryItems();
    },
    enabled: !isFetching,
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.addGalleryItem(id, title, description, image);
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.updateGalleryItem(id, title, description, image);
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.deleteGalleryItem(id);
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.submitCustomOrder(
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

  return useQuery<CustomOrder[]>({
    queryKey: ["customOrders"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.getAllCustomOrders();
    },
    enabled: !isFetching,
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.submitStoreOrder(
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

  return useQuery<StoreOrder[]>({
    queryKey: ["storeOrders"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.getAllStoreOrders();
    },
    enabled: !isFetching,
  });
}

export function useUpdateStoreOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.updateStoreOrderStatus(id, status);
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.submitPaymentConfirmation(
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

  return useQuery<PaymentConfirmation[]>({
    queryKey: ["paymentConfirmations"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.getAllPaymentConfirmations();
    },
    enabled: !isFetching,
  });
}

// ===== Admin =====

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() => actor);
      try {
        return await resolvedActor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVerifyAndEnsureAdminStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.verifyAndEnsureAdminStatus();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

// ===== User Profile =====

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.getCallerUserProfile();
    },
    enabled: !actorFetching,
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.saveCallerUserProfile(profile);
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
      const resolvedActor = await waitForActor(() => actor);
      return resolvedActor.registerUserProfile(email, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}
