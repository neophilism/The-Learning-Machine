export type PolicyFramework = "current-law" | "proposed-law" | "hypothetical";
export type PolicyEffect = "permit" | "restrict" | "conditional" | "unresolved";
export type PolicyFact =
  | "work.copyrightStatus"
  | "access.method"
  | "access.lawful"
  | "copying.performed"
  | "copying.intermediateCopies"
  | "retention.retained"
  | "retention.durationDays"
  | "teaching.performed"
  | "outputs.created"
  | "outputs.distributed"
  | "outputs.containsProtectedExpression";
export type PolicyScalar = string | number | boolean | null;
export type PolicyCondition =
  | { operator: "all" | "any"; conditions: PolicyCondition[] }
  | { operator: "not"; condition: PolicyCondition }
  | { operator: "eq" | "neq"; fact: PolicyFact; value: PolicyScalar }
  | { operator: "in"; fact: PolicyFact; value: PolicyScalar[] }
  | { operator: "exists"; fact: PolicyFact; value: boolean };
export interface PolicyRule {
  id: string;
  sourceIds: string[];
  when: PolicyCondition;
  effect: PolicyEffect;
  rationale: string;
}
export interface PolicyRuleSet {
  schemaVersion: "1.0.0";
  id: string;
  framework: PolicyFramework;
  rules: PolicyRule[];
}
export function compilePolicyRuleSet(
  input: unknown,
  options: { allowedSourceIds: string[] },
): Readonly<PolicyRuleSet>;
export const SUPPORTED_POLICY_FACTS: readonly PolicyFact[];
