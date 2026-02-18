import {
  listConversations,
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

// --- Render Functions ---

function renderConversationList(filter = "") {
  const filtered = filter
    ? conversations.filter((c) => c.title.toLowerCase().includes(filter.toLowerCase()))
    : conversations;

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

  messagesDiv.innerHTML = activeMessages
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

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
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
    activeMessages = conv.messages || [];
    renameBtn.hidden = false;
    messageForm.hidden = false;
    renderMessages();
    renderConversationList(searchInput.value);
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
  showTypingIndicator();

  try {
    const res = await sendMessage(activeConversationId, content);
    hideTypingIndicator();

    if (res.data) {
      // Replace temp message with real one and add assistant reply
      activeMessages.pop(); // remove temp
      activeMessages.push(res.data.userMessage);
      activeMessages.push(res.data.assistantMessage);
      renderMessages();

      // Update conversation in sidebar
      const conv = conversations.find((c) => c.id === activeConversationId);
      if (conv) {
        conv.messages = activeMessages;
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
