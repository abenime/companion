package com.wellness.companion.ui.views

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.wellness.companion.ui.viewmodel.*

@Composable
fun WellnessOrbitScreen(viewModel: DashboardViewModel, onLaunchIntervention: () -> Unit) {
    val state = viewModel.scoresState
    val infiniteTransition = rememberInfiniteTransition()

    // Smooth breathing transition scale (inhale/exhale pulsing effect)
    val scale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = EaseInOutCirc),
            repeatMode = RepeatMode.Reverse
        )
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        item {
            Text("THE WELLNESS ORBIT", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        // concentric circular ring graphic
        item {
            Box(
                modifier = Modifier
                    .size(220.dp)
                    .graphicsLayer(scaleX = scale, scaleY = scale),
                contentAlignment = Alignment.Center
            ) {
                // Focus Circle (Outer)
                Canvas(modifier = Modifier.size(190.dp)) {
                    drawCircle(color = Color(0xFF8E9F8E), style = Stroke(width = 6.dp.toPx()), alpha = 0.3f)
                }
                // Sleep Circle (Middle)
                Canvas(modifier = Modifier.size(140.dp)) {
                    drawCircle(color = Color(0xFF8E9F8E), style = Stroke(width = 4.dp.toPx()), alpha = 0.5f)
                }
                // Heart Circle (Inner core)
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f), shape = CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Favorite,
                        contentDescription = "Focus Heart Core",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
        }

        item {
            Text("Your cognitive load is steady", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
        }

        // Render aggregated score blocks
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Energy Score", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        Text(
                            text = when (state) {
                                is ScoresUiState.Success -> "${state.scores.energy_score}"
                                else -> "85"
                            },
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Focus Score", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        Text(
                            text = when (state) {
                                is ScoresUiState.Success -> "${state.scores.focus_score}"
                                else -> "90"
                            },
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Proactive Intervention Action Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("RECOMMENDED ACTION", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color.Gray)
                    Text("Context-switching has been elevated over the last 45 minutes on your workstation. Take a 60-second breathing break to restore focus?", style = MaterialTheme.typography.bodyMedium)
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onLaunchIntervention,
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            modifier = Modifier.weight(1.5f)
                        ) {
                            Text("Start Now", color = Color.White)
                        }
                        OutlinedButton(
                            onClick = { /* Dismiss */ },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Dismiss")
                        }
                    }
                }
            }
        }
    }
}
