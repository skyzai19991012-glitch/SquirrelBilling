export type RouterItem = {
  id: string;
  name: string;
  host: string;
  apiPort: number;
  username: string;
  ssl: boolean;
  active: boolean;
  model?: string;
  version?: string;
  identity?: string;
  createdAt: string;
};

export type InternetPackage = {
  id: string;
  name: string;
  downloadMbps: number;
  uploadMbps: number;
  price: number;
  mikrotikProfile: string;
  active: boolean;
  createdAt: string;
};

export type PppAccount = {
  id: string;
  username: string;
  password: string;
  profile: string;
  service: string;
  localIp?: string;
  remoteIp?: string;
  disabled: boolean;
};

export type CustomerItem = {
  id: string;
  customerNo: string;
  fullName: string;
  phone: string;
  cnic?: string;
  address?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'TERMINATED';
  dueDate?: string;
  router: {
    id: string;
    name: string;
    host: string;
  };
  package: InternetPackage;
  pppAccount?: PppAccount;
};

export type InvoiceItem = {
  id: string;
  invoiceNo?: string;
  customerId: string;
  amount: number;
  paidAmount?: number;
  balance?: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  customer?: CustomerItem;
  createdAt: string;
};

export type PaymentItem = {
  id: string;
  customerId: string;
  invoiceId?: string;
  amount: number;
  method: string;
  referenceNo?: string;
  notes?: string;
  paidAt?: string;
  customer?: CustomerItem;
  invoice?: InvoiceItem;
  createdAt: string;
};
export type OltDevice = {
  id: string;
  name: string;
  vendor: 'HUAWEI' | 'ZTE' | 'VSOL' | 'CDATA' | 'BDCOM' | 'OTHER';
  host: string;
  port: number;
  username: string;
  active: boolean;
  createdAt: string;
};

export type OnuDevice = {
  id: string;
  oltId: string;
  serialNumber: string;
  ponPort: string;
  onuId?: string;
  vlan?: number;
  rxPower?: number;
  txPower?: number;
  distance?: number;
  online: boolean;
  customerName?: string;
  customerPhone?: string;
  olt?: OltDevice;
  createdAt: string;
};