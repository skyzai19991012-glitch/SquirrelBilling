export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'OPERATOR'
  | 'TECHNICIAN'
  | 'READONLY';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';

export type CustomerStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'TERMINATED';

export type InvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PAID'
  | 'PARTIAL'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type PaymentMethod =
  | 'CASH'
  | 'JAZZCASH'
  | 'EASYPAISA'
  | 'BANK'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'OTHER';

export type DeviceConnectionStatus = 'NOT_TESTED' | 'CONNECTED' | 'FAILED';

export type OltVendor =
  | 'HUAWEI'
  | 'VSOL'
  | 'ZTE'
  | 'CDATA'
  | 'BDCOM'
  | 'FIBERHOME'
  | 'OTHER';

export type AuthUser = {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
  tenantId?: string | null;
  tenant?: {
    id: string;
    name: string;
    companyName?: string | null;
    status?: TenantStatus;
    planName?: string;
    subscriptionEnd?: string | null;
  } | null;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type RouterItem = {
  id: string;
  name: string;
  type?: string;
  host: string;
  apiPort: number;
  username?: string;
  password?: string;
  ssl: boolean;
  active: boolean;
  connectionStatus?: DeviceConnectionStatus;
  lastTestedAt?: string | null;
  lastError?: string | null;
  _count?: {
    customers?: number;
    pppAccounts?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type InternetPackage = {
  id: string;
  name: string;
  downloadMbps: number;
  uploadMbps: number;
  price: number;
  mikrotikProfile: string;
  active: boolean;
  _count?: {
    customers?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type CustomerItem = {
  id: string;
  customerNo: string;
  fullName: string;
  fatherName?: string | null;
  cnic?: string | null;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  gpsLocation?: string | null;
  status: CustomerStatus;
  routerId: string;
  packageId: string;
  dueDate?: string | null;
  router?: RouterItem;
  package?: InternetPackage;
  pppAccount?: {
    id: string;
    username: string;
    password?: string;
    profile: string;
    disabled: boolean;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type InvoiceItem = {
  id: string;
  invoiceNo: string;
  customerId: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  customer?: CustomerItem;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentItem = {
  id: string;
  customerId: string;
  invoiceId?: string | null;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
  customer?: CustomerItem;
  invoice?: InvoiceItem | null;
};

export type BillingSummary = {
  totalInvoices?: number;
  pendingInvoices?: number;
  paidInvoices?: number;
  overdueInvoices?: number;
  totalBilled?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  todayCollection?: number;
  monthlyCollection?: number;
  outstanding?: number;
};

export type OltItem = {
  id: string;
  name: string;
  vendor: OltVendor;
  host: string;
  port: number;
  username: string;
  active: boolean;
  connectionStatus?: DeviceConnectionStatus;
  lastTestedAt?: string | null;
  lastError?: string | null;
  _count?: {
    onus?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type OnuItem = {
  id: string;
  oltId: string;
  serialNumber: string;
  ponPort: string;
  onuId?: string | null;
  vlan?: number | null;
  rxPower?: number | null;
  txPower?: number | null;
  distance?: number | null;
  online: boolean;
  customerName?: string | null;
  customerPhone?: string | null;
  olt?: OltItem;
  createdAt?: string;
  updatedAt?: string;
};

export type TenantItem = {
  id: string;
  name: string;
  companyName?: string | null;
  ownerName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: TenantStatus;
  planName: string;
  monthlyPrice: number;
  maxCustomers: number;
  maxRouters: number;
  maxOlts: number;
  subscriptionStart: string;
  subscriptionEnd?: string | null;
  users?: {
    id: string;
    fullName: string;
    username: string;
    role: string;
    active: boolean;
  }[];
  _count?: {
    customers?: number;
    routers?: number;
    olts?: number;
    invoices?: number;
    payments?: number;
  };
  createdAt: string;
};

export type DashboardSummary = {
  customers?: {
    total: number;
    active: number;
    suspended: number;
    expired: number;
  };
  routers?: {
    total: number;
    active: number;
  };
  packages?: {
    total: number;
  };
  billing?: {
    pendingInvoices: number;
    todayCollection: number;
    monthlyCollection: number;
    outstanding: number;
  };
  olt?: {
    totalOlts: number;
    activeOlts: number;
    totalOnus: number;
    onlineOnus: number;
  };
};