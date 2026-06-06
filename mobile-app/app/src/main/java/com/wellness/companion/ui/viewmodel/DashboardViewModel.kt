package com.wellness.companion.ui.viewmodel

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wellness.companion.data.local.RoomTelemetryDatabase
import com.wellness.companion.data.remote.*
import kotlinx.coroutines.launch

data class ChatMessage(
    val sender: String, // "user" or "companion"
    val text: String,
    val timestamp: Long = System.currentTimeMillis()
)

data class NotificationItem(
    val id: String,
    val title: String,
    val message: String,
    val timestamp: String,
    val isRead: Boolean = false
)

sealed interface OnboardingUiState {
    object Idle : OnboardingUiState
    object Loading : OnboardingUiState
    data class Success(val user: UserDto) : OnboardingUiState
    data class Error(val message: String) : OnboardingUiState
}

sealed interface ScoresUiState {
    object Loading : ScoresUiState
    data class Success(val scores: DailyScoresResponse) : ScoresUiState
    data class Error(val message: String) : ScoresUiState
}

sealed interface TimelineUiState {
    object Loading : TimelineUiState
    data class Success(val list: List<TimelineItemDto>) : TimelineUiState
    data class Error(val message: String) : TimelineUiState
}

class DashboardViewModel : ViewModel() {

    companion object {
        var instance: DashboardViewModel? = null
    }

    init {
        instance = this
    }

    override fun onCleared() {
        super.onCleared()
        if (instance == this) {
            instance = null
        }
    }

    fun addNotification(title: String, message: String) {
        notifications.add(0, NotificationItem(
            id = java.util.UUID.randomUUID().toString(),
            title = title,
            message = message,
            timestamp = "Just now"
        ))
    }

    // 1. Session and Onboarding State
    var authUser by mutableStateOf<UserDto?>(null)
        private set
    var authToken by mutableStateOf<String?>(null)
        private set
    var onboardingState by mutableStateOf<OnboardingUiState>(OnboardingUiState.Idle)
        private set

    // 2. Main Analytics & Telemetry Scores States
    var scoresState by mutableStateOf<ScoresUiState>(ScoresUiState.Loading)
        private set
    var timelineState by mutableStateOf<TimelineUiState>(TimelineUiState.Loading)
        private set
    var isRefreshing by mutableStateOf(false)
        private set

    // 3. Dual Theme Client-side Settings (handled strictly on-device)
    var isDarkTheme by mutableStateOf(false)
        private set

    fun toggleTheme() {
        isDarkTheme = !isDarkTheme
    }

    // --- Core Settings, Toggles and Registry Values ---
    var keyboardToggle by mutableStateOf(true)
        private set
    var activeAppToggle by mutableStateOf(true)
        private set
    var sleepToggle by mutableStateOf(false)
        private set
    var ignoredApps by mutableStateOf(listOf("com.android.settings", "com.google.android.apps.authenticator2", "com.bitwarden.android"))
        private set

    private fun getSharedPrefs(context: Context) = 
        context.getSharedPreferences("wellness_companion_prefs", Context.MODE_PRIVATE)

    fun loadSettings(context: Context) {
        val prefs = getSharedPrefs(context)
        keyboardToggle = prefs.getBoolean("keyboard_toggle", true)
        activeAppToggle = prefs.getBoolean("active_app_toggle", true)
        sleepToggle = prefs.getBoolean("sleep_toggle", false)
        val ignoredStr = prefs.getString("ignored_apps", "com.android.settings,com.google.android.apps.authenticator2,com.bitwarden.android") ?: ""
        ignoredApps = if (ignoredStr.isEmpty()) emptyList() else ignoredStr.split(",")

        // Load saved session
        val savedToken = prefs.getString("auth_token", null)
        val userId = prefs.getString("user_id", null)
        if (savedToken != null && userId != null) {
            authToken = savedToken
            val name = prefs.getString("user_name", "") ?: ""
            val email = prefs.getString("user_email", "") ?: ""
            val age = prefs.getInt("user_age", 25)
            val gender = prefs.getString("user_gender", "Female") ?: "Female"
            val workStatus = prefs.getString("user_work_status", "Full-time") ?: "Full-time"
            val calendar = prefs.getBoolean("user_calendar_enabled", false)
            val external = prefs.getBoolean("user_external_enabled", false)

            authUser = UserDto(
                id = userId,
                name = name,
                email = email,
                profile = DemographicProfile(age, gender, workStatus),
                connections = ConnectionsPayload(calendar, external)
            )
            fetchDashboardData()
        }
    }

    private fun saveSession(context: Context, token: String, user: UserDto) {
        val prefs = getSharedPrefs(context)
        prefs.edit().apply {
            putString("auth_token", token)
            putString("user_id", user.id)
            putString("user_name", user.name)
            putString("user_email", user.email)
            putInt("user_age", user.profile.age)
            putString("user_gender", user.profile.gender)
            putString("user_work_status", user.profile.work_status)
            putBoolean("user_calendar_enabled", user.connections.calendar_sync_enabled)
            putBoolean("user_external_enabled", user.connections.external_sync_enabled)
            apply()
        }
    }

    fun logoutUser(context: Context) {
        val prefs = getSharedPrefs(context)
        prefs.edit().apply {
            remove("auth_token")
            remove("user_id")
            remove("user_name")
            remove("user_email")
            remove("user_age")
            remove("user_gender")
            remove("user_work_status")
            remove("user_calendar_enabled")
            remove("user_external_enabled")
            apply()
        }
        authToken = null
        authUser = null
        subscriptionState = null
    }

    fun setKeyboardTracking(context: Context, enabled: Boolean) {
        keyboardToggle = enabled
        getSharedPrefs(context).edit().putBoolean("keyboard_toggle", enabled).apply()
    }

    fun setActiveAppTracking(context: Context, enabled: Boolean) {
        activeAppToggle = enabled
        getSharedPrefs(context).edit().putBoolean("active_app_toggle", enabled).apply()
    }

    fun setWearableSync(context: Context, enabled: Boolean) {
        sleepToggle = enabled
        getSharedPrefs(context).edit().putBoolean("sleep_toggle", enabled).apply()
    }

    fun addIgnoredApp(context: Context, packageName: String) {
        if (packageName.isNotEmpty() && !ignoredApps.contains(packageName)) {
            ignoredApps = ignoredApps + packageName
            getSharedPrefs(context).edit().putString("ignored_apps", ignoredApps.joinToString(",")).apply()
        }
    }

    fun removeIgnoredApp(context: Context, packageName: String) {
        ignoredApps = ignoredApps - packageName
        getSharedPrefs(context).edit().putString("ignored_apps", ignoredApps.joinToString(",")).apply()
    }

    // --- Nuclear Deletion Database Handlers ---
    fun deleteTodayLogs(context: Context, onSuccess: () -> Unit) {
        val token = authToken ?: return
        viewModelScope.launch {
            try {
                RetrofitClient.api.deleteTodayLogs(token)
                val database = RoomTelemetryDatabase.getDatabase(context)
                // Start of today: midnight in local millis
                val calendar = java.util.Calendar.getInstance()
                calendar.set(java.util.Calendar.HOUR_OF_DAY, 0)
                calendar.set(java.util.Calendar.MINUTE, 0)
                calendar.set(java.util.Calendar.SECOND, 0)
                database.telemetryDao().deleteTodayRawSignals(calendar.timeInMillis)
                
                onSuccess()
                fetchDashboardData()
            } catch (e: Exception) {
                // Silently bypass or retry
            }
        }
    }

    fun purgeAllTelemetry(context: Context, onSuccess: () -> Unit) {
        val token = authToken ?: return
        viewModelScope.launch {
            try {
                RetrofitClient.api.purgeAllLogs(token)
                val database = RoomTelemetryDatabase.getDatabase(context)
                database.telemetryDao().clearAllRawSignals()
                
                onSuccess()
                fetchDashboardData()
            } catch (e: Exception) {
                // Silently bypass or retry
            }
        }
    }

    // --- Conversational Chat Messages ---
    var chatMessages = mutableStateListOf<ChatMessage>()
        private set

    var notifications = mutableStateListOf<NotificationItem>(
        NotificationItem("1", "High Burnout Risk Alert", "Your 7-day burnout risk projection has escalated to 78% due to high context swapping.", "10 mins ago"),
        NotificationItem("2", "Sleep Deficit Warning", "You logged a 37.5% sleep deficit compared to your baseline. Conserving cognitive load early in the morning.", "1 hour ago"),
        NotificationItem("3", "Meditation Reminder", "Time for your 2-minute physiological sigh breathing session to reduce stress density.", "3 hours ago"),
        NotificationItem("4", "Step Deficit Flagged", "You are currently 4,500 steps behind your typical 8,000 daily steps baseline.", "Yesterday")
    )
        private set

    fun markAllNotificationsRead() {
        val updated = notifications.map { it.copy(isRead = true) }
        notifications.clear()
        notifications.addAll(updated)
    }

    fun clearAllNotifications() {
        notifications.clear()
    }

    var activeIntervention by mutableStateOf<String?>(null)

    fun handleChatQuery(prompt: String) {
        val token = authToken
        chatMessages.add(ChatMessage("user", prompt))
        viewModelScope.launch {
            if (token != null) {
                try {
                    val historyList = chatMessages.map { ChatMessageDto(it.sender, it.text) }
                    val payload = ChatPayload(prompt, historyList)
                    val response = RetrofitClient.api.sendChatQuery(token, payload)
                    chatMessages.add(ChatMessage("companion", response.reply))
                    return@launch
                } catch (e: Exception) {
                    android.util.Log.e("DashboardViewModel", "Gemini chat failed, fallback to heuristics: ${e.message}")
                }
            }

            kotlinx.coroutines.delay(800)
            val promptLower = prompt.lowercase()
            val reply = when {
                promptLower.contains("focus") || promptLower.contains("work") || promptLower.contains("switc") -> {
                    "Your workstation metrics indicate high workspace context-switching (30 swaps/hour) between VS Code and browser distractions. I recommend launching a 25-minute Pomodoro quiet block."
                }
                promptLower.contains("sleep") || promptLower.contains("tir") || promptLower.contains("fatig") -> {
                    "You logged a 37.5% sleep deficit compared to your typical 8-hour baseline. Conserving cognitive load early in the morning and taking a mid-day rest is highly advised."
                }
                promptLower.contains("risk") || promptLower.contains("burnout") -> {
                    "Your 7-day burnout risk projection has escalated to 78% due to concurrent sleep loss (-37.5%) and high context swapping. Taking a structured disconnect is recommended."
                }
                else -> {
                    "I am passively tracking focus cadences, steps deficits, and sleep offsets. Ask me about your specific score reductions or for a targeted coping intervention."
                }
            }
            chatMessages.add(ChatMessage("companion", reply))
        }
    }

    // 4. Authentication Procedures
    fun registerUser(context: Context, payload: SignupPayload) {
        viewModelScope.launch {
            onboardingState = OnboardingUiState.Loading
            try {
                val response = RetrofitClient.api.register(payload)
                authToken = "Bearer ${response.token}"
                authUser = response.user
                saveSession(context, authToken!!, response.user)
                onboardingState = OnboardingUiState.Success(response.user)
                fetchDashboardData()
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val friendlyMessage = try {
                    val json = org.json.JSONObject(errorBody ?: "")
                    json.getString("error")
                } catch (jsonException: Exception) {
                    "Registration failed. Please check your fields."
                }
                onboardingState = OnboardingUiState.Error(friendlyMessage)
            } catch (e: Exception) {
                onboardingState = OnboardingUiState.Error(e.message ?: "Registration failed")
            }
        }
    }

    fun loginUser(context: Context, payload: LoginPayload) {
        viewModelScope.launch {
            onboardingState = OnboardingUiState.Loading
            try {
                val response = RetrofitClient.api.login(payload)
                authToken = "Bearer ${response.token}"
                authUser = response.user
                saveSession(context, authToken!!, response.user)
                onboardingState = OnboardingUiState.Success(response.user)
                fetchDashboardData()
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val friendlyMessage = try {
                    val json = org.json.JSONObject(errorBody ?: "")
                    json.getString("error")
                } catch (jsonException: Exception) {
                    "Invalid email or password."
                }
                onboardingState = OnboardingUiState.Error(friendlyMessage)
            } catch (e: Exception) {
                onboardingState = OnboardingUiState.Error(e.message ?: "Authentication failed")
            }
        }
    }

    // 5. Remote Syncing and Aggregates
    fun fetchDashboardData() {
        val token = authToken ?: return
        viewModelScope.launch {
            isRefreshing = true
            scoresState = ScoresUiState.Loading
            timelineState = TimelineUiState.Loading
            try {
                // Read scores for today (simplified string routing)
                val scores = RetrofitClient.api.getDailyScores(token, "2026-06-05")
                scoresState = ScoresUiState.Success(scores)

                // Read 14-day risk timelines
                val timeline = RetrofitClient.api.getPredictionsTimeline(token)
                timelineState = TimelineUiState.Success(timeline.timeline)
                
                // Fetch subscription details
                fetchSubscription()
            } catch (e: Exception) {
                scoresState = ScoresUiState.Error(e.message ?: "Failed to read telemetry scores")
                timelineState = TimelineUiState.Error(e.message ?: "Failed to read timelines")
            } finally {
                isRefreshing = false
            }
        }
    }

    // Subscription State
    var subscriptionState by mutableStateOf<SubscriptionResponse?>(null)
        private set

    fun fetchSubscription() {
        val token = authToken ?: return
        viewModelScope.launch {
            try {
                val sub = RetrofitClient.api.getSubscription(token)
                subscriptionState = sub
            } catch (e: Exception) {
                android.util.Log.e("DashboardViewModel", "Failed to fetch subscription: ${e.message}")
            }
        }
    }

    fun upgradeWithChapa(planSlug: String, onResult: (String?, String?) -> Unit) {
        val token = authToken ?: return
        viewModelScope.launch {
            try {
                val res = RetrofitClient.api.initializeChapaPayment(token, ChapaInitPayload(planSlug))
                onResult(res.checkout_url, null)
            } catch (e: retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val friendlyMessage = try {
                    val json = org.json.JSONObject(errorBody ?: "")
                    json.getString("error")
                } catch (jsonException: Exception) {
                    "Chapa upgrade failed."
                }
                onResult(null, friendlyMessage)
            } catch (e: Exception) {
                android.util.Log.e("DashboardViewModel", "Failed to init Chapa: ${e.message}")
                onResult(null, e.message ?: "Network error. Please try again.")
            }
        }
    }

    fun triggerOnDemandInference(fcmToken: String?, onResult: (InferenceResultDto) -> Unit) {
        val token = authToken ?: return
        viewModelScope.launch {
            try {
                val response = RetrofitClient.api.runInference(token, InferenceRequestPayload(fcmToken))
                onResult(response.inference)
                fetchDashboardData() // Refresh analytics
            } catch (e: Exception) {
                android.util.Log.e("DashboardViewModel", "AI inference trigger failed: ${e.message}")
            }
        }
    }
}
