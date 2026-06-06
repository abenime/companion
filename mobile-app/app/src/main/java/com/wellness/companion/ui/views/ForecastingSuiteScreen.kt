package com.wellness.companion.ui.views

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.wellness.companion.ui.viewmodel.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ForecastingSuiteScreen(viewModel: DashboardViewModel, onNavigateToChat: () -> Unit) {
    val state = viewModel.timelineState
    var isDesktopExpanded by remember { mutableStateOf(false) }
    var isMobileExpanded by remember { mutableStateOf(false) }
    var isWearableExpanded by remember { mutableStateOf(false) }

    val pullToRefreshState = rememberPullToRefreshState()
    if (pullToRefreshState.isRefreshing) {
        LaunchedEffect(true) {
            viewModel.fetchDashboardData()
        }
    }

    LaunchedEffect(viewModel.isRefreshing) {
        if (viewModel.isRefreshing) {
            pullToRefreshState.startRefresh()
        } else {
            pullToRefreshState.endRefresh()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(pullToRefreshState.nestedScrollConnection)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item {
                Text("PREDICTIVE FORECASTS", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }

            // Render Bezier Line Chart representation using Compose Canvas drawing
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Box(modifier = Modifier.padding(16.dp)) {
                        Text("7-Day Burnout Risk Projection", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        
                        Canvas(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(top = 24.dp)
                        ) {
                            // Draw mock Bezier path representing rolling risk scores
                            val stroke = Stroke(width = 3.dp.toPx())
                            val graphColor = Color(0xFFD17E73) // Soft terracotta warning alert color
                            
                            drawLine(color = Color.LightGray, start = androidx.compose.ui.geometry.Offset(0f, size.height), end = androidx.compose.ui.geometry.Offset(size.width, size.height))
                            
                            // Draw Bezier curves (simulation)
                            drawCircle(color = graphColor, radius = 5.dp.toPx(), center = androidx.compose.ui.geometry.Offset(size.width * 0.1f, size.height * 0.8f))
                            drawCircle(color = graphColor, radius = 5.dp.toPx(), center = androidx.compose.ui.geometry.Offset(size.width * 0.3f, size.height * 0.75f))
                            drawCircle(color = graphColor, radius = 5.dp.toPx(), center = androidx.compose.ui.geometry.Offset(size.width * 0.5f, size.height * 0.4f))
                            drawCircle(color = graphColor, radius = 5.dp.toPx(), center = androidx.compose.ui.geometry.Offset(size.width * 0.7f, size.height * 0.3f))
                            drawCircle(color = graphColor, radius = 5.dp.toPx(), center = androidx.compose.ui.geometry.Offset(size.width * 0.9f, size.height * 0.15f))
                        }
                    }
                }
            }

            // Real Passive Telemetry Deltas Section
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            "PASSIVE TELEMETRY DELTAS",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.Gray
                        )
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                        val scores = (viewModel.scoresState as? ScoresUiState.Success)?.scores
                        val deltas = listOf(
                            Triple("Sleep Deficit", "${scores?.sleep_deficit_percent ?: -37.5}%", (scores?.sleep_deficit_percent ?: -37.5) < 0),
                            Triple("Screen Time Delta", "${scores?.screen_time_delta_percent ?: +45.2}%", (scores?.screen_time_delta_percent ?: +45.2) > 0),
                            Triple("Steps Deficit", "${scores?.step_deficit_percent ?: -22.4}%", (scores?.step_deficit_percent ?: -22.4) < 0),
                            Triple("Context Switching", "${scores?.context_switch_density ?: 30} / hr", true)
                        )

                        deltas.forEach { (title, value, isWarning) ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(title, fontWeight = FontWeight.Medium, style = MaterialTheme.typography.bodySmall)
                                Text(
                                    text = value,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isWarning && title != "Context Switching") Color(0xFFD17E73) else MaterialTheme.colorScheme.primary,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }
            }

            // Clickable Collapsible Sub-Device Telemetry Reports
            item {
                Text("SUB-DEVICE DIAGNOSTIC BUNCH", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { isDesktopExpanded = !isDesktopExpanded }
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("🖥️  DESKTOP AGENT TELEMETRY", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                            Text(if (isDesktopExpanded) "Collapse ▲" else "Expand ▼", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        }

                        if (isDesktopExpanded) {
                            Spacer(modifier = Modifier.height(12.dp))
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                            Spacer(modifier = Modifier.height(12.dp))
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("•  Ingestion State: HEALTHY (Sync complete)", style = MaterialTheme.typography.bodySmall)
                                Text("•  Task Switching Cadence: 30 context swaps / hr (Elevated)", style = MaterialTheme.typography.bodySmall)
                                Text("•  Keystroke Timing Latency: +15% latency variance detected", style = MaterialTheme.typography.bodySmall)
                                Text("•  Active IDE: VS Code (2.5 hrs active focus)", style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { isMobileExpanded = !isMobileExpanded }
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("📱  MOBILE TELEMETRY REPORT", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                            Text(if (isMobileExpanded) "Collapse ▲" else "Expand ▼", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        }

                        if (isMobileExpanded) {
                            Spacer(modifier = Modifier.height(12.dp))
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                            Spacer(modifier = Modifier.height(12.dp))
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("•  Screen Lock Unlocks: 45 unlocks today", style = MaterialTheme.typography.bodySmall)
                                Text("•  Total Mobile Screen Time: 5.2 hrs active", style = MaterialTheme.typography.bodySmall)
                                Text("•  Social Media Screen Time: 1.5 hrs (Instagram/Twitter)", style = MaterialTheme.typography.bodySmall)
                                Text("•  Usage Spike: +45.2% delta vs 7-day baseline (Warning)", style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { isWearableExpanded = !isWearableExpanded }
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("⌚  WEARABLE HEALTH CONNECT SYNC", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                            Text(if (isWearableExpanded) "Collapse ▲" else "Expand ▼", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        }

                        if (isWearableExpanded) {
                            Spacer(modifier = Modifier.height(12.dp))
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                            Spacer(modifier = Modifier.height(12.dp))
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("•  Google Health Connect Sync: AUTHORIZED", style = MaterialTheme.typography.bodySmall)
                                Text("•  Steps Logged: 3,500 / 8,000 steps baseline (-22.4% Deficit)", style = MaterialTheme.typography.bodySmall)
                                Text("•  Sleep Record Duration: 5.0 hrs total (-37.5% Deficit)", style = MaterialTheme.typography.bodySmall)
                                Text("•  Average Heart Rate: 72 bpm (Resting)", style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }

            item {
                Text("COGNITIVE CORRELATION FEED", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }

            // Explainable telemetry outputs
            item {
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Info, contentDescription = "Insight Icon", tint = MaterialTheme.colorScheme.primary)
                            Text("Typing Cadence", fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 8.dp))
                        }
                        Text("Your motor keystroke speed exhibits a 15% latency increase following days with sleep deficits greater than 25%. Rest blocks on these days limit overload by 40%.", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            item {
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Info, contentDescription = "Insight Icon", tint = MaterialTheme.colorScheme.primary)
                            Text("Screen Time Offset", fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 8.dp))
                        }
                        Text("Sustained social app scrolling late at night directly correlates with poorer sleep records (+1.5h sleep deficit) on the following day.", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            item {
                Button(
                    onClick = onNavigateToChat,
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                ) {
                    Icon(imageVector = Icons.Default.Send, contentDescription = "Chat Icon", tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Ask Companion AI", color = Color.White)
                }
            }
        }

        PullToRefreshContainer(
            state = pullToRefreshState,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }
}
