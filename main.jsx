import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  Bell,
  LayoutDashboard,
  Lightbulb,
  Sparkles,
  Users,
  MessageSquare,
  FolderKanban,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Check,
  Lock,
  Leaf,
  GraduationCap,
  HeartPulse,
  Brain,
  Sun,
  Moon,
  Menu,
  X,
  Send,
  Flag,
  Archive,
  Trash2,
  Pencil,
  CheckCircle2,
  Globe,
  Layers,
  LoaderCircle,
  Command,
  Network,
  ExternalLink,
} from "lucide-react";
import "./styles.css";
import MergeIdeas from "./MergeIdeas";
import { resolveReturnPath } from "./auth-routing";
const API = import.meta.env.VITE_API_URL || "";
let authenticationEpoch = 0;
async function api(path, options = {}) {
  const requestEpoch = authenticationEpoch;
  let r;
  try {
    r = await fetch(API + "/api" + path, {
      credentials: "include",
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal:
        options.signal ||
        AbortSignal.timeout(
          path === "/auth/me"
            ? 8000
            : path.includes("/merge/") || path === "/ideas"
              ? 120000
              : 30000,
        ),
    });
  } catch (error) {
    if (error.name === "TimeoutError")
      throw new Error("This is taking longer than expected. Please try again.");
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Cannot connect to the application server. Make sure the local app is running, then try again.",
    );
  }
  if (
    r.ok &&
    [
      "/auth/login",
      "/auth/register",
      "/auth/logout",
      "/auth/reset-password",
      "/auth/change-password",
    ].includes(path)
  )
    authenticationEpoch += 1;
  if (
    r.status === 401 &&
    !path.startsWith("/auth/") &&
    requestEpoch === authenticationEpoch
  )
    window.dispatchEvent(new Event("aim:session-expired"));
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const error = new Error(
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((x) => x.msg).join("; ")
          : r.status >= 500
            ? "The application server is unavailable. Start START-WEBSITE.cmd, keep its window open, and retry."
            : "Something went wrong. Please try again.",
    );
    error.status = r.status;
    throw error;
  }
  return data;
}
const AppContext = createContext();
const useApp = () => useContext(AppContext);
const tags = (s) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const initials = (name) =>
  name
    ?.split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
const categories = [
  "Agriculture",
  "Education",
  "AI/ML",
  "Healthcare",
  "Climate",
  "Other",
];
const catIcon = {
  Agriculture: Leaf,
  Education: GraduationCap,
  "AI/ML": Brain,
  Healthcare: HeartPulse,
  Climate: Globe,
  Other: Lightbulb,
};
function Category({ value }) {
  let Icon = catIcon[value] || Lightbulb;
  return (
    <span className={"category cat-" + value.replace("/", "")}>
      <Icon size={13} />
      {value}
    </span>
  );
}
function Button({ children, variant = "", className = "", ...p }) {
  return (
    <button className={"btn " + variant + " " + className} {...p}>
      {children}
    </button>
  );
}
function Empty({
  title = "Nothing here yet",
  text = "Your next great collaboration starts with an idea.",
  action,
}) {
  return (
    <div className="empty">
      <Network size={34} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function Loading() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" /> Finding the good stuff…
    </div>
  );
}
function ErrorBox({ error }) {
  return error ? (
    <div className="error" role="alert">
      {error}
    </div>
  ) : null;
}
function useLoad(path, initial = null) {
  const [data, setData] = useState(initial),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const refresh = useCallback(() => {
    setLoading(true);
    return api(path)
      .then((x) => {
        setData(x);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, error, loading, refresh, setData };
}
function Heading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
function Avatar({ name, color = "", small = false }) {
  return (
    <span className={"avatar " + color + (small ? " small" : "")}>
      {initials(name)}
    </span>
  );
}
function MatchCard({ match, index = 0 }) {
  const { idea, collaborator, score } = match;
  return (
    <article className="match-card">
      <div className="card-top">
        <Category value={idea.category} />
        <span className="match-percent">
          <span className="tiny-dot" />
          {score}% match
        </span>
      </div>
      <div className={"idea-art art-" + (index % 4)}>
        <div className="art-ring" />
        <div className="art-ring two" />
        {React.createElement(catIcon[idea.category] || Lightbulb, {
          size: 45,
          strokeWidth: 1.3,
        })}
        <span className="art-label">
          {idea.category === "Agriculture"
            ? "GROW A BETTER FUTURE"
            : idea.category === "Education"
              ? "KNOWLEDGE WITHOUT LIMITS"
              : "IDEAS WITH REAL IMPACT"}
        </span>
        <span className="art-spark">✳</span>
      </div>
      <div className="card-body">
        <Link to={"/matches/" + idea.id} className="card-title">
          {idea.title}
          <ArrowUpRight size={19} />
        </Link>
        <p className="clamp">{idea.public_summary}</p>
        <div className="tags">
          {(idea.technologies.length ? idea.technologies : collaborator.skills)
            .slice(0, 3)
            .map((t) => (
              <span key={t}>{t}</span>
            ))}
        </div>
        <div className="card-author">
          <Avatar
            name={collaborator.name}
            small
            color={"color-" + (index % 4)}
          />
          <div>
            <b>{collaborator.name}</b>
            <span>{collaborator.experience} · Open to collaborate</span>
          </div>
          <Link
            to={"/matches/" + idea.id}
            className="icon-link"
            aria-label={"Explore " + idea.title}
          >
            <ArrowUpRight size={19} />
          </Link>
        </div>
      </div>
    </article>
  );
}
function Notifications() {
  const [open, setOpen] = useState(false);
  const { data = [], refresh } = useLoad("/notifications", []);
  const unread = data.filter((x) => !x.read).length;
  return (
    <div className="notification-wrap">
      <button
        className="icon-button"
        aria-label={"Notifications, " + unread + " unread"}
        onClick={() => {
          setOpen(!open);
          if (!open) refresh();
        }}
      >
        <Bell size={20} />
        {unread > 0 && <i />}
      </button>
      {open && (
        <div className="notification-menu">
          <div className="section-head">
            <b>Notifications</b>
            <button
              onClick={async () => {
                await api("/notifications/read", { method: "POST" });
                refresh();
              }}
            >
              Mark read
            </button>
          </div>
          {data.length ? (
            data.map((n) => (
              <Link
                to="/requests"
                onClick={() => setOpen(false)}
                key={n.id}
                className={n.read ? "read" : ""}
              >
                <span className="tiny-dot" />
                {n.text}
                <small>{new Date(n.created_at).toLocaleDateString()}</small>
              </Link>
            ))
          ) : (
            <p>You’re all caught up.</p>
          )}
        </div>
      )}
    </div>
  );
}
function Protections() {
  const { user } = useApp();
  const [blur, setBlur] = useState(false);
  useEffect(() => {
    if (!user) return;
    const blocked = (e) => {
      const editable = Boolean(
        e.target.closest('input,textarea,[contenteditable="true"]'),
      );
      if (e.type === "keydown") {
        const key = e.key.toLowerCase();
        const modified = e.ctrlKey || e.metaKey;
        const shortcut =
          modified &&
          (["s", "p", "u"].includes(key) ||
            (!editable && ["c", "x"].includes(key)));
        const screenshot =
          ["F12", "PrintScreen"].includes(e.key) ||
          (modified && e.shiftKey && ["3", "4", "5", "s"].includes(key));
        if (shortcut || screenshot) e.preventDefault();
      } else if (!editable) e.preventDefault();
    };
    const hide = () => setBlur(true),
      show = () => setBlur(false),
      visibility = () => setBlur(document.hidden);
    ["copy", "cut", "contextmenu", "dragstart", "keydown"].forEach((k) =>
      document.addEventListener(k, blocked),
    );
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      ["copy", "cut", "contextmenu", "dragstart", "keydown"].forEach((k) =>
        document.removeEventListener(k, blocked),
      );
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [user]);
  return user ? (
    <>
      <div className="watermark" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i}>{user.email} · CONFIDENTIAL</span>
        ))}
      </div>
      {blur && (
        <div className="privacy-curtain">
          <ShieldCheck size={38} />
          <h2>Your ideas stay yours.</h2>
          <p>Return to this window to continue.</p>
        </div>
      )}
    </>
  ) : null;
}
const nav = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/ideas", "My ideas", Lightbulb],
  ["/merge", "Merge ideas", Layers],
  ["/matches", "AI matches", Sparkles],
  ["/requests", "Collaboration requests", Users],
  ["/chat", "Messages", MessageSquare],
  ["/workspace", "Project workspace", FolderKanban],
  ["/assistant", "AI assistant", Brain],
];
function FocusManagement() {
  useEffect(() => {
    let previous = null;
    let currentDialog = null;
    const sync = () => {
      const dialog = document.querySelector(
        ".modal-backdrop .modal, .sidebar.mobile-open",
      );
      if (dialog && dialog !== currentDialog) {
        previous = document.activeElement;
        currentDialog = dialog;
        dialog
          .querySelector(
            "button:not(:disabled), input:not(:disabled), a[href], textarea, select",
          )
          ?.focus();
      } else if (!dialog && currentDialog) {
        currentDialog = null;
        previous?.focus();
      }
    };
    const keys = (event) => {
      if (!currentDialog) return;
      const controls = [
        ...currentDialog.querySelectorAll(
          'a[href], button:not(:disabled), input:not(:disabled), textarea, select, [tabindex="0"]',
        ),
      ];
      if (event.key === "Tab" && controls.length) {
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (event.key === "Escape") {
        const cancel = controls.find((node) =>
          /^(Cancel|Keep idea)$/.test(node.textContent.trim()),
        );
        if (cancel) cancel.click();
        else document.querySelector(".sidebar-scrim")?.click();
      }
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    document.addEventListener("keydown", keys);
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", keys);
    };
  }, []);
  return null;
}
function Shell() {
  const { user, theme, setTheme } = useApp();
  const location = useLocation();
  const [mobile, setMobile] = useState(false);
  const [narrow, setNarrow] = useState(window.innerWidth <= 760);
  useEffect(() => {
    const resize = () => setNarrow(window.innerWidth <= 760);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  useEffect(() => setMobile(false), [location.pathname]);
  return (
    <div className="app-shell">
      <aside
        inert={narrow && !mobile ? true : undefined}
        aria-hidden={narrow && !mobile}
        className={"sidebar " + (mobile ? "mobile-open" : "")}
      >
        <Link className="brand" to="/dashboard">
          <span className="brand-mark">
            <Network size={24} />
          </span>
          <span>
            idea<span className="brand-light">merger</span>
            <small>BETTER, TOGETHER.</small>
          </span>
        </Link>
        <div className="workspace-label">
          <span className="workspace-icon">A</span>
          <div>
            Personal workspace<small>Let’s build something great</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to}>
              <Icon size={19} />
              <span>{label}</span>
              {to === "/matches" && <span className="nav-new">AI</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="privacy-icon">
              <ShieldCheck size={19} />
            </span>
            <b>Your ideas. Your ownership.</b>
            <p>Details stay private until you both say yes.</p>
            <Link to="/settings">
              Explore privacy <ArrowUpRight size={13} />
            </Link>
          </div>
          <NavLink to="/settings" className="bottom-link">
            <Settings size={18} />
            Settings & privacy
          </NavLink>
          {user.role === "admin" && (
            <NavLink to="/admin" className="bottom-link">
              <ShieldCheck size={18} />
              Admin dashboard
            </NavLink>
          )}
          <button className="user-block" onClick={() => navigate("/profile")}>
            <Avatar name={user.name} />
            <div>
              <b>{user.name}</b>
              <small>Personal account</small>
            </div>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <main className="main" inert={mobile ? true : undefined}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <b>
              {nav.find(([p]) => location.pathname.startsWith(p))?.[1] ||
                "Your account"}
            </b>
          </div>
          <div className="topbar-actions">
            <form
              className="search-box"
              onSubmit={(e) => {
                e.preventDefault();
                navigate("/matches?q=" + encodeURIComponent(query));
              }}
            >
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ideas…"
                aria-label="Search ideas"
              />
              <kbd>↵</kbd>
            </form>
            <button
              className="icon-button"
              aria-label="Toggle color theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <Notifications />
            <span className="topbar-divider" />
            <Avatar name={user.name} small />
          </div>
        </header>
        <div className="page-content">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="ideas" element={<Ideas />} />
            <Route
              path="merge"
              element={
                <MergeIdeas
                  api={api}
                  useLoad={useLoad}
                  useApp={useApp}
                  Heading={Heading}
                  Loading={Loading}
                  ErrorBox={ErrorBox}
                  Category={Category}
                  Button={Button}
                  Empty={Empty}
                  categories={categories}
                  Link={Link}
                  icons={{
                    Sparkles,
                    Plus,
                    ArrowRight,
                    ArrowUpRight,
                    ArrowLeft,
                    Check,
                    Lock,
                    Lightbulb,
                    Layers,
                    ShieldCheck,
                    LoaderCircle,
                    X,
                  }}
                />
              }
            />
            <Route path="ideas/new" element={<IdeaForm />} />
            <Route path="ideas/:id/edit" element={<IdeaForm />} />
            <Route path="matches" element={<Matches />} />
            <Route path="matches/:id" element={<MatchDetail />} />
            <Route path="requests" element={<Requests />} />
            <Route path="chat" element={<Chat />} />
            <Route path="workspace" element={<Workspace />} />
            <Route path="workspace/:id" element={<Workspace />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<Admin />} />
            <Route
              path="*"
              element={
                <Empty
                  title="Page not found"
                  action={
                    <Link className="btn" to="/dashboard">
                      Back to overview
                    </Link>
                  }
                />
              }
            />
          </Routes>
          <footer className="app-footer">
            <span>© {new Date().getFullYear()} Idea Merger</span>
            <span>
              <span className="tiny-dot" /> A little AI. A lot of possibility.
            </span>
            <Link to="/terms">Terms & conditions</Link>
          </footer>
        </div>
      </main>
      <Protections />
      <FocusManagement />
    </div>
  );
}
function Dashboard() {
  const { user } = useApp();
  const { data: ideas = [], loading, error } = useLoad("/ideas", []);
  const { data: matches = [] } = useLoad("/matches", []);
  const { data: requests = [] } = useLoad("/requests", []);
  const { data: projects = [] } = useLoad("/projects", []);
  const received = requests.filter(
    (x) => x.receiver_id === user.id && x.status === "pending",
  );
  if (loading) return <Loading />;
  return (
    <>
      <Heading
        eyebrow="YOUR NEXT CHAPTER STARTS HERE"
        title={
          <>
            Good to see you, {user.name.split(" ")[0]}{" "}
            <span className="wave">✳</span>
          </>
        }
        description="Big ideas get better with the right people. Let’s find yours."
        action={
          <Link className="btn primary" to="/ideas/new">
            <Plus size={18} />
            Submit an idea
          </Link>
        }
      />
      <ErrorBox error={error} />
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="hero-pill">
            <Sparkles size={13} /> BUILT FOR THE WHAT-IF PEOPLE
          </span>
          <h2>
            Your idea is just
            <br />
            the beginning.
          </h2>
          <p>
            Find someone who sees what you see.
            <br />
            Then build something neither of you could alone.
          </p>
          <Link to="/matches" className="btn lime">
            Discover your matches <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="hero-graphic" aria-hidden="true">
          <div className="orbit o1" />
          <div className="orbit o2" />
          <div className="orbit o3" />
          <div className="orbit-line" />
          <div className="graphic-node n1">
            <Lightbulb size={29} />
          </div>
          <div className="graphic-node n2">
            <Users size={28} />
          </div>
          <div className="graphic-node n3">
            <Layers size={25} />
          </div>
          <div className="graphic-node n4">
            <Sparkles size={24} />
          </div>
          <div className="graphic-center">
            <Network size={56} strokeWidth={1.3} />
          </div>
          <span className="floating-label fl1">
            <i />
            Different minds.
          </span>
          <span className="floating-label fl2">
            Shared possibilities. <ArrowUpRight size={13} />
          </span>
          <span className="graphic-star">✳</span>
        </div>
      </section>
      <div className="stats-grid">
        {[
          [
            Lightbulb,
            "Your ideas",
            ideas.filter((x) => !x.archived).length,
            "Ideas worth exploring",
            "peach",
          ],
          [
            Sparkles,
            "AI matches",
            matches.length,
            "Meaningful connections",
            "mint",
          ],
          [
            Users,
            "Invitations",
            received.length,
            "A new possibility awaits",
            "lavender",
          ],
          [
            FolderKanban,
            "Active projects",
            projects.length,
            "From what-if to what’s next",
            "yellow",
          ],
        ].map(([Icon, label, value, sub, c]) => (
          <div className="stat-card" key={label}>
            <span className={"stat-icon " + c}>
              <Icon size={20} />
            </span>
            <span className="stat-label">{label}</span>
            <strong>{String(value).padStart(2, "0")}</strong>
            <small>{sub}</small>
          </div>
        ))}
      </div>
      <section className="recommendations">
        <div className="section-head">
          <div>
            <h2>
              Ideas that click with yours{" "}
              <span className="soft-badge">AI curated</span>
            </h2>
            <p>Shared interests. Complementary skills. A little serendipity.</p>
          </div>
          <Link to="/matches">
            View all matches <ArrowRight size={16} />
          </Link>
        </div>
        {matches.length ? (
          <div className="match-grid">
            {matches.slice(0, 3).map((m, i) => (
              <MatchCard key={m.idea.id} match={m} index={i} />
            ))}
          </div>
        ) : (
          <Empty
            title="Make room for your next collaborator"
            text="Submit your first idea to get AI-ranked recommendations."
            action={
              <Link to="/ideas/new" className="btn">
                Share an idea <Plus size={16} />
              </Link>
            }
          />
        )}
      </section>
      <div className="dashboard-lower">
        <section className="panel">
          <div className="section-head">
            <h2>Your idea board</h2>
            <Link to="/ideas">
              Manage ideas <ArrowUpRight size={15} />
            </Link>
          </div>
          {ideas.slice(0, 2).map((i) => (
            <Link
              key={i.id}
              to={"/ideas/" + i.id + "/edit"}
              className="idea-row"
            >
              <span className="idea-row-icon">
                <Lightbulb size={22} />
              </span>
              <div>
                <b>{i.title}</b>
                <span>
                  {i.category} ·{" "}
                  {i.archived ? "Archived" : "Open to collaboration"}
                </span>
              </div>
              <span className="privacy-tag">
                <Lock size={12} />
                Protected
              </span>
              <ArrowUpRight size={17} />
            </Link>
          ))}
          {!ideas.length && (
            <p className="muted">A blank canvas, full of possibility.</p>
          )}
          <Link to="/ideas/new" className="add-idea">
            <Plus size={17} />A new idea starts here
          </Link>
        </section>
        <section className="panel invitation-panel">
          <div className="section-head">
            <h2>Let’s make something happen</h2>
            <span className="soft-badge">{received.length} new</span>
          </div>
          {received.length ? (
            received.slice(0, 1).map((r) => (
              <div key={r.id}>
                <div className="invitation-author">
                  <Avatar name={r.sender_name} color="color-2" />
                  <div>
                    <b>{r.sender_name}</b>
                    <small>Wants to explore your idea</small>
                  </div>
                </div>
                <p className="invitation-message">
                  “{r.message || "Let’s build something meaningful together."}”
                </p>
                <Link className="btn outline full" to="/requests">
                  View invitation <ArrowUpRight size={16} />
                </Link>
              </div>
            ))
          ) : (
            <>
              <p className="muted">
                Your next teammate could be one introduction away.
              </p>
              <Link className="btn outline" to="/matches">
                Find a collaborator <ArrowRight size={16} />
              </Link>
            </>
          )}
        </section>
      </div>
      <div className="trust-line">
        <ShieldCheck size={15} />
        <span>
          Only the spark is public. The full idea stays yours until you both
          agree.
        </span>
        <Link to="/settings">
          You’re in control <ArrowUpRight size={13} />
        </Link>
      </div>
    </>
  );
}
function Ideas() {
  const { data = [], loading, error, refresh } = useLoad("/ideas", []);
  const { toast } = useApp();
  const [filter, setFilter] = useState("active"),
    [deleting, setDeleting] = useState(null);
  async function archive(i) {
    try {
      await api("/ideas/" + i.id, {
        method: "PATCH",
        body: { archived: !i.archived },
      });
      refresh();
      toast(i.archived ? "Idea restored" : "Idea archived");
    } catch (e) {
      toast(e.message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="YOUR ORIGINAL THINKING"
        title="My ideas"
        description="A home for your what-ifs, works in progress, and next big things."
        action={
          <Link className="btn primary" to="/ideas/new">
            <Plus size={18} />
            Submit an idea
          </Link>
        }
      />
      <Link className="idea-merge-shortcut" to="/merge">
        <span>
          <Sparkles size={20} />
          <span>
            <b>More than the sum of your ideas.</b>
            <small>Bring 2–5 ideas into one clear, editable direction.</small>
          </span>
        </span>
        <span>
          Merge ideas <ArrowUpRight size={16} />
        </span>
      </Link>
      <div className="tabs">
        {["active", "archived"].map((t) => (
          <button
            className={filter === t ? "selected" : ""}
            onClick={() => setFilter(t)}
            key={t}
          >
            {t === "active" ? "Active ideas" : "Archived"}{" "}
            <span>
              {data.filter((i) => i.archived === (t === "archived")).length}
            </span>
          </button>
        ))}
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : data.filter((i) => i.archived === (filter === "archived")).length ? (
        <div className="idea-list">
          {data
            .filter((i) => i.archived === (filter === "archived"))
            .map((i) => (
              <article className="panel owned-card" key={i.id}>
                <div className="section-head">
                  <Category value={i.category} />
                  <span className="privacy-tag">
                    <Lock size={12} />
                    {i.privacy === "hidden"
                      ? "Hidden until accepted"
                      : "Summary visible"}
                  </span>
                </div>
                <h2>{i.title}</h2>
                <p>{i.public_summary}</p>
                <div className="tags">
                  {i.technologies.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <small className="muted">
                  Authorship recorded {new Date(i.created_at).toLocaleString()}
                </small>
                <div className="button-row">
                  <Link to={"/ideas/" + i.id + "/edit"} className="btn outline">
                    <Pencil size={15} />
                    Edit idea
                  </Link>
                  <Link className="btn outline" to={"/matches?idea=" + i.id}>
                    <Sparkles size={15} />
                    Find matches
                  </Link>
                  <Button variant="ghost" onClick={() => archive(i)}>
                    <Archive size={15} />
                    {i.archived ? "Restore" : "Archive"}
                  </Button>
                  <Button
                    variant="danger ghost"
                    onClick={() => setDeleting(i)}
                    aria-label={"Delete " + i.title}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </article>
            ))}
        </div>
      ) : (
        <Empty
          title={
            filter === "active"
              ? "Every collaboration starts with an idea."
              : "No archived ideas"
          }
          action={
            filter === "active" && (
              <Link to="/ideas/new" className="btn primary">
                Create your first idea
              </Link>
            )
          }
        />
      )}
      {deleting && (
        <div className="modal-backdrop">
          <div
            className="panel modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Delete {deleting.title}?</h2>
            <p>
              This permanently deletes this idea and its pending requests.
              Accepted projects must be archived instead.
            </p>
            <div className="button-row">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Keep idea
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await api("/ideas/" + deleting.id, { method: "DELETE" });
                    setDeleting(null);
                    refresh();
                    toast("Idea deleted");
                  } catch (e) {
                    toast(e.message);
                    setDeleting(null);
                  }
                }}
              >
                Delete idea
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function IdeaForm() {
  const { id } = useParams(),
    navigate = useNavigate(),
    { toast } = useApp();
  const [form, setForm] = useState({
    title: "",
    category: "Agriculture",
    public_summary: "",
    private_description: "",
    privacy: "summary_technologies",
    skills: "",
    tech: "",
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(!id);
  useEffect(() => {
    if (id)
      api("/ideas/" + id)
        .then((i) => {
          setForm({
            ...i,
            skills: i.required_skills.join(", "),
            tech: i.technologies.join(", "),
          });
          setLoaded(true);
        })
        .catch((e) => setError(e.message));
  }, [id]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  if (id && error && !loaded)
    return (
      <>
        <Heading title="This idea could not be opened" />
        <ErrorBox error={error} />
        <Link className="btn outline" to="/ideas">
          Back to my ideas
        </Link>
      </>
    );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/ideas" + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        body: {
          title: form.title,
          category: form.category,
          public_summary: form.public_summary,
          private_description: form.private_description,
          privacy: form.privacy,
          required_skills: tags(form.skills),
          technologies: tags(form.tech),
        },
      });
      toast(id ? "Idea updated" : "Your idea is ready to find its people");
      navigate("/ideas");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="PLANT THE SEED"
        title={id ? "Refine your idea" : "What are you imagining?"}
        description="Share enough to find your people. Keep the details that make it yours private."
      />
      <ErrorBox error={error} />
      {!loaded && !error ? (
        <Loading />
      ) : (
        <form className="form-layout" onSubmit={submit}>
          <div className="panel form-panel">
            <label>
              Idea title
              <input
                required
                minLength={3}
                maxLength={160}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Give your big idea a name"
              />
            </label>
            <label>
              Category
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Public summary{" "}
              <span className="field-badge">
                <Globe size={12} />
                Used for AI matching
              </span>
              <textarea
                required
                minLength={20}
                maxLength={2000}
                rows={4}
                value={form.public_summary}
                onChange={(e) => set("public_summary", e.target.value)}
                placeholder="Describe the problem and broad approach. Leave out proprietary details."
              />
              <small>
                Abstract your idea in at least 20 characters. Never include
                confidential details here.
              </small>
            </label>
            <label>
              Full private description{" "}
              <span className="field-badge">
                <Lock size={12} />
                Private
              </span>
              <textarea
                required
                minLength={20}
                maxLength={20000}
                rows={6}
                value={form.private_description}
                onChange={(e) => set("private_description", e.target.value)}
                placeholder="Your implementation, research, unique approach, and the details worth protecting."
              />
              <small>
                Unlocked only for the collaborator whose request you both
                accept.
              </small>
            </label>
            <div className="form-grid">
              <label>
                Skills you need
                <input
                  value={form.skills}
                  onChange={(e) => set("skills", e.target.value)}
                  placeholder="Python, UI/UX, Machine Learning"
                />
                <small>Separate each skill with a comma.</small>
              </label>
              <label>
                Technologies
                <input
                  value={form.tech}
                  onChange={(e) => set("tech", e.target.value)}
                  placeholder="React, FastAPI, TensorFlow"
                />
                <small>Separate each technology with a comma.</small>
              </label>
            </div>
            <ErrorBox error={error} />
            <div className="button-row">
              <Button variant="primary" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <Sparkles size={17} />
                )}
                {busy
                  ? "Saving & finding connections…"
                  : id
                    ? "Save changes"
                    : "Publish idea summary"}
              </Button>
              <Link className="btn ghost" to="/ideas">
                Cancel
              </Link>
            </div>
          </div>
          <aside>
            <div className="panel privacy-options">
              <ShieldCheck size={27} />
              <h3>Choose what the world sees.</h3>
              {[
                [
                  "summary",
                  "Summary only",
                  "Your title, summary, and required skills.",
                ],
                [
                  "summary_technologies",
                  "Summary + technologies",
                  "Help collaborators see your technical direction.",
                ],
                [
                  "hidden",
                  "Hidden until accepted",
                  "Only your category and compatibility are visible.",
                ],
              ].map(([v, t, s]) => (
                <label
                  className={
                    "radio-option " + (form.privacy === v ? "active" : "")
                  }
                  key={v}
                >
                  <input
                    type="radio"
                    name="privacy"
                    value={v}
                    checked={form.privacy === v}
                    onChange={() => set("privacy", v)}
                  />
                  <div>
                    <b>{t}</b>
                    <small>{s}</small>
                  </div>
                </label>
              ))}
              <p className="small-note">
                Your full description is always private before mutual consent.
                Every submission receives an authorship timestamp.
              </p>
            </div>
          </aside>
        </form>
      )}
    </>
  );
}
function Matches() {
  const location = useLocation();
  const params = new URLSearchParams(location.search),
    idea = params.get("idea");
  const {
    data = [],
    loading,
    error,
  } = useLoad("/matches" + (idea ? "?idea_id=" + idea : ""), []);
  const [category, setCategory] = useState("All ideas"),
    [query, setQuery] = useState(params.get("q") || "");
  useEffect(
    () => setQuery(new URLSearchParams(location.search).get("q") || ""),
    [location.search],
  );
  const filtered = data.filter(
    (m) =>
      (category === "All ideas" || m.idea.category === category) &&
      [
        m.idea.title,
        m.idea.public_summary,
        m.collaborator.name,
        ...m.collaborator.skills,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow="MEANINGFUL CONNECTIONS, MADE INTELLIGENT"
        title="Find your kind of mind."
        description="People whose ideas connect with yours — and skills that complete the picture."
      />
      <div className="match-info">
        <Sparkles size={20} />
        <div>
          <b>More than a keyword match.</b>
          <span>
            50% idea similarity + 25% skill fit + 25% technology overlap.
          </span>
        </div>
        <ShieldCheck size={20} />
      </div>
      <div className="filter-toolbar">
        <div className="filter-chips">
          {["All ideas", ...categories].map((c) => (
            <button
              key={c}
              className={c === category ? "active" : ""}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="search-box">
          <Search size={16} />
          <input
            aria-label="Filter matches"
            placeholder="Find an idea or skill"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : filtered.length ? (
        <>
          <div className="results-label">
            {filtered.length} possibilities, ranked for you
          </div>
          <div className="match-grid">
            {filtered.map((m, i) => (
              <MatchCard match={m} index={i} key={m.idea.id} />
            ))}
          </div>
        </>
      ) : (
        <Empty
          title="Your people are out there."
          text="Try another filter, or submit an active idea to unlock recommendations."
          action={
            <Link to="/ideas/new" className="btn primary">
              Submit an idea <Plus size={16} />
            </Link>
          }
        />
      )}
    </>
  );
}
function MatchDetail() {
  const { id } = useParams();
  const { data: m, loading, error } = useLoad("/matches/" + id);
  const { toast } = useApp();
  const [message, setMessage] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [report, setReport] = useState(false),
    [reason, setReason] = useState("");
  async function invite(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/requests", {
        method: "POST",
        body: {
          source_idea_id: m.source_idea_id,
          target_idea_id: m.idea.id,
          message,
          consent,
        },
      });
      setSent(true);
      toast("Invitation sent. Your full ideas stay private until they accept.");
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (!m) return <ErrorBox error={error} />;
  return (
    <>
      <Link to="/matches" className="back-link">
        <ArrowLeft size={16} />
        Back to matches
      </Link>
      <Heading
        eyebrow="A SHARED DIRECTION"
        title={m.idea.title}
        description={"A potential collaboration with " + m.collaborator.name}
        action={<Category value={m.idea.category} />}
      />
      <div className="form-layout">
        <div>
          <section className="panel detail-panel">
            <div className="section-head">
              <h2>The spark</h2>
              <span className="privacy-tag">
                <Lock size={13} />
                {m.idea.unlocked ? "Details unlocked" : "Public summary"}
              </span>
            </div>
            <p className="large-body">{m.idea.public_summary}</p>
            {m.idea.unlocked && (
              <div className="unlocked-block">
                <h3>Full idea · shared in confidence</h3>
                <p>{m.idea.private_description}</p>
              </div>
            )}
            <h3>Technical direction</h3>
            <div className="tags">
              {m.idea.technologies.length ? (
                m.idea.technologies.map((t) => <span key={t}>{t}</span>)
              ) : (
                <p className="muted">Technology details are private.</p>
              )}
            </div>
            <h3>Looking for</h3>
            <div className="tags">
              {m.idea.required_skills.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="detail-author">
              <Avatar name={m.collaborator.name} />
              <div>
                <b>{m.collaborator.name}</b>
                <small>{m.collaborator.experience}</small>
              </div>
            </div>
            <h3>Skills they bring</h3>
            <div className="tags">
              {m.collaborator.skills.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
            <small className="muted">
              Submitted {new Date(m.idea.created_at).toLocaleString()}
            </small>
          </section>
          <section className="panel detail-panel">
            <h2>A connection worth exploring</h2>
            <p className="muted">Matched with your idea: {m.source_title}</p>
            <div className="score-total">
              <strong>
                {m.score}
                <small>%</small>
              </strong>
              <span>Overall compatibility</span>
            </div>
            {[
              ["Idea similarity", "idea_similarity", 50],
              ["Skill fit", "skill_fit", 25],
              ["Technology overlap", "technology_overlap", 25],
            ].map(([label, key, weight]) => (
              <div className="score-row" key={key}>
                <div>
                  <span>
                    {label} <small>({weight}% weight)</small>
                  </span>
                  <b>{m[key] === null ? "Private" : m[key] + "%"}</b>
                </div>
                <div className="progress">
                  <span style={{ width: (m[key] || 0) + "%" }} />
                </div>
              </div>
            ))}
          </section>
        </div>
        <aside>
          <form onSubmit={invite} className="panel form-panel sticky-panel">
            <Sparkles size={27} />
            <h2>Say hello to possibility.</h2>
            <p>Introduce yourself and what you’d love to build together.</p>
            <label>
              Your message
              <textarea
                rows={4}
                maxLength={1500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I think our ideas could complement each other…"
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>
                I consent to share my full idea with this member if they accept,
                and I will keep their idea confidential.
              </span>
            </label>
            <Button variant="primary full" disabled={busy || sent}>
              {sent ? <Check size={17} /> : <Send size={17} />}
              {sent
                ? "Invitation sent"
                : busy
                  ? "Sending…"
                  : "Send collaboration request"}
            </Button>
            <small className="small-note">
              <Lock size={12} /> Your full ideas unlock only after mutual
              acceptance.
            </small>
            <button
              type="button"
              className="text-button muted"
              onClick={() => setReport(true)}
            >
              <Flag size={13} />
              Report this idea or account
            </button>
          </form>
        </aside>
      </div>
      {report && (
        <div className="modal-backdrop">
          <form
            className="panel modal form-panel"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/reports", {
                  method: "POST",
                  body: {
                    idea_id: m.idea.id,
                    reported_user_id: m.collaborator.id,
                    reason,
                  },
                });
                setReport(false);
                toast("Report submitted for moderator review");
              } catch (e) {
                toast(e.message);
              }
            }}
          >
            <h2>Help keep this space thoughtful.</h2>
            <label>
              What concerns you?
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Spam, copied ideas, fake accounts, or inappropriate content…"
              />
            </label>
            <div className="button-row">
              <Button variant="primary">Submit report</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReport(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
function Requests() {
  const { user, toast } = useApp();
  const { data = [], loading, error, refresh } = useLoad("/requests", []);
  const [tab, setTab] = useState("received"),
    [accepting, setAccepting] = useState(null),
    [consent, setConsent] = useState(false);
  const list = data.filter((r) =>
    tab === "received" ? r.receiver_id === user.id : r.sender_id === user.id,
  );
  async function decide(id, action) {
    try {
      await api("/requests/" + id, {
        method: "PATCH",
        body: { action, consent: action === "accept" && consent },
      });
      setAccepting(null);
      setConsent(false);
      refresh();
      toast(
        action === "accept"
          ? "You’re connected. Your private workspace is ready."
          : "Invitation declined",
      );
    } catch (e) {
      toast(e.message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="GOOD THINGS START WITH HELLO"
        title="Collaboration requests"
        description="Choose who you share your ideas — and your next chapter — with."
      />
      <div className="tabs">
        {["received", "sent"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t === "received" ? "Received" : "Sent"}
          </button>
        ))}
      </div>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : !list.length ? (
        <Empty
          title="No invitations here yet."
          text="Discover an idea that clicks and send the first hello."
        />
      ) : (
        <div className="request-list">
          {list.map((r) => (
            <article className="panel request-card" key={r.id}>
              <div className="section-head">
                <div className="invitation-author">
                  <Avatar
                    name={tab === "received" ? r.sender_name : r.receiver_name}
                  />
                  <div>
                    <b>
                      {tab === "received" ? r.sender_name : r.receiver_name}
                    </b>
                    <small>{new Date(r.created_at).toLocaleDateString()}</small>
                  </div>
                </div>
                <span className={"status " + r.status}>{r.status}</span>
              </div>
              <h3>
                {r.source_idea.title} <ArrowRight size={16} />{" "}
                {r.target_idea.title}
              </h3>
              <p>
                {r.message ||
                  "Let’s explore how our ideas could work together."}
              </p>
              <div className="button-row">
                {r.status === "pending" && tab === "received" ? (
                  <>
                    <Button variant="primary" onClick={() => setAccepting(r)}>
                      <Check size={16} />
                      Accept & collaborate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => decide(r.id, "reject")}
                    >
                      Decline
                    </Button>
                  </>
                ) : r.status === "accepted" ? (
                  <>
                    <Link
                      className="btn primary"
                      to={"/workspace/" + r.project_id}
                    >
                      Open workspace <ArrowUpRight size={16} />
                    </Link>
                    <Link
                      className="btn outline"
                      to={"/chat?project=" + r.project_id}
                    >
                      <MessageSquare size={16} />
                      Message
                    </Link>
                  </>
                ) : (
                  <span className="small-note">
                    <Lock size={13} />
                    Full ideas remain private.
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {accepting && (
        <div className="modal-backdrop">
          <div
            className="panel modal form-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-heading"
          >
            <ShieldCheck size={30} />
            <h2 id="consent-heading">Build on mutual trust.</h2>
            <p>
              Accepting unlocks both full ideas, a private chat, and a shared
              project workspace for you and {accepting.sender_name}.
            </p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I explicitly consent to share my full idea and agree to keep
                their ideas and messages confidential.
              </span>
            </label>
            <div className="button-row">
              <Button
                variant="primary"
                disabled={!consent}
                onClick={() => decide(accepting.id, "accept")}
              >
                Accept & unlock workspace
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setAccepting(null);
                  setConsent(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function Chat() {
  const { data: projects = [], loading } = useLoad("/projects", []);
  const location = useLocation();
  const [selected, setSelected] = useState(
    Number(new URLSearchParams(location.search).get("project")) || null,
  );
  useEffect(() => {
    if (!selected && projects.length) setSelected(projects[0].id);
  }, [projects, selected]);
  return (
    <>
      <Heading
        eyebrow="WHERE IDEAS BECOME CONVERSATIONS"
        title="Messages"
        description="A private space for your shared what-ifs."
      />
      {loading ? (
        <Loading />
      ) : !projects.length ? (
        <Empty
          title="Your conversations start with consent."
          text="Accept a collaboration request to unlock a private chat."
          action={
            <Link className="btn primary" to="/requests">
              View requests
            </Link>
          }
        />
      ) : (
        <div className="chat-layout">
          <aside className="panel chat-projects">
            <h3>Your collaborations</h3>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={selected === p.id ? "active" : ""}
              >
                <span className="stat-icon mint">
                  <MessageSquare size={18} />
                </span>
                <span>
                  {p.title}
                  <small>Private project chat</small>
                </span>
              </button>
            ))}
          </aside>
          {selected && <ChatRoom key={selected} id={selected} />}
        </div>
      )}
    </>
  );
}
function ChatRoom({ id }) {
  const { user } = useApp();
  const [messages, setMessages] = useState([]),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    let after = 0;
    async function poll() {
      try {
        const rows = await api("/projects/" + id + "/messages?after=" + after);
        if (alive && rows.length) {
          after = rows[rows.length - 1].id;
          setMessages((old) => [
            ...old,
            ...rows.filter((r) => !old.some((m) => m.id === r.id)),
          ]);
          setError("");
        }
      } catch (e) {
        if (alive) setError(e.message);
      }
    }
    poll();
    const timer = setInterval(poll, 2500);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [id]);
  useEffect(() => {
    document.getElementById("chat-end")?.scrollIntoView({ block: "nearest" });
  }, [messages]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const m = await api("/projects/" + id + "/messages", {
        method: "POST",
        body: { text },
      });
      setMessages((old) =>
        old.some((x) => x.id === m.id) ? old : [...old, m],
      );
      setText("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel chat-room">
      <header>
        <div>
          <h3>Project conversation</h3>
          <span className="small-note">
            <Lock size={12} />
            Encrypted at rest · visible to project members
          </span>
        </div>
        <Link
          className="icon-link"
          to={"/workspace/" + id}
          aria-label="Open project workspace"
        >
          <ArrowUpRight size={20} />
        </Link>
      </header>
      <div className="chat-messages">
        {!messages.length && (
          <Empty
            title="One hello can change everything."
            text="Start your project conversation."
          />
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={"message " + (m.user_id === user.id ? "mine" : "")}
          >
            <small>
              {m.name} ·{" "}
              {new Date(m.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
            <p>{m.text}</p>
          </div>
        ))}
        <div id="chat-end" />
      </div>
      <ErrorBox error={error} />
      <form onSubmit={submit} className="chat-compose">
        <input
          aria-label="Your message"
          placeholder="Share a thought…"
          required
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button
          variant="primary"
          disabled={busy || !text.trim()}
          aria-label="Send message"
        >
          <Send size={18} />
        </Button>
      </form>
    </section>
  );
}
function Workspace() {
  const { id } = useParams();
  const { data: projects = [], loading, error } = useLoad("/projects", []);
  return (
    <>
      <Heading
        eyebrow="FROM WHAT IF TO WHAT’S NEXT"
        title="Project workspace"
        description="A shared home for the things you’re building together."
      />
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : id ? (
        <ProjectDetail id={id} />
      ) : projects.length ? (
        <div className="idea-list">
          {projects.map((p) => (
            <Link
              to={"/workspace/" + p.id}
              key={p.id}
              className="panel project-card"
            >
              <span className="stat-icon mint">
                <FolderKanban size={24} />
              </span>
              <h2>{p.title}</h2>
              <p>
                {p.milestones.filter((m) => m.done).length} of{" "}
                {p.milestones.length} milestones complete
              </p>
              <div className="progress">
                <span
                  style={{
                    width:
                      (p.milestones.filter((m) => m.done).length /
                        (p.milestones.length || 1)) *
                        100 +
                      "%",
                  }}
                />
              </div>
              <span className="text-link">
                Continue building <ArrowUpRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="Make your first shared space."
          text="Accept a collaboration request to bring your ideas together."
          action={
            <Link className="btn primary" to="/requests">
              Explore invitations
            </Link>
          }
        />
      )}
    </>
  );
}
function ProjectDetail({ id }) {
  const { data: p, loading, error, refresh } = useLoad("/projects/" + id);
  const { toast } = useApp();
  const [title, setTitle] = useState("");
  if (loading && !p) return <Loading />;
  if (!p) return <ErrorBox error={error} />;
  const percent = Math.round(
    (p.milestones.filter((m) => m.done).length / (p.milestones.length || 1)) *
      100,
  );
  return (
    <>
      <Link className="back-link" to="/workspace">
        <ArrowLeft size={16} />
        All projects
      </Link>
      <section className="panel detail-panel">
        <div className="section-head">
          <h2>{p.title}</h2>
          <Link className="btn primary" to={"/chat?project=" + id}>
            <MessageSquare size={16} />
            Open chat
          </Link>
        </div>
        <div className="members">
          {p.members.map((u) => (
            <div key={u.id}>
              <Avatar name={u.name} small />
              {u.name}
            </div>
          ))}
        </div>
        <div className="section-head">
          <h3>Your roadmap</h3>
          <b>{percent}% complete</b>
        </div>
        <div className="progress">
          <span style={{ width: percent + "%" }} />
        </div>
        <div className="milestones">
          {p.milestones.map((m) => (
            <label key={m.id} className={m.done ? "done" : ""}>
              <input
                type="checkbox"
                checked={m.done}
                onChange={async (e) => {
                  try {
                    await api("/milestones/" + m.id, {
                      method: "PATCH",
                      body: { done: e.target.checked },
                    });
                    refresh();
                  } catch (e) {
                    toast(e.message);
                  }
                }}
              />
              <span>{m.title}</span>
              {m.done && <CheckCircle2 size={17} />}
            </label>
          ))}
        </div>
        <form
          className="inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api("/projects/" + id + "/milestones", {
                method: "POST",
                body: { title },
              });
              setTitle("");
              refresh();
            } catch (e) {
              toast(e.message);
            }
          }}
        >
          <input
            aria-label="New milestone"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="The next small step…"
          />
          <Button variant="outline">
            <Plus size={16} />
            Add milestone
          </Button>
        </form>
      </section>
      <div className="section-head">
        <h2>Ideas, unlocked.</h2>
        <span className="privacy-tag">
          <Lock size={13} />
          Shared in confidence
        </span>
      </div>
      <div className="idea-list">
        {p.ideas.map((i) => (
          <section className="panel detail-panel" key={i.id}>
            <Category value={i.category} />
            <h2>{i.title}</h2>
            <p className="muted">By {i.author}</p>
            <p className="private-description">{i.private_description}</p>
            <div className="tags">
              {i.technologies.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
function Assistant() {
  const { data: ideas = [], loading } = useLoad("/ideas", []);
  const [selected, setSelected] = useState(""),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (ideas.length && !selected) setSelected(String(ideas[0].id));
  }, [ideas, selected]);
  return (
    <>
      <Heading
        eyebrow="A LITTLE HELP FOR YOUR BIG IDEA"
        title="Meet your thinking partner."
        description="Turn a spark into a plan, with titles, features, a tech stack, and a roadmap."
      />
      <div className="assistant-hero">
        <span className="assistant-symbol">
          <Sparkles size={38} />
        </span>
        <div>
          <h2>From a blank page to a clear direction.</h2>
          <p>Choose an idea. Let’s see what it could become.</p>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : !ideas.length ? (
        <Empty
          title="Give your assistant something to imagine."
          action={
            <Link className="btn primary" to="/ideas/new">
              Create an idea
            </Link>
          }
        />
      ) : (
        <>
          <form
            className="panel assistant-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                setResult(
                  await api("/assistant", {
                    method: "POST",
                    body: { idea_id: Number(selected) },
                  }),
                );
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Choose your idea
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {ideas.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="primary" disabled={busy}>
              {busy ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <Sparkles size={17} />
              )}
              {busy ? "Connecting the dots…" : "Generate a project plan"}
            </Button>
          </form>
          <ErrorBox error={error} />
          {result && (
            <>
              <p className="small-note">
                Generated with {result.provider}. Suggestions are a starting
                point for your own decisions. Only your public summary is sent
                to Claude when configured.
              </p>
              <div className="assistant-results">
                {[
                  ["titles", "A name to grow into", Lightbulb],
                  ["features", "Make it meaningful", Layers],
                  ["tech_stack", "The building blocks", Command],
                  ["roadmap", "Your path forward", FolderKanban],
                ].map(([key, label, Icon]) => (
                  <section className="panel detail-panel" key={key}>
                    <span className="stat-icon mint">
                      <Icon size={21} />
                    </span>
                    <h2>{label}</h2>
                    <ol>
                      {result.result[key].map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
function Profile() {
  const { data, loading, error } = useLoad("/profile");
  const { toast } = useApp();
  const [form, setForm] = useState(null),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  useEffect(() => {
    if (data)
      setForm({
        ...data,
        skills: data.skills.join(", "),
        interests: data.interests.join(", "),
        technologies: data.technologies.join(", "),
      });
  }, [data]);
  const set = (k, v) => setForm({ ...form, [k]: v });
  if (error && !form)
    return (
      <>
        <Heading title="Profile unavailable" />
        <ErrorBox error={error} />
        <Link className="btn outline" to="/dashboard">
          Return to overview
        </Link>
      </>
    );
  return (
    <>
      <Heading
        eyebrow="WHAT YOU BRING TO THE TABLE"
        title="A little about you."
        description="Help the right people find you — beyond a job title or a résumé."
      />
      <ErrorBox error={error} />
      {(loading || !form) && !error ? (
        <Loading />
      ) : (
        <form
          className="panel form-panel narrow"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api("/profile", {
                method: "PUT",
                body: {
                  ...form,
                  skills: tags(form.skills),
                  interests: tags(form.interests),
                  technologies: tags(form.technologies),
                },
              });
              toast("Profile saved. Your next connection starts here.");
            } catch (e) {
              setErr(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {[
            ["skills", "Your skills", "Python, React, UI/UX"],
            [
              "interests",
              "What interests you",
              "Agriculture, AI/ML, Healthcare",
            ],
            [
              "technologies",
              "Preferred technologies",
              "FastAPI, TensorFlow, PostgreSQL",
            ],
          ].map(([k, label, ph]) => (
            <label key={k}>
              {label}
              <input
                value={form[k]}
                onChange={(e) => set(k, e.target.value)}
                placeholder={ph}
              />
              <small>Separate items with commas.</small>
            </label>
          ))}
          <label>
            Experience
            <select
              value={form.experience}
              onChange={(e) => set("experience", e.target.value)}
            >
              {[
                "Student",
                "Beginner",
                "Intermediate",
                "Experienced",
                "Researcher",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            What would you love to build together?
            <textarea
              rows={4}
              maxLength={2000}
              value={form.goals}
              onChange={(e) => set("goals", e.target.value)}
              placeholder="Your collaboration goals, curiosity, and ambitions…"
            />
          </label>
          <ErrorBox error={err} />
          <Button variant="primary" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
            <Check size={16} />
          </Button>
        </form>
      )}
    </>
  );
}
function SettingsPage() {
  const { data, loading, error, refresh } = useLoad("/profile");
  const { toast, setUser } = useApp();
  const [password, setPassword] = useState(""),
    [old, setOld] = useState(""),
    [err, setErr] = useState("");
  const navigate = useNavigate();
  async function toggle(k, v) {
    try {
      await api("/profile", { method: "PUT", body: { ...data, [k]: v } });
      refresh();
      toast("Preference saved");
    } catch (e) {
      toast(e.message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="ALWAYS IN YOUR HANDS"
        title="Settings & privacy"
        description="Set your boundaries. Make this space your own."
      />
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : !data ? null : (
        <div className="settings-layout">
          <section className="panel detail-panel">
            <h2>Seen on your terms.</h2>
            <div className="setting-row">
              <div>
                <b>Discoverable profile</b>
                <p>Include your ideas in other members’ AI matches.</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  aria-label="Discoverable profile"
                  checked={data.visible}
                  onChange={(e) => toggle("visible", e.target.checked)}
                />
                <span />
              </label>
            </div>
            <div className="setting-row">
              <div>
                <b>In-app notifications</b>
                <p>Know when someone invites you or accepts your request.</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  aria-label="In-app notifications"
                  checked={data.notifications_enabled}
                  onChange={(e) =>
                    toggle("notifications_enabled", e.target.checked)
                  }
                />
                <span />
              </label>
            </div>
            <div className="setting-row">
              <div>
                <b>Mutual consent, always</b>
                <p>
                  Full ideas and chat are available only after both members
                  agree.
                </p>
              </div>
              <ShieldCheck size={24} />
            </div>
            <Link className="text-link" to="/profile">
              Edit skills & profile <ArrowUpRight size={16} />
            </Link>
          </section>
          <form
            className="panel form-panel"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/auth/change-password", {
                  method: "POST",
                  body: { current_password: old, password },
                });
                setUser(null);
                navigate("/login");
                toast("Password changed. Please sign in again.");
              } catch (e) {
                setErr(e.message);
              }
            }}
          >
            <h2>A fresh password.</h2>
            <label>
              Current password
              <input
                type="password"
                required
                value={old}
                onChange={(e) => setOld(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label>
              New password
              <input
                type="password"
                required
                minLength={10}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <small>Use at least 10 characters.</small>
            </label>
            <ErrorBox error={err} />
            <Button variant="primary">
              Update password <Lock size={15} />
            </Button>
          </form>
          <section className="panel detail-panel">
            <ShieldCheck size={28} />
            <h2>A thoughtful layer of protection.</h2>
            <p>
              Your screen is watermarked and content is protected against casual
              copying and printing. Browsers cannot fully prevent screenshots,
              cameras, or determined copying. Mutual consent, traceable
              watermarks, and confidentiality terms work together.
            </p>
            <Link className="text-link" to="/terms">
              Read our Terms & Conditions <ArrowUpRight size={16} />
            </Link>
          </section>
          <section className="panel detail-panel">
            <h2>See you again soon.</h2>
            <p>Signing out revokes your current sessions across devices.</p>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await api("/auth/logout", { method: "POST" });
                  setUser(null);
                  navigate("/login", {
                    replace: true,
                    state: { from: "/dashboard" },
                  });
                  toast("You’re signed out. Sign in whenever you’re ready.");
                } catch (e) {
                  toast(e.message);
                }
              }}
            >
              <LogOut size={16} />
              Sign out
            </Button>
          </section>
        </div>
      )}
    </>
  );
}
function Admin() {
  const { user, toast } = useApp();
  const { data: stats, refresh: rs, error } = useLoad("/admin/stats");
  const { data: users = [], refresh: ru } = useLoad("/admin/users", []);
  const { data: reports = [], refresh: rr } = useLoad("/admin/reports", []);
  if (user.role !== "admin")
    return <Empty title="This space is for moderators." />;
  return (
    <>
      <Heading
        eyebrow="A HEALTHIER SPACE FOR IDEAS"
        title="Admin dashboard"
        description="People, moderation, and a view of the community."
      />
      <ErrorBox error={error} />
      <div className="stats-grid">
        {Object.entries(stats || {}).map(([k, v]) => (
          <div className="stat-card" key={k}>
            <span className="stat-label">{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <section className="panel detail-panel">
        <h2>Community members</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.suspended ? "Suspended" : "Active"}</td>
                  <td>
                    {u.role !== "admin" && (
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            await api("/admin/users/" + u.id, {
                              method: "PATCH",
                              body: { suspended: !u.suspended },
                            });
                            ru();
                            toast("Account updated");
                          } catch (e) {
                            toast(e.message);
                          }
                        }}
                      >
                        {u.suspended ? "Reinstate" : "Suspend"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel detail-panel">
        <h2>Moderation queue</h2>
        {!reports.length ? (
          <Empty title="No reports to review." />
        ) : (
          reports.map((r) => (
            <div className="report-row" key={r.id}>
              <div>
                <b>
                  Report #{r.id} · {r.status}
                </b>
                <p>{r.reason}</p>
                <small>
                  Idea: {r.idea_id || "none"} · Account:{" "}
                  {r.reported_user_id || "none"}
                </small>
              </div>
              {r.status === "open" && (
                <div className="button-row">
                  {["remove", "dismiss"].map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      onClick={async () => {
                        try {
                          await api("/admin/reports/" + r.id, {
                            method: "PATCH",
                            body: { action },
                          });
                          rr();
                          ru();
                          rs();
                          toast("Report reviewed");
                        } catch (e) {
                          toast(e.message);
                        }
                      }}
                    >
                      {action === "remove" ? "Remove / suspend" : "Dismiss"}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </>
  );
}
function Landing() {
  const { user } = useApp();
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Network size={25} />
          </span>
          <span>
            idea<span className="brand-light">merger</span>
          </span>
        </Link>
        <nav>
          <a href="#how-it-works">How it works</a>
          <a href="#privacy">Built on trust</a>
          <Link to="/terms">Our terms</Link>
        </nav>
        <div>
          <Link className="btn ghost landing-signin" to="/login">
            Sign in
          </Link>
          <Link className="btn primary" to={user ? "/dashboard" : "/register"}>
            <span className="landing-cta-desktop">
              {user ? "My workspace" : "Find your people"}
            </span>
            <span className="landing-cta-mobile">
              {user ? "Workspace" : "Get started"}
            </span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div>
            <span className="eyebrow">
              <span className="tiny-dot" /> BIG THINGS START WITH A SHARED WHAT
              IF.
            </span>
            <h1>
              Your idea.
              <br />
              Their perspective.
              <br />
              <em>Something bigger.</em>
            </h1>
            <p>
              A meeting place for curious minds. Find people with ideas that
              connect with yours, skills that complement you, and the same itch
              to build something meaningful.
            </p>
            <div className="button-row">
              <Link
                className="btn primary"
                to={user ? "/dashboard" : "/register"}
              >
                Let’s build something <ArrowUpRight size={18} />
              </Link>
              <a className="btn outline" href="#how-it-works">
                See how it works <ArrowRight size={17} />
              </a>
            </div>
            <div className="landing-proof">
              <div className="avatar-stack">
                {[
                  "Alex Morgan",
                  "Priya Sharma",
                  "Daniel Kim",
                  "Sofia Chen",
                ].map((n, i) => (
                  <Avatar key={n} name={n} small color={"color-" + i} />
                ))}
              </div>
              <span>Different minds. Shared possibilities.</span>
            </div>
          </div>
          <div className="landing-visual">
            <div className="landing-grid" />
            <span className="landing-star">✳</span>
            <div className="floating-idea fi1">
              <span className="stat-icon peach">
                <Lightbulb size={25} />
              </span>
              <small>ONE GOOD IDEA</small>
              <h3>
                What if farming
                <br />
                could be smarter?
              </h3>
              <div className="tags">
                <span>Agriculture</span>
                <span>AI/ML</span>
              </div>
            </div>
            <div className="landing-match">
              <Sparkles size={17} /> A shared direction <b>Let’s explore ↗</b>
            </div>
            <div className="floating-idea fi2">
              <div className="invitation-author">
                <Avatar name="Priya Sharma" color="color-1" />
                <div>
                  <b>A complementary mind</b>
                  <small>Machine learning · Python</small>
                </div>
              </div>
              <p>“I’ve been thinking about this too.”</p>
              <span className="connected">
                <CheckCircle2 size={15} />
                Possibility, meet potential.
              </span>
            </div>
            <div className="landing-secure">
              <ShieldCheck size={16} />
              Your full idea stays private.
            </div>
          </div>
        </section>
        <section className="landing-how" id="how-it-works">
          <div className="eyebrow">LESS SCROLLING. MORE BUILDING.</div>
          <h2>
            The right connection
            <br />
            changes everything.
          </h2>
          <div className="landing-steps">
            {[
              [
                "01",
                Lightbulb,
                "Start with your spark.",
                "Share a public summary of your idea. Keep the details that make it yours private.",
              ],
              [
                "02",
                Sparkles,
                "Find a shared direction.",
                "Our AI connects the meaning behind ideas, then considers skills and technologies.",
              ],
              [
                "03",
                Users,
                "Say yes. Build together.",
                "Both agree to collaborate. Unlock your full ideas, private chat, and project workspace.",
              ],
            ].map(([n, Icon, t, d]) => (
              <article key={n}>
                <span className="step-no">{n}</span>
                <Icon size={29} />
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-privacy" id="privacy">
          <ShieldCheck size={58} strokeWidth={1} />
          <div>
            <span className="eyebrow">YOUR TRUST IS THE FOUNDATION</span>
            <h2>
              Share the spark.
              <br />
              Protect the substance.
            </h2>
            <p>
              You own your ideas. You control what’s visible. Full details
              unlock only when both people explicitly agree. Every idea is
              timestamped, and every shared space is private.
            </p>
            <Link className="btn lime" to="/register">
              Find your next collaborator <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Link className="brand" to="/">
          idea<span className="brand-light">merger</span>
        </Link>
        <span>A little AI. A lot of possibility.</span>
        <Link to="/terms">Terms & conditions</Link>
      </footer>
    </div>
  );
}
const terms = [
  [
    "Your ideas belong to you.",
    "You retain ownership of every idea you submit. A match, request, or collaboration does not transfer ownership or grant another person permission to reuse your intellectual property.",
  ],
  [
    "Mutual consent comes first.",
    "Only your selected public information is visible before acceptance. Sending a request records your consent to share your full idea if the invited member accepts. Accepting records their consent. Full ideas, chats, and files shared after acceptance are confidential.",
  ],
  [
    "Protect what others share.",
    "Copying, screenshotting, scraping, forwarding, publishing, or reusing another member’s ideas or confidential material without their written permission is prohibited. Agree separately in writing on any joint ownership, licensing, or commercialization.",
  ],
  [
    "Be honest and lawful.",
    "Do not submit unlawful, fake, infringing, abusive, or inappropriate content. Do not impersonate another person, create fake accounts, send spam, or claim someone else’s work.",
  ],
  [
    "Recommendations are a starting point.",
    "Matches, compatibility scores, and AI suggestions are recommendations only. They do not guarantee success, originality, accuracy, safety, or a suitable partnership. Evaluate collaborators and suggestions independently.",
  ],
  [
    "Security and moderation.",
    "Activity may be logged for security and moderation. Submissions have timestamps, screens may display traceable user watermarks, and reports may be reviewed by administrators. Accounts that violate these terms may be suspended and reported ideas may be removed from discovery.",
  ],
  [
    "Browser protection has limits.",
    "Copy, print, and focus deterrents reduce casual disclosure but cannot fully prevent screenshots, external cameras, or determined copying. Keep sensitive details out of public summaries and share responsibly.",
  ],
  [
    "Acceptance is recorded.",
    "Registration requires explicit acceptance. We record your account ID, terms version, and acceptance timestamp. Version: 26 October 2026.",
  ],
];
function Terms() {
  return (
    <div className="terms-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} />
        Idea Merger
      </Link>
      <span className="eyebrow">A SHARED FOUNDATION</span>
      <h1>
        Good ideas deserve
        <br />
        good boundaries.
      </h1>
      <p className="large-body">Terms & Conditions · Version 26 October 2026</p>
      {terms.map(([t, d], i) => (
        <section key={t}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          <div>
            <h2>{t}</h2>
            <p>{d}</p>
          </div>
        </section>
      ))}
      <p className="small-note">
        This project includes baseline platform terms. Operators should have
        their own legal counsel review the terms and privacy notices before a
        public launch.
      </p>
      <Link className="btn primary" to="/register">
        Create your account <ArrowUpRight size={17} />
      </Link>
    </div>
  );
}
function Auth({ mode }) {
  const { user, setUser, toast } = useApp(),
    navigate = useNavigate(),
    location = useLocation();
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [accept, setAccept] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  const register = mode === "register",
    forgot = mode === "forgot",
    reset = mode === "reset";
  useEffect(() => {
    setError("");
    setDone(false);
  }, [mode]);
  const returnTo = resolveReturnPath(location.state?.from);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (forgot) {
        await api("/auth/forgot-password", { method: "POST", body: { email } });
        setDone(true);
      } else if (reset) {
        await api("/auth/reset-password", {
          method: "POST",
          body: {
            token: new URLSearchParams(location.search).get("token") || "",
            password,
          },
        });
        setUser(null);
        setDone(true);
      } else {
        const data = await api("/auth/" + (register ? "register" : "login"), {
          method: "POST",
          body: register
            ? { name, email, password, accept_terms: accept }
            : { email, password },
        });
        let session;
        try {
          session = await api("/auth/me");
        } catch (sessionError) {
          if (sessionError.status === 401)
            throw new Error(
              "Your browser did not retain the sign-in session. Enable cookies for this site and use the same website address throughout sign-in.",
            );
          throw sessionError;
        }
        if (session.id !== data.user.id)
          throw new Error(
            "Your sign-in session changed in another tab. Please try again.",
          );
        setUser(session);
        navigate(register ? "/profile" : returnTo, { replace: true });
        toast(register ? "Welcome. Let’s find your people." : "Welcome back.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Network size={25} />
          </span>
          <span>
            idea<span className="brand-light">merger</span>
          </span>
        </Link>
        <div>
          <span className="hero-pill">
            <Sparkles size={14} /> FOR THE WHAT-IF PEOPLE
          </span>
          <h1>
            Good ideas
            <br />
            deserve
            <br />
            <em>great company.</em>
          </h1>
          <p>
            Your next teammate might be thinking
            <br />
            about the same thing you are.
          </p>
          <div className="auth-orbit">
            <Network size={90} strokeWidth={1} />
            <span>✳</span>
          </div>
        </div>
        <span className="small-note">
          <ShieldCheck size={16} />
          Your ideas. Your ownership. Always.
        </span>
      </aside>
      <main className="auth-main">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} />
          Back to home
        </Link>
        <div className="auth-form">
          <span className="eyebrow">
            {forgot || reset
              ? "A FRESH START"
              : register
                ? "MAKE ROOM FOR POSSIBILITY"
                : "YOUR IDEAS MISSED YOU"}
          </span>
          <h1>
            {forgot
              ? "Forgot your password?"
              : reset
                ? "Choose a new password."
                : register
                  ? "Find your people."
                  : "Welcome back."}
          </h1>
          <p>
            {forgot
              ? "We’ll email you a secure link to reset it."
              : reset
                ? "A new password for your next chapter."
                : register
                  ? "Create a space for the things you want to build."
                  : "Let’s pick up where your curiosity left off."}
          </p>
          {user && !forgot && !reset && (
            <div className="signed-in-note">
              <p>
                You’re currently signed in as <strong>{user.name}</strong>.
              </p>
              <Link to={returnTo}>
                Continue to workspace <ArrowRight size={14} />
              </Link>
              <small>
                Use the form below to sign in again or switch accounts.
              </small>
            </div>
          )}
          {done ? (
            <div className="panel success-panel">
              <CheckCircle2 size={31} />
              <h3>{reset ? "Password updated." : "Check your email."}</h3>
              <p>
                {reset
                  ? "Sign in with your new password."
                  : "If an account exists, a reset email is on its way. For local development, the message is saved in backend/dev-mail."}
              </p>
              <Link className="btn primary" to="/login">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form className="form-panel" onSubmit={submit}>
              {register && (
                <label>
                  Your name
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    autoComplete="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                  />
                </label>
              )}
              {!reset && (
                <label>
                  Email address
                  <input
                    type="email"
                    required
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
              )}
              {!forgot && (
                <label>
                  Password
                  <input
                    type="password"
                    required
                    minLength={register || reset ? 10 : 1}
                    maxLength={72}
                    value={password}
                    autoComplete={
                      register || reset ? "new-password" : "current-password"
                    }
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      register ? "At least 10 characters" : "Your password"
                    }
                  />
                  {register && (
                    <small>
                      Use a unique password of at least 10 characters.
                    </small>
                  )}
                </label>
              )}
              {register && (
                <>
                  <div
                    className="registration-terms"
                    tabIndex={0}
                    aria-label="Terms summary"
                  >
                    <b>Your ideas, respected.</b>
                    <p>
                      You keep ownership of your ideas. Content shared after
                      acceptance is confidential. Copying, screenshotting,
                      scraping, forwarding, or reuse without written permission
                      is prohibited. No unlawful or fake content.
                      Recommendations are advisory. Activity may be logged;
                      violations may lead to suspension.
                    </p>
                    <Link to="/terms" target="_blank">
                      Read all Terms & Conditions <ExternalLink size={12} />
                    </Link>
                  </div>
                  <label className="checkbox-label">
                    <input
                      required
                      type="checkbox"
                      checked={accept}
                      onChange={(e) => setAccept(e.target.checked)}
                    />
                    <span>
                      I have read and accept the{" "}
                      <Link to="/terms" target="_blank">
                        Terms & Conditions
                      </Link>
                      .
                    </span>
                  </label>
                </>
              )}
              {!register && !forgot && !reset && (
                <Link className="forgot-link" to="/forgot-password">
                  Forgot password?
                </Link>
              )}
              <ErrorBox error={error} />
              <Button variant="primary full" disabled={busy}>
                {busy ? <LoaderCircle size={17} className="spin" /> : null}
                {busy
                  ? "Just a moment…"
                  : forgot
                    ? "Send reset link"
                    : reset
                      ? "Update password"
                      : register
                        ? "Create my account"
                        : "Sign in"}
                {!busy && <ArrowUpRight size={17} />}
              </Button>
            </form>
          )}
          {!forgot && !reset && (
            <p className="auth-switch">
              {register ? "Already found us?" : "New around here?"}{" "}
              <Link to={register ? "/login" : "/register"}>
                {register ? "Sign in" : "Create an account"}
              </Link>
            </p>
          )}
          {import.meta.env.VITE_SHOW_DEMO_LOGIN !== "false" &&
            !register &&
            !forgot &&
            !reset && (
              <div className="demo-box">
                <span className="eyebrow">EXPLORE THE DEMO</span>
                <p>
                  Demo member: <b>alex@ideamerger.demo</b>
                  <br />
                  Password: <b>BuildTogether!2026</b>
                </p>
                <button
                  className="text-button"
                  onClick={() => {
                    setEmail("alex@ideamerger.demo");
                    setPassword("BuildTogether!2026");
                  }}
                >
                  Fill demo credentials <ArrowRight size={14} />
                </button>
              </div>
            )}
        </div>
        <small className="auth-bottom">
          A little AI. A lot of possibility.
        </small>
      </main>
    </div>
  );
}
function RequireAuth({ children }) {
  const { user } = useApp();
  const location = useLocation();
  return user ? (
    children
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search + location.hash }}
    />
  );
}
function App() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState(""),
    [connectionError, setConnectionError] = useState(""),
    [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  const checkSession = useCallback(async () => {
    setConnectionError("");
    try {
      setUser(await api("/auth/me"));
    } catch (error) {
      setUser(null);
      if (error.status !== 401) setConnectionError(error.message);
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    checkSession();
  }, [checkSession]);
  useEffect(() => {
    const expired = () => {
      setUser(null);
      setNotice("Your session expired. Please sign in again.");
    };
    window.addEventListener("aim:session-expired", expired);
    return () => window.removeEventListener("aim:session-expired", expired);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  if (!ready) return <Loading />;
  return (
    <AppContext.Provider
      value={{ user, setUser, toast: setNotice, theme, setTheme }}
    >
      {connectionError && (
        <div className="connection-banner" role="alert">
          <span>{connectionError}</span>
          <button type="button" onClick={checkSession}>
            Retry connection
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/forgot-password" element={<Auth mode="forgot" />} />
        <Route path="/reset-password" element={<Auth mode="reset" />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Shell />
            </RequireAuth>
          }
        />
      </Routes>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="recovery-page">
        <ShieldCheck size={40} />
        <h1>Let's get you back on track.</h1>
        <p>
          The page could not be displayed. Your saved ideas are still on the
          server.
        </p>
        <button
          className="btn primary"
          onClick={() => window.location.assign("/dashboard")}
        >
          Reload workspace
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <AppErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AppErrorBoundary>,
);
