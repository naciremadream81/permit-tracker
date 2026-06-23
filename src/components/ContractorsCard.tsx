"use client";

import { useState } from "react";
import { Check, HardHat, Pencil, Phone, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { ContractorNameInput } from "./ContractorNameInput";
import type {
  Contractor,
  DirectoryEntry,
  PermitPackage,
  Subcontractor,
} from "@/lib/types";

interface DraftSub {
  trade: string;
  name: string;
  license: string;
  phone: string;
}

const EMPTY_DRAFT: DraftSub = { trade: "", name: "", license: "", phone: "" };

/** Fill empty draft fields from a directory match without clobbering typed values. */
function draftWithMatch(draft: DraftSub, name: string, match: DirectoryEntry | undefined): DraftSub {
  if (!match) return { ...draft, name };
  return {
    name,
    trade: draft.trade || match.trades[0] || "",
    license: draft.license || match.license || "",
    phone: draft.phone || match.phone || "",
  };
}

function ContractorLine({ c }: { c: Contractor }) {
  return (
    <span className="contractor-line">
      <span className="contractor-name">{c.name}</span>
      <span className="contractor-meta">
        {c.license && <span className="tnum">Lic. {c.license}</span>}
        {c.phone && (
          <span className="tnum contractor-phone">
            <Phone size={11} strokeWidth={2} aria-hidden />
            {c.phone}
          </span>
        )}
      </span>
    </span>
  );
}

export function ContractorsCard({ pkg }: { pkg: PermitPackage }) {
  const {
    updateContractor,
    addSubcontractor,
    updateSubcontractor,
    removeSubcontractor,
  } = useStore();

  const [editingMain, setEditingMain] = useState(false);
  const [mainDraft, setMainDraft] = useState<DraftSub>(EMPTY_DRAFT);
  const [addingSub, setAddingSub] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [subDraft, setSubDraft] = useState<DraftSub>(EMPTY_DRAFT);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  function startEditMain() {
    setMainDraft({
      trade: "",
      name: pkg.contractor?.name ?? "",
      license: pkg.contractor?.license ?? "",
      phone: pkg.contractor?.phone ?? "",
    });
    setEditingMain(true);
  }

  function commitMain() {
    const name = mainDraft.name.trim();
    updateContractor(
      pkg.id,
      name
        ? {
            name,
            license: mainDraft.license.trim() || undefined,
            phone: mainDraft.phone.trim() || undefined,
          }
        : undefined
    );
    setEditingMain(false);
  }

  function startEditSub(sub: Subcontractor) {
    setSubDraft({
      trade: sub.trade,
      name: sub.name,
      license: sub.license ?? "",
      phone: sub.phone ?? "",
    });
    setEditingSubId(sub.id);
    setAddingSub(false);
  }

  function commitSub() {
    const name = subDraft.name.trim();
    const trade = subDraft.trade.trim();
    if (!name || !trade) return;
    const data = {
      trade,
      name,
      license: subDraft.license.trim() || undefined,
      phone: subDraft.phone.trim() || undefined,
    };
    if (editingSubId) {
      updateSubcontractor(pkg.id, { id: editingSubId, ...data });
      setEditingSubId(null);
    } else {
      addSubcontractor(pkg.id, data);
      setAddingSub(false);
    }
    setSubDraft(EMPTY_DRAFT);
  }

  const subFormOpen = addingSub || editingSubId !== null;

  return (
    <section className="card" aria-labelledby="contractors-heading">
      <div className="card-head">
        <h2 id="contractors-heading">Contractors</h2>
      </div>

      <div className="contractor-block">
        <h3 className="contractor-role">Main contractor</h3>
        {editingMain ? (
          <div className="sub-form">
            <ContractorNameInput
              value={mainDraft.name}
              onChange={(name, match) => setMainDraft(draftWithMatch(mainDraft, name, match))}
              placeholder="Company or contractor name"
              ariaLabel="Main contractor name"
              autoFocus
            />
            <div className="sub-form-row">
              <input
                type="text"
                value={mainDraft.license}
                onChange={(e) => setMainDraft({ ...mainDraft, license: e.target.value })}
                placeholder="License # (CGC…)"
                aria-label="Main contractor license number"
              />
              <input
                type="tel"
                value={mainDraft.phone}
                onChange={(e) => setMainDraft({ ...mainDraft, phone: e.target.value })}
                placeholder="Phone"
                aria-label="Main contractor phone"
              />
            </div>
            <div className="sub-form-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={commitMain}>
                <Check size={13} aria-hidden />
                Save
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setEditingMain(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : pkg.contractor ? (
          <div className="contractor-row">
            <HardHat size={15} strokeWidth={2} className="contractor-icon" aria-hidden />
            <ContractorLine c={pkg.contractor} />
            <button
              type="button"
              className="icon-btn"
              onClick={startEditMain}
              aria-label="Edit main contractor"
            >
              <Pencil size={14} aria-hidden />
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ghost btn-sm contractor-add" onClick={startEditMain}>
            <Plus size={13} strokeWidth={2.25} aria-hidden />
            Add main contractor
          </button>
        )}
      </div>

      <div className="contractor-block">
        <h3 className="contractor-role">Subcontractors</h3>
        {pkg.subcontractors.length === 0 && !subFormOpen && (
          <p className="contractor-empty">
            No subcontractors on this package yet.
          </p>
        )}
        <ul className="sub-list">
          {pkg.subcontractors.map((sub) =>
            editingSubId === sub.id ? (
              <li key={sub.id} className="sub-form">
                <div className="sub-form-row">
                  <input
                    type="text"
                    value={subDraft.trade}
                    onChange={(e) => setSubDraft({ ...subDraft, trade: e.target.value })}
                    placeholder="Trade"
                    aria-label="Subcontractor trade"
                    autoFocus
                  />
                  <ContractorNameInput
                    value={subDraft.name}
                    onChange={(name, match) => setSubDraft(draftWithMatch(subDraft, name, match))}
                    placeholder="Company name"
                    ariaLabel="Subcontractor name"
                    tradesOnly
                  />
                </div>
                <div className="sub-form-row">
                  <input
                    type="text"
                    value={subDraft.license}
                    onChange={(e) => setSubDraft({ ...subDraft, license: e.target.value })}
                    placeholder="License #"
                    aria-label="Subcontractor license number"
                  />
                  <input
                    type="tel"
                    value={subDraft.phone}
                    onChange={(e) => setSubDraft({ ...subDraft, phone: e.target.value })}
                    placeholder="Phone"
                    aria-label="Subcontractor phone"
                  />
                </div>
                <div className="sub-form-actions">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={commitSub}
                    disabled={!subDraft.name.trim() || !subDraft.trade.trim()}
                  >
                    <Check size={13} aria-hidden />
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setEditingSubId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ) : (
              <li key={sub.id} className="contractor-row">
                <span className="sub-trade">{sub.trade}</span>
                <ContractorLine c={sub} />
                {confirmRemoveId === sub.id ? (
                  <div className="reset-confirm">
                    <span>Remove?</span>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => {
                        removeSubcontractor(pkg.id, sub.id);
                        setConfirmRemoveId(null);
                      }}
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => setConfirmRemoveId(null)}
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <div className="sub-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => startEditSub(sub)}
                      aria-label={`Edit ${sub.name}`}
                    >
                      <Pencil size={14} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      onClick={() => setConfirmRemoveId(sub.id)}
                      aria-label={`Remove ${sub.name}`}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                )}
              </li>
            )
          )}
        </ul>

        {addingSub ? (
          <div className="sub-form">
            <div className="sub-form-row">
              <input
                type="text"
                value={subDraft.trade}
                onChange={(e) => setSubDraft({ ...subDraft, trade: e.target.value })}
                placeholder="Trade (Electrical, Plumbing…)"
                aria-label="Subcontractor trade"
                autoFocus
              />
              <ContractorNameInput
                value={subDraft.name}
                onChange={(name, match) => setSubDraft(draftWithMatch(subDraft, name, match))}
                placeholder="Company name"
                ariaLabel="Subcontractor name"
                tradesOnly
              />
            </div>
            <div className="sub-form-row">
              <input
                type="text"
                value={subDraft.license}
                onChange={(e) => setSubDraft({ ...subDraft, license: e.target.value })}
                placeholder="License #"
                aria-label="Subcontractor license number"
              />
              <input
                type="tel"
                value={subDraft.phone}
                onChange={(e) => setSubDraft({ ...subDraft, phone: e.target.value })}
                placeholder="Phone"
                aria-label="Subcontractor phone"
              />
            </div>
            <div className="sub-form-actions">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={commitSub}
                disabled={!subDraft.name.trim() || !subDraft.trade.trim()}
              >
                <Check size={13} aria-hidden />
                Add
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => {
                  setAddingSub(false);
                  setSubDraft(EMPTY_DRAFT);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          !editingSubId && (
            <button
              type="button"
              className="btn-ghost btn-sm contractor-add"
              onClick={() => {
                setSubDraft(EMPTY_DRAFT);
                setAddingSub(true);
              }}
            >
              <Plus size={13} strokeWidth={2.25} aria-hidden />
              Add subcontractor
            </button>
          )
        )}
      </div>
    </section>
  );
}
