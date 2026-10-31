# Final-year project report outline

## 1. Abstract

AI Idea Merger connects people whose project ideas are semantically similar or complementary. Public abstracts are represented using Sentence-BERT, then ranked using a weighted combination of semantic similarity, skill fit, and shared technologies. Mutual consent protects full idea descriptions and unlocks private collaboration tools. The implementation combines React, FastAPI, SQLAlchemy, SQLite/PostgreSQL, and optional Claude planning.

## 2. Problem statement

Students and independent builders often find people by job title, social proximity, or keyword search. These signals do not capture the meaning of a proposed project or complementary skills. Publishing an entire idea to find collaborators creates avoidable disclosure risk. The challenge is to support useful discovery while enforcing explicit consent for confidential content.

## 3. Objectives

1. Capture idea abstracts, skills, technologies, and goals.
2. Rank candidate collaborators with an explainable formula.
3. Enforce ownership, visibility, and per-collaboration consent on the server.
4. Provide invitations, chat, milestones, and AI-assisted planning.
5. Demonstrate working security and privacy with automated tests.

## 4. Existing versus proposed system

| Existing approach | Limitation | Proposed behavior |
| --- | --- | --- |
| Profile/job-role networks | Identity-centric discovery | Public-summary semantic matching |
| Keyword search | Misses paraphrases and shared meaning | MiniLM sentence embeddings |
| Public project boards | Sensitive details disclosed early | Three visibility levels and explicit consent |
| Fragmented messaging/task tools | Context scattered between apps | Project-scoped chat and milestones |

## 5. Architecture

Include the architecture diagram in README and ER diagram in DATABASE.md. Explain browser, API, authorization, persistence, embedding inference, optional third-party assistant, and email transport. Follow a request from submission through matching, consent, and project creation.

## 6. Modules

Authentication and terms; profile; idea management; semantic matching; collaboration requests; consent and privacy; encrypted messaging; workspace/milestones; project assistant; notifications; reporting/moderation; deployment and configuration.

## 7. Algorithm

1. Concatenate title, category, and public summary only.
2. Encode using all-MiniLM-L6-v2; store the normalized vector and model identifier.
3. Compute bounded cosine similarity between source and candidate embeddings.
4. Compute required-skill coverage using the candidate member's skills.
5. Compute technology Jaccard similarity.
6. Combine: compatibility = 100 × (0.50 cosine + 0.25 skill fit + 0.25 technology overlap).
7. Exclude own/archived/moderated ideas, suspended accounts, invisible profiles, and incompatible embedding versions; sort descending.

Example: cosine=0.8, skill fit=0.5, technology overlap=0.5 produces 65%. Hidden candidates reveal only an aggregate score and category before consent. Ranking is directional because skill requirements differ.

## 8. Privacy and security design

Describe JWT expiration and revocation, bcrypt, role checks, central serializers, request consent flags, project membership checks, token-hashed password reset, login throttling, origin checks, HTTPS/WSS deployment, Fernet encryption, required terms timestamps, reports, and content-protection deterrents. Explain why client controls alone cannot enforce secrecy or prevent screenshots. Discuss the accessibility tradeoff of the explicitly requested copy/selection deterrents.

## 9. Implementation and screenshots

Include landing, dashboard, idea form, match detail, requests, workspace, chat, and admin screenshots. Use only fictional demo data. Explain responsive breakpoints and dark-mode tokens. Describe the default MiniLM matching and rule-based assistant without claiming Claude was tested if no key was available.

## 10. Results and evaluation

Use actual test output from VERIFICATION.md. Separate functional correctness from recommendation quality. For a recommendation-quality study, create a consented, labeled benchmark of related/unrelated ideas, report precision@k, recall@k, and mean reciprocal rank, and compare with keyword/hash baselines. Record inference latency and model memory on the test hardware. Do not invent accuracy percentages or user-study outcomes.

## 11. Conclusion

Discuss how semantic discovery and explicit consent can reduce friction in student project collaboration, supported by the implemented workflows and tests. Explain that compatibility is advisory and confidentiality depends on participants honoring their agreements after authorized disclosure.

## 12. Future scope

Vector-index retrieval, background embedding jobs, atomic distributed throttling, immutable security audit events, email verification, project-specific consent withdrawal, file sharing with access control, multilingual models, project contracts, third-party integrations, accessibility modes, notification delivery, and a formal recommendation-quality study.

## Suggested viva demonstration

1. Sign in as Alex and explain the dashboard.
2. Open LeafLens, show the compatibility breakdown and that no full description is present.
3. Submit an idea with an abstracted summary and private details.
4. Send/accept a request using two demo accounts; show the explicit recipient consent.
5. Show full descriptions, milestones, and cross-account messages after acceptance.
6. Generate a plan without an API key, then explain optional Claude configuration.
7. Report an idea, sign in as admin, moderate it, and demonstrate suspension enforcement.
8. Run the tests and show API docs.


## Revision: ownership-safe idea synthesis

Include the Merge ideas studio as an additional module. Describe the select -> preview -> review/edit -> save sequence, strictest-privacy inheritance, union of skills and technologies, private provenance records, and unchanged source ideas. Distinguish the default local structured merger from optional Claude synthesis. The external request contains public abstracts and a non-confidential user-entered direction; original private descriptions remain local. Report the updated 17 passing tests and 37 endpoint examples from VERIFICATION.md. Do not describe mocked Claude tests as a live model evaluation.
