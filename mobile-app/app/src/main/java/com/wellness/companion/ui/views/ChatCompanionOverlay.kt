package com.wellness.companion.ui.views

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.wellness.companion.ui.viewmodel.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatCompanionOverlay(viewModel: DashboardViewModel, onDismiss: () -> Unit) {
    var queryText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    // Scroll to bottom when new messages arrive
    LaunchedEffect(viewModel.chatMessages.size) {
        if (viewModel.chatMessages.isNotEmpty()) {
            listState.animateScrollToItem(viewModel.chatMessages.size - 1)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header Top Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onDismiss) {
                    Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Go Back", tint = MaterialTheme.colorScheme.primary)
                }
                Text(
                    text = "AI COMPANION CHAT",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(start = 12.dp)
                )
            }

            // Messages bubbles view
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (viewModel.chatMessages.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 64.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Ask the companion details about your cognitive focus patterns, steps deficits, sleep offsets, or request a coping strategy.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color.Gray,
                                modifier = Modifier.padding(horizontal = 32.dp)
                              )
                          }
                      }
                  } else {
                      items(viewModel.chatMessages) { msg ->
                          val isUser = msg.sender == "user"
                          Row(
                              modifier = Modifier.fillMaxWidth(),
                              horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
                          ) {
                              Box(
                                  modifier = Modifier
                                      .clip(
                                          RoundedCornerShape(
                                              topStart = 16.dp,
                                              topEnd = 16.dp,
                                              bottomStart = if (isUser) 16.dp else 0.dp,
                                              bottomEnd = if (isUser) 0.dp else 16.dp
                                          )
                                      )
                                      .background(
                                          if (isUser) MaterialTheme.colorScheme.primary.copy(alpha = 0.85f)
                                          else MaterialTheme.colorScheme.surface
                                      )
                                      .padding(14.dp)
                                      .widthIn(max = 260.dp)
                                ) {
                                    Text(
                                        text = msg.text,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = if (isUser) Color.White else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                    item { Spacer(modifier = Modifier.height(16.dp)) }
                }

                // Text input and Send button row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = queryText,
                        onValueChange = { queryText = it },
                        placeholder = { Text("e.g. why was my focus lower today?", fontSize = 14.sp) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(24.dp)
                    )
                    IconButton(
                        onClick = {
                            if (queryText.trim().isNotEmpty()) {
                                viewModel.handleChatQuery(queryText.trim())
                                queryText = ""
                            }
                        },
                        modifier = Modifier
                            .background(MaterialTheme.colorScheme.primary, shape = CircleShape)
                            .size(48.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Send, contentDescription = "Send Message", tint = Color.White)
                    }
                }
            }
        }
    }