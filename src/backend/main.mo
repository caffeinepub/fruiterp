import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Option "mo:core/Option";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ===== Types =====

  public type UserProfile = {
    username : Text;
    role : Text;
  };

  public type SessionToken = {
    token : Text;
    username : Text;
    role : Text;
  };

  public type StaffAccount = {
    name : Text;
    username : Text;
  };

  public type CustomerAccount = {
    name : Text;
    username : Text;
  };

  public type Product = {
    id : Nat;
    name : Text;
    category : Text;
    unit : Text;
    pricePerUnit : Float;
    stockQuantity : Nat;
    lowStockThreshold : Nat;
  };

  public type Customer = {
    id : Nat;
    name : Text;
    phone : Text;
    email : Text;
    address : Text;
  };

  public type Supplier = {
    id : Nat;
    name : Text;
    contactName : Text;
    phone : Text;
    email : Text;
  };

  public type OrderItem = {
    productId : Nat;
    productName : Text;
    quantity : Nat;
    unitPrice : Float;
  };

  public type SalesOrder = {
    id : Nat;
    customerId : Nat;
    customerName : Text;
    items : [OrderItem];
    totalAmount : Float;
    status : Text;
    createdAt : Int;
  };

  public type PurchaseOrder = {
    id : Nat;
    supplierId : Nat;
    supplierName : Text;
    items : [OrderItem];
    totalAmount : Float;
    status : Text;
    createdAt : Int;
  };

  public type DashboardStats = {
    totalProducts : Nat;
    totalStockValue : Float;
    totalSalesRevenue : Float;
    pendingSalesCount : Nat;
    lowStockProducts : [Product];
  };

  public type PackingMaster = {
    id : Nat;
    packingName : Text;
    itemName : Text;
    packingType : Text; // "box", "crate", "loose"
    standardWeight : Float;
    tareWeight : Float; // 0 if not set
    marka : Text;
    size : Text; // "small", "medium", "large", "none"
    unitType : Text; // "box", "kg", "both"
    // Crate-specific (only when packingType = "crate")
    isReturnable : Bool;
    crateCategory : Text; // "big", "small", ""
    crateCode : Text;
  };

  // ===== State =====

  let userProfiles = Map.empty<Principal, UserProfile>();
  let sessions = Map.empty<Text, (Principal, Text, Text)>();

  // credentials: username -> (password, role)
  let credentials = Map.empty<Text, (Text, Text)>();

  // Staff accounts: username -> (name, password)
  let staffAccounts = Map.empty<Text, (Text, Text)>();

  // Customer login accounts: username -> (name, password)
  let customerLoginAccounts = Map.empty<Text, (Text, Text)>();

  // Data stores
  let products = Map.empty<Nat, Product>();
  var nextProductId : Nat = 1;

  let customers = Map.empty<Nat, Customer>();
  var nextCustomerId : Nat = 1;

  let suppliers = Map.empty<Nat, Supplier>();
  var nextSupplierId : Nat = 1;

  let salesOrders = Map.empty<Nat, SalesOrder>();
  var nextSalesOrderId : Nat = 1;

  let purchaseOrders = Map.empty<Nat, PurchaseOrder>();
  var nextPurchaseOrderId : Nat = 1;

  let packings = Map.empty<Nat, PackingMaster>();
  var nextPackingId : Nat = 1;

  // Only admin is hardcoded - all other accounts created by admin
  credentials.add("admin", ("0000", "admin"));

  // ===== Helper Functions =====

  func generateToken(username : Text) : Text {
    username # "-" # Time.now().toText();
  };

  func getSessionRole(token : Text) : ?Text {
    switch (sessions.get(token)) {
      case (null) { null };
      case (?(_, _, role)) { ?role };
    }
  };

  func hasAdminRole(token : Text) : Bool {
    switch (getSessionRole(token)) {
      case (?"admin") { true };
      case (_) { false };
    }
  };

  func hasStaffOrAdminRole(token : Text) : Bool {
    switch (getSessionRole(token)) {
      case (?"admin") { true };
      case (?"staff") { true };
      case (_) { false };
    }
  };

  // ===== User Profile Functions =====

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ===== Authentication =====

  public func login(username : Text, password : Text) : async ?SessionToken {
    // Check main credentials (admin)
    switch (credentials.get(username)) {
      case (?(storedPassword, role)) {
        if (password == storedPassword) {
          let token = generateToken(username);
          sessions.add(token, (Principal.fromText("2vxsx-fae"), username, role));
          return ?{ token = token; username = username; role = role };
        };
      };
      case (null) {};
    };
    // Check staff accounts
    switch (staffAccounts.get(username)) {
      case (?(name, storedPassword)) {
        if (password == storedPassword) {
          let token = generateToken(username);
          sessions.add(token, (Principal.fromText("2vxsx-fae"), username, "staff"));
          return ?{ token = token; username = username; role = "staff" };
        };
      };
      case (null) {};
    };
    // Check customer login accounts
    switch (customerLoginAccounts.get(username)) {
      case (?(name, storedPassword)) {
        if (password == storedPassword) {
          let token = generateToken(username);
          sessions.add(token, (Principal.fromText("2vxsx-fae"), username, "customer"));
          return ?{ token = token; username = username; role = "customer" };
        };
      };
      case (null) {};
    };
    null;
  };

  // ===== Staff Account Management (Admin only) =====

  public func addStaff(token : Text, name : Text, username : Text, password : Text) : async Bool {
    if (not hasAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin can manage staff");
    };
    if (staffAccounts.get(username) != null or credentials.get(username) != null or customerLoginAccounts.get(username) != null) {
      return false; // Username already exists
    };
    staffAccounts.add(username, (name, password));
    true;
  };

  public func removeStaff(token : Text, username : Text) : async Bool {
    if (not hasAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin can manage staff");
    };
    switch (staffAccounts.get(username)) {
      case (null) { false };
      case (?_) {
        staffAccounts.remove(username);
        true;
      };
    };
  };

  public query func listStaff(token : Text) : async [StaffAccount] {
    if (not hasAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin can list staff");
    };
    staffAccounts.entries().toArray().map(func((username, (name, _))) : StaffAccount {
      { name = name; username = username }
    });
  };

  // ===== Customer Login Account Management (Admin only) =====

  public func addCustomerLogin(token : Text, name : Text, username : Text, password : Text) : async Bool {
    if (not hasAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin can manage customer accounts");
    };
    if (customerLoginAccounts.get(username) != null or credentials.get(username) != null or staffAccounts.get(username) != null) {
      return false; // Username already exists
    };
    customerLoginAccounts.add(username, (name, password));
    true;
  };

  public func removeCustomerLogin(token : Text, username : Text) : async Bool {
    if (not hasAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin can manage customer accounts");
    };
    switch (customerLoginAccounts.get(username)) {
      case (null) { false };
      case (?_) {
        customerLoginAccounts.remove(username);
        true;
      };
    };
  };

  public query func listCustomerLogins(token : Text) : async [CustomerAccount] {
    if (not hasAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin can list customer accounts");
    };
    customerLoginAccounts.entries().toArray().map(func((username, (name, _))) : CustomerAccount {
      { name = name; username = username }
    });
  };

  // ===== Packing Master (Admin can CRUD, Staff can view) =====

  public func createPacking(
    token : Text,
    packingName : Text,
    itemName : Text,
    packingType : Text,
    standardWeight : Float,
    tareWeight : Float,
    marka : Text,
    size : Text,
    unitType : Text,
    isReturnable : Bool,
    crateCategory : Text,
    crateCode : Text,
  ) : async Nat {
    if (not hasAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin can manage packing master");
    };
    let id = nextPackingId;
    nextPackingId += 1;
    let packing : PackingMaster = {
      id = id;
      packingName = packingName;
      itemName = itemName;
      packingType = packingType;
      standardWeight = standardWeight;
      tareWeight = tareWeight;
      marka = marka;
      size = size;
      unitType = unitType;
      isReturnable = isReturnable;
      crateCategory = crateCategory;
      crateCode = crateCode;
    };
    packings.add(id, packing);
    id;
  };

  public query func listPackings(token : Text) : async [PackingMaster] {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can view packing master");
    };
    packings.values().toArray();
  };

  public query func getPacking(token : Text, packingId : Nat) : async ?PackingMaster {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can view packing master");
    };
    packings.get(packingId);
  };

  public func deletePacking(token : Text, packingId : Nat) : async Bool {
    if (not hasAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin can delete packing entries");
    };
    switch (packings.get(packingId)) {
      case (null) { false };
      case (?_) {
        packings.remove(packingId);
        true;
      };
    };
  };

  // ===== Products =====

  public func createProduct(
    token : Text,
    name : Text,
    category : Text,
    unit : Text,
    pricePerUnit : Float,
    stockQuantity : Nat,
    lowStockThreshold : Nat,
  ) : async Nat {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can create products");
    };
    let id = nextProductId;
    nextProductId += 1;
    let product : Product = {
      id = id; name = name; category = category; unit = unit;
      pricePerUnit = pricePerUnit; stockQuantity = stockQuantity;
      lowStockThreshold = lowStockThreshold;
    };
    products.add(id, product);
    id;
  };

  public query func getProduct(productId : Nat) : async ?Product {
    products.get(productId);
  };

  public query func listProducts() : async [Product] {
    products.values().toArray();
  };

  public func updateProduct(
    token : Text, productId : Nat, name : Text, category : Text,
    unit : Text, pricePerUnit : Float, stockQuantity : Nat, lowStockThreshold : Nat,
  ) : async Bool {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can update products");
    };
    switch (products.get(productId)) {
      case (null) { false };
      case (?_) {
        products.add(productId, { id = productId; name = name; category = category;
          unit = unit; pricePerUnit = pricePerUnit; stockQuantity = stockQuantity;
          lowStockThreshold = lowStockThreshold });
        true;
      };
    };
  };

  public func deleteProduct(token : Text, productId : Nat) : async Bool {
    if (not hasAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin can delete products");
    };
    switch (products.get(productId)) {
      case (null) { false };
      case (?_) { products.remove(productId); true };
    };
  };

  // ===== Customers =====

  public func createCustomer(token : Text, name : Text, phone : Text, email : Text, address : Text) : async Nat {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can create customers");
    };
    let id = nextCustomerId;
    nextCustomerId += 1;
    customers.add(id, { id = id; name = name; phone = phone; email = email; address = address });
    id;
  };

  public query func getCustomer(token : Text, customerId : Nat) : async ?Customer {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can view customers");
    };
    customers.get(customerId);
  };

  public query func listCustomers(token : Text) : async [Customer] {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can list customers");
    };
    customers.values().toArray();
  };

  public func updateCustomer(token : Text, customerId : Nat, name : Text, phone : Text, email : Text, address : Text) : async Bool {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can update customers");
    };
    switch (customers.get(customerId)) {
      case (null) { false };
      case (?_) {
        customers.add(customerId, { id = customerId; name = name; phone = phone; email = email; address = address });
        true;
      };
    };
  };

  public func deleteCustomer(token : Text, customerId : Nat) : async Bool {
    if (not hasAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin can delete customers");
    };
    switch (customers.get(customerId)) {
      case (null) { false };
      case (?_) { customers.remove(customerId); true };
    };
  };

  // ===== Suppliers =====

  public func createSupplier(token : Text, name : Text, contactName : Text, phone : Text, email : Text) : async Nat {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can create suppliers");
    };
    let id = nextSupplierId;
    nextSupplierId += 1;
    suppliers.add(id, { id = id; name = name; contactName = contactName; phone = phone; email = email });
    id;
  };

  public query func getSupplier(token : Text, supplierId : Nat) : async ?Supplier {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can view suppliers");
    };
    suppliers.get(supplierId);
  };

  public query func listSuppliers(token : Text) : async [Supplier] {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can list suppliers");
    };
    suppliers.values().toArray();
  };

  public func updateSupplier(token : Text, supplierId : Nat, name : Text, contactName : Text, phone : Text, email : Text) : async Bool {
    if (not hasStaffOrAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin or staff can update suppliers");
    };
    switch (suppliers.get(supplierId)) {
      case (null) { false };
      case (?_) {
        suppliers.add(supplierId, { id = supplierId; name = name; contactName = contactName; phone = phone; email = email });
        true;
      };
    };
  };

  public func deleteSupplier(token : Text, supplierId : Nat) : async Bool {
    if (not hasAdminRole(token)) {
      Runtime.trap("Unauthorized: Only admin can delete suppliers");
    };
    switch (suppliers.get(supplierId)) {
      case (null) { false };
      case (?_) { suppliers.remove(supplierId); true };
    };
  };

  // ===== Sales Orders =====

  public func createSalesOrder(token : Text, customerId : Nat, customerName : Text, items : [OrderItem]) : async Nat {
    switch (getSessionRole(token)) {
      case (null) { Runtime.trap("Unauthorized: Must be logged in") };
      case (?_) {
        let id = nextSalesOrderId;
        nextSalesOrderId += 1;
        var total : Float = 0.0;
        for (item in items.values()) { total += item.quantity.toFloat() * item.unitPrice };
        salesOrders.add(id, { id = id; customerId = customerId; customerName = customerName;
          items = items; totalAmount = total; status = "pending"; createdAt = Time.now() });
        id;
      };
    };
  };

  public query func getSalesOrder(token : Text, orderId : Nat) : async ?SalesOrder {
    if (not hasStaffOrAdminRole(token)) { Runtime.trap("Unauthorized") };
    salesOrders.get(orderId);
  };

  public query func listSalesOrders(token : Text) : async [SalesOrder] {
    if (not hasStaffOrAdminRole(token)) { Runtime.trap("Unauthorized") };
    salesOrders.values().toArray();
  };

  public func updateSalesOrderStatus(token : Text, orderId : Nat, newStatus : Text) : async Bool {
    if (not hasStaffOrAdminRole(token)) { Runtime.trap("Unauthorized") };
    switch (salesOrders.get(orderId)) {
      case (null) { false };
      case (?order) {
        salesOrders.add(orderId, { id = order.id; customerId = order.customerId;
          customerName = order.customerName; items = order.items;
          totalAmount = order.totalAmount; status = newStatus; createdAt = order.createdAt });
        if (newStatus == "completed") {
          for (item in order.items.values()) {
            switch (products.get(item.productId)) {
              case (null) {};
              case (?product) {
                let newStock = if (product.stockQuantity >= item.quantity) product.stockQuantity - item.quantity else 0;
                products.add(product.id, { id = product.id; name = product.name; category = product.category;
                  unit = product.unit; pricePerUnit = product.pricePerUnit; stockQuantity = newStock;
                  lowStockThreshold = product.lowStockThreshold });
              };
            };
          };
        };
        true;
      };
    };
  };

  // ===== Purchase Orders =====

  public func createPurchaseOrder(token : Text, supplierId : Nat, supplierName : Text, items : [OrderItem]) : async Nat {
    if (not hasStaffOrAdminRole(token)) { Runtime.trap("Unauthorized") };
    let id = nextPurchaseOrderId;
    nextPurchaseOrderId += 1;
    var total : Float = 0.0;
    for (item in items.values()) { total += item.quantity.toFloat() * item.unitPrice };
    purchaseOrders.add(id, { id = id; supplierId = supplierId; supplierName = supplierName;
      items = items; totalAmount = total; status = "pending"; createdAt = Time.now() });
    id;
  };

  public query func getPurchaseOrder(token : Text, orderId : Nat) : async ?PurchaseOrder {
    if (not hasStaffOrAdminRole(token)) { Runtime.trap("Unauthorized") };
    purchaseOrders.get(orderId);
  };

  public query func listPurchaseOrders(token : Text) : async [PurchaseOrder] {
    if (not hasStaffOrAdminRole(token)) { Runtime.trap("Unauthorized") };
    purchaseOrders.values().toArray();
  };

  public func updatePurchaseOrderStatus(token : Text, orderId : Nat, newStatus : Text) : async Bool {
    if (not hasStaffOrAdminRole(token)) { Runtime.trap("Unauthorized") };
    switch (purchaseOrders.get(orderId)) {
      case (null) { false };
      case (?order) {
        purchaseOrders.add(orderId, { id = order.id; supplierId = order.supplierId;
          supplierName = order.supplierName; items = order.items;
          totalAmount = order.totalAmount; status = newStatus; createdAt = order.createdAt });
        if (newStatus == "received") {
          for (item in order.items.values()) {
            switch (products.get(item.productId)) {
              case (null) {};
              case (?product) {
                products.add(product.id, { id = product.id; name = product.name; category = product.category;
                  unit = product.unit; pricePerUnit = product.pricePerUnit;
                  stockQuantity = product.stockQuantity + item.quantity;
                  lowStockThreshold = product.lowStockThreshold });
              };
            };
          };
        };
        true;
      };
    };
  };

  // ===== Dashboard =====

  public query func getDashboardStats(token : Text) : async DashboardStats {
    if (not hasStaffOrAdminRole(token)) { Runtime.trap("Unauthorized") };
    var totalProducts : Nat = 0;
    var totalStockValue : Float = 0.0;
    var lowStock : [Product] = [];
    for (product in products.values()) {
      totalProducts += 1;
      totalStockValue += product.stockQuantity.toFloat() * product.pricePerUnit;
      if (product.stockQuantity <= product.lowStockThreshold) {
        lowStock := lowStock.concat([product]);
      };
    };
    var totalSalesRevenue : Float = 0.0;
    var pendingSalesCount : Nat = 0;
    for (order in salesOrders.values()) {
      if (order.status == "completed") { totalSalesRevenue += order.totalAmount };
      if (order.status == "pending") { pendingSalesCount += 1 };
    };
    { totalProducts = totalProducts; totalStockValue = totalStockValue;
      totalSalesRevenue = totalSalesRevenue; pendingSalesCount = pendingSalesCount;
      lowStockProducts = lowStock };
  };

  // Force-reset admin credentials on every upgrade to plain text password
  system func postupgrade() {
    credentials.remove("admin");
    credentials.add("admin", ("0000", "admin"));
  };
};
