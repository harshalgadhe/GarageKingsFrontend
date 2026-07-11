import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Trash2, Edit2, Save, X, Settings, Eye, EyeOff, LogOut, User, Search, RefreshCw,
  DollarSign, TrendingUp, Bell, FileText, Users, AlertTriangle, Layers, Calendar, Receipt,
  Activity, Server, Shield, Truck
} from 'lucide-react';
import { getCurrentUser, signOutCognito } from '../lib/auth';
import { 
  getCars, addCar, updateCar, deleteCar, uploadImageToStorage, getGlobalSettings, updateGlobalSettings,
  getReceipts, addReceipt, deleteReceipt,
  getSuppliers, createSupplier, getSupplierPurchases, getSupplierPurchaseDetails, addSupplierPurchase,
  recordSupplierPayment, receiveSupplierShipment, updateSupplierPurchaseStatus, getSupplierMetrics
} from '../lib/db';
import Navigation from '../components/Navigation';
import ReceiptModal from '../components/ReceiptModal';
import BookPurchaseForm from '../components/BookPurchaseForm';
import ReceiveShipmentForm from '../components/ReceiveShipmentForm';
import RecordPaymentForm from '../components/RecordPaymentForm';
import MasterData from './admin/MasterData';
import ProductForm from '../components/admin/ProductForm';

const Pagination = ({ currentPage, totalPages, totalItems, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-white/5">
      <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">
        Showing Page {currentPage} of {totalPages} {totalItems ? `(${totalItems} Total)` : ''}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500]'
                      : 'border-white/5 bg-transparent text-[#888888] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
            if (pageNum === 2 || pageNum === totalPages - 1) {
              return (
                <span key={pageNum} className="text-[#555555] text-xs px-0.5 font-mono">
                  ...
                </span>
              );
            }
            return null;
          })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState('');
  
  // Tab controller (Exactly 8 modules)
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard', 'inventory', 'orders', 'expenses', 'finance', 'analytics', 'notifications', 'settings'

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

  // Invoices & Telemetry state
  const [receiptsList, setReceiptsList] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isCreatingReceipt, setIsCreatingReceipt] = useState(false);
  const [previewInvoiceData, setPreviewInvoiceData] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'error' | 'warning' }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };
  const [expandedLogs, setExpandedLogs] = useState({});
  const [activeSearchIdx, setActiveSearchIdx] = useState(null);
  const [itemSearchQueries, setItemSearchQueries] = useState({});
  const [manualReceiptForm, setManualReceiptForm] = useState({
    receiptNumber: '',
    customerName: '',
    customerPhone: '',
    customerInstagram: '',
    customerAddress: '',
    shippingCharges: 0,
    advancePaid: 0,
    formatType: 'standard',
    footerNote: 'Thank you for choosing Garage Kings!',
    items: [{ productId: '', description: '', qty: 1, unitPrice: 0, maxQty: 0 }]
  });

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
          if (isUserAdmin) {
            triggerTabFetch(adminTab);
          }
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
      const res = await fetch(`${API_BASE_URL}/settings`, { credentials: 'include' });
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
      fetchKPIs();
      fetchNotifications();
    } else if (tab === 'inventory') {
      fetchInventory(inventoryPage, inventorySearchQuery);
      fetchSettings();
    } else if (tab === 'orders') {
      fetchOrders(ordersPage, orderSearchQuery, orderFilter);
    } else if (tab === 'receipts') {
      fetchReceipts(receiptsPage, receiptsSearch);
    } else if (tab === 'expenses') {
      fetchExpenses(expensesPage, expensesSearch);
    } else if (tab === 'finance') {
      fetchKPIs();
      fetchCashAccounts();
      fetchFounderLedger();
      fetchLedger();
      fetchSplits();
    } else if (tab === 'diagnostics') {
      fetchDiagnosticsData();
    } else if (tab === 'settings') {
      fetchSettings();
      fetchCMS();
    } else if (tab === 'notifications') {
      fetchNotifications();
    } else if (tab === 'supplier_purchases') {
      fetchSupplierPurchases(supplierPurchasesPage, supplierPurchasesSearch);
      fetchSupplierMetrics();
      fetchSuppliersList();
      fetchCatalogList();
      if (selectedPurchaseId) {
        fetchSupplierPurchaseDetailsData(selectedPurchaseId);
      }
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

  const fetchInventory = async (page, search) => {
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

  const fetchReceipts = async (page, search) => {
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

  // Debounced search logic for all inputs
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthenticated && isAdmin) {
        if (adminTab === 'inventory') {
          setInventoryPage(1);
          fetchInventory(1, inventorySearchQuery);
        } else if (adminTab === 'orders') {
          setOrdersPage(1);
          fetchOrders(1, orderSearchQuery, orderFilter);
        } else if (adminTab === 'receipts') {
          setReceiptsPage(1);
          fetchReceipts(1, receiptsSearch);
        } else if (adminTab === 'expenses') {
          setExpensesPage(1);
          fetchExpenses(1, expensesSearch);
        } else if (adminTab === 'supplier_purchases') {
          setSupplierPurchasesPage(1);
          fetchSupplierPurchases(1, supplierPurchasesSearch);
        } else if (adminTab === 'diagnostics') {
          if (diagnosticsSubTab === 'errors') {
            setTelemetryPage(1);
            fetchTelemetryErrors(1, telemetrySearch, telemetryFilter);
          } else if (diagnosticsSubTab === 'audit') {
            setAuditLogsPage(1);
            fetchAuditLogs(1, auditLogsSearch, auditLogsCategory);
          }
        }
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [inventorySearchQuery, orderSearchQuery, receiptsSearch, expensesSearch, telemetrySearch, auditLogsSearch, supplierPurchasesSearch]);

  // Tab and page state change triggers
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      triggerTabFetch(adminTab);
    }
  }, [adminTab, inventoryPage, ordersPage, orderFilter, receiptsPage, expensesPage, telemetryPage, telemetryFilter, auditLogsPage, auditLogsCategory, supplierPurchasesPage, selectedPurchaseId]);


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

  const handleSaveProduct = async (payload) => {
    try {
      if (editingProductId) {
        await updateCar(editingProductId, payload);
      } else {
        await addCar(payload);
      }
      setIsAddingProduct(false);
      setEditingProductId(null);
      fetchInventory(inventoryPage, inventorySearchQuery);
      showToast(editingProductId ? "Product updated successfully!" : "Product created successfully!", "success");
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
      const payload = {
        ...productForm,
        totalStock: Number(productForm.availableStock) + Number(productForm.lockedStock || 0) + Number(productForm.soldStock || 0)
      };
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
      const res = await fetch(`${API_BASE_URL}/products/${car.id}`, { credentials: 'include' });
      if (res.ok) {
        const fullProduct = await res.json();
        setEditingProductData(fullProduct);
        setEditingProductId(car.id);
        setIsAddingProduct(true);
      } else {
        showToast("Failed to load product details.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading product details: " + err.message, "error");
    } finally {
      setLoadingProductId(null);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to archive this casting?')) return;
    setIsArchivingProductId(id);
    try {
      await deleteCar(id);
      await fetchInventory(inventoryPage, inventorySearchQuery);
      showToast("Product archived successfully!", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsArchivingProductId(null);
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
      <div className="min-h-screen bg-[#090909] text-white flex justify-center items-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#ff5500]/20 border-t-[#ff5500] animate-spin" />
          <div className="text-xs uppercase tracking-widest text-[#ff5500] font-black animate-pulse">Launching Admin Console...</div>
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
    <div className="min-h-screen bg-[#090909] text-white font-sans flex flex-col selection:bg-[#ff5500] selection:text-black">
      <Navigation activeSection="garage" />

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto px-4 md:px-8 py-24 gap-8">
        
        {/* Left Side Dashboard Nav */}
        <aside className="lg:w-64 flex-shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 bg-[#111111] border border-white/5 rounded-2xl p-3 h-fit lg:sticky lg:top-24 scrollbar-none">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'inventory', label: 'Inventory', icon: Layers },
            { id: 'master_data', label: 'Master Data', icon: Server },
            { id: 'supplier_purchases', label: 'Supplier Orders', icon: Truck },
            { id: 'orders', label: 'Orders', icon: FileText, badge: pendingOrdersCount },
            { id: 'receipts', label: 'Invoices', icon: Receipt },
            { id: 'expenses', label: 'Expenses', icon: DollarSign },
            { id: 'finance', label: 'Founder Splits', icon: DollarSign },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'notifications', label: 'Alerts', icon: Bell, badge: notifications.length },
            { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const active = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap lg:w-full cursor-pointer border ${
                  active 
                    ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500] shadow-[0_0_15px_-5px_rgba(255,85,0,0.15)]' 
                    : 'border-transparent text-[#888888] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="bg-[#ff5500] text-black font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
          
          <div className="hidden lg:block border-t border-white/5 my-3" />
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all lg:w-full cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </aside>

        {/* Right Side Content Panel */}
        <main className="flex-1 min-w-0 bg-[#111111]/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl relative">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
            <div>
              <p className="text-[10px] font-bold text-[#ff5500] uppercase tracking-widest">
                Admin Console • {adminTab}
              </p>
              <h1 className="text-2xl font-black uppercase tracking-wide text-white mt-1">
                Vault Console
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-[#888888] uppercase tracking-widest font-mono">
                SECURE SESSION ACTIVE
              </span>
            </div>
          </div>

          {/* MASTER DATA TAB */}
          {adminTab === 'master_data' && (
            <MasterData />
          )}

          {/* 1. DASHBOARD TAB */}
          {adminTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Financial KPI Cards */}
              {!kpis ? (
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-8 text-center space-y-4">
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Financial Performance Metrics
                    </h3>
                    <p className="text-xs text-[#888888] leading-relaxed">
                      Perform database aggregations to retrieve total revenue, expenses, profit/loss, and inventory asset value.
                    </p>
                  </div>
                  <button
                    onClick={fetchKPIs}
                    disabled={kpisLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff5500] hover:bg-[#ff6611] active:bg-[#e64d00] disabled:bg-[#ff5500]/50 text-black font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all shadow-[0_4px_20px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
                  >
                    {kpisLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Calculating KPIs...
                      </>
                    ) : (
                      'Load KPI Metrics'
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white/40">
                      Financial KPIs (On-Demand)
                    </h3>
                    <button 
                      onClick={fetchKPIs}
                      disabled={kpisLoading}
                      className="text-[10px] font-black text-[#ff5500] hover:underline uppercase tracking-widest bg-transparent border-none cursor-pointer"
                    >
                      {kpisLoading ? 'Recalculating...' : 'Refresh KPIs'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    {[
                      { label: 'Total Revenue', val: kpis.revenue, color: 'text-white' },
                      { label: 'Total Expenses', val: kpis.expenses, color: 'text-white' },
                      { label: 'Net profit / loss', val: kpis.profit, color: kpis.profit >= 0 ? 'text-emerald-400' : 'text-red-400' },
                      { label: 'Pending Payments', val: kpis.pendingPayments, color: 'text-amber-400' },
                      { label: 'Inventory asset value', val: kpis.inventoryValue, color: 'text-[#ff5500]' }
                    ].map((kpi, i) => (
                      <div key={i} className="bg-[#141414] border border-white/5 rounded-2xl p-5 shadow-sm">
                        <p className="text-[9px] font-bold text-[#888888] uppercase tracking-widest">
                          {kpi.label}
                        </p>
                        <h3 className={`text-xl font-black mt-2 font-mono ${kpi.color}`}>
                          ₹{kpi.val.toLocaleString('en-IN')}
                        </h3>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alert Feed Widget */}
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Critical System Notifications
                    </h3>
                    <button onClick={() => setAdminTab('notifications')} className="text-[9px] font-bold text-[#ff5500] uppercase tracking-wider hover:underline bg-transparent border-0 cursor-pointer">
                      View All
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto" data-lenis-prevent>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#888888]">No critical updates.</p>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div key={n.id} className="flex gap-3 text-xs border-b border-white/5 pb-2">
                          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                          <div>
                            <span className="font-bold text-white block">{n.title}</span>
                            <span className="text-[#888888]">{n.message}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. INVENTORY TAB */}
          {adminTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Grails Inventory Catalog
                </h3>
                <button
                  onClick={() => {
                    setProductForm({ name: '', brand: '', price: '', scale: '1:64', lane: 'Standard Edition', totalStock: 10, availableStock: 10, lockedStock: 0, soldStock: 0, description: '', image: '', category: 'JDM', purchasePrice: '', maxQtyPerCustomer: '', hasLimit: false, casingTypes: ['box'] });
                    setEditingProductId(null);
                    setIsAddingProduct(true);
                  }}
                  className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_15px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
                >
                  <Plus size={14} /> Add Casting
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 w-full max-w-md">
                <Search size={14} className="text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search castings by name, SKU, brand, or category..."
                  value={inventorySearchQuery}
                  onChange={(e) => setInventorySearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
                />
              </div>

              {/* Table list */}
              <div className="overflow-x-auto border border-white/5 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#141414] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                      <th className="p-4 font-bold">Casting</th>
                      <th className="p-4 font-bold">SKU</th>
                      <th className="p-4 font-bold">Cost / Sale</th>
                      <th className="p-4 font-bold text-center">Available Stock</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCars.map(car => {
                      const isLowStock = Number(car.availableStock) <= 3;
                      return (
                        <tr 
                          key={car.id} 
                          className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                            isLowStock ? 'bg-[#ff5500]/5 hover:bg-[#ff5500]/10' : ''
                          }`}
                        >
                          <td className="p-4 flex items-center gap-3">
                            <img src={car.image || '/vault-1.png'} className="w-10 h-8 object-cover rounded border border-white/5" />
                            <div>
                              <span className="font-bold text-white block">{car.name}</span>
                              <span className="text-[10px] text-[#888888] uppercase tracking-wider">{car.brand} • {car.category} • {Array.isArray(car.casing_types || car.casingTypes) ? (car.casing_types || car.casingTypes).join(', ') : 'box'}{car.maxQtyPerCustomer ? ` • Limit: ${car.maxQtyPerCustomer}` : ''}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-[#888888]">{car.sku}</td>
                          <td className="p-4 font-mono">
                            <div className="text-[#888888]">C: ₹{car.purchasePrice}</div>
                            <div className="text-white font-bold">S: ₹{car.price}</div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`font-mono font-bold ${isLowStock ? 'text-[#ff5500]' : 'text-white'}`}>
                              {car.availableStock}
                            </span>
                            {isLowStock && (
                              <span className="block text-[8px] font-black uppercase text-[#ff5500] tracking-widest mt-0.5">
                                Low Stock
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-2">
                             <button 
                               onClick={() => handleEditProduct(car)} 
                               disabled={loadingProductId !== null || isArchivingProductId !== null}
                               className="text-white hover:text-[#ff5500] p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer inline-flex disabled:opacity-40 disabled:cursor-not-allowed"
                             >
                               {loadingProductId === car.id ? <RefreshCw className="animate-spin" size={12} /> : <Edit2 size={12} />}
                             </button>
                             <button 
                               onClick={() => handleDeleteProduct(car.id)} 
                               disabled={loadingProductId !== null || isArchivingProductId !== null}
                               className="text-red-400 hover:text-red-300 p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 transition-colors border border-red-500/10 cursor-pointer inline-flex disabled:opacity-40 disabled:cursor-not-allowed"
                             >
                               {isArchivingProductId === car.id ? <RefreshCw className="animate-spin" size={12} /> : <Trash2 size={12} />}
                             </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={inventoryPage}
                totalPages={inventoryTotalPages}
                totalItems={inventoryTotal}
                onPageChange={setInventoryPage}
              />
            </div>
          )}

          {/* 3. ORDERS TAB */}
          {adminTab === 'orders' && (
            <div className="space-y-6">

              {/* ── PENDING APPROVALS BANNER ────────── */}
              {groupedOrders.filter(o => o.status === 'Verification Pending').length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                      {groupedOrders.filter(o => o.status === 'Verification Pending').length} Payment{groupedOrders.filter(o => o.status === 'Verification Pending').length > 1 ? 's' : ''} Awaiting Your Approval
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupedOrders.filter(o => o.status === 'Verification Pending').map(order => (
                      <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
                        <div className="text-xs">
                          <span className="font-mono font-black text-white text-[11px]">ORDER {order.id.slice(0, 8)}</span>
                          <span className="text-amber-300/70 mx-2">·</span>
                          <span className="text-white/70">
                            {order.items.map(item => `${item.productBrand} ${item.productName}${item.qty > 1 ? ` (x${item.qty})` : ''}`).join(', ')}
                          </span>
                          <span className="text-amber-300/70 mx-2">·</span>
                          <span className="font-mono text-gk-orange font-bold">₹{Number(order.totalPrice).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-[#888888] block mt-0.5">{order.customerName} · {order.customerEmail}</span>
                        </div>
                        {order.screenshotUrl ? (
                          <button
                            onClick={() => setActiveScreenshotOrder({
                              url: `${API_BASE_URL}/admin/orders/${order.id}/screenshot`,
                              orderId: order.id,
                              status: order.status,
                              orderRef: `ORDER ${order.id.slice(0, 8)} — ${order.items.map(item => `${item.productBrand} ${item.productName}${item.qty > 1 ? ` (x${item.qty})` : ''}`).join(', ')}`
                            })}
                            className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            View Receipt & Approve →
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-400/60 italic flex-shrink-0">Awaiting receipt upload</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── HEADER + FILTER PILLS ──────────── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Orders & Payments Pipeline</h3>
                  <p className="text-[10px] text-[#888888] mt-0.5">{groupedOrders.length} total orders</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'all', label: 'All', count: groupedOrders.length },
                    { key: 'Verification Pending', label: 'Pending', count: groupedOrders.filter(o => o.status === 'Verification Pending').length },
                    { key: 'Reserved', label: 'Reserved', count: groupedOrders.filter(o => o.status === 'Reserved').length },
                    { key: 'Confirmed', label: 'Confirmed', count: groupedOrders.filter(o => o.status === 'Confirmed').length },
                    { key: 'Shipped', label: 'Shipped', count: groupedOrders.filter(o => o.status === 'Shipped').length },
                    { key: 'Cancelled', label: 'Cancelled', count: groupedOrders.filter(o => o.status === 'Cancelled').length },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setOrderFilter(f.key)}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                        orderFilter === f.key
                          ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500]'
                          : 'bg-white/5 border-white/10 text-[#888888] hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {f.label} {f.count > 0 && <span className="opacity-60">({f.count})</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 w-full max-w-md">
                <Search size={14} className="text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search orders by customer name, ID, email, or casting..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
                />
              </div>

              {/* ── ORDER LIST ─────────────────────── */}
              <div className="space-y-4">
                {filteredGroupedOrders.length === 0 ? (
                  <div className="text-center py-12 text-[#555555] text-xs font-bold uppercase tracking-widest">
                    No orders matching criteria.
                  </div>
                ) : (
                  filteredGroupedOrders.map(order => (
                    <div key={order.id} className={`bg-[#141414] border rounded-2xl p-5 space-y-4 ${
                      order.status === 'Verification Pending' ? 'border-amber-500/20' : 'border-white/5'
                    }`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/5">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-white text-xs block">ORDER {order.id.slice(0, 8)}</span>
                            <button
                              onClick={() => handleEditOrder(order)}
                              className="text-[9px] font-black text-[#ff5500] hover:underline uppercase tracking-widest bg-transparent border-0 cursor-pointer p-0"
                            >
                              Edit Details
                            </button>
                          </div>
                          <span className="text-[10px] text-[#888888] mt-0.5 block">
                            Logged: {new Date(order.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-gk-orange font-bold text-xs">
                            ₹{Number(order.totalPrice).toLocaleString('en-IN')}
                          </span>
                          {/* Pre-order badge */}
                          {order.bookingType === 'pre_order' && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/30">
                              PRE-ORDER
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                            order.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            order.status === 'Shipped' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            order.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            order.status === 'Delivered' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                        {/* Product details */}
                        <div>
                          <p className="text-[9px] font-bold text-[#888888] uppercase tracking-wider mb-2">Castings</p>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="border-l-2 border-[#ff5500]/20 pl-2">
                                <p className="font-bold text-white">{item.productBrand} {item.productName}</p>
                                <p className="font-mono text-white/50 text-[10px]">₹{Number(item.priceAtPurchase).toLocaleString('en-IN')} × {item.qty}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div>
                          <p className="text-[9px] font-bold text-[#888888] uppercase tracking-wider">Collector Contact</p>
                          <p className="font-bold text-white mt-1">{order.customerName}</p>
                          <p className="text-[#888888] mt-0.5">{order.customerEmail}</p>
                          {order.instagramUsername && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-white/60">@{order.instagramUsername}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(order.instagramUsername);
                                  showToast('Instagram handle copied to clipboard.', 'success');
                                }}
                                className="text-[9px] font-bold text-[#ff5500] hover:underline uppercase cursor-pointer bg-transparent border-0 p-0"
                              >
                                Copy
                              </button>
                              <a
                                href={`https://instagram.com/${order.instagramUsername}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] font-bold text-[#ff5500] hover:underline uppercase"
                              >
                                Open
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Payment & Screenshot */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-[9px] font-bold text-[#888888] uppercase tracking-wider">UPI Receipt</p>
                            {order.screenshotUrl ? (
                              <button
                                onClick={() => setActiveScreenshotOrder({
                                  url: `${API_BASE_URL}/admin/orders/${order.id}/screenshot`,
                                  orderId: order.id,
                                  status: order.status,
                                  orderRef: `ORDER ${order.id.slice(0, 8)} — ${order.items.map(item => `${item.productBrand} ${item.productName}${item.qty > 1 ? ` (x${item.qty})` : ''}`).join(', ')}`
                                })}
                                className={`mt-1 border font-bold text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors inline-flex cursor-pointer ${
                                  order.status === 'Verification Pending'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                }`}
                              >
                                {order.status === 'Verification Pending' ? '⚠ View & Approve Receipt' : 'View Screenshot'}
                              </button>
                            ) : (
                              <span className="text-[#666666] italic block mt-1">No file uploaded</span>
                            )}
                          </div>
                          {/* Pre-order balance breakdown */}
                          {order.bookingType === 'pre_order' && (
                            <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5 space-y-1">
                              <div className="text-[8px] font-black text-amber-400 uppercase tracking-wider">Pre-Order Payment</div>
                              <div className="flex justify-between text-[10px]">
                                <span className="text-white/40">Advance Paid</span>
                                <span className="text-emerald-400 font-bold font-mono">₹{Number(order.advanceAmount || 0).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span className="text-white/40">Remaining Due</span>
                                <span className={`font-bold font-mono ${Number(order.remainingAmount) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {Number(order.remainingAmount) > 0
                                    ? `₹${Number(order.remainingAmount).toLocaleString('en-IN')}`
                                    : 'PAID IN FULL ✓'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs">
                          <span className="text-[#888888] block text-[9px] uppercase tracking-wider mb-1 font-bold">Shipping Destination (Locked at checkout)</span>
                          <span className="text-white font-mono">{order.shippingAddress}</span>
                        </div>
                      )}

                      {/* Ship Details if shipped */}
                      {(order.status === 'Shipped' || order.status === 'Delivered') && (
                        <div className="bg-[#1c1c1c] border border-white/5 rounded-xl p-3 text-xs font-mono grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div><span className="text-[#888888]">COURIER:</span> {order.courierPartner}</div>
                          <div><span className="text-[#888888]">TRACKING:</span> {order.trackingNumber}</div>
                          <div><span className="text-[#888888]">SHIPPING COST:</span> ₹{order.shippingCost}</div>
                        </div>
                      )}

                      {/* Order Action Buttons */}
                      {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                          {order.status === 'Verification Pending' && (
                            <button
                              onClick={() => handleConfirmOrder(order.id)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Approve Payment
                            </button>
                          )}
                          {/* Pre-order: collect remaining payment */}
                          {order.bookingType === 'pre_order' && Number(order.remainingAmount) > 0 && (
                            <>
                              <button
                                onClick={() => setCollectRemainingOrder({ id: order.id, remainingAmount: order.remainingAmount })}
                                className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                Collect Remaining ₹{Number(order.remainingAmount).toLocaleString('en-IN')}
                              </button>

                              {order.status === 'Pre-Order' && (
                                <button
                                  onClick={async () => {
                                    if (!confirm('Request remaining payment from the customer? This will notify them to pay the remaining balance.')) return;
                                    const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ status: 'Awaiting Stock' })
                                    });
                                    if (res.ok) fetchOrders(ordersPage, orderSearchQuery, orderFilter);
                                  }}
                                  className="bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  🔔 Request Remaining Payment
                                </button>
                              )}
                            </>
                          )}
                          {order.status === 'Confirmed' && (
                            <button
                              onClick={() => {
                                setShippingModalOrder(order);
                                setShippingForm({ courierPartner: 'Delhivery', trackingNumber: '', shippingCost: 0, packagingCost: 0, dispatchDate: new Date().toISOString().split('T')[0] });
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-black font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Dispatch Shipment
                            </button>
                          )}
                          {order.status === 'Shipped' && (
                            <button
                              onClick={async () => {
                                if (!confirm('Mark order as delivered?')) return;
                                const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ status: 'Delivered' })
                                });
                                if (res.ok) await loadAllData();
                              }}
                              className="bg-purple-500 hover:bg-purple-600 text-white font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Mark Delivered
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold text-[10px] px-4 py-2 rounded-lg border border-red-500/20 uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Cancel / Void
                          </button>
                          {/* Generate Receipt button — always visible */}
                          <button
                            onClick={() => setReceiptOrderId(order.id)}
                            className="ml-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-extrabold text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            🧾 Generate Receipt
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <Pagination
                currentPage={ordersPage}
                totalPages={ordersTotalPages}
                totalItems={ordersTotal}
                onPageChange={setOrdersPage}
              />
            </div>
          )}



          {/* Receipts / Invoices Tab */}
          {adminTab === 'receipts' && (
            <div className="space-y-6">
              {/* Header block */}
              <div className="flex justify-between items-center bg-[#141414] border border-white/5 rounded-2xl p-6">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white">Invoice Hub</h3>
                  <p className="text-[10px] text-[#888888] mt-0.5">Manage auto-generated billing records and create manual invoices.</p>
                </div>
                <button
                  onClick={() => {
                    const randomId = Math.floor(1000 + Math.random() * 9000);
                    setManualReceiptForm({
                      receiptNumber: `GK-INV-${new Date().getFullYear()}-${randomId}`,
                      customerName: '',
                      customerPhone: '',
                      customerInstagram: '',
                      customerAddress: '',
                      shippingCharges: 0,
                      advancePaid: 0,
                      formatType: 'standard',
                      footerNote: 'Thank you for choosing Garage Kings!',
                      items: [{ productId: '', description: '', qty: 1, unitPrice: 0, maxQty: 0 }]
                    });
                    setPreviewInvoiceData(null);
                    setIsCreatingReceipt(true);
                  }}
                  className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} strokeWidth={3} />
                  New Invoice
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 w-full max-w-md">
                <Search size={14} className="text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search invoices by receipt #, customer name, or phone..."
                  value={receiptsSearch}
                  onChange={(e) => setReceiptsSearch(e.target.value)}
                  className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
                />
              </div>

              {/* Invoices List */}
              <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-black/10">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-[#ff5500] uppercase font-bold">Billing Archives</span>
                </div>
                <div className="divide-y divide-white/5">
                  {receiptsList.length === 0 ? (
                    <div className="p-8 text-center text-[#888888] text-xs">No invoices found. Click "New Invoice" to create one.</div>
                  ) : (
                    receiptsList.map(rec => {
                      const totalQty = rec.items.reduce((sum, item) => sum + parseInt(item.qty, 10), 0);
                      const isPreOrder = rec.format_type === 'pre_order';
                      const balance = Number(rec.pending_balance);
                      
                      return (
                        <div key={rec.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-white">{rec.receipt_number}</span>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                balance > 0 
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                                {balance > 0 ? `Unpaid: ₹${balance}` : 'Fully Paid'}
                              </span>
                              {isPreOrder && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/20">
                                  Pre-Order
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-white/80">{rec.customer_name || 'Instagram / Walk-in Customer'}</p>
                            <div className="flex gap-3 text-[10px] text-white/40">
                              {rec.customer_phone && <span>📞 {rec.customer_phone}</span>}
                              {rec.customer_instagram && <span>📸 @{rec.customer_instagram}</span>}
                              <span>📅 {new Date(rec.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                            <div className="text-right sm:space-y-0.5">
                              <p className="text-[9px] text-white/40 uppercase font-mono">Invoice Total</p>
                              <p className="text-sm font-black text-[#ff5500] font-mono">₹{Number(rec.total_amount).toLocaleString('en-IN')}</p>
                              <p className="text-[8px] text-white/30 uppercase font-mono">{totalQty} Items</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewReceipt(rec)}
                                className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
                                title="View/Print Receipt"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Are you sure you want to delete invoice ${rec.receipt_number}?`)) return;
                                  try {
                                    await deleteReceipt(rec.id);
                                    showToast('Invoice deleted successfully', 'success');
                                    fetchReceipts(receiptsPage, receiptsSearch);
                                  } catch (err) {
                                    showToast('Failed to delete invoice', 'error');
                                  }
                                }}
                                className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
                                title="Delete Invoice"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <Pagination
                currentPage={receiptsPage}
                totalPages={receiptsTotalPages}
                totalItems={receiptsTotal}
                onPageChange={setReceiptsPage}
              />
            </div>
          )}




          {/* 5. EXPENSES TAB */}
          {adminTab === 'expenses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Expenses & Stock Purchases Ledger
                </h3>
                <button
                  onClick={() => setIsAddingExpense(true)}
                  className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_15px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
                >
                  <Plus size={14} /> Log Expense
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 w-full max-w-md">
                <Search size={14} className="text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search expenses by title, category, or notes..."
                  value={expensesSearch}
                  onChange={(e) => setExpensesSearch(e.target.value)}
                  className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
                />
              </div>

              <div className="overflow-x-auto border border-white/5 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#141414] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                      <th className="p-4 font-bold">Category & Title</th>
                      <th className="p-4 font-bold">Date Logged</th>
                      <th className="p-4 font-bold">Paid By</th>
                      <th className="p-4 font-bold text-right">Amount</th>
                      <th className="p-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-white block">{e.title}</span>
                          <span className="text-[10px] text-[#888888] uppercase tracking-widest">{e.category}</span>
                        </td>
                        <td className="p-4 text-[#888888] font-mono">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                        <td className="p-4 font-bold text-white">{e.paidBy}</td>
                        <td className="p-4 text-right font-mono font-bold text-white">₹{Number(e.amount).toLocaleString('en-IN')}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDeleteExpense(e.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 cursor-pointer">
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={expensesPage}
                totalPages={expensesTotalPages}
                totalItems={expensesTotal}
                onPageChange={setExpensesPage}
              />
            </div>
          )}

          {/* SUPPLIER PURCHASES MODULE */}
          {adminTab === 'supplier_purchases' && (
            <div className="space-y-6">
              {isAddingSupplierPurchase ? (
                <BookPurchaseForm
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
                />
              ) : isReceivingShipment ? (
                <ReceiveShipmentForm
                  receivingForm={receivingForm}
                  setReceivingForm={setReceivingForm}
                  selectedPurchase={selectedPurchase}
                  setIsReceivingShipment={setIsReceivingShipment}
                  fetchSupplierPurchases={fetchSupplierPurchases}
                  fetchSupplierPurchaseDetailsData={fetchSupplierPurchaseDetailsData}
                  fetchSupplierMetrics={fetchSupplierMetrics}
                  showToast={showToast}
                />
              ) : isRecordingSupplierPayment ? (
                <RecordPaymentForm
                  paymentForm={paymentForm}
                  setPaymentForm={setPaymentForm}
                  selectedPurchase={selectedPurchase}
                  cashAccounts={cashAccounts}
                  setIsRecordingSupplierPayment={setIsRecordingSupplierPayment}
                  fetchSupplierPurchases={fetchSupplierPurchases}
                  fetchSupplierPurchaseDetailsData={fetchSupplierPurchaseDetailsData}
                  fetchSupplierMetrics={fetchSupplierMetrics}
                  fetchCashAccounts={fetchCashAccounts}
                  showToast={showToast}
                />
              ) : (
                <>
                  {/* Supplier KPIs Metrics Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">Total Spend</span>
                  <div className="text-lg font-black font-mono text-[#ff5500] mt-1">₹{Number(supplierMetrics.totalSpend || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">Outstanding Payable</span>
                  <div className="text-lg font-black font-mono text-amber-500 mt-1">₹{Number(supplierMetrics.outstandingPayables || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">Upcoming Arrivals</span>
                  <div className="text-lg font-black font-mono text-blue-400 mt-1">{supplierMetrics.upcomingArrivals || 0} Shipments</div>
                </div>
                <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#888888]">Delayed / Late</span>
                  <div className="text-lg font-black font-mono text-red-500 mt-1">{supplierMetrics.delayedShipments || 0} Orders</div>
                </div>
              </div>

              {/* Action Bar: Search & Add Supplier Purchase */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2.5 w-full max-w-md">
                  <Search size={14} className="text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by supplier or notes..."
                    value={supplierPurchasesSearch}
                    onChange={(e) => setSupplierPurchasesSearch(e.target.value)}
                    className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsAddingSupplierPurchase(true);
                      setPurchaseForm({
                        supplierId: '',
                        purchaseDate: new Date().toISOString().split('T')[0],
                        expectedArrivalDate: '',
                        items: [{ productId: '', quantity: 1, purchasePrice: 0 }],
                        advancePaid: 0,
                        cashAccountId: '',
                        paymentMethod: 'Bank Transfer',
                        referenceNumber: '',
                        notes: ''
                      });
                    }}
                    className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_15px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
                  >
                    <Plus size={14} /> New Supplier Order
                  </button>
                </div>
              </div>

              {/* Commitments Table */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Left: Supplier Purchase Orders List */}
                <div className="xl:col-span-2 overflow-x-auto border border-white/5 rounded-2xl bg-[#0b0b0b] p-4 space-y-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#111111] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                        <th className="p-4 font-bold">Supplier & Date</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold text-right">Total Value</th>
                        <th className="p-4 font-bold text-right">Balance</th>
                        <th className="p-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierPurchasesLoading ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-[#888888] font-mono">Loading commitments...</td>
                        </tr>
                      ) : supplierPurchases.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-[#888888] font-mono">No supplier purchases logged.</td>
                        </tr>
                      ) : (
                        supplierPurchases.map(p => {
                          const isFullyPaid = p.paymentStatus === 'Fully Paid';
                          const statusColor = 
                            p.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            p.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            p.status === 'Partially Received' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                            p.status === 'In Transit' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20';

                          return (
                            <tr key={p.id} className={`border-b border-white/5 hover:bg-white/[0.01] transition-colors cursor-pointer ${selectedPurchaseId === p.id ? 'bg-white/[0.02]' : ''}`} onClick={() => setSelectedPurchaseId(p.id)}>
                              <td className="p-4">
                                <span className="font-bold text-white block">{p.supplierName}</span>
                                <span className="text-[10px] text-[#888888] font-mono">{new Date(p.purchaseDate).toLocaleDateString('en-IN')}</span>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1 items-start">
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
                                    {p.status}
                                  </span>
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.25 rounded ${isFullyPaid ? 'text-emerald-400' : 'text-amber-500'}`}>
                                    {p.paymentStatus}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-white">₹{Number(p.totalValue).toLocaleString('en-IN')}</td>
                              <td className="p-4 text-right font-mono text-[#888888]">₹{Number(p.remainingBalance).toLocaleString('en-IN')}</td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPurchaseId(p.id);
                                  }}
                                  className="text-[#ff5500] hover:underline font-bold text-[10px] uppercase tracking-wider"
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                  
                  <Pagination
                    currentPage={supplierPurchasesPage}
                    totalPages={supplierPurchasesTotalPages}
                    totalItems={supplierPurchasesTotal}
                    onPageChange={setSupplierPurchasesPage}
                  />
                </div>

                {/* Right: Detailed View panel */}
                <div className="xl:col-span-1 bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-6">
                  {selectedPurchase ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-sm text-white uppercase tracking-wider">{selectedPurchase.supplierName}</h4>
                          <p className="text-[10px] text-[#888888] font-mono mt-0.5">Order ID: {selectedPurchase.id.slice(0,8)}...</p>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                          selectedPurchase.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          selectedPurchase.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {selectedPurchase.status}
                        </span>
                      </div>

                      {/* Financial Balance Summary */}
                      <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4 font-mono">
                        <div>
                          <span className="text-[9px] text-[#888888] uppercase block">Total Value</span>
                          <span className="text-sm font-black text-white">₹{Number(selectedPurchase.totalValue).toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#888888] uppercase block">Remaining Balance</span>
                          <span className="text-sm font-black text-amber-500">₹{Number(selectedPurchase.remainingBalance).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Items Ordered Checklist */}
                      <div className="space-y-2.5">
                        <h5 className="text-[9px] uppercase font-black tracking-widest text-[#888888]">Items List</h5>
                        <div className="space-y-2">
                          {selectedPurchase.items?.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-xs bg-white/[0.02] border border-white/5 p-2.5 rounded-xl">
                              <div>
                                <span className="font-bold text-white block">{item.brand} {item.name}</span>
                                <span className="text-[9px] text-white/40 block font-mono">{item.sku} | ₹{Number(item.purchasePrice).toLocaleString('en-IN')} / unit</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono text-white/80 font-bold block">{item.receivedQuantity} / {item.quantity} units</span>
                                <span className="text-[8px] uppercase tracking-wider text-emerald-400">Received</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payments Log */}
                      <div className="space-y-2.5">
                        <h5 className="text-[9px] uppercase font-black tracking-widest text-[#888888]">Payments Log</h5>
                        {selectedPurchase.payments?.length === 0 ? (
                          <p className="text-[10px] text-zinc-600 font-mono italic">No payments logged yet.</p>
                        ) : (
                          <div className="space-y-2 font-mono">
                            {selectedPurchase.payments?.map(pay => (
                              <div key={pay.id} className="flex justify-between items-center text-[11px] bg-[#0b0b0b] p-2.5 rounded-xl border border-white/5">
                                <div>
                                  <span className="text-white font-bold block">₹{Number(pay.amount).toLocaleString('en-IN')}</span>
                                  <span className="text-[9px] text-[#888888]">{pay.paymentMethod} {pay.referenceNumber ? `(${pay.referenceNumber})` : ''}</span>
                                </div>
                                <span className="text-[9px] text-white/30">{new Date(pay.paymentDate).toLocaleDateString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Attachments and Bills */}
                      <div className="space-y-2.5">
                        <h5 className="text-[9px] uppercase font-black tracking-widest text-[#888888]">Invoices & Attachments</h5>
                        <div className="space-y-2">
                          {selectedPurchase.attachments?.map(file => (
                            <div key={file.id} className="flex justify-between items-center bg-white/5 border border-white/5 p-2 rounded-xl text-xs">
                              <span className="text-white/80 font-mono truncate max-w-[150px]">{file.file_name}</span>
                              <a
                                href={`${API_BASE_URL}/admin/supplier-attachments/${file.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#ff5500] hover:underline font-bold text-[10px] uppercase tracking-wider"
                              >
                                View
                              </a>
                            </div>
                          ))}
                          
                          <label className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl p-3 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer">
                            <span className="text-[10px] font-black text-[#ff5500] uppercase tracking-widest">Upload Bill/Invoice</span>
                            <span className="text-[8px] text-white/30 uppercase mt-0.5">PDF or Image</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append('file', file);
                                try {
                                  const res = await fetch(`${API_BASE_URL}/admin/supplier-purchases/${selectedPurchase.id}/attachments`, {
                                    method: 'POST',
                                    body: formData
                                  });
                                  if (res.ok) {
                                    showToast("Attachment uploaded successfully", "success");
                                    fetchSupplierPurchaseDetailsData(selectedPurchase.id);
                                  } else {
                                    const errData = await res.json();
                                    showToast(errData.message || "Failed to upload file", "error");
                                  }
                                } catch (err) {
                                  showToast("File upload failed", "error");
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2.5 pt-4 border-t border-white/5">
                        {selectedPurchase.status !== 'Completed' && selectedPurchase.status !== 'Cancelled' && (
                          <>
                            <button
                              onClick={() => {
                                setReceivingForm({
                                  receivedBy: user?.email || '',
                                  notes: '',
                                  items: selectedPurchase.items.map(item => ({
                                    productId: item.productId,
                                    name: item.name,
                                    brand: item.brand,
                                    sku: item.sku,
                                    casingType: item.casingType || 'box',
                                    remaining: item.quantity - item.receivedQuantity,
                                    quantityReceived: item.quantity - item.receivedQuantity,
                                    quantityDamaged: 0,
                                    quantityShort: 0,
                                    quantityOver: 0
                                  }))
                                });
                                setIsReceivingShipment(true);
                              }}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-[10px] py-2.5 rounded-xl uppercase tracking-wider transition-all text-center cursor-pointer"
                            >
                              Receive Shipment
                            </button>
                            {selectedPurchase.remainingBalance > 0 && (
                              <button
                                onClick={() => {
                                  setPaymentForm({
                                    amount: selectedPurchase.remainingBalance,
                                    cashAccountId: cashAccounts[0]?.id || '',
                                    paymentMethod: 'Bank Transfer',
                                    referenceNumber: '',
                                    notes: '',
                                    date: new Date().toISOString().split('T')[0]
                                  });
                                  setIsRecordingSupplierPayment(true);
                                }}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[10px] py-2.5 rounded-xl uppercase tracking-wider transition-all text-center cursor-pointer"
                              >
                                Record Payment
                              </button>
                            )}
                          </>
                        )}
                        {selectedPurchase.status !== 'Completed' && selectedPurchase.status !== 'Cancelled' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to cancel this purchase commitment?")) return;
                              try {
                                await updateSupplierPurchaseStatus(selectedPurchase.id, 'Cancelled');
                                showToast("Purchase order cancelled successfully", "success");
                                fetchSupplierPurchases(supplierPurchasesPage, supplierPurchasesSearch);
                                fetchSupplierPurchaseDetailsData(selectedPurchase.id);
                                fetchSupplierMetrics();
                              } catch (e) {
                                showToast("Failed to cancel purchase", "error");
                              }
                            }}
                            className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-extrabold text-[10px] px-3.5 py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-[#888888] font-mono italic">
                      Select a purchase order to view details.
                    </div>
                  )}
                </div>

              </div>
                </>
              )}
            </div>
          )}

          {/* 6. ADVANCED FINANCE MODULE */}
          {adminTab === 'finance' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-white/5">
                <div className="flex gap-2">
                  {[
                    { id: 'overview', label: 'Financial Performance' },
                    { id: 'cash_drawer', label: 'Cash Drawer' },
                    { id: 'founder_capital', label: 'Founder Capital' },
                    { id: 'cash_ledger', label: 'Cash Ledger' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFinanceSubTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        financeSubTab === tab.id
                          ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500]'
                          : 'border-white/5 bg-transparent text-[#888888] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                
                {financeSubTab === 'cash_drawer' && (
                  <button
                    onClick={() => setIsAddingCashAccount(true)}
                    className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_15px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
                  >
                    <Plus size={14} /> Add Cash Account
                  </button>
                )}

                {financeSubTab === 'founder_capital' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAddingFounderTx(true)}
                      className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_15px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
                    >
                      <Plus size={14} /> Record Founder Tx
                    </button>
                    <button
                      onClick={() => setIsAddingSettlement(true)}
                      className="border border-white/10 hover:border-white/20 text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} /> Record Settlement
                    </button>
                  </div>
                )}
              </div>

              {/* OVERVIEW SUB-TAB */}
              {financeSubTab === 'overview' && kpis && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Revenue', val: kpis.revenue, color: 'text-white', sub: `${kpis.trends?.revenueGrowth >= 0 ? '▲' : '▼'} ${Math.abs(kpis.trends?.revenueGrowth || 0).toFixed(1)}% vs prev period` },
                      { label: 'Cost of Goods Sold (COGS)', val: kpis.cogs, color: 'text-[#888888]', sub: `Gross Margin: ${kpis.grossMarginPct?.toFixed(1)}%` },
                      { label: 'Gross Profit', val: kpis.grossProfit, color: 'text-emerald-400', sub: 'Revenue minus product costs' },
                      { label: 'Operating Expenses', val: kpis.expenses, color: 'text-[#888888]', sub: 'Operational costs' },
                      { label: 'Net Profit / Loss', val: kpis.netProfit, color: kpis.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400', sub: `${kpis.trends?.netProfitGrowth >= 0 ? '▲' : '▼'} ${Math.abs(kpis.trends?.netProfitGrowth || 0).toFixed(1)}% vs prev period` },
                      { label: 'Current Cash Balance', val: kpis.currentCashBalance, color: 'text-amber-400', sub: 'Liquid capital across accounts' },
                      { label: 'Inventory Asset Value', val: kpis.inventoryAssetValue, color: 'text-[#ff5500]', sub: 'FIFO valuation of stock' },
                      { label: 'Outstanding Founder Capital', val: kpis.outstandingFounderCapital, color: 'text-[#ff5500]', sub: 'Total unpaid founder contributions' }
                    ].map((card, i) => (
                      <div key={i} className="bg-[#141414] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                        <p className="text-[9px] font-bold text-[#888888] uppercase tracking-widest">{card.label}</p>
                        <h3 className={`text-xl font-black mt-2 font-mono ${card.color}`}>
                          ₹{card.val?.toLocaleString('en-IN') || 0}
                        </h3>
                        <p className="text-[9px] text-[#666666] uppercase mt-1.5">{card.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CASH DRAWER SUB-TAB */}
              {financeSubTab === 'cash_drawer' && (
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[#888888] font-bold uppercase tracking-wider text-[10px]">
                          <th className="pb-3">Account Name</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Opening Balance</th>
                          <th className="pb-3">Currency</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashAccounts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-[#666666]">No cash accounts registered.</td>
                          </tr>
                        ) : (
                          cashAccounts.map(acc => (
                            <tr key={acc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 font-bold text-white">{acc.name}</td>
                              <td className="py-3 font-mono text-[#888888]">{acc.type}</td>
                              <td className="py-3 font-mono text-white">₹{Number(acc.opening_balance).toLocaleString('en-IN')}</td>
                              <td className="py-3 font-mono text-[#666666]">{acc.currency}</td>
                              <td className="py-3 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest font-black ${
                                  acc.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-[#666666] border border-white/5'
                                }`}>
                                  {acc.is_active ? 'Active' : 'Archived'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* FOUNDER CAPITAL SUB-TAB */}
              {financeSubTab === 'founder_capital' && founderLedger && (
                <div className="space-y-8">
                  {/* Founder capital metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {founderLedger.founders.map(f => {
                      const bal = founderLedger.balances[f] || 0;
                      const owes = bal < 0;
                      return (
                        <div key={f} className="bg-[#141414] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                          <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">{f}</p>
                          <h3 className={`text-xl font-black mt-2 font-mono ${owes ? 'text-red-400' : 'text-emerald-400'}`}>
                            {owes ? '-' : '+'}₹{Math.abs(Number(bal.toFixed(2))).toLocaleString('en-IN')}
                          </h3>
                          <p className="text-[9px] text-[#666666] uppercase mt-1">
                            Outstanding Balance
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Balancing Pipeline settlements transfers */}
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Settlement Balancing Pipeline (Ledger Transfers)
                    </h4>
                    <div className="space-y-3">
                      {splitsData.owesWho?.length === 0 ? (
                        <p className="text-xs text-[#888888]">Founder split balances are fully settled.</p>
                      ) : (
                        splitsData.owesWho?.map((tr, i) => (
                          <div key={i} className="flex items-center gap-3 text-xs bg-[#1c1c1c] border border-white/5 rounded-lg px-4 py-3">
                            <span className="font-bold text-red-400">{tr.from}</span>
                            <span className="text-[#888888]">needs to transfer</span>
                            <span className="font-bold font-mono text-white">₹{tr.amount.toLocaleString('en-IN')}</span>
                            <span className="text-[#888888]">to</span>
                            <span className="font-bold text-emerald-400">{tr.to}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Founder capital ledger timeline */}
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Founder Capital timeline history
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[#888888] font-bold uppercase tracking-wider text-[10px]">
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Founder</th>
                            <th className="pb-3">Type</th>
                            <th className="pb-3">Amount</th>
                            <th className="pb-3">Reason</th>
                            <th className="pb-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {founderLedger.timeline.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-4 text-center text-[#666666]">No capital transactions recorded.</td>
                            </tr>
                          ) : (
                            founderLedger.timeline.map(tx => (
                              <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 font-mono text-white">{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                                <td className="py-3 font-bold text-white">{tx.founderName}</td>
                                <td className="py-3 font-mono text-[#888888]">{tx.type}</td>
                                <td className={`py-3 font-bold font-mono ${Number(tx.amount) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {Number(tx.amount) >= 0 ? '+' : ''}₹{Math.abs(Number(tx.amount)).toLocaleString('en-IN')}
                                </td>
                                <td className="py-3 text-white">{tx.reason}</td>
                                <td className="py-3 text-[#666666] max-w-[200px] truncate">{tx.notes}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* CASH LEDGER TIMELINE SUB-TAB */}
              {financeSubTab === 'cash_ledger' && (
                <div className="space-y-6">
                  {/* Filters & CSV exporter */}
                  <div className="flex flex-wrap justify-between items-center gap-4 bg-[#141414] border border-white/5 rounded-2xl p-5">
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={ledgerFilters.timeRange}
                        onChange={e => setLedgerFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                        className="bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#ff5500]/50"
                      >
                        {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Previous Month', 'Quarter', 'Year To Date', 'Previous Year', 'Lifetime'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>

                      <select
                        value={ledgerFilters.cashAccountId}
                        onChange={e => setLedgerFilters(prev => ({ ...prev, cashAccountId: e.target.value }))}
                        className="bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#ff5500]/50"
                      >
                        <option value="">All Accounts</option>
                        {cashAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>

                      <select
                        value={ledgerFilters.type}
                        onChange={e => setLedgerFilters(prev => ({ ...prev, type: e.target.value }))}
                        className="bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#ff5500]/50"
                      >
                        <option value="">All Types</option>
                        {['Customer Payment', 'Pre-order Advance', 'Pre-order Remaining Payment', 'Founder Contribution', 'Founder Reimbursement', 'Inventory Purchase', 'Operating Expense', 'Refund', 'Manual Adjustment', 'Settlement Between Founders'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={exportLedgerToCSV}
                      disabled={ledgerTransactions.length === 0}
                      className="border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:hover:border-white/10 text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      Export CSV
                    </button>
                  </div>

                  {/* Cash ledger table */}
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[#888888] font-bold uppercase tracking-wider text-[10px]">
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Account</th>
                            <th className="pb-3">Type</th>
                            <th className="pb-3">Amount</th>
                            <th className="pb-3">Ref Number</th>
                            <th className="pb-3">Reason</th>
                            <th className="pb-3">Created By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgerTransactions.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-4 text-center text-[#666666]">No ledger records match current filters.</td>
                            </tr>
                          ) : (
                            ledgerTransactions.map(tx => (
                              <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 font-mono text-[#888888]">{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                                <td className="py-3 font-bold text-white">{tx.cash_account_name || 'N/A'}</td>
                                <td className="py-3 font-mono text-[#888888]">{tx.type}</td>
                                <td className={`py-3 font-bold font-mono ${Number(tx.amount) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {Number(tx.amount) >= 0 ? '+' : ''}₹{Math.abs(Number(tx.amount)).toLocaleString('en-IN')}
                                </td>
                                <td className="py-3 font-mono text-[#666666]">{tx.reference_number || '—'}</td>
                                <td className="py-3 text-white max-w-[200px] truncate" title={tx.reason}>{tx.reason}</td>
                                <td className="py-3 text-[#666666]">{tx.created_by.split('@')[0]}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. ANALYTICS TAB */}
          {adminTab === 'analytics' && (
            <div className="space-y-8">
              {!analytics ? (
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-8 text-center space-y-4">
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Database Analytics & Reports
                    </h3>
                    <p className="text-xs text-[#888888] leading-relaxed">
                      Execute aggregated queries to calculate top selling brands, best models, average order value, top buyers, and catalog dead stock.
                    </p>
                  </div>
                  <button
                    onClick={fetchAnalytics}
                    disabled={analyticsLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff5500] hover:bg-[#ff6611] active:bg-[#e64d00] disabled:bg-[#ff5500]/50 text-black font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all shadow-[0_4px_20px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
                  >
                    {analyticsLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Running Queries...
                      </>
                    ) : (
                      'Generate Analytics Report'
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white/40">
                      Aggregated Metrics (On-Demand)
                    </h3>
                    <button 
                      onClick={fetchAnalytics}
                      disabled={analyticsLoading}
                      className="text-[10px] font-black text-[#ff5500] hover:underline uppercase tracking-widest bg-transparent border-none cursor-pointer"
                    >
                      {analyticsLoading ? 'Regenerating...' : 'Refresh Report'}
                    </button>
                  </div>

                  {/* Analytics summary details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Top Selling Brand', val: analytics.topBrand || 'N/A' },
                      { label: 'Top Casting Model', val: analytics.topSellingProduct ? `${analytics.topSellingProduct.brand} ${analytics.topSellingProduct.name}` : 'N/A' },
                      { label: 'Average Order Value', val: `₹${Number((analytics.averageOrderValue || 0).toFixed(2)).toLocaleString('en-IN')}` },
                      { label: 'Top Customer Buyer', val: analytics.topCustomer ? `${analytics.topCustomer.name}` : 'N/A' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-[#141414] border border-white/5 rounded-2xl p-5">
                        <p className="text-[9px] font-bold text-[#888888] uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-sm font-extrabold text-white mt-3 uppercase tracking-wide truncate">
                          {stat.val}
                        </h3>
                      </div>
                    ))}
                  </div>

                  {/* Dead stock catalog check */}
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        Dead Stock Catalog (90+ Days Unsold)
                      </h4>
                      <p className="text-[10px] text-[#888888] mt-0.5">Inventory assets locked in low-velocity castings.</p>
                    </div>
                    
                    <div className="overflow-x-auto border border-white/5 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#1c1c1c] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                            <th className="p-3 font-bold">Casting</th>
                            <th className="p-3 font-bold">Added Date</th>
                            <th className="p-3 font-bold text-center">Remaining Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.deadStock && analytics.deadStock.length > 0 ? (
                            analytics.deadStock.map(car => (
                              <tr key={car.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="p-3 font-bold text-white">{car.brand} {car.name}</td>
                                <td className="p-3 font-mono text-[#888888]">{new Date(car.createdAt).toLocaleDateString('en-IN')}</td>
                                <td className="p-3 text-center font-mono font-bold text-white">{car.available}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="p-4 text-center text-white/30 uppercase text-[10px] tracking-wider font-bold">
                                No Dead Stock Detected
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. ALERTS TAB */}
          {adminTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  System Alerts Feed
                </h3>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkNotificationsRead}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Clear All Alerts
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-[#888888] text-xs">
                    No active alerts.
                  </div>
                ) : (
                  notifications.map(n => {
                    const isError = n.title.toLowerCase().includes('error') || n.title.toLowerCase().includes('critical') || n.title.toLowerCase().includes('fail');
                    const isWarning = n.title.toLowerCase().includes('warning') || n.title.toLowerCase().includes('threshold') || n.title.toLowerCase().includes('slow');
                    
                    let alertClasses = "bg-blue-950/25 border-blue-500/20 text-blue-400";
                    if (isError) {
                      alertClasses = "bg-red-950/25 border-red-500/20 text-red-400";
                    } else if (isWarning) {
                      alertClasses = "bg-amber-950/25 border-amber-500/20 text-amber-400";
                    }

                    return (
                      <div key={n.id} className={`p-4 border rounded-xl flex gap-3 text-xs relative group ${alertClasses}`}>
                        <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                        <div className="flex-1">
                          <span className="font-extrabold text-white block uppercase tracking-wide mb-0.5">{n.title}</span>
                          <span className="text-[#888888] leading-relaxed block">{n.message}</span>
                          <span className="text-[9px] text-[#555555] font-mono mt-1 block">
                            {new Date(n.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(n.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 text-[#888888] hover:text-white cursor-pointer w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/5"
                          title="Dismiss Alert"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {hasMoreNotifications && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={loadMoreNotifications}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 text-white font-bold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}



          {/* 10. SETTINGS TAB */}
          {adminTab === 'settings' && (
            <div className="space-y-8">
              {/* Next Drop Timer Settings */}
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Next Curated Drop Countdown Settings
                  </h4>
                  <p className="text-[10px] text-[#888888] mt-0.5">Configure target date, time, and custom labels for the countdown display.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Drop Date</label>
                    <input
                      type="date"
                      value={dropSettingsForm.dropDate}
                      onChange={(e) => setDropSettingsForm(prev => ({ ...prev, dropDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Drop Time (IST)</label>
                    <input
                      type="time"
                      value={dropSettingsForm.dropTime}
                      onChange={(e) => setDropSettingsForm(prev => ({ ...prev, dropTime: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Display Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Friday • 9 PM IST"
                      value={dropSettingsForm.dropLabel}
                      onChange={(e) => setDropSettingsForm(prev => ({ ...prev, dropLabel: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#ff5500]/50"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Display Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Next Curated Drop Countdown"
                      value={dropSettingsForm.dropDesc}
                      onChange={(e) => setDropSettingsForm(prev => ({ ...prev, dropDesc: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#ff5500]/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-white/5">
                  <button
                    onClick={async () => {
                      await handleUpdateGlobalSettings(dropSettingsForm);
                    }}
                    className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] px-5 py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Save Drop Settings
                  </button>
                </div>
              </div>

              {/* Price settings toggler */}
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Catalog Price Visibility setting
                  </h4>
                  <p className="text-[10px] text-[#888888] mt-0.5">Toggles prices visibility for guest users ("DM for price" fallback).</p>
                </div>
                
                <div className="flex justify-between items-center bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">Show prices</span>
                    <span className="text-[9px] text-[#888888] uppercase mt-0.5">Visible to all visitors</span>
                  </div>
                  <button
                    onClick={() => handleUpdateGlobalSettings({ showPrices: !globalSettings.showPrices })}
                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      globalSettings.showPrices 
                        ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500]' 
                        : 'bg-white/5 border-white/10 text-[#888888]'
                    }`}
                  >
                    {globalSettings.showPrices ? 'Prices Visible' : 'Prices Hidden'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 11. DIAGNOSTICS & SYSTEM HEALTH TAB */}
          {adminTab === 'diagnostics' && (
            <div className="space-y-6">
              
              {/* Header and Sub-navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white">Observability & Diagnostics</h3>
                  <p className="text-[10px] text-[#888888] mt-0.5">Monitor system telemetry, audit operations, and health alerts.</p>
                </div>
                
                {/* Sub-tabs menu */}
                <div className="flex flex-wrap gap-1 bg-[#141414] border border-white/5 p-1 rounded-xl">
                  {[
                    { id: 'health', label: 'System Health', icon: Server },
                    { id: 'errors', label: 'Telemetry Errors', icon: AlertTriangle },
                    { id: 'audit', label: 'Audit Logs', icon: Shield },
                    { id: 'settings', label: 'Alert Settings', icon: Settings }
                  ].map(sub => {
                    const active = diagnosticsSubTab === sub.id;
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setDiagnosticsSubTab(sub.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border ${
                          active
                            ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500]'
                            : 'border-transparent text-[#888888] hover:text-white'
                        }`}
                      >
                        <SubIcon size={12} />
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-tab Content: Health */}
              {diagnosticsSubTab === 'health' && (
                <div className="space-y-6">
                  {/* System Health Status Grid (Bento Style) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">Database Node</span>
                        <span className={`w-2 h-2 rounded-full ${(healthStatus?.database?.status === 'up' || healthStatus?.database?.status === 'healthy') ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'bg-red-400 animate-pulse'} flex-shrink-0`} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">PostgreSQL Gateway</h4>
                        <p className="text-[10px] text-[#888888] font-mono mt-1">Status: {(healthStatus?.database?.status === 'up' || healthStatus?.database?.status === 'healthy') ? 'ONLINE (ACTIVE)' : 'OFFLINE'}</p>
                      </div>
                    </div>

                    <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">System Environment</span>
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] flex-shrink-0" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Vite & Node Runtime</h4>
                        <p className="text-[10px] text-[#888888] font-mono mt-1">Environment: {import.meta.env.MODE.toUpperCase()}</p>
                        <p className="text-[9px] text-zinc-500 font-mono mt-0.5">V: {healthStatus?.version || '1.0.0-GA'}</p>
                      </div>
                    </div>

                    <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">Build Revision</span>
                        <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.3)] flex-shrink-0" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Git Commit</h4>
                        <p className="text-[10px] text-[#888888] font-mono mt-1 truncate block" title={healthStatus?.commit || healthStatus?.git?.commit}>
                          SHA: {healthStatus?.commit && healthStatus?.commit !== 'N/A' ? healthStatus.commit.slice(0, 8) : (healthStatus?.git?.commit ? healthStatus.git.commit.slice(0, 8) : 'DEVELOPMENT_BUILD')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Latency & Metrics Charts */}
                  <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Route Performance Metrics</h4>
                      <p className="text-[10px] text-[#888888] mt-0.5">Monitors latency and response size profiles across routes.</p>
                    </div>

                    {perfLoading ? (
                      <div className="py-8 text-center text-[#888888] text-xs animate-pulse">Analyzing profiles...</div>
                    ) : perfStats.length === 0 ? (
                      <div className="py-8 text-center text-[#888888] text-xs">No metrics recorded yet. Trigger api calls to log statistics.</div>
                    ) : (
                      <div className="space-y-4">
                        {perfStats.map((metric, idx) => {
                          const avgLat = parseFloat(metric.avgLatency || metric.avg_duration || 0);
                          const hitCount = metric.totalRequests || metric.hit_count || 0;
                          const featureName = metric.feature || metric.route || 'Route';
                          const isSlow = avgLat > 500;
                          const latencyRating = avgLat < 200 ? 'Excellent' : avgLat < 500 ? 'Good' : 'Slow';
                          const ratingColor = avgLat < 200 ? 'text-emerald-400' : avgLat < 500 ? 'text-amber-400' : 'text-red-400';
                          return (
                            <div key={idx} className="bg-[#1c1c1c] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-[#ff5500] uppercase bg-[#ff5500]/10 border-[#ff5500]/20 px-2 py-0.5 rounded">
                                  {metric.method || 'API'}
                                </span>
                                <span className="ml-2.5 text-xs font-bold text-white font-mono">{featureName}</span>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <span className="text-[10px] text-[#888888] block">AVG LATENCY</span>
                                  <span className={`text-xs font-mono font-black ${ratingColor}`}>{avgLat.toFixed(1)} ms ({latencyRating})</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-[#888888] block">HIT COUNT</span>
                                  <span className="text-xs font-mono font-black text-white">{hitCount} hits</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-tab Content: Telemetry Errors */}
              {diagnosticsSubTab === 'errors' && (
                <div className="space-y-6">
                  {/* Actions & Filters */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2 w-full max-w-xs">
                        <Search size={12} className="text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search error messages..."
                          value={telemetrySearch}
                          onChange={(e) => setTelemetrySearch(e.target.value)}
                          className="bg-transparent border-none text-[11px] text-white placeholder-zinc-600 focus:outline-none w-full"
                        />
                      </div>
                      
                      <select
                        value={telemetryFilter}
                        onChange={(e) => setTelemetryFilter(e.target.value)}
                        className="bg-[#141414] border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#ff5500]/50"
                      >
                        <option value="false">Unresolved Errors</option>
                        <option value="true">Resolved Errors</option>
                        <option value="all">All Logs</option>
                      </select>
                    </div>

                    <button
                      onClick={handleClearErrors}
                      className="bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/50 hover:text-red-300 font-extrabold text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Clear Logged Errors
                    </button>
                  </div>

                  {/* Telemetry Error Cards */}
                  <div className="space-y-4">
                    {telemetryErrors.length === 0 ? (
                      <div className="bg-[#141414] border border-white/5 rounded-2xl p-12 text-center text-[#888888] text-xs">
                        No error logs matching your filters.
                      </div>
                    ) : (
                      telemetryErrors.map((err) => {
                        const isAcknowledgeable = !err.acknowledged;
                        const occurrenceCount = err.occurrenceCount || err.seen_count || err.occurrences || 0;
                        const firstSeen = err.firstOccurrence || err.first_seen;
                        const lastSeen = err.lastOccurrence || err.last_seen;
                        const stack = err.stackTrace || err.stack;
                        const correlationId = err.latestCorrelationId || err.correlation_id;
                        const url = err.latestUrl || err.url || 'Internal Operation';
                        return (
                          <div key={err.fingerprint} className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4 relative group">
                            {/* Tags row */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                err.source === 'frontend' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}>
                                {err.source}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                                {err.category}
                              </span>
                              <div className="ml-auto flex items-center gap-3">
                                <span className="text-[9px] text-[#555555] font-mono">
                                  Occurrences: <span className="font-bold text-white">{occurrenceCount}</span>
                                </span>
                                {isAcknowledgeable && (
                                  <button
                                    onClick={() => handleAcknowledgeError(err.fingerprint)}
                                    className="bg-[#ff5500]/10 border border-[#ff5500]/30 hover:bg-[#ff5500]/20 text-[#ff5500] font-extrabold text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
                                  >
                                    Resolve
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Error Header */}
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-red-400 leading-snug">
                                {err.message}
                              </h4>
                              <p className="text-[10px] text-zinc-500 font-mono mt-1 break-all">Route: {url}</p>
                            </div>

                            {/* Stack trace section */}
                            {stack && (
                              <details className="group/details">
                                <summary className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-white list-none select-none flex items-center gap-1">
                                  <span>▶</span> <span>Toggle Trace Stack</span>
                                </summary>
                                <pre className="mt-3 p-3 bg-[#0a0a0b] border border-white/5 rounded-xl text-[9px] font-mono text-zinc-400 leading-relaxed overflow-x-auto select-text" data-lenis-prevent="true">
                                  {stack}
                                </pre>
                              </details>
                            )}

                            {/* Trace footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-white/5 text-[9px] font-mono text-[#555555]">
                              <span>Seen: {firstSeen ? new Date(firstSeen).toLocaleString('en-IN') : 'N/A'} — {lastSeen ? new Date(lastSeen).toLocaleString('en-IN') : 'N/A'}</span>
                              {correlationId && (
                                <span className="bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-[9px] font-mono text-[#888888] select-all cursor-copy" title="Click to copy Correlation ID">
                                  CID: {correlationId}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <Pagination
                    currentPage={telemetryPage}
                    totalPages={telemetryTotalPages}
                    onPageChange={setTelemetryPage}
                  />
                </div>
              )}

              {/* Sub-tab Content: Audit Logs */}
              {diagnosticsSubTab === 'audit' && (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2 bg-[#141414] border border-white/5 rounded-xl px-3.5 py-2 w-full max-w-xs">
                      <Search size={12} className="text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search logs by user, IP, action..."
                        value={auditLogsSearch}
                        onChange={(e) => setAuditLogsSearch(e.target.value)}
                        className="bg-transparent border-none text-[11px] text-white placeholder-zinc-600 focus:outline-none w-full"
                      />
                    </div>
                    
                    <select
                      value={auditLogsCategory}
                      onChange={(e) => setAuditLogsCategory(e.target.value)}
                      className="bg-[#141414] border border-white/5 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#ff5500]/50"
                    >
                      <option value="All">All Categories</option>
                      <option value="Products">Products</option>
                      <option value="Orders">Orders</option>
                      <option value="Expenses">Expenses</option>
                      <option value="Invoices">Invoices</option>
                    </select>
                  </div>

                  {/* Audit Logs Table */}
                  <div className="overflow-x-auto border border-white/5 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#141414] border-b border-white/5 text-[#888888] uppercase tracking-widest text-[9px]">
                          <th className="p-4 font-bold">Timestamp</th>
                          <th className="p-4 font-bold">Action & Entity</th>
                          <th className="p-4 font-bold">Operator Details</th>
                          <th className="p-4 font-bold">State Changes</th>
                          <th className="p-4 font-bold">Correlation ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-[#888888] uppercase text-[10px] tracking-wider font-bold">
                              No audit logs matching your filters.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="p-4 font-mono text-[#888888]">
                                {new Date(log.created_at).toLocaleString('en-IN')}
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-white block">{log.action}</span>
                                <span className="text-[10px] text-zinc-500 uppercase font-mono">{log.entity} #{log.entity_id?.slice(0, 8)}</span>
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-white block">{log.user_email || 'System Auto'}</span>
                                <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{log.ip_address || '127.0.0.1'}</span>
                              </td>
                              <td className="p-4 max-w-[280px]">
                                {log.before_state || log.after_state ? (
                                  <details className="group/audit-details font-mono">
                                    <summary className="text-[9px] font-bold text-[#ff5500] uppercase tracking-wider cursor-pointer list-none select-none">
                                      View Payload JSON
                                    </summary>
                                    <pre className="mt-2 p-2 bg-[#09090a] border border-white/5 rounded-lg text-[9px] font-mono text-zinc-400 overflow-x-auto leading-relaxed select-text" data-lenis-prevent="true">
                                      {JSON.stringify({
                                        before: log.before_state ? JSON.parse(log.before_state) : null,
                                        after: log.after_state ? JSON.parse(log.after_state) : null
                                      }, null, 2)}
                                    </pre>
                                  </details>
                                ) : (
                                  <span className="text-[10px] text-[#555555] font-mono">No state changes</span>
                                )}
                              </td>
                              <td className="p-4 font-mono">
                                {log.correlation_id ? (
                                  <span className="bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-[9px] text-[#888888] select-all cursor-copy">
                                    {log.correlation_id}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#555555]">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={auditLogsPage}
                    totalPages={auditLogsTotalPages}
                    onPageChange={setAuditLogsPage}
                  />
                </div>
              )}

              {/* Sub-tab Content: Alert Settings */}
              {diagnosticsSubTab === 'settings' && (
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">Alert Thresholds & Purge Settings</h4>
                    <p className="text-[10px] text-[#888888] mt-0.5">Tune thresholds for triggering telemetry alerts and set log retention schedules.</p>
                  </div>

                  {obsSettingsLoading ? (
                    <div className="py-8 text-center text-[#888888] text-xs animate-pulse">Retrieving settings...</div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Error Rate Alert Threshold (per min)</label>
                          <input
                            type="number"
                            value={obsSettings.alertThresholds.errorRatePerMin}
                            onChange={(e) => setObsSettings(prev => ({
                              ...prev,
                              alertThresholds: { ...prev.alertThresholds, errorRatePerMin: Number(e.target.value) }
                            }))}
                            className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Slow Query Latency Alert Threshold (ms)</label>
                          <input
                            type="number"
                            value={obsSettings.alertThresholds.slowRequestRate}
                            onChange={(e) => setObsSettings(prev => ({
                              ...prev,
                              alertThresholds: { ...prev.alertThresholds, slowRequestRate: Number(e.target.value) }
                            }))}
                            className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Auth Failures Alert Threshold (per min)</label>
                          <input
                            type="number"
                            value={obsSettings.alertThresholds.authFailureCount}
                            onChange={(e) => setObsSettings(prev => ({
                              ...prev,
                              alertThresholds: { ...prev.alertThresholds, authFailureCount: Number(e.target.value) }
                            }))}
                            className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Log Purge Retention Period (days)</label>
                          <input
                            type="number"
                            value={obsSettings.retentionPeriodDays}
                            onChange={(e) => setObsSettings(prev => ({
                              ...prev,
                              retentionPeriodDays: Number(e.target.value)
                            }))}
                            className="w-full px-4 py-3 bg-[#1c1c1c] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-white/5">
                        <button
                          disabled={isSavingObsSettings}
                          onClick={() => handleSaveObsSettings(obsSettings)}
                          className="bg-[#ff5500] hover:bg-[#ff6611] disabled:opacity-50 text-black font-extrabold text-[10px] px-5 py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          {isSavingObsSettings ? 'Saving...' : 'Save Observability Settings'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
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
    {(receiptOrderId || selectedReceipt) && (
      <ReceiptModal
        orderId={receiptOrderId}
        receiptData={selectedReceipt}
        apiBaseUrl={API_BASE_URL}
        onClose={() => {
          setReceiptOrderId(null);
          setSelectedReceipt(null);
        }}
      />
    )}

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
    {/* ── CREATE MANUAL INVOICE MODAL ───────────────────────── */}
    {isCreatingReceipt && (() => {
      const isPreBook = manualReceiptForm.formatType === 'pre_order';
      const lineSubtotal = manualReceiptForm.items.reduce((s, i) => s + Number(i.qty) * Number(i.unitPrice), 0);
      const grandTotal = lineSubtotal + Number(manualReceiptForm.shippingCharges || 0);
      const advancePaid = isPreBook ? Number(manualReceiptForm.advancePaid || 0) : grandTotal;
      const pendingBalance = isPreBook ? Math.max(0, grandTotal - advancePaid) : 0;
      const fmtM = (n) => Number(n || 0).toLocaleString('en-IN');

      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-[#0f0f0f] border border-white/5 rounded-3xl shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
            {/* Top accent */}
            <div className="h-[2px] bg-gradient-to-r from-[#ff5500]/20 via-[#ff5500] to-[#ff5500]/20 flex-shrink-0" />

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 flex-shrink-0">
              <div>
                <div className="text-[9px] font-black text-[#ff5500] uppercase tracking-widest">Manual Billing</div>
                <h3 className="text-base font-black text-white mt-0.5">Create Custom Invoice</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreatingReceipt(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white border border-white/5 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 min-h-0" data-lenis-prevent="true">
              <div className="p-6 space-y-5">
                {/* Pre-Order Toggle */}
                <div className="bg-amber-500/[0.04] border border-amber-500/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-white">Pre-Order Booking</div>
                    <div className="text-[10px] text-white/40 mt-0.5">Enable for partial advance payment invoices. Shows advance paid &amp; pending balance on the receipt.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManualReceiptForm(prev => ({ ...prev, formatType: prev.formatType === 'pre_order' ? 'standard' : 'pre_order' }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer border-0 ${
                      isPreBook ? 'bg-[#ff5500]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${isPreBook ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Invoice Number + Customer Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Invoice Number</label>
                    <input
                      type="text"
                      value={manualReceiptForm.receiptNumber}
                      onChange={(e) => setManualReceiptForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#141414] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Customer Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={manualReceiptForm.customerName}
                      onChange={(e) => setManualReceiptForm(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#141414] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Phone</label>
                    <input
                      type="text"
                      placeholder="9876543210"
                      value={manualReceiptForm.customerPhone}
                      onChange={(e) => setManualReceiptForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#141414] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Instagram Handle</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-xs text-white/30">@</span>
                      <input
                        type="text"
                        placeholder="username"
                        value={manualReceiptForm.customerInstagram}
                        onChange={(e) => setManualReceiptForm(prev => ({ ...prev, customerInstagram: e.target.value }))}
                        className="w-full pl-8 pr-4 py-3 bg-[#141414] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Shipping / Delivery Address</label>
                  <textarea
                    placeholder="Full delivery address..."
                    value={manualReceiptForm.customerAddress}
                    onChange={(e) => setManualReceiptForm(prev => ({ ...prev, customerAddress: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#141414] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50 h-16 resize-none"
                  />
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Line Items *</label>
                    <button
                      type="button"
                      onClick={() => setManualReceiptForm(prev => ({ ...prev, items: [...prev.items, { productId: '', description: '', qty: 1, unitPrice: 0, maxQty: 0 }] }))}
                      className="text-[10px] text-[#ff5500] hover:text-[#ff6611] font-bold uppercase tracking-wider flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    >
                      <Plus size={10} /> Add Item
                    </button>
                  </div>

                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_56px_80px_28px] gap-2 px-2 text-[9px] font-black text-white/30 uppercase tracking-widest">
                    <span>Casting Selection (From Inventory)</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Unit Price ₹</span>
                    <span></span>
                  </div>

                  <div className="space-y-2 pr-1">
                    {manualReceiptForm.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_56px_80px_28px] gap-2 items-center">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Type brand/name..."
                            value={itemSearchQueries[idx] !== undefined ? itemSearchQueries[idx] : item.description}
                            onFocus={() => setActiveSearchIdx(idx)}
                            onBlur={() => {
                              setTimeout(() => {
                                setActiveSearchIdx(null);
                                setItemSearchQueries(prev => {
                                  const copy = { ...prev };
                                  delete copy[idx];
                                  return copy;
                                });
                              }, 200);
                            }}
                            onChange={(e) => {
                              const q = e.target.value;
                              setItemSearchQueries(prev => ({ ...prev, [idx]: q }));
                              setActiveSearchIdx(idx);
                            }}
                            className="w-full px-3 py-2 bg-[#141414] border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff5500]/50"
                            required
                          />
                          {activeSearchIdx === idx && (
                            <div className="absolute left-0 right-0 top-full mt-1 max-h-[220px] overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50 divide-y divide-white/5">
                              {cars
                                .filter(c => {
                                  const searchQ = (itemSearchQueries[idx] || '').toLowerCase().trim();
                                  const matchesSearch = !searchQ || 
                                    (c.brand || '').toLowerCase().includes(searchQ) || 
                                    (c.name || '').toLowerCase().includes(searchQ) || 
                                    (c.scale && c.scale.toLowerCase().includes(searchQ));
                                  return Number(c.availableStock) > 0 && matchesSearch;
                                })
                                .map(c => (
                                  <div
                                    key={c.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                    }}
                                    onClick={() => {
                                      const newItems = [...manualReceiptForm.items];
                                      newItems[idx].productId = c.id;
                                      newItems[idx].description = `${c.brand || ''} ${c.name || ''}`.trim();
                                      newItems[idx].unitPrice = Number(c.price);
                                      newItems[idx].maxQty = Number(c.availableStock);
                                      if (newItems[idx].qty > newItems[idx].maxQty) {
                                        newItems[idx].qty = newItems[idx].maxQty;
                                      }
                                      setManualReceiptForm(prev => ({ ...prev, items: newItems }));
                                      setItemSearchQueries(prev => {
                                        const copy = { ...prev };
                                        delete copy[idx];
                                        return copy;
                                      });
                                      setActiveSearchIdx(null);
                                    }}
                                    className="px-3 py-2 text-xs text-white/80 hover:bg-[#ff5500] hover:text-white cursor-pointer flex justify-between items-center transition-colors"
                                  >
                                    <span>{c.brand || 'No Brand'} - {c.name || 'Unnamed Casting'} ({c.scale || 'N/A'})</span>
                                    <span className="text-[10px] opacity-60">Stock: {c.availableStock} | ₹{c.price}</span>
                                  </div>
                                ))}
                              {cars.filter(c => {
                                const searchQ = (itemSearchQueries[idx] || '').toLowerCase().trim();
                                return Number(c.availableStock) > 0 && (
                                  !searchQ || 
                                  (c.brand || '').toLowerCase().includes(searchQ) || 
                                  (c.name || '').toLowerCase().includes(searchQ) || 
                                  (c.scale && c.scale.toLowerCase().includes(searchQ))
                                );
                              }).length === 0 && (
                                <div className="px-3 py-2 text-xs text-white/40 italic text-center">
                                  No matching items
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <input
                          type="number"
                          min="1"
                          max={item.maxQty || undefined}
                          value={item.qty}
                          onChange={(e) => {
                            const newItems = [...manualReceiptForm.items];
                            newItems[idx].qty = Math.min(
                              item.maxQty || 999,
                              parseInt(e.target.value, 10) || 1
                            );
                            setManualReceiptForm(prev => ({ ...prev, items: newItems }));
                          }}
                          className="w-full px-3 py-2 bg-[#141414] border border-white/5 rounded-lg text-xs text-white text-center focus:outline-none focus:border-[#ff5500]/50"
                        />
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newItems = [...manualReceiptForm.items];
                            newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                            setManualReceiptForm(prev => ({ ...prev, items: newItems }));
                          }}
                          className="w-full px-3 py-2 bg-[#141414] border border-white/5 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#ff5500]/50"
                        />
                        {manualReceiptForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setManualReceiptForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}
                            className="p-1 text-white/30 hover:text-red-400 bg-transparent border-none cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Shipping Charges (₹)</label>
                      <input
                        type="number" min="0"
                        value={manualReceiptForm.shippingCharges}
                        onChange={(e) => setManualReceiptForm(prev => ({ ...prev, shippingCharges: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 bg-[#141414] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50 font-mono"
                      />
                    </div>

                    {/* Pre-Order: Advance Paid */}
                    {isPreBook && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Advance Paid (₹) *</label>
                        <input
                          type="number" min="0" max={grandTotal}
                          value={manualReceiptForm.advancePaid}
                          onChange={(e) => setManualReceiptForm(prev => ({ ...prev, advancePaid: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 bg-amber-500/[0.05] border border-amber-500/20 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">Footer Note</label>
                    <textarea
                      value={manualReceiptForm.footerNote}
                      onChange={(e) => setManualReceiptForm(prev => ({ ...prev, footerNote: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#141414] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff5500]/50 resize-none"
                      rows={isPreBook ? 4 : 6}
                    />
                  </div>
                </div>

                {/* Live Totals Strip */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                  <div className="grid grid-cols-3 gap-3 text-center text-[10px]">
                    <div>
                      <div className="text-white/40 uppercase tracking-wider mb-1">Subtotal</div>
                      <div className="font-mono font-bold text-white text-sm">₹{fmtM(lineSubtotal)}</div>
                    </div>
                    <div>
                      <div className="text-white/40 uppercase tracking-wider mb-1">Grand Total</div>
                      <div className="font-mono font-bold text-[#ff5500] text-sm">₹{fmtM(grandTotal)}</div>
                    </div>
                    <div>
                      <div className="text-white/40 uppercase tracking-wider mb-1">{isPreBook ? 'Balance Due' : 'Fully Paid'}</div>
                      <div className={`font-mono font-bold text-sm ${isPreBook && pendingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isPreBook ? `₹${fmtM(pendingBalance)}` : '✓ Paid'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 border-t border-white/5 px-6 py-4 justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsCreatingReceipt(false)}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!manualReceiptForm.customerName) return;
                  setSelectedReceipt({
                    receiptNumber: manualReceiptForm.receiptNumber,
                    orderId: manualReceiptForm.receiptNumber,
                    date: new Date().toISOString(),
                    status: isPreBook ? 'Pre-Order' : 'Confirmed',
                    bookingType: isPreBook ? 'pre_order' : 'standard',
                    customer: {
                      name: manualReceiptForm.customerName,
                      phone: manualReceiptForm.customerPhone,
                      instagram: manualReceiptForm.customerInstagram,
                      address: manualReceiptForm.customerAddress,
                      email: ''
                    },
                    items: manualReceiptForm.items.map(i => ({
                      productId: i.productId,
                      name: i.description,
                      series: '',
                      scale: '1:64',
                      qty: Number(i.qty),
                      unitPrice: Number(i.unitPrice),
                      lineTotal: Number(i.qty) * Number(i.unitPrice)
                    })),
                    subtotal: lineSubtotal,
                    shippingCharges: Number(manualReceiptForm.shippingCharges || 0),
                    totalAmount: grandTotal,
                    advancePaid,
                    pendingBalance,
                    footerNote: manualReceiptForm.footerNote
                  });
                }}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                👁 Preview
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!manualReceiptForm.customerName) return;
                  const invalidItem = manualReceiptForm.items.some(item => !item.productId || !item.description || item.unitPrice <= 0);
                  if (invalidItem) return;
                  try {
                    const payload = {
                      receiptNumber: manualReceiptForm.receiptNumber,
                      customerId: 'dummy',
                      formatType: manualReceiptForm.formatType,
                      customerName: manualReceiptForm.customerName,
                      customerPhone: manualReceiptForm.customerPhone || null,
                      customerInstagram: manualReceiptForm.customerInstagram || null,
                      customerAddress: manualReceiptForm.customerAddress || null,
                      shippingCharges: Number(manualReceiptForm.shippingCharges),
                      advancePaid: isPreBook ? Number(manualReceiptForm.advancePaid) : grandTotal,
                      footerNote: manualReceiptForm.footerNote || null,
                      items: manualReceiptForm.items.map(i => ({
                        productId: i.productId,
                        description: i.description,
                        qty: Number(i.qty),
                        amount: Number(i.unitPrice)
                      }))
                    };
                    await addReceipt(payload);
                    setIsCreatingReceipt(false);
                    loadAllData();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#ff5500] hover:bg-[#ff6611] text-black text-xs font-black uppercase tracking-wider hover:shadow-[0_0_20px_rgba(255,85,0,0.25)] transition-all cursor-pointer border-none"
              >
                ✓ Generate Invoice
              </button>
            </div>
          </div>
        </div>
      );
    })()}



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
