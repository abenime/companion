package com.wellness.companion.ui.views

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun BreathingSessionScreen(onSessionComplete: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition()
    
    val scale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.6f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = EaseInOutCubic),
            repeatMode = RepeatMode.Reverse
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF12161A)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(32.dp)
        ) {
            Text(
                text = if (scale > 1.3f) "Exhale slowly through the mouth..." else "Inhale deeply through the nose...",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFD9B48F),
                modifier = Modifier.padding(horizontal = 24.dp)
            )

            // Pulsing meditation ring
            Box(
                modifier = Modifier
                    .size(180.dp)
                    .graphicsLayer(scaleX = scale, scaleY = scale)
                    .background(Color(0xFF8E9F8E), shape = CircleShape)
                    .alpha(0.45f)
            )

            Button(
                onClick = onSessionComplete,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1C2229))
            ) {
                Text("Exit Session", color = Color.White)
            }
        }
    }
}
