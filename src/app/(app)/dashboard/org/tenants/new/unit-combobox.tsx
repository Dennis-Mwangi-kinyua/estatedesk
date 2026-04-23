"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

type AvailableUnit = {
  id: string;
  label: string;
  rentAmount: number;
  depositAmount: number | null;
};

function formatCurrency(value: number | null | undefined, currencyCode: string) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
}

export function UnitCombobox({
  units,
  selectedUnitId,
  onSelect,
  currencyCode,
}: {
  units: AvailableUnit[];
  selectedUnitId: string;
  onSelect: (unitId: string) => void;
  currencyCode: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === selectedUnitId) ?? null,
    [units, selectedUnitId],
  );

  const filteredUnits = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return units;

    return units.filter((unit) => unit.label.toLowerCase().includes(q));
  }, [units, query]);

  const options = useMemo(
    () => [
      {
        id: "",
        label: "No unit assignment yet",
        rentAmount: null,
        depositAmount: null,
        isEmptyOption: true,
      },
      ...filteredUnits.map((unit) => ({
        ...unit,
        isEmptyOption: false,
      })),
    ],
    [filteredUnits],
  );

  function openCombobox() {
    setActiveIndex(0);
    setOpen(true);
  }

  function closeCombobox() {
    setOpen(false);
    setQuery("");
  }

  function handleSelect(unitId: string) {
    onSelect(unitId);
    closeCombobox();
  }

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        closeCombobox();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCombobox();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const activeEl = listRef.current?.querySelector<HTMLElement>(
      `[data-option-index="${activeIndex}"]`,
    );

    activeEl?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex, open]);

  function handleTriggerKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      openCombobox();
    }
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const active = options[activeIndex];
      if (active) {
        handleSelect(active.id);
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) {
            closeCombobox();
          } else {
            openCombobox();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className="flex min-h-14 w-full items-center justify-between rounded-[20px] border border-neutral-200 bg-white px-4 text-left outline-none transition hover:border-neutral-300 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
      >
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500">
            Vacant unit
          </p>
          <p
            className={`mt-1 truncate text-[15px] ${
              selectedUnit ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            {selectedUnit ? selectedUnit.label : "Search and select a vacant unit"}
          </p>
        </div>

        <span className="ml-3 shrink-0 text-neutral-400" aria-hidden="true">
          ⌄
        </span>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 sm:hidden" />

          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] border border-neutral-200 bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.16)] sm:absolute sm:inset-auto sm:left-0 sm:right-0 sm:top-[calc(100%+0.5rem)] sm:rounded-[24px] sm:shadow-xl">
            <div className="border-b border-neutral-100 px-4 pb-3 pt-3 sm:p-3">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-neutral-200 sm:hidden" />

              <div className="flex items-center justify-between gap-3 sm:hidden">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Select unit
                </h3>
                <button
                  type="button"
                  onClick={closeCombobox}
                  className="rounded-full px-2 py-1 text-sm text-neutral-500"
                >
                  Close
                </button>
              </div>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Search by property, building, unit number..."
                className="mt-3 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-[15px] outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100 sm:mt-0"
              />
            </div>

            <div
              id={listboxId}
              ref={listRef}
              role="listbox"
              aria-label="Available units"
              className="max-h-[60vh] overflow-y-auto p-3 sm:max-h-80"
            >
              {filteredUnits.length === 0 ? (
                <>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(0)}
                    onClick={() => handleSelect("")}
                    className={`mb-2 w-full rounded-2xl border px-4 py-4 text-left transition ${
                      selectedUnitId === ""
                        ? "border-neutral-300 bg-neutral-100"
                        : "border-neutral-200 bg-white hover:bg-neutral-50"
                    }`}
                  >
                    <div className="text-sm font-medium text-neutral-900">
                      No unit assignment yet
                    </div>
                  </button>

                  <div className="rounded-2xl px-4 py-8 text-center text-sm text-neutral-500">
                    No units match your search.
                  </div>
                </>
              ) : (
                options.map((unit, index) => {
                  const selected = selectedUnitId === unit.id;
                  const active = activeIndex === index;

                  return (
                    <button
                      key={unit.id || "no-unit"}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      data-option-index={index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSelect(unit.id)}
                      className={`mb-2 w-full rounded-2xl border px-4 py-4 text-left transition ${
                        selected
                          ? "border-neutral-300 bg-neutral-100"
                          : active
                            ? "border-neutral-300 bg-neutral-50"
                            : "border-neutral-200 bg-white hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-neutral-900">
                            {unit.label}
                          </div>

                          {!unit.isEmptyOption ? (
                            <div className="mt-1 text-xs leading-5 text-neutral-500">
                              Rent: {formatCurrency(unit.rentAmount, currencyCode)}
                              {" • "}
                              Deposit:{" "}
                              {formatCurrency(unit.depositAmount, currencyCode)}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs leading-5 text-neutral-500">
                              Create tenant without assigning a unit now.
                            </div>
                          )}
                        </div>

                        {selected ? (
                          <span className="shrink-0 text-sm font-medium text-neutral-700">
                            ✓
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}