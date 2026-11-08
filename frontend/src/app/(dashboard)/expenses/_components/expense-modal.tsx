"use client";

/*
 * ============================================================
 *  HOW TO BUILD THIS MODAL (do one step, test it, then next)
 * ============================================================
 *  STEP 1  open / close the modal           props + overlay + X button
 *  STEP 2  form state                       useState for each field
 *  STEP 3  form inputs (JSX)                category, amount, date, note
 *  STEP 4  submit: create or update         call the service, then onSaved
 *  STEP 5  busy state                       disable button while saving
 *  STEP 6  client validation                check fields before sending
 *  STEP 7  server errors                    show Laravel 422 messages
 *  STEP 8  polish                           suggestions, counter, max date
 *
 *  Search this file for "STEP 1", "STEP 2" ... to find each part.
 *  The view (expenses-view.tsx) opens this with:
 *     <ExpenseModal expense={...} categories={...} onClose onSaved />
 * ============================================================
 */

import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { ExpenseService } from "@/services/expense-service";
import type { Expense } from "@/types/expense";
import { ApiError } from "@/libs/api-client";
import { parseApiError } from "@/libs/api-error";
import { focusRing } from "@/libs/format";

// ---- styles ----
const input =
  "h-10 w-full rounded-lg border bg-[#f4f7fc] px-3 text-sm text-[#1c2740] focus:bg-white focus:outline-none focus:ring-2";
const okBorder =
  "border-[#dfe6f2] focus:border-[#2f6fe8] focus:ring-[#2f6fe8]/20";
const badBorder =
  "border-[#e5484d] focus:border-[#e5484d] focus:ring-[#e5484d]/20";

// STEP 8: today as YYYY-MM-DD in the user's own time zone
const today = () => new Date().toLocaleDateString("en-CA");

// STEP 6 + 7: the field names we can show an error for
type Fields = "category" | "amount" | "expense_date" | "note";

export function ExpenseModal({
  expense,
  categories,
  onClose,
  onSaved,
}: {
  expense: Expense | null; // STEP 1: null = new expense, object = edit
  categories: string[]; // STEP 8: suggestions for the category input
  onClose: () => void; // STEP 1: the view hides the modal
  onSaved: (mode: "created" | "updated") => void; // STEP 4: tell the view to reload
}) {
  const editing = expense !== null;

  // ============================================================
  // STEP 2: FORM STATE (one useState per field)
  // Edit mode starts with the old values, new mode starts empty.
  // ============================================================
  const [category, setCategory] = useState(expense?.category ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [date, setDate] = useState(expense?.expense_date ?? today());
  const [note, setNote] = useState(expense?.note ?? "");

  // STEP 5: true while the request is running
  const [busy, setBusy] = useState(false);

  // STEP 7: message for the whole form (e.g. server down, 403)
  const [error, setError] = useState("");

  // STEP 6 + 7: message under each field
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<Fields, string>>
  >({});

  // ============================================================
  // STEP 6: CLIENT VALIDATION (runs before we call the API)
  // Returns true when the form is OK.
  // ============================================================
  function validate() {
    const e: Partial<Record<Fields, string>> = {};
    if (!category.trim()) e.category = "Category is required.";

    const n = Number(amount);
    if (amount.trim() === "" || !Number.isFinite(n) || n <= 0)
      e.amount = "Enter an amount greater than 0.";

    if (!date) e.expense_date = "Date is required.";
    else if (date > today()) e.expense_date = "Date cannot be in the future.";

    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  // ============================================================
  // STEP 4: SUBMIT (create or update)
  // ============================================================
  async function submit() {
    if (busy || !validate()) return; // STEP 5 + 6: stop double click / bad form
    setBusy(true); // STEP 5
    setError("");

    // STEP 4: the data we send to Laravel
    const payload = {
      category: category.trim(),
      amount: Number(amount),
      expense_date: date,
      note: note.trim() || null, // empty note -> null
    };

    try {
      if (editing) await ExpenseService.update(expense.id, payload);
      else await ExpenseService.create(payload);

      onSaved(editing ? "updated" : "created"); // view: toast + reload
      onClose(); // close the modal
    } catch (err) {
      // STEP 7: show Laravel validation messages under the right field
      if (err instanceof ApiError && err.errors) {
        const e: Partial<Record<Fields, string>> = {};
        (["category", "amount", "expense_date", "note"] as Fields[]).forEach(
          (f) => {
            if (err.errors?.[f]?.[0]) e[f] = err.errors[f][0];
          },
        );
        setFieldErrors(e);
      }
      setError(parseApiError(err).message);
      setBusy(false); // STEP 5: let the user try again
    }
  }

  // STEP 6 + 7: red border when a field has an error
  const cls = (f: Fields) =>
    `${input} ${fieldErrors[f] ? badBorder : okBorder}`;

  return (
    // ---------- STEP 1: overlay (dark background) ----------
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1c2740]/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit expense" : "Add expense"}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* ---------- STEP 1: title + close button ---------- */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#1c2740]">
            {editing ? "Edit expense" : "Add expense"}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className={`rounded-md p-1 text-[#9aa5b8] hover:bg-[#f4f7fc] ${focusRing}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ============================================================
            STEP 3: FORM INPUTS
            ============================================================ */}
        <div className="space-y-4">
          {/* category: free text + suggestions from existing categories */}
          <div>
            <label
              htmlFor="exp-category"
              className="mb-1 block text-sm font-semibold text-[#1c2740]"
            >
              Category
            </label>
            <input
              id="exp-category"
              list="exp-categories" // STEP 8: suggestions
              autoFocus
              maxLength={100}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Rent, electricity, salary, transport…"
              className={cls("category")}
            />
            {/* STEP 8: suggestions list */}
            <datalist id="exp-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {/* STEP 6 + 7: error under the field */}
            {fieldErrors.category && (
              <p className="mt-1 text-xs text-[#e5484d]">
                {fieldErrors.category}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* amount */}
            <div>
              <label
                htmlFor="exp-amount"
                className="mb-1 block text-sm font-semibold text-[#1c2740]"
              >
                Amount
              </label>
              <input
                id="exp-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`${cls("amount")} tabular-nums`}
              />
              {fieldErrors.amount && (
                <p className="mt-1 text-xs text-[#e5484d]">
                  {fieldErrors.amount}
                </p>
              )}
            </div>

            {/* date */}
            <div>
              <label
                htmlFor="exp-date"
                className="mb-1 block text-sm font-semibold text-[#1c2740]"
              >
                Date
              </label>
              <input
                id="exp-date"
                type="date"
                max={today()} // STEP 8: no future dates
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={cls("expense_date")}
              />
              {fieldErrors.expense_date && (
                <p className="mt-1 text-xs text-[#e5484d]">
                  {fieldErrors.expense_date}
                </p>
              )}
            </div>
          </div>

          {/* note */}
          <div>
            <label
              htmlFor="exp-note"
              className="mb-1 block text-sm font-semibold text-[#1c2740]"
            >
              Note (optional)
            </label>
            <textarea
              id="exp-note"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-[#dfe6f2] bg-[#f4f7fc] px-3 py-2 text-sm text-[#1c2740] focus:border-[#2f6fe8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6fe8]/20"
            />
            {/* STEP 8: character counter */}
            <p className="mt-1 text-right text-xs text-[#9aa5b8]">
              {note.length}/500
            </p>
          </div>
        </div>

        {/* ---------- STEP 7: form-level error ---------- */}
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-[#ffe9ec] px-3 py-2 text-sm text-[#e5484d]"
          >
            {error}
          </p>
        )}

        {/* ---------- STEP 4 + 5: buttons ---------- */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-[#6c7a93] hover:bg-[#f4f7fc] ${focusRing}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit} // STEP 4
            disabled={busy} // STEP 5
            className={`inline-flex items-center gap-2 rounded-lg bg-[#2f6fe8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d5fe0] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
          >
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Add expense"}
          </button>
        </div>
      </div>
    </div>
  );
}
