# Seed data — global knowledge for the eval-layer / RAG

Plain `.md`, `.txt`, or `.pdf` files in this directory get ingested into ChromaDB under `kind=global` metadata when you run:

```bash
cd backend
./venv/bin/python scripts/seed_knowledge.py
```

Country folders are preferred:

```bash
cd backend
./venv/bin/python scripts/seed_knowledge.py --country australia --dry-run
./venv/bin/python scripts/seed_knowledge.py --reset --country australia
```

The script chunks markdown at heading boundaries, embeds with Gemini, and upserts into the `abroadly_knowledge` collection. Chunk IDs are deterministic, so re-running the same corpus upserts in place. Use `--reset --country <country>` when replacing old content.

## Authoring guidelines

- One topic per file — easier to debug retrieval results.
- Plain prose works best (the chunker splits on whitespace). Headings and bullets are fine; they're tokenised as normal text.
- Be specific (numbers, dates, country names, university names). The eval layer's grounding check measures token overlap between query and retrieved chunks — vague platitudes get refused as `LOW_CONFIDENCE`.
- Include the obvious search terms students will type: "IELTS score for Canada", "scholarship eligibility", "visa requirements after Class 12".
- Cite sources at the bottom of the file if drawn from official material — useful for auditing.

## Current files

- `australia/` — 20 files detailing Australia admissions, documents, finances, Student visa subclass 500, GS, 485, work rights, scholarships, timeline, and FAQ for Nepali students
- `uk/` — 13 files detailing a structured UK corpus for Nepali students
- `uk-study-after-12.txt` — undergrad pathways, UCAS process, costs, Graduate Route visa for Nepali Class 12 graduates
- `canada/` — 12 files detailing Canada overview, entry requirements, DLIs, SDS, GIC finances, visa process, and Nepal preparation
- `usa/` — 12 files detailing US university options, OPT/STEM OPT, visa process, F-1 interview prep, I-20 financial proof, and timelines
- `new-zealand/` — 12 files detailing New Zealand qualifications framework, Te Pūkenga, Green List pathways, and finances
- `germany/` — 12 files detailing Germany Studienkolleg, tuition-free public universities, Blocked Account (Sperrkonto), and visa process
- `finland/` — 12 files detailing Finland university applications via Studyinfo, residence permits, tuition waivers, and post-study opportunities
- `japan/` — 12 files detailing Japanese language school pathways, MEXT, CoE, work rights (28 hours/week), and visa process
- `south-korea/` — 12 files detailing South Korea D-2/D-4 visa options, Global Korea Scholarship (GKS), and post-graduation pathways
- `ireland/` — 12 files detailing Ireland ILEP eligible programs, Stamp 2 visa, Stamp 1G graduate visa, and Critical Skills employment

## What to add next

Knowledge-base expansions to consider next:

1. Detailed comparisons between specific countries (e.g. Canada vs USA, Germany vs Finland)
2. Detailed IELTS/TOEFL/PTE comparisons and preparation tips
3. Attestation and NOC flow at MoEST/MoFA in Nepal
4. Education loan processing at Class A commercial banks in Nepal (Nabil, NIC Asia, etc.)
5. Step-by-step Statement of Purpose (SOP) writing and editing guidelines

