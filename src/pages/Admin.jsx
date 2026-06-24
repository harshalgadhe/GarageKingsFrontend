import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Trash2, Edit2, Save, X, Settings, Eye, EyeOff, LogOut, User, Search,
  DollarSign, TrendingUp, Bell, FileText, Users, AlertTriangle, Layers, Calendar
} from 'lucide-react';
import { getSetupStatus, getCurrentUser, signOutCognito } from '../lib/auth';
import { getCars, addCar, updateCar, deleteCar, uploadImageToStorage, getGlobalSettings, updateGlobalSettings } from '../lib/db';
import Navigation from '../components/Navigation';

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
  const [kpis, setKpis] = useState({ revenue: 0, expenses: 0, profit: 0, pendingPayments: 0, inventoryValue: 0 });
  const [analytics, setAnalytics] = useState({ topSellingProduct: null, topBrand: null, averageOrderValue: 0, topCustomer: null, deadStockCount: 0, deadStock: [] });
  const [notifications, setNotifications] = useState([]);
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
  const [productForm, setProductForm] = useState({ name: '', brand: '', price: '', scale: '1:64', lane: '', totalStock: 10, description: '', image: '', category: 'JDM', purchasePrice: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  const [activeScreenshotUrl, setActiveScreenshotUrl] = useState(null);
  const [shippingModalOrder, setShippingModalOrder] = useState(null);
  const [shippingForm, setShippingForm] = useState({ courierPartner: 'Delhivery', trackingNumber: '', shippingCost: 0, packagingCost: 0, dispatchDate: new Date().toISOString().split('T')[0] });

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
        const setup = await getSetupStatus();
        if (setup && setup.isSetupRequired) {
          navigate('/setup');
          return;
        }

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
        console.error("Setup validation failed:", err);
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
        kpiRes,
        analyticsRes,
        notificationsRes,
        cmsRes,
        settingsRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/products`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/orders`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/expenses`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/splits`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/dashboard/kpis`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/analytics`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/notifications`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/homepage-cms`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/settings`, { credentials: 'include' })
      ]);

      if (carsRes.ok) setCars(await carsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
      if (splitsRes.ok) setSplitsData(await splitsRes.json());
      if (kpiRes.ok) setKpis(await kpiRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (notificationsRes.ok) setNotifications(await notificationsRes.json());
      if (cmsRes.ok) setCmsData(await cmsRes.json());
      if (settingsRes.ok) setGlobalSettings(await settingsRes.json());
    } catch (e) {
      setDbError('Error loading dashboard datasets.');
    }
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
      alert("Image archival upload failed: " + err.message);
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
      alert(err.message);
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
      purchasePrice: car.purchasePrice || ''
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
      alert(err.message);
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
      alert(err.message);
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
      alert(err.message);
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
      alert(err.message);
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
      alert(err.message);
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
      alert(err.message);
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
      alert(err.message);
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
      alert(err.message);
    }
  };

  const handleUpdateGlobalSettings = async (updates) => {
    try {
      await updateGlobalSettings(updates);
      await loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/notifications/read`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        await loadAllData();
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
            { id: 'orders', label: 'Orders', icon: FileText },
            { id: 'expenses', label: 'Expenses', icon: DollarSign },
            { id: 'finance', label: 'Founder Splits', icon: DollarSign },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'notifications', label: 'Alerts', icon: Bell, badge: notifications.filter(n => !n.is_read).length },
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
            <span>Logout System</span>
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
                    setProductForm({ name: '', brand: '', price: '', scale: '1:64', lane: 'Standard Edition', totalStock: 10, description: '', image: '', category: 'JDM', purchasePrice: '' });
                    setEditingProductId(null);
                    setIsAddingProduct(true);
                  }}
                  className="bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_15px_-4px_rgba(255,85,0,0.3)] cursor-pointer"
                >
                  <Plus size={14} /> Add Casting
                </button>
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
                    {cars.map(car => {
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
                              <span className="text-[10px] text-[#888888] uppercase tracking-wider">{car.brand} • {car.category}</span>
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
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Orders & Payments Pipeline
              </h3>

              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/5">
                      <div>
                        <span className="font-mono font-bold text-white text-xs block">ORDER {order.id.slice(0, 8)}</span>
                        <span className="text-[10px] text-[#888888] mt-0.5 block">
                          Logged: {new Date(order.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                        order.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        order.status === 'Shipped' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        order.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                      {/* Product details */}
                      <div>
                        <p className="text-[9px] font-bold text-[#888888] uppercase tracking-wider">Casting</p>
                        <p className="font-bold text-white mt-1">{order.productBrand} {order.productName}</p>
                        <p className="font-mono text-white/50 mt-0.5">₹{Number(order.priceAtPurchase).toLocaleString('en-IN')} (x{order.qty})</p>
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
                                alert('Instagram handle copied to clipboard.');
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

                      {/* Payment & Actions */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-[9px] font-bold text-[#888888] uppercase tracking-wider">UPI Receipt</p>
                          {order.screenshotUrl ? (
                            <button
                              onClick={() => setActiveScreenshotUrl(`${API_BASE_URL}/admin/orders/${order.id}/screenshot`)}
                              className="mt-1 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors inline-flex cursor-pointer"
                            >
                              View Screenshot
                            </button>
                          ) : (
                            <span className="text-[#666666] italic block mt-1">No file uploaded</span>
                          )}
                        </div>
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
                      </div>
                    )}
                  </div>
                ))}
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
              {/* Analytics summary details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Top Selling Brand', val: analytics.topBrand || 'N/A' },
                  { label: 'Top Casting Model', val: analytics.topSellingProduct ? `${analytics.topSellingProduct.brand} ${analytics.topSellingProduct.name}` : 'N/A' },
                  { label: 'Average Order Value', val: `₹${Number(analytics.averageOrderValue.toFixed(2)).toLocaleString('en-IN')}` },
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
                      {analytics.deadStock?.map(car => (
                        <tr key={car.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="p-3 font-bold text-white">{car.brand} {car.name}</td>
                          <td className="p-3 font-mono text-[#888888]">{new Date(car.createdAt).toLocaleDateString('en-IN')}</td>
                          <td className="p-3 text-center font-mono font-bold text-white">{car.available}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. ALERTS TAB */}
          {adminTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  System Alerts Feed
                </h3>
                <button
                  onClick={handleMarkNotificationsRead}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Mark All Read
                </button>
              </div>

              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 border rounded-xl flex gap-3 text-xs ${
                    n.is_read 
                      ? 'bg-[#141414] border-white/5 opacity-55' 
                      : 'bg-[#ff5500]/5 border-[#ff5500]/20 text-[#ff5500]'
                  }`}>
                    <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                    <div>
                      <span className="font-extrabold text-white block uppercase tracking-wide mb-0.5">{n.title}</span>
                      <span className="text-[#888888] leading-relaxed block">{n.message}</span>
                      <span className="text-[9px] text-[#555555] font-mono mt-1 block">
                        {new Date(n.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* 10. SETTINGS TAB */}
          {adminTab === 'settings' && (
            <div className="space-y-8">
              {/* CMS control panel */}
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    CMS Homepage Sections Visibility settings
                  </h4>
                  <p className="text-[10px] text-[#888888] mt-0.5">Toggle section display visibilities on landing views.</p>
                </div>
                
                <div className="space-y-3">
                  {cmsData.sections?.map(sec => (
                    <div key={sec.id} className="flex justify-between items-center bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{sec.section_name}</span>
                      <button
                        onClick={() => handleToggleCmsSection(sec.section_name, sec.is_visible)}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          sec.is_visible 
                            ? 'bg-[#ff5500]/10 border-[#ff5500]/30 text-[#ff5500]' 
                            : 'bg-white/5 border-white/10 text-[#888888]'
                        }`}
                      >
                        {sec.is_visible ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                  ))}
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
      {activeScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0f0f0f] border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">UPI Receipt Screenshot</h3>
            <div className="aspect-[3/4] bg-[#090909] border border-white/5 rounded-xl overflow-hidden relative">
              <img 
                src={activeScreenshotUrl} 
                alt="Receipt screenshot details" 
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = `<span class="text-[#888888] text-xs font-bold absolute inset-0 flex items-center justify-center">Image failed to stream or expired.</span>`;
                }}
              />
            </div>
            <button 
              onClick={() => setActiveScreenshotUrl(null)}
              className="mt-4 bg-white/5 hover:bg-white/10 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/10 uppercase tracking-wider transition-colors w-full cursor-pointer"
            >
              Close receipt viewport
            </button>
          </div>
        </div>
      )}

      {/* 2. Add/Edit Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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

              <button type="submit" className="w-full bg-[#ff5500] hover:bg-[#ff6611] text-black font-extrabold py-3.5 rounded-xl uppercase tracking-wider shadow-lg transition-colors cursor-pointer">
                Save Casting
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Ship Order Modal */}
      {shippingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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

    </div>
  );
}
