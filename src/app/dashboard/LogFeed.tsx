"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import {
  Plus,
  LogOut,
  Clock,
  CheckCircle2,
  Circle,
  Flag,
  Calendar,
  X,
  Trash2,
  Copy,
} from "lucide-react";

type Priority = "low" | "medium" | "high" | "urgent";
type Status = "planned" | "in_progress" | "done";

interface Member {
  id: string;
  name: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  createdAt: string;
  startedAt: string | null;
  doneAt: string | null;
  deadline: string | null;
  author: { id: string; name: string; role: string };
}

interface TeamInfo {
  name: string;
  inviteCode: string;
}

const PRIORITIES: { id: Priority; label: string; className: string }[] = [
  { id: "low", label: "Low", className: "text-low border-low" },
  { id: "medium", label: "Medium", className: "text-medium border-medium" },
  { id: "high", label: "High", className: "text-high border-high" },
  { id: "urgent", label: "Urgent", className: "text-urgent border-urgent" },
];

const PRIORITY_BG: Record<Priority, string> = {
  low: "#6B8F71",
  medium: "#4A6FA5",
  high: "#C98A3D",
  urgent: "#B5482B",
};

const STATUSES: { id: Status; label: string; icon: any }[] = [
  { id: "planned", label: "Planned", icon: Circle },
  { id: "in_progress", label: "In progress", icon: Clock },
  { id: "done", label: "Done", icon: CheckCircle2 },
];

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function duration(startIso: string, endIso?: string | null) {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const mins = Math.floor((end - start) / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
}

export default function LogFeed({ currentUser }: { currentUser: Member }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState("");

  const [filterMember, setFilterMember] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const [justDone, setJustDone] = useState<string | null>(null);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const stampTimer = useRef<ReturnType<typeof setTimeout>>();

  const isDirector = currentUser.role === "director";

  const fetchAll = useCallback(async () => {
    const [tasksRes, membersRes, teamRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/team/members"),
      fetch("/api/team"),
    ]);
    if (tasksRes.ok) setTasks(await tasksRes.json());
    if (membersRes.ok) setMembers(await membersRes.json());
    if (teamRes.ok) setTeam(await teamRes.json());
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  async function createTask() {
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline: deadline || null,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => [task, ...prev]);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDeadline("");
      setComposerOpen(false);
    }
  }

  async function setStatus(taskId: string, status: Status) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (status === "done") {
        setJustDone(taskId);
        clearTimeout(stampTimer.current);
        stampTimer.current = setTimeout(() => setJustDone(null), 900);
      }
    }
  }

  async function deleteTask(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function changeRole(memberId: string, role: string) {
    const res = await fetch(`/api/team/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    }
  }

  const isOverdue = (t: Task) => !!t.deadline && t.status !== "done" && new Date(t.deadline) < new Date();

  const filtered = tasks.filter((t) => {
    if (filterMember !== "all" && t.author.id !== filterMember) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const grouped: { label: string; items: Task[] }[] = [];
  filtered
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach((t) => {
      const label = dayLabel(t.createdAt);
      let group = grouped.find((g) => g.label === label);
      if (!group) {
        group = { label, items: [] };
        grouped.push(group);
      }
      group.items.push(t);
    });

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter(isOverdue).length,
  };

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center text-paper">Loading log…</div>;
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Top bar */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-inkline">
        <div className="flex items-baseline gap-3">
          <div className="font-display text-2xl font-semibold text-paper">The Log</div>
          {team && <div className="text-xs text-muted2">{team.name}</div>}
          {isDirector && <div className="text-xs text-high tracking-wide">director view</div>}
        </div>
        <div className="flex items-center gap-4">
          {isDirector && (
            <button
              onClick={() => setShowTeamPanel((v) => !v)}
              className="text-xs text-muted2 border border-inkline rounded px-3 py-1.5"
            >
              Invite &amp; roles
            </button>
          )}
          <div className="text-right">
            <div className="text-sm text-paper font-medium">{currentUser.name}</div>
            <div className="text-xs text-muted2 capitalize">{currentUser.role}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="border border-inkline rounded p-2 text-muted2"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6">
        {showTeamPanel && isDirector && team && (
          <div className="mt-6 bg-paper rounded p-5 rise-in">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-lg font-semibold text-textdark">Invite your team</div>
              <button onClick={() => setShowTeamPanel(false)} className="text-textmuted">
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-5">
              <div className="text-2xl font-display font-semibold tracking-widest text-textdark">
                {team.inviteCode}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(team.inviteCode)}
                className="text-textmuted border border-rule rounded p-1.5"
                title="Copy invite code"
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="text-xs text-textmuted mb-2">Team members</div>
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-paperdim last:border-0">
                <div className="text-sm text-textdark">{m.name}</div>
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m.id, e.target.value)}
                  disabled={m.id === currentUser.id}
                  className="text-xs border border-rule rounded px-2 py-1 bg-white text-textdark"
                >
                  <option value="member">Member</option>
                  <option value="director">Director</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-px bg-inkline mt-6 rounded overflow-hidden">
          {[
            ["Total", stats.total, "text-paper"],
            ["In progress", stats.inProgress, "text-medium"],
            ["Done", stats.done, "text-low"],
            ["Overdue", stats.overdue, "text-urgent"],
          ].map(([label, val, cls]) => (
            <div key={label as string} className="bg-inkpanel px-4 py-3.5">
              <div className={`font-display text-2xl font-semibold ${cls}`}>{val as number}</div>
              <div className="text-xs text-muted2 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2.5 mt-5 flex-wrap items-center">
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="text-xs bg-inkpanel border border-inkline text-paperdim rounded px-2.5 py-1.5"
          >
            <option value="all">Everyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-inkpanel border border-inkline text-paperdim rounded px-2.5 py-1.5"
          >
            <option value="all">Any status</option>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs bg-inkpanel border border-inkline text-paperdim rounded px-2.5 py-1.5"
          >
            <option value="all">Any priority</option>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <div className="flex-1" />

          <button
            onClick={() => setComposerOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded text-sm font-semibold"
            style={{ background: composerOpen ? "#2A3B34" : "#C98A3D", color: composerOpen ? "#F1E9D2" : "#1B140A" }}
          >
            {composerOpen ? <X size={15} /> : <Plus size={15} />}
            {composerOpen ? "Cancel" : "New entry"}
          </button>
        </div>

        {/* Composer */}
        {composerOpen && (
          <div className="bg-paper rounded p-5 mt-3.5 rise-in">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you working on?"
              className="w-full box-border px-3 py-2.5 mb-2.5 border border-rule rounded font-display text-base font-medium text-textdark bg-white"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details or plan (optional)"
              rows={2}
              className="w-full box-border px-3 py-2.5 mb-3 border border-rule rounded text-sm text-textdark bg-white resize-y"
            />
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriority(p.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium border"
                    style={{
                      borderColor: priority === p.id ? PRIORITY_BG[p.id] : "#C9BC97",
                      background: priority === p.id ? PRIORITY_BG[p.id] : "transparent",
                      color: priority === p.id ? "#fff" : "#5B6A5E",
                    }}
                  >
                    <Flag size={11} />
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-textmuted" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="border border-rule rounded px-2 py-1 text-xs text-textdark bg-white"
                />
                <span className="text-xs text-textmuted">deadline (optional)</span>
              </div>
              <div className="flex-1" />
              <button
                onClick={createTask}
                disabled={!title.trim()}
                className="px-4.5 py-2 rounded text-sm font-semibold text-paper disabled:opacity-50"
                style={{ background: "#3E5E52" }}
              >
                Post entry
              </button>
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="mt-7">
          {grouped.length === 0 && (
            <div className="text-center text-muted2 py-16 text-sm">Nothing here yet.</div>
          )}
          {grouped.map((group) => (
            <div key={group.label} className="mb-8">
              <div className="flex items-center gap-3 mb-3.5">
                <div className="font-display text-sm font-semibold text-rule">{group.label}</div>
                <div className="flex-1 h-px bg-inkline" />
              </div>

              {group.items.map((t) => {
                const overdue = isOverdue(t);
                const canEdit = t.author.id === currentUser.id;
                return (
                  <div
                    key={t.id}
                    className="relative bg-paper rounded overflow-hidden mb-3 px-4.5 py-4 rise-in"
                    style={{ borderLeft: `4px solid ${PRIORITY_BG[t.priority]}` }}
                  >
                    {justDone === t.id && (
                      <div
                        className="stamp absolute top-2.5 right-3.5 border-[3px] font-display font-bold text-xs px-2.5 py-0.5 rounded pointer-events-none tracking-widest"
                        style={{ borderColor: "#3C6E47", color: "#3C6E47", transform: "rotate(-12deg)" }}
                      >
                        DONE
                      </div>
                    )}

                    <div className="flex justify-between gap-2.5">
                      <div className="flex-1">
                        <div className="font-display text-lg font-semibold text-textdark mb-0.5">{t.title}</div>
                        {t.description && (
                          <div className="text-sm text-textmuted mb-2 leading-snug">{t.description}</div>
                        )}
                      </div>
                      {canEdit && (
                        <button onClick={() => deleteTask(t.id)} title="Delete" className="text-[#B79A7A] h-fit p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center flex-wrap gap-2.5 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-textmuted">
                        <span
                          className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-semibold"
                          style={{ background: t.author.role === "director" ? "#C98A3D" : "#3E5E52" }}
                        >
                          {t.author.name.charAt(0).toUpperCase()}
                        </span>
                        {t.author.name}
                      </span>

                      <span
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: PRIORITY_BG[t.priority] }}
                      >
                        <Flag size={10} /> {PRIORITIES.find((p) => p.id === t.priority)?.label}
                      </span>

                      {t.deadline && (
                        <span
                          className={`flex items-center gap-1 text-xs ${overdue ? "font-semibold text-urgent" : "text-textmuted"}`}
                        >
                          <Calendar size={10} />
                          {overdue ? "Overdue — " : "Due "}
                          {new Date(t.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}

                      {t.startedAt && t.status === "in_progress" && (
                        <span className="text-xs text-medium">
                          started {timeAgo(t.startedAt)} ago · running {duration(t.startedAt)}
                        </span>
                      )}
                      {t.status === "done" && t.startedAt && t.doneAt && (
                        <span className="text-xs text-done">
                          took {duration(t.startedAt, t.doneAt)} · finished {fmtDateTime(t.doneAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-1.5 mt-3">
                      {STATUSES.map((s) => {
                        const Icon = s.icon;
                        const active = t.status === s.id;
                        const disabled = !canEdit;
                        return (
                          <button
                            key={s.id}
                            disabled={disabled}
                            onClick={() => setStatus(t.id, s.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors"
                            style={{
                              borderColor: active ? "#1C2620" : "#C9BC97",
                              background: active ? "#1C2620" : "transparent",
                              color: active ? "#F1E9D2" : disabled ? "#B9AF95" : "#5B6A5E",
                              cursor: disabled ? "default" : "pointer",
                            }}
                          >
                            <Icon size={11} />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
