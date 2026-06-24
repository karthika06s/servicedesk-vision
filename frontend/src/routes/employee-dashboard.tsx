import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  FolderKanban,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getProjects, type ProjectRecord, type TaskRecord } from "@/lib/api/projects";
import { sendTaskMailReply } from "@/lib/api/task-mails";
import { ChatAssistant } from "@/components/ChatAssistant";

export const Route = createFileRoute("/employee-dashboard")({
  head: () => ({
    meta: [
      { title: "Employee Dashboard | ServiceDesk Pro" },
      {
        name: "description",
        content: "View assigned projects, tasks, project history, and team members.",
      },
    ],
  }),
  component: EmployeeDashboard,
});

type RecordItem = {
  id: number;
  name: string;
  detail: string;
  status: string;
  owner: string;
  publicId?: string;
  projectId?: number;
  employeeId?: number;
  employeeIds?: number[];
};

type Store = {
  clients: RecordItem[];
  projects: RecordItem[];
  tasks: RecordItem[];
  employees: RecordItem[];
};

type EmployeeHistory = {
  id: number;
  employeeId: number;
  projectId?: number;
  projectName: string;
  role: string;
  startedOn: string;
  completedOn: string;
  result: string;
  techStack: string[];
  completedTasks: string[];
  timeline: Array<{
    date: string;
    title: string;
    description: string;
  }>;
};

type EmployeeSection = "overview" | "projects" | "tasks" | "team" | "history";
type SharedNotification = {
  id: number;
  text: string;
  createdAt: number;
  audience: Array<"client" | "employee">;
};

const STORE_KEY = "servicedesk_admin_data";
const HISTORY_KEY = "servicedesk_employee_history";
const NOTIFICATION_KEY = "servicedesk_notifications";
const EMPLOYEE_READ_KEY = "servicedesk_employee_notifications_read";
const CURRENT_EMPLOYEE_ID = 2;

const fallbackStore: Store = {
  clients: [],
  projects: [],
  tasks: [],
  employees: [],
};

const fallbackHistory: EmployeeHistory[] = [];

function EmployeeDashboard() {
  const [store, setStore] = useState<Store>(fallbackStore);
  const [history, setHistory] = useState<EmployeeHistory[]>(fallbackHistory);
  const [section, setSection] = useState<EmployeeSection>("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<SharedNotification[]>([]);
  const [readNotifications, setReadNotifications] = useState<number[]>([]);
  const [sessionPublicId, setSessionPublicId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const session = JSON.parse(localStorage.getItem("servicedesk_session") ?? "null") as {
      publicId?: string;
      username?: string;
      role?: string;
    } | null;

    if (!session || session.role !== "employee") {
      window.location.href = "/login";
      return;
    }
    setSessionPublicId(session.publicId ?? "");

    const savedStore = localStorage.getItem(STORE_KEY);
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedStore) {
      const parsed = JSON.parse(savedStore) as Store;
      const normalizedTasks = parsed.tasks.map((task, index) => {
        const existingEmployeeIds =
          task.employeeIds?.length
            ? task.employeeIds
            : [task.employeeId].filter((id): id is number => typeof id === "number");
        const matchedEmployee = parsed.employees.find(
          (employee) =>
            existingEmployeeIds.includes(employee.id) ||
            task.owner
              .split(",")
              .map((name) => name.trim().toLowerCase())
              .includes(employee.name.toLowerCase()),
        );
        const assignedEmployee =
          matchedEmployee ??
          parsed.employees[index % Math.max(parsed.employees.length, 1)];
        const assignedProject =
          parsed.projects.find((project) => project.id === task.projectId) ??
          parsed.projects[index % Math.max(parsed.projects.length, 1)];

        return {
          ...task,
          projectId: assignedProject?.id,
          employeeId: existingEmployeeIds[0] ?? assignedEmployee?.id,
          employeeIds:
            existingEmployeeIds.length
              ? existingEmployeeIds
              :
            [assignedEmployee?.id].filter((id): id is number => typeof id === "number"),
          owner: task.employeeIds?.length ? task.owner : assignedEmployee?.name ?? task.owner,
        };
      });
      const normalizedStore = { ...parsed, tasks: normalizedTasks };
      setStore(normalizedStore);
      localStorage.setItem(STORE_KEY, JSON.stringify(normalizedStore));
    } else {
      setStore(fallbackStore);
      localStorage.setItem(STORE_KEY, JSON.stringify(fallbackStore));
    }
    getProjects()
      .then((projects) => {
        if (!active) return;
        setStore((current) => {
          const next = mergeProjectsIntoStore(current, projects);
          localStorage.setItem(STORE_KEY, JSON.stringify(next));
          return next;
        });
      })
      .catch(() => undefined);
    const reloadProjects = () => {
      getProjects()
        .then((projects) => {
          if (!active) return;
          setStore((current) => {
            const next = mergeProjectsIntoStore(current, projects);
            localStorage.setItem(STORE_KEY, JSON.stringify(next));
            return next;
          });
        })
        .catch(() => undefined);
    };
    window.addEventListener("servicedesk-chatbot-data-changed", reloadProjects);
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory) as Partial<EmployeeHistory>[];
      const migrated = fallbackHistory.length
        ? parsed.map((entry, index) => {
        const fallback =
          fallbackHistory.find((item) => item.id === entry.id) ??
          fallbackHistory[index % fallbackHistory.length];
        return {
          ...fallback,
          ...entry,
          startedOn: entry.startedOn ?? fallback.startedOn,
          techStack: entry.techStack ?? fallback.techStack,
          completedTasks: entry.completedTasks ?? fallback.completedTasks,
          timeline: entry.timeline ?? fallback.timeline,
        } as EmployeeHistory;
      })
        : [];
      setHistory(migrated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(migrated));
    } else {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(fallbackHistory));
    }
    const loadNotifications = () => {
      const saved = JSON.parse(
        localStorage.getItem(NOTIFICATION_KEY) ?? "[]",
      ) as SharedNotification[];
      setNotifications(saved.filter((item) => item.audience.includes("employee")));
      setReadNotifications(
        JSON.parse(localStorage.getItem(EMPLOYEE_READ_KEY) ?? "[]") as number[],
      );
    };
    loadNotifications();
    window.addEventListener("storage", loadNotifications);
    window.addEventListener("servicedesk-notifications-updated", loadNotifications);
    setReady(true);
    return () => {
      active = false;
      window.removeEventListener("storage", loadNotifications);
      window.removeEventListener("servicedesk-notifications-updated", loadNotifications);
      window.removeEventListener("servicedesk-chatbot-data-changed", reloadProjects);
    };
  }, []);

  const unreadNotifications = notifications.filter(
    (notification) => !readNotifications.includes(notification.id),
  );

  function markNotificationsRead() {
    const ids = notifications.map((notification) => notification.id);
    setReadNotifications(ids);
    localStorage.setItem(EMPLOYEE_READ_KEY, JSON.stringify(ids));
  }

  const employee =
    store.employees.find((item) => item.id === CURRENT_EMPLOYEE_ID) ??
    store.employees[0] ?? {
      id: 0,
      name: "Employee",
      detail: "",
      status: "Active",
      owner: "",
      publicId: sessionPublicId,
    };
  const directlyAssignedTasks = store.tasks.filter(
    (task) => taskIncludesEmployee(task, employee),
  );
  const employeeTasks =
    directlyAssignedTasks.length > 0 ? directlyAssignedTasks : store.tasks;
  const enrolledProjects = store.projects;
  const currentProjects = store.projects.filter(
    (project) => project.status !== "Completed",
  );
  const projectTeamIds = new Set(
    store.tasks
      .filter((task) => currentProjects.some((project) => project.id === task.projectId))
      .flatMap(getTaskEmployeeIds),
  );
  const projectTeam = store.employees.filter((member) => projectTeamIds.has(member.id));

  function navigate(next: EmployeeSection) {
    setSection(next);
    setSelectedProjectId(null);
    setSearch("");
    setMobileOpen(false);
  }

  function openProject(projectId: number) {
    setSelectedProjectId(projectId);
    setSection("projects");
    setSearch("");
  }

  function logout() {
    localStorage.removeItem("servicedesk_session");
    window.location.href = "/login";
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      </div>
    );
  }

  const selectedProject =
    enrolledProjects.find((project) => project.id === selectedProjectId) ?? null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <EmployeeSidebar
        section={section}
        dashboardOpen={dashboardOpen}
        mobileOpen={mobileOpen}
        onDashboardToggle={() => setDashboardOpen((open) => !open)}
        onNavigate={navigate}
        onClose={() => setMobileOpen(false)}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-slate-200 bg-white px-5 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu />
          </button>

          <div className="relative max-w-lg flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assigned projects, tasks, team..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationOpen((open) => !open);
                  setProfileOpen(false);
                }}
                className={`relative rounded-full p-2 transition ${
                  unreadNotifications.length
                    ? "bg-red-50 text-red-600"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
                aria-label="Notifications"
                aria-expanded={notificationOpen}
              >
                <Bell
                  size={22}
                  className={unreadNotifications.length ? "notification-ring" : ""}
                  fill={unreadNotifications.length ? "currentColor" : "none"}
                />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <EmployeeNotificationDropdown
                  notifications={notifications}
                  readIds={readNotifications}
                  tasks={employeeTasks}
                  projects={store.projects}
                  onClose={() => setNotificationOpen(false)}
                  onMarkRead={markNotificationsRead}
                />
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setProfileOpen((open) => !open)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                <UserRound size={22} />
              </button>
              {profileOpen && (
                <>
                  <button
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setProfileOpen(false)}
                    aria-label="Close profile menu"
                  />
                  <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <div className="font-semibold text-slate-900">{employee.name}</div>
                      <div className="mt-1 text-sm text-slate-500">Employee · {employee.owner}</div>
                      {(employee.publicId ?? sessionPublicId) && (
                        <div className="mt-1 text-xs font-semibold text-blue-600">
                          {employee.publicId ?? sessionPublicId}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="p-5 lg:p-8">
          {section === "overview" && (
            <EmployeeOverview
              employee={employee}
              projects={currentProjects}
              tasks={employeeTasks}
              team={projectTeam}
              sessionPublicId={sessionPublicId}
              onNavigate={navigate}
              onProject={openProject}
            />
          )}
          {section === "projects" &&
            (selectedProject ? (
              <EmployeeProjectDetails
                project={selectedProject}
                personalTasks={employeeTasks.filter(
                  (task) => task.projectId === selectedProject.id,
                )}
                allProjectTasks={store.tasks.filter(
                  (task) => task.projectId === selectedProject.id,
                )}
                employees={store.employees}
                onBack={() => setSelectedProjectId(null)}
              />
            ) : (
              <EmployeeProjects
                projects={enrolledProjects}
                tasks={employeeTasks}
                search={search}
                onView={openProject}
              />
            ))}
          {section === "tasks" && (
            <EmployeeTasks
              tasks={employeeTasks}
              projects={store.projects}
              search={search}
            />
          )}
          {section === "team" && (
            <EmployeeTeam
              employees={projectTeam}
              tasks={store.tasks}
              projects={currentProjects}
              search={search}
            />
          )}
          {section === "history" && (
            <EmployeeHistoryPanel
              history={history.filter((entry) => entry.employeeId === employee.id)}
            />
          )}
        </main>
      </div>
      <ChatAssistant role="employee" />
    </div>
  );
}

function EmployeeNotificationDropdown({
  notifications,
  readIds,
  tasks,
  projects,
  onClose,
  onMarkRead,
}: {
  notifications: SharedNotification[];
  readIds: number[];
  tasks: RecordItem[];
  projects: RecordItem[];
  onClose: () => void;
  onMarkRead: () => void;
}) {
  return (
    <>
      <button
        className="fixed inset-0 z-40 cursor-default"
        onClick={onClose}
        aria-label="Close notifications"
      />
      <div className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="font-semibold text-slate-900">Notifications</div>
          <button onClick={onMarkRead} className="text-xs font-semibold text-blue-600">
            Mark all read
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((notification) => {
            const task = findTaskForNotification(notification, tasks);
            const project = task
              ? projects.find((item) => item.id === task.projectId) ?? null
              : null;

            return (
              <div
                key={notification.id}
                className={`border-b border-slate-100 px-4 py-4 ${
                  readIds.includes(notification.id) ? "bg-white" : "bg-red-50/60"
                }`}
              >
                <p className="text-sm leading-relaxed text-slate-700">{notification.text}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
                {task && project && (
                  <NotificationReplyAction task={task} project={project} />
                )}
              </div>
            );
          })}
          {!notifications.length && (
            <div className="p-8 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function findTaskForNotification(notification: SharedNotification, tasks: RecordItem[]) {
  const match = notification.text.match(/Task\s+"([^"]+)"/i);
  if (!match) {
    return null;
  }

  const taskName = match[1].trim().toLowerCase();
  return tasks.find((task) => task.name.trim().toLowerCase() === taskName) ?? null;
}

function NotificationReplyAction({ task, project }: { task: RecordItem; project: RecordItem }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function submitReply() {
    setStatus("");

    if (!recipientEmail.trim() || !message.trim()) {
      setStatus("Enter recipient email and reply message.");
      return;
    }

    setIsSending(true);
    try {
      const reply = await sendTaskMailReply({
        taskId: task.id,
        recipientEmail: recipientEmail.trim(),
        subject: `Task reply: ${task.name}`,
        message: message.trim(),
      });
      setStatus(reply.deliveryStatus === "SENT" ? "Mail sent." : "Reply saved for this task.");
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send reply.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setReplyOpen((open) => !open)}
        className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
      >
        Reply to assigned task
      </button>

      {replyOpen && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <input
            type="email"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            placeholder="Recipient email"
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            {project.name} / {task.name}
          </div>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write your reply"
            className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">{status}</p>
            <button
              type="button"
              disabled={isSending}
              onClick={submitReply}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSending ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function mergeProjectsIntoStore(store: Store, projects: ProjectRecord[]): Store {
  return {
    ...store,
    clients: store.clients,
    employees: store.employees,
    projects: projects.map(mapProject),
    tasks: projects.flatMap((project) => project.tasks.map(mapTask)),
  };
}

function mapProject(project: ProjectRecord): RecordItem {
  return {
    id: project.id,
    name: project.name,
    detail: project.detail,
    status: project.status,
    owner: project.owner,
  };
}

function mapTask(task: TaskRecord): RecordItem {
  return {
    id: task.id,
    projectId: task.projectId,
    employeeId: task.employeeId,
    employeeIds: task.employeeIds ?? (task.employeeId ? [task.employeeId] : []),
    name: task.name,
    detail: task.detail,
    status: task.status,
    owner: task.owner,
  };
}

function getTaskEmployeeIds(task: RecordItem) {
  if (task.employeeIds?.length) {
    return task.employeeIds;
  }
  return task.employeeId ? [task.employeeId] : [];
}

function taskIncludesEmployee(task: RecordItem, employee: RecordItem) {
  return (
    getTaskEmployeeIds(task).includes(employee.id) ||
    task.owner.split(",").map((name) => name.trim()).includes(employee.name)
  );
}

function EmployeeSidebar({
  section,
  dashboardOpen,
  mobileOpen,
  onDashboardToggle,
  onNavigate,
  onClose,
}: {
  section: EmployeeSection;
  dashboardOpen: boolean;
  mobileOpen: boolean;
  onDashboardToggle: () => void;
  onNavigate: (section: EmployeeSection) => void;
  onClose: () => void;
}) {
  const entries = [
    { id: "projects" as const, label: "My Projects", icon: FolderKanban },
    { id: "tasks" as const, label: "My Tasks", icon: CheckSquare },
    { id: "team" as const, label: "Project Team", icon: Users },
    { id: "history" as const, label: "Project History", icon: History },
  ];

  return (
    <>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-800 text-slate-200 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-24 items-center gap-4 border-b border-slate-700 px-7">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500 text-xl font-bold text-white">
            SD
          </div>
          <div>
            <div className="text-xl font-bold text-white">ServiceDesk</div>
            <div className="text-sm text-slate-400">Employee Portal</div>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden" aria-label="Close navigation">
            <X />
          </button>
        </div>

        <nav className="space-y-2 py-5">
          <button
            onClick={onDashboardToggle}
            className={`flex w-full items-center gap-3 px-7 py-4 text-left transition hover:bg-slate-700 ${
              section === "overview" ? "bg-slate-700 text-white" : ""
            }`}
          >
            <LayoutDashboard size={20} className="text-blue-400" />
            <span className="font-medium">Dashboard</span>
            {dashboardOpen ? (
              <ChevronDown className="ml-auto" size={18} />
            ) : (
              <ChevronRight className="ml-auto" size={18} />
            )}
          </button>
          {dashboardOpen && (
            <button
              onClick={() => onNavigate("overview")}
              className={`flex w-full items-center gap-3 bg-slate-900/20 py-3 pl-16 pr-6 text-sm ${
                section === "overview"
                  ? "font-semibold text-blue-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Overview
            </button>
          )}

          {entries.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex w-full items-center gap-3 border-l-4 px-7 py-4 text-left transition hover:bg-slate-700 ${
                section === id
                  ? "border-blue-400 bg-slate-700 text-white"
                  : "border-transparent text-slate-300"
              }`}
            >
              <Icon size={20} className="text-blue-400" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

function EmployeeOverview({
  employee,
  projects,
  tasks,
  team,
  sessionPublicId,
  onNavigate,
  onProject,
}: {
  employee: RecordItem;
  projects: RecordItem[];
  tasks: RecordItem[];
  team: RecordItem[];
  sessionPublicId: string;
  onNavigate: (section: EmployeeSection) => void;
  onProject: (projectId: number) => void;
}) {
  const cards = [
    { label: "Current Projects", value: projects.length, color: "bg-blue-500", icon: FolderKanban, target: "projects" as const },
    { label: "Assigned Tasks", value: tasks.length, color: "bg-emerald-500", icon: CheckSquare, target: "tasks" as const },
    { label: "Project Teammates", value: team.length, color: "bg-purple-500", icon: Users, target: "team" as const },
  ];

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Employee workspace</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Welcome, {employee.name}</h1>
        {(employee.publicId ?? sessionPublicId) && (
          <p className="mt-1 text-sm font-semibold text-blue-600">
            ID: {employee.publicId ?? sessionPublicId}
          </p>
        )}
        <p className="mt-2 text-slate-500">View your assignments, progress, teammates, and project history.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {cards.map(({ label, value, color, icon: Icon, target }) => (
          <button key={label} onClick={() => onNavigate(target)} className={`${color} rounded-2xl p-7 text-left text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}>
            <div className="flex items-start justify-between">
              <div><div className="text-4xl font-bold">{value}</div><div className="mt-3 text-lg text-white/90">{label}</div></div>
              <Icon size={30} className="text-white/70" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <StatusCount label="Pending" value={tasks.filter((task) => task.status === "Pending").length} tone="amber" icon={Clock3} />
        <StatusCount label="In Progress" value={tasks.filter((task) => task.status === "In Progress").length} tone="blue" icon={CheckSquare} />
        <StatusCount label="Completed" value={tasks.filter((task) => task.status === "Completed").length} tone="emerald" icon={CheckCircle2} />
      </div>

      <section className="mt-7 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Current Projects</h2>
          <button onClick={() => onNavigate("projects")} className="font-semibold text-blue-600">View all</button>
        </div>
        <EmployeeProjectCards projects={projects} tasks={tasks} onView={onProject} />
      </section>
    </>
  );
}

function StatusCount({ label, value, tone, icon: Icon }: { label: string; value: number; tone: "amber" | "blue" | "emerald"; icon: typeof Clock3 }) {
  const color = tone === "amber" ? "bg-amber-100 text-amber-600" : tone === "blue" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600";
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div><div className="text-3xl font-bold text-slate-900">{value}</div><div className="mt-2 font-medium text-slate-500">{label} Tasks</div></div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}><Icon size={23} /></div>
      </div>
    </div>
  );
}

function EmployeeProjects({ projects, tasks, search, onView }: { projects: RecordItem[]; tasks: RecordItem[]; search: string; onView: (id: number) => void }) {
  const filtered = filterRecords(projects, search);
  return (
    <section>
      <PageHeading title="My Projects" description="Projects you are currently enrolled in or have assigned work for." />
      <div className="rounded-2xl bg-white p-6 shadow-sm"><EmployeeProjectCards projects={filtered} tasks={tasks} onView={onView} /></div>
    </section>
  );
}

function EmployeeProjectCards({ projects, tasks, onView }: { projects: RecordItem[]; tasks: RecordItem[]; onView: (id: number) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {projects.map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        const completed = projectTasks.filter((task) => task.status === "Completed").length;
        const progress = projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0;
        return (
          <article key={project.id} className="rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="text-lg font-bold text-slate-900">{project.name}</h3><p className="mt-1 text-sm text-slate-500">{project.detail}</p></div>
              <Status value={project.status} />
            </div>
            <div className="mt-5"><div className="mb-2 flex justify-between text-sm"><span className="text-slate-500">My task progress</span><span className="font-semibold">{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-500" style={{ width: `${progress}%` }} /></div></div>
            <div className="mt-5 flex items-center justify-between"><span className="text-sm text-slate-500">{projectTasks.length} assigned tasks</span><button onClick={() => onView(project.id)} className="inline-flex items-center gap-2 font-semibold text-blue-600"><Eye size={17} /> View Project</button></div>
          </article>
        );
      })}
    </div>
  );
}

function EmployeeProjectDetails({ project, personalTasks, allProjectTasks, employees, onBack }: { project: RecordItem; personalTasks: RecordItem[]; allProjectTasks: RecordItem[]; employees: RecordItem[]; onBack: () => void }) {
  const teamIds = new Set(allProjectTasks.flatMap(getTaskEmployeeIds));
  const team = employees.filter((employee) => teamIds.has(employee.id));
  return (
    <section>
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><ChevronRight size={16} className="rotate-180" /> Back to my projects</button>
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-blue-900 p-7 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm uppercase tracking-wider text-blue-200">Assigned project</p><h1 className="mt-2 text-3xl font-bold">{project.name}</h1><p className="mt-2 text-blue-100">{project.owner} · {project.detail}</p></div><Status value={project.status} /></div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">My Tasks in this Project</h2>
          <div className="mt-5 space-y-3">{personalTasks.map((task) => <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><div className="font-semibold text-slate-900">{task.name}</div><div className="mt-1 text-sm text-slate-500">{task.detail}</div></div><Status value={task.status} /></div>)}</div>
        </section>
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Project Team</h2>
          <div className="mt-5 space-y-3">{team.map((member) => <div key={member.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">{member.name.charAt(0)}</div><div><div className="font-semibold">{member.name}</div><div className="text-sm text-slate-500">{member.owner}</div></div></div>)}</div>
        </section>
      </div>
    </section>
  );
}

function EmployeeTasks({ tasks, projects, search }: { tasks: RecordItem[]; projects: RecordItem[]; search: string }) {
  const filtered = filterRecords(tasks, search);
  return (
    <section>
      <PageHeading title="My Tasks" description="All tasks assigned to you, separated by project." />
      <div className="space-y-6">
        {projects.filter((project) => filtered.some((task) => task.projectId === project.id)).map((project) => (
          <section key={project.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">{project.name}</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {filtered.filter((task) => task.projectId === project.id).map((task) => (
                <TaskReplyRow key={task.id} task={task} project={project} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function TaskReplyRow({ task, project }: { task: RecordItem; project: RecordItem }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function submitReply() {
    setStatus("");

    if (!recipientEmail.trim() || !message.trim()) {
      setStatus("Enter recipient email and reply message.");
      return;
    }

    setIsSending(true);
    try {
      const reply = await sendTaskMailReply({
        taskId: task.id,
        recipientEmail: recipientEmail.trim(),
        subject: `Task reply: ${task.name}`,
        message: message.trim(),
      });
      setStatus(reply.deliveryStatus === "SENT" ? "Mail sent." : "Reply saved for this task.");
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send reply.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold">{task.name}</div>
          <div className="mt-1 text-sm text-slate-500">{task.detail}</div>
        </div>
        <div className="flex items-center gap-3">
          <Status value={task.status} />
          <button
            type="button"
            onClick={() => setReplyOpen((open) => !open)}
            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Reply
          </button>
        </div>
      </div>

      {replyOpen && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="Recipient email"
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <input
              value={`Project: ${project.name}`}
              readOnly
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 outline-none"
            />
          </div>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write your reply for this assigned task"
            className="mt-3 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{status}</p>
            <button
              type="button"
              disabled={isSending}
              onClick={submitReply}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSending ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeTeam({ employees, tasks, projects, search }: { employees: RecordItem[]; tasks: RecordItem[]; projects: RecordItem[]; search: string }) {
  const filtered = filterRecords(employees, search);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const selectedTeamIds = new Set(
    tasks
      .filter((task) => task.projectId === selectedProjectId)
      .flatMap(getTaskEmployeeIds),
  );
  const selectedTeam = employees.filter((employee) => selectedTeamIds.has(employee.id));

  if (selectedProject) {
    return (
      <section>
        <button
          onClick={() => setSelectedProjectId(null)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
        >
          <ChevronRight size={16} className="rotate-180" />
          Back to project team
        </button>
        <PageHeading
          title={`${selectedProject.name} Team`}
          description="Employees and administrators assigned to tasks in this project."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {selectedTeam.map((member) => {
            const memberTasks = tasks.filter(
              (task) =>
                task.projectId === selectedProject.id &&
                taskIncludesEmployee(task, member),
            );
            return (
              <article key={member.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-600">
                    {member.name.charAt(0)}
                  </div>
                  <Status value={member.status} />
                </div>
                <h2 className="mt-4 text-lg font-bold">{member.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{member.owner}</p>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Assigned tasks
                  </div>
                  <div className="mt-3 space-y-2">
                    {memberTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <span className="text-sm text-slate-700">{task.name}</span>
                        <Status value={task.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
          {!selectedTeam.length && (
            <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">
              No team members are assigned to this project.
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeading
        title="Project Team"
        description="Select a project to view all employees and administrators working on it."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects
          .filter((project) =>
            project.name.toLowerCase().includes(search.toLowerCase()),
          )
          .map((project) => {
            const projectTasks = tasks.filter((task) => task.projectId === project.id);
            const teamIds = new Set(projectTasks.flatMap(getTaskEmployeeIds));
            const projectMembers = filtered.filter((employee) =>
              teamIds.has(employee.id),
            );
            const admin = projectMembers.find(
              (member) => member.owner === "Administrator",
            );
            return (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <FolderKanban size={22} />
                  </div>
                  <Status value={project.status} />
                </div>
                <h2 className="mt-4 text-lg font-bold text-slate-900">
                  {project.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{project.owner}</p>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Team members</span>
                    <span className="font-semibold text-slate-900">
                      {projectMembers.length}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Admin: {admin?.name ?? "Not assigned"}
                    </span>
                    <span className="font-semibold text-blue-600">View team</span>
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </section>
  );
}

function EmployeeHistoryPanel({ history }: { history: EmployeeHistory[] }) {
  return (
    <section>
      <PageHeading
        title="Project History"
        description="Completed projects with tasks, technology, dates, and delivery timelines."
      />
      <div className="space-y-6">
        {history.map((entry) => (
          <article key={entry.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-800 to-blue-900 p-6 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                    Completed project
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{entry.projectName}</h2>
                  <p className="mt-2 text-blue-100">{entry.role}</p>
                </div>
                <Status value={entry.result} />
              </div>
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm text-blue-100">
                <span>
                  <strong className="text-white">Started:</strong> {entry.startedOn}
                </span>
                <span>
                  <strong className="text-white">Completed:</strong> {entry.completedOn}
                </span>
              </div>
            </div>

            <div className="grid gap-7 p-6 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-7">
                <section>
                  <h3 className="font-bold text-slate-900">Technology Stack</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.techStack.map((technology) => (
                      <span
                        key={technology}
                        className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-slate-900">Completed Tasks</h3>
                  <div className="mt-3 space-y-3">
                    {entry.completedTasks.map((task) => (
                      <div key={task} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle2
                          size={18}
                          className="mt-0.5 shrink-0 text-emerald-500"
                        />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section>
                <h3 className="font-bold text-slate-900">Project Timeline</h3>
                <div className="relative mt-4 space-y-1 before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-slate-200">
                  {entry.timeline.map((milestone, index) => (
                    <div key={`${milestone.date}-${milestone.title}`} className="relative flex gap-4 py-3">
                      <div
                        className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          index === entry.timeline.length - 1
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {index === entry.timeline.length - 1 ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <History size={18} />
                        )}
                      </div>
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                          {milestone.date}
                        </p>
                        <h4 className="mt-1 font-semibold text-slate-900">
                          {milestone.title}
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-slate-500">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </article>
        ))}
        {!history.length && (
          <div className="rounded-2xl bg-white p-12 text-center text-slate-500 shadow-sm">
            No completed project history is available.
          </div>
        )}
      </div>
    </section>
  );
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return <div className="mb-7"><h1 className="text-3xl font-bold text-slate-900">{title}</h1><p className="mt-2 text-slate-500">{description}</p></div>;
}

function filterRecords(items: RecordItem[], search: string) {
  const query = search.toLowerCase();
  return items.filter((item) => Object.values(item).some((value) => String(value).toLowerCase().includes(query)));
}

function Status({ value }: { value: string }) {
  const color = value === "Active" || value === "Completed" ? "bg-emerald-100 text-emerald-700" : value === "Pending" || value === "On Hold" ? "bg-amber-100 text-amber-700" : value === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{value}</span>;
}
