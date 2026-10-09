// Automated-collection conditions. Pure (no server imports) so the same
// evaluator runs on the server (counts, collection pages) and in the
// browser (live preview while editing conditions) — they can't disagree.

export type RuleField = "tag" | "title" | "brand" | "price" | "status" | "created";

export type Rule = { field: RuleField; op: string; value: string };

export type RuleProduct = {
  productName: string;
  brand: string;
  status: "AVAILABLE" | "HOLD" | "SOLD";
  priceCents: number | null;
  tags: string[];
  createdAt: string;
};

type FieldSpec = {
  label: string;
  ops: { value: string; label: string }[];
  input: "text" | "number" | "status" | "days" | "none";
};

export const RULE_FIELDS: Record<RuleField, FieldSpec> = {
  tag: {
    label: "Tag",
    ops: [
      { value: "equals", label: "is equal to" },
      { value: "contains", label: "contains" },
    ],
    input: "text",
  },
  title: {
    label: "Title",
    ops: [
      { value: "contains", label: "contains" },
      { value: "equals", label: "is equal to" },
    ],
    input: "text",
  },
  brand: {
    label: "Brand",
    ops: [
      { value: "equals", label: "is equal to" },
      { value: "notEquals", label: "is not equal to" },
    ],
    input: "text",
  },
  price: {
    label: "Price (USD)",
    ops: [
      { value: "equals", label: "is equal to" },
      { value: "gt", label: "is greater than" },
      { value: "lt", label: "is less than" },
      { value: "empty", label: "is not set (Price on request)" },
    ],
    input: "number",
  },
  status: {
    label: "Availability",
    ops: [{ value: "equals", label: "is" }],
    input: "status",
  },
  created: {
    label: "Date added",
    ops: [{ value: "withinDays", label: "is in the last (days)" }],
    input: "days",
  },
};

export function defaultRule(field: RuleField = "tag"): Rule {
  const spec = RULE_FIELDS[field];
  const value = spec.input === "status" ? "AVAILABLE" : spec.input === "days" ? "30" : "";
  return { field, op: spec.ops[0].value, value };
}

const norm = (s: string) => s.trim().toLowerCase();

export function matchesRule(p: RuleProduct, r: Rule, now: number): boolean {
  const v = r.value ?? "";
  switch (r.field) {
    case "tag": {
      const tags = p.tags.map(norm);
      return r.op === "contains" ? tags.some((t) => t.includes(norm(v))) : tags.includes(norm(v));
    }
    case "title":
      return r.op === "equals" ? norm(p.productName) === norm(v) : norm(p.productName).includes(norm(v));
    case "brand":
      return r.op === "notEquals" ? norm(p.brand) !== norm(v) : norm(p.brand) === norm(v);
    case "price": {
      if (r.op === "empty") return p.priceCents == null;
      if (p.priceCents == null || v.trim() === "") return false;
      const cents = Math.round(Number(v) * 100);
      if (!Number.isFinite(cents)) return false;
      if (r.op === "gt") return p.priceCents > cents;
      if (r.op === "lt") return p.priceCents < cents;
      return p.priceCents === cents;
    }
    case "status":
      return p.status === v;
    case "created": {
      const days = Number(v);
      if (!Number.isFinite(days) || days <= 0) return false;
      return now - new Date(p.createdAt).getTime() <= days * 86_400_000;
    }
    default:
      return false;
  }
}

export function matchesCollection(
  p: RuleProduct,
  c: { rules: Rule[]; excludeRules: Rule[]; matchAll: boolean },
  now: number = Date.now()
): boolean {
  if (c.rules.length === 0) return false;
  const included = c.matchAll
    ? c.rules.every((r) => matchesRule(p, r, now))
    : c.rules.some((r) => matchesRule(p, r, now));
  if (!included) return false;
  return !c.excludeRules.some((r) => matchesRule(p, r, now));
}

// Validates untrusted rule JSON from a form submission: unknown fields/ops
// are dropped, values coerced to bounded strings.
export function sanitizeRules(raw: unknown): Rule[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Rule => {
      if (!r || typeof r !== "object") return false;
      const spec = RULE_FIELDS[(r as Rule).field];
      return !!spec && spec.ops.some((o) => o.value === (r as Rule).op);
    })
    .slice(0, 20)
    .map((r) => ({ field: r.field, op: r.op, value: String(r.value ?? "").slice(0, 200) }));
}

export function describeRule(r: Rule): string {
  const spec = RULE_FIELDS[r.field];
  const op = spec.ops.find((o) => o.value === r.op)?.label ?? r.op;
  if (r.field === "price" && r.op === "empty") return `${spec.label} ${op}`;
  return `${spec.label} ${op} ${r.value}`;
}
