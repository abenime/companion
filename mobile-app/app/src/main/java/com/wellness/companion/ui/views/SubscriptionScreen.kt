package com.wellness.companion.ui.views

import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.wellness.companion.ui.viewmodel.*

@Composable
fun SubscriptionScreen(viewModel: DashboardViewModel, onBack: (() -> Unit)? = null) {
    val sub = viewModel.subscriptionState
    var isUpgrading by remember { mutableStateOf(false) }
    var chapaCheckoutUrl by remember { mutableStateOf<String?>(null) }

    if (chapaCheckoutUrl != null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Header for WebView
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { chapaCheckoutUrl = null }) {
                    Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Cancel Checkout")
                }
                Text(
                    text = "SECURE UPGRADE CHECKOUT",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(start = 12.dp)
                )
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            // WebView container
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { context ->
                    WebView(context).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        webViewClient = object : WebViewClient() {
                            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                                val url = request.url.toString()
                                if (url.contains("/subscription/chapa/verify/")) {
                                    // Subscription verification URL reached!
                                    // Dismiss WebView and refresh status!
                                    chapaCheckoutUrl = null
                                    viewModel.fetchSubscription()
                                    return true
                                }
                                return false
                            }
                        }
                    }
                },
                update = { webView ->
                    webView.loadUrl(chapaCheckoutUrl!!)
                }
            )
        }
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .background(MaterialTheme.colorScheme.background)
    ) {
        if (onBack != null) {
            // Custom Top Bar with Back Button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Go Back", tint = MaterialTheme.colorScheme.primary)
                }
                Text(
                    text = "UPGRADES & PLANS",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(start = 12.dp)
                )
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Active plan status card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f), shape = CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = "Subscription Tier Icon",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(32.dp)
                            )
                        }

                        val daysRemaining = remember(sub) {
                            sub?.current_period_end?.let { dateStr ->
                                try {
                                    val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
                                    val expiry = sdf.parse(dateStr.substring(0, 10))
                                    val diff = (expiry?.time ?: 0L) - System.currentTimeMillis()
                                    maxOf(0, (diff / (1000 * 60 * 60 * 24)) + 1)
                                } catch (e: Exception) {
                                    0L
                                }
                            } ?: 0L
                        }

                        val statusLabel = remember(sub, daysRemaining) {
                            if (sub == null) "No Active Subscription"
                            else if (sub.plan_slug == "free") "Free Tier Access"
                            else if (daysRemaining <= 0) "Expired Plan"
                            else if (sub.status == "trialing") "Free Trial Period"
                            else "Premium Active"
                        }

                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = sub?.plan_name ?: "Free Tier",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleLarge
                            )
                            Text(
                                text = statusLabel,
                                fontWeight = FontWeight.Bold,
                                color = if (daysRemaining > 0 && sub?.plan_slug != "free") Color(0xFF4CAF50) else Color.Gray,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }

                        if (sub != null && sub.plan_slug != "free") {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                                modifier = Modifier.padding(vertical = 4.dp)
                            ) {
                                Text(
                                    text = "${daysRemaining} DAYS REMAINING",
                                    fontWeight = FontWeight.Black,
                                    fontSize = 14.sp,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                                )
                            }
                        }

                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Billing Cycle", fontWeight = FontWeight.Medium)
                            Text(if (sub?.plan_slug == "free" || sub == null) "Never" else "Monthly", color = Color.Gray)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Expiration Date", fontWeight = FontWeight.Medium)
                            Text(
                                text = sub?.current_period_end?.substring(0, 10) ?: "Forever",
                                color = Color.Gray
                            )
                        }
                    }
                }
            }

            // Upgrade premium promo card (Always available to extend subscription)
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "UPGRADE TO PREMIUM",
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )

                        Text(
                            text = "Unlock high-fidelity telemetry analyses, infinite projections timelines, priority AI companion chats, and secure sensitive skip-lists.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )

                        Text(
                            text = "ETB 299 / month",
                            fontWeight = FontWeight.Black,
                            fontSize = 28.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )

                        Button(
                            onClick = {
                                isUpgrading = true
                                viewModel.upgradeWithChapa("premium-monthly") { checkoutUrl ->
                                    isUpgrading = false
                                    if (checkoutUrl != null) {
                                        chapaCheckoutUrl = checkoutUrl
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.onPrimaryContainer,
                                contentColor = MaterialTheme.colorScheme.primaryContainer
                            ),
                            enabled = !isUpgrading
                        ) {
                            if (isUpgrading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(24.dp),
                                    color = MaterialTheme.colorScheme.primaryContainer
                                )
                            } else {
                                Text("Upgrade with Chapa", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
