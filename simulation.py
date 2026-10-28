"""
MASS (Multi-Agent Simulation Scaling) Masking Protocol
======================================================
Prevents LLM look-ahead contamination by replacing real asset identifiers
and absolute dates with anonymized placeholders before text is ingested by
agents.  A global reverse-mapping is maintained so that the optimization
engine can translate masked tickers back to real symbols.

Usage:
    from simulation import activate_masking, mask_text, unmask_ticker

    activate_masking(["TSLA", "MSFT", "AMZN", "NFLX", "COIN"])
    safe_text = mask_text("Tesla (TSLA) dropped 45% in 2022 ...")
    real      = unmask_ticker("Asset_Alpha")  # -> "TSLA"
"""

import re
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# Module-level state
# ---------------------------------------------------------------------------
_MASKING_ACTIVE: bool = False
_TICKER_TO_MASK: Dict[str, str] = {}
_MASK_TO_TICKER: Dict[str, str] = {}

# Greek-letter inspired pseudonyms (extensible to ~26 assets)
_PSEUDONYMS = [
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta",
    "Eta", "Theta", "Iota", "Kappa", "Lambda", "Mu",
]

# Common company-name expansions (ticker -> list of real names to mask)
_COMPANY_NAMES: Dict[str, List[str]] = {
    "TSLA":  ["Tesla", "TSLA"],
    "MSFT":  ["Microsoft", "MSFT"],
    "AMZN":  ["Amazon", "AMZN"],
    "NFLX":  ["Netflix", "NFLX"],
    "COIN":  ["Coinbase", "COIN"],
    "AAPL":  ["Apple", "AAPL"],
    "GOOGL": ["Google", "Alphabet", "GOOGL"],
    "META":  ["Meta", "Facebook", "META"],
    "NVDA":  ["Nvidia", "NVDA"],
    "AMD":   ["AMD"],
}


def activate_masking(tickers: List[str]) -> None:
    """Turn on MASS masking for a given set of tickers."""
    global _MASKING_ACTIVE, _TICKER_TO_MASK, _MASK_TO_TICKER
    _MASKING_ACTIVE = True
    _TICKER_TO_MASK = {}
    _MASK_TO_TICKER = {}
    for idx, ticker in enumerate(tickers):
        pseudo = f"Asset_{_PSEUDONYMS[idx % len(_PSEUDONYMS)]}"
        _TICKER_TO_MASK[ticker] = pseudo
        _MASK_TO_TICKER[pseudo] = ticker
    print(f"[MASS] Masking activated for {len(tickers)} assets: {_TICKER_TO_MASK}")


def deactivate_masking() -> None:
    """Turn off MASS masking (e.g., for live trading)."""
    global _MASKING_ACTIVE
    _MASKING_ACTIVE = False


def is_masking_active() -> bool:
    return _MASKING_ACTIVE


def mask_text(text: str) -> str:
    """
    Replace real ticker symbols, company names, and absolute years in *text*
    with anonymized placeholders.  Returns the original string unchanged when
    masking is not active.
    """
    if not _MASKING_ACTIVE or not text:
        return text

    masked = text

    # 1. Replace company names and ticker symbols → Asset_<Pseudo>
    for ticker, pseudo in _TICKER_TO_MASK.items():
        names_to_mask = _COMPANY_NAMES.get(ticker, [ticker])
        for name in names_to_mask:
            pattern = re.compile(r'\b' + re.escape(name) + r'\b', re.IGNORECASE)
            masked = pattern.sub(pseudo, masked)

    # 2. Replace absolute years (2019-2029) with relative tags
    masked = re.sub(r'\b(20[1-2][0-9])\b', 'Year_X', masked)

    # 3. Replace quarter references  (Q1 2023 → Period_T)
    masked = re.sub(r'\bQ[1-4]\s*Year_X\b', 'Period_T', masked)

    return masked


def unmask_ticker(masked_name: str) -> Optional[str]:
    """Reverse-lookup: Asset_Alpha → TSLA.  Returns None if unknown."""
    return _MASK_TO_TICKER.get(masked_name)


def get_ticker_mask(real_ticker: str) -> Optional[str]:
    """Forward-lookup: TSLA → Asset_Alpha.  Returns the ticker itself if
    masking is inactive or no mapping exists."""
    if not _MASKING_ACTIVE:
        return real_ticker
    return _TICKER_TO_MASK.get(real_ticker, real_ticker)


def unmask_views(masked_views: dict) -> dict:
    """Translate a views dict keyed by masked names back to real tickers.
    
    Example:
        {"Asset_Alpha": 0.05, "Asset_Beta": -0.02}
        → {"TSLA": 0.05, "MSFT": -0.02}
    """
    if not _MASKING_ACTIVE:
        return masked_views
    real_views = {}
    for key, val in masked_views.items():
        real = _MASK_TO_TICKER.get(key, key)  # fallback to key itself
        real_views[real] = val
    return real_views


# ---------------------------------------------------------------------------
# Quick self-test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    activate_masking(["TSLA", "MSFT", "AMZN", "NFLX", "COIN"])
    sample = "Tesla (TSLA) dropped 45% in Q4 2022 due to Musk's Twitter acquisition. Microsoft announced a $10B OpenAI investment in 2023."
    print("Original:", sample)
    print("Masked:  ", mask_text(sample))
    print("Unmask Asset_Alpha:", unmask_ticker("Asset_Alpha"))
    print("Unmask views:", unmask_views({"Asset_Alpha": 0.05, "Asset_Beta": -0.02}))
