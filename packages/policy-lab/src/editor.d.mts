import type { PolicyEffect, PolicyRuleSet } from "./compiler.mjs";

export interface VisitorPolicyEditorState {
  schemaVersion: "1.0.0";
  id: string;
  effect: PolicyEffect;
  accessMethod: "purchase" | "license" | "borrow" | "stream" | "public-source" | "unauthorized" | "unknown";
  lawfulAccess: boolean;
  intermediateCopies: boolean;
  retentionDurationDays: number;
  teaching: boolean;
  distributedOutput: boolean;
}
export interface VisitorPolicyFactSnapshot {
  "access.method": VisitorPolicyEditorState["accessMethod"];
  "access.lawful": boolean | null;
  "copying.intermediateCopies": boolean | null;
  "retention.durationDays": number | null;
  "teaching.performed": boolean | null;
  "outputs.distributed": boolean | null;
}
export interface VisitorPolicyPreview {
  schemaVersion: "1.0.0";
  ruleSetId: string;
  ruleId: string;
  framework: "hypothetical";
  applicability: "matched" | "not-matched" | "unknown";
  selectedEffect: PolicyEffect;
  outcome: PolicyEffect;
  qualification: string;
  termResults: Array<{
    fact: keyof VisitorPolicyFactSnapshot;
    expected: string | number | boolean | null;
    actual: string | number | boolean | null;
    status: "matched" | "not-matched" | "unknown";
  }>;
}
export function createVisitorPolicyRuleSet(input: VisitorPolicyEditorState): Readonly<PolicyRuleSet>;
export function serializeVisitorPolicyRuleSet(input: unknown): string;
export function parseVisitorPolicyRuleSet(serialized: string): Readonly<PolicyRuleSet>;
export function previewVisitorPolicyRuleSet(
  ruleSet: unknown,
  facts: VisitorPolicyFactSnapshot,
): Readonly<VisitorPolicyPreview>;
export const VISITOR_POLICY_SOURCE_ID: "visitor-authored-hypothesis";

