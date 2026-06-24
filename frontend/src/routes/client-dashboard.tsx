import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Clock3,
  Eye,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ChatAssistant } from "@/components/ChatAssistant";
import { getProjects, type ProjectRecord, type TaskRecord } from "@/lib/api/projects";

export const Route = createFileRoute("/client-dashboard")({
  head: () => ({
    meta: [
      { title: "Client Dashboard | ServiceDesk Pro" },
      {
        name: "description",
        content: "View client projects, tasks, employees, and progress.",
      },
    ],
  }),
  component: ClientDashboard,
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
};

type Store = {
  clients: RecordItem[];
  projects: RecordItem[];
  tasks: RecordItem[];
  employees: RecordItem[];
};

type ClientSection = "overview" | "projects" | "tasks" | "employees";
type SharedNotification = {
  id: number;
  text: string;
  createdAt: number;
  audience: Array<"client" | "employee">;
};

const STORE_KEY = "servicedesk_admin_data";
const NOTIFICATION_KEY = "servicedesk_notifications";
const CLIENT_READ_KEY = "servicedesk_client_notifications_read";

const fallbackStore: Store = {
  clients: [],
  projects: [],
  tasks: [],
  employees: [],
};

function ClientDashboard() {
  const [store, setStore] = useState<Store>(fallbackStore);
  const [section, setSection] = useState<ClientSection>("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<SharedNotification[]>([]);
  const [readNotifications, setReadNotifications] = useState<number[]>([]);
  const [sessionUser, setSessionUser] = useState("Client User");
  const [sessionPublicId, setSessionPublicId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const session = JSON.parse(
      localStorage.getItem("servicedesk_session") ?? "null",
    ) as { publicId?: string; username?: string; role?: string } | null;

    if (!session || session.role !== "client") {
      window.location.href = "/login";
      return;
    }
    setSessionUser(session.username ?? "Client User");
    setSessionPublicId(session.publicId ?? "");

    const savedStore = localStorage.getItem(STORE_KEY);
    if (savedStore) setStore(JSON.parse(savedStore) as Store);
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
    const loadNotifications = () => {
      const saved = JSON.parse(
        localStorage.getItem(NOTIFICATION_KEY) ?? "[]",
      ) as SharedNotification[];
      setNotifications(saved.filter((item) => item.audience.includes("client")));
      setReadNotifications(
        JSON.parse(localStorage.getItem(CLIENT_READ_KEY) ?? "[]") as number[],
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
    localStorage.setItem(CLIENT_READ_KEY, JSON.stringify(ids));
  }

  function navigate(next: ClientSection) {
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
    store.projects.find((project) => project.id === selectedProjectId) ?? null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <ClientSidebar
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
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects, tasks, employees..."
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
                <NotificationDropdown
                  notifications={notifications}
                  readIds={readNotifications}
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
                      <div className="font-semibold text-slate-900">{sessionUser}</div>
                      <div className="mt-1 text-sm text-slate-500">Client</div>
                      {sessionPublicId && (
                        <div className="mt-1 text-xs font-semibold text-blue-600">{sessionPublicId}</div>
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
            <ClientOverview
              store={store}
              sessionPublicId={sessionPublicId}
              onNavigate={navigate}
              onProject={openProject}
            />
          )}
          {section === "projects" &&
            (selectedProject ? (
              <ClientProjectDetails
                project={selectedProject}
                tasks={store.tasks.filter(
                  (task) => task.projectId === selectedProject.id,
                )}
                employees={store.employees}
                onBack={() => setSelectedProjectId(null)}
              />
            ) : (
              <ClientProjects
                projects={store.projects}
                tasks={store.tasks}
                search={search}
                onView={openProject}
              />
            ))}
          {section === "tasks" && (
            <ClientTasks tasks={store.tasks} projects={store.projects} search={search} />
          )}
          {section === "employees" && (
            <ClientEmployees employees={store.employees} search={search} />
          )}
        </main>
      </div>
      <ChatAssistant role="client" />
    </div>
  );
}

function NotificationDropdown({
  notifications,
  readIds,
  onClose,
  onMarkRead,
}: {
  notifications: SharedNotification[];
  readIds: number[];
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
          {notifications.map((notification) => (
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
            </div>
          ))}
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

function mergeProjectsIntoStore(store: Store, projects: ProjectRecord[]): Store {
  return {
    ...store,
    clients: [],
    employees: [],
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
    name: task.name,
    detail: task.detail,
    status: task.status,
    owner: task.owner,
  };
}

function ClientSidebar({
  section,
  dashboardOpen,
  mobileOpen,
  onDashboardToggle,
  onNavigate,
  onClose,
}: {
  section: ClientSection;
  dashboardOpen: boolean;
  mobileOpen: boolean;
  onDashboardToggle: () => void;
  onNavigate: (section: ClientSection) => void;
  onClose: () => void;
}) {
  const entries = [
    { id: "projects" as const, label: "Projects", icon: FolderKanban },
    { id: "tasks" as const, label: "Tasks", icon: CheckSquare },
    { id: "employees" as const, label: "Employees", icon: Users },
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
            <div className="text-sm text-slate-400">Client Portal</div>
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

function ClientOverview({
  store,
  sessionPublicId,
  onNavigate,
  onProject,
}: {
  store: Store;
  sessionPublicId: string;
  onNavigate: (section: ClientSection) => void;
  onProject: (projectId: number) => void;
}) {
  const cards = [
    {
      label: "Projects",
      value: store.projects.length,
      color: "bg-blue-500",
      icon: FolderKanban,
      target: "projects" as const,
    },
    {
      label: "Tasks",
      value: store.tasks.length,
      color: "bg-emerald-500",
      icon: CheckSquare,
      target: "tasks" as const,
    },
    {
      label: "Employees",
      value: store.employees.length,
      color: "bg-purple-500",
      icon: Users,
      target: "employees" as const,
    },
  ];

  const taskGroups = [
    {
      label: "Pending",
      value: store.tasks.filter((task) => task.status === "Pending").length,
      color: "text-amber-600 bg-amber-100",
      icon: Clock3,
    },
    {
      label: "In Progress",
      value: store.tasks.filter((task) => task.status === "In Progress").length,
      color: "text-blue-600 bg-blue-100",
      icon: CircleDashed,
    },
    {
      label: "Completed",
      value: store.tasks.filter((task) => task.status === "Completed").length,
      color: "text-emerald-600 bg-emerald-100",
      icon: CheckCircle2,
    },
  ];

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Client workspace
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Dashboard</h1>
        {sessionPublicId && (
          <p className="mt-1 text-sm font-semibold text-blue-600">ID: {sessionPublicId}</p>
        )}
        <p className="mt-2 text-slate-500">
          Track your projects, assigned work, and delivery team.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {cards.map(({ label, value, color, icon: Icon, target }) => (
          <button
            key={label}
            onClick={() => onNavigate(target)}
            className={`${color} rounded-2xl p-7 text-left text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl font-bold">{value}</div>
                <div className="mt-3 text-lg text-white/90">{label}</div>
              </div>
              <Icon size={30} className="text-white/70" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {taskGroups.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{value}</div>
                <div className="mt-2 font-medium text-slate-500">{label} Tasks</div>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                <Icon size={23} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-7 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Project Status</h2>
          <button
            onClick={() => onNavigate("projects")}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>
        <ProjectCards projects={store.projects} tasks={store.tasks} onView={onProject} />
      </section>
    </>
  );
}

function ClientProjects({
  projects,
  tasks,
  search,
  onView,
}: {
  projects: RecordItem[];
  tasks: RecordItem[];
  search: string;
  onView: (projectId: number) => void;
}) {
  const filtered = filterRecords(projects, search);
  return (
    <section>
      <PageHeading
        title="Projects"
        description="View each project, its current status, and assigned tasks."
      />
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <ProjectCards projects={filtered} tasks={tasks} onView={onView} />
      </div>
    </section>
  );
}

function ProjectCards({
  projects,
  tasks,
  onView,
}: {
  projects: RecordItem[];
  tasks: RecordItem[];
  onView: (projectId: number) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {projects.map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        const completed = projectTasks.filter((task) => task.status === "Completed").length;
        const progress = projectTasks.length
          ? Math.round((completed / projectTasks.length) * 100)
          : 0;

        return (
          <article key={project.id} className="rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{project.detail}</p>
              </div>
              <Status value={project.status} />
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-500">Task progress</span>
                <span className="font-semibold text-slate-700">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {projectTasks.length} task{projectTasks.length === 1 ? "" : "s"}
              </span>
              <button
                onClick={() => onView(project.id)}
                className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700"
              >
                <Eye size={17} />
                View Project
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ClientProjectDetails({
  project,
  tasks,
  employees,
  onBack,
}: {
  project: RecordItem;
  tasks: RecordItem[];
  employees: RecordItem[];
  onBack: () => void;
}) {
  const grouped = ["Pending", "In Progress", "Completed"];
  return (
    <section>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
      >
        <ChevronRight size={16} className="rotate-180" />
        Back to projects
      </button>
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-blue-900 p-7 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-blue-200">Project details</p>
            <h1 className="mt-2 text-3xl font-bold">{project.name}</h1>
            <p className="mt-2 text-blue-100">
              {project.owner} · {project.detail}
            </p>
          </div>
          <Status value={project.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {grouped.map((status) => {
          const groupTasks = tasks.filter((task) => task.status === status);
          return (
            <section key={status} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">{status}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                  {groupTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {groupTasks.map((task) => (
                  <article key={task.id} className="rounded-xl border border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-900">{task.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">{task.detail}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                      <UserRound size={16} />
                      {employees.find((employee) => employee.id === task.employeeId)?.name ??
                        task.owner}
                    </div>
                  </article>
                ))}
                {!groupTasks.length && (
                  <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">
                    No {status.toLowerCase()} tasks
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function ClientTasks({
  tasks,
  projects,
  search,
}: {
  tasks: RecordItem[];
  projects: RecordItem[];
  search: string;
}) {
  const filtered = filterRecords(tasks, search);
  return (
    <section>
      <PageHeading
        title="Tasks"
        description="Review pending, in-progress, and completed project tasks."
      />
      <ReadOnlyTable
        headers={["Task", "Project", "Priority", "Assignee", "Status"]}
        rows={filtered.map((task) => [
          task.name,
          projects.find((project) => project.id === task.projectId)?.name ?? "Unassigned",
          task.detail,
          task.owner,
          <Status key={task.id} value={task.status} />,
        ])}
      />
    </section>
  );
}

function ClientEmployees({
  employees,
  search,
}: {
  employees: RecordItem[];
  search: string;
}) {
  const filtered = filterRecords(employees, search);
  return (
    <section>
      <PageHeading
        title="Employees"
        description="View the employees assigned across your projects."
      />
      <ReadOnlyTable
        headers={["Employee", "Email", "Position", "Status"]}
        rows={filtered.map((employee) => [
          <div key={employee.id}>
            <div className="font-semibold text-slate-900">{employee.name}</div>
            {employee.publicId && (
              <div className="mt-1 text-xs font-semibold text-slate-400">
                ID: {employee.publicId}
              </div>
            )}
          </div>,
          employee.detail,
          employee.owner,
          <Status key={employee.id} value={employee.status} />,
        ])}
      />
    </section>
  );
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">{description}</p>
    </div>
  );
}

function ReadOnlyTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-slate-700 text-white">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-6 py-4">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-6 py-5 ${
                      cellIndex === 0 ? "font-semibold text-slate-900" : "text-slate-600"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <div className="p-12 text-center text-slate-500">No records found.</div>}
    </div>
  );
}

function filterRecords(items: RecordItem[], search: string) {
  const query = search.toLowerCase();
  return items.filter((item) =>
    Object.values(item).some((value) => String(value).toLowerCase().includes(query)),
  );
}

function Status({ value }: { value: string }) {
  const color =
    value === "Active" || value === "Completed"
      ? "bg-emerald-100 text-emerald-700"
      : value === "On Hold" || value === "Pending"
        ? "bg-amber-100 text-amber-700"
        : value === "In Progress"
          ? "bg-blue-100 text-blue-700"
          : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {value}
    </span>
  );
}
