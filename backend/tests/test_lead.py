"""Tests for score-based lead qualification logic.

Covers:
  - signal_points mapping (strong=6, good=4, standard=2, none=0, suggestion=1, etc.)
  - doc upload weights (sop=8, financial=8, passport=5, grade_sheet=5, others=3)
  - counselor_tier threshold mapping (>=40 strong, >=30 medium, >=20 soft, <20 None)
  - accumulate_lead ORM updates, status transitions (new -> engaged -> qualified),
    and qualified_at timestamping
  - accumulate_lead_points direct-point accumulation
"""
from datetime import datetime
from unittest.mock import MagicMock

from app.qeval.lead import (
    signal_points,
    signal_points_for_doc,
    counselor_tier,
    accumulate_lead,
    accumulate_lead_points,
)


def _mk(status="new", strong=0, good=0, standard=0, score=0, qualified_at=None, call_consent=False):
    s = MagicMock()
    s.lead_status = status
    s.lead_strong_count = strong
    s.lead_good_count = good
    s.lead_standard_count = standard
    s.lead_score = score
    s.qualified_at = qualified_at
    s.call_consent = call_consent
    return s


# ---------------------------------------------------------------------------
# Signal and Doc Points
# ---------------------------------------------------------------------------

def test_signal_points():
    assert signal_points("strong") == 6
    assert signal_points("good") == 4
    assert signal_points("standard") == 2
    assert signal_points("none") == 0
    assert signal_points("unknown") == 0

    # Source-based overrides
    assert signal_points("none", "suggestion") == 1
    assert signal_points("strong", "category") == 1
    assert signal_points("none", "todo") == 3
    assert signal_points("none", "universities") == 3


def test_doc_points():
    assert signal_points_for_doc("sop") == 8
    assert signal_points_for_doc("financial") == 8
    assert signal_points_for_doc("passport") == 5
    assert signal_points_for_doc("grade_sheet") == 5
    assert signal_points_for_doc("other_doc") == 3


# ---------------------------------------------------------------------------
# Counselor Tiers
# ---------------------------------------------------------------------------

def test_counselor_tiers():
    assert counselor_tier(45) == "strong"
    assert counselor_tier(40) == "strong"
    assert counselor_tier(35) == "medium"
    assert counselor_tier(30) == "medium"
    assert counselor_tier(25) == "soft"
    assert counselor_tier(20) == "soft"
    assert counselor_tier(15) is None
    assert counselor_tier(0) is None


# ---------------------------------------------------------------------------
# Status transitions and Counters
# ---------------------------------------------------------------------------

def test_first_standard_signal_transitions_new_to_engaged():
    s = _mk()
    accumulate_lead(s, "standard")
    assert s.lead_status == "engaged"
    assert s.lead_standard_count == 1
    assert s.lead_score == 2


def test_first_good_signal_transitions_new_to_engaged():
    s = _mk()
    accumulate_lead(s, "good")
    assert s.lead_status == "engaged"
    assert s.lead_good_count == 1
    assert s.lead_score == 4


def test_status_stays_engaged_below_threshold():
    s = _mk(status="engaged", score=10)
    accumulate_lead(s, "good")
    assert s.lead_good_count == 1
    assert s.lead_score == 14
    assert s.lead_status == "engaged"


def test_qualifies_when_score_reaches_threshold():
    s = _mk(status="engaged", score=16)
    accumulate_lead(s, "good")  # +4 points -> score 20
    assert s.lead_status == "qualified"
    assert s.qualified_at is not None


# ---------------------------------------------------------------------------
# qualified_at stamped once
# ---------------------------------------------------------------------------

def test_qualified_at_stamped_once():
    first_ts = datetime(2025, 1, 1, 12, 0, 0)
    s = _mk(status="qualified", score=25, qualified_at=first_ts)
    accumulate_lead(s, "strong")
    assert s.qualified_at == first_ts


# ---------------------------------------------------------------------------
# None/Empty signal is a no-op
# ---------------------------------------------------------------------------

def test_none_signal_is_noop():
    s = _mk()
    accumulate_lead(s, "none")
    assert s.lead_status == "new"
    assert s.lead_score == 0
    assert s.lead_standard_count == 0


def test_empty_signal_is_noop():
    s = _mk()
    accumulate_lead(s, "")
    assert s.lead_status == "new"
    assert s.lead_score == 0


# ---------------------------------------------------------------------------
# Direct Point Accumulation
# ---------------------------------------------------------------------------

def test_accumulate_lead_points():
    s = _mk()
    accumulate_lead_points(s, 5)
    assert s.lead_status == "engaged"
    assert s.lead_score == 5

    s2 = _mk(status="engaged", score=15)
    accumulate_lead_points(s2, 5)
    assert s2.lead_status == "qualified"
    assert s2.lead_score == 20
    assert s2.qualified_at is not None
