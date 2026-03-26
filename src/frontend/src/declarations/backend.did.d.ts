import type { Principal } from '@icp-sdk/core/principal';
import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';

export type UserRole = { 'admin' : null } | { 'user' : null } | { 'guest' : null };
export interface OrderItem {
  'productId' : bigint,
  'productName' : string,
  'quantity' : bigint,
  'unitPrice' : number,
}
export interface UserProfile { 'username' : string, 'role' : string }
export interface Customer {
  'id' : bigint,
  'name' : string,
  'email' : string,
  'address' : string,
  'phone' : string,
}
export interface Product {
  'id' : bigint,
  'stockQuantity' : bigint,
  'lowStockThreshold' : bigint,
  'name' : string,
  'unit' : string,
  'pricePerUnit' : number,
  'category' : string,
}
export interface DashboardStats {
  'totalProducts' : bigint,
  'totalStockValue' : number,
  'pendingSalesCount' : bigint,
  'totalSalesRevenue' : number,
  'lowStockProducts' : Array<Product>,
}
export interface PurchaseOrder {
  'id' : bigint,
  'status' : string,
  'supplierName' : string,
  'createdAt' : bigint,
  'totalAmount' : number,
  'items' : Array<OrderItem>,
  'supplierId' : bigint,
}
export interface SalesOrder {
  'id' : bigint,
  'customerName' : string,
  'status' : string,
  'createdAt' : bigint,
  'totalAmount' : number,
  'customerId' : bigint,
  'items' : Array<OrderItem>,
}
export interface Supplier {
  'id' : bigint,
  'contactName' : string,
  'name' : string,
  'email' : string,
  'phone' : string,
}
export interface SessionToken {
  'token' : string,
  'username' : string,
  'role' : string,
}
export interface StaffAccount { 'name' : string, 'username' : string }
export interface CustomerAccount { 'name' : string, 'username' : string }
export interface PackingMaster {
  'id' : bigint,
  'packingName' : string,
  'itemName' : string,
  'packingType' : string,
  'standardWeight' : number,
  'tareWeight' : number,
  'marka' : string,
  'size' : string,
  'unitType' : string,
  'isReturnable' : boolean,
  'crateCategory' : string,
  'crateCode' : string,
}
export interface _SERVICE {
  '_initializeAccessControlWithSecret' : ActorMethod<[string], undefined>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'createCustomer' : ActorMethod<[string, string, string, string, string], bigint>,
  'createProduct' : ActorMethod<[string, string, string, string, number, bigint, bigint], bigint>,
  'createPurchaseOrder' : ActorMethod<[string, bigint, string, Array<OrderItem>], bigint>,
  'createSalesOrder' : ActorMethod<[string, bigint, string, Array<OrderItem>], bigint>,
  'createSupplier' : ActorMethod<[string, string, string, string, string], bigint>,
  'deleteCustomer' : ActorMethod<[string, bigint], boolean>,
  'deleteProduct' : ActorMethod<[string, bigint], boolean>,
  'deleteSupplier' : ActorMethod<[string, bigint], boolean>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getCustomer' : ActorMethod<[string, bigint], [] | [Customer]>,
  'getDashboardStats' : ActorMethod<[string], DashboardStats>,
  'getProduct' : ActorMethod<[bigint], [] | [Product]>,
  'getPurchaseOrder' : ActorMethod<[string, bigint], [] | [PurchaseOrder]>,
  'getSalesOrder' : ActorMethod<[string, bigint], [] | [SalesOrder]>,
  'getSupplier' : ActorMethod<[string, bigint], [] | [Supplier]>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'listCustomers' : ActorMethod<[string], Array<Customer>>,
  'listProducts' : ActorMethod<[], Array<Product>>,
  'listPurchaseOrders' : ActorMethod<[string], Array<PurchaseOrder>>,
  'listSalesOrders' : ActorMethod<[string], Array<SalesOrder>>,
  'listSuppliers' : ActorMethod<[string], Array<Supplier>>,
  'login' : ActorMethod<[string, string], [] | [SessionToken]>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'updateCustomer' : ActorMethod<[string, bigint, string, string, string, string], boolean>,
  'updateProduct' : ActorMethod<[string, bigint, string, string, string, number, bigint, bigint], boolean>,
  'updatePurchaseOrderStatus' : ActorMethod<[string, bigint, string], boolean>,
  'updateSalesOrderStatus' : ActorMethod<[string, bigint, string], boolean>,
  'updateSupplier' : ActorMethod<[string, bigint, string, string, string, string], boolean>,
  'addStaff' : ActorMethod<[string, string, string, string], boolean>,
  'removeStaff' : ActorMethod<[string, string], boolean>,
  'listStaff' : ActorMethod<[string], Array<StaffAccount>>,
  'addCustomerLogin' : ActorMethod<[string, string, string, string], boolean>,
  'removeCustomerLogin' : ActorMethod<[string, string], boolean>,
  'listCustomerLogins' : ActorMethod<[string], Array<CustomerAccount>>,
  'createPacking' : ActorMethod<[string, string, string, string, number, number, string, string, string, boolean, string, string], bigint>,
  'listPackings' : ActorMethod<[string], Array<PackingMaster>>,
  'getPacking' : ActorMethod<[string, bigint], [] | [PackingMaster]>,
  'deletePacking' : ActorMethod<[string, bigint], boolean>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
