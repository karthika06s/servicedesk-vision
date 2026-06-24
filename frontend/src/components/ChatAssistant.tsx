import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import {
  createClient,
  createEmployee,
  getClients,
  getEmployees,
  updateEmployee,
} from "@/lib/api/accounts";
import {
  createProject,
  createTask,
  getProjects,
} from "@/lib/api/projects";

type ChatRole = "admin" | "employee" | "client";
type Sender = "bot" | "user";
type PendingAction =
  | {
      type: "create-project";
      name: string;
      owner: string;
      assignees: string[];
    }
  | {
      type: "add-employee";
      username: string;
      email: string;
      position: string;
    }
  | {
      type: "add-client";
      username: string;
      email: string;
    }
  | {
      type: "assign-task";
      name: string;
      projectName: string;
      assignees: string[];
      priority: string;
    }
  | {
      type: "update-position";
      username: string;
      position: string;
    };

type Message = {
  id: number;
  sender: Sender;
  text: string;
  pendingAction?: PendingAction;
};

const quickPrompts: Record<ChatRole, string[]> = {
  admin: [
    "How do I create a project?",
    "How do I assign a task?",
    "Add employee kavya kavya@gmail.com developer",
    "Update employee alice position HR",
  ],
  employee: [
    "How do I view my tasks?",
    "How do I reply to a task?",
    "What can I do here?",
  ],
  client: [
    "How do I view projects?",
    "How do I check team members?",
    "What can I do here?",
  ],
};

export function ChatAssistant({ role }: { role: ChatRole }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busyActionId, setBusyActionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(),
      sender: "bot",
      text: introForRole(role),
    },
  ]);

  const suggestions = useMemo(() => quickPrompts[role], [role]);

  function pushMessage(message: Omit<Message, "id">) {
    setMessages((current) => [
      ...current,
      { ...message, id: Date.now() + Math.random() },
    ]);
  }

  function submitPrompt(event?: FormEvent) {
    event?.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;
    setInput("");
    handlePrompt(prompt);
  }

  function handlePrompt(prompt: string) {
    pushMessage({ sender: "user", text: prompt });
    const parsed = parseAdminAction(prompt);

    if (parsed && role !== "admin") {
      pushMessage({
        sender: "bot",
        text: "Only an admin can perform create, update, or assignment actions. I can still guide you through your dashboard.",
      });
      return;
    }

    if (parsed) {
      pushMessage({
        sender: "bot",
        text: describeAction(parsed),
        pendingAction: parsed,
      });
      return;
    }

    pushMessage({ sender: "bot", text: answerHelp(prompt, role) });
  }

  async function confirmAction(message: Message) {
    if (!message.pendingAction) return;
    setBusyActionId(message.id);
    try {
      const result = await executeAction(message.pendingAction);
      pushMessage({ sender: "bot", text: result });
      window.dispatchEvent(new Event("servicedesk-chatbot-data-changed"));
    } catch (error) {
      pushMessage({
        sender: "bot",
        text: error instanceof Error ? error.message : "I could not complete that action.",
      });
    } finally {
      setBusyActionId(null);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      {open && (
        <section className="mb-4 flex h-[min(680px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-900 px-4 py-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Bot size={21} />
            </div>
            <div>
              <div className="font-semibold">ServiceDesk Assistant</div>
              <div className="text-xs text-slate-300">Guide and action helper</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              aria-label="Close chatbot"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.sender === "bot"
                    ? "rounded-bl-md bg-white text-slate-700 shadow-sm"
                    : "ml-auto rounded-br-md bg-blue-600 text-white"
                }`}
              >
                <p className="whitespace-pre-line">{message.text}</p>
                {message.pendingAction && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={busyActionId === message.id}
                      onClick={() => confirmAction(message)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {busyActionId === message.id ? "Working..." : "Confirm"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="border-t border-slate-100 bg-white p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handlePrompt(suggestion)}
                  className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={submitPrompt} className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask or type a command..."
                className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="submit"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
        aria-label="Open chatbot"
      >
        {open ? <X size={24} /> : <MessageCircle size={25} />}
      </button>
    </div>
  );
}

function introForRole(role: ChatRole) {
  if (role === "admin") {
    return "Hi, I can guide you through ServiceDesk and perform confirmed admin actions like creating projects, adding employees, adding clients, assigning tasks, and updating positions.";
  }
  if (role === "employee") {
    return "Hi, I can guide you through the employee portal: tasks, projects, teams, history, and task replies.";
  }
  return "Hi, I can guide you through the client portal: projects, progress, tasks, and delivery team details.";
}

function answerHelp(prompt: string, role: ChatRole) {
  const text = prompt.toLowerCase();
  if (text.includes("project")) {
    return role === "admin"
      ? "To create a project: open Projects, click Add Project, enter name, schedule/details, client, status, then save. You can also type: create project Vector RAG for client John."
      : "Open My Projects or Projects to view active project cards, progress, assigned tasks, and team members.";
  }
  if (text.includes("task") && text.includes("reply")) {
    return "Open the notification bell or My Tasks, choose the task, click Reply, enter recipient email and message, then send. Replies are saved in the database.";
  }
  if (text.includes("assign") || text.includes("task")) {
    return role === "admin"
      ? "To assign a task: open Tasks, click Add Task, choose a project, tick one or more employees, enter task details and status, then save. You can also type: assign task API Design to alice for project Vector RAG."
      : "Use My Tasks to see work assigned to you. Each task is grouped under its project.";
  }
  if (text.includes("employee") || text.includes("position")) {
    return role === "admin"
      ? "Open Employees to add/edit staff. Position is saved to the backend. You can type: update employee alice position HR."
      : "Project Team shows employees working on your active projects.";
  }
  if (text.includes("client")) {
    return role === "admin"
      ? "Open Clients to add, edit, or remove client accounts. You can type: add client john john@gmail.com."
      : "The client portal shows project status, assigned tasks, and delivery team information.";
  }
  return "I can help with projects, employees, clients, task assignment, task replies, and dashboard walkthroughs. Try one of the suggestion buttons below.";
}

function parseAdminAction(prompt: string): PendingAction | null {
  const compact = prompt.trim().replace(/\s+/g, " ");

  const employeeMatch = compact.match(/^add employee ([^\s]+) ([^\s@]+@[^\s@]+\.[^\s@]+)(?: (.+))?$/i);
  if (employeeMatch) {
    return {
      type: "add-employee",
      username: employeeMatch[1],
      email: employeeMatch[2],
      position: employeeMatch[3]?.trim() || "Employee",
    };
  }

  const clientMatch = compact.match(/^add client ([^\s]+) ([^\s@]+@[^\s@]+\.[^\s@]+)$/i);
  if (clientMatch) {
    return {
      type: "add-client",
      username: clientMatch[1],
      email: clientMatch[2],
    };
  }

  const positionMatch = compact.match(/^update employee (.+?) position (.+)$/i);
  if (positionMatch) {
    return {
      type: "update-position",
      username: positionMatch[1].trim(),
      position: positionMatch[2].trim(),
    };
  }

  const taskMatch = compact.match(/^assign task (.+?) to (.+?) for project (.+?)(?: priority (.+))?$/i);
  if (taskMatch) {
    return {
      type: "assign-task",
      name: taskMatch[1].trim(),
      assignees: splitNames(taskMatch[2]),
      projectName: taskMatch[3].trim(),
      priority: taskMatch[4]?.trim() || "Medium",
    };
  }

  const projectMatch = compact.match(/^create project (.+?)(?: for client (.+?))?(?: assigned to (.+))?$/i);
  if (projectMatch) {
    return {
      type: "create-project",
      name: projectMatch[1].trim(),
      owner: projectMatch[2]?.trim() || "General Client",
      assignees: projectMatch[3] ? splitNames(projectMatch[3]) : [],
    };
  }

  return null;
}

function splitNames(value: string) {
  return value
    .split(/,| and /i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function describeAction(action: PendingAction) {
  if (action.type === "create-project") {
    return `I can create this project:\nProject: ${action.name}\nClient: ${action.owner}${
      action.assignees.length ? `\nAssigned employees: ${action.assignees.join(", ")}` : ""
    }\n\nConfirm to save it.`;
  }
  if (action.type === "add-employee") {
    return `I can add this employee:\nName: ${action.username}\nEmail: ${action.email}\nPosition: ${action.position}\n\nConfirm to save it.`;
  }
  if (action.type === "add-client") {
    return `I can add this client:\nName: ${action.username}\nEmail: ${action.email}\n\nConfirm to save it.`;
  }
  if (action.type === "assign-task") {
    return `I can assign this task:\nTask: ${action.name}\nProject: ${action.projectName}\nEmployees: ${action.assignees.join(", ")}\nPriority: ${action.priority}\n\nConfirm to save it.`;
  }
  return `I can update this employee:\nEmployee: ${action.username}\nPosition: ${action.position}\n\nConfirm to save it.`;
}

async function executeAction(action: PendingAction) {
  if (action.type === "add-employee") {
    const employee = await createEmployee({
      username: action.username,
      email: action.email,
      position: action.position,
    });
    return `Employee ${employee.username} was created with ID ${employee.publicId ?? employee.id}.`;
  }

  if (action.type === "add-client") {
    const client = await createClient({
      username: action.username,
      email: action.email,
    });
    return `Client ${client.username} was created with ID ${client.publicId ?? client.id}.`;
  }

  if (action.type === "update-position") {
    const employees = await getEmployees();
    const employee = employees.find(
      (item) => item.username.toLowerCase() === action.username.toLowerCase(),
    );
    if (!employee) throw new Error(`I could not find employee "${action.username}".`);
    const saved = await updateEmployee(employee.id, {
      username: employee.username,
      email: employee.email,
      position: action.position,
    });
    return `${saved.username}'s position is now ${saved.position ?? action.position}.`;
  }

  if (action.type === "create-project") {
    const project = await createProject({
      name: action.name,
      detail: "Created by chatbot",
      status: "Active",
      owner: action.owner,
    });
    if (action.assignees.length) {
      const employees = await getEmployees();
      const assignees = employees.filter((employee) =>
        action.assignees.some((name) => employee.username.toLowerCase() === name.toLowerCase()),
      );
      if (assignees.length) {
        await createTask({
          projectId: project.id,
          employeeId: assignees[0].id,
          employeeIds: assignees.map((employee) => employee.id),
          name: `${project.name} kickoff`,
          detail: "Medium",
          status: "Pending",
          owner: assignees.map((employee) => employee.username).join(", "),
        });
      }
    }
    return `Project ${project.name} was created.${action.assignees.length ? " I also created a kickoff task for matched employees." : ""}`;
  }

  const projects = await getProjects();
  const project = projects.find(
    (item) => item.name.toLowerCase() === action.projectName.toLowerCase(),
  );
  if (!project) throw new Error(`I could not find project "${action.projectName}".`);
  const employees = await getEmployees();
  const assignees = employees.filter((employee) =>
    action.assignees.some((name) => employee.username.toLowerCase() === name.toLowerCase()),
  );
  if (!assignees.length) throw new Error("I could not match any employee names for this task.");
  const task = await createTask({
    projectId: project.id,
    employeeId: assignees[0].id,
    employeeIds: assignees.map((employee) => employee.id),
    name: action.name,
    detail: action.priority,
    status: "Pending",
    owner: assignees.map((employee) => employee.username).join(", "),
  });
  return `Task ${task.name} was assigned to ${assignees.map((employee) => employee.username).join(", ")}.`;
}
