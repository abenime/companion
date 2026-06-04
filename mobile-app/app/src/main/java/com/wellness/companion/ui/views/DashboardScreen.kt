package com.wellness.companion.ui.views

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wellness.companion.data.remote.*
import com.wellness.companion.ui.viewmodel.*
import kotlinx.coroutines.launch

// -----------------------------------------------------------------
// 1. MAIN NAVIGATION CONTAINER (DRAWER + BOTTOM TABS)
// -----------------------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainNavigationContainer(viewModel: DashboardViewModel) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var currentTab by remember { mutableStateOf("home") }
    var activeInterventionSession by remember { mutableStateOf<String?>(null) }

    if (viewModel.authUser == null) {
        OnboardingWizard(viewModel = viewModel)
        return
    }

    if (activeInterventionSession != null) {
        BreathingSessionScreen(
            onSessionComplete = { activeInterventionSession = null }
        )
        return
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            SideNavigationDrawerContent(
                viewModel = viewModel,
                onClose = { scope.launch { drawerState.close() } }
            )
        }
    ) {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("COMPANION", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.primary) },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(imageVector = Icons.Default.Menu, contentDescription = "Drawer Menu")
                        }
                    },
                    actions = {
                        IconButton(onClick = { viewModel.fetchDashboardData() }) {
                            Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh Telemetry")
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background
                    )
                )
            },
            bottomBar = {
                NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                    NavigationBarItem(
                        selected = currentTab == "home",
                        onClick = { currentTab = "home" },
                        icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                        label = { Text("Home") }
                    )
                    NavigationBarItem(
                        selected = currentTab == "analytics",
                        onClick = { currentTab = "analytics" },
                        icon = { Icon(Icons.Default.List, contentDescription = "Analytics") },
                        label = { Text("Analytics") }
                    )
                    NavigationBarItem(
                        selected = currentTab == "settings",
                        onClick = { currentTab = "settings" },
                        icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                        label = { Text("Settings") }
                    )
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (currentTab) {
                    "home" -> WellnessOrbitScreen(viewModel = viewModel, onLaunchIntervention = { activeInterventionSession = "breathing" })
                    "analytics" -> ForecastingSuiteScreen(viewModel = viewModel)
                    "settings" -> SettingsScreen(viewModel = viewModel)
                }
            }
        }
    }
}

// -----------------------------------------------------------------
// 2. ONBOARDING & SIGNUP MULTI-STEP WIZARD
// -----------------------------------------------------------------
@Composable
fun OnboardingWizard(viewModel: DashboardViewModel) {
    var step by remember { mutableStateOf(1) }

    // Account inputs
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    // Demographics inputs
    var ageStr by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("Female") }
    var workStatus by remember { mutableStateOf("Full-time") }

    // Connections inputs
    var calendarEnabled by remember { mutableStateOf(false) }
    var externalEnabled by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("COMPANION", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Text("Step $step of 3", style = MaterialTheme.typography.bodyMedium, color = Color.Gray)

            Spacer(modifier = Modifier.height(8.dp))

            when (step) {
                1 -> {
                    Text("Create Account", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Full Name") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email Address") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { if (name.isNotEmpty() && email.isNotEmpty() && password.isNotEmpty()) step = 2 },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Next Step")
                    }
                }
                2 -> {
                    Text("Basic Demographics", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    OutlinedTextField(value = ageStr, onValueChange = { ageStr = it }, label = { Text("Age") }, modifier = Modifier.fillMaxWidth())
                    
                    // Gender Selector Row
                    Text("Gender", fontWeight = FontWeight.Medium, modifier = Modifier.align(Alignment.Start))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("Female", "Male", "Other").forEach { g ->
                            FilterChip(
                                selected = gender == g,
                                onClick = { gender = g },
                                label = { Text(g) }
                            )
                        }
                    }

                    // Work Status Selector Row
                    Text("Work Status", fontWeight = FontWeight.Medium, modifier = Modifier.align(Alignment.Start))
                    LazyColumn(modifier = Modifier.height(100.dp)) {
                        items(listOf("Full-time", "Freelancer", "Student", "Unemployed")) { status ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { workStatus = status }
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(selected = workStatus == status, onClick = { workStatus = status })
                                Text(status, modifier = Modifier.padding(start = 8.dp))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(onClick = { step = 1 }, modifier = Modifier.weight(1f)) { Text("Back") }
                        Button(onClick = { if (ageStr.isNotEmpty()) step = 3 }, modifier = Modifier.weight(1f)) { Text("Next") }
                    }
                }
                3 -> {
                    Text("Passive Telemetry Sync", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Checkbox(checked = calendarEnabled, onCheckedChange = { calendarEnabled = it })
                        Text("Enable Google Calendar Sync", modifier = Modifier.padding(start = 8.dp))
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Checkbox(checked = externalEnabled, onCheckedChange = { externalEnabled = it })
                        Text("Authorize Health Connect sync", modifier = Modifier.padding(start = 8.dp))
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                    
                    if (viewModel.onboardingState is OnboardingUiState.Loading) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    } else {
                        Button(
                            onClick = {
                                val payload = SignupPayload(
                                    name = name,
                                    email = email,
                                    password = password,
                                    profile = DemographicProfile(ageStr.toIntOrNull() ?: 25, gender, workStatus),
                                    connections = ConnectionsPayload(calendarEnabled, externalEnabled)
                                )
                                viewModel.registerUser(payload)
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Complete Registration")
                        }
                    }
                }
            }
        }
    }
}

// -----------------------------------------------------------------
// 3. HOME SCREEN (WELLNESS ORBIT WITH PULSING RING)
// -----------------------------------------------------------------
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

// -----------------------------------------------------------------
// 4. ANALYTICS & TIMELINE FORECASTING SUITE SCREEN
// -----------------------------------------------------------------
@Composable
fun ForecastingSuiteScreen(viewModel: DashboardViewModel) {
    val state = viewModel.timelineState

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
    }
}

// -----------------------------------------------------------------
// 5. SETTINGS SCREEN (TRANSPARENCY & CONNECTION CENTER)
// -----------------------------------------------------------------
@Composable
fun SettingsScreen(viewModel: DashboardViewModel) {
    var keyboardToggle by remember { mutableStateOf(true) }
    var activeAppToggle by remember { mutableStateOf(true) }
    var sleepToggle by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("TRANSPARENCY & PRIVACY CENTER", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }

        item {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("TELEMETRY CONTROLS", fontWeight = FontWeight.Bold, color = Color.Gray)
                    
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Keyboard Cadence Latencies")
                        Switch(checked = keyboardToggle, onCheckedChange = { keyboardToggle = it })
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Active Window App Tracking")
                        Switch(checked = activeAppToggle, onCheckedChange = { activeAppToggle = it })
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Wearable Health Connect Sync")
                        Switch(checked = sleepToggle, onCheckedChange = { sleepToggle = it })
                    }
                }
            }
        }

        item {
            Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("DATA RETENTION CONTROL", fontWeight = FontWeight.Bold, color = Color.Gray)
                    Button(onClick = { /* Delete today */ }, colors = ButtonDefaults.buttonColors(containerColor = Color("#D17E73").copy(alpha = 0.15f)), modifier = Modifier.fillMaxWidth()) {
                        Text("Delete Today's Logs", color = Color("#D17E73"))
                    }
                    Button(onClick = { /* Purge all */ }, colors = ButtonDefaults.buttonColors(containerColor = Color("#D17E73")), modifier = Modifier.fillMaxWidth()) {
                        Text("Purge All Telemetry", color = Color.White)
                    }
                }
            }
        }
    }
}

// -----------------------------------------------------------------
// 6. SIDE NAVIGATION DRAWER (USER PROFILE & CLIENT PREFERENCES)
// -----------------------------------------------------------------
@Composable
fun SideNavigationDrawerContent(viewModel: DashboardViewModel, onClose: () -> Unit) {
    val user = viewModel.authUser
    
    Column(
        modifier = Modifier
            .fillMaxHeight()
            .width(280.dp)
            .background(MaterialTheme.colorScheme.surface)
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Demographics Profile Header
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(MaterialTheme.colorScheme.primary, shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = user?.name?.substring(0, 1)?.uppercase() ?: "U",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp
                )
            }
            Text(user?.name ?: "Jane Doe", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(user?.email ?: "jane@example.com", color = Color.Gray, fontSize = 14.sp)
            
            Divider(modifier = Modifier.padding(vertical = 8.dp))

            // Nested Demographic Display
            user?.profile?.let { prof ->
                Text("Age: ${prof.age}", fontSize = 14.sp, fontWeight = FontWeight.Medium)
                Text("Status: ${prof.work_status}", fontSize = 14.sp, fontWeight = FontWeight.Medium)
            }
        }

        // Client-side Settings (Theme Toggle switch)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(imageVector = Icons.Default.FavoriteBorder, contentDescription = "Theme Icon")
                Text("Dark Mode Theme", modifier = Modifier.padding(start = 12.dp))
            }
            Switch(
                checked = viewModel.isDarkTheme,
                onCheckedChange = { viewModel.toggleTheme() }
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        OutlinedButton(
            onClick = {
                onClose()
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Close Menu")
        }
    }
}

// -----------------------------------------------------------------
// 7. BUILT-IN GUIDED MEDITATION OVERLAY SCREEN (PHYSIOLOGICAL SIGH)
// -----------------------------------------------------------------
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
