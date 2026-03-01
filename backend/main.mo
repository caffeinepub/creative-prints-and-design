import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Storage and system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Maps and persistent state
  let emailToPrincipal = Map.empty<Text, Principal>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let products = Map.empty<Text, Product>();
  let galleryItems = Map.empty<Text, GalleryItem>();
  let customOrders = Map.empty<Text, CustomOrder>();
  let storeOrders = Map.empty<Text, StoreOrder>();
  let paymentConfirmations = Map.empty<Text, PaymentConfirmation>();
  let passwordResetRequests = Map.empty<Text, Time.Time>();

  include MixinStorage();

  // Normalized to lowercase for consistent comparison
  let GUARANTEED_ADMIN_EMAIL = "lanepeevy@gmail.com";

  // Access Control
  public type UserRole = {
    #admin;
    #user;
    #guest;
  };

  // Product model
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

  // GalleryItem model
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

  // CustomOrder model
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

  // StoreOrder model
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
    timestamp : Int;
  };

  module StoreOrder {
    public func compare(o1 : StoreOrder, o2 : StoreOrder) : Order.Order {
      Text.compare(o1.id, o2.id);
    };
  };

  // PaymentConfirmation model
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

  // UserProfile model
  public type UserProfile = {
    email : Text;
    name : Text;
    isAdmin : Bool;
  };

  public type RoleAssignmentResult = {
    #success : UserRole;
    #alreadyAssigned;
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
    timestamp : Int;
  };

  // Helper function to check admin email (case-insensitive)
  func isAdminEmail(email : Text) : Bool {
    Text.equal(email.toLower(), GUARANTEED_ADMIN_EMAIL);
  };

  // Helper to check if caller is guaranteed admin by checking email mappings
  func isCallerGuaranteedAdmin(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) { isAdminEmail(profile.email) };
      case (null) {
        for ((email, principal) in emailToPrincipal.entries()) {
          if (Principal.equal(principal, caller) and isAdminEmail(email)) {
            return true;
          };
        };
        false;
      };
    };
  };

  // Ensure admin profile exists and role is assigned (for guaranteed admin only)
  func ensureGuaranteedAdminProfileAndRole(caller : Principal, email : Text) {
    let profile : UserProfile = {
      email = email.toLower();
      name = "Admin";
      isAdmin = true;
    };
    userProfiles.add(caller, profile);
    emailToPrincipal.add(email.toLower(), caller);

    let currentRole = AccessControl.getUserRole(accessControlState, caller);
    if (currentRole != #admin) {
      // For the guaranteed admin, use the initialize function to bootstrap admin status
      // by calling assignRole with caller as both assigner and assignee.
      // AccessControl.assignRole has an admin-only guard; for the guaranteed admin
      // we rely on the fact that AccessControl.initialize sets the first caller as admin.
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
    };
  };

  // Internal lookup helpers
  func getCallerUserProfileInternal(caller : Principal) : ?UserProfile {
    userProfiles.get(caller);
  };

  func getUserProfileInternal(user : Principal) : ?UserProfile {
    userProfiles.get(user);
  };

  // Core authorization check functions
  func checkAdminPermission(caller : Principal) {
    let role = AccessControl.getUserRole(accessControlState, caller);

    // Already admin
    if (role == #admin) {
      return;
    };

    // Check if guaranteed admin and elevate if needed
    if (isCallerGuaranteedAdmin(caller)) {
      ensureGuaranteedAdminProfileAndRole(caller, GUARANTEED_ADMIN_EMAIL);
      return;
    };

    // Check profile for admin email
    switch (getCallerUserProfileInternal(caller)) {
      case (?profile) {
        if (isAdminEmail(profile.email)) {
          ensureGuaranteedAdminProfileAndRole(caller, profile.email);
        } else {
          Runtime.trap("Unauthorized: Only admins can perform this action");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: Only admins can perform this action");
      };
    };
  };

  func checkOwnerOrAdminPermission(caller : Principal, owner : Principal) {
    if (caller == owner) {
      return;
    };

    let role = AccessControl.getUserRole(accessControlState, caller);

    if (role == #admin) {
      return;
    };

    if (isCallerGuaranteedAdmin(caller)) {
      ensureGuaranteedAdminProfileAndRole(caller, GUARANTEED_ADMIN_EMAIL);
      return;
    };

    switch (getCallerUserProfileInternal(caller)) {
      case (?profile) {
        if (isAdminEmail(profile.email)) {
          ensureGuaranteedAdminProfileAndRole(caller, profile.email);
        } else {
          Runtime.trap("Unauthorized: Not admin, not owner");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: Not admin, not owner");
      };
    };
  };

  // Verify and ensure admin status
  public shared ({ caller }) func verifyAndEnsureAdminStatus() : async Bool {
    let currentRole = AccessControl.getUserRole(accessControlState, caller);

    // Already admin
    if (currentRole == #admin) {
      return true;
    };

    // Check if caller is the guaranteed admin
    if (isCallerGuaranteedAdmin(caller)) {
      ensureGuaranteedAdminProfileAndRole(caller, GUARANTEED_ADMIN_EMAIL);
      return true;
    };

    // Check profile for admin status
    switch (getCallerUserProfileInternal(caller)) {
      case (?profile) {
        if (isAdminEmail(profile.email)) {
          ensureGuaranteedAdminProfileAndRole(caller, profile.email);
          true;
        } else { false };
      };
      case (null) { false };
    };
  };

  // Set role for caller - only allows self-promotion to #user role
  // Admin role assignment is handled via verifyAndEnsureAdminStatus
  public shared ({ caller }) func setRoleForCaller(role : UserRole) : async RoleAssignmentResult {
    switch (role) {
      case (#admin) {
        Runtime.trap("Direct role assignment for admin is not authorized. Use verifyAndEnsureAdminStatus.");
      };
      case (#user) {
        return switch (AccessControl.getUserRole(accessControlState, caller)) {
          case (#user) { #alreadyAssigned };
          case (#admin) { #alreadyAssigned };
          case (#guest) {
            // Use AccessControl.initialize to bootstrap the first user,
            // or rely on registerUserProfile for proper role assignment.
            // Since assignRole has an admin-only guard, we handle #user promotion
            // through registerUserProfile instead.
            Runtime.trap("Use registerUserProfile to register as a user.");
          };
        };
      };
      case (#guest) {
        Runtime.trap("Direct guest role assignment is not supported.");
      };
    };
  };

  // Register user profile and assign proper role
  public shared ({ caller }) func registerUserProfile(email : Text, name : Text, isAdmin : Bool) : async () {
    let normalizedEmail = email.toLower();
    let isGuaranteedAdmin = isAdminEmail(normalizedEmail);

    // Only the guaranteed admin email can self-assign admin role
    // Regular users cannot self-assign admin
    let actualIsAdmin = isGuaranteedAdmin;

    let profile : UserProfile = {
      email = normalizedEmail;
      name;
      isAdmin = actualIsAdmin;
    };

    userProfiles.add(caller, profile);
    emailToPrincipal.add(normalizedEmail, caller);

    if (actualIsAdmin) {
      // Guaranteed admin self-assigns via AccessControl.assignRole
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
    } else {
      // Regular user: assign #user role
      // AccessControl.assignRole has admin-only guard, so we use initialize
      // to bootstrap the user role. For non-admin users, role assignment
      // is handled by an admin or via the access control initialize flow.
      // Since assignRole requires admin, regular users remain as #guest
      // until an admin promotes them, or we rely on hasPermission logic.
      // Per the instructions, we assign #user role here.
      AccessControl.assignRole(accessControlState, caller, caller, #user);
    };
  };

  // Get principal by email - admin only (sensitive mapping)
  public query ({ caller }) func getPrincipalByEmail(email : Text) : async ?Principal {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can look up principals by email");
    };
    emailToPrincipal.get(email.toLower());
  };

  // Get caller's user profile - available to any authenticated user (including guests viewing their own)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    getCallerUserProfileInternal(caller);
  };

  // Get specific user's profile - caller can view own profile; admins can view any profile
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    getUserProfileInternal(user);
  };

  // Save caller's user profile - requires at least #user permission
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let normalizedEmail = profile.email.toLower();
    let isGuaranteedAdmin = isAdminEmail(normalizedEmail);

    // Only the guaranteed admin email grants admin status via profile save
    // Regular users cannot elevate themselves to admin by setting isAdmin=true
    let actualIsAdmin = isGuaranteedAdmin;

    let normalizedProfile : UserProfile = {
      email = normalizedEmail;
      name = profile.name;
      isAdmin = actualIsAdmin;
    };

    userProfiles.add(caller, normalizedProfile);
    emailToPrincipal.add(normalizedEmail, caller);

    if (actualIsAdmin) {
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
    };
  };

  // Product management - admin only for mutations, public for reads
  public shared ({ caller }) func addProduct(id : Text, name : Text, description : Text, price : Nat, image : Storage.ExternalBlob) : async () {
    if (products.containsKey(id)) { Runtime.trap("Product with this id already exists.") };
    checkAdminPermission(caller);

    let product : Product = {
      id;
      name;
      description;
      price;
      image;
    };

    products.add(id, product);
  };

  public shared ({ caller }) func updateProduct(id : Text, name : Text, description : Text, price : Nat, image : Storage.ExternalBlob) : async () {
    if (not products.containsKey(id)) { Runtime.trap("Product does not exist") };
    checkAdminPermission(caller);

    let product : Product = {
      id;
      name;
      description;
      price;
      image;
    };

    products.add(id, product);
  };

  public shared ({ caller }) func deleteProduct(id : Text) : async () {
    if (not products.containsKey(id)) { Runtime.trap("Product does not exist") };
    checkAdminPermission(caller);
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

  // GalleryItem management - admin only for mutations, public for reads
  public shared ({ caller }) func addGalleryItem(id : Text, title : Text, description : Text, image : Storage.ExternalBlob) : async () {
    if (galleryItems.containsKey(id)) { Runtime.trap("Item with this id already exists.") };
    checkAdminPermission(caller);

    let item : GalleryItem = {
      id;
      title;
      description;
      image;
    };

    galleryItems.add(id, item);
  };

  public shared ({ caller }) func updateGalleryItem(id : Text, title : Text, description : Text, image : Storage.ExternalBlob) : async () {
    if (not galleryItems.containsKey(id)) { Runtime.trap("Gallery item does not exist") };
    checkAdminPermission(caller);

    let item : GalleryItem = {
      id;
      title;
      description;
      image;
    };

    galleryItems.add(id, item);
  };

  public shared ({ caller }) func deleteGalleryItem(id : Text) : async () {
    if (not galleryItems.containsKey(id)) { Runtime.trap("Gallery item does not exist") };
    checkAdminPermission(caller);
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

  // Custom Order Submission - any user (including guests) can submit
  public shared ({ caller }) func submitCustomOrder(id : Text, name : Text, email : ?Text, phone : ?Text, description : Text, modelFile : ?Storage.ExternalBlob) : async () {
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

    let order : CustomOrder = {
      id;
      name;
      email;
      phone;
      description;
      modelFile;
    };

    customOrders.add(id, order);
  };

  // Store Order Submission - any user (including guests) can submit
  public shared ({ caller }) func submitStoreOrder(
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
      timestamp = Time.now();
    };

    storeOrders.add(id, order);
  };

  // Payment Confirmation Submission - any user (including guests) can submit
  public shared ({ caller }) func submitPaymentConfirmation(id : Text, customerName : Text, orderId : Text, proofFile : Storage.ExternalBlob) : async () {
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

  // Order queries - admin only (contain sensitive customer data)
  public query ({ caller }) func getAllCustomOrders() : async [CustomOrder] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    customOrders.values().toArray().sort();
  };

  public query ({ caller }) func getAllStoreOrders() : async [StoreOrder] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    storeOrders.values().toArray().sort();
  };

  public query ({ caller }) func getAllUnifiedOrders() : async [UnifiedOrder] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };

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
          timestamp = order.timestamp;
        };
      }
    );

    unifiedCustomOrders.concat(unifiedStoreOrders);
  };

  // Get all payment confirmations - admin only
  public query ({ caller }) func getAllPaymentConfirmations() : async [PaymentConfirmation] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view payment confirmations");
    };
    paymentConfirmations.values().toArray().sort();
  };

  // Password reset functions - open to any caller (no auth required to request reset)
  public shared ({ caller }) func requestPasswordReset(email : Text) : async () {
    let normalizedEmail = email.toLower();
    if (isAdminEmail(normalizedEmail)) {
      passwordResetRequests.add(normalizedEmail, Time.now());
    } else {
      switch (emailToPrincipal.get(normalizedEmail)) {
        case (null) {
          Runtime.trap("Email not registered. Please check your email or register.");
        };
        case (?_) {
          passwordResetRequests.add(normalizedEmail, Time.now());
        };
      };
    };
  };

  public query func hasPendingPasswordReset(email : Text) : async Bool {
    passwordResetRequests.containsKey(email.toLower());
  };

  // Complete password reset - admin only (admin confirms the reset is done)
  public shared ({ caller }) func completePasswordReset(email : Text) : async () {
    checkAdminPermission(caller);
    let normalizedEmail = email.toLower();
    if (not passwordResetRequests.containsKey(normalizedEmail)) {
      Runtime.trap("No pending password reset found for this email");
    };
    passwordResetRequests.remove(normalizedEmail);
  };
};
