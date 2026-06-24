import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Eye,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { ChatAssistant } from "@/components/ChatAssistant";
import {
  createClient,
  createEmployee,
  deleteClient,
  deleteEmployee,
  getClients,
  getEmployees,
  updateClient,
  updateEmployee,
  type AccountRecord,
} from "@/lib/api/accounts";
import {
  createProject,
  createTask,
  deleteProject,
  deleteTask,
  getProjects,
  updateProject,
  updateTask,
  type ProjectRecord,
  type TaskRecord,
} from "@/lib/api/projects";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | ServiceDesk Pro" },
      { name: "description", content: "ServiceDesk Pro administration dashboard." },
    ],
  }),
  component: AdminDashboard,
});

type Section = "overview" | "activity" | "clients" | "projects" | "tasks" | "employees";
type EntitySection = Exclude<Section, "overview" | "activity">;
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
type EmployeeHistory = {
  id: number;
  employeeId: number;
  projectName: string;
  role: string;
  completedOn: string;
  result: string;
};
type Store = Record<EntitySection, RecordItem[]>;
type ActivityItem = { id: number; text: string; time: string };
type SharedNotification = {
  id: number;
  text: string;
  createdAt: number;
  audience: Array<"client" | "employee">;
};

const STORE_KEY = "servicedesk_admin_data";
const ACTIVITY_KEY = "servicedesk_admin_activity";
const EMPLOYEE_HISTORY_KEY = "servicedesk_employee_history";
const NOTIFICATION_KEY = "servicedesk_notifications";

const initialStore: Store = {
  clients: [],
  projects: [],
  tasks: [],
  employees: [],
};

const initialEmployeeHistory: EmployeeHistory[] = [];

const initialActivity: ActivityItem[] = [];

const labels: Record<EntitySection, { singular: string; title: string; detail: string; owner: string }> = {
  clients: { singular: "Client", title: "Clients", detail: "Email", owner: "Contact" },
  projects: { singular: "Project", title: "Projects", detail: "Schedule", owner: "Client" },
  tasks: { singular: "Task", title: "Tasks", detail: "Priority", owner: "Assignee" },
  employees: { singular: "Employee", title: "Employees", detail: "Email", owner: "Position" },
};

function AdminDashboard() {
  const [section, setSection] = useState<Section>("overview");
  const [store, setStore] = useState<Store>(initialStore);
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivity);
  const [search, setSearch] = useState("");
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [modal, setModal] = useState<"form" | "view" | null>(null);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeeHistory, setEmployeeHistory] =
    useState<EmployeeHistory[]>(initialEmployeeHistory);
  const [sessionUser, setSessionUser] = useState("Administrator");
  const [sessionPublicId, setSessionPublicId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const session = JSON.parse(localStorage.getItem("servicedesk_session") ?? "null") as {
      publicId?: string;
      username?: string;
      role?: string;
    } | null;
    if (!session || session.role !== "admin") {
      window.location.href = "/login";
      return;
    }
    setSessionUser(session.username ?? "Administrator");
    setSessionPublicId(session.publicId ?? "");

    const savedStore = localStorage.getItem(STORE_KEY);
    const savedActivity = localStorage.getItem(ACTIVITY_KEY);
    const savedEmployeeHistory = localStorage.getItem(EMPLOYEE_HISTORY_KEY);
    if (savedStore) {
      const parsed = JSON.parse(savedStore) as Store;
      const migrated = {
        ...parsed,
        clients: parsed.clients ?? [],
        employees: parsed.employees ?? [],
        tasks: parsed.tasks.map((task, index) => ({
          ...task,
          projectId:
            task.projectId ??
            parsed.projects[index % Math.max(parsed.projects.length, 1)]?.id,
          employeeId:
            task.employeeId ??
            parsed.employees.find((employee) => employee.name === task.owner)?.id,
          employeeIds:
            task.employeeIds ??
            [
              task.employeeId ??
                parsed.employees.find((employee) => employee.name === task.owner)?.id,
            ].filter((id): id is number => typeof id === "number"),
        })),
      };
      setStore(migrated);
      localStorage.setItem(STORE_KEY, JSON.stringify(migrated));
    } else localStorage.setItem(STORE_KEY, JSON.stringify(initialStore));
    if (savedActivity) setActivities(JSON.parse(savedActivity) as ActivityItem[]);
    else localStorage.setItem(ACTIVITY_KEY, JSON.stringify(initialActivity));
    if (savedEmployeeHistory) {
      setEmployeeHistory(JSON.parse(savedEmployeeHistory) as EmployeeHistory[]);
    } else {
      localStorage.setItem(EMPLOYEE_HISTORY_KEY, JSON.stringify(initialEmployeeHistory));
    }
    const loadBackendData = () => {
      Promise.allSettled([getProjects(), getClients(), getEmployees()])
      .then(([projectsResult, clientsResult, employeesResult]) => {
        if (!active) return;
        setStore((current) => {
          const next = {
            ...current,
            ...(clientsResult.status === "fulfilled"
              ? { clients: clientsResult.value.map(mapClient) }
              : {}),
            ...(employeesResult.status === "fulfilled"
              ? { employees: employeesResult.value.map(mapEmployee) }
              : {}),
            ...(projectsResult.status === "fulfilled"
              ? {
                  projects: projectsResult.value.map(mapProject),
                  tasks: projectsResult.value.flatMap((project) =>
                    project.tasks.map(mapTask),
                  ),
                }
              : {}),
          };
          localStorage.setItem(STORE_KEY, JSON.stringify(next));
          return next;
        });
      })
      .catch(() => {
        if (!active) return;
      })
      .finally(() => {
        if (active) setReady(true);
      });
    };
    loadBackendData();
    window.addEventListener("servicedesk-chatbot-data-changed", loadBackendData);

    return () => {
      active = false;
      window.removeEventListener("servicedesk-chatbot-data-changed", loadBackendData);
    };
  }, []);

  function persist(nextStore: Store, nextActivities = activities) {
    setStore(nextStore);
    setActivities(nextActivities);
    localStorage.setItem(STORE_KEY, JSON.stringify(nextStore));
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(nextActivities));
  }

  function recordActivity(text: string) {
    return [{ id: Date.now(), text, time: "Just now" }, ...activities].slice(0, 12);
  }

  function publishNotification(text: string) {
    const notifications = JSON.parse(
      localStorage.getItem(NOTIFICATION_KEY) ?? "[]",
    ) as SharedNotification[];
    const next = [
      {
        id: Date.now(),
        text,
        createdAt: Date.now(),
        audience: ["client", "employee"] as Array<"client" | "employee">,
      },
      ...notifications,
    ].slice(0, 50);
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("servicedesk-notifications-updated"));
  }

  function openCreate(target: EntitySection) {
    setSection(target);
    setEditing(null);
    setModal("form");
  }

  function openEdit(item: RecordItem) {
    setEditing(item);
    setModal("form");
  }

  async function removeItem(target: EntitySection, item: RecordItem) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      if (target === "projects") {
        await deleteProject(item.id);
      }
      if (target === "tasks") {
        await deleteTask(item.id);
      }
      if (target === "clients") {
        await deleteClient(item.id);
      }
      if (target === "employees") {
        await deleteEmployee(item.id);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete this item.");
      return;
    }
    const next = {
      ...store,
      [target]: store[target].filter((entry) => entry.id !== item.id),
      ...(target === "projects"
        ? { tasks: store.tasks.filter((task) => task.projectId !== item.id) }
        : {}),
    };
    persist(next, recordActivity(`${labels[target].singular} "${item.name}" was deleted`));
  }

  async function saveItem(item: Omit<RecordItem, "id">) {
    if (section === "overview" || section === "activity") return;
    const target = section;
    let saved: RecordItem;
    try {
      saved = await saveRecordToApi(target, item, editing);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to save this item.");
      return;
    }
    let nextItems = editing
      ? store[target].map((entry) => (entry.id === editing.id ? saved : entry))
      : [saved, ...store[target]];
    if (target === "employees") {
      try {
        nextItems = (await getEmployees()).map(mapEmployee);
      } catch {
        nextItems = editing
          ? store[target].map((entry) => (entry.id === editing.id ? saved : entry))
          : [saved, ...store[target]];
      }
    }
    const next = { ...store, [target]: nextItems };
    persist(
      next,
      recordActivity(
        `${labels[target].singular} "${item.name}" was ${editing ? "updated" : "added"}`,
      ),
    );
    if (target === "projects" || target === "tasks") {
      publishNotification(
        `${labels[target].singular} "${item.name}" was ${editing ? "updated" : "added"} by the administrator.`,
      );
    }
    setModal(null);
    setEditing(null);
  }

  async function saveRecordToApi(
    target: EntitySection,
    item: Omit<RecordItem, "id">,
    current: RecordItem | null,
  ) {
    if (target === "projects") {
      const payload = {
        name: item.name,
        detail: item.detail,
        status: item.status,
        owner: item.owner,
      };
      const saved = current
        ? await updateProject(current.id, payload)
        : await createProject(payload);
      return mapProject(saved);
    }

    if (target === "tasks") {
      if (!item.projectId) {
        throw new Error("Choose a project for this task.");
      }
      const payload = {
        projectId: item.projectId,
        employeeId: item.employeeId,
        employeeIds: item.employeeIds,
        name: item.name,
        detail: item.detail,
        status: item.status,
        owner: item.owner,
      };
      const saved = current
        ? await updateTask(current.id, payload)
        : await createTask(payload);
      return mapTask(saved);
    }

    if (target === "clients") {
      const payload = {
        username: item.name,
        email: item.detail,
      };
      const saved = current
        ? await updateClient(current.id, payload)
        : await createClient(payload);
      return mapClient(saved);
    }

    if (target === "employees") {
      const payload = {
        username: item.name,
        email: item.detail,
        position: item.owner?.trim() || "Employee",
      };
      const saved = current
        ? await updateEmployee(current.id, payload)
        : await createEmployee(payload);
      const mapped = mapEmployee(saved);
      if (mapped.owner !== payload.position) {
        throw new Error("Employee position was not saved by the backend. Restart the backend and try again.");
      }
      return mapped;
    }

    return current ? { ...item, id: current.id } : { ...item, id: Date.now() };
  }

  function navigate(next: Section) {
    setSection(next);
    setSelectedProjectId(null);
    setSelectedEmployeeId(null);
    setSearch("");
    setMobileMenuOpen(false);
  }

  function openProject(project: RecordItem) {
    setSelectedProjectId(project.id);
    setSection("tasks");
    setSearch("");
  }

  function openEmployee(employee: RecordItem) {
    setSelectedEmployeeId(employee.id);
    setSection("employees");
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <Sidebar
        section={section}
        dashboardOpen={dashboardOpen}
        mobileOpen={mobileMenuOpen}
        onDashboardToggle={() => setDashboardOpen((open) => !open)}
        onNavigate={navigate}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-slate-200 bg-white px-5 lg:px-8">
          <button
            onClick={() => setMobileMenuOpen(true)}
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
              placeholder="Search clients, projects, tasks, employees..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell size={22} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>
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
                      <div className="mt-1 text-sm text-slate-500">Administrator</div>
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
            <Overview store={store} activities={activities} onNavigate={navigate} />
          )}
          {section === "activity" && <ActivityPanel activities={activities} />}
          {section !== "overview" && section !== "activity" && (
            <>
              {section === "employees" && selectedEmployeeId ? (
                <EmployeeDetails
                  employee={
                    store.employees.find((employee) => employee.id === selectedEmployeeId)!
                  }
                  projects={store.projects}
                  tasks={store.tasks}
                  history={employeeHistory.filter(
                    (entry) => entry.employeeId === selectedEmployeeId,
                  )}
                  onBack={() => navigate("employees")}
                  onEdit={() =>
                    openEdit(
                      store.employees.find(
                        (employee) => employee.id === selectedEmployeeId,
                      )!,
                    )
                  }
                />
              ) : (
                <ManagementTable
                  section={section}
                  items={
                    section === "tasks" && selectedProjectId
                      ? store.tasks.filter((task) => task.projectId === selectedProjectId)
                      : store[section]
                  }
                  projects={store.projects}
                  selectedProject={
                    selectedProjectId
                      ? store.projects.find((project) => project.id === selectedProjectId) ?? null
                      : null
                  }
                  search={search}
                  onAdd={() => openCreate(section)}
                  onView={(item) => {
                    if (section === "projects") {
                      openProject(item);
                      return;
                    }
                    if (section === "employees") {
                      openEmployee(item);
                      return;
                    }
                    setSelected(item);
                    setModal("view");
                  }}
                  onEdit={openEdit}
                  onDelete={(item) => removeItem(section, item)}
                  onBack={() => navigate("projects")}
                />
              )}
            </>
          )}
        </main>
      </div>

      {modal === "form" && section !== "overview" && section !== "activity" && (
        <RecordForm
          section={section}
          item={editing}
          projects={store.projects}
          employees={store.employees}
          selectedProjectId={selectedProjectId}
          onClose={() => setModal(null)}
          onSave={saveItem}
        />
      )}
      {modal === "view" && selected && section !== "overview" && section !== "activity" && (
        <ViewModal
          section={section}
          item={selected}
          onClose={() => setModal(null)}
          onEdit={() => {
            setEditing(selected);
            setModal("form");
          }}
        />
      )}
      <ChatAssistant role="admin" />
    </div>
  );
}

function mergeBackendDataIntoStore(
  store: Store,
  projects: ProjectRecord[],
  clients: AccountRecord[],
  employees: AccountRecord[],
): Store {
  return {
    ...store,
    clients: clients.map(mapClient),
    employees: employees.map(mapEmployee),
    projects: projects.map(mapProject),
    tasks: projects.flatMap((project) => project.tasks.map(mapTask)),
  };
}

function mapClient(client: AccountRecord): RecordItem {
  return {
    id: client.id,
    publicId: client.publicId,
    name: client.username,
    detail: client.email,
    status: "Active",
    owner: client.username,
  };
}

function mapEmployee(employee: AccountRecord): RecordItem {
  return {
    id: employee.id,
    publicId: employee.publicId,
    name: employee.username,
    detail: employee.email,
    status: "Active",
    owner: employee.position ?? "Employee",
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

function Sidebar({
  section,
  dashboardOpen,
  mobileOpen,
  onDashboardToggle,
  onNavigate,
  onClose,
}: {
  section: Section;
  dashboardOpen: boolean;
  mobileOpen: boolean;
  onDashboardToggle: () => void;
  onNavigate: (section: Section) => void;
  onClose: () => void;
}) {
  const entries: Array<{ id: EntitySection; label: string; icon: typeof Users }> = [
    { id: "clients", label: "Clients", icon: Users },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "employees", label: "Employees", icon: BriefcaseBusiness },
  ];

  return (
    <>
      {mobileOpen && <button className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={onClose} />}
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
            <div className="text-sm text-slate-400">Pro Admin</div>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden" aria-label="Close navigation">
            <X />
          </button>
        </div>

        <nav className="space-y-2 py-5">
          <button
            onClick={onDashboardToggle}
            className={`flex w-full items-center gap-3 px-7 py-4 text-left transition hover:bg-slate-700 ${
              section === "overview" || section === "activity" ? "bg-slate-700 text-white" : ""
            }`}
          >
            <LayoutDashboard size={20} className="text-blue-400" />
            <span className="font-medium">Dashboard</span>
            {dashboardOpen ? <ChevronDown className="ml-auto" size={18} /> : <ChevronRight className="ml-auto" size={18} />}
          </button>
          {dashboardOpen && (
            <div className="space-y-1 bg-slate-900/20 py-2">
              <NavButton active={section === "overview"} onClick={() => onNavigate("overview")}>
                Overview
              </NavButton>
              <NavButton active={section === "activity"} onClick={() => onNavigate("activity")}>
                Recent Activity
              </NavButton>
            </div>
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

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 py-2.5 pl-16 pr-6 text-sm ${
        active ? "font-semibold text-blue-300" : "text-slate-400 hover:text-white"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </button>
  );
}

function Overview({
  store,
  activities,
  onNavigate,
}: {
  store: Store;
  activities: ActivityItem[];
  onNavigate: (section: Section) => void;
}) {
  const completed = store.tasks.filter((task) => task.status === "Completed").length;
  const cards = [
    { label: "Clients", value: store.clients.length, color: "bg-blue-500", icon: Users, target: "clients" as Section },
    { label: "Active Projects", value: store.projects.filter((p) => p.status === "Active").length, color: "bg-emerald-500", icon: FolderKanban, target: "projects" as Section },
    { label: "Tasks Completed", value: completed, color: "bg-orange-500", icon: CheckSquare, target: "tasks" as Section },
    { label: "Employees", value: store.employees.length, color: "bg-purple-500", icon: BriefcaseBusiness, target: "employees" as Section },
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Admin workspace</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-500">View and manage everything happening across your project.</p>
        </div>
        <div className="text-sm text-slate-500">Last updated just now</div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, color, icon: Icon, target }) => (
          <button key={label} onClick={() => onNavigate(target)} className={`${color} rounded-2xl p-7 text-left text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}>
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

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <Panel title="Recent Projects" action="View all" onAction={() => onNavigate("projects")}>
          <CompactTable items={store.projects.slice(0, 4)} />
        </Panel>
        <Panel title="Recent Activity" action="View all" onAction={() => onNavigate("activity")}>
          <div className="divide-y divide-slate-100">
            {activities.slice(0, 5).map((item) => (
              <div key={item.id} className="flex gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{item.text}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function Panel({ title, action, onAction, children }: { title: string; action: string; onAction: () => void; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <button onClick={onAction} className="font-semibold text-blue-600 hover:text-blue-700">{action}</button>
      </div>
      {children}
    </section>
  );
}

function CompactTable({ items }: { items: RecordItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100">
      <div className="grid grid-cols-[1fr_auto] bg-slate-700 px-5 py-4 font-semibold text-white">
        <span>Name</span><span>Status</span>
      </div>
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-[1fr_auto] items-center border-t border-slate-100 px-5 py-4">
          <div><div className="font-medium">{item.name}</div><div className="text-sm text-slate-400">{item.owner}</div></div>
          <Status value={item.status} />
        </div>
      ))}
    </div>
  );
}

function ManagementTable({
  section,
  items,
  projects,
  selectedProject,
  search,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onBack,
}: {
  section: EntitySection;
  items: RecordItem[];
  projects: RecordItem[];
  selectedProject: RecordItem | null;
  search: string;
  onAdd: () => void;
  onView: (item: RecordItem) => void;
  onEdit: (item: RecordItem) => void;
  onDelete: (item: RecordItem) => void;
  onBack: () => void;
}) {
  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return items.filter((item) => Object.values(item).some((value) => String(value).toLowerCase().includes(query)));
  }, [items, search]);
  const copy = labels[section];

  return (
    <section>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          {selectedProject && (
            <button
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <ChevronRight size={16} className="rotate-180" />
              Back to projects
            </button>
          )}
          <h1 className="text-3xl font-bold text-slate-900">
            {selectedProject ? selectedProject.name : copy.title}
          </h1>
          <p className="mt-2 text-slate-500">
            {selectedProject
              ? `Tasks assigned only to ${selectedProject.name}.`
              : `Add, view, edit, and delete ${copy.title.toLowerCase()}.`}
          </p>
        </div>
        <button onClick={onAdd} className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700">
          <Plus size={19} /> Add {selectedProject ? "Project Task" : copy.singular}
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-700 text-white">
              <tr>
                <th className="px-6 py-4">{copy.singular}</th>
                <th className="px-6 py-4">{copy.detail}</th>
                <th className="px-6 py-4">{copy.owner}</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-5">
                    {section === "projects" || section === "employees" ? (
                      <button
                        onClick={() => onView(item)}
                        className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        {item.name}
                      </button>
                    ) : (
                      <div className="font-semibold text-slate-900">{item.name}</div>
                    )}
                    {item.publicId && (
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        ID: {item.publicId}
                      </div>
                    )}
                    {section === "tasks" && !selectedProject && (
                      <div className="mt-1 text-xs text-blue-600">
                        {projects.find((project) => project.id === item.projectId)?.name ??
                          "Unassigned project"}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-slate-600">{item.detail}</td>
                  <td className="px-6 py-5 text-slate-600">
                    <div>{item.owner}</div>
                    {section === "tasks" && (
                      <div className="mt-1 text-xs font-semibold text-blue-600">
                        {(item.employeeIds?.length ?? (item.employeeId ? 1 : 0))} team member
                        {(item.employeeIds?.length ?? (item.employeeId ? 1 : 0)) === 1 ? "" : "s"}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5"><Status value={item.status} /></td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <ActionButton
                        label={
                          section === "projects"
                            ? "Open project tasks"
                            : section === "employees"
                              ? "Open employee details"
                              : "View"
                        }
                        onClick={() => onView(item)}
                      >
                        <Eye size={17} />
                      </ActionButton>
                      <ActionButton label="Edit" onClick={() => onEdit(item)}><Pencil size={17} /></ActionButton>
                      <ActionButton label="Delete" danger onClick={() => onDelete(item)}><Trash2 size={17} /></ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && <div className="p-12 text-center text-slate-500">No matching records found.</div>}
      </div>
    </section>
  );
}

function ActionButton({ label, danger, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: ReactNode }) {
  return <button title={label} aria-label={label} onClick={onClick} className={`rounded-lg p-2 transition ${danger ? "text-red-500 hover:bg-red-50" : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"}`}>{children}</button>;
}

function Status({ value }: { value: string }) {
  const color = value === "Active" || value === "Completed"
    ? "bg-emerald-100 text-emerald-700"
    : value === "On Hold" || value === "Away"
      ? "bg-amber-100 text-amber-700"
      : value === "In Progress"
        ? "bg-blue-100 text-blue-700"
        : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{value}</span>;
}

function taskIncludesEmployee(task: RecordItem, employee: RecordItem) {
  return (
    task.employeeIds?.includes(employee.id) ||
    task.employeeId === employee.id ||
    task.owner.split(",").map((name) => name.trim()).includes(employee.name)
  );
}

function RecordForm({
  section,
  item,
  projects,
  employees,
  selectedProjectId,
  onClose,
  onSave,
}: {
  section: EntitySection;
  item: RecordItem | null;
  projects: RecordItem[];
  employees: RecordItem[];
  selectedProjectId: number | null;
  onClose: () => void;
  onSave: (item: Omit<RecordItem, "id">) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [detail, setDetail] = useState(item?.detail ?? "");
  const [owner, setOwner] = useState(item?.owner ?? (section === "employees" ? "Employee" : ""));
  const [status, setStatus] = useState(item?.status ?? "Active");
  const [projectId, setProjectId] = useState(
    item?.projectId ?? selectedProjectId ?? projects[0]?.id ?? 0,
  );
  const [employeeIds, setEmployeeIds] = useState<number[]>(
    item?.employeeIds?.length
      ? item.employeeIds
      : [
          item?.employeeId ??
            employees.find((employee) => employee.name === item?.owner)?.id ??
            employees[0]?.id ??
            0,
        ].filter((id): id is number => id > 0),
  );
  const copy = labels[section];

  function toggleEmployee(employeeId: number) {
    setEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId],
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (
      !name.trim() ||
      !detail.trim() ||
      (section !== "tasks" && !owner.trim()) ||
      (section === "tasks" && (!projectId || employeeIds.length === 0))
    ) {
      return;
    }
    const assignedEmployees = employees.filter((employee) => employeeIds.includes(employee.id));
    onSave({
      name: name.trim(),
      detail: detail.trim(),
      owner:
        section === "tasks" && assignedEmployees.length
          ? assignedEmployees.map((employee) => employee.name).join(", ")
          : owner.trim(),
      status,
      ...(section === "tasks"
        ? { projectId, employeeId: employeeIds[0], employeeIds }
        : {}),
    });
  }

  return (
    <Modal title={`${item ? "Edit" : "Add"} ${copy.singular}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        {section === "tasks" && (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold">Project</label>
              {selectedProjectId ? (
                <div className="flex h-12 items-center rounded-xl border border-blue-200 bg-blue-50 px-4 font-medium text-blue-800">
                  {projects.find((project) => project.id === selectedProjectId)?.name}
                </div>
              ) : (
                <select
                  value={projectId}
                  onChange={(event) => setProjectId(Number(event.target.value))}
                  className="form-input"
                  required
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Assigned employees</label>
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                {employees.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={employeeIds.includes(employee.id)}
                      onChange={() => toggleEmployee(employee.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{employee.name}</span>
                    <span className="ml-auto text-xs text-slate-400">{employee.detail}</span>
                  </label>
                ))}
                {!employees.length && (
                  <div className="rounded-lg bg-white px-3 py-4 text-center text-sm text-slate-500">
                    Add employees before assigning a task.
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Selected team members: {employeeIds.length}
              </p>
            </div>
          </>
        )}
        <DashboardField label={`${copy.singular} name`} value={name} onChange={setName} />
        <DashboardField label={copy.detail} value={detail} onChange={setDetail} />
        {section !== "tasks" && (
          <DashboardField label={copy.owner} value={owner} onChange={setOwner} />
        )}
        <div>
          <label className="mb-2 block text-sm font-semibold">Status</label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="form-input">
            <option>Active</option><option>Pending</option><option>In Progress</option>
            <option>Completed</option><option>On Hold</option><option>Away</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-300 px-5 font-semibold">Cancel</button>
          <button type="submit" className="h-11 rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700">Save {copy.singular}</button>
        </div>
      </form>
    </Modal>
  );
}

function DashboardField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="mb-2 block text-sm font-semibold">{label}</label><input required value={value} onChange={(event) => onChange(event.target.value)} className="form-input" /></div>;
}

function ViewModal({ section, item, onClose, onEdit }: { section: EntitySection; item: RecordItem; onClose: () => void; onEdit: () => void }) {
  const copy = labels[section];
  return (
    <Modal title={`${copy.singular} details`} onClose={onClose}>
      <div className="space-y-5">
        <Detail label="Name" value={item.name} />
        {item.publicId && <Detail label="ID" value={item.publicId} />}
        <Detail label={copy.detail} value={item.detail} />
        <Detail label={copy.owner} value={item.owner} />
        <div><div className="text-sm text-slate-400">Status</div><div className="mt-2"><Status value={item.status} /></div></div>
        <button onClick={onEdit} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700"><Pencil size={17} /> Edit {copy.singular}</button>
      </div>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-4"><div className="text-sm text-slate-400">{label}</div><div className="mt-1 font-semibold text-slate-900">{value}</div></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4" onMouseDown={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ActivityPanel({ activities }: { activities: ActivityItem[] }) {
  return (
    <section>
      <div className="mb-7"><h1 className="text-3xl font-bold text-slate-900">Recent Activity</h1><p className="mt-2 text-slate-500">A live history of administrative changes.</p></div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="relative space-y-2 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-slate-200">
          {activities.map((item) => (
            <div key={item.id} className="relative flex gap-4 rounded-xl p-3 hover:bg-slate-50">
              <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"><BarChart3 size={18} /></div>
              <div><p className="font-medium text-slate-800">{item.text}</p><p className="mt-1 text-sm text-slate-400">{item.time}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EmployeeDetails({
  employee,
  projects,
  tasks,
  history,
  onBack,
  onEdit,
}: {
  employee: RecordItem;
  projects: RecordItem[];
  tasks: RecordItem[];
  history: EmployeeHistory[];
  onBack: () => void;
  onEdit: () => void;
}) {
  const employeeTasks = tasks.filter(
    (task) => taskIncludesEmployee(task, employee),
  );
  const currentProjects = projects.filter((project) =>
    employeeTasks.some(
      (task) => task.projectId === project.id && task.status !== "Completed",
    ),
  );
  const completedTasks = employeeTasks.filter((task) => task.status === "Completed").length;

  return (
    <section>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        <ChevronRight size={16} className="rotate-180" />
        Back to employees
      </button>

      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-blue-900 p-7 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-3xl font-bold">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold">{employee.name}</h1>
                <Status value={employee.status} />
              </div>
              <p className="mt-2 text-blue-100">{employee.owner}</p>
              <p className="mt-1 text-sm text-blue-200">{employee.detail}</p>
              {employee.publicId && (
                <p className="mt-1 text-sm font-semibold text-blue-100">ID: {employee.publicId}</p>
              )}
            </div>
          </div>
          <button
            onClick={onEdit}
            className="flex h-11 items-center gap-2 rounded-xl bg-white px-5 font-semibold text-blue-800 hover:bg-blue-50"
          >
            <Pencil size={17} />
            Edit Employee
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <EmployeeStat label="Current Projects" value={currentProjects.length} />
        <EmployeeStat label="Assigned Tasks" value={employeeTasks.length} />
        <EmployeeStat label="Completed Tasks" value={completedTasks} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Current Projects</h2>
          <p className="mt-1 text-sm text-slate-500">
            Projects with active work assigned to this employee.
          </p>
          <div className="mt-5 space-y-3">
            {currentProjects.map((project) => {
              const projectTasks = employeeTasks.filter(
                (task) => task.projectId === project.id,
              );
              return (
                <div key={project.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{project.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{project.owner}</p>
                    </div>
                    <Status value={project.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {projectTasks.length} assigned task{projectTasks.length === 1 ? "" : "s"}
                  </p>
                </div>
              );
            })}
            {!currentProjects.length && (
              <div className="rounded-xl bg-slate-50 p-5 text-center text-slate-500">
                No active project assignments.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Assigned Tasks</h2>
          <p className="mt-1 text-sm text-slate-500">
            Current work and its latest completion status.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="pb-3 font-semibold">Task</th>
                  <th className="pb-3 font-semibold">Project</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">Work Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="py-4 pr-4 font-medium text-slate-900">{task.name}</td>
                    <td className="py-4 pr-4 text-slate-600">
                      {projects.find((project) => project.id === task.projectId)?.name ??
                        "Unassigned"}
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{task.detail}</td>
                    <td className="py-4"><Status value={task.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!employeeTasks.length && (
              <div className="py-10 text-center text-slate-500">No tasks assigned.</div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Project History</h2>
        <p className="mt-1 text-sm text-slate-500">
          Projects this employee previously worked on.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {history.map((entry) => (
            <article key={entry.id} className="rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <FolderKanban size={19} />
                </div>
                <Status value={entry.result} />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{entry.projectName}</h3>
              <p className="mt-1 text-sm text-slate-500">{entry.role}</p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                Completed {entry.completedOn}
              </p>
            </article>
          ))}
          {!history.length && (
            <div className="rounded-xl bg-slate-50 p-5 text-slate-500">
              No completed project history yet.
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function EmployeeStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-2 text-sm font-medium text-slate-500">{label}</div>
    </div>
  );
}
