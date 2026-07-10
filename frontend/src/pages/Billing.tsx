import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Edit3,
  FileText,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { api } from '../api/client';

type CustomerItem = {
  id: string;
  customerNo: string;
  fullName: string;
  phone: string;
  package?: {
    id: string;
    name: string;
    price: number;
  };
};

type InvoiceItem = {
  id: string;
  invoiceNo: string;
  customerId: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  issueDate: string;
  dueDate: string;
  customer?: CustomerItem;
};

type PaymentItem = {
  id: string;
  customerId: string;
  invoiceId?: string | null;
  amount: number;
  method: 'CASH' | 'JAZZCASH' | 'EASYPAISA' | 'BANK' | 'CARD' | 'OTHER';
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
  customer?: CustomerItem;
  invoice?: InvoiceItem | null;
};

type BillingSummary = {
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

const emptyInvoiceForm = {
  customerId: '',
  amount: 0,
  dueDate: '',
  status: 'PENDING',
};

const emptyPaymentForm = {
  customerId: '',
  invoiceId: '',
  amount: 0,
  method: 'CASH',
  reference: '',
  notes: '',
};

function money(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

function badgeClass(status?: string) {
  if (status === 'PAID') return 'badge green';
  if (status === 'PARTIAL' || status === 'PENDING') return 'badge orange';
  if (status === 'OVERDUE' || status === 'CANCELLED') return 'badge red';
  return 'badge orange';
}

export default function Billing() {
  const queryClient = useQueryClient();

  const [invoiceEditingId, setInvoiceEditingId] = useState<string | null>(null);
  const [paymentEditingId, setPaymentEditingId] = useState<string | null>(null);

  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  const { data: customers = [] } = useQuery<CustomerItem[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data;
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<InvoiceItem[]>({
    queryKey: ['billing-invoices'],
    queryFn: async () => {
      const res = await api.get('/billing/invoices');
      return res.data;
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentItem[]>({
    queryKey: ['billing-payments'],
    queryFn: async () => {
      const res = await api.get('/billing/payments');
      return res.data;
    },
  });

  const { data: summary } = useQuery<BillingSummary>({
    queryKey: ['billing-summary'],
    queryFn: async () => {
      const res = await api.get('/billing/summary');
      return res.data;
    },
  });

  const saveInvoice = useMutation({
    mutationFn: async () => {
      const body = {
        customerId: invoiceForm.customerId,
        amount: Number(invoiceForm.amount),
        dueDate: invoiceForm.dueDate || undefined,
        status: invoiceForm.status,
      };

      if (invoiceEditingId) {
        const res = await api.patch(`/billing/invoices/${invoiceEditingId}`, body);
        return res.data;
      }

      const res = await api.post('/billing/invoices', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-payments'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setInvoiceEditingId(null);
      setInvoiceForm(emptyInvoiceForm);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Invoice save failed');
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/billing/invoices/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-payments'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Invoice delete failed');
    },
  });

  const savePayment = useMutation({
    mutationFn: async () => {
      const body = {
        customerId: paymentForm.customerId,
        invoiceId: paymentForm.invoiceId || undefined,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
      };

      if (paymentEditingId) {
        const res = await api.patch(`/billing/payments/${paymentEditingId}`, body);
        return res.data;
      }

      const res = await api.post('/billing/payments', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-payments'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setPaymentEditingId(null);
      setPaymentForm(emptyPaymentForm);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Payment save failed');
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/billing/payments/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-payments'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Payment delete failed');
    },
  });

  const runExpiry = useMutation({
    mutationFn: async () => {
      const res = await api.post('/billing/run-expiry');
      return res.data;
    },
    onSuccess: (data) => {
      alert(data?.message || 'Expiry check completed');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Expiry run failed');
    },
  });

  const startInvoiceEdit = (invoice: InvoiceItem) => {
    setInvoiceEditingId(invoice.id);
    setInvoiceForm({
      customerId: invoice.customerId,
      amount: Number(invoice.amount || 0),
      dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : '',
      status: invoice.status || 'PENDING',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startPaymentEdit = (payment: PaymentItem) => {
    setPaymentEditingId(payment.id);
    setPaymentForm({
      customerId: payment.customerId,
      invoiceId: payment.invoiceId || '',
      amount: Number(payment.amount || 0),
      method: payment.method || 'CASH',
      reference: payment.reference || '',
      notes: payment.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelInvoiceEdit = () => {
    setInvoiceEditingId(null);
    setInvoiceForm(emptyInvoiceForm);
  };

  const cancelPaymentEdit = () => {
    setPaymentEditingId(null);
    setPaymentForm(emptyPaymentForm);
  };

  const submitInvoice = (event: FormEvent) => {
    event.preventDefault();
    saveInvoice.mutate();
  };

  const submitPayment = (event: FormEvent) => {
    event.preventDefault();
    savePayment.mutate();
  };

  return (
    <div className="page">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Revenue Desk</p>
          <h1>Billing & Payments</h1>
          <p>
            Create invoices, record payments, edit billing entries and manage customer
            balances.
          </p>
        </div>

        <div className="hero-signal">
          <CreditCard size={44} />
          <span>BILL</span>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={23} />
          </div>
          <div>
            <p>Pending Invoices</p>
            <h3>{summary?.pendingInvoices || 0}</h3>
            <span>awaiting payment</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ReceiptText size={23} />
          </div>
          <div>
            <p>Monthly Collection</p>
            <h3>{money(summary?.monthlyCollection || summary?.totalPaid || 0)}</h3>
            <span>received amount</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CreditCard size={23} />
          </div>
          <div>
            <p>Outstanding</p>
            <h3>{money(summary?.outstanding || summary?.totalOutstanding || 0)}</h3>
            <span>customer balance</span>
          </div>
        </div>
      </section>

      <section className="two-grid">
        <div className="glass-panel form-panel">
          <div className="panel-header">
            <div>
              <h2>{invoiceEditingId ? 'Edit Invoice' : 'Create Invoice'}</h2>
              <p className="muted">
                Select customer, amount and due date.
              </p>
            </div>

            {invoiceEditingId && (
              <button className="ghost-btn danger-btn" onClick={cancelInvoiceEdit}>
                <X size={16} />
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={submitInvoice}>
            <div className="form-grid">
              <label>
                Customer
                <select
                  value={invoiceForm.customerId}
                  onChange={(e) => {
                    const customer = customers.find((item) => item.id === e.target.value);
                    setInvoiceForm({
                      ...invoiceForm,
                      customerId: e.target.value,
                      amount: customer?.package?.price || invoiceForm.amount,
                    });
                  }}
                  disabled={!!invoiceEditingId}
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName} - {customer.customerNo}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Amount
                <input
                  type="number"
                  value={invoiceForm.amount}
                  onChange={(e) =>
                    setInvoiceForm({
                      ...invoiceForm,
                      amount: Number(e.target.value),
                    })
                  }
                  required
                />
              </label>

              <label>
                Due Date
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
                  }
                  required
                />
              </label>

              {invoiceEditingId && (
                <label>
                  Status
                  <select
                    value={invoiceForm.status}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, status: e.target.value })
                    }
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>
              )}
            </div>

            <button className="primary-btn small-btn" disabled={saveInvoice.isPending}>
              {invoiceEditingId ? <Save size={18} /> : <Plus size={18} />}
              {saveInvoice.isPending
                ? 'Saving...'
                : invoiceEditingId
                  ? 'Update Invoice'
                  : 'Create Invoice'}
            </button>
          </form>
        </div>

        <div className="glass-panel form-panel">
          <div className="panel-header">
            <div>
              <h2>{paymentEditingId ? 'Edit Payment' : 'Record Payment'}</h2>
              <p className="muted">
                Record cash, JazzCash, Easypaisa, bank or card payments.
              </p>
            </div>

            {paymentEditingId && (
              <button className="ghost-btn danger-btn" onClick={cancelPaymentEdit}>
                <X size={16} />
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={submitPayment}>
            <div className="form-grid">
              <label>
                Invoice
                <select
                  value={paymentForm.invoiceId}
                  disabled={!!paymentEditingId}
                  onChange={(e) => {
                    const invoice = invoices.find((item) => item.id === e.target.value);

                    setPaymentForm({
                      ...paymentForm,
                      invoiceId: e.target.value,
                      customerId: invoice?.customerId || paymentForm.customerId,
                      amount: Number(invoice?.balance || invoice?.amount || paymentForm.amount),
                    });
                  }}
                >
                  <option value="">Direct payment / no invoice</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNo} - {invoice.customer?.fullName || '-'} - Balance{' '}
                      {money(invoice.balance)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Customer
                <select
                  value={paymentForm.customerId}
                  disabled={!!paymentEditingId || !!paymentForm.invoiceId}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, customerId: e.target.value })
                  }
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName} - {customer.customerNo}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Amount
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      amount: Number(e.target.value),
                    })
                  }
                  required
                />
              </label>

              <label>
                Method
                <select
                  value={paymentForm.method}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, method: e.target.value })
                  }
                >
                  <option value="CASH">Cash</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="EASYPAISA">Easypaisa</option>
                  <option value="BANK">Bank</option>
                  <option value="CARD">Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>

              <label>
                Reference
                <input
                  value={paymentForm.reference}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, reference: e.target.value })
                  }
                  placeholder="Transaction/reference no"
                />
              </label>

              <label>
                Notes
                <input
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  placeholder="Payment note"
                />
              </label>
            </div>

            <button className="primary-btn small-btn" disabled={savePayment.isPending}>
              {paymentEditingId ? <Save size={18} /> : <Plus size={18} />}
              {savePayment.isPending
                ? 'Saving...'
                : paymentEditingId
                  ? 'Update Payment'
                  : 'Record Payment'}
            </button>
          </form>
        </div>
      </section>

      <section className="glass-panel">
        <div className="panel-header">
          <div>
            <h2>Invoices</h2>
            <p className="muted">Edit or delete invoices from here.</p>
          </div>

          <button
            className="ghost-btn"
            onClick={() => runExpiry.mutate()}
            disabled={runExpiry.isPending}
          >
            <Zap size={15} />
            {runExpiry.isPending ? 'Running...' : 'Run Expiry'}
          </button>
        </div>

        {invoicesLoading ? (
          <p className="muted">Loading invoices...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>{invoice.invoiceNo}</strong>
                      <small className="table-sub">
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </small>
                    </td>

                    <td>
                      {invoice.customer?.fullName || '-'}
                      <small className="table-sub">
                        {invoice.customer?.customerNo || '-'}
                      </small>
                    </td>

                    <td>{money(invoice.amount)}</td>
                    <td>{money(invoice.paidAmount)}</td>
                    <td>{money(invoice.balance)}</td>

                    <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>

                    <td>
                      <span className={badgeClass(invoice.status)}>
                        {invoice.status}
                      </span>
                    </td>

                    <td>
                      <div className="action-row">
                        <button
                          className="ghost-btn"
                          onClick={() => startInvoiceEdit(invoice)}
                        >
                          <Edit3 size={15} />
                          Edit
                        </button>

                        <button
                          className="ghost-btn danger-btn"
                          onClick={() => {
                            if (
                              confirm(
                                'Delete this invoice? Linked payments may also be affected.',
                              )
                            ) {
                              deleteInvoice.mutate(invoice.id);
                            }
                          }}
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-cell">
                      No invoices yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="glass-panel">
        <h2>Payments</h2>

        {paymentsLoading ? (
          <p className="muted">Loading payments...</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>

                    <td>
                      {payment.customer?.fullName || '-'}
                      <small className="table-sub">
                        {payment.customer?.customerNo || '-'}
                      </small>
                    </td>

                    <td>{payment.invoice?.invoiceNo || '-'}</td>
                    <td>{money(payment.amount)}</td>
                    <td>{payment.method}</td>
                    <td>{payment.reference || '-'}</td>

                    <td>
                      <div className="action-row">
                        <button
                          className="ghost-btn"
                          onClick={() => startPaymentEdit(payment)}
                        >
                          <Edit3 size={15} />
                          Edit
                        </button>

                        <button
                          className="ghost-btn danger-btn"
                          onClick={() => {
                            if (confirm('Delete this payment? Invoice balance will recalculate.')) {
                              deletePayment.mutate(payment.id);
                            }
                          }}
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
