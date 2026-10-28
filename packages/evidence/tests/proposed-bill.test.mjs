import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateProposedBill } from "../src/proposed-bill.mjs";

const placeholder = JSON.parse(
  readFileSync(
    new URL("../../../content/us-law/proposed-bill.json", import.meta.url),
    "utf8",
  ),
);
const clone = () => structuredClone(placeholder);

test("repository placeholder is explicit, versioned and contains no invented provisions", () => {
  const status = validateProposedBill(placeholder);
  assert.equal(status.status, "incomplete-draft");
  assert.equal(status.isComplete, false);
  assert.equal(status.isEnacted, false);
  assert.equal(status.provisionCount, 0);
  assert.match(status.displayLabel, /not enacted law/);
});

test("missing authoritative full text cannot be promoted to an approved proposal", () => {
  const bill = clone();
  bill.status = "approved-proposal";
  assert.throws(
    () => validateProposedBill(bill),
    /complete authoritative text metadata/,
  );
});

test("proposal data can never claim enacted-law status or hide its label", () => {
  const enacted = clone();
  enacted.enactedLaw = true;
  assert.throws(() => validateProposedBill(enacted), /cannot be represented/);
  const hidden = clone();
  hidden.notice = "Current United States law.";
  assert.throws(() => validateProposedBill(hidden), /non-enacted status/);
  const extra = clone();
  extra.effectiveDate = "2026-10-28";
  assert.throws(() => validateProposedBill(extra), /fields differ/);
});

test("future complete text requires official source, digest and exact provisions", () => {
  const bill = {
    ...clone(),
    status: "approved-proposal",
    versionId: "fictional-test-v1",
    introducedBillNumber: "H.R. 0",
    officialSourceUrl:
      "https://www.congress.gov/bill/119th-congress/house-bill/0/text",
    fullTextSha256: "a".repeat(64),
    authoritativeFullText: true,
    notice: "Fictional proposed bill test fixture, not enacted law.",
    provisions: [
      {
        id: "test-section",
        heading: "Fictional fixture",
        text: "This text exists only to exercise the approved-proposal boundary.",
      },
    ],
  };
  assert.equal(validateProposedBill(bill).provisionCount, 1);
  bill.officialSourceUrl = "https://example.com/bill";
  assert.throws(() => validateProposedBill(bill), /official Congress/);
  bill.officialSourceUrl =
    "https://www.congress.gov/bill/119th-congress/house-bill/0/text";
  bill.provisions[0].extra = true;
  assert.throws(() => validateProposedBill(bill), /fields differ/);
});
