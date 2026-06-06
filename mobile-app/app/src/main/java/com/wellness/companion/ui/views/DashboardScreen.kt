package com.wellness.companion.ui.views

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
    var isViewingNotifications by remember { mutableStateOf(false) }
    var isViewingSettings by remember { mutableStateOf(false) }

    if (viewModel.authUser == null) {
        OnboardingWizard(viewModel = viewModel)
        return
    }

    if (viewModel.activeIntervention != null) {
        BreathingSessionScreen(
            onSessionComplete = { viewModel.activeIntervention = null }
        )
        return
    }

    if (isViewingNotifications) {
        NotificationsScreen(
            viewModel = viewModel,
            onBack = { isViewingNotifications = false }
        )
        return
    }

    if (isViewingSettings) {
        SettingsScreen(
            viewModel = viewModel,
            onBack = { isViewingSettings = false }
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
                val unreadCount = viewModel.notifications.count { !it.isRead }
                CenterAlignedTopAppBar(
                    title = {
                        val titleText = when (currentTab) {
                            "home" -> "DASHBOARD"
                            "analytics" -> "ANALYTICS"
                            "chat" -> "AI COMPANION"
                            "profile" -> "USER PROFILE"
                            else -> "COMPANION"
                        }
                        Text(titleText, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.primary)
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(imageVector = Icons.Default.Menu, contentDescription = "Drawer Menu")
                        }
                    },
                    actions = {
                        if (currentTab == "profile") {
                            IconButton(onClick = { isViewingSettings = true }) {
                                Icon(imageVector = Icons.Default.Settings, contentDescription = "Open Settings")
                            }
                        } else {
                            IconButton(onClick = { isViewingNotifications = true }) {
                                BadgedBox(
                                    badge = {
                                        if (unreadCount > 0) {
                                            Badge { Text(unreadCount.toString()) }
                                        }
                                    }
                                ) {
                                    Icon(imageVector = Icons.Default.Notifications, contentDescription = "View Notifications")
                                }
                            }
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
                        selected = currentTab == "chat",
                        onClick = { currentTab = "chat" },
                        icon = { Icon(Icons.Default.Send, contentDescription = "Chat") },
                        label = { Text("Chat") }
                    )
                    NavigationBarItem(
                        selected = currentTab == "profile",
                        onClick = { currentTab = "profile" },
                        icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                        label = { Text("Profile") }
                    )
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                AnimatedContent(
                    targetState = currentTab,
                    transitionSpec = {
                        // Dynamic sliding directions depending on tab flow
                        val direction = if (targetState == "home" || (targetState == "analytics" && initialState != "home") || (targetState == "chat" && initialState == "profile")) {
                            AnimatedContentTransitionScope.SlideDirection.Left
                        } else {
                            AnimatedContentTransitionScope.SlideDirection.Right
                        }
                        slideIntoContainer(direction, tween(300)) + fadeIn(tween(300)) togetherWith
                        slideOutOfContainer(direction, tween(300)) + fadeOut(tween(300))
                    },
                    label = "TabTransition"
                ) { tab ->
                    when (tab) {
                        "home" -> WellnessOrbitScreen(viewModel = viewModel, onLaunchIntervention = { viewModel.activeIntervention = "breathing" })
                        "analytics" -> ForecastingSuiteScreen(viewModel = viewModel, onNavigateToChat = { currentTab = "chat" })
                        "chat" -> ChatCompanionOverlay(viewModel = viewModel, onDismiss = { currentTab = "home" })
                        "profile" -> ProfileScreen(viewModel = viewModel, onOpenSettings = { isViewingSettings = true })
                    }
                }
            }
        }
    }
}
