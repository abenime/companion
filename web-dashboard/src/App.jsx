import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  BarChart2,
  Settings,
  RefreshCw,
  Menu,
  Send,
  Heart,
  Info,
  Trash2,
  ArrowLeft,
  User,
  LogOut,
  Plus,
  Moon,
  Sun,
  Activity,
  Smile,
  Shield,
  Sparkles,
  CheckCircle2,
  Calendar,
  Smartphone
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

const BASE_URL = 'http://localhost:3000';

function App() {
  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Auth states
  const [authToken, setAuthToken] = useState(localStorage.getItem('auth_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation & Drawer states
  const [currentTab, setCurrentTab] = useState('home'); // home, analytics, settings
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeIntervention, setActiveIntervention] = useState(null); // 'breathing' or null
  const [showChat, setShowChat] = useState(false);

  // Wizard signup state
  const [authMode, setAuthMode] = useState('login'); // login, register
  const [regStep, setRegStep] = useState(1);

  // Form Inputs (Signup wizard)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [workStatus, setWorkStatus] = useState('Full-time');
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [externalEnabled, setExternalEnabled] = useState(false);

  // Form Inputs (Login)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Dashboard Data states
  const [scores, setScores] = useState({
    energy_score: 85,
    focus_score: 90,
    stress_score: 15,
    sleep_deficit_percent: 0.0,
    screen_time_delta_percent: 0.0,
    step_deficit_percent: 0.0,
    context_switch_density: 0.0,
    social_app_ratio: 0.0,
    keystroke_speed_delta_percent: 0.0
  });
  const [timeline, setTimeline] = useState([]);
  const [aiInference, setAiInference] = useState({
    wellness_state: 'Optimal Balance',
    explanation: 'Your daily telemetry matches your historical averages perfectly. No critical stressors identified.',
    recommendations: [
      'Maintain your workstation Pomodoro schedule to sustain focus.',
      'Take a structured walking interval outside at mid-day.',
      'Maintain normal evening sleep times.'
    ]
  });

  // Chat message state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Subscription states
  const [subscription, setSubscription] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Settings states
  const [keyboardToggle, setKeyboardToggle] = useState(true);
  const [activeAppToggle, setActiveAppToggle] = useState(true);
  const [sleepToggle, setSleepToggle] = useState(true);
  const [ignoredApps, setIgnoredApps] = useState(() => {
    try {
      const saved = localStorage.getItem('web_ignored_apps');
      return saved ? JSON.parse(saved) : [
        'com.android.settings',
        'com.google.android.apps.authenticator2',
        'com.bitwarden.android'
      ];
    } catch {
      return [
        'com.android.settings',
        'com.google.android.apps.authenticator2',
        'com.bitwarden.android'
      ];
    }
  });
  const [newIgnoredApp, setNewIgnoredApp] = useState('');

  // Loading states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Refs
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // -------------------------------------------------------------
  // THEME ACCENT SYSTEM FOR EMERALD LIGHT MODE / ZEN DARK MODE
  // -------------------------------------------------------------
  const bgStyle = isDarkTheme ? 'bg-[#12161A] text-[#E2E8F0]' : 'bg-[#d6dbd5] text-[#3b533b]';
  const cardStyle = isDarkTheme ? 'bg-[#1C2229] border border-gray-800' : 'bg-white border border-[#3b533b]/20 shadow-sm rounded-2xl';
  const textStyle = isDarkTheme ? 'text-slate-200' : 'text-[#3b533b]';
  const mutedStyle = isDarkTheme ? 'text-gray-400' : 'text-[#3b533b]/70';
  const borderStyle = isDarkTheme ? 'border-gray-800/80' : 'border-[#3b533b]/20';
  const inputStyle = isDarkTheme 
    ? 'bg-[#1C2229] border border-gray-700 text-slate-200 focus:border-[#8E9F8E]' 
    : 'bg-white border-[#3b533b]/30 text-[#3b533b] focus:border-[#3b533b]';
  
  // Interactive Buttons
  const primaryBtn = isDarkTheme 
    ? 'bg-[#8E9F8E] hover:bg-[#7D8F7D] text-[#12161A] font-extrabold uppercase transition-all' 
    : 'bg-[#3b533b] hover:bg-[#2d3f2d] text-white font-extrabold uppercase transition-all shadow-sm';
  const secondaryBtn = isDarkTheme 
    ? 'bg-[#12161A] border border-gray-800 hover:border-[#8E9F8E] hover:text-[#8E9F8E] text-[#8E9F8E] font-bold uppercase transition-all' 
    : 'bg-[#3b533b]/10 border border-[#3b533b]/30 hover:border-[#3b533b] hover:text-[#3b533b] text-[#3b533b] font-bold uppercase transition-all';
  
  // Color highlights
  const accentText = isDarkTheme ? 'text-[#8E9F8E]' : 'text-[#3b533b]';
  const accentBg = isDarkTheme ? 'bg-[#8E9F8E]/10' : 'bg-[#3b533b]/10';
  const warningText = isDarkTheme ? 'text-[#D17E73]' : 'text-rose-600';
  const badgeStyle = isDarkTheme 
    ? 'text-[#8E9F8E] bg-[#12161A] border border-gray-800/60 font-bold' 
    : 'text-[#3b533b] bg-[#3b533b]/10 border border-[#3b533b]/20 font-bold';
  
  // Concentric Orbit Visuals
  const orbitRing1 = isDarkTheme ? 'border-[#8E9F8E]/30' : 'border-[#3b533b]/30';
  const orbitRing2 = isDarkTheme ? 'border-[#8E9F8E]/50' : 'border-[#3b533b]/50';
  const orbitCore = isDarkTheme ? 'bg-[#8E9F8E]/15' : 'bg-[#3b533b]/15';
  const orbitHeart = isDarkTheme ? 'text-[#8E9F8E]' : 'text-[#3b533b]';

  // Fetch Dashboard data
  const fetchDashboardData = async (token = authToken) => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      // 1. Fetch scores
      const scoresRes = await fetch(`${BASE_URL}/api/v1/wellness/scores?date=2026-06-05`, {
        headers: { 'Authorization': token }
      });
      if (scoresRes.status === 401 || scoresRes.status === 403) {
        handleLogout();
        return;
      }
      if (scoresRes.ok) {
        const scoresData = await scoresRes.json();
        setScores({
          energy_score: scoresData.energy_score ?? 85,
          focus_score: scoresData.focus_score ?? 90,
          stress_score: scoresData.stress_score ?? 15,
          sleep_deficit_percent: scoresData.sleep_deficit_percent ?? 0.0,
          screen_time_delta_percent: scoresData.screen_time_delta_percent ?? 0.0,
          step_deficit_percent: scoresData.step_deficit_percent ?? 0.0,
          context_switch_density: scoresData.context_switch_density ?? 0.0,
          social_app_ratio: scoresData.social_app_ratio ?? 0.0,
          keystroke_speed_delta_percent: scoresData.keystroke_speed_delta_percent ?? 0.0
        });
      }

      // 2. Fetch timeline predictions
      const predictionsRes = await fetch(`${BASE_URL}/api/v1/wellness/predictions`, {
        headers: { 'Authorization': token }
      });
      if (predictionsRes.ok) {
        const predData = await predictionsRes.json();
        setTimeline(predData.timeline || []);
      }

    } catch (err) {
      console.error('Failed to initialize dashboard parameters:', err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch subscription details
  const fetchSubscription = async (token = authToken) => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/wellness/subscription`, {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const subData = await res.json();
        setSubscription(subData);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  };

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!subscription || !subscription.current_period_end) return 0;
    const expiry = new Date(subscription.current_period_end);
    const diff = expiry.getTime() - Date.now();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  // Handle Chapa Upgrade payment session
  const handleChapaUpgrade = async () => {
    if (!authToken) return;
    setIsUpgrading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/wellness/subscription/chapa/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan_slug: 'premium-monthly' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        }
      }
    } catch (err) {
      console.error('Failed to initiate Chapa payment:', err);
    } finally {
      setIsUpgrading(false);
    }
  };

  // Trigger evaluation
  const triggerInference = async () => {
    if (!authToken) return;
    setIsEvaluating(true);
    try {
      const response = await fetch(`${BASE_URL}/api/v1/wellness/inference`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fcm_token: null })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.inference) {
          setAiInference({
            wellness_state: data.inference.wellness_state ?? 'Optimal Balance',
            explanation: data.inference.explanation ?? '',
            recommendations: data.inference.recommendations ?? []
          });
          // Refresh statistics
          fetchDashboardData();
        }
      }
    } catch (err) {
      console.error('Inference trigger failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Run on mount
  useEffect(() => {
    if (authToken) {
      fetchDashboardData(authToken);
      fetchSubscription(authToken);
    }
  }, [authToken]);

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    try {
      const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await response.json();
      if (response.ok) {
        const formattedToken = `Bearer ${data.token}`;
        setAuthToken(formattedToken);
        localStorage.setItem('auth_token', formattedToken);
        setCurrentUser(data.user);
        localStorage.setItem('current_user', JSON.stringify(data.user));

        // Clear forms
        setLoginEmail('');
        setLoginPassword('');
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (err) {
      alert('Server unreachable');
    }
  };

  // Handle Registration
  const handleRegisterSubmit = async () => {
    if (!name || !email || !password) return;

    const payload = {
      name,
      email,
      password,
      profile: {
        age: parseInt(age) || 25,
        gender: gender,
        work_status: workStatus.toLowerCase()
      },
      connections: {
        calendar_sync_enabled: calendarEnabled,
        external_sync_enabled: externalEnabled
      }
    };

    try {
      const response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        const formattedToken = `Bearer ${data.token}`;
        setAuthToken(formattedToken);
        localStorage.setItem('auth_token', formattedToken);
        setCurrentUser(data.user);
        localStorage.setItem('current_user', JSON.stringify(data.user));

        // Reset wizard
        setName('');
        setEmail('');
        setPassword('');
        setAge('');
        setGender('Female');
        setWorkStatus('Full-time');
        setCalendarEnabled(false);
        setExternalEnabled(false);
        setRegStep(1);
      } else {
        alert(data.error || 'Account creation failed');
      }
    } catch (err) {
      alert('Server unreachable');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentTab('home');
    setIsDrawerOpen(false);
    setShowChat(false);
    setActiveIntervention(null);
  };

  // Settings: Ignored Apps Management
  const addIgnoredApp = () => {
    const val = newIgnoredApp.trim();
    if (val && !ignoredApps.includes(val)) {
      const updated = [...ignoredApps, val];
      setIgnoredApps(updated);
      localStorage.setItem('web_ignored_apps', JSON.stringify(updated));
      setNewIgnoredApp('');
    }
  };

  const removeIgnoredApp = (app) => {
    const updated = ignoredApps.filter(x => x !== app);
    setIgnoredApps(updated);
    localStorage.setItem('web_ignored_apps', JSON.stringify(updated));
  };

  // Data Retention: Delete Today's Logs
  const deleteTodayLogs = async () => {
    if (!authToken) return;
    if (!confirm("Are you sure you want to delete today's telemetry logs and inferences from the database?")) return;

    try {
      const response = await fetch(`${BASE_URL}/api/v1/wellness/logs/today`, {
        method: 'DELETE',
        headers: { 'Authorization': authToken }
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || "Today's logs cleared successfully");
        fetchDashboardData();
      } else {
        alert(data.error || "Failed to delete today's logs");
      }
    } catch (err) {
      alert("Server unreachable");
    }
  };

  // Data Retention: Purge All Telemetry
  const purgeAllTelemetry = async () => {
    if (!authToken) return;
    if (!confirm("WARNING: This will permanently delete ALL of your telemetry history and AI inferences. This cannot be undone. Do you wish to proceed?")) return;

    try {
      const response = await fetch(`${BASE_URL}/api/v1/wellness/logs/all`, {
        method: 'DELETE',
        headers: { 'Authorization': authToken }
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || "All telemetry history purged successfully");
        fetchDashboardData();
      } else {
        alert(data.error || "Failed to purge telemetry history");
      }
    } catch (err) {
      alert("Server unreachable");
    }
  };

  // Chat Submission Handler
  const handleChatSubmit = (e) => {
    e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt) return;

    setChatInput('');
    const userMsg = { sender: 'user', text: prompt };
    setChatMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      let reply = '';
      const promptLower = prompt.toLowerCase();

      if (promptLower.includes('focus') || promptLower.includes('work') || promptLower.includes('switc')) {
        reply = "Your workstation metrics indicate high workspace context-switching (30 swaps/hour) between VS Code and browser distractions. I recommend launching a 25-minute Pomodoro quiet block.";
      } else if (promptLower.includes('sleep') || promptLower.includes('tir') || promptLower.includes('fatig')) {
        reply = "You logged a 37.5% sleep deficit compared to your typical 8-hour baseline. Conserving cognitive load early in the morning and taking a mid-day rest is highly advised.";
      } else if (promptLower.includes('risk') || promptLower.includes('burnout')) {
        reply = "Your 7-day burnout risk projection has escalated to 78% due to concurrent sleep loss (-37.5%) and high context swapping. Taking a structured disconnect is recommended.";
      } else {
        reply = "I am passively tracking focus cadences, steps deficits, and sleep offsets. Ask me about your specific score reductions or for a targeted coping intervention.";
      }

      setChatMessages(prev => [...prev, { sender: 'companion', text: reply }]);
    }, 800);
  };

  // Scroll to chat bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Breathing simulation text timer
  const [breathingText, setBreathingText] = useState("Inhale deeply through the nose...");
  const [breathingPulse, setBreathingPulse] = useState(1); // 1 = inhale, 2 = exhale
  useEffect(() => {
    if (activeIntervention === 'breathing') {
      const interval = setInterval(() => {
        setBreathingPulse(prev => {
          if (prev === 1) {
            setBreathingText("Exhale slowly through the mouth...");
            return 2;
          } else {
            setBreathingText("Inhale deeply through the nose...");
            return 1;
          }
        });
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeIntervention]);

  // Inline CSS animations for breathing pulsing orbits and custom scrollbars
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @keyframes breatheInhaleExhale {
        0% { transform: scale(1); }
        50% { transform: scale(1.25); }
        100% { transform: scale(1); }
      }
      .animate-breathing-orbit {
        animation: breatheInhaleExhale 8s ease-in-out infinite;
      }
      /* Custom scrollbar to make sure the chat scroll is invisible but scrollable */
      .custom-sidebar-scrollbar::-webkit-scrollbar {
        width: 0px !important;
        display: none !important;
      }
      /* Standard scrollbar for other browsers */
      .custom-sidebar-scrollbar {
        scrollbar-width: none !important;
        -ms-overflow-style: none; /* IE and Edge */
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [isDarkTheme]);

  // Prepare line chart data
  const drawLineChartData = () => {
    const labels = timeline.length > 0
      ? timeline.map(t => new Date(t.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }))
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const dataPoints = timeline.length > 0
      ? timeline.map(t => Math.round(t.burnout_risk * 100))
      : [10, 15, 30, 45, 60, 55, 78];

    return {
      labels,
      datasets: [{
        label: 'Burnout Risk Probability (%)',
        data: dataPoints,
        borderColor: '#D17E73',
        backgroundColor: 'rgba(209, 126, 115, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#D17E73',
        pointHoverRadius: 6,
        pointRadius: 4
      }]
    };
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDarkTheme ? '#1C2229' : '#FFFFFF',
        borderColor: isDarkTheme ? '#374151' : '#3b533b',
        borderWidth: 1,
        titleColor: isDarkTheme ? '#94A3B8' : '#3b533b',
        bodyColor: isDarkTheme ? '#E2E8F0' : '#3b533b',
        padding: 10,
        displayColors: false
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 83, 59, 0.05)' },
        ticks: { color: isDarkTheme ? '#94A3B8' : '#3b533b', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: isDarkTheme ? '#94A3B8' : '#3b533b', font: { size: 10 } }
      }
    }
  };

  // -------------------------------------------------------------
  // RENDERING COMPONENT CONDITIONAL BRANCHES
  // -------------------------------------------------------------

  // 1. Meditation Overlay (Active Intervention)
  if (activeIntervention === 'breathing') {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center z-50 text-center p-6 ${bgStyle}`}>
        <div className="max-w-md w-full space-y-12">
          <div className="space-y-2">
            <span className={`text-xs font-bold uppercase tracking-widest ${accentText}`}>GUIDED INTERVENTION</span>
            <h2 className="text-2xl font-bold tracking-wide h-12 flex items-center justify-center transition-all duration-500 text-[#D9B48F]">
              {breathingText}
            </h2>
          </div>

          {/* Meditative Pulsing Ring */}
          <div className="relative flex items-center justify-center h-72">
            <div
              className={`absolute w-44 h-44 rounded-full transition-all duration-[4000ms] ease-in-out flex items-center justify-center ${isDarkTheme ? 'bg-[#8E9F8E]' : 'bg-[#3b533b]'}`}
              style={{
                transform: breathingPulse === 1 ? 'scale(1.5)' : 'scale(0.9)',
                opacity: breathingPulse === 1 ? '0.35' : '0.15'
              }}
            />
            <div className="absolute w-24 h-24 rounded-full bg-[#3b533b]/20 flex items-center justify-center">
              <Heart className={`w-10 h-10 fill-[#3b533b] ${isDarkTheme ? 'text-[#8E9F8E] fill-[#8E9F8E]' : 'text-[#3b533b] fill-[#3b533b]'}`} />
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <p className={`text-sm leading-relaxed ${mutedStyle}`}>
              The physiological sigh helps reset your autonomic nervous system, rapidly reducing cognitive friction and workspace stress.
            </p>
            <button
              onClick={() => setActiveIntervention(null)}
              className={`${primaryBtn} px-8 py-3.5 rounded-full text-xs font-extrabold tracking-widest uppercase transition-all shadow-md`}
            >
              Exit Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Chat Navigation and Focus Handler
  const handleFocusChat = () => {
    setCurrentTab('chat');
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  };

  // 3. Unauthenticated State (Wizard Onboarding or Login)
  if (!authToken) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 md:p-8 ${bgStyle}`}>
        {/* Main Two-Pane Split Container Card */}
        <div className={`w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border ${cardStyle}`}>
          
          {/* Left Visual Panel - 5 Columns */}
          <div className={`hidden md:flex md:col-span-5 flex-col justify-between p-8 text-white relative overflow-hidden ${
            isDarkTheme ? 'bg-gradient-to-br from-[#1C2229] to-[#12161A]' : 'bg-gradient-to-br from-[#3b533b] to-[#2d3f2d]'
          }`}>
            {/* Absolute Background Accent Shapes */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

            {/* Brand Header */}
            <div className="flex items-center space-x-2 shrink-0 z-10">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-black text-sm text-white border border-white/20 shadow-md">C</div>
              <span className="text-sm font-black tracking-widest uppercase">Companion</span>
            </div>

            {/* Glowing Concentric Orbits Core representation */}
            <div className="flex-1 flex flex-col justify-center items-center py-8 z-10">
              <div className="relative w-48 h-48 flex items-center justify-center animate-breathing-orbit mb-6">
                <div className="absolute w-44 h-44 rounded-full border border-white/15" />
                <div className="absolute w-32 h-32 rounded-full border-2 border-white/30" />
                <div className="absolute w-20 h-20 rounded-full flex items-center justify-center bg-white/10 border border-white/20">
                  <Heart className="w-8 h-8 text-white fill-current animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2 px-2">
                <h2 className="text-lg font-black uppercase tracking-wider">The Cognitive Orbit</h2>
                <p className="text-[10px] text-white/80 leading-normal uppercase tracking-wider max-w-xs font-semibold">
                  Passive, on-device telemetry diagnostics designed to preserve cognitive wellness and respect absolute boundaries.
                </p>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center z-10 shrink-0">
              <p className="text-[9px] text-white/60 tracking-widest uppercase font-bold">100% Encrypted & On-Device</p>
            </div>
          </div>

          {/* Right Interactive Form Panel - 7 Columns */}
          <div className="col-span-1 md:col-span-7 p-6 md:p-8 flex flex-col justify-center space-y-6">
            
            {/* Top mobile brand header (hidden on desktop) */}
            <div className="text-center space-y-1.5 md:hidden">
              <h1 className={`text-3xl font-black tracking-widest uppercase ${accentText}`}>COMPANION</h1>
              <p className={`text-[9px] uppercase tracking-widest font-extrabold ${mutedStyle}`}>On-Device Cognitive Health Broker</p>
            </div>

            {/* Form navigation tabs */}
            <div className={`flex border-b pb-1 ${borderStyle}`}>
              <button
                onClick={() => {
                  setAuthMode('login');
                  setRegStep(1);
                }}
                className={`w-1/2 pb-3 text-center text-xs tracking-widest font-extrabold border-b-2 transition-all ${
                  authMode === 'login'
                    ? (isDarkTheme ? 'border-[#8E9F8E] text-[#8E9F8E]' : 'border-[#3b533b] text-[#3b533b]')
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                LOGIN
              </button>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setRegStep(1);
                }}
                className={`w-1/2 pb-3 text-center text-xs tracking-widest font-extrabold border-b-2 transition-all ${
                  authMode === 'register'
                    ? (isDarkTheme ? 'border-[#8E9F8E] text-[#8E9F8E]' : 'border-[#3b533b] text-[#3b533b]')
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                REGISTER
              </button>
            </div>

            {authMode === 'login' ? (
              /* LOGIN SCREEN */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className={`text-md font-extrabold ${textStyle}`}>Welcome Back</h3>
                  <p className={`text-[11px] ${mutedStyle}`}>Sign in to resume tracking and diagnostics.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 ${mutedStyle}`}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className={`w-full rounded-xl px-4 py-3 text-xs focus:outline-none transition-all focus:ring-4 ${
                        isDarkTheme ? 'focus:ring-[#8E9F8E]/10' : 'focus:ring-[#3b533b]/10'
                      } ${inputStyle}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 ${mutedStyle}`}>Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full rounded-xl px-4 py-3 text-xs focus:outline-none transition-all focus:ring-4 ${
                        isDarkTheme ? 'focus:ring-[#8E9F8E]/10' : 'focus:ring-[#3b533b]/10'
                      } ${inputStyle}`}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className={`w-full py-3.5 rounded-xl text-xs font-extrabold tracking-widest uppercase transition-all shadow-lg ${primaryBtn}`}
                >
                  Authenticate
                </button>
              </form>
            ) : (
              /* SIGNUP ONBOARDING WIZARD */
              <div className="space-y-6">
                
                {/* Visual Progress Stepper Dots */}
                <div className="flex justify-between items-center py-2 px-4 rounded-xl border border-gray-500/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Onboarding</span>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3].map((step) => (
                      <React.Fragment key={step}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                          regStep === step
                            ? (isDarkTheme ? 'bg-[#8E9F8E] text-[#12161A]' : 'bg-[#3b533b] text-white ring-4 ring-[#3b533b]/15')
                            : regStep > step
                              ? (isDarkTheme ? 'bg-[#8E9F8E]/20 text-[#8E9F8E]' : 'bg-[#3b533b]/10 text-[#3b533b]')
                              : 'bg-transparent text-gray-500 border border-gray-500/20'
                        }`}>
                          {step}
                        </div>
                        {step < 3 && <div className={`w-4 h-0.5 border-t border-dashed transition-all ${regStep > step ? 'border-[#3b533b]/40' : 'border-gray-500/20'}`} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {regStep === 1 && (
                  /* Step 1: Account Creation */
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className={`text-sm font-extrabold ${textStyle}`}>Account Credentials</h3>
                      <p className={`text-[11px] ${mutedStyle}`}>Identifiers built into localized cognitive encryption layers.</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 ${mutedStyle}`}>Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jane Doe"
                          className={`w-full rounded-xl px-4 py-3 text-xs focus:outline-none transition-all focus:ring-4 ${
                            isDarkTheme ? 'focus:ring-[#8E9F8E]/10' : 'focus:ring-[#3b533b]/10'
                          } ${inputStyle}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 ${mutedStyle}`}>Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="jane@example.com"
                          className={`w-full rounded-xl px-4 py-3 text-xs focus:outline-none transition-all focus:ring-4 ${
                            isDarkTheme ? 'focus:ring-[#8E9F8E]/10' : 'focus:ring-[#3b533b]/10'
                          } ${inputStyle}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 ${mutedStyle}`}>Password</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full rounded-xl px-4 py-3 text-xs focus:outline-none transition-all focus:ring-4 ${
                            isDarkTheme ? 'focus:ring-[#8E9F8E]/10' : 'focus:ring-[#3b533b]/10'
                          } ${inputStyle}`}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (name && email && password) {
                          setRegStep(2);
                        } else {
                          alert('Please fill out all credentials.');
                        }
                      }}
                      className={`w-full py-3.5 rounded-xl text-xs font-extrabold tracking-widest uppercase transition-all shadow-md ${primaryBtn}`}
                    >
                      Next Step
                    </button>
                  </div>
                )}

                {regStep === 2 && (
                  /* Step 2: Demographics */
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className={`text-sm font-extrabold ${textStyle}`}>Basic Demographics</h3>
                      <p className={`text-[11px] ${mutedStyle}`}>Inputs establish relative biometric focus and stress parameters.</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1 ${mutedStyle}`}>Age</label>
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="25"
                          className={`w-full rounded-xl px-4 py-3 text-xs focus:outline-none transition-all focus:ring-4 ${
                            isDarkTheme ? 'focus:ring-[#8E9F8E]/10' : 'focus:ring-[#3b533b]/10'
                          } ${inputStyle}`}
                        />
                      </div>

                      {/* Gender Selection */}
                      <div>
                        <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-2 ${mutedStyle}`}>Gender</label>
                        <div className="flex gap-2">
                          {['Female', 'Male', 'Other'].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGender(g)}
                              className={`flex-1 py-2.5 text-xs font-bold rounded-lg border transition-all ${
                                gender === g
                                  ? (isDarkTheme ? 'bg-[#8E9F8E] text-[#12161A] border-[#8E9F8E]' : 'bg-[#3b533b] text-white border-[#3b533b]')
                                  : (isDarkTheme ? 'bg-[#12161A] text-gray-400 border-gray-800' : 'bg-white text-[#3b533b]/80 border-[#3b533b]/20 hover:border-[#3b533b]/40')
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Work Status Selector */}
                      <div>
                        <label className={`block text-[10px] font-extrabold uppercase tracking-wider mb-2 ${mutedStyle}`}>Work Status</label>
                        <div className={`space-y-2 p-3 rounded-lg border ${inputStyle}`}>
                          {['Full-time', 'Freelancer', 'Student', 'Unemployed'].map((status) => (
                            <label key={status} className="flex items-center space-x-3 cursor-pointer py-1.5">
                              <input
                                type="radio"
                                name="work_status"
                                checked={workStatus === status}
                                onChange={() => setWorkStatus(status)}
                                className={`w-4 h-4 ${isDarkTheme ? 'accent-[#8E9F8E]' : 'accent-[#3b533b]'}`}
                              />
                              <span className="text-xs font-semibold leading-none">{status}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setRegStep(1)}
                        className="flex-1 bg-transparent hover:bg-black/10 border border-gray-500/20 text-gray-400 py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          if (age) {
                            setRegStep(3);
                          } else {
                            alert('Please enter your age.');
                          }
                        }}
                        className={`flex-1 py-3.5 rounded-xl text-xs font-extrabold tracking-widest uppercase transition-all shadow-md ${primaryBtn}`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {regStep === 3 && (
                  /* Step 3: Passive Telemetry Sync */
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className={`text-sm font-extrabold ${textStyle}`}>Passive Telemetry Sync</h3>
                      <p className={`text-[11px] ${mutedStyle}`}>Grant secure permissions to link local work logs and wearable sync feeds.</p>
                    </div>

                    <div className={`space-y-3 p-4 rounded-xl border text-xs font-bold ${inputStyle}`}>
                      <label className="flex items-center space-x-3 cursor-pointer py-2 border-b border-gray-500/10">
                        <input
                          type="checkbox"
                          checked={calendarEnabled}
                          onChange={(e) => setCalendarEnabled(e.target.checked)}
                          className={`w-4 h-4 rounded ${isDarkTheme ? 'accent-[#8E9F8E]' : 'accent-[#3b533b]'}`}
                        />
                        <span>Enable Google Calendar Sync</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer py-2">
                        <input
                          type="checkbox"
                          checked={externalEnabled}
                          onChange={(e) => setExternalEnabled(e.target.checked)}
                          className={`w-4 h-4 rounded ${isDarkTheme ? 'accent-[#8E9F8E]' : 'accent-[#3b533b]'}`}
                        />
                        <span>Authorize Health Connect sync</span>
                      </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setRegStep(2)}
                        className="flex-1 bg-transparent hover:bg-black/10 border border-gray-500/20 text-gray-400 py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleRegisterSubmit}
                        className={`flex-1 py-3.5 rounded-xl text-xs font-extrabold tracking-widest uppercase transition-all shadow-lg ${primaryBtn}`}
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // 4. Authenticated View: Persistent Sidebar & Dynamic Workspace
  return (
    <div className={`min-h-screen flex transition-all ${bgStyle}`}>
      
      {/* Constant/Persistent Sidebar Navigation */}
      <aside className={`w-44 md:w-52 flex flex-col h-screen sticky top-0 border-r p-4 space-y-4 shadow-sm overflow-hidden shrink-0 ${
        isDarkTheme ? 'bg-[#1C2229] border-gray-800 text-white' : 'bg-white border-[#3b533b]/20 text-[#3b533b]'
      }`}>
        
        {/* User Identity Header (C logo deleted, User initial circle centered with name/email stacked on subsequent lines!) */}
        <div className="flex flex-col items-center text-center pb-3 border-b border-gray-500/10 relative">
          {/* Theme Toggle Button (Sun & Moon) at the absolute top-right */}
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className={`absolute top-0 right-0 p-1 rounded-full border transition-all flex items-center justify-center shrink-0 ${
              isDarkTheme 
                ? 'bg-[#12161A] border-gray-800 text-[#8E9F8E] hover:bg-gray-800/40' 
                : 'bg-[#d6dbd5] border-[#3b533b]/20 text-[#3b533b] hover:bg-[#3b533b]/10'
            }`}
            title={isDarkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkTheme ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </button>

          {/* Large Name Initial Circle */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-md shrink-0 mb-2 mt-2 ${
            isDarkTheme ? 'bg-[#8E9F8E] text-[#12161A]' : 'bg-[#3b533b] text-white'
          }`}>
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>

          {/* Name and Email stacked vertically below */}
          <div className="space-y-0.5 min-w-0 w-full">
            <h3 className={`text-xs font-black tracking-wide truncate ${isDarkTheme ? 'text-white' : 'text-[#3b533b]'}`}>
              {currentUser?.name || 'Jane Doe'}
            </h3>
            <p className={`text-[9px] truncate ${mutedStyle}`}>{currentUser?.email || 'jane@example.com'}</p>
          </div>
        </div>

        {/* Sidebar Interactive Navigation Tab Buttons with AI Chat Tab */}
        <div className="space-y-1.5 shrink-0">
          <h4 className={`text-[9px] font-extrabold uppercase tracking-widest ${isDarkTheme ? 'text-gray-500' : 'text-[#3b533b]/60'}`}>Navigation</h4>
          <div className="space-y-1">
            {[
              { id: 'home', label: 'Dashboard', icon: Home },
              { id: 'analytics', label: 'Projections', icon: BarChart2 },
              { id: 'chat', label: 'AI Chat', icon: Send },
              { id: 'subscription', label: 'Subscription', icon: Sparkles },
              { id: 'settings', label: 'Privacy Center', icon: Settings }
            ].map((item) => {
              const ItemIcon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all ${
                    isActive
                      ? (isDarkTheme ? 'bg-[#8E9F8E]/10 text-[#8E9F8E]' : 'bg-[#3b533b]/10 text-[#3b533b]')
                      : (isDarkTheme ? 'text-gray-400 hover:bg-gray-800/30 hover:text-gray-200' : 'text-[#3b533b]/80 hover:bg-[#3b533b]/10 hover:text-[#3b533b]')
                  }`}
                >
                  <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Spacer to push logout to the absolute bottom */}
        <div className="flex-1" />

        {/* Logout Button at bottom-left */}
        <div className="pt-2 border-t border-gray-500/10 flex justify-start shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all ${
              isDarkTheme 
                ? 'bg-[#12161A] border border-gray-800 hover:border-red-800 text-gray-400 hover:text-red-400' 
                : 'bg-[#d6dbd5] border border-[#3b533b]/20 hover:border-red-300 text-[#3b533b] hover:text-red-600'
            }`}
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard body Container (Right side) */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Top Header Row for refresh & active screen designation */}
        <header className={`px-6 py-4 flex items-center justify-between border-b shrink-0 sticky top-0 z-20 ${
          isDarkTheme ? 'border-gray-800 bg-[#12161A]' : 'border-[#3b533b]/20 bg-[#d6dbd5]'
        }`}>
          <div className="flex items-center space-x-4">
            <h1 className="text-xs font-black uppercase tracking-widest">
              {currentTab === 'home' ? 'Dashboard Overview' : currentTab === 'analytics' ? '7-Day Projections' : currentTab === 'subscription' ? 'Subscription Control' : 'Privacy Center Settings'}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {/* Refresh Button */}
            <button
              onClick={() => fetchDashboardData()}
              disabled={isRefreshing}
              className={`p-2 border rounded-full transition-all disabled:opacity-50 ${
                isDarkTheme ? 'bg-[#1C2229] border-gray-800 text-[#8E9F8E] hover:bg-gray-800/40' : 'bg-white border-[#3b533b]/20 text-[#3b533b] hover:bg-[#d6dbd5]'
              }`}
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Content View wrapper taking full layout width to eliminate unused margins */}
        <div className="p-6 md:p-8 space-y-8 pb-24 flex-1 w-full max-w-full">

        {/* -----------------------------------------------------------
            TAB 1: HOME (WELLNESS ORBIT SCREEN)
           ----------------------------------------------------------- */}
        {currentTab === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Primary Columns: Orbits and Scores */}
            <div className="col-span-1 md:col-span-2 space-y-8">
              
              {/* Daily Overview Banner */}
              <div className={`${cardStyle} p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                <div>
                  <h1 className="text-xl font-extrabold mb-1">Your Daily Wellness Analysis</h1>
                  <p className={`text-xs ${mutedStyle}`}>Behavioral and physical metrics are steady within baseline averages.</p>
                </div>
                <span className={`text-xs px-3.5 py-1.5 rounded-full ${badgeStyle}`}>
                  COHORT: {currentUser?.profile?.work_status ?? 'FULL-TIME'}
                </span>
              </div>

              {/* Concentric Pulsing Ring Section */}
              <div className={`${cardStyle} p-8 flex flex-col items-center text-center space-y-6`}>
                <span className={`text-xs font-bold tracking-widest uppercase ${mutedStyle}`}>The Wellness Orbit</span>
                
                {/* Concentric Orbits Graphic with CSS breathing animation */}
                <div className="relative w-60 h-60 flex items-center justify-center animate-breathing-orbit">
                  {/* Focus Circle (Outer) */}
                  <div className={`absolute w-52 h-52 rounded-full border-4 ${orbitRing1}`} />
                  {/* Sleep Circle (Middle) */}
                  <div className={`absolute w-36 h-36 rounded-full border-2 ${orbitRing2}`} />
                  {/* Heart Core (Inner) */}
                  <div className={`absolute w-20 h-20 rounded-full flex items-center justify-center ${orbitCore}`}>
                    <Heart className={`w-8 h-8 fill-current ${orbitHeart}`} />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-extrabold">Your cognitive load is steady</p>
                  <p className={`text-xs ${mutedStyle}`}>Telemetry streams from your active workstation are stable.</p>
                </div>
              </div>

              {/* Aggregated Score Widgets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Energy Score */}
                <div className={`${cardStyle} p-6 text-center space-y-2`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${mutedStyle}`}>Energy Level</span>
                  <div className={`text-4xl font-black ${accentText}`}>{scores.energy_score}</div>
                  <p className={`text-[10px] leading-normal font-semibold ${mutedStyle}`}>Based on steps and sleep duration</p>
                </div>

                {/* Focus Score */}
                <div className={`${cardStyle} p-6 text-center space-y-2`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${mutedStyle}`}>Workplace Focus</span>
                  <div className={`text-4xl font-black ${accentText}`}>{scores.focus_score}</div>
                  <p className={`text-[10px] leading-normal font-semibold ${mutedStyle}`}>Based on context-switches and keystrokes</p>
                </div>

                {/* Stress Score */}
                <div className={`${cardStyle} p-6 text-center space-y-2`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${mutedStyle}`}>Systemic Stress</span>
                  <div className={`text-4xl font-black ${warningText}`}>{scores.stress_score}</div>
                  <p className={`text-[10px] leading-normal font-semibold ${mutedStyle}`}>Composite physiological variance</p>
                </div>
              </div>

              {/* Passive Telemetry Deltas Lists */}
              <div className={`${cardStyle} p-6 space-y-4`}>
                <span className={`text-xs font-bold uppercase tracking-widest block ${mutedStyle}`}>Passive Telemetry Deltas</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold">
                  <div className="space-y-3">
                    <div className={`flex justify-between border-b pb-2.5 ${borderStyle}`}>
                      <span className={mutedStyle}>Sleep Deficit</span>
                      <span>{scores.sleep_deficit_percent}%</span>
                    </div>
                    <div className={`flex justify-between border-b pb-2.5 ${borderStyle}`}>
                      <span className={mutedStyle}>Screen Time Shift</span>
                      <span>+{scores.screen_time_delta_percent}%</span>
                    </div>
                    <div className={`flex justify-between border-b pb-2.5 ${borderStyle}`}>
                      <span className={mutedStyle}>Locomotion Delta</span>
                      <span>{scores.step_deficit_percent}%</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className={`flex justify-between border-b pb-2.5 ${borderStyle}`}>
                      <span className={mutedStyle}>Context Swapping Rate</span>
                      <span>{scores.context_switch_density}/h</span>
                    </div>
                    <div className={`flex justify-between border-b pb-2.5 ${borderStyle}`}>
                      <span className={mutedStyle}>Social Apps Consumption</span>
                      <span>{Math.round(scores.social_app_ratio * 100)}%</span>
                    </div>
                    <div className={`flex justify-between border-b pb-2.5 ${borderStyle}`}>
                      <span className={mutedStyle}>Typing Cadence Latency</span>
                      <span>{scores.keystroke_speed_delta_percent}%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: AI Insights & Recommended Action */}
            <div className="col-span-1 space-y-8">
              
              {/* Proactive Recommendation Card */}
              <div className={`${cardStyle} p-6 space-y-4`}>
                <div className="flex items-center space-x-2">
                  <Sparkles className={`w-4 h-4 ${accentText}`} />
                  <span className={`text-xs font-bold uppercase tracking-widest ${accentText}`}>Active AI Recommendation</span>
                </div>
                <div>
                  <h3 className="text-md font-extrabold uppercase tracking-wide">
                    {aiInference.wellness_state.replace('_', ' ')}
                  </h3>
                  <p className={`text-xs mt-1.5 leading-relaxed font-medium ${mutedStyle}`}>
                    {aiInference.explanation}
                  </p>
                </div>

                <div className={`border-t pt-4 space-y-3 ${borderStyle}`}>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Coping Interventions:</div>
                  <ul className="text-xs space-y-2 list-disc pl-4 font-semibold">
                    {aiInference.recommendations.map((rec, idx) => (
                      <li key={idx} className={`leading-relaxed ${mutedStyle}`}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={triggerInference}
                  disabled={isEvaluating}
                  className={`w-full py-3 rounded-xl text-xs uppercase tracking-wider ${secondaryBtn} disabled:opacity-50`}
                >
                  {isEvaluating ? 'Evaluating sensor matrices...' : 'Trigger On-Demand Evaluation'}
                </button>
              </div>

              {/* Recommended Action Card (Proactive Breathing Session Trigger) */}
              <div className={`${cardStyle} p-6 space-y-4`}>
                <span className={`text-xs font-bold uppercase tracking-widest block ${mutedStyle}`}>Recommended Action</span>
                <p className={`text-xs leading-relaxed font-semibold ${mutedStyle}`}>
                  Context-switching has been elevated over the last 45 minutes on your workstation. Take a 60-second breathing break to restore focus?
                </p>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setActiveIntervention('breathing')}
                    className={`flex-[1.5] py-2.5 rounded-lg text-xs tracking-wider uppercase ${primaryBtn}`}
                  >
                    Start Now
                  </button>
                  <button
                    onClick={() => alert("Intervention dismissed.")}
                    className="flex-1 bg-transparent hover:bg-black/5 border border-gray-500/20 text-gray-400 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Fast Chat Entry Button */}
              <div className={`${cardStyle} p-6 flex items-center justify-between`}>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold">Interactive Diagnostics</h4>
                  <p className={`text-[10px] ${mutedStyle}`}>Query your passive telemetry history.</p>
                </div>
                <button
                  onClick={handleFocusChat}
                  className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider ${primaryBtn}`}
                >
                  Chat AI
                </button>
              </div>

            </div>

          </div>
        )}

        {/* -----------------------------------------------------------
            TAB 2: ANALYTICS (FORECASTING SUITE SCREEN)
           ----------------------------------------------------------- */}
        {currentTab === 'analytics' && (
          <div className="space-y-8 w-full">
            
            {/* Bezier line Chart block */}
            <div className={`${cardStyle} p-6 space-y-4`}>
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-widest ${mutedStyle}`}>Predictive Forecasts</h3>
                <h2 className="text-lg font-extrabold mt-0.5">7-Day Burnout Risk Projection</h2>
              </div>
              <div className="h-64 relative">
                <Line data={drawLineChartData()} options={lineChartOptions} />
              </div>
            </div>

            {/* Cognitive Correlation Feed Section */}
            <div className="space-y-4">
              <h3 className={`text-xs font-bold tracking-widest uppercase ${mutedStyle}`}>Cognitive Correlation Feed</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${cardStyle} p-6 space-y-3`}>
                  <div className={`flex items-center space-x-2 ${accentText}`}>
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Typing Cadence</span>
                  </div>
                  <p className={`text-xs leading-relaxed font-semibold ${mutedStyle}`}>
                    Your motor keystroke speed exhibits a 15% latency increase following days with sleep deficits greater than 25%. Rest blocks on these days limit overload by 40%.
                  </p>
                </div>

                <div className={`${cardStyle} p-6 space-y-3`}>
                  <div className={`flex items-center space-x-2 ${accentText}`}>
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-extrabold uppercase tracking-widest">Screen Time Offset</span>
                  </div>
                  <p className={`text-xs leading-relaxed font-semibold ${mutedStyle}`}>
                    Sustained social app scrolling late at night directly correlates with poorer sleep records (+1.5h sleep deficit) on the following day.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Chat Button */}
            <div className={`${cardStyle} p-6 flex flex-col sm:flex-row items-center justify-between gap-4`}>
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-extrabold">Got questions about these correlations?</h4>
                <p className={`text-xs mt-1 ${mutedStyle}`}>Converse with the passive companion AI for on-demand stress management.</p>
              </div>
              <button
                onClick={handleFocusChat}
                className={`px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-md flex items-center space-x-2 ${primaryBtn}`}
              >
                <Send className="w-4 h-4" />
                <span>Ask Companion AI</span>
              </button>
            </div>

          </div>
        )}

        {/* -----------------------------------------------------------
            TAB 2.5: SUBSCRIPTION (UPGRADE & PAYMENT CENTER)
           ----------------------------------------------------------- */}
        {currentTab === 'subscription' && (
          <div className="space-y-8 w-full">
            
            {/* Active Subscription Summary */}
            <div className={`${cardStyle} p-8 space-y-6 text-center`}>
              <div className="space-y-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${mutedStyle}`}>Account Tier</span>
                <h2 className="text-2xl font-black uppercase tracking-wider flex items-center justify-center space-x-2">
                  <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                  <span>{subscription?.plan_name || 'Free Plan'}</span>
                </h2>
              </div>

              <div className={`p-4 rounded-xl border max-w-sm mx-auto text-xs font-semibold ${
                isDarkTheme ? 'bg-[#12161A] border-gray-800' : 'bg-[#3b533b]/10 border-[#3b533b]/20'
              }`}>
                <div className="flex justify-between py-2 border-b border-gray-500/10">
                  <span className={mutedStyle}>Status:</span>
                  <span className="font-extrabold uppercase text-green-500">
                    {subscription?.plan_slug === 'free' || !subscription ? 'Trial (Active)' : (getDaysRemaining() > 0 ? 'Active' : 'Expired')}
                  </span>
                </div>
                {subscription?.plan_slug !== 'free' && subscription && (
                  <div className="flex justify-between py-2 border-b border-gray-500/10">
                    <span className={mutedStyle}>Days Remaining:</span>
                    <span className="font-extrabold uppercase text-amber-500">{getDaysRemaining()} Days Left</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className={mutedStyle}>Period End:</span>
                  <span className={isDarkTheme ? 'text-gray-300' : 'text-[#3b533b]'}>
                    {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Upgrade Card - Always available for stacking days */}
            <div className={`${cardStyle} p-8 space-y-6 border-2 border-amber-500/20`}>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black tracking-wide">UPGRADE / EXTEND SUBSCRIPTION</h3>
                <p className={`text-xs leading-relaxed max-w-md mx-auto ${mutedStyle}`}>
                  Gain or extend unlimited access to active window app tracking, raw keystroke analysis, full historical projections, and priority Companion AI inference.
                </p>
              </div>

              <div className="text-center py-4">
                <span className="text-4xl font-black">ETB 299</span>
                <span className={`text-xs uppercase font-extrabold tracking-widest ${mutedStyle}`}> / Month</span>
              </div>

              <button
                onClick={handleChapaUpgrade}
                disabled={isUpgrading}
                className={`w-full max-w-sm mx-auto py-4 rounded-xl text-xs uppercase tracking-widest shadow-md font-extrabold flex items-center justify-center space-x-2 ${
                  isDarkTheme ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'bg-amber-600 hover:bg-amber-700 text-white'
                } disabled:opacity-50`}
              >
                {isUpgrading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isUpgrading ? 'Redirecting to Chapa...' : 'Upgrade with Chapa'}</span>
              </button>

              <p className="text-[10px] text-center text-gray-500 font-semibold uppercase tracking-wider">
                Securely processed by Chapa Payment Gateway
              </p>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------
            TAB 3: SETTINGS (SETTINGS SCREEN / PRIVACY CENTER)
           ----------------------------------------------------------- */}
        {currentTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            
            {/* Left side settings card */}
            <div className="space-y-8">
              
              {/* Profile Summary section (Added as requested!) */}
              <div className={`${cardStyle} p-6 space-y-5`}>
                <div className="space-y-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${mutedStyle}`}>Identity Index</span>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${accentText}`}>Personal Profile</h3>
                </div>
                
                <div className="flex items-center space-x-3.5 pb-4 border-b border-gray-500/10">
                  <div className={`w-12 h-14 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-sm ${
                    isDarkTheme ? 'bg-[#8E9F8E]/10 text-[#8E9F8E]' : 'bg-[#3b533b]/10 text-[#3b533b]'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold">{currentUser?.name || 'Jane Doe'}</h4>
                    <p className={`text-[11px] font-semibold ${mutedStyle}`}>{currentUser?.email || 'jane@example.com'}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className={mutedStyle}>Demographic Cohort:</span>
                    <span className="font-extrabold text-sm">{currentUser?.profile?.gender || 'Female'}, {currentUser?.profile?.age || 25} yrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={mutedStyle}>Active Connections:</span>
                    <div className="flex space-x-1.5">
                      {currentUser?.connections?.calendar_sync_enabled && (
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${badgeStyle} flex items-center space-x-1`}>
                          <Calendar className="w-3 h-3 mr-0.5" />
                          <span>Calendar</span>
                        </span>
                      )}
                      {currentUser?.connections?.external_sync_enabled && (
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${badgeStyle} flex items-center space-x-1`}>
                          <Smartphone className="w-3 h-3 mr-0.5" />
                          <span>Health</span>
                        </span>
                      )}
                      {!currentUser?.connections?.calendar_sync_enabled && !currentUser?.connections?.external_sync_enabled && (
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-500/10`}>No sync feeds</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Telemetry controls */}
              <div className={`${cardStyle} p-6 space-y-5`}>
                <div className="space-y-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${mutedStyle}`}>Controls Dashboard</span>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${accentText}`}>Telemetry Controls</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { id: 'keyboard', label: 'Keyboard Cadence Latencies', checked: keyboardToggle, setChecked: setKeyboardToggle },
                    { id: 'app', label: 'Active Application Tracking', checked: activeAppToggle, setChecked: setActiveAppToggle },
                    { id: 'sleep', label: 'Wearable Health Connect Sync', checked: sleepToggle, setChecked: setSleepToggle }
                  ].map((ctrl) => (
                    <div key={ctrl.id} className={`flex justify-between items-center pb-2.5 border-b last:border-0 last:pb-0 ${borderStyle}`}>
                      <span className="text-xs font-semibold">{ctrl.label}</span>
                      <input
                        type="checkbox"
                        checked={ctrl.checked}
                        onChange={(e) => ctrl.setChecked(e.target.checked)}
                        className={`w-4 h-4 cursor-pointer ${isDarkTheme ? 'accent-[#8E9F8E]' : 'accent-[#3b533b]'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right side settings card (Danger Zone Deletions) */}
            <div className="space-y-8">
              
              {/* Data Retention delete handlers */}
              <div className={`${cardStyle} p-6 space-y-4`}>
                <div className="space-y-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${warningText}`}>Danger Zone</span>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${warningText}`}>Data Retention Control</h3>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={deleteTodayLogs}
                    className="w-full bg-red-400/10 hover:bg-red-400/20 text-[#D17E73] border border-[#D17E73]/30 font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all"
                  >
                    Delete Today's Logs
                  </button>
                  <button
                    onClick={purgeAllTelemetry}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg"
                  >
                    Purge All Telemetry
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* -----------------------------------------------------------
            TAB 4: AI COMPANION CHAT WORKSPACE
           ----------------------------------------------------------- */}
        {currentTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-transparent h-[calc(100vh-140px)] w-full max-w-full">
            {/* Message logs */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0 custom-sidebar-scrollbar mb-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500 space-y-4">
                  <div className={`p-4 rounded-full border ${cardStyle}`}>
                    <Sparkles className={`w-8 h-8 ${accentText}`} />
                  </div>
                  <p className={`text-sm max-w-sm leading-relaxed font-semibold ${mutedStyle}`}>
                    Ask the companion details about your cognitive focus patterns, steps deficits, sleep offsets, or request a coping strategy.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md w-full pt-4">
                    <button
                      onClick={() => setChatInput("Why was my focus score lower today?")}
                      className={`${cardStyle} p-4 rounded-xl text-left text-xs font-bold hover:border-[#3b533b] transition-all`}
                    >
                      "Why was my focus score lower today?"
                    </button>
                    <button
                      onClick={() => setChatInput("Check my 7-day burnout risk probability")}
                      className={`${cardStyle} p-4 rounded-xl text-left text-xs font-bold hover:border-[#3b533b] transition-all`}
                    >
                      "Check my 7-day burnout risk probability"
                    </button>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 text-xs font-medium shadow-sm leading-relaxed ${
                          isUser
                            ? (isDarkTheme ? 'bg-[#8E9F8E] text-[#12161A] rounded-tr-none' : 'bg-[#3b533b] text-white rounded-tr-none shadow-md')
                            : (isDarkTheme ? 'bg-[#1C2229] border border-gray-800 text-gray-300 rounded-tl-none' : 'bg-white border border-[#3b533b]/20 text-[#3b533b] rounded-tl-none shadow-sm')
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input - minimized and centered in the middle */}
            <form onSubmit={handleChatSubmit} className="pt-4 border-t border-gray-500/10 shrink-0 flex justify-center">
              <div className="flex w-full max-w-lg space-x-3 items-center px-4">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="e.g. why was my focus score lower today?"
                  className={`flex-1 rounded-full px-4 py-2.5 text-xs focus:outline-none transition-all shadow-inner ${inputStyle}`}
                />
                <button
                  type="submit"
                  className={`${primaryBtn} p-2.5 rounded-full shadow-md transition-all flex items-center justify-center shrink-0`}
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              </div>
            </form>
          </div>
        )}

        </div>
      </main>
    </div>
  );
}

export default App;
