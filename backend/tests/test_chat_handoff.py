from app.eval.types import Decision
from app.qeval.handoff import counselor_offer_for_response


def test_out_of_scope_answer_offers_strong_counselor_handoff():
    offer, reason, tier = counselor_offer_for_response(
        response_decision=Decision.OUT_OF_SCOPE,
        response_answer="I'm not sure I can help with that one.",
        call_consent=False,
        lead_score=0,
    )

    assert offer is True
    assert reason == "question"
    assert tier == "strong"


def test_existing_consent_suppresses_counselor_handoff():
    offer, reason, tier = counselor_offer_for_response(
        response_decision=Decision.OUT_OF_SCOPE,
        response_answer="I'm not sure I can help with that one.",
        call_consent=True,
        lead_score=100,
    )

    assert offer is False
    assert reason is None
    assert tier is None
