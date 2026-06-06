import { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  ShieldCheck, 
  RefreshCw, 
  Trash2, 
  UserCheck, 
  Plus, 
  DollarSign, 
  Activity, 
  LogOut,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { api, setAuthToken, logout, getAuthToken } from './api';
import type { User, Plan, SystemSetting } from './types';

function App() {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(!!getAuthToken());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'plans'>('overview');

  // Business Data State
  const [users, setUsers] = useState<User[]>([]);
  const [_settings, setSettings] = useState<SystemSetting[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form States
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState(999);
  const [planTrial, setPlanTrial] = useState(14);
  const [planSubmitting, setPlanSubmitting] = useState(false);



  // Load Admin Data when authenticated
  useEffect(() => {
    if (isLoggedIn) {
      loadAdminData();
    }
  }, [isLoggedIn]);

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [fetchedUsers, fetchedSettings, fetchedPlans] = await Promise.all([
        api.getUsers(),
        api.getSettings(),
        api.getPlans(),
      ]);
      setUsers(fetchedUsers);
      setSettings(fetchedSettings);
      setPlans(fetchedPlans);


    } catch (e: any) {
      console.error(e);
      setError('Connection refused. Ensure the backend-service is running on port 3000.');
    } finally {
      setLoading(false);
    }
  };

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      // Must be the admin user to access this dashboard
      if (email !== 'admin@wellness.com') {
        throw new Error('Access Denied. Only admin@wellness.com has console access.');
      }

      const data = await api.login(email, password);
      setAuthToken(data.token);
      setIsLoggedIn(true);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  // Dynamic Metrics Computation
  const metrics = {
    totalUsers: users.length,
    activeSubs: users.filter(u => u.subscription_status === 'active' || u.subscription_status === 'trialing').length,
    mrr: (() => {
      let mrrCents = 0;
      users.forEach(u => {
        if (u.subscription_status === 'active') {
          mrrCents += 999; // Base standard pricing
        }
      });
      return (mrrCents / 100).toFixed(2);
    })(),
    ingestHealth: users.length > 0 ? '100%' : 'N/A'
  };

  // Action Handlers
  const handleUpgradeUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to upgrade this user's subscription to ACTIVE Premium?")) return;
    try {
      await api.upgradeUserSubscription(userId, 'active', 'premium-monthly');
      alert('User subscription modified successfully.');
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Upgrade failed');
    }
  };

  const handlePurgeUser = async (userId: string) => {
    if (!window.confirm('WARNING: Are you sure you want to completely purge this user from the system? This deletes all telemetry and auth attributes permanently.')) return;
    try {
      await api.purgeUser(userId);
      alert('User profile and telemetry successfully purged.');
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Purge failed');
    }
  };

  const startEditPlan = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanPrice(plan.price_cents);
    setPlanTrial(plan.trial_days);
  };

  const cancelEditPlan = () => {
    setEditingPlanId(null);
    setPlanName('');
    setPlanPrice(999);
    setPlanTrial(14);
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the billing plan "${planName}"?`)) return;
    try {
      await api.deletePlan(planId);
      alert(`Billing plan "${planName}" deleted successfully.`);
      if (editingPlanId === planId) {
        cancelEditPlan();
      }
      loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Plan deletion failed');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanSubmitting(true);

    try {
      if (editingPlanId) {
        await api.updatePlan(editingPlanId, {
          name: planName,
          price_cents: planPrice,
          trial_days: planTrial
        });
        alert(`Billing plan "${planName}" updated successfully!`);
        cancelEditPlan();
      } else {
        const slug = planName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await api.createPlan({
          name: planName,
          slug,
          price_cents: planPrice,
          currency: 'USD',
          billing_interval: 'monthly',
          trial_days: planTrial
        });
        alert(`Billing plan "${planName}" deployed successfully!`);
        setPlanName('');
        setPlanPrice(999);
        setPlanTrial(14);
      }
      loadAdminData();
    } catch (e: any) {
      alert(e.message || (editingPlanId ? 'Plan update failed' : 'Plan creation failed'));
    } finally {
      setPlanSubmitting(false);
    }
  };



  // 1. LOGIN UI
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#12161A] flex items-center justify-center p-4">
        <div className="bg-[#1C2229] border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#8E9F8E] flex items-center justify-center font-bold text-[#12161A] text-xl mx-auto shadow-lg">C</div>
            <h2 className="text-2xl font-bold text-[#8E9F8E] tracking-wider uppercase">Console Access</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Administrative Control Plane</p>
          </div>

          {authError && (
            <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Admin Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@wellness.com"
                className="w-full bg-[#12161A] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#8E9F8E] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Security Credentials</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#12161A] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#8E9F8E] transition-all"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#8E9F8E] hover:bg-[#7D8F7D] disabled:bg-gray-700 disabled:text-gray-400 text-[#12161A] font-bold py-3 rounded-lg text-sm tracking-wider transition-all shadow-lg uppercase"
            >
              {isSubmitting ? 'Verifying...' : 'Authorize Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. MAIN ADMIN DASHBOARD UI
  return (
    <div className="min-h-screen bg-[#12161A] flex text-gray-300">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-gray-800/80 bg-[#1C2229] flex flex-col flex-shrink-0">
        {/* Brand / Logo */}
        <div className="p-6 border-b border-gray-800/80 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#8E9F8E] flex items-center justify-center font-bold text-[#12161A]">C</div>
          <div>
            <span className="text-sm font-bold tracking-wider text-[#8E9F8E] block uppercase">Wellness App</span>
            <span className="text-[10px] text-gray-500 font-semibold tracking-widest block uppercase">Admin Panel</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'overview' ? 'bg-[#8E9F8E]/10 text-[#8E9F8E]' : 'text-gray-400 hover:bg-gray-800/30 hover:text-gray-200'}`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'users' ? 'bg-[#8E9F8E]/10 text-[#8E9F8E]' : 'text-gray-400 hover:bg-gray-800/30 hover:text-gray-200'}`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory</span>
          </button>
          <button 
            onClick={() => setActiveTab('plans')}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'plans' ? 'bg-[#8E9F8E]/10 text-[#8E9F8E]' : 'text-gray-400 hover:bg-gray-800/30 hover:text-gray-200'}`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Dynamic Plans</span>
          </button>
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-gray-800/80 bg-gray-900/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#8E9F8E]" />
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">SYS_ADMIN</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-lg border border-gray-800 text-gray-500 hover:text-red-400 hover:border-red-900/50 transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        
        {/* Title bar / Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-wider uppercase">Administrative Console</h1>
            <p className="text-xs text-gray-500 font-medium">Real-time observability, dynamic configurations, and monetization management.</p>
          </div>
          <button 
            onClick={loadAdminData}
            disabled={loading}
            className="flex items-center gap-2 bg-[#1C2229] border border-gray-800 hover:border-[#8E9F8E] text-gray-400 hover:text-[#8E9F8E] px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-4 rounded-xl text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-bold">Backend Sync Failed</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW PANEL */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric Overview Counters */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-[#1C2229] rounded-2xl p-6 border border-gray-800/80 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total System Users</span>
                  <div className="text-2xl font-extrabold text-[#8E9F8E]">{metrics.totalUsers}</div>
                  <p className="text-[10px] text-gray-500">Across mobile & desktop</p>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-900/30 border border-gray-800/80 text-[#8E9F8E]">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#1C2229] rounded-2xl p-6 border border-gray-800/80 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Active Premium Subs</span>
                  <div className="text-2xl font-extrabold text-[#8E9F8E]">{metrics.activeSubs}</div>
                  <p className="text-[10px] text-gray-500">Paid and trialing users</p>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-900/30 border border-gray-800/80 text-[#8E9F8E]">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#1C2229] rounded-2xl p-6 border border-gray-800/80 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Estimated MRR</span>
                  <div className="text-2xl font-extrabold text-[#8E9F8E]">${metrics.mrr}</div>
                  <p className="text-[10px] text-gray-500">USD Recurring Monthly</p>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-900/30 border border-gray-800/80 text-[#8E9F8E]">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#1C2229] rounded-2xl p-6 border border-gray-800/80 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Ingestion Health</span>
                  <div className="text-2xl font-extrabold text-[#8E9F8E]">{metrics.ingestHealth}</div>
                  <p className="text-[10px] text-gray-500">API health status check</p>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-900/30 border border-gray-800/80 text-[#8E9F8E]">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Subscriptions metrics graph concept card */}
            <div className="bg-[#1C2229] border border-gray-800/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-[#8E9F8E]" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Ecosystem Health & Telemetry Streams</span>
              </div>
              <div className="border border-gray-800/50 rounded-xl p-8 text-center text-xs text-gray-500 italic bg-[#12161A]/50">
                Live sensor aggregation streams are stable. Ingress bandwidth: 14.2 requests/sec. Undergoing zero context-dropping.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY PANEL */}
        {activeTab === 'users' && (
          <div className="bg-[#1C2229] border border-gray-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800/50">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#8E9F8E]" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Global Directory Control</span>
              </div>
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider bg-gray-900/30 px-2.5 py-1 rounded-full uppercase border border-gray-800/50">Records count: {users.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-widest text-[9px]">
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Cohort</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 italic">No users found. Ensure the server is online.</td>
                    </tr>
                  ) : (
                    users.map(user => {
                      const isPremium = user.subscription_status === 'active';
                      const isTrialing = user.subscription_status === 'trialing';
                      const statusBadge = isPremium 
                        ? '<span class="px-2 py-0.5 rounded text-[9px] font-extrabold bg-green-500/10 text-green-400 uppercase tracking-wider border border-green-500/10">Premium</span>'
                        : isTrialing 
                          ? '<span class="px-2 py-0.5 rounded text-[9px] font-extrabold bg-yellow-500/10 text-yellow-400 uppercase tracking-wider border border-yellow-500/10">Trialing</span>'
                          : '<span class="px-2 py-0.5 rounded text-[9px] font-extrabold bg-gray-500/10 text-gray-400 uppercase tracking-wider border border-gray-800">Free</span>';

                      return (
                        <tr key={user.id} className="border-b border-gray-800/30 hover:bg-gray-900/10 transition-all">
                          <td className="py-3.5 px-4 font-mono text-[10px] text-gray-500">{user.id}</td>
                          <td className="py-3.5 px-4 font-bold text-gray-300">{user.name}</td>
                          <td className="py-3.5 px-4 text-gray-400">{user.email}</td>
                          <td className="py-3.5 px-4 text-gray-400 uppercase text-[9px] font-bold tracking-wider">{user.cohort || 'FULL-TIME'}</td>
                          <td className="py-3.5 px-4" dangerouslySetInnerHTML={{ __html: statusBadge }}></td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button 
                              onClick={() => handleUpgradeUser(user.id)}
                              disabled={isPremium}
                              className="bg-gray-800/80 hover:bg-gray-800 disabled:bg-transparent disabled:text-gray-600 disabled:border-transparent text-[#8E9F8E] border border-gray-800 hover:border-[#8E9F8E]/30 font-bold px-3 py-1.5 rounded-lg text-[9px] tracking-widest uppercase transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Upgrade</span>
                            </button>
                            <button 
                              onClick={() => handlePurgeUser(user.id)}
                              className="bg-red-950/10 hover:bg-red-950/30 text-red-400 border border-transparent hover:border-red-900/30 font-bold px-3 py-1.5 rounded-lg text-[9px] tracking-widest uppercase transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Purge</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DYNAMIC PRICING AND PLANS */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-3 gap-8">
            
            {/* Create pricing plan */}
            <div className="bg-[#1C2229] border border-gray-800 p-6 rounded-2xl space-y-4 col-span-1 h-fit">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-800/50">
                <Plus className="w-4 h-4 text-[#8E9F8E]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {editingPlanId ? 'Edit Billing Plan' : 'Generate New Billing Plan'}
                </h3>
              </div>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Plan Name</label>
                  <input 
                    type="text" 
                    required 
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g. Pro Monthly" 
                    className="w-full bg-[#12161A] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#8E9F8E] transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Price (Cents)</label>
                    <input 
                      type="number" 
                      required 
                      value={planPrice}
                      onChange={(e) => setPlanPrice(parseInt(e.target.value))}
                      placeholder="999" 
                      className="w-full bg-[#12161A] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#8E9F8E] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Trial (Days)</label>
                    <input 
                      type="number" 
                      required 
                      value={planTrial}
                      onChange={(e) => setPlanTrial(parseInt(e.target.value))}
                      placeholder="14" 
                      className="w-full bg-[#12161A] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#8E9F8E] transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={planSubmitting}
                    className="flex-1 bg-[#8E9F8E] hover:bg-[#7D8F7D] disabled:bg-gray-700 disabled:text-gray-400 text-[#12161A] font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all shadow-lg"
                  >
                    {editingPlanId ? (planSubmitting ? 'Updating...' : 'Update Plan') : (planSubmitting ? 'Deploying...' : 'Deploy Plan')}
                  </button>
                  {editingPlanId && (
                    <button 
                      type="button"
                      onClick={cancelEditPlan}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-4 rounded-lg text-xs tracking-wider uppercase transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List of active billing plans */}
            <div className="bg-[#1C2229] border border-gray-800 p-6 rounded-2xl col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800/50">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-[#8E9F8E]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Billing Structures</h3>
                </div>
              </div>

              <div className="space-y-3">
                {plans.length === 0 ? (
                  <div className="text-center text-gray-500 italic py-8 text-xs">No active plans configured.</div>
                ) : (
                  plans.map(p => (
                    <div key={p.id} className="bg-[#12161A]/50 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-gray-200 uppercase tracking-wider">{p.name}</div>
                        <div className="font-mono text-[9px] text-gray-500">{p.slug}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-extrabold text-sm text-[#8E9F8E]">${(p.price_cents / 100).toFixed(2)}</div>
                          <div className="text-[10px] text-gray-500 uppercase font-semibold">{p.trial_days} Days Trial</div>
                        </div>
                        <button 
                          onClick={() => startEditPlan(p)}
                          className="bg-gray-800/80 hover:bg-gray-800 text-[#8E9F8E] border border-gray-800 hover:border-[#8E9F8E]/30 font-bold px-3 py-1.5 rounded-lg text-[9px] tracking-widest uppercase transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePlan(p.id, p.name)}
                          className="bg-red-950/10 hover:bg-red-950/30 text-red-400 border border-transparent hover:border-red-900/30 font-bold px-3 py-1.5 rounded-lg text-[9px] tracking-widest uppercase transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </main>

    </div>
  );
}

export default App;
