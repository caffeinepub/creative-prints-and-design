import Map "mo:core/Map";
import Storage "blob-storage/Storage";

module {
  // Old (legacy) StoreOrder type using ExternalBlob for paymentProof
  type LegacyStoreOrder = {
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

  // Old actor type with passwordResetRequests
  type OldActor = {
    storeOrders : Map.Map<Text, LegacyStoreOrder>;
    passwordResetRequests : Map.Map<Text, Int>;
  };

  // New StoreOrder type with status field
  type NewStoreOrder = {
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

  // New actor type without passwordResetRequests and with new StoreOrder type
  type NewActor = {
    storeOrders : Map.Map<Text, NewStoreOrder>;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    let newStoreOrders = old.storeOrders.map<Text, LegacyStoreOrder, NewStoreOrder>(
      func(_id, legacyOrder) {
        { legacyOrder with status = "pending" };
      }
    );
    { storeOrders = newStoreOrders };
  };
};
