const EXACT_FIELDS = new Set([
  "schemaVersion",
  "jurisdiction",
  "documentKind",
  "status",
  "title",
  "versionId",
  "checkedOn",
  "introducedBillNumber",
  "officialSourceUrl",
  "fullTextSha256",
  "authoritativeFullText",
  "enactedLaw",
  "notice",
  "provisions",
]);
const PROVISION_FIELDS = new Set(["id", "heading", "text"]);
const assert = (condition, message) => {
  if (!condition) throw new TypeError(message);
};
const plain = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);
const exact = (value, fields, label) => {
  assert(plain(value), label + " must be a plain object");
  assert(
    Object.keys(value).length === fields.size &&
      Object.keys(value).every((field) => fields.has(field)),
    label + " fields differ",
  );
};
const text = (value, label, maximum = 5000) => {
  assert(
    typeof value === "string" &&
      value.trim().length > 0 &&
      value.length <= maximum,
    "Invalid " + label,
  );
  return value;
};

export function validateProposedBill(input) {
  const bill = structuredClone(input);
  exact(bill, EXACT_FIELDS, "Proposed bill");
  assert(
    bill.schemaVersion === "1.0.0" &&
      bill.jurisdiction === "United States" &&
      bill.documentKind === "proposed-bill",
    "Unsupported proposed-bill record",
  );
  assert(
    bill.status === "incomplete-draft" || bill.status === "approved-proposal",
    "Unsupported proposal status",
  );
  text(bill.title, "proposal title", 200);
  text(bill.versionId, "proposal version", 128);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(bill.checkedOn), "Invalid checked date");
  assert(
    bill.enactedLaw === false,
    "A proposal cannot be represented as enacted law",
  );
  text(bill.notice, "proposal notice", 1000);
  assert(
    /propos|draft/i.test(bill.notice) && /not enacted|no.*enacted/i.test(bill.notice),
    "Proposal notice must state its non-enacted status",
  );
  assert(Array.isArray(bill.provisions), "Proposal provisions must be an array");

  if (bill.status === "incomplete-draft") {
    assert(
      bill.authoritativeFullText === false &&
        bill.introducedBillNumber === null &&
        bill.officialSourceUrl === null &&
        bill.fullTextSha256 === null &&
        bill.provisions.length === 0,
      "Incomplete draft cannot expose unverified bill text",
    );
  } else {
    assert(
      bill.authoritativeFullText === true &&
        /^H\.?R\.? \d+$|^S\.? \d+$/.test(
          text(bill.introducedBillNumber, "introduced bill number", 40),
        ) &&
        /^[a-f0-9]{64}$/.test(bill.fullTextSha256) &&
        bill.provisions.length > 0 &&
        bill.provisions.length <= 500,
      "Approved proposal requires complete authoritative text metadata",
    );
    let source;
    try {
      source = new URL(bill.officialSourceUrl);
    } catch {
      throw new TypeError("Invalid official proposal source");
    }
    assert(
      source.protocol === "https:" &&
        source.hostname === "www.congress.gov" &&
        !source.username &&
        !source.password,
      "Proposal source must be official Congress text",
    );
    const ids = new Set();
    for (const provision of bill.provisions) {
      exact(provision, PROVISION_FIELDS, "Proposal provision");
      assert(
        /^[a-z0-9][a-z0-9-]{2,80}$/.test(
          text(provision.id, "provision identity", 80),
        ) && !ids.has(provision.id),
        "Invalid or duplicate provision identity",
      );
      ids.add(provision.id);
      text(provision.heading, "provision heading", 300);
      text(provision.text, "provision text", 50000);
    }
  }
  return Object.freeze({
    version: bill.versionId,
    status: bill.status,
    isComplete: bill.status === "approved-proposal",
    isEnacted: false,
    provisionCount: bill.provisions.length,
    displayLabel:
      bill.status === "approved-proposal"
        ? "Proposed bill, not enacted law"
        : "Incomplete draft, not enacted law",
  });
}
