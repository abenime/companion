package com.wellness.companion.ui.views

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wellness.companion.ui.viewmodel.*

@Composable
fun ProfileScreen(viewModel: DashboardViewModel, onOpenSettings: () -> Unit) {
    val user = viewModel.authUser

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
}

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
            
            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

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
