import {
  listConversations,
  getMessages,
  createConversation,
  sendMessage,
  renameConversation,
  type Conversation,
  type Message,
} from "./api";

// DOM Elements
const conversationList = document.getElementById("conversation-list") as HTMLUListElement;
const chatTitle = document.getElementById("chat-title") as HTMLSpanElement;
const messagesDiv = document.getElementById("messages") as HTMLDivElement;
const messageForm = document.getElementById("message-form") as HTMLFormElement;
const messageInput = document.getElementById("message-input") as HTMLInputElement;
const newChatBtn = document.getElementById("new-chat-btn") as HTMLButtonElement;
const renameBtn = document.getElementById("rename-btn") as HTMLButtonElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;

// State
let conversations: Conversation[] = [];
let activeConversationId: string | null = null;
let activeMessages: Message[] = [];

// Pagination state for infinite scroll
let messageTotal = 0;
let messageOffset = 0;
let isLoadingMore = false;
const PAGE_SIZE = 20;

// --- Render Functions ---

function renderConversationList(filter = "") {
  const filtered = filter
    ? conversations.filter((c) => c.title.toLowerCase().includes(filter.toLowerCase()))
    : [...conversations];

  // Sort by updatedAt descending (newest first)
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  conversationList.innerHTML = filtered
    .map((c) => {
      const isActive = c.id === activeConversationId;
      const time = new Date(c.updatedAt).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `
        <li class="${isActive ? "active" : ""}" data-id="${c.id}">
          <div class="conv-title">${escapeHtml(c.title)}</div>
          <div class="conv-time">${time}</div>
        </li>
      `;
    })
    .join("");

  conversationList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      const id = li.dataset.id!;
      selectConversation(id);
    });
  });
}

function renderMessages() {
  if (activeMessages.length === 0) {
    messagesDiv.innerHTML = `
      <div class="empty-state">
        <div class="icon">💬</div>
        <div>No messages yet</div>
        <div>Send a message to start the conversation</div>
      </div>
    `;
    return;
  }

  // Show loading indicator at top if there are more messages to load
  const loadingHtml = messageOffset > 0
    ? `<div class="load-more-indicator" id="load-more">Loading older messages...</div>`
    : "";

  messagesDiv.innerHTML = loadingHtml + activeMessages
    .map((m) => {
      const time = new Date(m.createdAt).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `
        <div class="message ${m.role}">
          <div>${escapeHtml(m.content)}</div>
          <div class="msg-time">${time}</div>
        </div>
      `;
    })
    .join("");
}

function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.id = "typing";
  indicator.innerHTML = "<span></span><span></span><span></span>";
  messagesDiv.appendChild(indicator);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function hideTypingIndicator() {
  document.getElementById("typing")?.remove();
}

// --- Infinite Scroll ---

async function loadOlderMessages() {
  if (isLoadingMore || messageOffset <= 0 || !activeConversationId) return;

  isLoadingMore = true;

  // Calculate how many to load (up to PAGE_SIZE, but not below offset 0)
  const limit = Math.min(PAGE_SIZE, messageOffset);
  const newOffset = messageOffset - limit;

  try {
    const res = await getMessages(activeConversationId, newOffset, limit);
    const olderMessages = res.data || [];

    if (olderMessages.length > 0) {
      // Save current scroll height to restore position after prepend
      const prevScrollHeight = messagesDiv.scrollHeight;

      // Prepend older messages
      activeMessages = [...olderMessages, ...activeMessages];
      messageOffset = newOffset;
      renderMessages();

      // Restore scroll position so user doesn't jump
      const newScrollHeight = messagesDiv.scrollHeight;
      messagesDiv.scrollTop = newScrollHeight - prevScrollHeight;
    }
  } catch (err) {
    console.error("Failed to load older messages", err);
  } finally {
    isLoadingMore = false;
  }
}

messagesDiv.addEventListener("scroll", () => {
  // When scrolled near the top (within 50px), load more
  if (messagesDiv.scrollTop < 50) {
    loadOlderMessages();
  }
});

// --- Actions ---

async function loadConversations() {
  try {
    const res = await listConversations(0, 50);
    conversations = res.data;
    renderConversationList(searchInput.value);
  } catch (err) {
    console.error("Failed to load conversations", err);
  }
}

async function selectConversation(id: string) {
  activeConversationId = id;
  const conv = conversations.find((c) => c.id === id);

  if (conv) {
    chatTitle.textContent = conv.title;
    renameBtn.hidden = false;
    messageForm.hidden = false;
    renderConversationList(searchInput.value);

    // Reset pagination state
    activeMessages = [];
    messageTotal = 0;
    messageOffset = 0;
    isLoadingMore = false;

    // Fetch latest 20 messages (from the end)
    try {
      // First get total count
      const firstRes = await getMessages(id, 0, 1);
      messageTotal = firstRes.pagination.total;

      if (messageTotal > 0) {
        // Calculate offset for the latest PAGE_SIZE messages
        messageOffset = Math.max(0, messageTotal - PAGE_SIZE);
        const res = await getMessages(id, messageOffset, PAGE_SIZE);
        activeMessages = res.data || [];
      }

      renderMessages();
      // Scroll to bottom to show latest messages
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (err) {
      console.error("Failed to load conversation messages", err);
      activeMessages = [];
      renderMessages();
    }

    messageInput.focus();
  }
}

async function handleNewChat() {
  try {
    const res = await createConversation();
    if (res.data) {
      conversations.unshift(res.data);
      renderConversationList(searchInput.value);
      selectConversation(res.data.id);
    }
  } catch (err) {
    console.error("Failed to create conversation", err);
  }
}

async function handleSendMessage(e: Event) {
  e.preventDefault();
  const content = messageInput.value.trim();
  if (!content || !activeConversationId) return;

  messageInput.value = "";
  messageInput.disabled = true;

  // Optimistic: show user message immediately
  const tempUserMsg: Message = {
    id: "temp-" + Date.now(),
    conversationId: activeConversationId,
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  };
  activeMessages.push(tempUserMsg);
  renderMessages();
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  showTypingIndicator();

  try {
    const res = await sendMessage(activeConversationId, content);
    hideTypingIndicator();

    if (res.data) {
      // Replace temp message with real one and add assistant reply
      activeMessages.pop(); // remove temp
      activeMessages.push(res.data.userMessage);
      activeMessages.push(res.data.assistantMessage);
      messageTotal += 2;
      renderMessages();
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      // Update conversation timestamp in sidebar
      const conv = conversations.find((c) => c.id === activeConversationId);
      if (conv) {
        conv.updatedAt = new Date().toISOString();
      }
      renderConversationList(searchInput.value);
    }
  } catch (err) {
    hideTypingIndicator();
    console.error("Failed to send message", err);
    activeMessages.pop(); // remove temp on error
    renderMessages();
  } finally {
    messageInput.disabled = false;
    messageInput.focus();
  }
}

async function handleRename() {
  if (!activeConversationId) return;
  const conv = conversations.find((c) => c.id === activeConversationId);
  const newTitle = prompt("Rename conversation:", conv?.title || "");
  if (!newTitle || newTitle.trim() === "" || newTitle === conv?.title) return;

  try {
    const res = await renameConversation(activeConversationId, newTitle.trim());
    if (res.data) {
      const idx = conversations.findIndex((c) => c.id === activeConversationId);
      if (idx >= 0) {
        conversations[idx] = { ...conversations[idx], ...res.data };
      }
      chatTitle.textContent = newTitle.trim();
      renderConversationList(searchInput.value);
    }
  } catch (err) {
    console.error("Failed to rename", err);
  }
}

// --- Helpers ---

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- Event Listeners ---

newChatBtn.addEventListener("click", handleNewChat);
messageForm.addEventListener("submit", handleSendMessage);
renameBtn.addEventListener("click", handleRename);
searchInput.addEventListener("input", () => {
  renderConversationList(searchInput.value);
});

// --- Init ---

loadConversations();
