"use client";

import { useState } from "react";
import { Landmark, Loader2, RefreshCcw, Search, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  formatCurrency,
  lookupProperty,
  parcelAtPoint,
  type GeocodeCandidate,
} from "@/lib/property";
import { formatDate } from "@/lib/dates";
import type { PermitPackage, PropertyInfo } from "@/lib/types";

export function PropertyCard({ pkg }: { pkg: PermitPackage }) {
  const { updateProperty, addActivity } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressCandidates, setAddressCandidates] = useState<GeocodeCandidate[] | null>(null);
  const [parcelCandidates, setParcelCandidates] = useState<PropertyInfo[] | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  function clearChoices() {
    setAddressCandidates(null);
    setParcelCandidates(null);
  }

  async function runLookup() {
    setBusy(true);
    setError(null);
    clearChoices();
    const result = await lookupProperty(pkg.projectAddress);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.kind === "parcel") apply(result.property);
    else if (result.kind === "parcels") setParcelCandidates(result.parcels);
    else setAddressCandidates(result.candidates);
  }

  async function pickAddress(candidate: GeocodeCandidate) {
    setBusy(true);
    setError(null);
    const result = await parcelAtPoint(candidate.x, candidate.y, candidate.address);
    setBusy(false);
    if (result.kind === "error") {
      setError(result.error);
      return;
    }
    if (result.kind === "none") {
      setError(`No parcel covers “${candidate.address}” in the statewide roll.`);
      return;
    }
    setAddressCandidates(null);
    if (result.kind === "parcel") apply(result.property);
    else setParcelCandidates(result.parcels);
  }

  function apply(property: PropertyInfo) {
    updateProperty(pkg.id, property);
    addActivity(pkg.id, `Parcel ${property.parcelId} pulled from the property appraiser roll`);
    clearChoices();
    setError(null);
  }

  const property = pkg.property;

  return (
    <section className="card" aria-labelledby="property-heading">
      <div className="card-head">
        <h2 id="property-heading">Property</h2>
        {property && (
          <span className="card-head-meta">
            Pulled {formatDate(property.fetchedAt)}
          </span>
        )}
      </div>

      {!property && !addressCandidates && !parcelCandidates && (
        <div className="property-empty">
          <p>
            Pull the parcel record for{" "}
            <strong>{pkg.projectAddress}</strong> from the statewide property
            appraiser roll — owner, parcel ID, use code, year built, and just
            value.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void runLookup()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 size={14} className="spin" aria-hidden />
            ) : (
              <Search size={14} aria-hidden />
            )}
            {busy ? "Searching the roll…" : "Look up property"}
          </button>
        </div>
      )}

      {error && (
        <p className="export-note export-err" role="alert">
          {error}
        </p>
      )}

      {addressCandidates && (
        <div className="property-candidates">
          <p className="property-candidates-hint">
            {addressCandidates.length} addresses match — pick the right one:
          </p>
          <ul>
            {addressCandidates.map((c) => (
              <li key={`${c.x},${c.y}`}>
                <button
                  type="button"
                  className="property-candidate"
                  onClick={() => void pickAddress(c)}
                  disabled={busy}
                >
                  <span className="property-candidate-addr">{c.address}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-ghost btn-sm" onClick={clearChoices}>
            Cancel
          </button>
        </div>
      )}

      {parcelCandidates && (
        <div className="property-candidates">
          <p className="property-candidates-hint">
            The map point sits between parcels — pick the right one:
          </p>
          <ul>
            {parcelCandidates.map((p) => (
              <li key={p.parcelId}>
                <button
                  type="button"
                  className="property-candidate"
                  onClick={() => apply(p)}
                  disabled={busy}
                >
                  <span className="property-candidate-addr">
                    {p.siteAddress || "(no site address)"}
                    {p.city && `, ${p.city}`}
                  </span>
                  <span className="property-candidate-meta">
                    {p.owner} · Parcel {p.parcelId}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-ghost btn-sm" onClick={clearChoices}>
            Cancel
          </button>
        </div>
      )}

      {property && (
        <>
          <dl className="property-facts">
            <div>
              <dt>Parcel ID</dt>
              <dd className="tnum">{property.parcelId}</dd>
            </div>
            <div>
              <dt>Owner of record</dt>
              <dd>{property.owner || "—"}</dd>
            </div>
            <div>
              <dt>Site address</dt>
              <dd>
                {property.siteAddress}
                {property.city && `, ${property.city}`}
                {property.zip && ` ${property.zip}`}
              </dd>
            </div>
            <div>
              <dt>Use</dt>
              <dd>{property.useLabel}</dd>
            </div>
            {property.yearBuilt && (
              <div>
                <dt>Year built</dt>
                <dd className="tnum">{property.yearBuilt}</dd>
              </div>
            )}
            {property.justValue && (
              <div>
                <dt>Just value</dt>
                <dd className="tnum">{formatCurrency(property.justValue)}</dd>
              </div>
            )}
            {property.legal && (
              <div className="property-fact-wide">
                <dt>Legal description</dt>
                <dd>{property.legal}</dd>
              </div>
            )}
          </dl>
          <div className="property-actions">
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => void runLookup()}
              disabled={busy}
            >
              {busy ? (
                <Loader2 size={13} className="spin" aria-hidden />
              ) : (
                <RefreshCcw size={13} aria-hidden />
              )}
              Refresh from roll
            </button>
            {confirmRemove ? (
              <span className="reset-confirm">
                <span>Remove parcel data?</span>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    updateProperty(pkg.id, undefined);
                    setConfirmRemove(false);
                  }}
                >
                  Remove
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => setConfirmRemove(false)}
                >
                  Keep
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="icon-btn icon-btn-danger"
                onClick={() => setConfirmRemove(true)}
                aria-label="Remove parcel data"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            )}
          </div>
          <p className="property-source">
            <Landmark size={12} strokeWidth={2} aria-hidden />
            Florida DOR statewide cadastral roll — verify against the county
            appraiser before submittal.
          </p>
        </>
      )}
    </section>
  );
}
