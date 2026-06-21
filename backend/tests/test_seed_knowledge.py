"""Tests for seed_knowledge.py — file discovery, metadata, chunking, idempotency."""
from __future__ import annotations

import hashlib
from pathlib import Path

import pytest

# Make app importable
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.seed_knowledge import (
    _collect_files,
    chunk_markdown,
    infer_country_topic,
    stable_chunk_id,
)

SEED_DATA = Path(__file__).parent.parent / "seed_data"


# ---------------------------------------------------------------------------
# File discovery
# ---------------------------------------------------------------------------
class TestCollectFiles:
    def test_discovers_all_country_dirs(self):
        """Every country directory with .md files should be found."""
        files = _collect_files(SEED_DATA, country_filter=None)
        countries_found = {
            f.relative_to(SEED_DATA).parts[0]
            for f in files
            if len(f.relative_to(SEED_DATA).parts) >= 2
        }
        for expected in ("uk", "australia", "canada", "usa", "new-zealand",
                         "germany", "finland", "japan", "south-korea", "ireland"):
            assert expected in countries_found, f"Missing country dir: {expected}"

    def test_country_filter_restricts_to_one(self):
        """--country canada should return only files under canada/."""
        files = _collect_files(SEED_DATA, country_filter="canada")
        assert len(files) > 0, "No files found for canada"
        for f in files:
            rel = f.relative_to(SEED_DATA)
            assert rel.parts[0] == "canada", f"File {f} not in canada/"

    def test_skips_readme(self):
        """README.md files should be skipped."""
        files = _collect_files(SEED_DATA, country_filter=None)
        for f in files:
            assert f.name.lower() != "readme.md", f"README should be skipped: {f}"

    def test_returns_sorted(self):
        """Files should be sorted alphabetically."""
        files = _collect_files(SEED_DATA, country_filter=None)
        assert files == sorted(files)

    def test_nonexistent_country_returns_empty(self):
        """A country filter that doesn't match any directory should return []."""
        files = _collect_files(SEED_DATA, country_filter="narnia")
        assert files == []


# ---------------------------------------------------------------------------
# Metadata inference
# ---------------------------------------------------------------------------
class TestInferCountryTopic:
    def test_country_from_subdirectory(self):
        """uk/01-overview.md → country=uk, topic=01-overview."""
        path = SEED_DATA / "uk" / "01-overview.md"
        country, topic = infer_country_topic(path, SEED_DATA)
        assert country == "uk"
        assert topic == "01-overview"

    def test_country_from_hyphenated_subdir(self):
        """new-zealand/01-overview.md → country=new-zealand."""
        path = SEED_DATA / "new-zealand" / "01-overview.md"
        country, topic = infer_country_topic(path, SEED_DATA)
        assert country == "new-zealand"
        assert topic == "01-overview"

    def test_legacy_top_level_file(self):
        """uk-study-after-12.txt → country=uk, topic=study-after-12."""
        path = SEED_DATA / "uk-study-after-12.txt"
        country, topic = infer_country_topic(path, SEED_DATA)
        assert country == "uk"
        assert topic == "study-after-12"

    def test_all_countries_have_correct_slug(self):
        """Each country dir should produce the correct country slug."""
        for slug in ("canada", "usa", "germany", "finland", "japan",
                     "south-korea", "ireland", "new-zealand"):
            path = SEED_DATA / slug / "01-overview.md"
            country, _ = infer_country_topic(path, SEED_DATA)
            assert country == slug


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------
class TestChunkMarkdown:
    def test_splits_on_h2(self):
        """Markdown with ## headings should produce multiple chunks."""
        text = "# Title\n\nIntro paragraph.\n\n## Section One\n\nContent one.\n\n## Section Two\n\nContent two.\n"
        chunks = chunk_markdown(text)
        assert len(chunks) >= 3  # preamble + section1 + section2

    def test_preserves_heading_in_chunk(self):
        """Each section chunk should start with its heading."""
        text = "## Visa Requirements\n\nYou need a valid passport.\n\n## Financial Proof\n\nBank statements required.\n"
        chunks = chunk_markdown(text)
        headings_found = [c for c in chunks if c.startswith("## ")]
        assert len(headings_found) == 2

    def test_single_block_no_headings(self):
        """Text without any headings should still produce chunks."""
        text = "Just a plain paragraph with no headings at all."
        chunks = chunk_markdown(text)
        assert len(chunks) == 1
        assert "plain paragraph" in chunks[0]

    def test_long_section_gets_split(self):
        """A section exceeding CHUNK_CHARS should be split further."""
        long_text = "## Big Section\n\n" + "word " * 500  # ~2500 chars
        chunks = chunk_markdown(long_text)
        assert len(chunks) >= 2


# ---------------------------------------------------------------------------
# Chunk ID determinism
# ---------------------------------------------------------------------------
class TestStableChunkId:
    def test_deterministic(self):
        """Same inputs should always produce the same ID."""
        id1 = stable_chunk_id("canada/01-overview.md", 0)
        id2 = stable_chunk_id("canada/01-overview.md", 0)
        assert id1 == id2

    def test_different_inputs_differ(self):
        """Different source files or indices should produce different IDs."""
        id1 = stable_chunk_id("canada/01-overview.md", 0)
        id2 = stable_chunk_id("canada/01-overview.md", 1)
        id3 = stable_chunk_id("usa/01-overview.md", 0)
        assert id1 != id2
        assert id1 != id3

    def test_format(self):
        """IDs should start with 'chunk_' and be a fixed length."""
        cid = stable_chunk_id("test.md", 42)
        assert cid.startswith("chunk_")
        assert len(cid) == len("chunk_") + 24


# ---------------------------------------------------------------------------
# Per-country file counts (sanity check)
# ---------------------------------------------------------------------------
class TestCountryFileCounts:
    """Each new country should have exactly 12 .md files."""

    @pytest.mark.parametrize("slug", [
        "canada", "usa", "new-zealand", "germany",
        "finland", "japan", "south-korea", "ireland",
    ])
    def test_new_country_has_12_files(self, slug):
        files = _collect_files(SEED_DATA, country_filter=slug)
        assert len(files) == 12, (
            f"{slug}/ should have 12 files, found {len(files)}: "
            f"{[f.name for f in files]}"
        )

    def test_uk_corpus_exists(self):
        files = _collect_files(SEED_DATA, country_filter="uk")
        assert len(files) >= 12, f"UK should have ≥12 files, found {len(files)}"

    def test_australia_corpus_exists(self):
        files = _collect_files(SEED_DATA, country_filter="australia")
        assert len(files) >= 12, f"Australia should have ≥12 files, found {len(files)}"
