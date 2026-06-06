package com.wellness.companion.ui.views

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.wellness.companion.data.remote.*
import com.wellness.companion.ui.viewmodel.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingWizard(viewModel: DashboardViewModel) {
    val context = androidx.compose.ui.platform.LocalContext.current
    var step by remember { mutableStateOf(1) }
    var isLoginMode by remember { mutableStateOf(false) }

    // Custom Error and Success Modals State
    var errorMessageToShow by remember { mutableStateOf<String?>(null) }
    var successMessageToShow by remember { mutableStateOf<String?>(null) }

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

    // Monitor onboarding state changes for modals trigger
    val onboardingState = viewModel.onboardingState
    LaunchedEffect(onboardingState) {
        when (onboardingState) {
            is OnboardingUiState.Error -> {
                errorMessageToShow = onboardingState.message
            }
            is OnboardingUiState.Success -> {
                successMessageToShow = "Account authenticated successfully! Welcome aboard."
            }
            else -> {}
        }
    }

    if (errorMessageToShow != null) {
        AlertDialog(
            onDismissRequest = { errorMessageToShow = null },
            icon = {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = "Error Icon",
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(40.dp)
                )
            },
            title = {
                Text(
                    text = "Authentication Issue",
                    fontWeight = FontWeight.Black,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.error
                )
            },
            text = {
                Text(
                    text = errorMessageToShow!!,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = { errorMessageToShow = null },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Understood", color = Color.White)
                }
            },
            shape = RoundedCornerShape(16.dp),
            containerColor = MaterialTheme.colorScheme.surface
        )
    }

    if (successMessageToShow != null) {
        AlertDialog(
            onDismissRequest = { successMessageToShow = null },
            icon = {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Success Icon",
                    tint = Color(0xFF4CAF50),
                    modifier = Modifier.size(40.dp)
                )
            },
            title = {
                Text(
                    text = "Welcome to Companion",
                    fontWeight = FontWeight.Black,
                    style = MaterialTheme.typography.titleMedium
                )
            },
            text = {
                Text(
                    text = successMessageToShow!!,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = { successMessageToShow = null }
                ) {
                    Text("Get Started")
                }
            },
            shape = RoundedCornerShape(16.dp),
            containerColor = MaterialTheme.colorScheme.surface
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("COMPANION", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            
            if (isLoginMode) {
                Text("Log In to Your Account", style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
            } else {
                Text("Step $step of 3", style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
            }

            Spacer(modifier = Modifier.height(8.dp))

            if (isLoginMode) {
                Text("Welcome Back", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email Address") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(16.dp))

                if (onboardingState is OnboardingUiState.Loading) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                } else {
                    Button(
                        onClick = {
                            if (email.isNotEmpty() && password.isNotEmpty()) {
                                viewModel.loginUser(context, LoginPayload(email, password))
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Log In")
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Don't have an account? Sign Up",
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .clickable { isLoginMode = false }
                        .padding(8.dp)
                )
            } else {
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
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Already have an account? Log In",
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier
                                .clickable { isLoginMode = true }
                                .padding(8.dp)
                        )
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
                        
                        if (onboardingState is OnboardingUiState.Loading) {
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
                                    viewModel.registerUser(context, payload)
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
}