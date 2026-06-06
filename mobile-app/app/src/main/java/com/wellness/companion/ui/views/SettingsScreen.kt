package com.wellness.companion.ui.views

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wellness.companion.ui.viewmodel.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(viewModel: DashboardViewModel, onBack: (() -> Unit)? = null) {
    val context = LocalContext.current
    var newIgnoredApp by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        if (onBack != null) {
            item {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                ) {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Go Back")
                    }
                    Text(
                        "SETTINGS",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }
            }
        }

        item {
            Text("TRANSPARENCY & PRIVACY CENTER", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        item {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("TELEMETRY CONTROLS", fontWeight = FontWeight.Bold, color = Color.Gray)
                    
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Keyboard Cadence Latencies")
                        Switch(checked = viewModel.keyboardToggle, onCheckedChange = { viewModel.setKeyboardTracking(context, it) })
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Active Window App Tracking")
                        Switch(checked = viewModel.activeAppToggle, onCheckedChange = { viewModel.setActiveAppTracking(context, it) })
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Wearable Health Connect Sync")
                        Switch(checked = viewModel.sleepToggle, onCheckedChange = { viewModel.setWearableSync(context, it) })
                    }
                }
            }
        }

        // Ignored Apps Registry (Sensitive Skip List) UI Section
        item {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("IGNORED SENSITIVE APPLICATIONS", fontWeight = FontWeight.Bold, color = Color.Gray)
                    Text("Define package names that are skipped from telemetry tracking (e.g. password managers or banking apps).", style = MaterialTheme.typography.bodySmall, color = Color.Gray)

                    // Add Ignored App Input Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = newIgnoredApp,
                            onValueChange = { newIgnoredApp = it },
                            placeholder = { Text("e.g. com.bitwarden.android", fontSize = 12.sp) },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        Button(
                            onClick = {
                                if (newIgnoredApp.trim().isNotEmpty()) {
                                    viewModel.addIgnoredApp(context, newIgnoredApp.trim())
                                    newIgnoredApp = ""
                                }
                            }
                        ) {
                            Text("Add")
                        }
                    }

                    // Ignored Apps list
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        viewModel.ignoredApps.forEach { pkg ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(MaterialTheme.colorScheme.background, shape = RoundedCornerShape(8.dp))
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = pkg, style = MaterialTheme.typography.bodySmall)
                                IconButton(
                                    onClick = { viewModel.removeIgnoredApp(context, pkg) },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete Icon", tint = Color.Gray, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }
            }
        }

        item {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("DATA RETENTION CONTROL", fontWeight = FontWeight.Bold, color = Color.Gray)
                    Button(
                        onClick = {
                            viewModel.deleteTodayLogs(context) {
                                Toast.makeText(context, "Today's logs cleared successfully", Toast.LENGTH_SHORT).show()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD17E73).copy(alpha = 0.15f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Delete Today's Logs", color = Color(0xFFD17E73))
                    }
                    Button(
                        onClick = {
                            viewModel.purgeAllTelemetry(context) {
                                Toast.makeText(context, "All telemetry permanently purged", Toast.LENGTH_SHORT).show()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD17E73)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Purge All Telemetry", color = Color.White)
                    }
                }
            }
        }
    }
}
