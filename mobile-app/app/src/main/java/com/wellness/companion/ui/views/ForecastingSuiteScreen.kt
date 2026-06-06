package com.wellness.companion.ui.views

import androidx.compose.foundation.Canvas
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
