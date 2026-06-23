"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { STANDARD_CHECKLISTS } from "@/lib/standard-checklists";
import {
  PERMIT_TYPE_LABELS,
  type ChecklistTemplateItem,
  type PermitType,
} from "@/lib/types";

const TYPES = Object.keys(PERMIT_TYPE_LABELS) as PermitType[];

function sameAsStandard(type: PermitType, items: ChecklistTemplateItem[]): boolean {
  const std = STANDARD_CHECKLISTS[type].items;
  if (std.length !== items.length) return false;
  return std.every(
    (s, i) =>
      s.label === items[i].label && (s.note ?? "") === (items[i].note ?? "")
  );
}

export default function ChecklistsPage() {
  const { loading, templates, saveTemplate, resetTemplate } = useStore();
  const [active, setActive] = useState<PermitType>("residential_building");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  // Leave edit/reset state behind when switching permit types.
  useEffect(() => {
    setEditingId(null);
    setConfirmReset(false);
  }, [active]);

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton-list" role="status" aria-label="Loading checklists">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-line" style={{ width: "45%" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const template = templates[active];
  const items = template.items;
  const isStandard = sameAsStandard(active, items);

  function update(items: ChecklistTemplateItem[]) {
    saveTemplate({ permitType: active, items });
  }

  function startEdit(item: ChecklistTemplateItem) {
    setEditingId(item.id);
    setDraftLabel(item.label);
    setDraftNote(item.note ?? "");
  }

  function commitEdit() {
    if (!editingId) return;
    const label = draftLabel.trim();
    if (!label) return;
    update(
      items.map((i) =>
        i.id === editingId
          ? { ...i, label, note: draftNote.trim() || undefined }
          : i
      )
    );
    setEditingId(null);
  }

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    update([...items, { id: `custom-${crypto.randomUUID()}`, label }]);
    setNewLabel("");
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Standard checklists</h1>
          <p className="page-subtitle">
            The default document list seeded into every new package, per permit
            type. Edits apply to future packages — existing packages keep their
            own checklist.
          </p>
        </div>
      </div>

      <div className="type-tabs" role="tablist" aria-label="Permit type">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === active}
            className={`type-tab ${t === active ? "is-active" : ""}`}
            onClick={() => setActive(t)}
          >
            {PERMIT_TYPE_LABELS[t]}
            <span className="type-tab-count tnum">{templates[t].items.length}</span>
          </button>
        ))}
      </div>

      <section className="card" aria-label={`${PERMIT_TYPE_LABELS[active]} checklist template`}>
        <div className="card-head">
          <h2>{PERMIT_TYPE_LABELS[active]}</h2>
          {!isStandard &&
            (confirmReset ? (
              <div className="reset-confirm">
                <span>Discard your edits and restore the standard list?</span>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    resetTemplate(active);
                    setConfirmReset(false);
                  }}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => setConfirmReset(false)}
                >
                  Keep edits
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setConfirmReset(true)}
              >
                <RotateCcw size={13} aria-hidden />
                Restore defaults
              </button>
            ))}
        </div>

        {items.length === 0 ? (
          <p className="template-empty">
            This checklist is empty — new {PERMIT_TYPE_LABELS[active]} packages
            will start with no document items. Add items below or restore the
            standard list.
          </p>
        ) : (
          <ol className="template-list">
            {items.map((item, index) => (
              <li key={item.id} className="template-item">
                {editingId === item.id ? (
                  <div className="template-edit">
                    <input
                      type="text"
                      value={draftLabel}
                      onChange={(e) => setDraftLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      aria-label="Item label"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      placeholder="Note (optional) — e.g. 'Required over $5,000'"
                      aria-label="Item note"
                    />
                    <div className="template-edit-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={commitEdit}
                        aria-label="Save item"
                        disabled={!draftLabel.trim()}
                      >
                        <Check size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setEditingId(null)}
                        aria-label="Cancel editing"
                      >
                        <X size={15} aria-hidden />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="template-text">
                      {item.label}
                      {item.note && <span className="check-note">{item.note}</span>}
                    </span>
                    <div className="template-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move "${item.label}" up`}
                      >
                        <ArrowUp size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                        aria-label={`Move "${item.label}" down`}
                      >
                        <ArrowDown size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => startEdit(item)}
                        aria-label={`Edit "${item.label}"`}
                      >
                        <Pencil size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        onClick={() => update(items.filter((i) => i.id !== item.id))}
                        aria-label={`Remove "${item.label}"`}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}

        <form onSubmit={addItem} className="template-add">
          <label htmlFor="new-item" className="sr-only">
            Add checklist item
          </label>
          <input
            id="new-item"
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Add a document requirement…"
          />
          <button type="submit" className="btn-secondary" disabled={!newLabel.trim()}>
            <Plus size={15} strokeWidth={2.25} aria-hidden />
            Add item
          </button>
        </form>
      </section>
    </div>
  );
}
