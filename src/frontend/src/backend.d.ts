import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Product {
    id: string;
    name: string;
    description: string;
    image: ExternalBlob;
    price: bigint;
}
export interface PaymentConfirmation {
    id: string;
    customerName: string;
    proofFile: ExternalBlob;
    orderId: string;
    timestamp: bigint;
}
export interface StoreOrder {
    id: string;
    customerName: string;
    status: string;
    productId: string;
    productName: string;
    email: string;
    paymentProof?: ExternalBlob;
    timestamp: bigint;
    phone: string;
    productPrice: bigint;
    productDescription: string;
}
export interface UnifiedOrder {
    id: string;
    customerName: string;
    status?: string;
    description: string;
    productId?: string;
    productName?: string;
    orderType: OrderType;
    email?: string;
    paymentProof?: ExternalBlob;
    modelFile?: ExternalBlob;
    timestamp: bigint;
    phone?: string;
    productPrice?: bigint;
    productDescription?: string;
}
export interface GalleryItem {
    id: string;
    title: string;
    description: string;
    image: ExternalBlob;
}
export interface CustomOrder {
    id: string;
    name: string;
    description: string;
    email?: string;
    modelFile?: ExternalBlob;
    phone?: string;
}
export interface UserProfile {
    name: string;
    email: string;
    isAdmin: boolean;
}
export enum OrderType {
    custom = "custom",
    store = "store"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGalleryItem(id: string, title: string, description: string, image: ExternalBlob): Promise<void>;
    addProduct(id: string, name: string, description: string, price: bigint, image: ExternalBlob): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteGalleryItem(id: string): Promise<void>;
    deleteProduct(id: string): Promise<void>;
    getAllCustomOrders(): Promise<Array<CustomOrder>>;
    getAllGalleryItems(): Promise<Array<GalleryItem>>;
    getAllPaymentConfirmations(): Promise<Array<PaymentConfirmation>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllStoreOrders(): Promise<Array<StoreOrder>>;
    getAllUnifiedOrders(): Promise<Array<UnifiedOrder>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGalleryItem(id: string): Promise<GalleryItem>;
    getPrincipalByEmail(email: string): Promise<Principal | null>;
    getProduct(id: string): Promise<Product>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    registerUserProfile(email: string, name: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitCustomOrder(id: string, name: string, email: string | null, phone: string | null, description: string, modelFile: ExternalBlob | null): Promise<void>;
    submitPaymentConfirmation(id: string, customerName: string, orderId: string, proofFile: ExternalBlob): Promise<void>;
    submitStoreOrder(id: string, customerName: string, email: string, phone: string, productId: string, productName: string, productDescription: string, productPrice: bigint, paymentProof: ExternalBlob | null): Promise<void>;
    updateGalleryItem(id: string, title: string, description: string, image: ExternalBlob): Promise<void>;
    updateProduct(id: string, name: string, description: string, price: bigint, image: ExternalBlob): Promise<void>;
    updateStoreOrderStatus(id: string, status: string): Promise<void>;
    verifyAndEnsureAdminStatus(): Promise<boolean>;
}
