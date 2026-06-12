import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, Save, X, Image as ImageIcon, Settings, Eye, EyeOff, LogOut, Mail, Lock, ShieldAlert, CheckCircle2, User, Search } from 'lucide-react'
import { getCars, addCar, updateCar, deleteCar, uploadImageToStorage, getGlobalSettings, updateGlobalSettings, getAdminOrders, updateOrderStatus, getReceipts, addReceipt, deleteReceipt, getCustomers, addCustomer } from '../lib/db'
import { Link } from 'react-router-dom'
import { signOutCognito, getCurrentUser } from '../lib/auth'
import Navigation from '../components/Navigation'
import AuthModal from '../components/AuthModal'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [dbError, setDbError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [showAdminConsole, setShowAdminConsole] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true)

  const [isAdmin, setIsAdmin] = useState(false)
  const [customerOrders, setCustomerOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const [cars, setCars] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [globalSettings, setGlobalSettings] = useState({ 
    showPrices: false, 
    adminPath: '9f7a4b2c-8d1e-45a9-b3f6-c1d2e8a7b9f0',
    dropDate: '',
    dropTime: '20:00',
    dropLabel: 'Friday · 8:00 PM IST',
    dropDesc: 'Every Friday at 8 PM IST, we release a fresh batch of 1:64 heat.'
  })
  const [tempAdminPath, setTempAdminPath] = useState('')
  const [tempDropDate, setTempDropDate] = useState('')
  const [tempDropTime, setTempDropTime] = useState('20:00')
  const [tempDropLabel, setTempDropLabel] = useState('')
  const [tempDropDesc, setTempDropDesc] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // Form state
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', brand: '', price: '', scale: '1:64', lane: '', quantity: 10, description: '', image: '', tags: [] })

  // Admin Tab & Orders states
  const [adminTab, setAdminTab] = useState('inventory')
  const [orders, setOrders] = useState([])
  const [tempTracking, setTempTracking] = useState({})
  const [user, setUser] = useState(null)

  // Billing Receipts states
  const [receipts, setReceipts] = useState([])
  const [customers, setCustomers] = useState([])
  const [receiptsLoading, setReceiptsLoading] = useState(false)
  const [isAddingReceipt, setIsAddingReceipt] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [receiptSearch, setReceiptSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')

  // Manual Receipt Form States
  const [receiptNum, setReceiptNum] = useState('')
  const [custMode, setCustMode] = useState('select') // 'select' | 'new'
  const [selCustId, setSelCustId] = useState('')
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustInsta, setNewCustInsta] = useState('')
  const [newCustAddr, setNewCustAddr] = useState('')
  const [rcFormat, setRcFormat] = useState('standard')
  const [rcTaxPercent, setRcTaxPercent] = useState(0)
  const [rcShipping, setRcShipping] = useState(0)
  const [rcAdvance, setRcAdvance] = useState(0)
  const [rcFooter, setRcFooter] = useState('Thank you for your purchase from Garage Kings!')
  const [rcItems, setRcItems] = useState([{ description: '', qty: 1, amount: 0 }])

  const handleAddRcItem = () => {
    setRcItems(prev => [...prev, { description: '', qty: 1, amount: 0 }]);
  }

  const handleUpdateRcItem = (idx, field, value) => {
    setRcItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  const handleRemoveRcItem = (idx) => {
    setRcItems(prev => prev.filter((_, i) => i !== idx));
  }

  const handleSelectCarForReceiptItem = (idx, carId) => {
    const car = cars.find(c => c.id === carId);
    if (car) {
      handleUpdateRcItem(idx, 'description', car.name);
      handleUpdateRcItem(idx, 'amount', Number(car.price || 0));
    }
  }

  const handleOpenReceiptModal = () => {
    setReceiptNum(`GK-RC-${Date.now().toString().slice(-6)}`);
    setCustMode('select');
    setSelCustId(customers.length > 0 ? customers[0].id : '');
    setNewCustName('');
    setNewCustPhone('');
    setNewCustInsta('');
    setNewCustAddr('');
    setRcFormat('standard');
    setRcTaxPercent(0);
    setRcShipping(0);
    setRcAdvance(0);
    setRcFooter('Thank you for your purchase from Garage Kings!');
    setRcItems([{ description: '', qty: 1, amount: 0 }]);
    setIsAddingReceipt(true);
  }

  const calculateLiveTotal = () => {
    const subtotal = rcItems.reduce((sum, item) => sum + (Number(item.amount) * Number(item.qty)), 0);
    const tax = subtotal * (Number(rcTaxPercent) / 100);
    const total = subtotal + tax + Number(rcShipping);
    const balance = Math.max(0, total - Number(rcAdvance));
    return { subtotal, tax, shipping: Number(rcShipping) || 0, total, balance };
  }

  const handleSaveReceipt = async (e) => {
    e.preventDefault();
    if (rcItems.length === 0 || rcItems.some(i => !i.description || i.amount < 0)) {
      alert("Please add at least one item with valid description and price.");
      return;
    }
    
    setReceiptsLoading(true);
    try {
      let finalCustomerId = selCustId;
      let customerName = '';
      let customerPhone = '';
      let customerInstagram = '';
      let customerAddress = '';

      if (custMode === 'new') {
        finalCustomerId = 'dummy';
        customerName = newCustName.trim();
        customerPhone = newCustPhone.trim();
        customerInstagram = newCustInsta.trim();
        customerAddress = newCustAddr.trim();
      }
      
      if (custMode === 'select' && !finalCustomerId) {
        throw new Error("No customer selected.");
      }
      
      await addReceipt({
        receiptNumber: receiptNum.trim(),
        customerId: finalCustomerId,
        formatType: rcFormat,
        taxPercent: Number(rcTaxPercent),
        shippingCharges: Number(rcShipping),
        advancePaid: Number(rcAdvance),
        footerNote: rcFooter.trim(),
        items: rcItems,
        customerName,
        customerPhone,
        customerInstagram,
        customerAddress
      });
      
      alert("Receipt generated successfully!");
      setIsAddingReceipt(false);
      loadData();
    } catch (err) {
      alert("Failed to generate receipt: " + err.message);
    } finally {
      setReceiptsLoading(false);
    }
  }

  const handleDeleteReceipt = async (id) => {
    if (!confirm("Are you sure you want to delete this receipt record? This will not revert inventory changes.")) return;
    try {
      await deleteReceipt(id);
      setReceipts(prev => prev.filter(r => r.id !== id));
      alert("Receipt record deleted successfully.");
    } catch (err) {
      alert("Failed to delete receipt: " + err.message);
    }
  }

  useEffect(() => {
    // Listen to AWS Cognito active session
    const activeSession = getCurrentUser()
    setUser(activeSession)
    if (activeSession) {
      setIsAuthenticated(true)
      const userIsAdmin = activeSession.roles.includes('admin')
      setIsAdmin(userIsAdmin)
      
      // Check query parameter for admin console view
      const params = new URLSearchParams(window.location.search)
      if (userIsAdmin && params.get('admin') === 'true') {
        setShowAdminConsole(true)
      } else {
        setShowAdminConsole(false)
      }
    } else {
      setIsAuthenticated(false)
      setIsAdmin(false)
      setShowAdminConsole(false)
    }
    setIsAuthLoading(false)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        loadData()
      } else {
        loadCustomerOrders()
      }
    }
  }, [isAuthenticated, isAdmin])

  const loadCustomerOrders = async () => {
    setOrdersLoading(true)
    try {
      const token = localStorage.getItem('gk_cognito_id_token') || localStorage.getItem('gk_cognito_access_token');
      const response = await fetch('/api/v1/orders', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) throw new Error("Failed to load your acquisitions list.");
      const data = await response.json();
      setCustomerOrders(data.orders || data);
    } catch (err) {
      console.error("Error loading customer orders:", err);
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const [carData, settingsData, ordersData, receiptsData, customersData] = await Promise.all([
        getCars(),
        getGlobalSettings(),
        getAdminOrders(),
        getReceipts().catch(err => { console.error("Error fetching receipts:", err); return []; }),
        getCustomers().catch(err => { console.error("Error fetching customers:", err); return []; })
      ])
      setCars(carData)
      setGlobalSettings(settingsData)
      setOrders(ordersData || [])
      setReceipts(receiptsData || [])
      setCustomers(customersData || [])
      setTempAdminPath(settingsData?.adminPath || '9f7a4b2c-8d1e-45a9-b3f6-c1d2e8a7b9f0')
      const todayStr = new Date().toISOString().split('T')[0]
      setTempDropDate(settingsData?.dropDate || todayStr)
      setTempDropTime(settingsData?.dropTime || '20:00')
      setTempDropLabel(settingsData?.dropLabel || 'Friday · 8:00 PM IST')
      setTempDropDesc(settingsData?.dropDesc || 'Every Friday at 8 PM IST, we release a fresh batch of 1:64 heat.')
    } catch (err) {
      alert("Failed to load dashboard data: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleShowPrices = async () => {
    const newValue = !globalSettings.showPrices
    setGlobalSettings({ ...globalSettings, showPrices: newValue })
    try {
      await updateGlobalSettings({ showPrices: newValue })
    } catch (e) {
      alert("Failed to update settings: " + e.message)
      setGlobalSettings({ ...globalSettings, showPrices: !newValue }) // revert
    }
  }

  const saveAdminPath = async () => {
    if (!tempAdminPath.trim()) return alert("Admin path cannot be empty")
    if (!/^[a-zA-Z0-9-_]+$/.test(tempAdminPath)) {
      return alert("Admin path can only contain letters, numbers, dashes, and underscores.")
    }
    
    try {
      await updateGlobalSettings({ adminPath: tempAdminPath.trim() })
      setGlobalSettings({ ...globalSettings, adminPath: tempAdminPath.trim() })
      alert("Admin path updated! Note: You will need to use this new URL to access this page next time.")
      setIsSettingsOpen(false)
    } catch (e) {
      alert("Failed to update admin path: " + e.message)
    }
  }

  const saveDropSettings = async () => {
    try {
      const dropSettings = {
        dropDate: tempDropDate,
        dropTime: tempDropTime,
        dropLabel: tempDropLabel.trim(),
        dropDesc: tempDropDesc.trim()
      }
      await updateGlobalSettings(dropSettings)
      setGlobalSettings({ ...globalSettings, ...dropSettings })
      alert("Drop schedule updated successfully!")
    } catch (e) {
      alert("Failed to update drop settings: " + e.message)
    }
  }

  // Helper methods removed; AuthModal handles all login/registration flows.

  const handleLogout = () => {
    signOutCognito()
    setIsAuthenticated(false)
    setIsAdmin(false)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await uploadImageToStorage(file)
      if (url) {
        setFormData({ ...formData, image: url })
      }
    } catch (err) {
      alert("Failed to upload image: " + err.message)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.price) return alert("Name and price are required")
    
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity || 10)
      }
      
      if (editingId) {
        await updateCar(editingId, payload)
      } else {
        await addCar(payload)
      }
      
      setFormData({ name: '', brand: '', price: '', scale: '1:64', lane: '', quantity: 10, description: '', image: '', tags: [] })
      setIsAdding(false)
      setEditingId(null)
      loadData()
    } catch (err) {
      alert("Failed to save item: " + err.message)
      console.error(err)
    }
  }

  const handleEdit = (car) => {
    setFormData({
      name: car.name || '',
      brand: car.brand || '',
      price: String(car.price || ''),
      scale: car.scale || '1:64',
      lane: car.lane || '',
      quantity: car.quantity !== undefined ? car.quantity : 10,
      description: car.description || '',
      image: car.image || '',
      tags: car.tags || []
    })
    setEditingId(car.id)
    setIsAdding(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteCar(id)
      loadData()
    }
  }

  // Helper methods removed; AuthModal handles all login/registration flows.

  const handleUpdateOrderStatus = async (orderId, newStatus, newTracking) => {
    try {
      await updateOrderStatus(orderId, newStatus, newTracking)
      alert("Order updated successfully!")
      loadData()
    } catch (err) {
      alert("Failed to update order: " + err.message)
    }
  }

  // React hook to group orders loaded as rows
  const groupedOrders = useMemo(() => {
    const map = {}
    orders.forEach(row => {
      if (!map[row.id]) {
        map[row.id] = {
          id: row.id,
          status: row.status,
          totalPrice: row.totalPrice,
          shippingAddress: row.shippingAddress,
          trackingNumber: row.trackingNumber,
          createdAt: row.createdAt,
          customerEmail: row.customerEmail,
          items: []
        }
      }
      map[row.id].items.push({
        productName: row.productName,
        productBrand: row.productBrand,
        priceAtPurchase: row.priceAtPurchase,
        qty: row.qty
      })
    })
    return Object.values(map).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [orders])

  const filteredOrders = useMemo(() => {
    const query = orderSearch.toLowerCase().trim();
    if (!query) return groupedOrders;
    return groupedOrders.filter(order => {
      return (
        (order.id && order.id.toLowerCase().includes(query)) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(query)) ||
        (order.status && order.status.toLowerCase().includes(query)) ||
        (order.shippingAddress && order.shippingAddress.toLowerCase().includes(query)) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(query)) ||
        order.items.some(item => 
          (item.productName && item.productName.toLowerCase().includes(query)) ||
          (item.productBrand && item.productBrand.toLowerCase().includes(query))
        )
      );
    });
  }, [groupedOrders, orderSearch]);

  const filteredReceipts = useMemo(() => {
    const query = receiptSearch.toLowerCase().trim();
    if (!query) return receipts;
    return receipts.filter(r => {
      return (
        (r.receipt_number && r.receipt_number.toLowerCase().includes(query)) ||
        (r.customer_name && r.customer_name.toLowerCase().includes(query)) ||
        (r.customer_phone && r.customer_phone.toLowerCase().includes(query)) ||
        (r.customer_instagram && r.customer_instagram.toLowerCase().includes(query)) ||
        (r.format_type && r.format_type.toLowerCase().includes(query))
      );
    });
  }, [receipts, receiptSearch]);

  if (isAuthLoading) {
    return (
      <div className="min-h-[100svh] bg-[#050505] flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full blur-xl bg-gk-yellow/10 animate-pulse"></div>
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-gk-yellow animate-spin relative z-10"></div>
        </div>
        <div className="text-white/40 text-[10px] font-black tracking-[0.25em] uppercase">Accessing Vault...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100svh] bg-[#050505] text-white pt-28 md:pt-36 pb-20 px-6 md:px-12 font-sans selection:bg-gk-yellow selection:text-black flex flex-col items-center justify-center relative overflow-hidden">
        <Navigation activeSection="garage" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,179,0,0.04)_0%,transparent_70%)] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#0a0a0d] border border-white/10 p-8 rounded-2xl w-full max-w-md text-center flex flex-col gap-6 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gk-yellow to-transparent" />
          
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <User className="text-gk-yellow" size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight italic font-grotesk">Your Garage</h1>
            <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">
              Your digital collection awaits. Sign in to view your custom garage, track orders, and secure premium drops.
            </p>
          </div>

          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full bg-gk-yellow text-black font-black py-4 rounded-xl hover:bg-yellow-400 hover:shadow-[0_0_30px_rgba(255,179,0,0.25)] transition-all cursor-pointer text-sm uppercase tracking-wider"
          >
            Sign In / Register
          </button>
        </motion.div>

        <AnimatePresence>
          {isAuthModalOpen && (
            <AuthModal 
              isOpen={isAuthModalOpen} 
              onClose={() => setIsAuthModalOpen(false)} 
              themeColor="orange" 
              onAuthSuccess={(user) => {
                setIsAuthModalOpen(false)
                setIsAuthenticated(true)
                const userIsAdmin = user?.roles?.includes('admin') || false
                setIsAdmin(userIsAdmin)
                setShowAdminConsole(false)
                window.location.reload()
              }}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (isAuthenticated && (!isAdmin || !showAdminConsole)) {
    let rank = 'Bronze Collector';
    if (customerOrders.length >= 6) {
      rank = 'Gold Collector';
    } else if (customerOrders.length >= 3) {
      rank = 'Silver Collector';
    }

    const totalSpent = customerOrders.reduce((sum, order) => sum + Number(order.priceAtPurchase || 0) * Number(order.qty || 1), 0);
    
    let nextRankMessage = 'Next upgrade: Silver Collector at 3 pieces';
    if (customerOrders.length >= 6) {
      nextRankMessage = 'Ultimate Collector status unlocked';
    } else if (customerOrders.length >= 3) {
      nextRankMessage = 'Next upgrade: Gold Collector at 6 pieces';
    }

    return (
      <div className="min-h-[100svh] bg-gk-black text-white pt-28 md:pt-36 pb-20 px-6 md:px-12 font-sans selection:bg-gk-orange selection:text-black">
        <Navigation activeSection="garage" />
        <div className="max-w-5xl mx-auto">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white font-grotesk uppercase italic">
                {user?.displayName ? `${user.displayName}'s Garage` : 'Your Garage'}
              </h1>
              <p className="text-white/40 text-xs mt-2 font-medium">
                {user ? `Logged in as ${user.email}` : 'Manage your collection and order history.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              {isAdmin && (
                <button 
                  onClick={() => setShowAdminConsole(true)}
                  className="px-6 py-2.5 rounded-full bg-purple-600 border border-purple-500/30 text-white text-sm font-bold flex items-center gap-2 hover:bg-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
                >
                  <Settings size={16} /> Admin Console
                </button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-5xl">🏆</div>
              <div className="text-xs font-black uppercase text-gk-orange tracking-widest mb-2">Collector Rank</div>
              <div className="text-2xl font-black text-white">{rank}</div>
              <div className="text-[10px] text-white/40 mt-1">{nextRankMessage}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-5xl">📦</div>
              <div className="text-xs font-black uppercase text-gk-orange tracking-widest mb-2">Acquisitions</div>
              <div className="text-3xl font-mono font-black text-white">{customerOrders.length}</div>
              <div className="text-[10px] text-white/40 mt-1">Total pieces secured from the vault</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-5xl">💎</div>
              <div className="text-xs font-black uppercase text-gk-orange tracking-widest mb-2">Estimated Value</div>
              <div className="text-2xl font-mono font-black text-emerald-400">₹{totalSpent.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-white/40 mt-1 font-semibold">Valuation of authenticated castings</div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-6 md:p-8">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider italic font-grotesk">Acquisitions & Order History</h3>
            
            {ordersLoading ? (
              <div className="py-12 text-center text-white/50 animate-pulse">Loading orders...</div>
            ) : customerOrders.length === 0 ? (
              <div className="py-12 text-center text-white/40">
                <div className="text-4xl mb-4">📭</div>
                <p className="font-bold text-sm">No acquisitions found</p>
                <p className="text-xs text-white/30 mt-1">Items you buy in the marketplace will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customerOrders.map(order => (
                  <div key={order.id} className="p-4 md:p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gk-orange/30 transition-colors">
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs text-white/40">Order #{order.id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          order.status === 'Shipped' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-gk-orange/10 text-gk-orange border border-gk-orange/20'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white leading-tight">{order.productName || 'Die-cast Casting Model'}</h4>
                      <p className="text-[10px] text-gk-orange uppercase tracking-wider mt-0.5">{order.productBrand || 'MiniGT'}</p>
                      <p className="text-xs text-white/50 mt-1.5">Shipping to: {order.shippingAddress?.split('|')[0]}</p>
                      {order.trackingNumber && (
                        <div className="text-xs font-semibold text-gk-yellow mt-2">Tracking Code: {order.trackingNumber}</div>
                      )}
                    </div>
                    <div className="text-left md:text-right shrink-0">
                      <div className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Date Placed</div>
                      <div className="text-xs text-white/80 font-bold mb-2">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/30 mb-0.5">Total Paid</div>
                      <div className="font-mono text-lg font-black text-white">₹{(order.priceAtPurchase || 0).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-gk-black text-white pt-28 md:pt-36 pb-20 px-6 md:px-12 font-sans selection:bg-gk-yellow selection:text-black">
      <Navigation activeSection="garage" />
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase italic font-grotesk">Vault Console</h1>
            <p className="text-white/50 mt-2">Manage your die-cast inventory and customer orders.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={toggleShowPrices}
              className={`px-4 py-2.5 rounded-full border text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${globalSettings.showPrices ? 'border-gk-yellow text-gk-yellow bg-gk-yellow/10' : 'border-white/20 text-white hover:bg-white/10'}`}
            >
              {globalSettings.showPrices ? <><Eye size={16} /> Prices Visible</> : <><EyeOff size={16} /> Prices Hidden</>}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`px-4 py-2.5 rounded-full border text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${isSettingsOpen ? 'border-white text-white bg-white/10' : 'border-white/20 text-white hover:bg-white/10'}`}
            >
              <Settings size={16} /> Security
            </button>
            <button 
              onClick={() => setShowAdminConsole(false)}
              className="px-6 py-2.5 rounded-full border border-white/20 text-sm font-semibold hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <User size={16} /> View Profile
            </button>
            <Link to="/marketplace" className="px-6 py-2.5 rounded-full border border-white/20 text-sm font-semibold hover:bg-white/10 transition-colors flex items-center">
              View Marketplace
            </Link>
            <button 
              onClick={() => {
                setFormData({ name: '', brand: '', price: '', scale: '1:64', lane: '', quantity: 10, description: '', image: '' })
                setEditingId(null)
                setIsAdding(true)
              }}
              className={`px-6 py-2.5 rounded-full bg-gk-yellow text-black text-sm font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors cursor-pointer ${adminTab !== 'inventory' ? 'hidden' : ''}`}
            >
              <Plus size={16} /> Add Item
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-sm font-bold flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8 border-b border-white/8 pb-0">
          {['inventory', 'orders', 'receipts'].map(t => (
            <button key={t} onClick={() => setAdminTab(t)}
              className={`px-5 py-3 text-sm font-black uppercase tracking-wider rounded-t-xl transition-colors cursor-pointer ${
                adminTab === t ? 'bg-white/8 border border-white/10 border-b-0 text-gk-yellow' : 'text-white/30 hover:text-white/60'
              }`}>
              {t === 'inventory' ? 'Inventory' : t === 'orders' ? '📦 Orders Manager' : '🧾 Receipts'}
            </button>
          ))}
        </div>

        {adminTab === 'inventory' && (
          <>
            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-12 overflow-hidden"
                >
                  <div className="bg-[#111116] border border-white/10 rounded-2xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-start gap-4">
                      <div className="text-gk-yellow mt-1 hidden md:block"><Settings size={24} /></div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">Secret Admin URL</h3>
                        <p className="text-sm text-white/60 mb-4 max-w-2xl">
                          Change the secret path required to access this admin panel. Do not include slashes. 
                          Your current login URL is: <code className="bg-black/50 px-2 py-1 rounded text-gk-yellow break-all">yourdomain.com/{globalSettings.adminPath}/garage</code>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 mb-8 pb-8 border-b border-white/10">
                          <input 
                            type="text" 
                            value={tempAdminPath}
                            onChange={(e) => setTempAdminPath(e.target.value)}
                            className="flex-1 max-w-md bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow"
                          />
                          <button 
                            onClick={saveAdminPath}
                            className="px-6 py-2.5 rounded-lg bg-gk-yellow hover:bg-yellow-400 text-black font-bold transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Update URL
                          </button>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2">Drop Schedule</h3>
                        <p className="text-sm text-white/60 mb-4 max-w-2xl">
                          Configure the countdown timer on the homepage.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Drop Date</label>
                            <input 
                              type="date" 
                              value={tempDropDate} 
                              onChange={(e) => setTempDropDate(e.target.value)}
                              onClick={(e) => {
                                try { e.target.showPicker() } catch(err) { /* ignore */ }
                              }}
                              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Time (24HR format)</label>
                            <input 
                              type="time" 
                              value={tempDropTime}
                              onChange={(e) => setTempDropTime(e.target.value)}
                              onClick={(e) => {
                                try { e.target.showPicker() } catch(err) { /* ignore */ }
                              }}
                              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow cursor-pointer"
                            />
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Short Label</label>
                          <input 
                            type="text" 
                            value={tempDropLabel}
                            onChange={(e) => setTempDropLabel(e.target.value)}
                            placeholder="e.g. Friday · 8:00 PM IST"
                            className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow"
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Description</label>
                          <textarea 
                            value={tempDropDesc}
                            onChange={(e) => setTempDropDesc(e.target.value)}
                            rows={2}
                            placeholder="Every Friday at 8 PM..."
                            className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow"
                          />
                        </div>
                        
                        <button 
                          onClick={saveDropSettings}
                          className="px-6 py-2.5 rounded-lg bg-gk-yellow hover:bg-yellow-400 text-black font-bold transition-colors cursor-pointer"
                        >
                          Save Drop Schedule
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isAdding && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-12 overflow-hidden"
                >
                  <div className="bg-[#111116] border border-white/10 rounded-2xl p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">{editingId ? 'Edit Item' : 'New Item'}</h2>
                      <button onClick={() => setIsAdding(false)} className="text-white/50 hover:text-white cursor-pointer"><X size={20} /></button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Item Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. Nissan Skyline GT-R" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Price (₹)</label>
                        <input type="text" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. 4999" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Die-cast Maker</label>
                        <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. Hot Wheels, MiniGT" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Scale</label>
                        <input type="text" value={formData.scale} onChange={e => setFormData({...formData, scale: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. 1:64" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Lane / Category</label>
                        <input type="text" value={formData.lane} onChange={e => setFormData({...formData, lane: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. The Grail Room" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Warehouse Quantity</label>
                        <input type="number" min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="e.g. 10" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Product Tags</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {['Hot', 'Trending', 'Rare', 'New Release', 'Exclusive'].map(tag => {
                            const isSelected = formData.tags?.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  const currentTags = formData.tags || [];
                                  if (isSelected) {
                                    setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) });
                                  } else {
                                    setFormData({ ...formData, tags: [...currentTags, tag] });
                                  }
                                }}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-gk-yellow text-black border-gk-yellow shadow-[0_0_15px_rgba(255,179,0,0.25)]' 
                                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                        <input 
                          type="text" 
                          placeholder="Or type custom tags (comma separated, e.g. Special Edition, Chase)" 
                          value={formData.tags ? formData.tags.filter(t => !['Hot', 'Trending', 'Rare', 'New Release', 'Exclusive'].includes(t)).join(', ') : ''}
                          onChange={e => {
                            const customStr = e.target.value;
                            const customTags = customStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
                            const presetTags = formData.tags?.filter(t => ['Hot', 'Trending', 'Rare', 'New Release', 'Exclusive'].includes(t)) || [];
                            setFormData({ ...formData, tags: [...presetTags, ...customTags] });
                          }}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Description</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gk-yellow" placeholder="Enter details about this piece..."></textarea>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Image Upload</label>
                        <div className="flex items-center gap-6">
                          <div className="h-24 w-24 rounded-lg bg-black/50 border border-dashed border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                            {formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="text-white/20" />}
                          </div>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-white/50 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button onClick={handleSave} className="px-8 py-3 bg-gk-yellow text-black rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-400 cursor-pointer">
                        <Save size={18} /> Save Item
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inventory List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-white/50 uppercase tracking-wider">
                <div className="col-span-2">Image</div>
                <div className="col-span-5">Details</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>

              {isLoading ? (
                <div className="p-12 text-center text-white/50">Loading vault...</div>
              ) : cars.length === 0 ? (
                <div className="p-12 text-center text-white/50">The vault is empty.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {cars.map((car, index) => (
                    <div key={car.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                      <div className="col-span-2 animate-none">
                        <img src={car.image || '/vault-1.png'} alt={car.name} className="w-16 h-12 object-cover rounded bg-black border border-white/5" />
                      </div>
                      <div className="col-span-5 text-left">
                        <div className="font-bold text-sm text-white">{car.name}</div>
                        <div className="text-[10px] text-gk-orange uppercase tracking-wider mt-0.5">{car.brand}</div>
                        <div className="text-xs text-white/50 mt-1">
                          {car.lane} • Scale: {car.scale} {car.quantity !== undefined && `• Stock: ${car.quantity}`}
                          {car.tags && car.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {car.tags.map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[8px] font-black uppercase text-white/70 tracking-wider">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2 font-mono text-sm text-gk-yellow text-left">₹{car.price}</div>
                      <div className="col-span-3 flex justify-end gap-2 flex-wrap">
                        <button onClick={() => handleEdit(car)} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(car.id)} className="p-2 text-white/50 hover:text-gk-orange bg-white/5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {adminTab === 'orders' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white uppercase tracking-tight italic font-grotesk">Orders Manager</h2>
              <p className="text-xs text-white/50 mt-1">Review orders and update delivery status/tracking codes.</p>
            </div>

            {!isLoading && groupedOrders.length > 0 && (
              <div className="mb-6 max-w-md relative">
                <input 
                  type="text" 
                  value={orderSearch} 
                  onChange={e => setOrderSearch(e.target.value)} 
                  placeholder="Search by order ID, customer email, product name, status..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-white/30 focus:outline-none focus:border-gk-yellow transition-colors text-sm"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                  <Search size={16} />
                </span>
              </div>
            )}

            {isLoading ? (
              <div className="py-12 text-center text-white/50">Loading orders...</div>
            ) : groupedOrders.length === 0 ? (
              <div className="py-12 text-center text-white/40">
                <div className="text-4xl mb-4">📦</div>
                <p className="font-bold text-sm">No customer orders placed yet</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
                <p className="font-bold text-sm">No matching orders found</p>
                <p className="text-xs text-white/30 mt-1">Try refining your search terms.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map(order => {
                  const currentTracking = tempTracking[order.id] !== undefined ? tempTracking[order.id] : (order.trackingNumber || '');
                  return (
                    <div key={order.id} className="p-5 md:p-6 rounded-2xl bg-black/40 border border-white/5 hover:border-gk-orange/20 transition-all flex flex-col gap-4">
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-white/5 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-white/40">Order ID: {order.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              order.status === 'Shipped' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              order.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-gk-orange/10 text-gk-orange border border-gk-orange/20'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-gk-yellow mt-1">Customer: {order.customerEmail}</div>
                          <div className="text-[10px] text-white/30 font-semibold mt-0.5">Ordered: {new Date(order.createdAt).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Total Revenue</div>
                          <div className="font-mono text-lg font-black text-white">₹{(order.totalPrice || 0).toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Items & Shipping Address */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                          <div className="text-[10px] uppercase tracking-wider text-white/35 font-bold mb-1">Products</div>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs text-white/80 leading-relaxed font-semibold">
                              • {item.qty}x {item.productBrand} {item.productName} (₹{item.priceAtPurchase.toLocaleString()})
                            </div>
                          ))}
                        </div>
                        <div className="text-left">
                          <div className="text-[10px] uppercase tracking-wider text-white/35 font-bold mb-1">Shipping Address</div>
                          <p className="text-xs text-white/60 leading-relaxed">{order.shippingAddress || 'No Address Provided'}</p>
                        </div>
                      </div>

                      {/* Status / Tracking Controls */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white/40 uppercase whitespace-nowrap">Status:</span>
                          <select
                            value={order.status}
                            onChange={e => handleUpdateOrderStatus(order.id, e.target.value, order.trackingNumber || '')}
                            className="bg-[#111116] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer focus:outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs font-semibold text-white/40 uppercase whitespace-nowrap">Tracking:</span>
                          <input 
                            type="text" 
                            placeholder="Enter tracking code..." 
                            value={currentTracking}
                            onChange={e => setTempTracking({ ...tempTracking, [order.id]: e.target.value })}
                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gk-yellow flex-1"
                          />
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, order.status, currentTracking)}
                            className="px-3 py-1.5 bg-gk-yellow hover:bg-yellow-400 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Save size={12} /> Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {adminTab === 'receipts' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight italic font-grotesk">Receipts Directory</h3>
                <p className="text-xs text-white/50 mt-1">Generate manual customer receipts, download PDF copies, and audit offline sales.</p>
              </div>
              {!isAddingReceipt && (
                <button 
                  onClick={handleOpenReceiptModal}
                  className="px-6 py-2.5 rounded-full bg-gk-yellow text-black text-sm font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors cursor-pointer"
                >
                  <Plus size={16} /> New Manual Receipt
                </button>
              )}
            </div>

            {/* Inline Receipts Form (Add / Edit) */}
            <AnimatePresence>
              {isAddingReceipt && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
                  <form onSubmit={handleSaveReceipt} className="space-y-6 text-left bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 mb-8 relative">
                    <button type="button" onClick={() => setIsAddingReceipt(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer">
                      <X size={16} />
                    </button>

                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider italic font-grotesk">Create New Receipt</h3>
                      <p className="text-xs text-white/40 mt-1">Create an invoice record. This will deduct selected castings from inventory.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Side: Form Controls - 7 cols on large screens */}
                      <div className="lg:col-span-7 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-white/55 uppercase tracking-wider">Receipt Number *</label>
                            <input required type="text" value={receiptNum} onChange={e => setReceiptNum(e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow text-sm font-mono font-bold" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-white/55 uppercase tracking-wider">Receipt Format</label>
                            <select value={rcFormat} onChange={e => setRcFormat(e.target.value)}
                              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow text-sm cursor-pointer outline-none">
                              <option value="standard" className="bg-[#111116] text-white">Standard (A4 Layout)</option>
                              <option value="thermal" className="bg-[#111116] text-white font-sans">Thermal (80mm POS Slip)</option>
                            </select>
                          </div>
                        </div>

                        {/* Customer Details section */}
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-[11px] font-black uppercase text-gk-yellow tracking-wider">Customer Details</span>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setCustMode('select')}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${custMode === 'select' ? 'bg-gk-yellow text-black' : 'text-white/40 hover:text-white'}`}>
                                Select CRM
                              </button>
                              <button type="button" onClick={() => setCustMode('new')}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${custMode === 'new' ? 'bg-gk-yellow text-black' : 'text-white/40 hover:text-white'}`}>
                                + New Customer
                              </button>
                            </div>
                          </div>

                          {custMode === 'select' ? (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-white/45 uppercase tracking-wider">Choose Customer</label>
                              {customers.length === 0 ? (
                                <div className="text-xs text-white/40 py-2">No customers in CRM yet. Please select "+ New Customer".</div>
                              ) : (
                                <select value={selCustId} onChange={e => setSelCustId(e.target.value)}
                                  className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow text-sm cursor-pointer outline-none">
                                  {customers.map(c => (
                                    <option key={c.id} value={c.id} className="bg-[#111116] text-white">
                                      {c.full_name} ({c.phone})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <input required={custMode === 'new'} type="text" value={newCustName} onChange={e => setNewCustName(e.target.value)} placeholder="Full Name"
                                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow text-sm" />
                                <input required={custMode === 'new'} type="text" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} placeholder="Phone Number"
                                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow text-sm" />
                                <input type="text" value={newCustInsta} onChange={e => setNewCustInsta(e.target.value)} placeholder="Instagram Handle"
                                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow text-sm" />
                              </div>
                              <textarea value={newCustAddr} onChange={e => setNewCustAddr(e.target.value)} placeholder="Full Shipping / Billing Address" rows="2"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gk-yellow text-sm resize-none" />
                            </div>
                          )}
                        </div>

                        {/* Line Items section */}
                        <div className="bg-black/20 p-4 border border-white/5 rounded-xl space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black uppercase text-gk-yellow tracking-wider">Line Items</span>
                            <button type="button" onClick={handleAddRcItem}
                              className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={10} /> Add Item
                            </button>
                          </div>

                          <div className="space-y-3.5 pr-1">
                            {rcItems.map((item, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-center p-3 rounded-xl bg-black/40 border border-white/5 relative group">
                                <div className="w-full sm:w-[50%] space-y-1.5 text-left">
                                  <select onChange={e => handleSelectCarForReceiptItem(idx, e.target.value)}
                                    className="w-full bg-[#111116] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/80 focus:outline-none cursor-pointer outline-none">
                                    <option value="" className="bg-[#111116] text-white">-- Autofill Casting --</option>
                                    {cars.map(c => (
                                      <option key={c.id} value={c.id} className="bg-[#111116] text-white">{c.brand} - {c.name} (₹{c.price})</option>
                                    ))}
                                  </select>
                                  <input required type="text" value={item.description} onChange={e => handleUpdateRcItem(idx, 'description', e.target.value)} placeholder="Description / Model Name"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gk-yellow" />
                                </div>
                                
                                <div className="w-full sm:w-[20%] space-y-1">
                                  <label className="text-[9px] uppercase font-bold text-white/40 block sm:hidden">Qty</label>
                                  <input required type="number" min="1" value={item.qty} onChange={e => handleUpdateRcItem(idx, 'qty', parseInt(e.target.value, 10) || 1)} placeholder="Qty"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-gk-yellow" />
                                </div>
                                
                                <div className="w-full sm:w-[30%] space-y-1">
                                  <label className="text-[9px] uppercase font-bold text-white/40 block sm:hidden">Price (₹)</label>
                                  <input required type="number" min="0" value={item.amount} onChange={e => handleUpdateRcItem(idx, 'amount', Number(e.target.value) || 0)} placeholder="Price"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-gk-yellow" />
                                </div>

                                <button type="button" onClick={() => handleRemoveRcItem(idx)} disabled={rcItems.length === 1}
                                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 disabled:opacity-30 cursor-pointer sm:self-end">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Financial calculations */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20 p-4 border border-white/5 rounded-xl">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">Tax (%)</label>
                            <input type="number" min="0" max="100" value={rcTaxPercent} onChange={e => setRcTaxPercent(Number(e.target.value) || 0)}
                              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-gk-yellow text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">Shipping (₹)</label>
                            <input type="number" min="0" value={rcShipping} onChange={e => setRcShipping(Number(e.target.value) || 0)}
                              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-gk-yellow text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">Advance Paid (₹)</label>
                            <input type="number" min="0" value={rcAdvance} onChange={e => setRcAdvance(Number(e.target.value) || 0)}
                              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-gk-yellow text-xs" />
                          </div>
                        </div>

                        <div className="bg-black/20 p-4 border border-white/5 rounded-xl">
                          <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">Footer Note</label>
                          <textarea rows={2} value={rcFooter} onChange={e => setRcFooter(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gk-yellow text-xs" />
                        </div>

                        <div className="flex justify-end gap-3 pt-3">
                          <button type="button" onClick={() => setIsAddingReceipt(false)} className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 text-sm font-semibold transition-colors cursor-pointer">Cancel</button>
                          <button type="submit" disabled={receiptsLoading} className="px-8 py-3 bg-gk-yellow text-black hover:bg-yellow-400 rounded-lg font-bold flex items-center gap-2 transition-colors cursor-pointer">
                            <Save size={18} /> {receiptsLoading ? 'Generating...' : 'Save Receipt'}
                          </button>
                        </div>
                      </div>

                      {/* Right Side: LIVE PREVIEW CONTAINER - 5 cols on large screens */}
                      <div className="lg:col-span-5 space-y-4">
                        <h3 className="text-xs font-black uppercase text-white/50 tracking-wider text-left">Live Preview</h3>
                        
                        {/* High-fidelity Receipt Preview */}
                        <div className="bg-white text-black p-6 rounded-xl shadow-2xl overflow-hidden font-sans text-xs flex flex-col justify-between relative" style={{ minHeight: '560px', color: '#000000', backgroundColor: '#ffffff' }}>
                          {/* Faint Premium Brand Watermark */}
                          <div className="absolute pointer-events-none select-none z-0 text-center" style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) rotate(-20deg)',
                            fontSize: '36px',
                            fontWeight: '900',
                            letterSpacing: '0.25em',
                            background: 'linear-gradient(135deg, rgba(43, 149, 201, 0.12) 0%, rgba(67, 56, 202, 0.09) 50%, rgba(99, 102, 241, 0.06) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            color: 'rgba(43, 149, 201, 0.08)',
                            width: '90%',
                            textAlign: 'center',
                            lineHeight: '1.2',
                            fontFamily: '"Outfit", "Montserrat", "Inter", system-ui, sans-serif',
                            textTransform: 'uppercase',
                            wordBreak: 'break-word'
                          }}>
                            Garage Kings
                          </div>

                          <div className="relative z-10 flex flex-col justify-between h-full w-full">
                            <div>
                              {/* Header */}
                              <div className="flex justify-between items-start gap-4 mb-8 text-left">
                                <div>
                                  <h1 className="text-xl font-black leading-none tracking-tight">Garage Kings India</h1>
                                  <p className="text-gray-600 text-[10px] mt-1.5">Delhi, India</p>
                                </div>
                                <div className="text-right">
                                  <h2 className="text-xl font-black text-gray-800 tracking-tight leading-none mb-1">Receipt</h2>
                                  <p className="text-[9px] text-gray-650 font-semibold mt-1">Receipt # &nbsp;{receiptNum || 'RTXXXXX'}</p>
                                  <p className="text-[8px] text-gray-500 font-medium mt-1">Date &nbsp;{new Date().toLocaleString('en-IN')}</p>
                                </div>
                              </div>

                              {/* "To" Section */}
                              <div className="mb-6 text-left">
                                <div className="bg-[#2b95c9] text-white px-3 py-1 font-bold text-[10px] tracking-wider mb-2.5 rounded-sm">To</div>
                                <div className="px-1 space-y-0.5 text-gray-800 text-[10px] leading-relaxed">
                                  {custMode === 'select' && selCustId ? (
                                    (() => {
                                      const c = customers.find(cust => cust.id === selCustId);
                                      return c ? (
                                        <>
                                          <div className="font-bold text-black text-[11px]">{c.full_name || c.fullName}</div>
                                          {c.phone && <div className="font-semibold">{c.phone}</div>}
                                          {c.instagram && <div className="font-semibold">Instagram: @{c.instagram.replace(/^@/, '')}</div>}
                                          {c.address && <div className="whitespace-pre-line text-gray-650 mt-0.5">{c.address}</div>}
                                        </>
                                      ) : <div className="text-gray-400 italic">No customer selected.</div>;
                                    })()
                                  ) : newCustName ? (
                                    <>
                                      <div className="font-bold text-black text-[11px]">{newCustName}</div>
                                      {newCustPhone && <div className="font-semibold">{newCustPhone}</div>}
                                      {newCustInsta && <div className="font-semibold">Instagram: @{newCustInsta.replace(/^@/, '')}</div>}
                                      {newCustAddr && <div className="whitespace-pre-line text-gray-650 mt-0.5">{newCustAddr}</div>}
                                    </>
                                  ) : (
                                    <div className="text-gray-400 italic">No customer details set.</div>
                                  )}
                                </div>
                              </div>

                              {/* Table Section */}
                              <div className="mb-6 text-left">
                                <div className="bg-[#2b95c9] text-white grid grid-cols-12 gap-2 px-3 py-1.5 font-bold text-[9px] tracking-wider rounded-sm">
                                  <div className="col-span-2 text-center">Qty</div>
                                  <div className="col-span-7">Description</div>
                                  <div className="col-span-3 text-right">Amount</div>
                                </div>
                                
                                <div className="divide-y divide-gray-150 px-1">
                                  {rcItems.map((it, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 py-2.5 text-[10px] items-center">
                                      <div className="col-span-2 text-center text-gray-650">{it.qty}</div>
                                      <div className="col-span-7 font-medium text-gray-800 truncate">{it.description || <span className="text-gray-350 italic">Description...</span>}</div>
                                      <div className="col-span-3 text-right font-mono font-semibold text-gray-900">₹{(Number(it.qty) * (Number(it.amount) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                  ))}
                                  
                                  {/* Shipping row */}
                                  {Number(rcShipping) > 0 && (
                                    <div className="grid grid-cols-12 gap-2 py-2.5 text-[10px]">
                                      <div className="col-span-2 text-center text-gray-650">1</div>
                                      <div className="col-span-7 font-medium text-gray-800">Shipping Charges</div>
                                      <div className="col-span-3 text-right font-mono font-semibold text-gray-900">₹{Number(rcShipping).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Summary and Footer */}
                            <div className="text-right">
                              <div className="border-t border-gray-300 pt-3 space-y-1.5 flex flex-col items-end">
                                <div className="flex justify-between items-center text-[10px] text-gray-600 w-64">
                                  <span>Including Tax ({rcTaxPercent}%)</span>
                                  <span className="font-mono font-semibold">₹{calculateLiveTotal().tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-black text-black pt-1 w-64 border-t border-gray-200">
                                  <span>Total Paid</span>
                                  <span className="font-mono font-black text-base">₹{calculateLiveTotal().total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                {Number(calculateLiveTotal().balance) > 0 && (
                                  <div className="flex justify-between items-center text-[10px] text-red-650 font-bold pt-1.5 border-t border-dashed border-gray-300 mt-1.5 w-64">
                                    <span>Balance Due before Delivery</span>
                                    <span className="font-mono font-bold text-red-700">₹{calculateLiveTotal().balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                              </div>

                              {rcFooter && (
                                <div className="mt-8 text-center text-[9px] text-gray-800 font-medium leading-normal px-2 border-t border-gray-150 pt-2 italic">
                                  {rcFooter}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {!receiptsLoading && receipts.length > 0 && (
              <div className="mb-6 max-w-md relative">
                <input 
                  type="text" 
                  value={receiptSearch} 
                  onChange={e => setReceiptSearch(e.target.value)} 
                  placeholder="Search by receipt #, customer name, phone, or instagram..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-white/30 focus:outline-none focus:border-gk-yellow transition-colors text-sm"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                  <Search size={16} />
                </span>
              </div>
            )}

            {receiptsLoading ? (
              <div className="py-12 text-center text-white/50 animate-pulse">Loading receipts...</div>

            ) : receipts.length === 0 ? (
              <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
                <div className="text-4xl mb-4">🧾</div>
                <p className="font-bold text-sm">No billing receipts generated yet</p>
                <p className="text-xs text-white/30 mt-1">Manual point-of-sale invoices and direct orders will appear here.</p>
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
                <p className="font-bold text-sm">No matching receipts found</p>
                <p className="text-xs text-white/30 mt-1">Try refining your search terms.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/45 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Balance Due</th>
                      <th className="py-3 px-4">Format</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-white/80">
                    {filteredReceipts.map(r => (
                      <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-white">{r.receipt_number}</td>
                        <td className="py-4 px-4 text-xs text-white/60">
                          {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-white">{r.customer_name}</div>
                          <div className="text-[10px] text-white/45">{r.customer_phone}</div>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-emerald-400">₹{Number(r.total_amount).toLocaleString()}</td>
                        <td className="py-4 px-4 font-mono text-xs text-orange-400">₹{Number(r.pending_balance).toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            r.format_type === 'thermal' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {r.format_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedReceipt(r)}
                              className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                            >
                              Print / View
                            </button>
                            <button
                              onClick={() => handleDeleteReceipt(r.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>



      {/* 🖨 Printable Receipt Viewer Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedReceipt(null)}>
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-[#0a0a0d] border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative flex flex-col" style={{ maxHeight: '95svh' }}
              onClick={e => e.stopPropagation()}>
              {/* Sticky Header */}
              <div className="flex justify-between items-center px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-white/10 flex-shrink-0">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider italic font-grotesk">Receipt Viewer</h3>
                  <p className="text-xs text-white/40 mt-1 font-mono">Reference: {selectedReceipt.receipt_number}</p>
                </div>
                <button onClick={() => setSelectedReceipt(null)} className="text-white/50 hover:text-white cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Receipt Card */}
              <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-5">
              <div className="bg-white text-black p-8 rounded-xl shadow-inner font-sans text-xs flex flex-col justify-between relative overflow-hidden text-left" style={{ minHeight: '520px', color: '#000000', backgroundColor: '#ffffff' }}>
                {/* Faint Premium Brand Watermark */}
                <div className="absolute pointer-events-none select-none z-0 text-center" style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-20deg)',
                  fontSize: '48px',
                  fontWeight: '900',
                  letterSpacing: '0.25em',
                  background: 'linear-gradient(135deg, rgba(43, 149, 201, 0.12) 0%, rgba(67, 56, 202, 0.09) 50%, rgba(99, 102, 241, 0.06) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'rgba(43, 149, 201, 0.08)',
                  width: '90%',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  fontFamily: '"Outfit", "Montserrat", "Inter", system-ui, sans-serif',
                  textTransform: 'uppercase',
                  wordBreak: 'break-word'
                }}>
                  Garage Kings
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full w-full">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4 mb-8">
                      <div>
                        <h1 className="text-2xl font-black leading-none tracking-tight">Garage Kings India</h1>
                        <p className="text-gray-600 text-xs mt-2">Delhi, India</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-none mb-1">Receipt</h2>
                        <p className="text-xs text-gray-600 font-semibold mt-1.5">Receipt # &nbsp;{selectedReceipt.receipt_number}</p>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">Date &nbsp;{new Date(selectedReceipt.created_at).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* "To" Section */}
                    <div className="mb-6">
                      <div className="bg-[#2b95c9] text-white px-3 py-1 font-bold text-[10px] tracking-wider mb-2.5 rounded-sm">To</div>
                      <div className="px-1 space-y-0.5 text-gray-800 text-[10px] leading-relaxed">
                        <div className="font-bold text-black text-sm">{selectedReceipt.customer_name}</div>
                        {selectedReceipt.customer_phone && <div className="font-semibold">{selectedReceipt.customer_phone}</div>}
                        {selectedReceipt.customer_instagram && <div className="font-semibold">Instagram: @{selectedReceipt.customer_instagram.replace(/^@/, '')}</div>}
                        {selectedReceipt.customer_address && <div className="whitespace-pre-line text-gray-600 mt-1 leading-normal">{selectedReceipt.customer_address}</div>}
                      </div>
                    </div>

                    {/* Table Section */}
                    <div className="mb-6">
                      <div className="bg-[#2b95c9] text-white grid grid-cols-12 gap-2 px-3 py-1.5 font-bold text-[10px] tracking-wider rounded-sm">
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-7">Description</div>
                        <div className="col-span-3 text-right">Amount</div>
                      </div>
                      
                      <div className="divide-y divide-gray-150 px-1">
                        {selectedReceipt.items?.map((it, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 py-2 text-[10px] items-center">
                            <div className="col-span-2 text-center text-gray-600">{it.qty}</div>
                            <div className="col-span-7 font-medium text-gray-800 truncate">{it.description}</div>
                            <div className="col-span-3 text-right font-mono font-semibold text-gray-900">₹{Number(it.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2 border-t border-gray-150 text-right flex flex-col items-end">
                    <div className="flex justify-between items-center text-[10px] text-gray-600 w-64">
                      <span>Including Tax ({selectedReceipt.tax_percent}%)</span>
                      <span className="font-mono font-semibold">₹{Number(selectedReceipt.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black text-black pt-1.5 w-64 border-t border-gray-200">
                      <span>Total Paid</span>
                      <span className="font-mono font-black text-sm">₹{Number(selectedReceipt.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {selectedReceipt.format_type === 'prebooking' && selectedReceipt.pending_balance && Number(selectedReceipt.pending_balance) > 0 && (
                      <div className="flex justify-between items-center text-[10px] text-red-600 font-bold pt-1.5 w-64 border-t border-dashed border-gray-200">
                        <span>Balance Due before Delivery</span>
                        <span className="font-mono font-bold">₹{Number(selectedReceipt.pending_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer refund policy statement */}
                  {selectedReceipt.footer_note && (
                    <div className="text-center text-[10px] text-gray-800 font-medium leading-normal px-4 border-t border-gray-150 pt-4 mt-6">
                      {selectedReceipt.footer_note}
                    </div>
                  )}
                </div>
              </div> {/* end white receipt card */}
              </div> {/* end scrollable wrapper */}

              {/* Sticky Footer Buttons */}
              <div className="flex justify-end gap-3 px-6 sm:px-8 py-4 border-t border-white/10 flex-shrink-0">
                <button onClick={() => setSelectedReceipt(null)}
                  className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-colors text-sm cursor-pointer">
                  Close
                </button>
                {selectedReceipt.pdf_url ? (
                  <a href={selectedReceipt.pdf_url} download
                    className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center gap-2 transition-colors text-sm cursor-pointer">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download PDF
                  </a>
                ) : (
                  <button onClick={() => window.print()}
                    className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center gap-2 transition-colors text-sm cursor-pointer">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    Print / Save PDF
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🖨 Portal Print Container - Styled to match the modal receipt preview exactly */}
      {selectedReceipt && createPortal(
        <div className="printable-receipt-wrapper hidden print:block" style={{ fontFamily: '"Outfit", "Inter", system-ui, sans-serif', position: 'relative' }}>
          {/* Watermark */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-20deg)',
            fontSize: '64px',
            fontWeight: '900',
            letterSpacing: '0.25em',
            color: 'rgba(43, 149, 201, 0.07)',
            width: '90%',
            textAlign: 'center',
            lineHeight: '1.2',
            textTransform: 'uppercase',
            wordBreak: 'break-word',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0
          }}>Garage Kings</div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.03em', margin: 0 }}>Garage Kings India</h1>
                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>Delhi, India</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1f2937', margin: 0 }}>Receipt</h2>
                <p style={{ fontSize: '11px', color: '#4b5563', fontWeight: '600', marginTop: '6px' }}>Receipt #&nbsp;{selectedReceipt.receipt_number}</p>
                <p style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500', marginTop: '4px' }}>Date&nbsp;{new Date(selectedReceipt.created_at).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* To Section */}
            <div style={{ marginBottom: '24px' }}>
              <div className="print-bg-blue print-text-white" style={{ padding: '4px 12px', fontWeight: '700', fontSize: '10px', letterSpacing: '0.1em', marginBottom: '10px', borderRadius: '2px' }}>To</div>
              <div style={{ paddingLeft: '4px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#000', marginBottom: '2px' }}>{selectedReceipt.customer_name}</div>
                {selectedReceipt.customer_phone && <div style={{ fontWeight: '600', fontSize: '11px', color: '#374151' }}>{selectedReceipt.customer_phone}</div>}
                {selectedReceipt.customer_instagram && <div style={{ fontWeight: '600', fontSize: '11px', color: '#374151' }}>Instagram: @{selectedReceipt.customer_instagram.replace(/^@/, '')}</div>}
                {selectedReceipt.customer_address && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', whiteSpace: 'pre-line' }}>{selectedReceipt.customer_address}</div>}
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '24px' }}>
              <div className="print-bg-blue print-text-white" style={{ display: 'grid', gridTemplateColumns: '1fr 5fr 3fr', gap: '8px', padding: '6px 12px', fontWeight: '700', fontSize: '10px', letterSpacing: '0.1em', borderRadius: '2px' }}>
                <div style={{ textAlign: 'center' }}>Qty</div>
                <div>Description</div>
                <div style={{ textAlign: 'right' }}>Amount</div>
              </div>
              {selectedReceipt.items?.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 5fr 3fr', gap: '8px', padding: '8px 4px', borderBottom: '1px solid #f3f4f6', fontSize: '11px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>{it.qty}</div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>{it.description}</div>
                  <div style={{ textAlign: 'right', fontWeight: '600', fontFamily: 'monospace', color: '#111827' }}>₹{Number(it.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ marginLeft: 'auto', width: '256px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>
                <span>Including Tax ({selectedReceipt.tax_percent}%)</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>₹{Number(selectedReceipt.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '900', color: '#000', borderTop: '1px solid #e5e7eb', paddingTop: '6px', marginBottom: '6px' }}>
                <span>Total Paid</span>
                <span style={{ fontFamily: 'monospace' }}>₹{Number(selectedReceipt.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {selectedReceipt.format_type === 'prebooking' && selectedReceipt.pending_balance && Number(selectedReceipt.pending_balance) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#dc2626', borderTop: '1px dashed #e5e7eb', paddingTop: '6px' }}>
                  <span>Balance Due before Delivery</span>
                  <span style={{ fontFamily: 'monospace' }}>₹{Number(selectedReceipt.pending_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedReceipt.footer_note && (
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#1f2937', fontWeight: '500', borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginTop: '24px', lineHeight: '1.6' }}>
                {selectedReceipt.footer_note}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
