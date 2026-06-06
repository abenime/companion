package com.wellness.companion.ui.views

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wellness.companion.ui.viewmodel.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    viewModel: DashboardViewModel,
    onOpenSettings: () -> Unit,
    onOpenSubscription: () -> Unit
) {
    val user = viewModel.authUser

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
            // Demographic Profile Header Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .background(MaterialTheme.colorScheme.primary, shape = CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = user?.name?.substring(0, 1)?.uppercase() ?: "U",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 32.sp
                            )
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = user?.name ?: "Jane Doe",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleLarge
                            )
                            Text(
                                text = user?.email ?: "jane@example.com",
                                color = Color.Gray,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }

            // Demographics details section
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            "PERSONAL METADATA",
                            fontWeight = FontWeight.Bold,
                            color = Color.Gray,
                            style = MaterialTheme.typography.labelMedium
                        )
                        
                        user?.profile?.let { prof ->
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Age", fontWeight = FontWeight.Medium)
                                Text("${prof.age}", color = Color.Gray)
                            }
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Gender", fontWeight = FontWeight.Medium)
                                Text(prof.gender, color = Color.Gray)
                            }
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Employment Status", fontWeight = FontWeight.Medium)
                                Text(prof.work_status, color = Color.Gray)
                            }
                        } ?: run {
                            Text("No metadata profile details found.", color = Color.Gray)
                        }
                    }
                }
            }

            // Theme and app settings shortcut section
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
                            "PREFERENCES",
                            fontWeight = FontWeight.Bold,
                            color = Color.Gray,
                            style = MaterialTheme.typography.labelMedium
                        )
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

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

                        Button(
                            onClick = onOpenSubscription,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primaryContainer, contentColor = MaterialTheme.colorScheme.onPrimaryContainer)
                        ) {
                            Icon(imageVector = Icons.Default.Star, contentDescription = "Subscription Icon")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Upgrade & Subscriptions")
                        }

                        Button(
                            onClick = onOpenSettings,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer, contentColor = MaterialTheme.colorScheme.onSecondaryContainer)
                        ) {
                            Icon(imageVector = Icons.Default.Settings, contentDescription = "Settings Icon")
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Open Privacy & Data Settings")
                        }
                    }
                }
            }
        }

        PullToRefreshContainer(
            state = pullToRefreshState,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }
}

@Composable
fun SideNavigationDrawerContent(viewModel: DashboardViewModel, onClose: () -> Unit) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val user = viewModel.authUser
    
    Box(
        modifier = Modifier
            .fillMaxHeight()
            .width(280.dp)
            .background(MaterialTheme.colorScheme.surface)
            .padding(vertical = 16.dp, horizontal = 20.dp)
    ) {
        // Theme switch icon button at the absolute top-right corner of the drawer
        val isDark = viewModel.isDarkTheme
        IconButton(
            onClick = { viewModel.toggleTheme() },
            modifier = Modifier.align(Alignment.TopEnd)
        ) {
            Icon(
                imageVector = if (isDark) Icons.Rounded.WbSunny else Icons.Rounded.NightsStay,
                contentDescription = "Toggle Theme",
                tint = if (isDark) Color(0xFFFFD700) else MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )
        }

        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Profile Area at the top, horizontally centered
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Bigger circle horizontally centered
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .background(MaterialTheme.colorScheme.primary, shape = CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = user?.name?.substring(0, 1)?.uppercase() ?: "U",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 36.sp
                    )
                }

                // Name and email centered
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = user?.name ?: "Jane Doe",
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = user?.email ?: "jane@example.com",
                        color = Color.Gray,
                        fontSize = 14.sp,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }

                // Subscription status tag (Free Trial or Premium)
                val sub = viewModel.subscriptionState
                val isPremium = sub?.plan_name?.lowercase()?.contains("premium") == true || sub?.plan_slug?.lowercase()?.contains("premium") == true
                
                Surface(
                    shape = CircleShape,
                    color = if (isPremium) Color(0xFFFFD700).copy(alpha = 0.15f) else MaterialTheme.colorScheme.primaryContainer,
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp, 
                        if (isPremium) Color(0xFFFFD700) else MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
                    ),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Text(
                        text = if (isPremium) "PREMIUM" else "FREE TRIAL",
                        color = if (isPremium) Color(0xFFD4AF37) else MaterialTheme.colorScheme.onPrimaryContainer,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                    )
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            // Bio-Telemetry and metrics sections to make the drawer less empty and rich
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = "DAILY INSIGHTS",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.Gray
                )

                when (val scores = viewModel.scoresState) {
                    is ScoresUiState.Success -> {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            // Focus Score
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Rounded.CenterFocusStrong,
                                        contentDescription = "Focus",
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text("Focus Score", fontSize = 14.sp, modifier = Modifier.padding(start = 8.dp))
                                }
                                Text("${scores.scores.focus_score}%", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                            
                            // Energy Score
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Rounded.Bolt,
                                        contentDescription = "Energy",
                                        tint = Color(0xFFFFB300),
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text("Energy Score", fontSize = 14.sp, modifier = Modifier.padding(start = 8.dp))
                                }
                                Text("${scores.scores.energy_score}%", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }

                            // Stress Score
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Rounded.Spa,
                                        contentDescription = "Stress",
                                        tint = Color(0xFFE53935),
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text("Stress Score", fontSize = 14.sp, modifier = Modifier.padding(start = 8.dp))
                                }
                                Text("${scores.scores.stress_score}%", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                        }
                    }
                    else -> {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Rounded.Favorite,
                                    contentDescription = "Wellness",
                                    tint = Color.Red,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text("Wellness Companion", fontSize = 14.sp, modifier = Modifier.padding(start = 8.dp))
                            }
                            Text("Active", color = Color(0xFF4CAF50), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            // Dynamic links to dashboard tabs
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "QUICK NAVIGATION",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.Gray
                )
                
                Surface(
                    onClick = { onClose() },
                    shape = MaterialTheme.shapes.medium,
                    color = Color.Transparent,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Home, 
                            contentDescription = "Dashboard", 
                            modifier = Modifier.size(20.dp), 
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text("Dashboard Home", modifier = Modifier.padding(start = 12.dp), style = MaterialTheme.typography.bodyMedium)
                    }
                }

                Surface(
                    onClick = { onClose() },
                    shape = MaterialTheme.shapes.medium,
                    color = Color.Transparent,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Analytics, 
                            contentDescription = "Analytics", 
                            modifier = Modifier.size(20.dp), 
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text("Biometric Forecasting", modifier = Modifier.padding(start = 12.dp), style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Logout button positioned beautifully at the very bottom
            Button(
                onClick = {
                    onClose()
                    viewModel.logoutUser(context)
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Icon(
                    imageVector = Icons.Rounded.Logout,
                    contentDescription = "Logout Icon",
                    tint = Color.White,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Log Out", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}
