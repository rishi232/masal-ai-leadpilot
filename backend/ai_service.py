import json
import logging
import os
import re
import time
from typing import Any, Dict, Optional

from fastapi import HTTPException
from google import genai
from google.genai import types
from pydantic import ValidationError

from prompts import (
    ANALYSIS_SYSTEM_PROMPT,
    ANALYSIS_USER_TEMPLATE,
    CHAT_SYSTEM_PROMPT,
)
from schemas import AnalysisResultSchema


logger = logging.getLogger(__name__)


# =========================================================
# Gemini model configuration
# =========================================================

PRIMARY_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.8-flash",
)

FALLBACK_MODEL = os.getenv(
    "GEMINI_FALLBACK_MODEL",
    "gemini-3.5-flash-lite",
)


# =========================================================
# API key
# =========================================================

def _get_api_key() -> str:
    """Get and validate the Gemini API key."""

    api_key = os.getenv(
        "GEMINI_API_KEY",
        "",
    ).strip()

    if not api_key or api_key == "your_key_here":
        raise HTTPException(
            status_code=502,
            detail=(
                "GEMINI_API_KEY is not configured or is "
                "invalid in the backend environment."
            ),
        )

    return api_key


# =========================================================
# JSON helpers
# =========================================================

def _clean_json_text(text: str) -> str:
    """Remove markdown code fences from model output."""

    text = text.strip()

    if text.startswith("```json"):
        text = text[7:]

    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    return text.strip()


# =========================================================
# Error sanitization
# =========================================================

def _sanitize_error_message(
    err: Exception,
) -> str:
    """
    Prevent API keys or secrets from appearing
    inside backend error messages or logs.
    """

    msg = str(err)

    api_key = os.getenv(
        "GEMINI_API_KEY",
        "",
    )

    if api_key and len(api_key) > 5:
        msg = msg.replace(
            api_key,
            "[REDACTED_API_KEY]",
        )

    msg = re.sub(
        r"AIza[0-9A-Za-z-_]{35}",
        "[REDACTED_API_KEY]",
        msg,
    )

    return msg


# =========================================================
# Gemini error classification
# =========================================================

def _is_quota_error(
    err: Exception,
) -> bool:
    """
    Detect Gemini quota/rate-limit errors.

    Examples:
    - 429 RESOURCE_EXHAUSTED
    - QUOTA EXCEEDED
    - generate_content_free_tier_requests
    - RATE LIMIT
    """

    msg = str(err).upper()

    return (
        "429" in msg
        or "RESOURCE_EXHAUSTED" in msg
        or "QUOTA EXCEEDED" in msg
        or "RATE LIMIT" in msg
        or "RATELIMIT" in msg
        or "FREE_TIER" in msg
    )


def _is_service_unavailable(
    err: Exception,
) -> bool:
    """
    Detect temporary Gemini service/capacity errors.

    Examples:
    - 503 UNAVAILABLE
    - SERVICE UNAVAILABLE
    - MODEL_CAPACITY_EXHAUSTED
    """

    msg = str(err).upper()

    return (
        "503" in msg
        or "UNAVAILABLE" in msg
        or "SERVICE UNAVAILABLE" in msg
        or "MODEL_CAPACITY_EXHAUSTED" in msg
    )


def _is_temporary_gemini_error(
    err: Exception,
) -> bool:
    """
    Detect Gemini errors where another configured model
    should be attempted.

    Handles both:
    - quota/rate-limit errors
    - temporary service/capacity errors
    """

    return (
        _is_quota_error(err)
        or _is_service_unavailable(err)
    )


# =========================================================
# Lead analysis
# =========================================================

def analyze_lead(
    lead_dict: Dict[str, Any],
) -> AnalysisResultSchema:
    """
    Analyze an inbound real-estate lead using Gemini.

    Strategy:

    1. Try the primary Gemini model.
    2. Retry temporary 503 errors once.
    3. If the primary model remains unavailable,
       switch to the fallback model.
    4. If a 429 quota error occurs, immediately switch
       to the fallback model instead of wasting another
       request on the exhausted model.
    5. Validate the resulting JSON with Pydantic.
    6. Enforce HOT/WARM/COLD priority based on score.
    """

    api_key = _get_api_key()

    client = genai.Client(
        api_key=api_key,
    )

    # -----------------------------------------------------
    # Build model list
    # -----------------------------------------------------

    model_candidates = [
        PRIMARY_MODEL,
    ]

    if FALLBACK_MODEL != PRIMARY_MODEL:
        model_candidates.append(
            FALLBACK_MODEL
        )

    # -----------------------------------------------------
    # Build user prompt
    # -----------------------------------------------------

    user_prompt = ANALYSIS_USER_TEMPLATE.format(
        id=lead_dict.get(
            "id",
            "N/A",
        ),
        name=lead_dict.get(
            "name",
            "",
        ),
        location=lead_dict.get(
            "location",
            "",
        ),
        property_requirement=lead_dict.get(
            "property_requirement",
            "",
        ),
        budget=lead_dict.get(
            "budget",
            "",
        ),
        buying_timeline=lead_dict.get(
            "buying_timeline",
            "",
        ),
        customer_message=lead_dict.get(
            "customer_message",
            "",
        ),
    )

    # -----------------------------------------------------
    # Gemini structured JSON configuration
    # -----------------------------------------------------

    generation_config = types.GenerateContentConfig(
        system_instruction=ANALYSIS_SYSTEM_PROMPT,
        response_mime_type="application/json",
    )

    last_error: Optional[Exception] = None

    # =====================================================
    # Try primary model → fallback model
    # =====================================================

    for model_index, model_name in enumerate(
        model_candidates
    ):

        is_fallback = model_index > 0

        if is_fallback:
            logger.warning(
                f"Primary Gemini model unavailable. "
                f"Switching to fallback model: "
                f"{model_name}"
            )

        # -------------------------------------------------
        # Attempt configuration
        # -------------------------------------------------

        # Primary model gets one retry for temporary
        # 503 capacity problems.
        #
        # 429 quota errors are NOT retried because the
        # quota has already been exhausted.
        max_attempts = 2

        for attempt in range(
            1,
            max_attempts + 1,
        ):

            try:

                logger.info(
                    f"Generating AI analysis for lead "
                    f"{lead_dict.get('id')} "
                    f"using {model_name} "
                    f"(attempt {attempt}/{max_attempts})"
                )

                response = client.models.generate_content(
                    model=model_name,
                    contents=user_prompt,
                    config=generation_config,
                )

                # -------------------------------------------------
                # Validate response exists
                # -------------------------------------------------

                if not response.text:
                    raise ValueError(
                        "Empty response received from Gemini API."
                    )

                # -------------------------------------------------
                # Parse JSON
                # -------------------------------------------------

                cleaned_text = _clean_json_text(
                    response.text
                )

                parsed_data = json.loads(
                    cleaned_text
                )

                # -------------------------------------------------
                # Enforce LeadPilot score rules
                # -------------------------------------------------

                score = int(
                    parsed_data.get(
                        "lead_score",
                        50,
                    )
                )

                score = max(
                    0,
                    min(
                        100,
                        score,
                    ),
                )

                parsed_data["lead_score"] = score

                # -------------------------------------------------
                # Enforce HOT / WARM / COLD
                # -------------------------------------------------

                if score >= 75:

                    parsed_data["priority"] = "HOT"

                elif score >= 45:

                    parsed_data["priority"] = "WARM"

                else:

                    parsed_data["priority"] = "COLD"

                # -------------------------------------------------
                # Pydantic validation
                # -------------------------------------------------

                validated = AnalysisResultSchema(
                    **parsed_data
                )

                logger.info(
                    f"AI analysis successfully generated "
                    f"for lead {lead_dict.get('id')} "
                    f"using {model_name}"
                )

                return validated

            # =================================================
            # JSON / schema / value errors
            # =================================================

            except (
                json.JSONDecodeError,
                ValidationError,
                ValueError,
            ) as parse_err:

                last_error = parse_err

                logger.warning(
                    f"Gemini response validation failed "
                    f"for {model_name} "
                    f"(attempt {attempt}/{max_attempts}): "
                    f"{parse_err}"
                )

                # Retry malformed model output once.
                if attempt < max_attempts:

                    time.sleep(2)

                    continue

                # Move to fallback model.
                break

            # =================================================
            # Gemini API errors
            # =================================================

            except Exception as api_err:

                last_error = api_err

                clean_msg = _sanitize_error_message(
                    api_err
                )

                # -------------------------------------------------
                # 429 QUOTA / RATE LIMIT
                # -------------------------------------------------

                if _is_quota_error(api_err):

                    logger.warning(
                        f"Gemini model {model_name} "
                        f"has exhausted its available quota "
                        f"or rate limit. "
                        f"Switching to the next configured "
                        f"model if available. "
                        f"Error: {clean_msg}"
                    )

                    # IMPORTANT:
                    # Do NOT retry the same exhausted model.
                    break

                # -------------------------------------------------
                # 503 TEMPORARY SERVICE / CAPACITY
                # -------------------------------------------------

                if _is_service_unavailable(api_err):

                    logger.warning(
                        f"Gemini model {model_name} "
                        f"is temporarily unavailable "
                        f"(attempt {attempt}/{max_attempts}): "
                        f"{clean_msg}"
                    )

                    if attempt < max_attempts:

                        wait_seconds = 5

                        logger.info(
                            f"Waiting {wait_seconds} seconds "
                            f"before retrying {model_name}..."
                        )

                        time.sleep(
                            wait_seconds
                        )

                        continue

                    logger.warning(
                        f"Model {model_name} failed after "
                        f"{max_attempts} attempts. "
                        f"Moving to fallback if available."
                    )

                    break

                # -------------------------------------------------
                # Other API error
                # -------------------------------------------------

                logger.error(
                    f"Gemini API invocation error: "
                    f"{clean_msg}"
                )

                raise HTTPException(
                    status_code=502,
                    detail=(
                        f"Gemini API request failed: "
                        f"{clean_msg}"
                    ),
                )

    # =========================================================
    # All models failed
    # =========================================================

    clean_err = (
        _sanitize_error_message(
            last_error
        )
        if last_error
        else "Unknown AI generation error"
    )

    raise HTTPException(
        status_code=502,
        detail=(
            "AI analysis could not be generated. "
            f"Primary model: {PRIMARY_MODEL}. "
            f"Fallback model: {FALLBACK_MODEL}. "
            f"Last error: {clean_err}"
        ),
    )


# =========================================================
# Lead Copilot Chat
# =========================================================

def chat_with_lead(
    lead_dict: Dict[str, Any],
    analysis_dict: Optional[Dict[str, Any]],
    question: str,
) -> str:
    """
    Answer a salesperson's question about a specific lead.

    Strategy:

    1. Try the primary Gemini model.
    2. If the primary returns 429, immediately try fallback.
    3. If the primary returns 503, try fallback.
    4. Do not repeatedly hit an exhausted quota.
    5. Return a clean error if all models fail.
    """

    api_key = _get_api_key()

    client = genai.Client(
        api_key=api_key,
    )

    # -----------------------------------------------------
    # Prepare previous AI analysis
    # -----------------------------------------------------

    analysis_str = (
        json.dumps(
            analysis_dict,
            indent=2,
        )
        if analysis_dict
        else "Not yet analyzed"
    )

    # -----------------------------------------------------
    # Build Copilot system instruction
    # -----------------------------------------------------

    system_instruction = CHAT_SYSTEM_PROMPT.format(
        name=lead_dict.get(
            "name",
            "",
        ),
        location=lead_dict.get(
            "location",
            "",
        ),
        property_requirement=lead_dict.get(
            "property_requirement",
            "",
        ),
        budget=lead_dict.get(
            "budget",
            "",
        ),
        buying_timeline=lead_dict.get(
            "buying_timeline",
            "",
        ),
        customer_message=lead_dict.get(
            "customer_message",
            "",
        ),
        analysis_context=analysis_str,
    )

    # -----------------------------------------------------
    # Gemini chat configuration
    # -----------------------------------------------------

    chat_config = types.GenerateContentConfig(
        system_instruction=system_instruction,
    )

    # -----------------------------------------------------
    # Build model list
    # -----------------------------------------------------

    model_candidates = [
        PRIMARY_MODEL,
    ]

    if FALLBACK_MODEL != PRIMARY_MODEL:
        model_candidates.append(
            FALLBACK_MODEL
        )

    last_error: Optional[Exception] = None

    # =====================================================
    # Try primary model → fallback model
    # =====================================================

    for model_index, model_name in enumerate(
        model_candidates
    ):

        if model_index > 0:

            logger.warning(
                f"Switching Gemini Copilot to "
                f"fallback model: {model_name}"
            )

        try:

            logger.info(
                f"Generating Copilot response using "
                f"{model_name}"
            )

            response = client.models.generate_content(
                model=model_name,
                contents=question,
                config=chat_config,
            )

            # -------------------------------------------------
            # Validate response
            # -------------------------------------------------

            if not response.text:

                logger.warning(
                    f"Gemini Copilot returned an empty "
                    f"response using {model_name}"
                )

                return (
                    "I couldn't formulate an answer "
                    "for this lead. Please try "
                    "rephrasing your question."
                )

            logger.info(
                f"Copilot response successfully generated "
                f"using {model_name}"
            )

            return response.text.strip()

        except Exception as api_err:

            last_error = api_err

            clean_msg = _sanitize_error_message(
                api_err
            )

            # -------------------------------------------------
            # 429 QUOTA / RATE LIMIT
            # -------------------------------------------------

            if _is_quota_error(api_err):

                logger.warning(
                    f"Gemini Copilot model {model_name} "
                    f"has exhausted its quota or rate limit. "
                    f"Trying fallback model if available. "
                    f"Error: {clean_msg}"
                )

                # DO NOT retry the same model.
                continue

            # -------------------------------------------------
            # 503 SERVICE UNAVAILABLE
            # -------------------------------------------------

            if _is_service_unavailable(api_err):

                logger.warning(
                    f"Gemini Copilot model {model_name} "
                    f"is temporarily unavailable. "
                    f"Trying fallback model if available. "
                    f"Error: {clean_msg}"
                )

                continue

            # -------------------------------------------------
            # Other API errors
            # -------------------------------------------------

            logger.error(
                f"Gemini Copilot API error: "
                f"{clean_msg}"
            )

            raise HTTPException(
                status_code=502,
                detail=(
                    f"Gemini Copilot request failed: "
                    f"{clean_msg}"
                ),
            )

    # =========================================================
    # All Copilot models failed
    # =========================================================

    clean_err = (
        _sanitize_error_message(
            last_error
        )
        if last_error
        else "Unknown Gemini error"
    )

    raise HTTPException(
        status_code=502,
        detail=(
            "Gemini Copilot is temporarily unavailable. "
            "The configured Gemini models could not "
            "process the request right now. "
            f"Last error: {clean_err}"
        ),
    )