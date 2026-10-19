# TLM-049: Dated United States Copyright Source Pack

The machine-readable U.S. source catalog is `content/us-law/authorities.json`. It supports the Learning Machine's later legislation and Socratic content only. It does not integrate another product or constitute a general legal advice service.

## Scope and methodology

- The catalog contains **U.S. statutes, the U.S. Constitution, and U.S. court decisions only**; it excludes international and foreign law.
- Title 17 statutory links point to Cornell's U.S. Code reader. A verified **2024 U.S. Code edition** provides a baseline, but this file has **not certified every legislative amendment through October 19, 2026**. Refresh the exact current law and version before deploying an automated current-law evaluator.
- `researchStatus` distinguishes an identified source link, reviewed government summary, reviewed judicial text or index. It is never a guarantee that a link is a primary official opinion, independently verified full opinion or final litigation posture.
- Each case includes both its limited **relevance** and **scopeLimitations**. District court rulings are labeled as district rulings and never generalized to the national law of AI training.
- `stance` distinguishes supporting, limiting, foundation and mixed decisions; these labels are *curatorial aids*, not judicial characterizations or legal votes.
- Constitutional authority, existing law and prospective draft policy remain distinct. No proposed bill text is published as enacted.
- Cite the actual opinion for precise holdings; a Copyright Office fair-use summary is a helpful government guide, not binding precedent by itself.

## Notable checked sources

- **17 U.S.C. §101** includes the transitory-duration criterion. This does not give every RAM buffer automatic immunity.
- **17 U.S.C. §110(1)** specifically refers to face-to-face teaching at a nonprofit educational institution. A for-profit classroom is not automatically within that exception.
- **Cablevision (2d Cir. 2008)** treated the specific fleeting buffers before it as nonfixed; no universal 1.2-second safe harbor exists.
- **Authors Guild v. Google (2d Cir. 2015)** protected the indexing/search/snippet use as fair use under its non-substitutive conditions.
- **Sony v. Connectix (9th Cir. 2000)** involved intermediate reverse-engineering copies needed to develop a separate emulator.
- **TVEyes (2d Cir. 2018)** illustrates why commercial redistribution of accessible broadcast clips can fail fair-use analysis.
- **Bartz and Kadrey (N.D. Cal. 2025)** were fact-specific district-court training rulings, not nationwide categorical AI exemptions.
- **Thomson Reuters v. ROSS (3d Cir. Sept. 30, 2026)** is a precedential decision rejecting fair use for headnotes copied to create a competing legal search system, not a blanket adjudication of all generative models.

## Validation and future integration

Run `pnpm legal:check` and `pnpm check`. CI enforces unique citations, HTTPS source allowlists, U.S. jurisdiction, dates, required scope caveats, substantial supporting and adverse precedents, and a complete typed source list.

TLM-050 will attach actual version-controlled proposed statutory text when available. TLM-051–056 will represent scenario facts, operative rule language, rule evaluation, side-by-side comparisons and conflicts. This catalog alone does **not** implement legal rules or deliver legally authoritative individualized conclusions.
