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
  const [isDarkTheme, setIsDarkTheme] = useState(true);

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

  // -------------------------------------------------------------
  // THEME ACCENT SYSTEM FOR EMERALD LIGHT MODE / ZEN DARK MODE
  // -------------------------------------------------------------
  const bgStyle = isDarkTheme ? 'bg-[#12161A] text-[#E2E8F0]' : 'bg-[#F4FBF7] text-[#064E3B]';
  const cardStyle = isDarkTheme ? 'bg-[#1C2229] border border-gray-800' : 'bg-white border border-emerald-100 shadow-sm rounded-2xl';
  const textStyle = isDarkTheme ? 'text-slate-200' : 'text-[#064E3B]';
  const mutedStyle = isDarkTheme ? 'text-gray-400' : 'text-emerald-800/70';
  const borderStyle = isDarkTheme ? 'border-gray-800/80' : 'border-emerald-100';
  const inputStyle = isDarkTheme 
    ? 'bg-[#12161A] border-gray-800 text-slate-200 focus:border-[#8E9F8E]' 
    : 'bg-white border-emerald-200 text-[#064E3B] focus:border-[#10B981]';
  
  // Interactive Buttons
  const primaryBtn = isDarkTheme 
    ? 'bg-[#8E9F8E] hover:bg-[#7D8F7D] text-[#12161A] font-extrabold uppercase transition-all' 
    : 'bg-[#10B981] hover:bg-[#059669] text-white font-extrabold uppercase transition-all shadow-sm';
  const secondaryBtn = isDarkTheme 
    ? 'bg-[#12161A] border border-gray-800 hover:border-[#8E9F8E] hover:text-[#8E9F8E] text-[#8E9F8E] font-bold uppercase transition-all' 
    : 'bg-emerald-50/70 border border-emerald-200 hover:border-[#10B981] hover:text-[#10B981] text-[#047857] font-bold uppercase transition-all';
  
  // Color highlights
  const accentText = isDarkTheme ? 'text-[#8E9F8E]' : 'text-[#059669]';
  const accentBg = isDarkTheme ? 'bg-[#8E9F8E]/10' : 'bg-[#10B981]/10';
  const warningText = isDarkTheme ? 'text-[#D17E73]' : 'text-rose-600';
  const badgeStyle = isDarkTheme 
    ? 'text-[#8E9F8E] bg-[#12161A] border border-gray-800/60 font-bold' 
    : 'text-[#059669] bg-emerald-50 border border-emerald-100 font-bold';
  
  // Concentric Orbit Visuals
  const orbitRing1 = isDarkTheme ? 'border-[#8E9F8E]/30' : 'border-[#10B981]/30';
  const orbitRing2 = isDarkTheme ? 'border-[#8E9F8E]/50' : 'border-[#10B981]/50';
  const orbitCore = isDarkTheme ? 'bg-[#8E9F8E]/15' : 'bg-[#10B981]/15';
  const orbitHeart = isDarkTheme ? 'text-[#8E9F8E]' : 'text-[#10B981]';

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

  // Inline CSS animations for breathing pulsing orbits
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
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

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
        borderColor: isDarkTheme ? '#374151' : '#10B981',
        borderWidth: 1,
        titleColor: isDarkTheme ? '#94A3B8' : '#047857',
        bodyColor: isDarkTheme ? '#E2E8F0' : '#064E3B',
        padding: 10,
        displayColors: false
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.05)' },
        ticks: { color: isDarkTheme ? '#94A3B8' : '#047857', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: isDarkTheme ? '#94A3B8' : '#047857', font: { size: 10 } }
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
              className={`absolute w-44 h-44 rounded-full transition-all duration-[4000ms] ease-in-out flex items-center justify-center ${isDarkTheme ? 'bg-[#8E9F8E]' : 'bg-[#10B981]'}`}
              style={{
                transform: breathingPulse === 1 ? 'scale(1.5)' : 'scale(0.9)',
                opacity: breathingPulse === 1 ? '0.35' : '0.15'
              }}
            />
            <div className="absolute w-24 h-24 rounded-full bg-[#10B981]/20 flex items-center justify-center">
              <Heart className={`w-10 h-10 fill-[#10B981] ${isDarkTheme ? 'text-[#8E9F8E] fill-[#8E9F8E]' : 'text-[#10B981] fill-[#10B981]'}`} />
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

  // 2. Chat Overlay Client
  if (showChat) {
    return (
      <div className={`fixed inset-0 z-40 flex flex-col min-h-screen ${bgStyle}`}>
        {/* Chat Header */}
        <header className={`px-6 py-4 border-b flex items-center ${isDarkTheme ? 'bg-[#1C2229] border-gray-800' : 'bg-white border-emerald-100 shadow-sm'}`}>
          <button
            onClick={() => setShowChat(false)}
            className={`p-2 -ml-2 transition-all rounded-full ${isDarkTheme ? 'text-[#8E9F8E] hover:bg-gray-800/30' : 'text-[#10B981] hover:bg-emerald-50'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="ml-3">
            <h2 className={`text-sm font-bold tracking-widest uppercase ${accentText}`}>AI Companion Chat</h2>
            <p className={`text-[10px] uppercase font-bold tracking-wider ${mutedStyle}`}>Passive Telemetry Diagnostic Broker</p>
          </div>
        </header>

        {/* Message logs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500 space-y-4 mt-12">
              <div className={`p-4 rounded-full border ${cardStyle}`}>
                <Sparkles className={`w-8 h-8 ${accentText}`} />
              </div>
              <p className={`text-sm max-w-sm leading-relaxed font-semibold ${mutedStyle}`}>
                Ask the companion details about your cognitive focus patterns, steps deficits, sleep offsets, or request a coping strategy.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md w-full pt-4">
                <button
                  onClick={() => setChatInput("Why was my focus score lower today?")}
                  className={`${cardStyle} p-4 rounded-xl text-left text-xs font-bold hover:border-[#10B981] transition-all`}
                >
                  "Why was my focus score lower today?"
                </button>
                <button
                  onClick={() => setChatInput("Check my 7-day burnout risk probability")}
                  className={`${cardStyle} p-4 rounded-xl text-left text-xs font-bold hover:border-[#10B981] transition-all`}
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
                        ? (isDarkTheme ? 'bg-[#8E9F8E] text-[#12161A] rounded-tr-none' : 'bg-[#10B981] text-white rounded-tr-none shadow-md')
                        : (isDarkTheme ? 'bg-[#1C2229] border border-gray-800 text-gray-300 rounded-tl-none' : 'bg-white border border-emerald-100 text-[#064E3B] rounded-tl-none shadow-sm')
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

        {/* Chat input */}
        <form onSubmit={handleChatSubmit} className={`p-4 border-t flex justify-center ${isDarkTheme ? 'bg-[#1C2229] border-gray-800' : 'bg-white border-emerald-100'}`}>
          <div className="flex w-full max-w-4xl space-x-3 items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="e.g. why was my focus score lower today?"
              className={`flex-1 rounded-full px-5 py-3.5 text-xs focus:outline-none transition-all shadow-inner ${inputStyle}`}
            />
            <button
              type="submit"
              className={`${primaryBtn} p-3.5 rounded-full shadow-md transition-all flex items-center justify-center`}
            >
              <Send className="w-5 h-5 fill-current" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 3. Unauthenticated State (Wizard Onboarding or Login)
  if (!authToken) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${bgStyle}`}>
        <div className={`border p-8 rounded-2xl w-full max-w-md shadow-2xl space-y-6 ${cardStyle}`}>
          <div className="text-center space-y-2">
            <h1 className={`text-4xl font-extrabold tracking-wider ${accentText}`}>COMPANION</h1>
            <p className={`text-[10px] uppercase tracking-widest font-extrabold ${mutedStyle}`}>On-Device Cognitive Health Broker</p>
          </div>

          {/* Form navigation tabs */}
          <div className={`flex border-b ${borderStyle}`}>
            <button
              onClick={() => {
                setAuthMode('login');
                setRegStep(1);
              }}
              className={`w-1/2 pb-3 text-center text-xs tracking-widest font-extrabold border-b-2 transition-all ${
                authMode === 'login'
                  ? (isDarkTheme ? 'border-[#8E9F8E] text-[#8E9F8E]' : 'border-[#10B981] text-[#10B981]')
                  : 'border-transparent text-gray-500 hover:text-gray-300'
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
                  ? (isDarkTheme ? 'border-[#8E9F8E] text-[#8E9F8E]' : 'border-[#10B981] text-[#10B981]')
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              REGISTER
            </button>
          </div>

          {authMode === 'login' ? (
            /* LOGIN SCREEN */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${mutedStyle}`}>Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={`w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all ${inputStyle}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${mutedStyle}`}>Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all ${inputStyle}`}
                />
              </div>
              <button
                type="submit"
                className={`w-full py-4 rounded-lg text-xs font-extrabold tracking-widest uppercase transition-all shadow-lg ${primaryBtn}`}
              >
                Authenticate
              </button>
            </form>
          ) : (
            /* SIGNUP ONBOARDING WIZARD (Just like Kotlin App) */
            <div className="space-y-6">
              <div className={`flex justify-between items-center px-4 py-3 rounded-lg border ${badgeStyle}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider">Onboarding Session</span>
                <span className="text-xs font-extrabold">Step {regStep} of 3</span>
              </div>

              {regStep === 1 && (
                /* Step 1: Account Creation */
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className={`text-sm font-extrabold ${textStyle}`}>Create Account Credentials</h3>
                    <p className={`text-[11px] ${mutedStyle}`}>Provide identifiers to build local cognitive patterns.</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${mutedStyle}`}>Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className={`w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all ${inputStyle}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${mutedStyle}`}>Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        className={`w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all ${inputStyle}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${mutedStyle}`}>Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all ${inputStyle}`}
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
                    className={`w-full py-3.5 rounded-lg text-xs font-extrabold tracking-widest uppercase transition-all shadow-md ${primaryBtn}`}
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
                    <p className={`text-[11px] ${mutedStyle}`}>Inputs will establish baselines for stress levels.</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${mutedStyle}`}>Age</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="25"
                        className={`w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all ${inputStyle}`}
                      />
                    </div>

                    {/* Gender Selection */}
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${mutedStyle}`}>Gender</label>
                      <div className="flex gap-2">
                        {['Female', 'Male', 'Other'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-lg border transition-all ${
                              gender === g
                                ? (isDarkTheme ? 'bg-[#8E9F8E] text-[#12161A] border-[#8E9F8E]' : 'bg-[#10B981] text-white border-[#10B981]')
                                : (isDarkTheme ? 'bg-[#12161A] text-gray-400 border-gray-800' : 'bg-white text-emerald-800/80 border-emerald-100 hover:border-emerald-200')
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Work Status Selector */}
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${mutedStyle}`}>Work Status</label>
                      <div className={`space-y-2 p-3 rounded-lg border ${inputStyle}`}>
                        {['Full-time', 'Freelancer', 'Student', 'Unemployed'].map((status) => (
                          <label key={status} className="flex items-center space-x-3 cursor-pointer py-1.5">
                            <input
                              type="radio"
                              name="work_status"
                              checked={workStatus === status}
                              onChange={() => setWorkStatus(status)}
                              className={`w-4 h-4 ${isDarkTheme ? 'accent-[#8E9F8E]' : 'accent-[#10B981]'}`}
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
                      className="flex-1 bg-transparent hover:bg-black/10 border border-gray-500/20 text-gray-400 py-3.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
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
                      className={`flex-1 py-3.5 rounded-lg text-xs font-extrabold tracking-widest uppercase transition-all shadow-md ${primaryBtn}`}
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
                    <p className={`text-[11px] ${mutedStyle}`}>Grant permissions to establish physical boundaries and data feeds.</p>
                  </div>

                  <div className={`space-y-3 p-4 rounded-lg border text-xs font-bold ${inputStyle}`}>
                    <label className="flex items-center space-x-3 cursor-pointer py-2 border-b border-gray-500/10">
                      <input
                        type="checkbox"
                        checked={calendarEnabled}
                        onChange={(e) => setCalendarEnabled(e.target.checked)}
                        className={`w-4 h-4 rounded ${isDarkTheme ? 'accent-[#8E9F8E]' : 'accent-[#10B981]'}`}
                      />
                      <span>Enable Google Calendar Sync</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={externalEnabled}
                        onChange={(e) => setExternalEnabled(e.target.checked)}
                        className={`w-4 h-4 rounded ${isDarkTheme ? 'accent-[#8E9F8E]' : 'accent-[#10B981]'}`}
                      />
                      <span>Authorize Health Connect sync</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setRegStep(2)}
                      className="flex-1 bg-transparent hover:bg-black/10 border border-gray-500/20 text-gray-400 py-3.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleRegisterSubmit}
                      className={`flex-1 py-3.5 rounded-lg text-xs font-extrabold tracking-widest uppercase transition-all shadow-lg ${primaryBtn}`}
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
    );
  }

  // 4. Authenticated View: Side Drawer Panel & Navigation
  return (
    <div className={`min-h-screen transition-all ${bgStyle}`}>
      
      {/* Side Navigation Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          <div className={`relative flex w-full max-w-xs flex-col border-r p-6 text-white space-y-6 h-full shadow-2xl transition-all ${
            isDarkTheme ? 'bg-[#1C2229] border-gray-800' : 'bg-white text-[#064E3B] border-emerald-100'
          }`}>
            
            {/* Drawer profile Header */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-xl shadow-md ${
                  isDarkTheme ? 'bg-[#8E9F8E] text-[#12161A]' : 'bg-[#10B981] text-white'
                }`}>
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="space-y-0.5">
                  <h3 className={`text-sm font-extrabold tracking-wide ${isDarkTheme ? 'text-white' : 'text-[#064E3B]'}`}>{currentUser?.name || 'Jane Doe'}</h3>
                  <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-emerald-800/80'}`}>{currentUser?.email || 'jane@example.com'}</p>
                </div>
              </div>

              {/* Sidebar Profile details card */}
              <div className={`pt-4 space-y-2 text-xs border-t ${borderStyle}`}>
                <div className="flex justify-between items-center">
                  <span className={mutedStyle}>Age Cohort:</span>
                  <span className={`font-bold ${isDarkTheme ? 'text-slate-200' : 'text-[#064E3B]'}`}>{currentUser?.profile?.age ?? 25} years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={mutedStyle}>Work Profile:</span>
                  <span className={`font-bold uppercase tracking-wide ${isDarkTheme ? 'text-slate-200' : 'text-[#064E3B]'}`}>
                    {currentUser?.profile?.work_status ?? 'FULL-TIME'}
                  </span>
                </div>
              </div>
            </div>

            <hr className={borderStyle} />

            {/* Added Side Bar Interactive Navigation! (Added as requested) */}
            <div className="space-y-2">
              <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${isDarkTheme ? 'text-gray-500' : 'text-emerald-700/60'}`}>Navigation</h4>
              <div className="space-y-1">
                {[
                  { id: 'home', label: 'Dashboard', icon: Home },
                  { id: 'analytics', label: 'Projections', icon: BarChart2 },
                  { id: 'subscription', label: 'Subscription', icon: Sparkles },
                  { id: 'settings', label: 'Privacy Center', icon: Settings }
                ].map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all ${
                        isActive
                          ? (isDarkTheme ? 'bg-[#8E9F8E]/10 text-[#8E9F8E]' : 'bg-[#10B981]/10 text-[#059669]')
                          : (isDarkTheme ? 'text-gray-400 hover:bg-gray-800/30 hover:text-gray-200' : 'text-emerald-800/80 hover:bg-emerald-50 hover:text-[#064E3B]')
                      }`}
                    >
                      <ItemIcon className="w-4.5 h-4.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className={borderStyle} />

            {/* Client settings: Theme toggle */}
            <div className="space-y-4 flex-1">
              <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${isDarkTheme ? 'text-gray-500' : 'text-emerald-700/60'}`}>Preferences</h4>
              <div className={`flex items-center justify-between px-4 py-3.5 rounded-xl border ${
                isDarkTheme ? 'bg-[#12161A] border-gray-800/50' : 'bg-emerald-50/50 border-emerald-100'
              }`}>
                <div className="flex items-center space-x-2.5">
                  {isDarkTheme ? <Moon className={`w-4 h-4 ${accentText}`} /> : <Sun className={`w-4 h-4 ${accentText}`} />}
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDarkTheme ? 'text-gray-300' : 'text-[#064E3B]'}`}>Dark Mode Theme</span>
                </div>
                {/* On/Off sliding toggle switch button */}
                <button
                  type="button"
                  onClick={() => setIsDarkTheme(!isDarkTheme)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isDarkTheme 
                      ? 'bg-[#8E9F8E]' 
                      : 'bg-emerald-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isDarkTheme ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className={`w-full py-4 rounded-xl text-xs uppercase tracking-widest ${secondaryBtn}`}
            >
              Close Menu
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Scaffold Header TopBar */}
      <nav className={`border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30 ${
        isDarkTheme ? 'border-gray-800 bg-[#1C2229] text-white' : 'border-emerald-100 bg-white text-[#064E3B] shadow-sm'
      }`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className={`p-2 -ml-2 rounded-full transition-all ${isDarkTheme ? 'hover:bg-gray-800/40 text-[#8E9F8E]' : 'hover:bg-emerald-50 text-[#10B981]'}`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm ${
              isDarkTheme ? 'bg-[#8E9F8E] text-[#12161A]' : 'bg-[#10B981] text-white shadow-sm'
            }`}>C</div>
            <span className={`text-sm font-black tracking-widest uppercase ${isDarkTheme ? 'text-[#8E9F8E]' : 'text-[#10B981]'}`}>COMPANION</span>
          </div>
        </div>

        {/* User profile tags */}
        <div className="flex items-center space-x-4 text-xs font-semibold">
          <span className={`hidden sm:inline uppercase ${isDarkTheme ? 'text-gray-300' : 'text-[#064E3B]'}`}>
            {currentUser?.name || 'Loading user...'}
          </span>
          <button
            onClick={handleLogout}
            className={`p-2.5 rounded-full border transition-all flex items-center justify-center ${
              isDarkTheme ? 'bg-[#12161A] border-gray-800 hover:border-red-800 text-gray-400 hover:text-red-400' : 'bg-emerald-50/50 border-emerald-100 hover:border-red-200 text-[#047857] hover:text-red-500'
            }`}
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Dashboard body Container */}
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 pb-24">
        
        {/* Dynamic Navigation Top-Tabs layout */}
        <div className="flex justify-between items-center">
          <div className={`flex space-x-6 border-b w-full md:w-auto ${borderStyle}`}>
            {[
              { id: 'home', label: 'Dashboard', icon: Home },
              { id: 'analytics', label: 'Projections', icon: BarChart2 },
              { id: 'subscription', label: 'Subscription', icon: Sparkles },
              { id: 'settings', label: 'Privacy Center', icon: Settings }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center space-x-2 pb-2.5 text-xs tracking-widest uppercase font-extrabold border-b-2 transition-all ${
                    isActive
                      ? (isDarkTheme ? 'border-[#8E9F8E] text-[#8E9F8E]' : 'border-[#10B981] text-[#10B981]')
                      : `border-transparent ${isDarkTheme ? 'text-gray-500 hover:text-slate-300' : 'text-emerald-800/50 hover:text-[#064E3B]'}`
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => fetchDashboardData()}
            disabled={isRefreshing}
            className={`p-2.5 border rounded-full transition-all disabled:opacity-50 ${
              isDarkTheme ? 'bg-[#1C2229] border-gray-800 text-[#8E9F8E] hover:bg-gray-800/40' : 'bg-white border-emerald-100 text-[#10B981] hover:bg-emerald-50 shadow-sm'
            }`}
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

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
                  onClick={() => setShowChat(true)}
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
          <div className="space-y-8 max-w-4xl mx-auto">
            
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
                onClick={() => setShowChat(true)}
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
          <div className="space-y-8 max-w-2xl mx-auto">
            
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
                isDarkTheme ? 'bg-[#12161A] border-gray-800' : 'bg-emerald-50/30 border-emerald-100'
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
                  <span className={isDarkTheme ? 'text-gray-300' : 'text-[#064E3B]'}>
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
                className={`w-full py-4 rounded-xl text-xs uppercase tracking-widest shadow-md font-extrabold flex items-center justify-center space-x-2 ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
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
                    isDarkTheme ? 'bg-[#8E9F8E]/10 text-[#8E9F8E]' : 'bg-[#10B981]/10 text-[#059669]'
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
                        className={`w-4 h-4 cursor-pointer ${isDarkTheme ? 'accent-[#8E9F8E]' : 'accent-[#10B981]'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right side settings card (Ignored Apps Registry & Deletions) */}
            <div className="space-y-8">
              
              {/* Ignored Apps Registry */}
              <div className={`${cardStyle} p-6 space-y-4`}>
                <div className="space-y-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${mutedStyle}`}>Skip list Registry</span>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${accentText}`}>Ignored Applications</h3>
                </div>
                <p className={`text-[11px] leading-normal font-semibold ${mutedStyle}`}>
                  Define package names that are skipped from telemetry tracking (e.g. password managers, bank portals, or secure communicators).
                </p>

                {/* Ignored App Adding bar */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newIgnoredApp}
                    onChange={(e) => setNewIgnoredApp(e.target.value)}
                    placeholder="e.g. com.bitwarden.android"
                    className={`flex-1 rounded-lg px-3.5 py-2 text-xs focus:outline-none transition-all ${inputStyle}`}
                  />
                  <button
                    onClick={addIgnoredApp}
                    className={`px-4 rounded-lg text-xs font-extrabold uppercase tracking-wider ${primaryBtn}`}
                  >
                    Add
                  </button>
                </div>

                {/* Ignored App scroll List */}
                <div className="pt-2 max-h-40 overflow-y-auto space-y-2">
                  {ignoredApps.map((app) => (
                    <div
                      key={app}
                      className={`flex justify-between items-center px-3 py-2 rounded-lg border ${
                        isDarkTheme ? 'bg-[#12161A] border-gray-800/80' : 'bg-emerald-50/20 border-emerald-100/50'
                      }`}
                    >
                      <span className="text-xs font-semibold tracking-wide truncate pr-4">{app}</span>
                      <button
                        onClick={() => removeIgnoredApp(app)}
                        className="text-red-400 hover:text-red-300 transition-all p-1"
                        title="Remove app"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

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

      </div>
    </div>
  );
}

export default App;
