"use client"

import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import type { Persona } from "@/hooks/use-voice-agent"
import { cn } from "@/lib/utils"
import { Mic, Pencil, Plus, Trash2, Users, X } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const VOICES = [
  { id: "abhilash", label: "Abhilash (male)" },
  { id: "anushka", label: "Anushka (female)" },
  { id: "karun", label: "Karun (male)" },
  { id: "manisha", label: "Manisha (female)" },
  { id: "vidya", label: "Vidya (female)" },
  { id: "arya", label: "Arya (female)" },
]

interface FormState {
  name: string
  role: string
  description: string
  language: string
  voice: string
  greeting: string
  systemPrompt: string
}

const EMPTY_FORM: FormState = {
  name: "",
  role: "general",
  description: "",
  language: "hinglish",
  voice: "abhilash",
  greeting: "",
  systemPrompt: "",
}

function PersonaForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Persona
  onCancel: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          name: initial.name,
          role: initial.role,
          description: initial.description || "",
          language: initial.language,
          voice: initial.voice,
          greeting: initial.greeting || "",
          systemPrompt: initial.systemPrompt,
        }
      : EMPTY_FORM,
  )
  const [saving, setSaving] = useState(false)
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.systemPrompt.trim()) return
    setSaving(true)
    try {
      await fetch(initial ? `/api/personas/${initial.id}` : "/api/personas", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-primary/40 bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{initial ? "Edit Agent" : "New Agent"}</h2>
        <Button type="button" variant="ghost" size="icon" className="size-7" onClick={onCancel} aria-label="Close form">
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="p-name" className="mb-1 block text-xs font-medium text-muted-foreground">
            Name
          </label>
          <input
            id="p-name"
            className={inputCls}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Priya — Sales Executive"
            required
          />
        </div>
        <div>
          <label htmlFor="p-role" className="mb-1 block text-xs font-medium text-muted-foreground">
            Role
          </label>
          <select id="p-role" className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option value="general">General</option>
            <option value="sales">Sales</option>
            <option value="support">Support</option>
            <option value="scheduler">Scheduler</option>
          </select>
        </div>
        <div>
          <label htmlFor="p-lang" className="mb-1 block text-xs font-medium text-muted-foreground">
            Language
          </label>
          <select
            id="p-lang"
            className={inputCls}
            value={form.language}
            onChange={(e) => set("language", e.target.value)}
          >
            <option value="hinglish">Hinglish (Hindi + English)</option>
            <option value="telugu">Telugu</option>
          </select>
        </div>
        <div>
          <label htmlFor="p-voice" className="mb-1 block text-xs font-medium text-muted-foreground">
            Voice
          </label>
          <select id="p-voice" className={inputCls} value={form.voice} onChange={(e) => set("voice", e.target.value)}>
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="p-desc" className="mb-1 block text-xs font-medium text-muted-foreground">
          Short description
        </label>
        <input
          id="p-desc"
          className={inputCls}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What this agent does"
        />
      </div>

      <div>
        <label htmlFor="p-greet" className="mb-1 block text-xs font-medium text-muted-foreground">
          Greeting (spoken when the call starts)
        </label>
        <input
          id="p-greet"
          className={inputCls}
          value={form.greeting}
          onChange={(e) => set("greeting", e.target.value)}
          placeholder="Namaste! Main aapki kaise madad kar sakti hoon?"
        />
      </div>

      <div>
        <label htmlFor="p-prompt" className="mb-1 block text-xs font-medium text-muted-foreground">
          System prompt (personality & instructions)
        </label>
        <textarea
          id="p-prompt"
          className={cn(inputCls, "min-h-32 resize-y font-mono text-xs leading-relaxed")}
          value={form.systemPrompt}
          onChange={(e) => set("systemPrompt", e.target.value)}
          placeholder="You are..."
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" className="bg-transparent" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : initial ? "Save Changes" : "Create Agent"}
        </Button>
      </div>
    </form>
  )
}

export function PersonasManager() {
  const { data: personas, isLoading, mutate } = useSWR<Persona[]>("/api/personas", fetcher)
  const [editing, setEditing] = useState<Persona | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const remove = async (id: number) => {
    setDeletingId(id)
    try {
      await fetch(`/api/personas/${id}`, { method: "DELETE" })
      await mutate()
    } finally {
      setDeletingId(null)
    }
  }

  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Personas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each persona has its own personality, language, and Sarvam AI voice.
          </p>
        </div>
        {!creating && !editing && (
          <Button className="gap-2 self-start rounded-full" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New Agent
          </Button>
        )}
      </header>

      {(creating || editing) && (
        <PersonaForm
          initial={editing ?? undefined}
          onCancel={closeForm}
          onSaved={async () => {
            closeForm()
            await mutate()
          }}
        />
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : !personas || personas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-12">
          <Users className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No agents yet — create your first persona.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {personas.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.language === "telugu" ? "Telugu" : "Hinglish"}
                    {" · "}
                    <span className="capitalize">{p.role}</span>
                    {" · voice: "}
                    <span className="capitalize">{p.voice}</span>
                  </p>
                </div>
                {p.isDefault && (
                  <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Default
                  </span>
                )}
              </div>
              {p.description && (
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{p.description}</p>
              )}
              {p.greeting && (
                <p className="line-clamp-2 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs italic leading-relaxed text-muted-foreground">
                  &ldquo;{p.greeting}&rdquo;
                </p>
              )}
              <div className="mt-auto flex items-center gap-2 pt-1">
                <Button asChild size="sm" variant="outline" className="gap-1.5 bg-transparent text-xs">
                  <Link href="/call">
                    <Mic className="size-3" />
                    Call
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    setCreating(false)
                    setEditing(p)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                >
                  <Pencil className="size-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-xs text-destructive hover:text-destructive"
                  onClick={() => remove(p.id)}
                  disabled={deletingId === p.id}
                >
                  <Trash2 className="size-3" />
                  {deletingId === p.id ? "Removing..." : "Delete"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
