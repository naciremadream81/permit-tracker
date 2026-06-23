"use client";

import { useId } from "react";
import { useStore } from "@/lib/store";
import type { DirectoryEntry } from "@/lib/types";

interface Props {
  value: string;
  /**
   * Called on every keystroke. When the typed name exactly matches a
   * directory entry (case-insensitive), that entry is passed so the caller
   * can autofill license / phone / trade.
   */
  onChange: (value: string, match: DirectoryEntry | undefined) => void;
  placeholder?: string;
  ariaLabel: string;
  id?: string;
  autoFocus?: boolean;
  /** Restrict suggestions to entries with at least one trade (sub pickers). */
  tradesOnly?: boolean;
}

/** Name input backed by the contractor directory via a native datalist. */
export function ContractorNameInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  id,
  autoFocus,
  tradesOnly,
}: Props) {
  const { directory } = useStore();
  const listId = useId();
  const entries = tradesOnly ? directory.filter((d) => d.trades.length > 0) : directory;

  function handleChange(raw: string) {
    const match = directory.find(
      (d) => d.name.trim().toLowerCase() === raw.trim().toLowerCase()
    );
    onChange(raw, match);
  }

  return (
    <>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {entries.map((d) => (
          <option key={d.id} value={d.name}>
            {[d.trades.join(" / ") || "General", d.license && `Lic. ${d.license}`]
              .filter(Boolean)
              .join(" · ")}
          </option>
        ))}
      </datalist>
    </>
  );
}
