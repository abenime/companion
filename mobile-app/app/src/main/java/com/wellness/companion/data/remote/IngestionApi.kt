package com.wellness.companion.data.remote

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PATCH
import retrofit2.http.DELETE
import retrofit2.http.Query

// Retrofit Endpoint Specifications
interface IngestionApi {

    @POST("api/v1/auth/register")
    suspend fun register(@Body payload: SignupPayload): RegisterResponse

    @POST("api/v1/auth/login")
    suspend fun login(@Body payload: LoginPayload): LoginResponse

    @POST("api/v1/signals/mobile")
    suspend fun syncMobileTelemetry(
        @Header("Authorization") token: String,
        @Body payload: MobileTelemetryPayload
    ): SimpleResponse

    @GET("api/v1/auth/connections")
    suspend fun getConnections(@Header("Authorization") token: String): ConnectionsPayload

    @PATCH("api/v1/auth/connections")
    suspend fun updateConnections(
        @Header("Authorization") token: String,
        @Body connections: ConnectionsPayload
    ): SimpleResponse

    @GET("api/v1/wellness/scores")
    suspend fun getDailyScores(
        @Header("Authorization") token: String,
        @Query("date") dateStr: String
    ): DailyScoresResponse

    @POST("api/v1/wellness/inference")
    suspend fun runInference(
        @Header("Authorization") token: String,
        @Body payload: InferenceRequestPayload
    ): InferenceResponse

    @GET("api/v1/wellness/predictions")
    suspend fun getPredictionsTimeline(
        @Header("Authorization") token: String
    ): TimelineResponse

    @DELETE("api/v1/wellness/logs/today")
    suspend fun deleteTodayLogs(
        @Header("Authorization") token: String
    ): SimpleResponse

    @DELETE("api/v1/wellness/logs/all")
    suspend fun purgeAllLogs(
        @Header("Authorization") token: String
    ): SimpleResponse
}

// Request & Response DTOs
data class DemographicProfile(
    val age: Int,
    val gender: String,
    val work_status: String
)

data class ConnectionsPayload(
    val calendar_sync_enabled: Boolean,
    val external_sync_enabled: Boolean
)

data class SignupPayload(
    val name: String,
    val email: String,
    val password: String,
    val profile: DemographicProfile,
    val connections: ConnectionsPayload
)

data class RegisterResponse(
    val token: String,
    val user: UserDto
)

data class LoginPayload(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user: UserDto
)

data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val profile: DemographicProfile,
    val connections: ConnectionsPayload
)

data class AppUsageDto(
    val package_name: String,
    val duration_seconds: Long,
    val category: String
)

data class MobileTelemetryPayload(
    val timestamp: Long,
    val screen_time_mins: Int,
    val unlock_count: Int,
    val steps: Int,
    val sleep_hours: Double,
    val heart_rate: Double,
    val app_usage: List<AppUsageDto>
)

data class SimpleResponse(
    val message: String
)

data class DailyScoresResponse(
    val id: String,
    val focus_score: Int,
    val energy_score: Int,
    val stress_score: Int,
    val sleep_deficit_percent: Double,
    val screen_time_delta_percent: Double,
    val context_switch_density: Double,
    val step_deficit_percent: Double,
    val measured_date: String
)

data class InferenceRequestPayload(
    val fcm_token: String?
)

data class InferenceResponse(
    val message: String,
    val inference: InferenceResultDto
)

data class InferenceResultDto(
    val wellness_state: String,
    val burnout_risk_score: Double,
    val explanation: String,
    val recommendations: List<String>,
    val confidence: Double,
    val date: String
)

data class TimelineItemDto(
    val date: String,
    val burnout_risk: Double,
    val state: String,
    val explanation: String,
    val recommendations: List<String>
)

data class TimelineResponse(
    val timeline: List<TimelineItemDto>
)
