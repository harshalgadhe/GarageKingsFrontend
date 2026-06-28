import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Trash2, Edit2, Save, X, Settings, Eye, EyeOff, LogOut, User, Search,
  DollarSign, TrendingUp, Bell, FileText, Users, AlertTriangle, Layers, Calendar, Receipt
} from 'lucide-react';
import { getCurrentUser, signOutCognito } from '../lib/auth';
import { 
  getCars, addCar, updateCar, deleteCar, uploadImageToStorage, getGlobalSettings, updateGlobalSettings,
  getReceipts, addReceipt, deleteReceipt 
} from '../lib/db';
import Navigation from '../components/Navigation';
import ReceiptModal from '../components/ReceiptModal';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState('');
  
  // Tab controller (Exactly 8 modules)
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard', 'inventory', 'orders', 'expenses', 'finance', 'analytics', 'notifications', 'settings'

  // Datasets
  const [cars, setCars] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [splitsData, setSplitsData] = useState({ totalExpenses: 0, paidMap: {}, targetOwed: {}, balances: {}, settlements: [], owesWho: [] });
  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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
  const [productForm, setProductForm] = useState({ name: '', brand: '', price: '', scale: '1:64', lane: '', totalStock: 10, description: '', image: '', category: 'JDM', purchasePrice: '', maxQtyPerCustomer: '', hasLimit: false });
  const [uploadingImage, setUploadingImage] = useState(false);

  const [activeScreenshotOrder, setActiveScreenshotOrder] = useState(null); // { url, orderId, status, orderRef }
  const [shippingModalOrder, setShippingModalOrder] = useState(null);
  const [shippingForm, setShippingForm] = useState({ courierPartner: 'Delhivery', trackingNumber: '', shippingCost: 0, packagingCost: 0, dispatchDate: new Date().toISOString().split('T')[0] });
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'Verification Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled'
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [receiptOrderId, setReceiptOrderId] = useState(null); // open ReceiptModal for this orderId
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
            await loadAllData();
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

  const loadAllData = async () => {
    try {
      const [
        carsRes,
        ordersRes,
        expensesRes,
        splitsRes,
        notificationsRes,
        cmsRes,
        settingsRes,
        receiptsData
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/products`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/orders`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/expenses`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/splits`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/notifications`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/homepage-cms`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/settings`, { credentials: 'include' }),
        getReceipts()
      ]);

      if (carsRes.ok) setCars(await carsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
      if (splitsRes.ok) setSplitsData(await splitsRes.json());
      if (notificationsRes.ok) {
        const notifs = await notificationsRes.json();
        setNotifications(notifs);
        setHasMoreNotifications(notifs.length === 10);
      }
      if (cmsRes.ok) setCmsData(await cmsRes.json());
      if (settingsRes.ok) setGlobalSettings(await settingsRes.json());
      setReceiptsList(receiptsData || []);

      // Fetch telemetry logs safely
      const telemetryRes = await fetch(`${API_BASE_URL}/admin/telemetry/logs`, { credentials: 'include' }).catch(() => null);
      if (telemetryRes && telemetryRes.ok) {
        setTelemetryLogs(await telemetryRes.json());
      }
      
      // Reset loaded metrics on refetches to ensure they represent fresh data when calculated next
      setKpis(null);
      setAnalytics(null);
    } catch (e) {
      setDbError('Error loading dashboard datasets.');
    }
  };

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

  // Products CRUD handlers
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        await updateCar(editingProductId, productForm);
      } else {
        await addCar(productForm);
      }
      setIsAddingProduct(false);
      setEditingProductId(null);
      await loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleEditProduct = (car) => {
    setProductForm({
      name: car.name,
      brand: car.brand,
      price: car.price,
      scale: car.scale,
      lane: car.lane,
      totalStock: car.totalStock,
      description: car.description,
      image: car.image,
      category: car.category || 'JDM',
      purchasePrice: car.purchasePrice || '',
      maxQtyPerCustomer: car.maxQtyPerCustomer || '',
      hasLimit: !!car.maxQtyPerCustomer
    });
    setEditingProductId(car.id);
    setIsAddingProduct(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to archive this casting?')) return;
    try {
      await deleteCar(id);
      await loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Orders Actions handlers
  const handleConfirmOrder = async (orderId) => {
    if (!confirm('Verify UPI payment screenshot and confirm this order?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Confirmed' })
      });
      if (!res.ok) throw new Error("Verification confirmation failed.");
      await loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Cancel this reservation? Stock will be released back immediately.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Cancelled' })
      });
      if (!res.ok) throw new Error("Order cancellation failed.");
      await loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleShipOrderSubmit = async (e) => {
    e.preventDefault();
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
      await loadAllData();
    } catch (err) {
      showToast(err.message, "error");
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
      await loadAllData();
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
      await loadAllData();
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
      await loadAllData();
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
      await loadAllData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleUpdateGlobalSettings = async (updates) => {
    try {
      await updateGlobalSettings(updates);
      await loadAllData();
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
            { id: 'orders', label: 'Orders', icon: FileText, badge: groupedOrders.filter(o => o.status === 'Verification Pending').length },
            { id: 'receipts', label: 'Invoices', icon: Receipt },
            { id: 'expenses', label: 'Expenses', icon: DollarSign },
            { id: 'finance', label: 'Founder Splits', icon: DollarSign },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'notifications', label: 'Alerts', icon: Bell, badge: notifications.length },
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
                    setProductForm({ name: '', brand: '', price: '', scale: '1:64', lane: 'Standard Edition', totalStock: 10, description: '', image: '', category: 'JDM', purchasePrice: '', maxQtyPerCustomer: '', hasLimit: false });
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
                              <span className="text-[10px] text-[#888888] uppercase tracking-wider">{car.brand} • {car.category}{car.maxQtyPerCustomer ? ` • Limit: ${car.maxQtyPerCustomer}` : ''}</span>
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
                            <button onClick={() => handleEditProduct(car)} className="text-white hover:text-[#ff5500] p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer inline-flex">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => handleDeleteProduct(car.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 transition-colors border border-red-500/10 cursor-pointer inline-flex">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                    { key: 'Active', label: 'Reserved', count: groupedOrders.filter(o => o.status === 'Active').length },
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
                          <span className="font-mono font-bold text-white text-xs block">ORDER {order.id.slice(0, 8)}</span>
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
                                    if (res.ok) await loadAllData();
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
                                    loadAllData();
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
            </div>
          )}

          {/* 6. FOUNDER SPLITS TAB */}
          {adminTab === 'finance' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Founder Split settlements Ledger
                </h3>
                <button
                  onClick={() => setIsAddingSettlement(true)}
                  className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_15px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
                >
                  <Plus size={14} /> Record Transfer
                </button>
              </div>

              {/* Balances Ledger Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.keys(splitsData.balances || {}).map(f => {
                  const bal = splitsData.balances[f];
                  const owes = bal < 0;
                  return (
                    <div key={f} className="bg-[#141414] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5" />
                      <p className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">{f}</p>
                      <h3 className={`text-xl font-black mt-2 font-mono ${owes ? 'text-red-400' : 'text-emerald-400'}`}>
                        {owes ? '-' : '+'}₹{Math.abs(Number(bal.toFixed(2))).toLocaleString('en-IN')}
                      </h3>
                      <p className="text-[9px] text-[#666666] uppercase mt-1">
                        {owes ? 'Owes split adjustments' : 'Owed split balance'}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Settlement adjustments ledger transfers recommendations */}
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
                  notifications.map(n => (
                    <div key={n.id} className="p-4 border rounded-xl flex gap-3 text-xs bg-[#ff5500]/5 border-[#ff5500]/20 text-[#ff5500] relative group">
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
                  ))
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

              <div className="h-[1px] bg-white/5 my-8" />

              <div className="space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Error Telemetry Logs
                    </h3>
                    <p className="text-[10px] text-[#888888] mt-0.5">Captured runtime exceptions from frontend and backend services.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_BASE_URL}/admin/telemetry/logs`, { credentials: 'include' });
                          if (res.ok) setTelemetryLogs(await res.json());
                        } catch (err) {
                          console.error("Failed to refresh telemetry:", err);
                        }
                      }}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Refresh Logs
                    </button>
                    <button
                      onClick={() => {
                        throw new Error("Telemetry Test Error: This is a manual test error triggered by admin console.");
                      }}
                      className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Trigger Test Error
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2" data-lenis-prevent="true">
                  {telemetryLogs.length === 0 ? (
                    <div className="text-center py-12 text-[#888888] text-xs">
                      No telemetry logs captured yet.
                    </div>
                  ) : (
                    telemetryLogs.map(log => (
                      <div key={log.id} className="p-4 bg-[#141416] border border-white/5 rounded-xl text-xs space-y-2 relative group">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              log.source === 'frontend' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                              {log.source}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              log.level === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {log.level}
                            </span>
                            {log.user_email && (
                              <span className="text-[10px] text-white/40 font-bold">
                                {log.user_email}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-white/30 font-mono">
                            {new Date(log.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="text-white font-bold leading-relaxed pr-8">
                          {log.message}
                        </div>

                        {log.url && (
                          <div className="text-[10px] text-white/40 font-mono truncate">
                            URL: <span className="text-[#ff5500]/60">{log.url}</span>
                          </div>
                        )}

                        {log.user_agent && (
                          <div className="text-[9px] text-[#555555] font-mono truncate" title={log.user_agent}>
                            UA: {log.user_agent}
                          </div>
                        )}

                        {log.stack && (
                          <div className="pt-1">
                            <button
                              onClick={() => setExpandedLogs(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
                              className="text-[10px] font-bold text-[#ff5500] hover:underline uppercase tracking-wider cursor-pointer bg-transparent border-0"
                            >
                              {expandedLogs[log.id] ? 'Hide Stack Trace' : 'View Stack Trace'}
                            </button>
                            {expandedLogs[log.id] && (
                              <pre className="font-mono text-[9px] bg-black/50 border border-white/5 p-3 rounded-lg overflow-x-auto text-[#ee7777] mt-2 leading-relaxed max-w-full whitespace-pre-wrap break-all">
                                {log.stack}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl">
            <div className="h-[2px] bg-[#ff5500]" />
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {editingProductId ? 'Edit Casting Model' : 'Add New Casting'}
              </h3>
              <button onClick={() => setIsAddingProduct(false)} className="text-[#888888] hover:text-white text-xs">✕</button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-4 text-xs" data-lenis-prevent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Brand</label>
                  <input type="text" value={productForm.brand} onChange={e => setProductForm(p => ({ ...p, brand: e.target.value }))} placeholder="MINI GT" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Model Name</label>
                  <input type="text" value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} placeholder="Nissan GT-R R35" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40" required />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Scale</label>
                  <input type="text" value={productForm.scale} onChange={e => setProductForm(p => ({ ...p, scale: e.target.value }))} placeholder="1:64" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Cost Price (Casting)</label>
                  <input type="number" value={productForm.purchasePrice} onChange={e => setProductForm(p => ({ ...p, purchasePrice: e.target.value }))} placeholder="450" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Selling Price</label>
                  <input type="number" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} placeholder="1200" className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Category</label>
                  <input type="text" value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Total Stock</label>
                  <input type="number" value={productForm.totalStock} onChange={e => setProductForm(p => ({ ...p, totalStock: Number(e.target.value) }))} className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Upload Casting Image</label>
                <div className="flex gap-4 items-center">
                  <input type="file" onChange={handleImageUpload} accept="image/*" className="hidden" id="admin-prod-image-file" />
                  <label htmlFor="admin-prod-image-file" className="bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white font-bold px-4 py-3.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer flex-1 text-center">
                    {uploadingImage ? 'Uploading image...' : 'Browse image'}
                  </label>
                  {productForm.image && (
                    <img src={productForm.image} className="w-12 h-10 object-cover rounded border border-white/5" />
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">Description</label>
                <textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} rows="3" placeholder="Additional details..." className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none" />
              </div>

              {/* Purchase Limit Fields */}
              <div className="bg-[#141414]/50 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="admin-prod-has-limit"
                    checked={productForm.hasLimit}
                    onChange={e => setProductForm(p => ({
                      ...p,
                      hasLimit: e.target.checked,
                      maxQtyPerCustomer: e.target.checked ? (p.maxQtyPerCustomer || '1') : ''
                    }))}
                    className="accent-[#ff5500]"
                  />
                  <label htmlFor="admin-prod-has-limit" className="text-xs font-bold text-white uppercase tracking-wider cursor-pointer">
                    Add purchase limit per customer
                  </label>
                </div>
                {productForm.hasLimit && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#888888] uppercase tracking-widest block">
                      Max Quantity Allowed Per Customer
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={productForm.maxQtyPerCustomer}
                      onChange={e => setProductForm(p => ({ ...p, maxQtyPerCustomer: e.target.value }))}
                      placeholder="e.g. 1"
                      className="w-full bg-[#141414] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff5500]/40 font-mono"
                      required
                    />
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider shadow-lg transition-colors cursor-pointer">
                Save Casting
              </button>
            </form>
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
