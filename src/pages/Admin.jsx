import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Trash2, Edit2, Save, X, Settings, Eye, EyeOff, LogOut, User, Search, RefreshCw,
  DollarSign, TrendingUp, Bell, FileText, Users, AlertTriangle, Layers, Calendar, Receipt,
  Activity, Server, Shield, Truck, FolderOpen, BarChart3, ChevronDown, ArrowUpRight, ChevronLeft, ChevronRight, Image as ImageIcon, Clock
} from 'lucide-react';
import { getCurrentUser, signOutCognito } from '../lib/auth';
import { 
  getCars, getProduct, addCar, updateCar, deleteCar, uploadImageToStorage, getGlobalSettings, updateGlobalSettings,
  getReceipts, addReceipt, updateReceipt, voidReceipt,
  getSuppliers, createSupplier, getSupplierPurchases, getSupplierPurchaseDetails, addSupplierPurchase,
  recordSupplierPayment, receiveSupplierShipment, updateSupplierPurchaseStatus, getSupplierMetrics,
  getDashboardAggregates, getAdminVariants, getInventoryVariantDetails, getCategories, createCategory,
  updateCategory, deleteCategory, getTags, createTag, updateTag, deleteTag, getExpenseCategories,
  createExpenseCategory, updateExpenseCategory, deleteExpenseCategory, getPaymentMethods,
  createPaymentMethod, updatePaymentMethod, deletePaymentMethod, getShippingProviders,
  createShippingProvider, updateShippingProvider, deleteShippingProvider, getOrderStatuses,
  getPurchaseStatuses, getLogisticsStatuses, getCurrencies, getCountries, getAllInventoryBatches,
  getAllInventoryLedger, getCustomers, getSupplierReceipts
} from '../lib/db';
import Navigation from '../components/Navigation';
import { StatisticsSkeleton } from '../components/Skeletons';
import ReceiptModal from '../components/ReceiptModal';
import BookPurchaseForm from '../components/BookPurchaseForm';
import ReceiveShipmentForm from '../components/ReceiveShipmentForm';
import RecordPaymentForm from '../components/RecordPaymentForm';
import MasterData from './admin/MasterData';
import ProductForm from '../components/admin/ProductForm';
import InventoryDetails from './admin/InventoryDetails';

import AdminSidebar from '../components/admin/AdminSidebar';
import AdminDashboardTab from '../components/admin/AdminDashboardTab';
import AdminCatalogTab from '../components/admin/AdminCatalogTab';
import AdminInventoryTab from '../components/admin/AdminInventoryTab';
import AdminReceiptsTab from '../components/admin/AdminReceiptsTab';
import AdminOrdersTab from '../components/admin/AdminOrdersTab';
import AdminProcurementTab from '../components/admin/AdminProcurementTab';
import AdminCustomersTab from '../components/admin/AdminCustomersTab';
import AdminReportsTab from '../components/admin/AdminReportsTab';
import AdminNotificationsTab from '../components/admin/AdminNotificationsTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import AdminDiagnosticsTab from '../components/admin/AdminDiagnosticsTab';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState('');
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Tab controller & Sidebar State
  const [adminTab, setAdminTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Supplier Purchases State
  const [supplierPurchases, setSupplierPurchases] = useState([]);
  const [supplierPurchasesTotalPages, setSupplierPurchasesTotalPages] = useState(1);
  const [supplierPurchasesTotal, setSupplierPurchasesTotal] = useState(0);
  const [supplierPurchasesPage, setSupplierPurchasesPage] = useState(1);
  const [supplierPurchasesSearch, setSupplierPurchasesSearch] = useState('');
  const [supplierPurchasesLoading, setSupplierPurchasesLoading] = useState(false);
  const [supplierMetrics, setSupplierMetricsData] = useState({
    upcomingArrivals: 0,
    outstandingPayables: 0,
    awaitingReceiptCount: 0,
    delayedShipments: 0,
    totalSpend: 0,
    avgLeadTimeDays: 0,
    timeline: []
  });
  const [suppliers, setSuppliersList] = useState([]);
  const [isAddingSupplierPurchase, setIsAddingSupplierPurchase] = useState(false);
  const [isRecordingSupplierPayment, setIsRecordingSupplierPayment] = useState(false);
  const [isReceivingShipment, setIsReceivingShipment] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);

  // Datasets
  const [cars, setCars] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [splitsData, setSplitsData] = useState({ totalExpenses: 0, paidMap: {}, targetOwed: {}, balances: {}, settlements: [], owesWho: [] });
  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [financeSubTab, setFinanceSubTab] = useState('overview'); // 'overview', 'cash_drawer', 'founder_capital', 'cash_ledger'
  const [cashAccounts, setCashAccounts] = useState([]);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [ledgerFilters, setLedgerFilters] = useState({ timeRange: 'Lifetime', cashAccountId: '', type: '', limit: 50, offset: 0 });
  const [founderLedger, setFounderLedger] = useState(null);
  const [isAddingCashAccount, setIsAddingCashAccount] = useState(false);
  const [cashAccountForm, setCashAccountForm] = useState({ name: '', type: 'Bank', openingBalance: 0, currency: 'INR', description: '' });
  const [isAddingFounderTx, setIsAddingFounderTx] = useState(false);
  const [founderTxForm, setFounderTxForm] = useState({ founderName: 'Harshal', amount: '', type: 'contribution', cashAccountId: '', reason: '', notes: '', date: new Date().toISOString().split('T')[0] });

  const [catalogList, setCatalogList] = useState([]);
  const [isCreatingNewProductInline, setIsCreatingNewProductInline] = useState(false);
  const [newProductFormInline, setNewProductFormInline] = useState({ name: '', brand: '', sku: '', purchasePrice: 0, price: 0, scale: '1:64', series: 'NA', casingTypes: ['box'] });
  const [activeItemIndexForProductCreation, setActiveItemIndexForProductCreation] = useState(null);

  // Supplier Purchase Forms
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expectedArrivalDate: '',
    items: [{ productId: '', quantity: 1, purchasePrice: 0, casingType: 'box' }],
    advancePaid: 0,
    cashAccountId: '',
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    cashAccountId: '',
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [receivingForm, setReceivingForm] = useState({
    receivedBy: '',
    notes: '',
    items: []
  });

  const [isCreatingNewSupplier, setIsCreatingNewSupplier] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });

  const fetchCashAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/cash-accounts`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCashAccounts(data);
        if (data.length > 0 && !founderTxForm.cashAccountId) {
          setFounderTxForm(prev => ({ ...prev, cashAccountId: data[0].id }));
        }
      }
    } catch (e) {
      console.error("Error loading cash accounts:", e);
    }
  };

  const fetchLedger = async () => {
    try {
      const query = new URLSearchParams(ledgerFilters).toString();
      const res = await fetch(`${API_BASE_URL}/admin/cash-ledger?${query}`, { credentials: 'include' });
      if (res.ok) setLedgerTransactions(await res.json());
    } catch (e) {
      console.error("Error loading ledger:", e);
    }
  };

  const fetchFounderLedger = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/founder-ledger`, { credentials: 'include' });
      if (res.ok) setFounderLedger(await res.json());
    } catch (e) {
      console.error("Error loading founder ledger:", e);
    }
  };

  useEffect(() => {
    if (isAdmin && adminTab === 'finance') {
      fetchLedger();
    }
  }, [ledgerFilters, adminTab, isAdmin]);

  const exportLedgerToCSV = () => {
    if (ledgerTransactions.length === 0) return;
    const headers = ['Date', 'Account', 'Type', 'Amount', 'Ref Number', 'Reason', 'Notes', 'Created By'];
    const rows = ledgerTransactions.map(tx => [
      new Date(tx.date).toLocaleDateString('en-IN'),
      tx.cash_account_name || 'N/A',
      tx.type,
      tx.amount,
      tx.reference_number || '',
      tx.reason,
      tx.notes || '',
      tx.created_by
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cash_ledger_${ledgerFilters.timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCashAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/cash-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cashAccountForm),
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Cash account registered successfully");
        setIsAddingCashAccount(false);
        setCashAccountForm({ name: '', type: 'Bank', openingBalance: 0, currency: 'INR', description: '' });
        fetchCashAccounts();
      } else {
        showToast("Failed to register cash account", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFounderTxSubmit = async (e) => {
    e.preventDefault();
    const endpoint = founderTxForm.type === 'contribution' ? 'contribute' : 'reimburse';
    try {
      const res = await fetch(`${API_BASE_URL}/admin/founder-ledger/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderName: founderTxForm.founderName,
          amount: Number(founderTxForm.amount),
          cashAccountId: founderTxForm.cashAccountId,
          reason: founderTxForm.reason,
          notes: founderTxForm.notes,
          date: founderTxForm.date
        }),
        credentials: 'include'
      });
      if (res.ok) {
        showToast(`Founder transaction recorded successfully`);
        setIsAddingFounderTx(false);
        setFounderTxForm(prev => ({ ...prev, amount: '', reason: '', notes: '' }));
        fetchFounderLedger();
        fetchKPIs();
        fetchLedger();
      } else {
        showToast("Failed to record transaction", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKPIs = async () => {
    setKpisLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dashboard/kpis`, { credentials: 'include' });
      if (res.ok) {
        setKpis(await res.json());
      } else {
        showToast("Failed to load KPIs", "error");
      }
    } catch (e) {
      console.error("Error loading KPIs:", e);
    } finally {
      setKpisLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/analytics`, { credentials: 'include' });
      if (res.ok) {
        setAnalytics(await res.json());
      } else {
        showToast("Failed to load Analytics", "error");
      }
    } catch (e) {
      console.error("Error loading Analytics:", e);
    } finally {
      setAnalyticsLoading(false);
    }
  };
  const [notifications, setNotifications] = useState([]);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [cmsData, setCmsData] = useState({ sections: [], items: [] });
  const [globalSettings, setGlobalSettings] = useState({
    showPrices: true,
    instagramUrl: 'https://www.instagram.com/garagekingsindia/',
    companyUpiId: 'garagekings@upi',
    upiQrImage: '/upi-qr.png',
    lowStockThreshold: 3,
    reservationDuration: 15
  });

  // UI state variables
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProductData, setEditingProductData] = useState(null);
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [isArchivingProductId, setIsArchivingProductId] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', brand: '', price: '', scale: '1:64', lane: '', totalStock: 10, availableStock: 10, lockedStock: 0, soldStock: 0, description: '', image: '', category: 'JDM', purchasePrice: '', maxQtyPerCustomer: '', hasLimit: false });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ERP State variables
  const [catalogSubTab, setCatalogSubTab] = useState('products'); // 'products', 'variants', 'lookups'
  const [procurementSubTab, setProcurementSubTab] = useState('suppliers'); // 'suppliers', 'purchase_orders', 'receipts', 'expenses'
  const [inventorySubTab, setInventorySubTab] = useState('overview'); // 'overview', 'batches', 'ledger', 'adjustments'
  const [ordersSubTab, setOrdersSubTab] = useState('list'); // 'list', 'invoices'
  const [reportsSubTab, setReportsSubTab] = useState('analytics'); // 'analytics', 'founder_splits'

  // Dashboard Aggregates
  const [dashboardAggregates, setDashboardAggregates] = useState(null);
  const [dashboardAggregatesLoading, setDashboardAggregatesLoading] = useState(false);

  // Variants list (operational inventory & catalog)
  const [variantsList, setVariantsList] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsPage, setVariantsPage] = useState(1);
  const [variantsTotalPages, setVariantsTotalPages] = useState(1);
  const [variantsTotal, setVariantsTotal] = useState(0);
  const [variantsSearchQuery, setVariantsSearchQuery] = useState('');

  // Drill down details variant ID
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  // All inventory batches list
  const [allBatches, setAllBatches] = useState([]);
  const [allBatchesLoading, setAllBatchesLoading] = useState(false);
  const [allBatchesPage, setAllBatchesPage] = useState(1);
  const [allBatchesTotalPages, setAllBatchesTotalPages] = useState(1);
  const [allBatchesTotal, setAllBatchesTotal] = useState(0);

  // All inventory ledger list
  const [allLedger, setAllLedger] = useState([]);
  const [allLedgerLoading, setAllLedgerLoading] = useState(false);
  const [allLedgerPage, setAllLedgerPage] = useState(1);
  const [allLedgerTotalPages, setAllLedgerTotalPages] = useState(1);
  const [allLedgerTotal, setAllLedgerTotal] = useState(0);

  // Manual stock adjustment state
  const [manualAdjustmentForm, setManualAdjustmentForm] = useState({
    batchId: '',
    quantityChange: 0,
    type: 'Adjusted',
    reason: ''
  });
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [isAdjustingSubmitting, setIsAdjustingSubmitting] = useState(false);

  // Customers CRM State
  const [customersList, setCustomersList] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersPage, setCustomersPage] = useState(1);
  const [customersTotalPages, setCustomersTotalPages] = useState(1);
  const [customersTotal, setCustomersTotal] = useState(0);
  const [customersSearchQuery, setCustomersSearchQuery] = useState('');

  // Goods Receipts List
  const [goodsReceiptsList, setGoodsReceiptsList] = useState([]);
  const [goodsReceiptsLoading, setGoodsReceiptsLoading] = useState(false);
  const [goodsReceiptsPage, setGoodsReceiptsPage] = useState(1);
  const [goodsReceiptsTotalPages, setGoodsReceiptsTotalPages] = useState(1);
  const [goodsReceiptsTotal, setGoodsReceiptsTotal] = useState(0);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({ totalPrice: 0, advanceAmount: 0, remainingAmount: 0, shippingAddress: '', status: '', courierPartner: 'Delhivery', trackingNumber: '', shippingCost: 0, packagingCost: 0 });

  const [activeScreenshotOrder, setActiveScreenshotOrder] = useState(null); // { url, orderId, status, orderRef }
  const [shippingModalOrder, setShippingModalOrder] = useState(null);
  const [shippingForm, setShippingForm] = useState({ courierPartner: 'Delhivery', trackingNumber: '', shippingCost: 0, packagingCost: 0, dispatchDate: new Date().toISOString().split('T')[0] });
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'Verification Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled'
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [receiptOrderId, setReceiptOrderId] = useState(null); // open ReceiptModal for this orderId

  // --- PAGINATION & OBSERVABILITY STATES ---
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryTotalPages, setInventoryTotalPages] = useState(1);
  const [inventoryTotal, setInventoryTotal] = useState(0);

  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesSearch, setExpensesSearch] = useState('');
  const [expensesTotalPages, setExpensesTotalPages] = useState(1);
  const [expensesTotal, setExpensesTotal] = useState(0);

  const [receiptsPage, setReceiptsPage] = useState(1);
  const [receiptsSearch, setReceiptsSearch] = useState('');
  const [receiptsTotalPages, setReceiptsTotalPages] = useState(1);
  const [receiptsTotal, setReceiptsTotal] = useState(0);

  // Diagnostics states
  const [telemetryErrors, setTelemetryErrors] = useState([]);
  const [telemetryPage, setTelemetryPage] = useState(1);
  const [telemetryTotalPages, setTelemetryTotalPages] = useState(1);
  const [telemetrySearch, setTelemetrySearch] = useState('');
  const [telemetryFilter, setTelemetryFilter] = useState('false'); // 'false', 'true', 'all'
  const [diagnosticsSubTab, setDiagnosticsSubTab] = useState('health'); // 'health', 'errors', 'audit', 'settings'

  
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditLogsTotalPages, setAuditLogsTotalPages] = useState(1);
  const [auditLogsSearch, setAuditLogsSearch] = useState('');
  const [auditLogsCategory, setAuditLogsCategory] = useState('All');

  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const [perfStats, setPerfStats] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);

  const [obsSettings, setObsSettings] = useState({
    alertThresholds: { errorRatePerMin: 10, slowRequestRate: 5, authFailureCount: 5 },
    retentionPeriodDays: 14
  });
  const [obsSettingsLoading, setObsSettingsLoading] = useState(false);
  const [isSavingObsSettings, setIsSavingObsSettings] = useState(false);

  const [collectRemainingOrder, setCollectRemainingOrder] = useState(null); // { id, remainingAmount }
  const [collectRemainingFile, setCollectRemainingFile] = useState(null);
  const [collectRemainingLoading, setCollectRemainingLoading] = useState(false);

  // Receipts & Dashboard State Replicated from Legacy
  const [receiptsList, setReceiptsList] = useState([]);
  const [isReceiptsLoading, setIsReceiptsLoading] = useState(false);
  const [isAddingReceipt, setIsAddingReceipt] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState(null);
  const [receiptPage, setReceiptPage] = useState(1);
  const [activeReceiptPreview, setActiveReceiptPreview] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const RECEIPTS_PER_PAGE = 10;

  const createDefaultReceiptForm = () => ({
    receiptNumber: `RT-${Math.floor(10000 + Math.random() * 90000)}`,
    dateString: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) + ' - ' + new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
    companyName: 'Garage Kings India',
    companyLocation: 'Delhi',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerInsta: '',
    customerAddress: '',
    items: [{ qty: 1, description: '', amount: '' }],
    includeShipping: true,
    shippingCharges: 100,
    taxPercent: 0,
    formatType: 'standard',
    pendingBalance: '',
    footerNote: 'Thank you for choosing Garage Kings! For inquiries or support, reach out on WhatsApp or Instagram.'
  });

  const normalizeReceipt = (r) => {
    if (!r) return r;
    const createdAt = r.createdAt || r.created_at;
    const dateObj = createdAt ? new Date(createdAt) : new Date();
    const dateString = r.dateString || (!isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');

    const rawFormat = (r.formatType || r.format_type || 'standard').toLowerCase();
    const formatType = (rawFormat === 'pre_order' || rawFormat === 'prebooking') ? 'prebooking' : rawFormat;

    let rawItems = r.items || r.receiptItems || r.receipt_items || r.itemsJson || r.items_json || [];
    if (typeof rawItems === 'string') {
      try {
        rawItems = JSON.parse(rawItems);
      } catch (e) {
        rawItems = [];
      }
    }
    if (!Array.isArray(rawItems)) {
      rawItems = [];
    }

    const items = rawItems.map(it => ({
      qty: Number(it.qty !== undefined ? it.qty : (it.quantity !== undefined ? it.quantity : 1)) || 1,
      description: String(it.description || it.name || it.item_name || it.itemDescription || it.product_name || it.title || it.item || ''),
      amount: Number(it.amount !== undefined ? it.amount : (it.unit_price !== undefined ? it.unit_price : (it.price !== undefined ? it.price : 0))) || 0
    }));

    const totalAmount = r.totalAmount !== undefined ? Number(r.totalAmount) : (r.total_amount !== undefined ? Number(r.total_amount) : (r.total !== undefined ? Number(r.total) : 0));
    const shippingCharges = r.shippingCharges !== undefined ? Number(r.shippingCharges) : (r.shipping_charges !== undefined ? Number(r.shipping_charges) : 0);
    const pendingBalance = r.pendingBalance !== undefined ? Number(r.pendingBalance) : (r.pending_balance !== undefined ? Number(r.pending_balance) : 0);

    return {
      ...r,
      id: r.id,
      receiptNumber: r.receiptNumber || r.receipt_number || '',
      companyName: r.companyName || r.company_name || 'Garage Kings India',
      companyLocation: r.companyLocation || r.company_location || 'Delhi',
      customerName: r.customerName || r.customer_name || '',
      customerPhone: r.customerPhone || r.customer_phone || '',
      customerEmail: r.customerEmail || r.customer_email || r.email || '',
      customerInsta: r.customerInsta || r.customer_instagram || '',
      customerAddress: r.customerAddress || r.customer_address || '',
      formatType: formatType,
      totalAmount: totalAmount,
      pendingBalance: pendingBalance,
      advancePaid: r.advancePaid !== undefined ? Number(r.advancePaid) : (r.advance_paid !== undefined ? Number(r.advance_paid) : 0),
      includeShipping: r.includeShipping !== undefined ? Boolean(r.includeShipping) : (shippingCharges > 0),
      shippingCharges: shippingCharges,
      taxPercent: r.taxPercent !== undefined ? Number(r.taxPercent) : (r.tax_percent !== undefined ? Number(r.tax_percent) : 0),
      taxAmount: r.taxAmount !== undefined ? Number(r.taxAmount) : (r.tax_amount !== undefined ? Number(r.tax_amount) : 0),
      footerNote: r.footerNote || r.footer_note || 'Thank you for choosing Garage Kings!',
      status: r.status || 'Issued',
      voidReason: r.voidReason || r.void_reason || '',
      voidedAt: r.voidedAt || r.voided_at || null,
      createdAt: createdAt,
      dateString: dateString,
      items: items.length > 0 ? items : [{ qty: 1, description: '', amount: 0 }]
    };
  };

  const [receiptForm, setReceiptForm] = useState(createDefaultReceiptForm);

  // Interactive Chart state
  const [chartTimeframe, setChartTimeframe] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [chartMetric, setChartMetric] = useState('all'); // 'all', 'stock', 'po'
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);

  // Revenue Chart Data Generation
  const chartData = useMemo(() => {
    const now = new Date();
    let buckets = [];

    if (chartTimeframe === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

        buckets.push({
          label: i === 0 ? 'Today' : dayStr,
          startDate: startOfDay,
          endDate: endOfDay,
          stock: 0,
          po: 0,
          total: 0
        });
      }
    } else if (chartTimeframe === 'weekly') {
      for (let i = 7; i >= 0; i--) {
        const endW = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const startW = new Date(endW.getTime() - 6 * 24 * 60 * 60 * 1000);
        startW.setHours(0, 0, 0, 0);
        endW.setHours(23, 59, 59, 999);

        const label = i === 0 ? 'This Wk' : `${startW.getDate()} ${startW.toLocaleDateString('en-IN', { month: 'short' })}`;

        buckets.push({
          label,
          startDate: startW,
          endDate: endW,
          stock: 0,
          po: 0,
          total: 0
        });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const startM = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0);
        const endM = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        const label = startM.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

        buckets.push({
          label,
          startDate: startM,
          endDate: endM,
          stock: 0,
          po: 0,
          total: 0
        });
      }
    }

    receiptsList.forEach(r => {
      if (r.status === 'Voided') return;
      const amt = Number(r.totalAmount) || 0;
      const rDate = r.createdAt ? new Date(r.createdAt) : new Date();

      const matchedBucket = buckets.find(b => rDate >= b.startDate && rDate <= b.endDate);
      if (matchedBucket) {
        if (r.formatType === 'prebooking') {
          matchedBucket.po += amt;
        } else {
          matchedBucket.stock += amt;
        }
        matchedBucket.total += amt;
      }
    });

    return buckets;
  }, [receiptsList, chartTimeframe]);

  // Dashboard Analytics Calculations
  const dashboardStats = useMemo(() => {
    let stockRevenue = 0;
    let poRevenue = 0;
    let poPendingAmount = 0;
    
    let standardCount = 0;
    let poCount = 0;
    let auctionCount = 0;
    let customCount = 0;

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let thisWeekRevenue = 0;
    let lastWeekRevenue = 0;

    receiptsList.forEach(r => {
      if (r.status === 'Voided') return;
      const totalPaid = Number(r.totalAmount) || 0;
      const pending = Number(r.pendingBalance) || 0;
      const rDate = r.createdAt ? new Date(r.createdAt) : new Date();

      if (r.formatType === 'prebooking') {
        poRevenue += totalPaid;
        poPendingAmount += pending;
        poCount++;
      } else {
        stockRevenue += totalPaid;
        if (r.formatType === 'auction') auctionCount++;
        else if (r.formatType === 'custom') customCount++;
        else standardCount++;
      }

      if (rDate >= startOfThisMonth) {
        thisMonthRevenue += totalPaid;
      } else if (rDate >= startOfLastMonth && rDate <= endOfLastMonth) {
        lastMonthRevenue += totalPaid;
      }

      if (rDate >= sevenDaysAgo) {
        thisWeekRevenue += totalPaid;
      } else if (rDate >= fourteenDaysAgo && rDate < sevenDaysAgo) {
        lastWeekRevenue += totalPaid;
      }
    });

    const totalRevenue = stockRevenue + poRevenue;
    const totalReceiptsCount = receiptsList.filter(receipt => receipt.status !== 'Voided').length;
    const avgReceiptValue = totalReceiptsCount > 0 ? totalRevenue / totalReceiptsCount : 0;

    const monthGrowthPct = lastMonthRevenue > 0 
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : thisMonthRevenue > 0 ? '100' : '0';

    const weekGrowthPct = lastWeekRevenue > 0
      ? (((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100).toFixed(1)
      : thisWeekRevenue > 0 ? '100' : '0';

    return {
      totalRevenue,
      stockRevenue,
      poRevenue,
      poPendingAmount,
      totalReceiptsCount,
      avgReceiptValue,
      standardCount,
      poCount,
      auctionCount,
      customCount,
      thisMonthRevenue,
      lastMonthRevenue,
      monthGrowthPct,
      thisWeekRevenue,
      lastWeekRevenue,
      weekGrowthPct
    };
  }, [receiptsList]);

  // Receipts Action Handlers
  const fetchReceiptsList = async (page = receiptsPage, search = receiptsSearch) => {
    setIsReceiptsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/receipts?page=${page}&limit=10&search=${encodeURIComponent(search)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const rawList = data.receipts || (Array.isArray(data) ? data : []);
        setReceiptsList(rawList.map(normalizeReceipt));
        setReceiptsTotalPages(data.totalPages || Math.ceil((data.total || rawList.length) / 10) || 1);
        setReceiptsTotal(data.total || rawList.length);
      }
    } catch (e) {
      console.error("Error loading receipts:", e);
    } finally {
      setIsReceiptsLoading(false);
    }
  };

  const handleSaveReceipt = async () => {
    if (!receiptForm.customerName || !receiptForm.customerName.trim()) {
      showToast("Customer Name is required.", "error");
      return;
    }
    if (!receiptForm.customerPhone || !receiptForm.customerPhone.trim()) {
      showToast("Customer Phone Number is required.", "error");
      return;
    }
    const validItems = receiptForm.items.filter(it => it.description && it.description.trim() && Number(it.amount) >= 0);
    if (validItems.length === 0) {
      showToast("At least 1 valid line item with description is required.", "error");
      return;
    }

    try {
      const itemsPayload = validItems.map(it => ({
        qty: Number(it.qty) || 1,
        description: it.description.trim(),
        amount: Number(it.amount) || 0
      }));

      const itemsSubtotal = itemsPayload.reduce((acc, it) => acc + (it.qty * it.amount), 0);
      const shippingCost = receiptForm.includeShipping ? (Number(receiptForm.shippingCharges) || 0) : 0;
      const subtotal = itemsSubtotal + shippingCost;
      const taxAmt = subtotal * ((Number(receiptForm.taxPercent) || 0) / 100);
      const totalAmt = subtotal + taxAmt;

      const receiptPayload = {
        receiptNumber: receiptForm.receiptNumber || `RT-${Math.floor(10000 + Math.random() * 90000)}`,
        dateString: receiptForm.dateString,
        companyName: receiptForm.companyName || 'Garage Kings India',
        companyLocation: receiptForm.companyLocation || 'Delhi',
        customerName: receiptForm.customerName,
        customerPhone: receiptForm.customerPhone,
        customerEmail: receiptForm.customerEmail,
        customerInsta: receiptForm.customerInsta,
        customerAddress: receiptForm.customerAddress,
        items: itemsPayload,
        includeShipping: receiptForm.includeShipping,
        shippingCharges: shippingCost,
        taxPercent: Number(receiptForm.taxPercent) || 0,
        taxAmount: taxAmt,
        totalAmount: totalAmt,
        formatType: receiptForm.formatType,
        pendingBalance: receiptForm.formatType === 'prebooking' ? (Number(receiptForm.pendingBalance) || 0) : 0,
        footerNote: receiptForm.footerNote
      };

      if (editingReceiptId) {
        await updateReceipt(editingReceiptId, receiptPayload);
        showToast("Receipt record updated successfully!");
      } else {
        await addReceipt(receiptPayload);
        showToast("Billing receipt generated successfully!");
      }
      setIsAddingReceipt(false);
      setEditingReceiptId(null);
      setReceiptForm(createDefaultReceiptForm());
      fetchReceiptsList();
    } catch (err) {
      console.error(err);
      showToast("Failed to save receipt: " + err.message, "error");
    }
  };

  const handleEditReceipt = (receipt) => {
    const r = normalizeReceipt(receipt);
    setReceiptForm({
      receiptNumber: r.receiptNumber || '',
      dateString: r.dateString || '',
      companyName: r.companyName || 'Garage Kings India',
      companyLocation: r.companyLocation || 'Delhi',
      customerName: r.customerName || '',
      customerPhone: r.customerPhone || '',
      customerEmail: r.customerEmail || '',
      customerInsta: r.customerInsta || '',
      customerAddress: r.customerAddress || '',
      items: Array.isArray(r.items) && r.items.length > 0 ? r.items.map(it => ({
        qty: it.qty || 1,
        description: it.description || '',
        amount: it.amount !== undefined ? it.amount : ''
      })) : [{ qty: 1, description: '', amount: '' }],
      includeShipping: r.includeShipping !== undefined ? r.includeShipping : true,
      shippingCharges: r.shippingCharges || 0,
      taxPercent: r.taxPercent || 0,
      formatType: r.formatType || 'standard',
      pendingBalance: r.pendingBalance || '',
      footerNote: r.footerNote || 'Thank you for choosing Garage Kings!'
    });
    setEditingReceiptId(r.id);
    setIsAddingReceipt(true);
  };

  const handleVoidReceipt = async (id, reason) => {
    try {
      await voidReceipt(id, reason);
      showToast("Receipt voided and retained in the audit history");
      fetchReceiptsList();
    } catch (err) {
      console.error(err);
      showToast("Failed to void receipt: " + err.message, "error");
      throw err;
    }
  };

  const handlePrintReceipt = (receipt) => {
    const norm = normalizeReceipt(receipt);
    setActiveReceiptPreview(norm);
  };

  // Local drop settings form state
  const [dropSettingsForm, setDropSettingsForm] = useState({
    dropDate: '',
    dropTime: '',
    dropLabel: '',
    dropDesc: ''
  });

  useEffect(() => {
    if (globalSettings) {
      setDropSettingsForm({
        dropDate: globalSettings.dropDate || '',
        dropTime: globalSettings.dropTime || '',
        dropLabel: globalSettings.dropLabel || '',
        dropDesc: globalSettings.dropDesc || ''
      });
    }
  }, [globalSettings]);

  const groupedOrders = useMemo(() => {
    const groups = {};
    orders.forEach(item => {
      if (!groups[item.id]) {
        groups[item.id] = {
          id: item.id,
          status: item.status,
          totalPrice: item.totalPrice,
          shippingAddress: item.shippingAddress,
          trackingNumber: item.trackingNumber,
          createdAt: item.createdAt,
          screenshotUrl: item.screenshotUrl,
          courierPartner: item.courierPartner,
          shippingCost: item.shippingCost,
          packagingCost: item.packagingCost,
          dispatchDate: item.dispatchDate,
          deliveryDate: item.deliveryDate,
          customerEmail: item.customerEmail,
          customerName: item.customerName,
          instagramUsername: item.instagramUsername,
          bookingType: item.bookingType || 'standard',
          advanceAmount: item.advanceAmount || 0,
          remainingAmount: item.remainingAmount || 0,
          items: []
        };
      }
      groups[item.id].items.push({
        productName: item.productName,
        productBrand: item.productBrand,
        priceAtPurchase: item.priceAtPurchase,
        qty: item.qty
      });
    });
    return Object.values(groups);
  }, [orders]);

  const filteredCars = useMemo(() => {
    if (inventorySearchQuery.trim() === '') return cars;
    const q = inventorySearchQuery.toLowerCase();
    return cars.filter(car => 
      (car.name && car.name.toLowerCase().includes(q)) ||
      (car.sku && car.sku.toLowerCase().includes(q)) ||
      (car.brand && car.brand.toLowerCase().includes(q)) ||
      (car.category && car.category.toLowerCase().includes(q))
    );
  }, [cars, inventorySearchQuery]);

  const filteredGroupedOrders = useMemo(() => {
    let result = groupedOrders;
    if (orderFilter !== 'all') {
      result = result.filter(o => o.status === orderFilter);
    }
    if (orderSearchQuery.trim() !== '') {
      const q = orderSearchQuery.toLowerCase();
      result = result.filter(o => {
        return (
          o.id.toLowerCase().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
          (o.instagramUsername && o.instagramUsername.toLowerCase().includes(q)) ||
          o.items.some(item => 
            (item.productName && item.productName.toLowerCase().includes(q)) ||
            (item.productBrand && item.productBrand.toLowerCase().includes(q))
          )
        );
      });
    }
    return result;
  }, [groupedOrders, orderFilter, orderSearchQuery]);

  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'Stock Purchase', paidBy: 'Harshal', date: new Date().toISOString().split('T')[0], notes: '' });

  const [isAddingSettlement, setIsAddingSettlement] = useState(false);
  const [settlementForm, setSettlementForm] = useState({ from: 'Harshal', to: 'Anutosh', amount: '', notes: '', date: new Date().toISOString().split('T')[0] });

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.PROD 
    ? '/api/v1' 
    : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1');

  useEffect(() => {
    async function checkSetupAndLoad() {
      try {
        const activeSession = getCurrentUser();
        setUser(activeSession);
        if (activeSession) {
          setIsAuthenticated(true);
          const isUserAdmin = activeSession.roles.includes('owner') || activeSession.roles.includes('admin');
          setIsAdmin(isUserAdmin);
        }
      } catch (err) {
        console.error("Session validation failed:", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkSetupAndLoad();
  }, [navigate]);

  const fetchSplits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/splits`, { credentials: 'include' });
      if (res.ok) setSplitsData(await res.json());
    } catch (e) {
      console.error("Error loading splits:", e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/notifications`, { credentials: 'include' });
      if (res.ok) {
        const notifs = await res.json();
        setNotifications(notifs);
        setHasMoreNotifications(notifs.length === 10);
      }
    } catch (e) {
      console.error("Error loading notifications:", e);
    }
  };

  const fetchCMS = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/homepage-cms`, { credentials: 'include' });
      if (res.ok) setCmsData(await res.json());
    } catch (e) {
      console.error("Error loading CMS data:", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, { credentials: 'include' });
      if (res.ok) setGlobalSettings(await res.json());
    } catch (e) {
      console.error("Error loading settings:", e);
    }
  };

  const loadAllData = async () => {
    try {
      await Promise.all([
        fetchSplits(),
        fetchNotifications(),
        fetchCMS(),
        fetchSettings()
      ]);
      setKpis(null);
      setAnalytics(null);
      triggerTabFetch(adminTab);
    } catch (e) {
      setDbError('Error loading dashboard datasets.');
    }
  };

  const triggerTabFetch = (tab) => {
    if (tab === 'dashboard') {
      fetchDashboardAggregates();
      fetchReceiptsList();
    } else if (tab === 'catalog') {
      if (catalogSubTab === 'products') {
        fetchInventory(inventoryPage, inventorySearchQuery);
      } else if (catalogSubTab === 'variants') {
        fetchVariants(variantsPage, variantsSearchQuery);
      } else if (catalogSubTab === 'lookups') {
        fetchSettings();
      }
    } else if (tab === 'receipts') {
      fetchReceiptsList(receiptsPage, receiptsSearch);
    } else if (tab === 'notifications') {
      fetchNotifications();
    }
  };

  const fetchSupplierPurchases = async (page, search) => {
    setSupplierPurchasesLoading(true);
    try {
      const data = await getSupplierPurchases(page, 10, search);
      setSupplierPurchases(data.purchases || []);
      setSupplierPurchasesTotalPages(data.totalPages || 1);
      setSupplierPurchasesTotal(data.total || 0);
    } catch (e) {
      console.error("Error loading supplier purchases:", e);
    } finally {
      setSupplierPurchasesLoading(false);
    }
  };

  const fetchSupplierMetrics = async () => {
    try {
      const data = await getSupplierMetrics();
      setSupplierMetricsData(data);
    } catch (e) {
      console.error("Error loading supplier metrics:", e);
    }
  };

  const fetchSuppliersList = async () => {
    try {
      const data = await getSuppliers();
      setSuppliersList(data || []);
    } catch (e) {
      console.error("Error loading suppliers list:", e);
    }
  };

  const fetchSupplierPurchaseDetailsData = async (id) => {
    try {
      const data = await getSupplierPurchaseDetails(id);
      setSelectedPurchase(data);
    } catch (e) {
      console.error("Error loading supplier purchase details:", e);
    }
  };

  const fetchCatalogList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products?page=1&limit=1000`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCatalogList(data.products || []);
      }
    } catch (e) {
      console.error("Error loading catalog list:", e);
    }
  };

  const handleCreateProductInlineSubmit = async (e) => {
    e.preventDefault();
    if (!newProductFormInline.sku || !newProductFormInline.name || !newProductFormInline.brand) {
      showToast("Please fill in SKU, Name, and Brand", "error");
      return;
    }
    try {
      const payload = {
        name: newProductFormInline.name,
        brand: newProductFormInline.brand,
        sku: newProductFormInline.sku,
        price: Number(newProductFormInline.price),
        purchasePrice: Number(newProductFormInline.purchasePrice),
        scale: newProductFormInline.scale,
        series: newProductFormInline.series,
        casingType: newProductFormInline.casingType || 'box',
        availableStock: 0,
        lockedStock: 0,
        soldStock: 0,
        status: 'Active',
        showOnHomepage: true
      };
      
      const res = await addCar(payload);
      showToast(`Product ${payload.brand} ${payload.name} created successfully`, "success");
      
      await fetchCatalogList();
      
      if (activeItemIndexForProductCreation !== null && res.id) {
        const updated = [...purchaseForm.items];
        updated[activeItemIndexForProductCreation].productId = res.id;
        updated[activeItemIndexForProductCreation].purchasePrice = payload.purchasePrice;
        setPurchaseForm(p => ({ ...p, items: updated }));
      }
      
      setIsCreatingNewProductInline(false);
      setActiveItemIndexForProductCreation(null);
    } catch (err) {
      showToast("Failed to create product casting: " + err.message, "error");
    }
  };

  const fetchCacheRef = useRef({});

  const isDuplicateCall = (key) => {
    const now = Date.now();
    if (fetchCacheRef.current[key] && (now - fetchCacheRef.current[key] < 300)) {
      return true;
    }
    fetchCacheRef.current[key] = now;
    return false;
  };

  const fetchInventory = async (page, search) => {
    if (isDuplicateCall(`inventory-${page}-${search}`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products?page=${page}&limit=10&search=${encodeURIComponent(search)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCars(data.products || []);
        setInventoryTotalPages(data.totalPages || 1);
        setInventoryTotal(data.total || 0);
      }
    } catch (e) {
      console.error("Error loading inventory:", e);
    }
  };

  const fetchDashboardAggregates = async () => {
    setDashboardAggregatesLoading(true);
    try {
      const data = await getDashboardAggregates();
      setDashboardAggregates(data);
    } catch (e) {
      console.error("Error loading aggregates:", e);
    } finally {
      setDashboardAggregatesLoading(false);
    }
  };

  const fetchVariants = async (page, search) => {
    setVariantsLoading(true);
    try {
      const data = await getAdminVariants(page, 10, search);
      setVariantsList(data.variants || []);
      setVariantsTotalPages(data.totalPages || 1);
      setVariantsTotal(data.total || 0);
    } catch (e) {
      console.error("Error loading variants:", e);
    } finally {
      setVariantsLoading(false);
    }
  };

  const fetchAllBatchesData = async (page) => {
    setAllBatchesLoading(true);
    try {
      const data = await getAllInventoryBatches(page, 10);
      setAllBatches(data.batches || []);
      setAllBatchesTotalPages(data.totalPages || 1);
      setAllBatchesTotal(data.total || 0);
    } catch (e) {
      console.error("Error loading all batches:", e);
    } finally {
      setAllBatchesLoading(false);
    }
  };

  const fetchAllLedgerData = async (page) => {
    setAllLedgerLoading(true);
    try {
      const data = await getAllInventoryLedger(page, 10);
      setAllLedger(data.ledger || []);
      setAllLedgerTotalPages(data.totalPages || 1);
      setAllLedgerTotal(data.total || 0);
    } catch (e) {
      console.error("Error loading all ledger:", e);
    } finally {
      setAllLedgerLoading(false);
    }
  };

  const fetchCustomersData = async (page, search) => {
    setCustomersLoading(true);
    try {
      const data = await getCustomers(page, 10, search);
      const list = Array.isArray(data) ? data : (data.customers || []);
      setCustomersList(list);
      setCustomersTotal(list.length);
      setCustomersTotalPages(1);
    } catch (e) {
      console.error("Error loading customers:", e);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchGoodsReceiptsData = async (page) => {
    setGoodsReceiptsLoading(true);
    try {
      const data = await getSupplierReceipts(page, 10);
      setGoodsReceiptsList(data.receipts || []);
      setGoodsReceiptsTotalPages(data.totalPages || 1);
      setGoodsReceiptsTotal(data.total || 0);
    } catch (e) {
      console.error("Error loading goods receipts:", e);
    } finally {
      setGoodsReceiptsLoading(false);
    }
  };

  const fetchOrders = async (page, search, status) => {
    const statusParam = status === 'all' ? 'All' : status;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders?page=${page}&limit=10&search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusParam)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setOrdersTotalPages(data.totalPages || 1);
        setOrdersTotal(data.total || 0);
        setPendingOrdersCount(data.pendingCount || 0);
      }
    } catch (e) {
      console.error("Error loading orders:", e);
    }
  };

  const fetchExpenses = async (page, search) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/expenses?page=${page}&limit=10&search=${encodeURIComponent(search)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setExpensesTotalPages(data.totalPages || 1);
        setExpensesTotal(data.total || 0);
      }
    } catch (e) {
      console.error("Error loading expenses:", e);
    }
  };

  const fetchReceipts = async (page = 1, search = '') => {
    if (isDuplicateCall(`receipts-${page}-${search}`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/receipts?page=${page}&limit=10&search=${encodeURIComponent(search)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setReceiptsList(data.receipts || []);
        setReceiptsTotalPages(data.totalPages || 1);
        setReceiptsTotal(data.total || 0);
      }
    } catch (e) {
      console.error("Error loading receipts:", e);
    }
  };

  const fetchDiagnosticsData = async () => {
    fetchTelemetryErrors(telemetryPage, telemetrySearch, telemetryFilter);
    fetchAuditLogs(auditLogsPage, auditLogsSearch, auditLogsCategory);
    fetchHealth();
    fetchPerformanceMetrics();
    fetchObsSettings();
  };

  const fetchTelemetryErrors = async (page, search, acknowledged) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/telemetry/errors?page=${page}&limit=10&search=${encodeURIComponent(search)}&acknowledged=${acknowledged}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTelemetryErrors(data.errors || []);
        setTelemetryTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error("Error loading telemetry errors:", e);
    }
  };

  const fetchAuditLogs = async (page, search, category) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/audit-logs?page=${page}&limit=10&search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
        setAuditLogsTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error("Error loading audit logs:", e);
    }
  };

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        setHealthStatus(await res.json());
      }
    } catch (e) {
      console.error("Error loading health status:", e);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchPerformanceMetrics = async () => {
    setPerfLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/performance-metrics`, { credentials: 'include' });
      if (res.ok) {
        setPerfStats(await res.json());
      }
    } catch (e) {
      console.error("Error loading performance stats:", e);
    } finally {
      setPerfLoading(false);
    }
  };

  const fetchObsSettings = async () => {
    setObsSettingsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/observability/settings`, { credentials: 'include' });
      if (res.ok) {
        setObsSettings(await res.json());
      }
    } catch (e) {
      console.error("Error loading observability settings:", e);
    } finally {
      setObsSettingsLoading(false);
    }
  };

  const handleSaveObsSettings = async (settings) => {
    setIsSavingObsSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/observability/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Settings updated successfully", "success");
        setObsSettings(settings);
      } else {
        showToast("Failed to update settings", "error");
      }
    } catch (e) {
      console.error("Error saving observability settings:", e);
      showToast("Error updating settings", "error");
    } finally {
      setIsSavingObsSettings(false);
    }
  };

  const handleAcknowledgeError = async (fingerprint) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/telemetry/errors/${fingerprint}/acknowledge`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Error marked as resolved", "success");
        fetchTelemetryErrors(telemetryPage, telemetrySearch, telemetryFilter);
      }
    } catch (e) {
      console.error("Error acknowledging error:", e);
    }
  };

  const handleClearErrors = async () => {
    if (!window.confirm("Are you sure you want to clear all logged errors? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/telemetry/clear-errors`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        showToast("Errors cleared successfully", "success");
        fetchTelemetryErrors(telemetryPage, telemetrySearch, telemetryFilter);
      }
    } catch (e) {
      console.error("Error clearing errors:", e);
    }
  };

  const isSearchFirstRender = useRef(true);

  // Debounced search logic for active search query string changes ONLY
  useEffect(() => {
    if (isSearchFirstRender.current) {
      isSearchFirstRender.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      if (isAuthenticated && isAdmin) {
        if (adminTab === 'catalog') {
          if (catalogSubTab === 'products') {
            fetchInventory(1, inventorySearchQuery);
          } else if (catalogSubTab === 'variants') {
            fetchVariants(1, variantsSearchQuery);
          }
        } else if (adminTab === 'inventory') {
          if (inventorySubTab === 'overview') {
            fetchVariants(1, variantsSearchQuery);
          }
        } else if (adminTab === 'orders') {
          if (ordersSubTab === 'list') {
            fetchOrders(1, orderSearchQuery, orderFilter);
          } else if (ordersSubTab === 'invoices') {
            fetchReceipts(1, receiptsSearch);
          }
        } else if (adminTab === 'customers') {
          fetchCustomersData(1, customersSearchQuery);
        } else if (adminTab === 'receipts') {
          fetchReceiptsList(1, receiptsSearch);
        }
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [inventorySearchQuery, variantsSearchQuery, orderSearchQuery, receiptsSearch, customersSearchQuery]);

  // Tab and page state change triggers ONLY for active tabs (Single source of truth for tab switching and pagination)
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      triggerTabFetch(adminTab);
    }
  }, [adminTab, catalogSubTab, inventorySubTab, ordersSubTab, inventoryPage, variantsPage, ordersPage, orderFilter, receiptsPage, customersPage]);


  const handleViewReceipt = (dbReceipt) => {
    const mapped = {
      receiptNumber: dbReceipt.receipt_number,
      orderId: dbReceipt.id,
      date: dbReceipt.created_at,
      status: dbReceipt.pending_balance > 0 ? 'Verification Pending' : 'Delivered',
      bookingType: dbReceipt.format_type === 'pre_order' ? 'pre_order' : 'standard',
      customer: {
        name: dbReceipt.customer_name || 'Walk-in Customer',
        email: dbReceipt.customer_email || '',
        phone: dbReceipt.customer_phone || '',
        instagram: dbReceipt.customer_instagram || '',
        address: dbReceipt.customer_address || ''
      },
      items: dbReceipt.items.map(i => ({
        name: i.description,
        qty: i.qty,
        unitPrice: i.amount,
        series: '',
        scale: '1:64'
      })),
      subtotal: dbReceipt.items.reduce((sum, i) => sum + (Number(i.amount) * Number(i.qty)), 0),
      shippingCharges: Number(dbReceipt.shipping_charges || 0),
      totalAmount: Number(dbReceipt.total_amount),
      advancePaid: Number(dbReceipt.advance_paid || 0),
      pendingBalance: Number(dbReceipt.pending_balance || 0),
      footerNote: dbReceipt.footer_note || ''
    };
    setSelectedReceipt(mapped);
  };

  const handleLogout = async () => {
    await signOutCognito();
    window.location.href = '/account';
  };

  // Image Upload Handler (converts to WebP client-side via db.js helper)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToStorage(file);
      setProductForm(prev => ({ ...prev, image: url }));
    } catch (err) {
      showToast("Image archival upload failed: " + err.message, "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // Fields NestJS ignores on initial POST but respects on admin PATCH
  const DEFERRED_PATCH_FIELDS = ['prebookDepositAmount', 'poAmount', 'arrivalDate', 'releaseDate', 'customerEta'];
  const isUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const patchDeferredFields = async (productId, payload, createdProduct) => {
    const patch = {};
    DEFERRED_PATCH_FIELDS.forEach(f => {
      const val = payload[f];
      if (val !== undefined && val !== null) {
        patch[f] = val;
      }
    });

    const variantId = createdProduct?.variants?.[0]?.id;
    if (variantId && isUuid(variantId)) {
      patch.variants = [
        {
          id: variantId,
          customerEta: payload.customerEta || payload.arrivalDate || null,
          casing: (payload.casing || 'box').toUpperCase()
        }
      ];
    }

    if (Object.keys(patch).length > 0) {
      try { await updateCar(productId, patch); } catch (e) { console.warn('Post-create deferred patch failed:', e); }
    }
  };

  const handleSaveProduct = async (payload) => {
    try {
      if (editingProductId) {
        const { caseVariants, items, variants, ...cleanUpdatePayload } = payload;
        await updateCar(editingProductId, cleanUpdatePayload);
      } else if (Array.isArray(payload?.items)) {
        for (let i = 0; i < payload.items.length; i++) {
          const item = payload.items[i];
          const { caseVariants, items, variants, ...cleanItem } = item;
          let created;
          try {
            created = await addCar(cleanItem);
          } catch (err) {
            const errMsg = String(err?.message || '');
            if (errMsg.includes('products_sku_key') || errMsg.includes('duplicate key') || errMsg.includes('already exists') || errMsg.includes('409') || errMsg.includes('400')) {
              throw new Error(`SKU ID "${cleanItem.sku}" is already in use by another product. Please enter a unique SKU ID.`);
            }
            throw err;
          }
          if (created?.id) await patchDeferredFields(created.id, item, created);
        }
      } else {
        const { caseVariants, items, variants, ...cleanPayload } = payload;
        let created;
        try {
          created = await addCar(cleanPayload);
        } catch (err) {
          const errMsg = String(err?.message || '');
          if (errMsg.includes('products_sku_key') || errMsg.includes('duplicate key') || errMsg.includes('already exists') || errMsg.includes('409') || errMsg.includes('400')) {
            throw new Error(`SKU ID "${cleanPayload.sku}" is already in use by another product. Please enter a unique SKU ID.`);
          }
          throw err;
        }
        if (created?.id) await patchDeferredFields(created.id, cleanPayload, created);
      }
      setIsAddingProduct(false);
      setEditingProductId(null);
      setEditingProductData(null);
      fetchInventory(inventoryPage, inventorySearchQuery);
      showToast(editingProductId ? "Product updated successfully!" : "Product(s) created successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to save product", "error");
      throw err;
    }
  };

  // Products CRUD handlers
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...productForm };
      delete payload.totalStock;
      if (editingProductId) {
        await updateCar(editingProductId, payload);
      } else {
        await addCar(payload);
      }
      setIsAddingProduct(false);
      setEditingProductId(null);
      fetchInventory(inventoryPage, inventorySearchQuery);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (car) => {
    setLoadingProductId(car.id);
    try {
      const fullProduct = await getProduct(car.id);
      const mergedProduct = { ...car, ...(fullProduct || {}) };
      setEditingProductData(mergedProduct);
      setEditingProductId(car.id);
      setIsAddingProduct(true);
    } catch (err) {
      console.error(err);
      setEditingProductData(car);
      setEditingProductId(car.id);
      setIsAddingProduct(true);
    } finally {
      setLoadingProductId(null);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this casting?')) return;
    setIsArchivingProductId(id);
    try {
      await deleteCar(id);
      setCars(prev => prev.filter(c => c.id !== id));
      await fetchInventory(inventoryPage, inventorySearchQuery);
      showToast("Product deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete product: " + err.message, "error");
    } finally {
      setIsArchivingProductId(null);
    }
  };

  const handleConvertPoToStock = async (productId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPrebook: false })
      });
      if (!res.ok) {
        await fetch(`${API_BASE_URL}/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isPrebook: false })
        });
      }
      showToast("Converted product from Pre-Order (PO) to In-Stock!", "success");
      await fetchInventory(inventoryPage, inventorySearchQuery);
    } catch (err) {
      console.error('Convert to stock failed:', err);
      showToast("Failed to convert PO to In-Stock: " + err.message, "error");
    }
  };

  // Orders Actions handlers
  const handleConfirmOrder = async (orderId) => {
    if (!confirm('Verify UPI payment screenshot and confirm this order?')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Confirmed' })
      });
      if (!res.ok) throw new Error("Verification confirmation failed.");
      fetchOrders(ordersPage, orderSearchQuery, orderFilter);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Cancel this reservation? Stock will be released back immediately.')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Cancelled' })
      });
      if (!res.ok) throw new Error("Order cancellation failed.");
      fetchOrders(ordersPage, orderSearchQuery, orderFilter);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShipOrderSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${shippingModalOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: 'Shipped',
          ...shippingForm
        })
      });
      if (!res.ok) throw new Error("Failed to dispatch shipment details.");
      setShippingModalOrder(null);
      fetchOrders(ordersPage, orderSearchQuery, orderFilter);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setOrderForm({
      totalPrice: order.totalPrice || 0,
      advanceAmount: order.advanceAmount || 0,
      remainingAmount: order.remainingAmount || 0,
      shippingAddress: order.shippingAddress || '',
      status: order.status || '',
      courierPartner: order.courierPartner || 'Delhivery',
      trackingNumber: order.trackingNumber || '',
      shippingCost: order.shippingCost || 0,
      packagingCost: order.packagingCost || 0
    });
  };

  const handleEditOrderSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderForm)
      });
      if (!res.ok) throw new Error("Failed to save order updates.");
      showToast("Order updated successfully", "success");
      setEditingOrder(null);
      await loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expenses handlers
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(expenseForm)
      });
      if (!res.ok) throw new Error("Failed to log expense.");
      setIsAddingExpense(false);
      fetchExpenses(expensesPage, expensesSearch);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Delete this expense log?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/expenses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Failed to delete expense log.");
      fetchExpenses(expensesPage, expensesSearch);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Settlements splits handlers
  const handleSettlementSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/splits/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settlementForm)
      });
      if (!res.ok) throw new Error("Failed to record settlement transfer.");
      setIsAddingSettlement(false);
      fetchSplits();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleToggleCmsSection = async (sectionName, currentVisible) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/homepage-cms/section`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sectionName, isVisible: !currentVisible })
      });
      if (!res.ok) throw new Error("Failed to update section visibility");
      fetchCMS();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleUpdateGlobalSettings = async (updates) => {
    try {
      await updateGlobalSettings(updates);
      fetchSettings();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/notifications/read`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setNotifications([]);
        setHasMoreNotifications(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMoreNotifications = async () => {
    try {
      const offset = notifications.length;
      const res = await fetch(`${API_BASE_URL}/admin/notifications?limit=10&offset=${offset}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(prev => [...prev, ...data]);
        setHasMoreNotifications(data.length === 10);
      }
    } catch (err) {
      console.error("Error loading more notifications:", err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] font-sans text-[#F4F1EC]">
        <div className="flex flex-col items-center gap-4">
          <img src="/brand-mark.webp" alt="" className="h-12 w-12 object-contain opacity-80" />
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8AE7D] animate-pulse">Opening operations</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#090909] text-white flex flex-col justify-center items-center px-4 font-sans select-none">
        <div className="text-center">
          <h1 className="text-6xl font-light tracking-widest text-white/20 mb-4">404</h1>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-6">Page Not Found</h2>
          <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed mb-8">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link to="/" className="inline-block border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/80 hover:text-white font-bold text-[10px] px-6 py-3 rounded-xl uppercase tracking-widest transition-all">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gk-admin-shell flex min-h-screen flex-col bg-[#050505] font-sans text-[#F4F1EC] selection:bg-[#C8AE7D] selection:text-black">
      <Navigation activeSection="garage" />

      {/* Main Container Layout */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 pb-10 pt-20 md:px-8 lg:flex-row lg:pt-24">
        
        {/* Left Side Dashboard Nav */}
        <AdminSidebar
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          triggerTabFetch={triggerTabFetch}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          handleLogout={handleLogout}
        />

        {/* Right Side Content Panel */}
        <main className="relative min-w-0 flex-1 rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(17,17,16,.92),rgba(8,8,8,.96))] p-5 shadow-[0_30px_90px_rgba(0,0,0,.38)] md:p-8">
          
          {/* Header */}
          <div className="mb-8 flex items-end justify-between border-b border-white/[0.07] pb-6">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C8AE7D]">
                GarageKings operations
              </p>
              <h1 className="mt-2 text-3xl font-semibold capitalize tracking-[-0.035em] text-[#F4F1EC]">
                {adminTab.replace('_', ' ')}
              </h1>
            </div>
          </div>          {/* 1. DASHBOARD TAB */}
          {adminTab === 'dashboard' && (
            <AdminDashboardTab
              dashboardStats={dashboardStats}
              chartData={chartData}
              chartTimeframe={chartTimeframe}
              setChartTimeframe={setChartTimeframe}
              hoveredPointIndex={hoveredPointIndex}
              setHoveredPointIndex={setHoveredPointIndex}
              isLoading={isReceiptsLoading}
              operations={dashboardAggregates || {}}
              onNavigate={setAdminTab}
              onNewReceiptClick={() => { setAdminTab('receipts'); setEditingReceiptId(null); setIsAddingReceipt(true); }}
            />
          )}

          {/* 2. CATALOG TAB */}
          {adminTab === 'catalog' && (
            <AdminCatalogTab
              catalogSubTab={catalogSubTab}
              setCatalogSubTab={setCatalogSubTab}
              setProductForm={setProductForm}
              setEditingProductId={setEditingProductId}
              setEditingProductData={setEditingProductData}
              setIsAddingProduct={setIsAddingProduct}
              inventorySearchQuery={inventorySearchQuery}
              setInventorySearchQuery={setInventorySearchQuery}
              filteredCars={filteredCars}
              handleConvertPoToStock={handleConvertPoToStock}
              handleEditProduct={handleEditProduct}
              handleDeleteProduct={handleDeleteProduct}
              loadingProductId={loadingProductId}
              isArchivingProductId={isArchivingProductId}
              inventoryPage={inventoryPage}
              inventoryTotalPages={inventoryTotalPages}
              inventoryTotal={inventoryTotal}
              setInventoryPage={setInventoryPage}
              variantsSearchQuery={variantsSearchQuery}
              setVariantsSearchQuery={setVariantsSearchQuery}
              variantsLoading={variantsLoading}
              variantsList={variantsList}
              variantsPage={variantsPage}
              variantsTotalPages={variantsTotalPages}
              variantsTotal={variantsTotal}
              setVariantsPage={setVariantsPage}
            />
          )}

          {/* 3. INVENTORY TAB */}
          {adminTab === 'inventory' && (
            <AdminInventoryTab
              selectedVariantId={selectedVariantId}
              setSelectedVariantId={setSelectedVariantId}
              inventorySubTab={inventorySubTab}
              setInventorySubTab={setInventorySubTab}
              variantsSearchQuery={variantsSearchQuery}
              setVariantsSearchQuery={setVariantsSearchQuery}
              variantsLoading={variantsLoading}
              variantsList={variantsList}
              variantsPage={variantsPage}
              variantsTotalPages={variantsTotalPages}
              variantsTotal={variantsTotal}
              setVariantsPage={setVariantsPage}
              allBatchesLoading={allBatchesLoading}
              allBatches={allBatches}
              allBatchesPage={allBatchesPage}
              allBatchesTotalPages={allBatchesTotalPages}
              allBatchesTotal={allBatchesTotal}
              setAllBatchesPage={setAllBatchesPage}
              allLedgerLoading={allLedgerLoading}
              allLedger={allLedger}
              allLedgerPage={allLedgerPage}
              allLedgerTotalPages={allLedgerTotalPages}
              allLedgerTotal={allLedgerTotal}
              setAllLedgerPage={setAllLedgerPage}
              manualAdjustmentForm={manualAdjustmentForm}
              setManualAdjustmentForm={setManualAdjustmentForm}
              isAdjustingSubmitting={isAdjustingSubmitting}
              setIsAdjustingSubmitting={setIsAdjustingSubmitting}
              API_BASE_URL={API_BASE_URL}
              getAuthHeaders={getAuthHeaders}
              showToast={showToast}
              triggerTabFetch={triggerTabFetch}
            />
          )}

          {/* 4. RECEIPTS TAB */}
          {adminTab === 'receipts' && (
            <AdminReceiptsTab
              receiptsList={receiptsList}
              receiptSearch={receiptsSearch}
              setReceiptSearch={setReceiptsSearch}
              receiptPage={receiptPage}
              setReceiptPage={setReceiptPage}
              receiptsTotalPages={receiptsTotalPages}
              receiptsTotal={receiptsTotal}
              RECEIPTS_PER_PAGE={RECEIPTS_PER_PAGE}
              isAddingReceipt={isAddingReceipt}
              setIsAddingReceipt={setIsAddingReceipt}
              onFetchInventory={() => { if (!cars || cars.length === 0) fetchInventory(1, ''); }}
              editingReceiptId={editingReceiptId}
              setEditingReceiptId={setEditingReceiptId}
              receiptForm={receiptForm}
              setReceiptForm={setReceiptForm}
              createDefaultReceiptForm={createDefaultReceiptForm}
              handleSaveReceipt={handleSaveReceipt}
              handleEditReceipt={handleEditReceipt}
              handleVoidReceipt={handleVoidReceipt}
              handlePrintReceipt={handlePrintReceipt}
              activeReceiptPreview={activeReceiptPreview}
              setActiveReceiptPreview={setActiveReceiptPreview}
              cars={cars}
              isReceiptsLoading={isReceiptsLoading}
            />
          )}

          {/* 5. ORDERS TAB */}
          {adminTab === 'orders' && (
            <AdminOrdersTab
              groupedOrders={groupedOrders}
              ordersLoading={ordersLoading}
              ordersPage={ordersPage}
              ordersTotalPages={ordersTotalPages}
              ordersTotal={ordersTotal}
              setOrdersPage={setOrdersPage}
              orderSearchQuery={orderSearchQuery}
              setOrderSearchQuery={setOrderSearchQuery}
              orderFilter={orderFilter}
              setOrderFilter={setOrderFilter}
              setActiveScreenshotOrder={setActiveScreenshotOrder}
              handleConfirmOrder={handleConfirmOrder}
              handleCancelOrder={handleCancelOrder}
              setShippingModalOrder={setShippingModalOrder}
              setShippingForm={setShippingForm}
              setCollectRemainingOrder={setCollectRemainingOrder}
              setReceiptOrderId={setReceiptOrderId}
              getStatusBadgeClass={getStatusBadgeClass}
              API_BASE_URL={API_BASE_URL}
              fetchOrders={fetchOrders}
              loadAllData={loadAllData}
            />
          )}

          {/* 6. PROCUREMENT TAB */}
          {adminTab === 'procurement' && (
            <AdminProcurementTab
              isAddingSupplierPurchase={isAddingSupplierPurchase}
              isReceivingShipment={isReceivingShipment}
              isRecordingSupplierPayment={isRecordingSupplierPayment}
              purchaseForm={purchaseForm}
              setPurchaseForm={setPurchaseForm}
              suppliers={suppliers}
              cashAccounts={cashAccounts}
              catalogList={catalogList}
              setIsAddingSupplierPurchase={setIsAddingSupplierPurchase}
              setIsCreatingNewSupplier={setIsCreatingNewSupplier}
              setIsCreatingNewProductInline={setIsCreatingNewProductInline}
              setActiveItemIndexForProductCreation={setActiveItemIndexForProductCreation}
              setNewProductFormInline={setNewProductFormInline}
              fetchSupplierPurchases={fetchSupplierPurchases}
              fetchSupplierMetrics={fetchSupplierMetrics}
              setSelectedPurchaseId={setSelectedPurchaseId}
              showToast={showToast}
              receivingForm={receivingForm}
              setReceivingForm={setReceivingForm}
              selectedPurchase={selectedPurchase}
              setIsReceivingShipment={setIsReceivingShipment}
              fetchSupplierPurchaseDetailsData={fetchSupplierPurchaseDetailsData}
              paymentForm={paymentForm}
              setPaymentForm={setPaymentForm}
              setIsRecordingSupplierPayment={setIsRecordingSupplierPayment}
              fetchCashAccounts={fetchCashAccounts}
              supplierMetrics={supplierMetrics}
              supplierPurchasesSearch={supplierPurchasesSearch}
              setSupplierPurchasesSearch={setSupplierPurchasesSearch}
              supplierPurchasesLoading={supplierPurchasesLoading}
              supplierPurchases={supplierPurchases}
              supplierPurchasesPage={supplierPurchasesPage}
              supplierPurchasesTotalPages={supplierPurchasesTotalPages}
              supplierPurchasesTotal={supplierPurchasesTotal}
              setSupplierPurchasesPage={setSupplierPurchasesPage}
              selectedPurchaseId={selectedPurchaseId}
              API_BASE_URL={API_BASE_URL}
              user={user}
              updateSupplierPurchaseStatus={updateSupplierPurchaseStatus}
            />
          )}

          {/* 7. CUSTOMERS TAB */}
          {adminTab === 'customers' && (
            <AdminCustomersTab
              customersSearchQuery={customersSearchQuery}
              setCustomersSearchQuery={setCustomersSearchQuery}
              customersLoading={customersLoading}
              customersList={customersList}
              customersPage={customersPage}
              customersTotalPages={customersTotalPages}
              customersTotal={customersTotal}
              setCustomersPage={setCustomersPage}
            />
          )}

          {/* 8. REPORTS TAB */}
          {adminTab === 'reports' && (
            <AdminReportsTab
              reportsSubTab={reportsSubTab}
              setReportsSubTab={setReportsSubTab}
              cashAccounts={cashAccounts}
              setCashAccountForm={setCashAccountForm}
              setIsAddingCashAccount={setIsAddingCashAccount}
              setCashAdjustmentForm={setCashAdjustmentForm}
              setIsAdjustingCash={setIsAdjustingCash}
              setSettlementForm={setSettlementForm}
              setIsAddingSettlement={setIsAddingSettlement}
              splitsData={splitsData}
              setFounderLedgerForm={setFounderLedgerForm}
              setIsReimbursing={setIsReimbursing}
              founderLedger={founderLedger}
            />
          )}

          {/* 9. NOTIFICATIONS TAB */}
          {adminTab === 'notifications' && (
            <AdminNotificationsTab
              notifications={notifications}
              handleMarkNotificationsRead={handleMarkNotificationsRead}
              handleDeleteNotification={handleDeleteNotification}
              hasMoreNotifications={hasMoreNotifications}
              loadMoreNotifications={loadMoreNotifications}
            />
          )}

          {/* 10. SETTINGS TAB */}
          {adminTab === 'settings' && (
            <AdminSettingsTab
              dropSettingsForm={dropSettingsForm}
              setDropSettingsForm={setDropSettingsForm}
              handleUpdateGlobalSettings={handleUpdateGlobalSettings}
              globalSettings={globalSettings}
            />
          )}

          {/* 11. DIAGNOSTICS TAB */}
          {adminTab === 'diagnostics' && (
            <AdminDiagnosticsTab
              diagnosticsSubTab={diagnosticsSubTab}
              setDiagnosticsSubTab={setDiagnosticsSubTab}
              healthStatus={healthStatus}
              perfLoading={perfLoading}
              perfStats={perfStats}
              telemetrySearch={telemetrySearch}
              setTelemetrySearch={setTelemetrySearch}
              telemetryFilter={telemetryFilter}
              setTelemetryFilter={setTelemetryFilter}
              handleClearErrors={handleClearErrors}
              telemetryErrors={telemetryErrors}
              handleAcknowledgeError={handleAcknowledgeError}
              telemetryPage={telemetryPage}
              telemetryTotalPages={telemetryTotalPages}
              setTelemetryPage={setTelemetryPage}
              auditLogsSearch={auditLogsSearch}
              setAuditLogsSearch={setAuditLogsSearch}
              auditLogsCategory={auditLogsCategory}
              setAuditLogsCategory={setAuditLogsCategory}
              auditLogs={auditLogs}
            />
          )}


        </main>
      </div>

      {/* ── MODALS COMPLEMENTS ─────────────────────────────────────────── */}
      
      {/* 1. View screenshot Receipt modal */}
      {activeScreenshotOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl">
            {/* Top accent bar */}
            <div className="h-[2px] bg-gradient-to-r from-[#ff5500]/20 via-[#ff5500] to-[#ff5500]/20" />

            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-start justify-between gap-3">
              <div>
                <span className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest bg-[#ff5500]/10 border border-[#ff5500]/20 px-2 py-0.5 rounded">
                  UPI Payment Receipt
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-2">{activeScreenshotOrder.orderRef}</h3>
                <span className={`text-[8px] font-black uppercase tracking-widest mt-1 inline-block ${
                  activeScreenshotOrder.status === 'Verification Pending' ? 'text-amber-400' :
                  activeScreenshotOrder.status === 'Confirmed' ? 'text-emerald-400' : 'text-white/50'
                }`}>{activeScreenshotOrder.status}</span>
              </div>
              <button
                onClick={() => setActiveScreenshotOrder(null)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-[#888888] hover:text-white flex items-center justify-center text-xs flex-shrink-0 cursor-pointer border border-white/5"
              >
                ✕
              </button>
            </div>

            {/* Screenshot image */}
            <div className="p-4">
              <div className="aspect-[3/4] bg-[#090909] border border-white/5 rounded-xl overflow-hidden relative max-h-[55vh]">
                <img
                  src={activeScreenshotOrder.url}
                  alt="Receipt screenshot"
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<span class="text-[#888888] text-xs font-bold absolute inset-0 flex items-center justify-center">Image failed to stream or has expired.</span>`;
                  }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-4 pb-5 space-y-2">
              {activeScreenshotOrder.status === 'Verification Pending' && (
                <button
                  onClick={async () => {
                    if (!confirm('Confirm this payment and approve the order?')) return;
                    try {
                      const res = await fetch(`${API_BASE_URL}/admin/orders/${activeScreenshotOrder.orderId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ status: 'Confirmed' })
                      });
                      if (!res.ok) throw new Error('Failed to confirm order');
                      setActiveScreenshotOrder(null);
                      await loadAllData();
                    } catch (err) {
                      showToast(err.message, "error");
                    }
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition-all shadow-[0_4px_20px_-4px_rgba(52,211,153,0.4)] cursor-pointer"
                >
                  ✓ Approve Payment & Confirm Order
                </button>
              )}
              {activeScreenshotOrder.status === 'Verification Pending' && (
                <button
                  onClick={async () => {
                    if (!confirm('Reject this payment and cancel the order? This will release the reserved stock.')) return;
                    try {
                      const res = await fetch(`${API_BASE_URL}/admin/orders/${activeScreenshotOrder.orderId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ status: 'Cancelled' })
                      });
                      if (!res.ok) throw new Error('Failed to cancel order');
                      setActiveScreenshotOrder(null);
                      await loadAllData();
                    } catch (err) {
                      showToast(err.message, "error");
                    }
                  }}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider border border-red-500/20 transition-all cursor-pointer"
                >
                  ✕ Reject & Cancel Order
                </button>
              )}
              <button
                onClick={() => setActiveScreenshotOrder(null)}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-2.5 rounded-xl border border-white/10 uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add/Edit Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-5xl bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl my-8">
            <div className="h-[2px] bg-[#ff5500]" />
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {editingProductId ? 'Edit Casting Model' : 'Add New Casting'}
              </h3>
              <button onClick={() => { setIsAddingProduct(false); setEditingProductId(null); }} className="text-[#888888] hover:text-white text-xs">✕</button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto" data-lenis-prevent>
              <ProductForm 
                productId={editingProductId}
                initialData={editingProductData}
                onSave={handleSaveProduct}
                onCancel={() => { setIsAddingProduct(false); setEditingProductId(null); setEditingProductData(null); }}
                creatorEmail={user?.email}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Ship Order Modal */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl">
            <div className="h-[2px] bg-[#ff5500]" />
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dispatch Shipment details</h3>
              <button onClick={() => setShippingModalOrder(null)} className="text-[#888888] hover:text-white text-xs">✕</button>
            </div>
            <form onSubmit={handleShipOrderSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Courier Partner</label>
                <select value={shippingForm.courierPartner} onChange={e => setShippingForm(p => ({ ...p, courierPartner: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none">
                  <option value="Delhivery">Delhivery</option>
                  <option value="Bluedart">Bluedart</option>
                  <option value="DTDC">DTDC</option>
                  <option value="India Post">India Post</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Tracking Code</label>
                <input type="text" value={shippingForm.trackingNumber} onChange={e => setShippingForm(p => ({ ...p, trackingNumber: e.target.value }))} placeholder="Enter tracking code" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Shipping Cost</label>
                  <input type="number" value={shippingForm.shippingCost} onChange={e => setShippingForm(p => ({ ...p, shippingCost: Number(e.target.value) }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Packaging Cost</label>
                  <input type="number" value={shippingForm.packagingCost} onChange={e => setShippingForm(p => ({ ...p, packagingCost: Number(e.target.value) }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono" required />
                </div>
              </div>

              <button type="submit" className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider shadow-lg transition-colors cursor-pointer">
                Confirm Dispatch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Log Expense Modal */}
      {isAddingExpense && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl">
            <div className="h-[2px] bg-[#ff5500]" />
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Log Expense Details</h3>
              <button onClick={() => setIsAddingExpense(false)} className="text-[#888888] hover:text-white text-xs">✕</button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Title / Description</label>
                <input type="text" value={expenseForm.title} onChange={e => setExpenseForm(p => ({ ...p, title: e.target.value }))} placeholder="MiniGT batch purchase" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Amount</label>
                  <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} placeholder="5400" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Paid By</label>
                  <select value={expenseForm.paidBy} onChange={e => setExpenseForm(p => ({ ...p, paidBy: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none">
                    <option value="Harshal">Harshal</option>
                    <option value="Anutosh">Anutosh</option>
                    <option value="Sanchit">Sanchit</option>
                    <option value="Anish">Anish</option>
                    <option value="Company Account">Company Account</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Category</label>
                  <select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none">
                    <option value="Stock Purchase">Stock Purchase</option>
                    <option value="Shipping charges">Shipping charges</option>
                    <option value="Packaging Materials">Packaging Materials</option>
                    <option value="Software tools">Software tools</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Date</label>
                  <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono cursor-pointer" required />
                </div>
              </div>

              <button type="submit" className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider shadow-lg transition-colors cursor-pointer">
                Log Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Settlement Modal */}
      {isAddingSettlement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl">
            <div className="h-[2px] bg-[#ff5500]" />
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record Settlement Transfer</h3>
              <button onClick={() => setIsAddingSettlement(false)} className="text-[#888888] hover:text-white text-xs">✕</button>
            </div>
            <form onSubmit={handleSettlementSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">From Founder</label>
                  <select value={settlementForm.from} onChange={e => setSettlementForm(p => ({ ...p, from: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none">
                    <option value="Harshal">Harshal</option>
                    <option value="Anutosh">Anutosh</option>
                    <option value="Sanchit">Sanchit</option>
                    <option value="Anish">Anish</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">To Founder</label>
                  <select value={settlementForm.to} onChange={e => setSettlementForm(p => ({ ...p, to: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none">
                    <option value="Harshal">Harshal</option>
                    <option value="Anutosh">Anutosh</option>
                    <option value="Sanchit">Sanchit</option>
                    <option value="Anish">Anish</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Amount</label>
                  <input type="number" value={settlementForm.amount} onChange={e => setSettlementForm(p => ({ ...p, amount: e.target.value }))} placeholder="1500" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Date</label>
                  <input type="date" value={settlementForm.date} onChange={e => setSettlementForm(p => ({ ...p, date: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono cursor-pointer" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Notes / Reference</label>
                <input type="text" value={settlementForm.notes} onChange={e => setSettlementForm(p => ({ ...p, notes: e.target.value }))} placeholder="GPay transfer ref" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none" />
              </div>

              <button type="submit" className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider shadow-lg transition-colors cursor-pointer">
                Record Transfer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5b. Add Cash Account Modal */}
      {isAddingCashAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl">
            <div className="h-[2px] bg-[#ff5500]" />
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register Cash Account</h3>
              <button onClick={() => setIsAddingCashAccount(false)} className="text-[#888888] hover:text-white text-xs">✕</button>
            </div>
            <form onSubmit={handleCreateCashAccount} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Account Name</label>
                <input type="text" value={cashAccountForm.name} onChange={e => setCashAccountForm(p => ({ ...p, name: e.target.value }))} placeholder="HDFC Current Account" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Type</label>
                  <select value={cashAccountForm.type} onChange={e => setCashAccountForm(p => ({ ...p, type: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none">
                    <option value="Bank">Bank Account</option>
                    <option value="UPI">UPI Endpoint</option>
                    <option value="Cash Drawer">Cash Drawer</option>
                    <option value="Petty Cash">Petty Cash</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Opening Balance</label>
                  <input type="number" value={cashAccountForm.openingBalance} onChange={e => setCashAccountForm(p => ({ ...p, openingBalance: Number(e.target.value) }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Description / Notes</label>
                <input type="text" value={cashAccountForm.description} onChange={e => setCashAccountForm(p => ({ ...p, description: e.target.value }))} placeholder="Primary banking account for deposits" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none" />
              </div>

              <button type="submit" className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider shadow-lg transition-colors cursor-pointer">
                Register Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5c. Record Founder Capital transaction Modal */}
      {isAddingFounderTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl">
            <div className="h-[2px] bg-[#ff5500]" />
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record Founder capital event</h3>
              <button onClick={() => setIsAddingFounderTx(false)} className="text-[#888888] hover:text-white text-xs">✕</button>
            </div>
            <form onSubmit={handleFounderTxSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Founder</label>
                  <select value={founderTxForm.founderName} onChange={e => setFounderTxForm(p => ({ ...p, founderName: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none">
                    <option value="Harshal">Harshal</option>
                    <option value="Anutosh">Anutosh</option>
                    <option value="Sanchit">Sanchit</option>
                    <option value="Anish">Anish</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Transaction Type</label>
                  <select value={founderTxForm.type} onChange={e => setFounderTxForm(p => ({ ...p, type: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none">
                    <option value="contribution">Capital Contribution</option>
                    <option value="reimburse">Reimbursement Withdrawal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Amount</label>
                  <input type="number" value={founderTxForm.amount} onChange={e => setFounderTxForm(p => ({ ...p, amount: e.target.value }))} placeholder="5000" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Cash Account</label>
                  <select value={founderTxForm.cashAccountId} onChange={e => setFounderTxForm(p => ({ ...p, cashAccountId: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none">
                    {cashAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Date</label>
                  <input type="date" value={founderTxForm.date} onChange={e => setFounderTxForm(p => ({ ...p, date: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Reason / Head</label>
                  <input type="text" value={founderTxForm.reason} onChange={e => setFounderTxForm(p => ({ ...p, reason: e.target.value }))} placeholder="Cash pool injection" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Additional Notes</label>
                <input type="text" value={founderTxForm.notes} onChange={e => setFounderTxForm(p => ({ ...p, notes: e.target.value }))} placeholder="UPI reference or details" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none" />
              </div>

              <button type="submit" className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider shadow-lg transition-colors cursor-pointer">
                Submit Transaction
              </button>
            </form>
          </div>
        </div>
      )}

    {/* ── RECEIPT MODAL ─────────────────────────────────────── */}
    {(typeof receiptOrderId !== 'undefined' && receiptOrderId || typeof selectedReceipt !== 'undefined' && selectedReceipt) ? (
      <ReceiptModal
        orderId={typeof receiptOrderId !== 'undefined' ? receiptOrderId : null}
        receiptData={typeof selectedReceipt !== 'undefined' ? selectedReceipt : null}
        apiBaseUrl={API_BASE_URL}
        onClose={() => {
          if (typeof setReceiptOrderId === 'function') setReceiptOrderId(null);
          if (typeof setSelectedReceipt === 'function') setSelectedReceipt(null);
        }}
      />
    ) : null}

    {/* ── EDIT ORDER MODAL ───────────────────────── */}
    {editingOrder && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div className="w-full max-w-md bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl">
          <div className="h-[2px] bg-[#ff5500]" />
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Order details</h3>
            <button onClick={() => setEditingOrder(null)} className="text-[#888888] hover:text-white text-xs">✕</button>
          </div>
          <form onSubmit={handleEditOrderSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-4 text-xs" data-lenis-prevent="true">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Total Price (₹)</label>
                <input
                  type="number"
                  value={orderForm.totalPrice}
                  onChange={e => setOrderForm(p => ({ ...p, totalPrice: Number(e.target.value) }))}
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Status</label>
                <select
                  value={orderForm.status}
                  onChange={e => setOrderForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
                  required
                >
                  <option value="Verification Pending">Verification Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Advance Paid (₹)</label>
                <input
                  type="number"
                  value={orderForm.advanceAmount}
                  onChange={e => setOrderForm(p => ({ ...p, advanceAmount: Number(e.target.value) }))}
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Remaining Due (₹)</label>
                <input
                  type="number"
                  value={orderForm.remainingAmount}
                  onChange={e => setOrderForm(p => ({ ...p, remainingAmount: Number(e.target.value) }))}
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Shipping Destination Address</label>
              <textarea
                value={orderForm.shippingAddress}
                onChange={e => setOrderForm(p => ({ ...p, shippingAddress: e.target.value }))}
                rows={2}
                className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
              />
            </div>

            <div className="border-t border-white/5 pt-4">
              <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-3">Courier & Tracking Details</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Courier Partner</label>
                  <select
                    value={orderForm.courierPartner}
                    onChange={e => setOrderForm(p => ({ ...p, courierPartner: e.target.value }))}
                    className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
                  >
                    <option value="Delhivery">Delhivery</option>
                    <option value="Bluedart">Bluedart</option>
                    <option value="DTDC">DTDC</option>
                    <option value="India Post">India Post</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Tracking Code</label>
                  <input
                    type="text"
                    value={orderForm.trackingNumber}
                    onChange={e => setOrderForm(p => ({ ...p, trackingNumber: e.target.value }))}
                    className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Shipping Cost (₹)</label>
                <input
                  type="number"
                  value={orderForm.shippingCost}
                  onChange={e => setOrderForm(p => ({ ...p, shippingCost: Number(e.target.value) }))}
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">Packaging Cost (₹)</label>
                <input
                  type="number"
                  value={orderForm.packagingCost}
                  onChange={e => setOrderForm(p => ({ ...p, packagingCost: Number(e.target.value) }))}
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#ff5500] hover:bg-[#ff6611] disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider shadow-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Saving Updates...' : 'Save Order Changes'}
            </button>
          </form>
        </div>
      </div>
    )}

    {/* ── COLLECT REMAINING PAYMENT MODAL ─────────────────── */}
    {collectRemainingOrder && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div className="w-full max-w-md bg-[#0f0f0f] border border-amber-500/20 rounded-2xl p-6 space-y-5 shadow-[0_0_80px_-15px_rgba(251,191,36,0.2)]">
          <div className="h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20 -mx-6 -mt-6 rounded-t-2xl" />
          <div>
            <div className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Pre-Order Payment</div>
            <h3 className="text-sm font-black text-white mt-1">Collect Remaining Balance</h3>
            <p className="text-[10px] text-white/50 mt-1">
              Upload the payment screenshot for the remaining ₹{Number(collectRemainingOrder.remainingAmount).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">
              Payment Screenshot
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCollectRemainingFile(e.target.files[0])}
              className="w-full text-xs text-white/70 file:mr-3 file:bg-amber-500/10 file:border file:border-amber-500/30 file:text-amber-400 file:font-bold file:text-[10px] file:px-3 file:py-1.5 file:rounded-lg file:uppercase file:tracking-wider file:cursor-pointer cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!collectRemainingFile) {
                  showToast('Please select a screenshot file first.', 'warning');
                  return;
                }
                setCollectRemainingLoading(true);
                try {
                  const formData = new FormData();
                  formData.append('file', collectRemainingFile);
                  const res = await fetch(`${API_BASE_URL}/admin/orders/${collectRemainingOrder.id}/collect-remaining`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Failed.');
                  }
                  showToast('Remaining payment recorded successfully!', 'success');
                  setCollectRemainingOrder(null);
                  setCollectRemainingFile(null);
                  await loadAllData();
                } catch (e) {
                  showToast('Error: ' + e.message, 'error');
                } finally {
                  setCollectRemainingLoading(false);
                }
              }}
              disabled={collectRemainingLoading || !collectRemainingFile}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold text-[10px] py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
            >
              {collectRemainingLoading ? 'Submitting...' : 'Submit Payment Screenshot'}
            </button>
            <button
              onClick={() => { setCollectRemainingOrder(null); setCollectRemainingFile(null); }}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center border border-white/5 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    )}




      {/* Create New Supplier Inline Modal */}
      {isCreatingNewSupplier && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl">
            <div className="h-[2px] bg-[#ff5500]" />
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create New Supplier Profile</h3>
              <button onClick={() => setIsCreatingNewSupplier(false)} className="text-[#888888] hover:text-white text-xs">✕</button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newSupplierForm.name.trim()) return;
              try {
                const res = await createSupplier(newSupplierForm);
                showToast(`Supplier ${res.name} added successfully`, "success");
                setIsCreatingNewSupplier(false);
                fetchSuppliersList();
                setPurchaseForm(p => ({ ...p, supplierId: res.id }));
              } catch (err) {
                showToast("Failed to create supplier profile", "error");
              }
            }} className="p-6 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase block">Supplier Name / Business</label>
                <input
                  type="text"
                  value={newSupplierForm.name}
                  onChange={(e) => setNewSupplierForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Diecast Distributors India"
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase block">Email Address</label>
                <input
                  type="email"
                  value={newSupplierForm.contactEmail}
                  onChange={(e) => setNewSupplierForm(p => ({ ...p, contactEmail: e.target.value }))}
                  placeholder="billing@ddi.com"
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase block">Contact Phone</label>
                <input
                  type="text"
                  value={newSupplierForm.contactPhone}
                  onChange={(e) => setNewSupplierForm(p => ({ ...p, contactPhone: e.target.value }))}
                  placeholder="+91 99988 88877"
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase block">Warehouse / Office Address</label>
                <textarea
                  value={newSupplierForm.address}
                  onChange={(e) => setNewSupplierForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Registered corporate address details..."
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none h-16 resize-none"
                />
              </div>

              <button type="submit" className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer border-none text-[10px]">
                Create Supplier Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create New Product Inline Modal */}
      {isCreatingNewProductInline && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl">
            <div className="h-[2px] bg-[#ff5500]" />
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Create Product Casting</h3>
              <button onClick={() => { setIsCreatingNewProductInline(false); setActiveItemIndexForProductCreation(null); }} className="text-[#888888] hover:text-white text-xs">✕</button>
            </div>
            
            <form onSubmit={handleCreateProductInlineSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase block">SKU / Barcode ID (Unique)</label>
                <input
                  type="text"
                  value={newProductFormInline.sku}
                  onChange={(e) => setNewProductFormInline(p => ({ ...p, sku: e.target.value }))}
                  placeholder="e.g. HW-911-RED"
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase block">Brand / Make</label>
                  <input
                    type="text"
                    value={newProductFormInline.brand}
                    onChange={(e) => setNewProductFormInline(p => ({ ...p, brand: e.target.value }))}
                    placeholder="e.g. Hot Wheels"
                    className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase block">Scale</label>
                  <input
                    type="text"
                    value={newProductFormInline.scale}
                    onChange={(e) => setNewProductFormInline(p => ({ ...p, scale: e.target.value }))}
                    placeholder="e.g. 1:64"
                    className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase block">Product / Model Name</label>
                <input
                  type="text"
                  value={newProductFormInline.name}
                  onChange={(e) => setNewProductFormInline(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Porsche 911 GT3 RS"
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase block">Unit Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={newProductFormInline.purchasePrice}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      setNewProductFormInline(p => ({
                        ...p,
                        purchasePrice: cost,
                        price: p.price || Math.round(cost * 1.3)
                      }));
                    }}
                    placeholder="0.00"
                    className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase block">Unit Selling Price (₹)</label>
                  <input
                    type="number"
                    value={newProductFormInline.price}
                    onChange={(e) => setNewProductFormInline(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 bg-[#141414]/40 border border-white/5 p-4 rounded-xl">
                <label className="text-[10px] font-bold text-[#888888] uppercase block mb-2">Applicable Casings</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-1.5 text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newProductFormInline.casingTypes?.includes('box')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNewProductFormInline(p => {
                          const current = p.casingTypes || [];
                          const updated = checked 
                            ? [...current, 'box'] 
                            : current.filter(x => x !== 'box');
                          return { ...p, casingTypes: updated.length > 0 ? updated : ['box'] };
                        });
                      }}
                      className="accent-[#ff5500]"
                    />
                    <span className="text-xs">Box</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newProductFormInline.casingTypes?.includes('blister')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNewProductFormInline(p => {
                          const current = p.casingTypes || [];
                          const updated = checked 
                            ? [...current, 'blister'] 
                            : current.filter(x => x !== 'blister');
                          return { ...p, casingTypes: updated };
                        });
                      }}
                      className="accent-[#ff5500]"
                    />
                    <span className="text-xs">Blister</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newProductFormInline.casingTypes?.includes('acrylic casing')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNewProductFormInline(p => {
                          const current = p.casingTypes || [];
                          const updated = checked 
                            ? [...current, 'acrylic casing'] 
                            : current.filter(x => x !== 'acrylic casing');
                          return { ...p, casingTypes: updated };
                        });
                      }}
                      className="accent-[#ff5500]"
                    />
                    <span className="text-xs">Acrylic</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase block">Series / Tag (Optional)</label>
                <input
                  type="text"
                  value={newProductFormInline.series}
                  onChange={(e) => setNewProductFormInline(p => ({ ...p, series: e.target.value }))}
                  placeholder="e.g. Boulevard 2026"
                  className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer border-none text-[10px]">
                Create Catalog Listing
              </button>
            </form>
          </div>
        </div>
      )}



      {/* Sleek Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-[#111111] border border-white/5 rounded-2xl px-5 py-4 shadow-2xl animate-fade-in max-w-sm">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${
            toast.type === 'error' 
              ? 'bg-red-500/10 text-red-500' 
              : toast.type === 'warning'
              ? 'bg-[#ff5500]/10 text-[#ff5500]'
              : 'bg-emerald-500/10 text-emerald-500'
          }`}>
            {toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : '✓'}
          </div>
          <div className="text-left">
            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              {toast.type === 'error' ? 'Error' : toast.type === 'warning' ? 'Warning' : 'Success'}
            </div>
            <div className="text-xs font-bold text-white mt-0.5">{toast.message}</div>
          </div>
        </div>
      )}

  </div>
  );
}
