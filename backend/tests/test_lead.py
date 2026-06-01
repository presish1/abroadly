"""Tests for lead qualification logic.

Covers (per plan spec):
  - is_qualified truth table: 2 strong / 3 good / 4 standard qualify;
    1 strong + 2 good does NOT qualify
  - status transitions: new→engaged on first signal, →qualified at threshold
  - qualified_at stamped exactly once (never overwritten)
  - lead_score weighted correctly (strong=3, good=2, standard=1)
  - none signal is a no-op
"""
from datetime import datetime
from unittest.mock import MagicMock

from app.qeval.lead import is_qualified, accumulate_lead


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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
# is_qualified truth table
# ---------------------------------------------------------------------------

def test_two_strong_qualifies():
    assert is_qualified(2, 0, 0) is True


def test_three_good_qualifies():
    assert is_qualified(0, 3, 0) is True


def test_four_standard_qualifies():
    assert is_qualified(0, 0, 4) is True


def test_one_strong_two_good_does_not_qualify():
    # The most important negative case from the plan spec
    assert is_qualified(1, 2, 0) is False


def test_zero_does_not_qualify():
    assert is_qualified(0, 0, 0) is False


def test_below_threshold_combos():
    assert is_qualified(1, 0, 3) is False   # 1 strong + 3 standard, still under
    assert is_qualified(0, 2, 3) is False   # 2 good + 3 standard, still under
    assert is_qualified(0, 2, 0) is False   # 2 good, not yet 3


# ---------------------------------------------------------------------------
# Status transitions
# ---------------------------------------------------------------------------

def test_first_standard_signal_transitions_new_to_engaged():
    s = _mk()
    accumulate_lead(s, "standard")
    assert s.lead_status == "engaged"
    assert s.lead_standard_count == 1


def test_first_good_signal_transitions_new_to_engaged():
    s = _mk()
    accumulate_lead(s, "good")
    assert s.lead_status == "engaged"


def test_good_signal_increments_counter_when_engaged():
    s = _mk(status="engaged", good=1)
    accumulate_lead(s, "good")
    assert s.lead_good_count == 2
    assert s.lead_status == "engaged"  # still engaged, not yet 3 good


def test_qualifies_on_second_strong():
    s = _mk(status="engaged", strong=1)
    accumulate_lead(s, "strong")
    assert s.lead_status == "qualified"
    assert s.qualified_at is not None


def test_qualifies_on_third_good():
    s = _mk(status="engaged", good=2)
    accumulate_lead(s, "good")
    assert s.lead_status == "qualified"


def test_qualifies_on_fourth_standard():
    s = _mk(status="engaged", standard=3)
    accumulate_lead(s, "standard")
    assert s.lead_status == "qualified"


# ---------------------------------------------------------------------------
# qualified_at stamped once
# ---------------------------------------------------------------------------

def test_qualified_at_stamped_once():
    first_ts = datetime(2025, 1, 1, 12, 0, 0)
    s = _mk(status="qualified", strong=3, qualified_at=first_ts)
    accumulate_lead(s, "strong")
    # Already qualified — qualified_at must NOT be overwritten
    assert s.qualified_at == first_ts


def test_qualified_at_is_set_on_first_qualification():
    s = _mk(status="engaged", strong=1)
    assert s.qualified_at is None
    accumulate_lead(s, "strong")
    assert s.qualified_at is not None


# ---------------------------------------------------------------------------
# None signal is a no-op
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


# ---------------------------------------------------------------------------
# lead_score weighted sum
# ---------------------------------------------------------------------------

def test_lead_score_weighted():
    s = _mk(status="engaged", strong=1, good=2, standard=1)
    accumulate_lead(s, "standard")
    # strong=1 (3pts) + good=2 (4pts) + standard=2 (2pts) = 9
    assert s.lead_score == 9


def test_lead_score_after_strong():
    s = _mk(status="engaged", strong=0, good=0, standard=0)
    accumulate_lead(s, "strong")
    assert s.lead_score == 3
