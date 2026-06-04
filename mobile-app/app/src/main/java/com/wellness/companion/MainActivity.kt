package com.wellness.companion

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.wellness.companion.telemetry.TelemetryService
import com.wellness.companion.ui.viewmodel.DashboardViewModel
import com.wellness.companion.ui.views.MainNavigationContainer

class MainActivity : ComponentActivity() {

    private val viewModel: DashboardViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Passively spawn persistent foreground service loop
        startTelemetryService()

        setContent {
            // Apply dynamic consistent theme based on client-side state
            val colors = if (viewModel.isDarkTheme) {
                androidx.compose.material3.darkColorScheme(
                    background = androidx.compose.ui.graphics.Color(0xFF12161A),
                    surface = androidx.compose.ui.graphics.Color(0xFF1C2229),
                    primary = androidx.compose.ui.graphics.Color(0xFF8E9F8E)
                )
            } else {
                androidx.compose.material3.lightColorScheme(
                    background = androidx.compose.ui.graphics.Color(0xFFF4F6F4),
                    surface = androidx.compose.ui.graphics.Color(0xFFE5EAE5),
                    primary = androidx.compose.ui.graphics.Color(0xFF3B533B)
                )
            }

            MaterialTheme(colorScheme = colors) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainNavigationContainer(viewModel = viewModel)
                }
            }
        }
    }

    private fun startTelemetryService() {
        val intent = Intent(this, TelemetryService::class.java)
        startForegroundService(intent)
    }
}
