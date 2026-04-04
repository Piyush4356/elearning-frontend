import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../main";
import "./Chatbot.css";

// ── Knowledge base of quick-reply flows ──────────────────────────────────────
const QUICK_REPLIES = {
  main: [
    { label: "🔍 Find a Course", id: "find_course" },
    { label: "📚 How to Enroll", id: "enroll" },
    { label: "💳 Payment Help", id: "payment" },
    { label: "🎓 Access My Courses", id: "access" },
    { label: "👤 Account & Auth", id: "account" },
    { label: "ℹ️ About Platform", id: "about" },
    { label: "📞 Contact Support", id: "contact_support", highlight: true },
  ],
};

const BOT_RESPONSES = {
  find_course: {
    text: "Great choice! 🌟 We have 500+ expert-led courses across categories like Web Dev, Data Science, Design, Business, and more.\n\nYou can browse all courses on the **Courses** page. Want me to guide you there?",
    quickReplies: [
      { label: "📖 Go to Courses", id: "goto_courses" },
      { label: "🔎 Search by Category", id: "categories" },
      { label: "🏠 Back to Menu", id: "main_menu" },
    ],
  },
  goto_courses: {
    text: "Navigating you to our **Courses** page now! 🚀 Browse, filter, and find the perfect course for your journey.",
    action: "navigate",
    path: "/courses",
    quickReplies: [{ label: "🏠 Back to Menu", id: "main_menu" }],
  },
  categories: {
    text: "We cover a wide range of categories:\n\n• 💻 **Web Development** — HTML, CSS, React, Node.js\n• 📊 **Data Science & AI** — Python, ML, Deep Learning\n• 🎨 **UI/UX Design** — Figma, Prototyping\n• 📈 **Business & Marketing** — Growth, SEO, Analytics\n• 📱 **Mobile Development** — React Native, Flutter\n\nHead to our **Courses** page to filter by category!",
    quickReplies: [
      { label: "📖 Go to Courses", id: "goto_courses" },
      { label: "🏠 Back to Menu", id: "main_menu" },
    ],
  },
  enroll: {
    text: "Enrolling is super easy! Here's how:\n\n1️⃣ **Browse** and click on a course you like\n2️⃣ **View** the course details (login required)\n3️⃣ Click **Enroll Now** and proceed to payment\n4️⃣ Complete payment via **Razorpay** (₹ INR)\n5️⃣ 🎉 Course appears in your **Dashboard** instantly!\n\nNote: You must be logged in to enroll.",
    quickReplies: [
      { label: "💳 Payment Info", id: "payment" },
      { label: "🎓 Access My Courses", id: "access" },
      { label: "🏠 Back to Menu", id: "main_menu" },
    ],
  },
  payment: {
    text: "💳 **Payment on our platform:**\n\n• All payments are in **₹ INR** (Indian Rupees)\n• We use **Razorpay** — a secure, trusted payment gateway\n• Supports UPI, Net Banking, Cards & Wallets\n\n**Facing an issue after payment?**\nIf your course isn't showing up, please check your Dashboard or visit the Account page to see active subscriptions.",
    quickReplies: [
      { label: "📋 Course Not Showing?", id: "course_missing" },
      { label: "🎓 Go to Dashboard", id: "goto_dashboard" },
      { label: "🏠 Back to Menu", id: "main_menu" },
    ],
  },
  course_missing: {
    text: "Sorry to hear that! 😟 Here's what to check:\n\n1. Visit your **Dashboard** — courses appear there after enrollment\n2. Check **Account** → Subscriptions for payment confirmation\n3. Try refreshing or logging out and back in\n\nIf the issue persists, our support team will help you right away!",
    quickReplies: [
      { label: "📋 Go to Dashboard", id: "goto_dashboard" },
      { label: "📞 Contact Support", id: "support" },
      { label: "🏠 Back to Menu", id: "main_menu" },
    ],
  },
  access: {
    text: "🎓 **Accessing your courses:**\n\n1. Log in to your account\n2. Go to your **Dashboard** — all enrolled courses are listed there\n3. Click on a course → then choose a **Lecture** to start learning\n4. Each lecture has a **video** + description\n5. Track your progress as you go! 📈",
    quickReplies: [
      { label: "📋 Go to Dashboard", id: "goto_dashboard" },
      { label: "🏠 Back to Menu", id: "main_menu" },
    ],
  },
  goto_dashboard: {
    text: "Taking you to your **Dashboard** now! 🎯 All your enrolled courses are waiting for you.",
    action: "navigate",
    path: "/student/dashboard",
    quickReplies: [{ label: "🏠 Back to Menu", id: "main_menu" }],
  },
  account: {
    text: "👤 **Account Help:**\n\n• **Login** → /login\n• **Register** → /register (email + OTP verification)\n• **Forgot Password** → /forgot\n• **Reset Password** → check your email for a reset link\n• **Update Profile** → Account page (profile pic & details)\n\nWhat do you need help with?",
    quickReplies: [
      { label: "🔐 Login Page", id: "goto_login" },
      { label: "📝 Register", id: "goto_register" },
      { label: "🔑 Forgot Password", id: "goto_forgot" },
      { label: "🏠 Back to Menu", id: "main_menu" },
    ],
  },
  goto_login: {
    text: "Heading to the **Login** page. Welcome back! 👋",
    action: "navigate",
    path: "/login",
    quickReplies: [{ label: "🏠 Back to Menu", id: "main_menu" }],
  },
  goto_register: {
    text: "Let's get you set up! Heading to **Registration** 🎉",
    action: "navigate",
    path: "/register",
    quickReplies: [{ label: "🏠 Back to Menu", id: "main_menu" }],
  },
  goto_forgot: {
    text: "Taking you to the **Forgot Password** page. We'll get you back in! 🔑",
    action: "navigate",
    path: "/forgot",
    quickReplies: [{ label: "🏠 Back to Menu", id: "main_menu" }],
  },
  about: {
    text: "🌟 **About Our Platform:**\n\n• **500+** expert-led courses\n• **50,000+** students and growing\n• Courses across tech, design, business & more\n• Taught by industry professionals\n• Each course has video lectures + descriptions\n• Payments in ₹ INR via Razorpay\n\nWe believe **learning is for everyone!** 💪",
    quickReplies: [
      { label: "📖 Browse Courses", id: "goto_courses" },
      { label: "🏠 Back to Menu", id: "main_menu" },
    ],
  },
  contact_support: {
    text: "We're here to help! 🛠️\n\nPlease **describe your issue or error** in as much detail as you can — what happened, which page, and any error message you saw.\n\nType your message below 👇",
    setAwaitingMessage: true,
    quickReplies: [
      { label: "🏠 Back to Menu", id: "main_menu" },
    ],
  },
  support: {
    text: "I'll connect you with our support team right away! 💌\n\nPlease **type your registered email address** below and we'll get back to you within 24 hours.",
    setAwaitingEmail: true,
    quickReplies: [
      { label: "👤 Go to Account", id: "goto_account" },
      { label: "🏠 Back to Menu", id: "main_menu" },
    ],
  },
  goto_account: {
    text: "Navigating to your **Account** page now! 🛡️",
    action: "navigate",
    path: "/account",
    quickReplies: [{ label: "🏠 Back to Menu", id: "main_menu" }],
  },
  main_menu: {
    text: "No worries! How else can I help you today? 😊",
    quickReplies: QUICK_REPLIES.main,
  },
};

// ── Simple keyword-based NLU ──────────────────────────────────────────────────
function detectIntent(text) {
  const t = text.toLowerCase();
  if (/\b(course|find|browse|search|categor|topic)\b/.test(t)) return "find_course";
  if (/\b(enroll|join|register for|sign up for course|buy)\b/.test(t)) return "enroll";
  if (
    /\b(pay|payment|razorpay|rupee|inr|₹|price|cost|fee|not showing|missing|didn.t appear)\b/.test(t)
  )
    return "payment";
  if (/\b(dashboard|study|lecture|video|access|my course|enrolled)\b/.test(t)) return "access";
  if (/\b(account|login|register|sign up|password|otp|verify|profile|forgot)\b/.test(t))
    return "account";
  if (/\b(about|platform|instructor|student|rating|how many|what is)\b/.test(t)) return "about";
  if (/\b(support|help|issue|problem|stuck|error|team)\b/.test(t)) return "support";
  return null;
}

// ── Chatbot Component ─────────────────────────────────────────────────────────
const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [awaitingMessage, setAwaitingMessage] = useState(false);
  const pendingMessage = useRef("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const openChat = () => {
    setIsOpen(true);
    if (!hasGreeted) {
      setHasGreeted(true);
      setTimeout(() => {
        addBotMessage(
          "Hi there! 👋 I'm **Lexi**, your learning assistant at India's premier EdTech platform.\n\nWith **500+ courses** and **50,000+ students**, we're here to help you grow! 🚀\n\nHow can I help you today?",
          QUICK_REPLIES.main
        );
      }, 400);
    }
  };

  const addBotMessage = (text, quickReplies = [], action = null, path = null, shouldAwaitEmail = false, shouldAwaitMessage = false) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      if (shouldAwaitEmail) setAwaitingEmail(true);
      if (shouldAwaitMessage) setAwaitingMessage(true);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "bot",
          text,
          quickReplies,
          timestamp: new Date(),
        },
      ]);
      // Handle navigation actions
      if (action === "navigate" && path) {
        setTimeout(() => navigate(path), 1200);
      }
    }, 900);
  };

  const handleQuickReply = (id) => {
    // Reset support flow states when going back to menu
    if (id === "main_menu") {
      setAwaitingEmail(false);
      setAwaitingMessage(false);
      pendingMessage.current = "";
    }

    const labelMap = {
      find_course: "Find a Course",
      goto_courses: "Go to Courses",
      categories: "Search by Category",
      enroll: "How to Enroll",
      payment: "Payment Help",
      course_missing: "Course Not Showing?",
      access: "Access My Courses",
      goto_dashboard: "Go to Dashboard",
      account: "Account & Auth",
      goto_login: "Login Page",
      goto_register: "Register",
      goto_forgot: "Forgot Password",
      about: "About Platform",
      contact_support: "Contact Support",
      support: "Get Help via Email",
      goto_account: "Go to Account",
      main_menu: "Back to Menu",
    };
    const label = labelMap[id] || id;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: label, timestamp: new Date() },
    ]);

    const response = BOT_RESPONSES[id];
    if (response) {
      addBotMessage(
        response.text,
        response.quickReplies || [],
        response.action || null,
        response.path || null,
        response.setAwaitingEmail || false,
        response.setAwaitingMessage || false
      );
    }
  };

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: trimmed, timestamp: new Date() },
    ]);
    setInput("");

    // ── STEP 1: Awaiting issue/error description ───────────────────────────────
    if (awaitingMessage) {
      setAwaitingMessage(false);
      pendingMessage.current = trimmed; // store the issue description
      // Now ask for their email
      addBotMessage(
        "Got it! 📝 Thanks for the details.\n\nNow please share your **registered email address** so our support team can reach you directly.",
        [],
        null,
        null,
        false,
        false
      );
      setAwaitingEmail(true);
      return;
    }

    // ── STEP 2: Awaiting email (after message captured or from direct support flow) ──
    if (awaitingEmail || EMAIL_REGEX.test(trimmed)) {
      if (!EMAIL_REGEX.test(trimmed)) {
        addBotMessage(
          "Hmm, that doesn't look like a valid email address. 🤔\nCould you share your **registered email**? (e.g. name@example.com)",
          [],
          null,
          null,
          false,
          false
        );
        setAwaitingEmail(true);
        return;
      }

      // Valid email — clear flags
      setAwaitingEmail(false);
      const issueMessage = pendingMessage.current;
      pendingMessage.current = "";

      setIsTyping(true);
      try {
        await axios.post(`${server}/api/support`, {
          email: trimmed,
          message: issueMessage || "No specific message — customer requested a callback.",
        });
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "bot",
            text:
              "Thank you so much! 🙏\n\n" +
              (issueMessage
                ? "We've received your report and a **confirmation email** has been sent to:\n"
                : "We've noted your request and a **confirmation email** has been sent to:\n") +
              trimmed +
              "\n\nOur support team will review your issue and get back to you **within 24 hours**. You're in good hands! 💪🎓",
            quickReplies: [
              { label: "📖 Browse Courses", id: "goto_courses" },
              { label: "🏠 Back to Menu", id: "main_menu" },
            ],
            timestamp: new Date(),
          },
        ]);
      } catch {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "bot",
            text:
              "Thank you! 🙏 We've noted your details. Our support team will reach out to **" +
              trimmed +
              "** within 24 hours.\n\nWe're on it — sorry for the trouble! 💪",
            quickReplies: [
              { label: "🏠 Back to Menu", id: "main_menu" },
            ],
            timestamp: new Date(),
          },
        ]);
      }
      return;
    }

    // ── Normal NLU flow ────────────────────────────────────────────────────────
    const intent = detectIntent(trimmed);
    if (intent && BOT_RESPONSES[intent]) {
      const response = BOT_RESPONSES[intent];
      addBotMessage(
        response.text,
        response.quickReplies || [],
        response.action || null,
        response.path || null,
        response.setAwaitingEmail || false,
        response.setAwaitingMessage || false
      );
    } else {
      addBotMessage(
        "Thanks for reaching out! 😊 I'm not sure I fully understood that.\n\nHere's what I can help you with:",
        QUICK_REPLIES.main
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format text with bold (**text**)
  const formatText = (text) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  const formatTime = (date) =>
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <button
        className={`lexi-trigger ${isOpen ? "lexi-trigger--active" : ""}`}
        onClick={() => (isOpen ? setIsOpen(false) : openChat())}
        aria-label="Open Lexi chatbot"
        id="lexi-chat-trigger"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        {!isOpen && <span className="lexi-badge">1</span>}
      </button>

      {/* ── Chat Window ── */}
      <div className={`lexi-window ${isOpen ? "lexi-window--open" : ""}`} role="dialog" aria-label="Lexi Chat Assistant">
        {/* Header */}
        <div className="lexi-header">
          <div className="lexi-avatar">
            <span>L</span>
            <span className="lexi-status-dot" />
          </div>
          <div className="lexi-header-info">
            <h3>Lexi</h3>
            <p>Learning Assistant · Online</p>
          </div>
          <button
            className="lexi-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="lexi-messages" id="lexi-messages-container">
          {messages.length === 0 && (
            <div className="lexi-empty">
              <div className="lexi-empty-icon">💬</div>
              <p>Start a conversation with Lexi!</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`lexi-msg lexi-msg--${msg.sender}`}>
              {msg.sender === "bot" && (
                <div className="lexi-msg-avatar">L</div>
              )}
              <div className="lexi-msg-content">
                <div className="lexi-bubble">{formatText(msg.text)}</div>
                <span className="lexi-time">{formatTime(msg.timestamp)}</span>
                {msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="lexi-quick-replies">
                    {msg.quickReplies.map((qr) => (
                      <button
                        key={qr.id}
                        className={`lexi-qr-btn${qr.highlight ? " lexi-qr-btn--highlight" : ""}`}
                        onClick={() => handleQuickReply(qr.id)}
                      >
                        {qr.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="lexi-msg lexi-msg--bot">
              <div className="lexi-msg-avatar">L</div>
              <div className="lexi-msg-content">
                <div className="lexi-bubble lexi-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="lexi-input-area" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              awaitingMessage
                ? "Describe your issue or error here..."
                : awaitingEmail
                ? "Enter your email address..."
                : "Ask Lexi anything..."
            }
            className={`lexi-input${awaitingMessage ? " lexi-input--issue" : awaitingEmail ? " lexi-input--email" : ""}`}
            id="lexi-chat-input"
            autoComplete="off"
          />
          <button
            type="submit"
            className="lexi-send-btn"
            disabled={!input.trim()}
            aria-label="Send message"
            id="lexi-send-button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>

        <div className="lexi-footer-tag">
          Powered by <strong>E-Learning AI</strong> 🤖
        </div>
      </div>
    </>
  );
};

export default Chatbot;
