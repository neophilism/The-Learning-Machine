import { readFileSync } from "node:fs";
import { validateUsLawPack } from "../packages/evidence/src/authorities.mjs";
import { validateProposedBill } from "../packages/evidence/src/proposed-bill.mjs";

const authorities = JSON.parse(
  readFileSync(
    new URL("../content/us-law/authorities.json", import.meta.url),
    "utf8",
  ),
);
const proposal = JSON.parse(
  readFileSync(
    new URL("../content/us-law/proposed-bill.json", import.meta.url),
    "utf8",
  ),
);
const lawStatus = validateUsLawPack(authorities);
const proposalStatus = validateProposedBill(proposal);
console.log(
  "U.S. law content validated:",
  JSON.stringify(lawStatus.count),
  "decisions:",
  JSON.stringify(lawStatus.stances),
  "curated:",
  lawStatus.asOf,
  "proposal:",
  proposalStatus.displayLabel,
  "version:",
  proposalStatus.version,
);
