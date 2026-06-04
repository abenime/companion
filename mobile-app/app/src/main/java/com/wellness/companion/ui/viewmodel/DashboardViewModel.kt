package com.wellness.companion.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wellness.companion.data.remote.*
import kotlinx.coroutines.launch

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

    // 3. Dual Theme Client-side Settings (handled strictly on-device)
    var isDarkTheme by mutableStateOf(true)
        private set

    fun toggleTheme() {
        isDarkTheme = !isDarkTheme
    }

    // 4. Authentication Procedures
    fun registerUser(payload: SignupPayload) {
        viewModelScope.launch {
            onboardingState = OnboardingUiState.Loading
            try {
                val response = RetrofitClient.api.register(payload)
                authToken = "Bearer ${response.token}"
                authUser = response.user
                onboardingState = OnboardingUiState.Success(response.user)
                fetchDashboardData()
            } catch (e: Exception) {
                onboardingState = OnboardingUiState.Error(e.message ?: "Registration failed")
            }
        }
    }

    fun loginUser(payload: LoginPayload) {
        viewModelScope.launch {
            onboardingState = OnboardingUiState.Loading
            try {
                val response = RetrofitClient.api.login(payload)
                authToken = "Bearer ${response.token}"
                authUser = response.user
                onboardingState = OnboardingUiState.Success(response.user)
                fetchDashboardData()
            } catch (e: Exception) {
                onboardingState = OnboardingUiState.Error(e.message ?: "Authentication failed")
            }
        }
    }

    // 5. Remote Syncing and Aggregates
    fun fetchDashboardData() {
        val token = authToken ?: return
        viewModelScope.launch {
            scoresState = ScoresUiState.Loading
            timelineState = TimelineUiState.Loading
            try {
                // Read scores for today (simplified string routing)
                val scores = RetrofitClient.api.getDailyScores(token, "2026-06-05")
                scoresState = ScoresUiState.Success(scores)

                // Read 14-day risk timelines
                val timeline = RetrofitClient.api.getPredictionsTimeline(token)
                timelineState = TimelineUiState.Success(timeline.timeline)
            } catch (e: Exception) {
                scoresState = ScoresUiState.Error(e.message ?: "Failed to read telemetry scores")
                timelineState = TimelineUiState.Error(e.message ?: "Failed to read timelines")
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
                console.error("AI inference trigger failed:", e.message)
            }
        }
    }
}
