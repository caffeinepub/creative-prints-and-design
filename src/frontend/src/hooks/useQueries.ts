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
 * Retrieves the latest actor directly from the React Query cache.
 * This avoids stale closure bugs where mutation functions capture a null actor
 * from the render snapshot before the actor query has resolved.
 */
function getActorFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
): backendInterface | null {
  // The actor is stored under ["actor", principalString] — query for any key starting with "actor"
  const queries = queryClient.getQueriesData<backendInterface>({
    queryKey: ["actor"],
  });
  for (const [, data] of queries) {
    if (data) return data;
  }
  return null;
}

/**
 * Polls until the actor is available or the timeout expires.
 * This prevents "Actor not available" errors during the brief init window.
 */
async function waitForActor(
  getActor: () => backendInterface | null,
  maxWaitMs = 15000,
): Promise<backendInterface> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const actor = getActor();
    if (actor) return actor;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(
    "Backend connection timed out. Please refresh the page and try again.",
  );
}

const ADMIN_EMAIL = "lanepeevy@gmail.com";

/**
 * Ensures the current caller is registered as the guaranteed admin before
 * performing any admin action. This is necessary because the app uses
 * email/password login (frontend-only) while the ICP backend authenticates
 * by principal — so we must always re-register the admin email binding.
 *
 * Errors are NOT suppressed here so that callers can see if registration fails.
 */
async function ensureAdminRegistered(actor: backendInterface): Promise<void> {
  // Must re-register every time since anonymous principals reset between sessions
  await actor.saveCallerUserProfile({
    email: ADMIN_EMAIL,
    name: "Lane Peevy",
    isAdmin: true,
  });
}

/**
 * Gets an actor that is pre-registered as the admin principal.
 * Use this instead of waitForActor for all admin mutation calls.
 * Uses the queryClient to fetch the freshest actor from cache (avoids stale closures).
 */
async function waitForAdminActor(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<backendInterface> {
  const actor = await waitForActor(() => getActorFromCache(queryClient));
  await ensureAdminRegistered(actor);
  return actor;
}

// ===== Products =====

export function useGetAllProducts() {
  const { isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
      return resolvedActor.getAllProducts();
    },
    enabled: !isFetching,
  });
}

export function useAddProduct() {
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
      const resolvedActor = await waitForAdminActor(queryClient);
      return resolvedActor.addProduct(id, name, description, price, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
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
      const resolvedActor = await waitForAdminActor(queryClient);
      return resolvedActor.updateProduct(id, name, description, price, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const resolvedActor = await waitForAdminActor(queryClient);
      return resolvedActor.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ===== Gallery =====

export function useGetAllGalleryItems() {
  const { isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<GalleryItem[]>({
    queryKey: ["galleryItems"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
      return resolvedActor.getAllGalleryItems();
    },
    enabled: !isFetching,
  });
}

export function useAddGalleryItem() {
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
      const resolvedActor = await waitForAdminActor(queryClient);
      return resolvedActor.addGalleryItem(id, title, description, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryItems"] });
    },
  });
}

export function useUpdateGalleryItem() {
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
      const resolvedActor = await waitForAdminActor(queryClient);
      return resolvedActor.updateGalleryItem(id, title, description, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryItems"] });
    },
  });
}

export function useDeleteGalleryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const resolvedActor = await waitForAdminActor(queryClient);
      return resolvedActor.deleteGalleryItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryItems"] });
    },
  });
}

// ===== Custom Orders =====

export function useSubmitCustomOrder() {
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
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
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
  const { isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<CustomOrder[]>({
    queryKey: ["customOrders"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
      return resolvedActor.getAllCustomOrders();
    },
    enabled: !isFetching,
  });
}

// ===== Store Orders =====

export function useSubmitStoreOrder() {
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
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
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
  const { isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<StoreOrder[]>({
    queryKey: ["storeOrders"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
      return resolvedActor.getAllStoreOrders();
    },
    enabled: !isFetching,
  });
}

export function useUpdateStoreOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const resolvedActor = await waitForAdminActor(queryClient);
      return resolvedActor.updateStoreOrderStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storeOrders"] });
    },
  });
}

// ===== Payment Confirmations =====

export function useSubmitPaymentConfirmation() {
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
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
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
  const { isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<PaymentConfirmation[]>({
    queryKey: ["paymentConfirmations"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
      return resolvedActor.getAllPaymentConfirmations();
    },
    enabled: !isFetching,
  });
}

// ===== Admin =====

export function useIsCallerAdmin() {
  const { isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
      return resolvedActor.verifyAndEnsureAdminStatus();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

// ===== User Profile =====

export function useGetCallerUserProfile() {
  const { isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
      return resolvedActor.getCallerUserProfile();
    },
    enabled: !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!getActorFromCache(queryClient) && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
      return resolvedActor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

export function useRegisterUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      const resolvedActor = await waitForActor(() =>
        getActorFromCache(queryClient),
      );
      return resolvedActor.registerUserProfile(email, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}
