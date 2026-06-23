"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { ContractorNameInput } from "./ContractorNameInput";
import { COUNTIES, REGION_LABELS } from "@/lib/counties";
import {
  PERMIT_TYPE_LABELS,
  type PermitType,
  type Region,
} from "@/lib/types";

const REGION_ORDER: Region[] = ["central", "south", "southeast", "southwest"];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewPackagePanel({ open, onClose }: Props) {
  const { addPackage, templates } = useStore();
  const router = useRouter();
  const formId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [client, setClient] = useState("");
  const [address, setAddress] = useState("");
  const [countyId, setCountyId] = useState("");
  const [permitType, setPermitType] = useState<PermitType | "">("");
  const [contractorName, setContractorName] = useState("");
  const [contractorLicense, setContractorLicense] = useState("");
  const [contractorPhone, setContractorPhone] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deadlineLabel, setDeadlineLabel] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!client.trim()) next.client = "Enter the client or contractor name.";
    if (!address.trim()) next.address = "Enter the project address.";
    if (!countyId) next.county = "Pick the county the permit is filed in.";
    if (!permitType) next.permitType = "Pick a permit type to seed its checklist.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const pkg = addPackage({
      client: client.trim(),
      projectAddress: address.trim(),
      countyId,
      permitType: permitType as PermitType,
      contractor: contractorName.trim()
        ? {
            name: contractorName.trim(),
            license: contractorLicense.trim() || undefined,
            phone: contractorPhone.trim() || undefined,
          }
        : undefined,
      deadline: deadline ? new Date(`${deadline}T12:00:00`).toISOString() : undefined,
      deadlineLabel: deadline ? deadlineLabel.trim() || "Target date" : undefined,
    });
    setClient("");
    setAddress("");
    setCountyId("");
    setPermitType("");
    setContractorName("");
    setContractorLicense("");
    setContractorPhone("");
    setDeadline("");
    setDeadlineLabel("");
    setErrors({});
    onClose();
    router.push(`/packages/${pkg.id}`);
  }

  if (!open) return null;

  const checklistSize =
    permitType !== "" ? templates[permitType].items.length : null;

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
      >
        <div className="panel-head">
          <h2 id={`${formId}-title`}>New permit package</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close panel">
            <X size={17} aria-hidden />
          </button>
        </div>

        <form onSubmit={submit} noValidate className="panel-form">
          <div className="field">
            <label htmlFor={`${formId}-client`}>Client / contractor</label>
            <input
              ref={firstFieldRef}
              id={`${formId}-client`}
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Suncoast Builders LLC"
              aria-invalid={!!errors.client}
              aria-describedby={errors.client ? `${formId}-client-err` : undefined}
            />
            {errors.client && (
              <p className="field-error" id={`${formId}-client-err`}>{errors.client}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor={`${formId}-address`}>Project address</label>
            <input
              id={`${formId}-address`}
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="2814 Mangrove Bend Dr, Cape Coral"
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? `${formId}-address-err` : undefined}
            />
            {errors.address && (
              <p className="field-error" id={`${formId}-address-err`}>{errors.address}</p>
            )}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor={`${formId}-county`}>County</label>
              <select
                id={`${formId}-county`}
                value={countyId}
                onChange={(e) => setCountyId(e.target.value)}
                aria-invalid={!!errors.county}
                aria-describedby={errors.county ? `${formId}-county-err` : undefined}
              >
                <option value="">Select county…</option>
                {REGION_ORDER.map((region) => (
                  <optgroup key={region} label={REGION_LABELS[region]}>
                    {COUNTIES.filter((c) => c.region === region).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.county && (
                <p className="field-error" id={`${formId}-county-err`}>{errors.county}</p>
              )}
            </div>

            <div className="field">
              <label htmlFor={`${formId}-type`}>Permit type</label>
              <select
                id={`${formId}-type`}
                value={permitType}
                onChange={(e) => setPermitType(e.target.value as PermitType | "")}
                aria-invalid={!!errors.permitType}
                aria-describedby={errors.permitType ? `${formId}-type-err` : undefined}
              >
                <option value="">Select type…</option>
                {(Object.keys(PERMIT_TYPE_LABELS) as PermitType[]).map((t) => (
                  <option key={t} value={t}>
                    {PERMIT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              {errors.permitType && (
                <p className="field-error" id={`${formId}-type-err`}>{errors.permitType}</p>
              )}
            </div>
          </div>

          {checklistSize !== null && (
            <p className="panel-hint">
              The standard {PERMIT_TYPE_LABELS[permitType as PermitType]} checklist
              ({checklistSize} items) will be added automatically. You can edit
              defaults under Checklists.
            </p>
          )}

          <fieldset className="panel-fieldset">
            <legend>
              Main contractor <span className="label-optional">optional — you can add subs later</span>
            </legend>
            <div className="field">
              <label htmlFor={`${formId}-contractor`} className="sr-only">
                Contractor name
              </label>
              <ContractorNameInput
                id={`${formId}-contractor`}
                value={contractorName}
                onChange={(name, match) => {
                  setContractorName(name);
                  if (match) {
                    if (!contractorLicense.trim() && match.license) setContractorLicense(match.license);
                    if (!contractorPhone.trim() && match.phone) setContractorPhone(match.phone);
                  }
                }}
                placeholder="Company or contractor name"
                ariaLabel="Main contractor name"
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor={`${formId}-license`} className="sr-only">
                  License number
                </label>
                <input
                  id={`${formId}-license`}
                  type="text"
                  value={contractorLicense}
                  onChange={(e) => setContractorLicense(e.target.value)}
                  placeholder="License # (CGC…)"
                  disabled={!contractorName.trim()}
                />
              </div>
              <div className="field">
                <label htmlFor={`${formId}-phone`} className="sr-only">
                  Phone
                </label>
                <input
                  id={`${formId}-phone`}
                  type="tel"
                  value={contractorPhone}
                  onChange={(e) => setContractorPhone(e.target.value)}
                  placeholder="Phone"
                  disabled={!contractorName.trim()}
                />
              </div>
            </div>
          </fieldset>

          <div className="field-row">
            <div className="field">
              <label htmlFor={`${formId}-deadline`}>
                Deadline <span className="label-optional">optional</span>
              </label>
              <input
                id={`${formId}-deadline`}
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor={`${formId}-deadline-label`}>
                What for <span className="label-optional">optional</span>
              </label>
              <input
                id={`${formId}-deadline-label`}
                type="text"
                value={deadlineLabel}
                onChange={(e) => setDeadlineLabel(e.target.value)}
                placeholder="Client promised submission"
                disabled={!deadline}
              />
            </div>
          </div>

          <div className="panel-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create package
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
