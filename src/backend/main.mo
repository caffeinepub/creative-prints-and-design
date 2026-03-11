import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let GUARANTEED_ADMIN_EMAIL = "lanepeevy@gmail.com";

  // Stable principal reference for the guaranteed admin.
  // Persists across canister upgrades so auth works immediately after deploy.
  stable var guaranteedAdminPrincipal : ?Principal = null;

  let emailToPrincipal = Map.empty<Text, Principal>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let products = Map.empty<Text, Product>();
  let galleryItems = Map.empty<Text, GalleryItem>();
  let customOrders = Map.empty<Text, CustomOrder>();
  let storeOrders = Map.empty<Text, StoreOrder>();
  let paymentConfirmations = Map.empty<Text, PaymentConfirmation>();

  include MixinStorage();

  public type UserProfile = {
    email : Text;
    name : Text;
    isAdmin : Bool;
  };

  public type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type Product = {
    id : Text;
    name : Text;
    description : Text;
    price : Nat;
    image : Storage.ExternalBlob;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Text.compare(p1.id, p2.id);
    };
  };

  type GalleryItem = {
    id : Text;
    title : Text;
    description : Text;
    image : Storage.ExternalBlob;
  };

  module GalleryItem {
    public func compare(i1 : GalleryItem, i2 : GalleryItem) : Order.Order {
      Text.compare(i1.id, i2.id);
    };
  };

  type CustomOrder = {
    id : Text;
    name : Text;
    email : ?Text;
    phone : ?Text;
    description : Text;
    modelFile : ?Storage.ExternalBlob;
  };

  module CustomOrder {
    public func compare(o1 : CustomOrder, o2 : CustomOrder) : Order.Order {
      Text.compare(o1.id, o2.id);
    };
  };

  type StoreOrder = {
    id : Text;
    customerName : Text;
    email : Text;
    phone : Text;
    productId : Text;
    productName : Text;
    productDescription : Text;
    productPrice : Nat;
    paymentProof : ?Storage.ExternalBlob;
    status : Text;
    timestamp : Int;
  };

  module StoreOrder {
    public func compare(o1 : StoreOrder, o2 : StoreOrder) : Order.Order {
      Text.compare(o1.id, o2.id);
    };
  };

  type PaymentConfirmation = {
    id : Text;
    customerName : Text;
    orderId : Text;
    proofFile : Storage.ExternalBlob;
    timestamp : Int;
  };

  module PaymentConfirmation {
    public func compare(p1 : PaymentConfirmation, p2 : PaymentConfirmation) : Order.Order {
      Text.compare(p1.id, p2.id);
    };
  };

  public type OrderType = { #custom; #store };

  public type UnifiedOrder = {
    id : Text;
    orderType : OrderType;
    customerName : Text;
    email : ?Text;
    phone : ?Text;
    description : Text;
    modelFile : ?Storage.ExternalBlob;
    productId : ?Text;
    productName : ?Text;
    productDescription : ?Text;
    productPrice : ?Nat;
    paymentProof : ?Storage.ExternalBlob;
    status : ?Text;
    timestamp : Int;
  };

  func isAdminEmail(email : Text) : Bool {
    Text.equal(email.toLower(), GUARANTEED_ADMIN_EMAIL);
  };

  func isCallerGuaranteedAdmin(caller : Principal) : Bool {
    // Check 1: direct stable principal match (fastest, persists across upgrades)
    switch (guaranteedAdminPrincipal) {
      case (?adminP) { if (caller == adminP) { return true } };
      case (null) {};
    };
    // Check 2: profile-based check (works after saveCallerUserProfile)
    switch (userProfiles.get(caller)) {
      case (?profile) { isAdminEmail(profile.email) };
      case (null) { false };
    };
  };

  // Bootstrap the guaranteed admin: store principal + add profile + AccessControl.
  func bootstrapGuaranteedAdmin(caller : Principal) {
    guaranteedAdminPrincipal := ?caller;
    AccessControl.initialize(accessControlState, caller, "", "");
    let adminProfile : UserProfile = {
      email = GUARANTEED_ADMIN_EMAIL;
      name = "Admin";
      isAdmin = true;
    };
    userProfiles.add(caller, adminProfile);
    emailToPrincipal.add(GUARANTEED_ADMIN_EMAIL, caller);
  };

  // requireAdmin for UPDATE calls.
  func requireAdminUpdate(caller : Principal) {
    if (isCallerGuaranteedAdmin(caller)) { return };
    if (not caller.isAnonymous() and AccessControl.isAdmin(accessControlState, caller)) { return };
    Runtime.trap("Unauthorized: Only admins can perform this action");
  };

  // requireAdmin for QUERY calls.
  func requireAdminQuery(caller : Principal) {
    if (isCallerGuaranteedAdmin(caller)) { return };
    if (not caller.isAnonymous() and AccessControl.isAdmin(accessControlState, caller)) { return };
    Runtime.trap("Unauthorized: Only admins can perform this action");
  };

  // === User Profile Management ===

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user) {
      requireAdminQuery(caller);
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    let normalizedEmail = profile.email.toLower();
    let actualIsAdmin = isAdminEmail(normalizedEmail);
    let normalizedProfile : UserProfile = {
      email = normalizedEmail;
      name = profile.name;
      isAdmin = actualIsAdmin;
    };
    userProfiles.add(caller, normalizedProfile);
    emailToPrincipal.add(normalizedEmail, caller);
    if (actualIsAdmin) {
      bootstrapGuaranteedAdmin(caller);
    };
  };

  public shared ({ caller }) func registerUserProfile(email : Text, name : Text) : async () {
    let normalizedEmail = email.toLower();
    let actualIsAdmin = isAdminEmail(normalizedEmail);
    let profile : UserProfile = {
      email = normalizedEmail;
      name;
      isAdmin = actualIsAdmin;
    };
    userProfiles.add(caller, profile);
    emailToPrincipal.add(normalizedEmail, caller);
    if (actualIsAdmin) {
      bootstrapGuaranteedAdmin(caller);
    };
  };

  public shared ({ caller }) func verifyAndEnsureAdminStatus() : async Bool {
    if (isCallerGuaranteedAdmin(caller)) { return true };
    if (not caller.isAnonymous() and AccessControl.isAdmin(accessControlState, caller)) { return true };
    false;
  };

  public query ({ caller }) func getPrincipalByEmail(email : Text) : async ?Principal {
    requireAdminQuery(caller);
    emailToPrincipal.get(email.toLower());
  };

  public shared ({ caller }) func assignUserRole(user : Principal, role : UserRole) : async () {
    requireAdminUpdate(caller);
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  // === Product Management ===

  public shared ({ caller }) func addProduct(id : Text, name : Text, description : Text, price : Nat, image : Storage.ExternalBlob) : async () {
    requireAdminUpdate(caller);
    if (products.containsKey(id)) { Runtime.trap("Product with this id already exists.") };
    let product : Product = { id; name; description; price; image };
    products.add(id, product);
  };

  public shared ({ caller }) func updateProduct(id : Text, name : Text, description : Text, price : Nat, image : Storage.ExternalBlob) : async () {
    requireAdminUpdate(caller);
    if (not products.containsKey(id)) { Runtime.trap("Product does not exist") };
    let product : Product = { id; name; description; price; image };
    products.add(id, product);
  };

  public shared ({ caller }) func deleteProduct(id : Text) : async () {
    requireAdminUpdate(caller);
    if (not products.containsKey(id)) { Runtime.trap("Product does not exist") };
    products.remove(id);
  };

  public query func getProduct(id : Text) : async Product {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?product) { product };
    };
  };

  public query func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };

  // === Gallery Management ===

  public shared ({ caller }) func addGalleryItem(id : Text, title : Text, description : Text, image : Storage.ExternalBlob) : async () {
    requireAdminUpdate(caller);
    if (galleryItems.containsKey(id)) { Runtime.trap("Item with this id already exists.") };
    let item : GalleryItem = { id; title; description; image };
    galleryItems.add(id, item);
  };

  public shared ({ caller }) func updateGalleryItem(id : Text, title : Text, description : Text, image : Storage.ExternalBlob) : async () {
    requireAdminUpdate(caller);
    if (not galleryItems.containsKey(id)) { Runtime.trap("Gallery item does not exist") };
    let item : GalleryItem = { id; title; description; image };
    galleryItems.add(id, item);
  };

  public shared ({ caller }) func deleteGalleryItem(id : Text) : async () {
    requireAdminUpdate(caller);
    if (not galleryItems.containsKey(id)) { Runtime.trap("Gallery item does not exist") };
    galleryItems.remove(id);
  };

  public query func getGalleryItem(id : Text) : async GalleryItem {
    switch (galleryItems.get(id)) {
      case (null) { Runtime.trap("Gallery item does not exist") };
      case (?item) { item };
    };
  };

  public query func getAllGalleryItems() : async [GalleryItem] {
    galleryItems.values().toArray().sort();
  };

  // === Order Submission (public, no auth required) ===

  public shared (_) func submitCustomOrder(id : Text, name : Text, email : ?Text, phone : ?Text, description : Text, modelFile : ?Storage.ExternalBlob) : async () {
    if (customOrders.containsKey(id)) { Runtime.trap("Order with this id already exists") };
    let hasEmail = switch (email) {
      case (null) { false };
      case (?e) { not (e.trim(#char ' ') == "") };
    };
    let hasPhone = switch (phone) {
      case (null) { false };
      case (?p) { not (p.trim(#char ' ') == "") };
    };
    if (not hasEmail and not hasPhone) {
      Runtime.trap("At least one contact method (email or phone) must be provided");
    };
    let order : CustomOrder = { id; name; email; phone; description; modelFile };
    customOrders.add(id, order);
  };

  public shared (_) func submitStoreOrder(
    id : Text,
    customerName : Text,
    email : Text,
    phone : Text,
    productId : Text,
    productName : Text,
    productDescription : Text,
    productPrice : Nat,
    paymentProof : ?Storage.ExternalBlob,
  ) : async () {
    if (storeOrders.containsKey(id)) { Runtime.trap("Order with this id already exists") };
    let order : StoreOrder = {
      id;
      customerName;
      email;
      phone;
      productId;
      productName;
      productDescription;
      productPrice;
      paymentProof;
      status = "pending";
      timestamp = Time.now();
    };
    storeOrders.add(id, order);
  };

  public shared ({ caller }) func updateStoreOrderStatus(id : Text, status : Text) : async () {
    requireAdminUpdate(caller);
    switch (storeOrders.get(id)) {
      case (null) { Runtime.trap("Order does not exist") };
      case (?order) {
        let updatedOrder : StoreOrder = {
          id = order.id;
          customerName = order.customerName;
          email = order.email;
          phone = order.phone;
          productId = order.productId;
          productName = order.productName;
          productDescription = order.productDescription;
          productPrice = order.productPrice;
          paymentProof = order.paymentProof;
          status;
          timestamp = order.timestamp;
        };
        storeOrders.add(id, updatedOrder);
      };
    };
  };

  public shared ({ caller }) func deleteStoreOrder(id : Text) : async () {
    requireAdminUpdate(caller);
    if (not storeOrders.containsKey(id)) { Runtime.trap("Order does not exist") };
    storeOrders.remove(id);
  };

  public shared ({ caller }) func deleteCustomOrder(id : Text) : async () {
    requireAdminUpdate(caller);
    if (not customOrders.containsKey(id)) { Runtime.trap("Order does not exist") };
    customOrders.remove(id);
  };

  public shared (_) func submitPaymentConfirmation(id : Text, customerName : Text, orderId : Text, proofFile : Storage.ExternalBlob) : async () {
    if (paymentConfirmations.containsKey(id)) { Runtime.trap("Confirmation with this id already exists") };
    let confirmation : PaymentConfirmation = {
      id;
      customerName;
      orderId;
      proofFile;
      timestamp = Time.now();
    };
    paymentConfirmations.add(id, confirmation);
  };

  // === Admin Order/Confirmation Queries ===

  public shared ({ caller }) func getAllCustomOrders() : async [CustomOrder] {
    requireAdminUpdate(caller);
    customOrders.values().toArray().sort();
  };

  public shared ({ caller }) func getAllStoreOrders() : async [StoreOrder] {
    requireAdminUpdate(caller);
    storeOrders.values().toArray().sort();
  };

  public shared ({ caller }) func getAllUnifiedOrders() : async [UnifiedOrder] {
    requireAdminUpdate(caller);
    let customOrdersArray = customOrders.values().toArray();
    let storeOrdersArray = storeOrders.values().toArray();
    let unifiedCustomOrders = customOrdersArray.map(
      func(order : CustomOrder) : UnifiedOrder {
        {
          id = order.id;
          orderType = #custom;
          customerName = order.name;
          email = order.email;
          phone = order.phone;
          description = order.description;
          modelFile = order.modelFile;
          productId = null;
          productName = null;
          productDescription = null;
          productPrice = null;
          paymentProof = null;
          status = null;
          timestamp = 0;
        };
      }
    );
    let unifiedStoreOrders = storeOrdersArray.map(
      func(order : StoreOrder) : UnifiedOrder {
        {
          id = order.id;
          orderType = #store;
          customerName = order.customerName;
          email = ?order.email;
          phone = ?order.phone;
          description = order.productDescription;
          modelFile = null;
          productId = ?order.productId;
          productName = ?order.productName;
          productDescription = ?order.productDescription;
          productPrice = ?order.productPrice;
          paymentProof = order.paymentProof;
          status = ?order.status;
          timestamp = order.timestamp;
        };
      }
    );
    unifiedCustomOrders.concat(unifiedStoreOrders);
  };

  public shared ({ caller }) func getAllPaymentConfirmations() : async [PaymentConfirmation] {
    requireAdminUpdate(caller);
    paymentConfirmations.values().toArray().sort();
  };
};
