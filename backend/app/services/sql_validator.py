"""
SQL Validation Service.
Performs safety checks on generated SQL before execution.
Rejects any non-read-only or dangerous SQL patterns.
"""

import re
from app.utils.exceptions import SQLValidationError
from app.utils.logger import get_logger

logger = get_logger(__name__)

_FORBIDDEN_KEYWORDS = [
    r"\bDELETE\b",
    r"\bUPDATE\b",
    r"\bINSERT\b",
    r"\bDROP\b",
    r"\bALTER\b",
    r"\bTRUNCATE\b",
    r"\bCREATE\b",
    r"\bMERGE\b",
    r"\bEXEC\b",
    r"\bEXECUTE\b",
    r"\bSP_\w+",           # Stored procedure calls
    r"\bXP_\w+",           # Extended stored procedures (MSSQL)
    r"\bCALL\b",           # MySQL stored procedures
    r"\bGRANT\b",
    r"\bREVOKE\b",
    r"\bCOMMIT\b",
    r"\bROLLBACK\b",
    r"\bSAVEPOINT\b",
    r"\bLOAD\b\s+\bDATA\b",
    r"\bINTO\b\s+\bOUTFILE\b",
    r"\bSLEEP\b",          # Time-based blind injection
    r"\bBENCHMARK\b",      # MySQL injection
    r"\bWAITFOR\b",        # MSSQL injection
]

_FORBIDDEN_PATTERN = re.compile(
    "|".join(_FORBIDDEN_KEYWORDS),
    flags=re.IGNORECASE,
)

# SQL must begin with SELECT or WITH (for CTEs)
_ALLOWED_START_PATTERN = re.compile(
    r"^\s*(SELECT|WITH)\b",
    flags=re.IGNORECASE,
)

# Detect multiple statements via semicolons (excluding trailing)
_MULTI_STATEMENT_PATTERN = re.compile(r";(?!\s*$)")


class SQLValidator:
    """
    Validates generated SQL for safety before execution.
    All validation is purely string/regex-based — no DB round-trip required.
    """

    def validate(self, sql: str) -> str:
        """
        Validate and return the cleaned SQL string.

        Args:
            sql: Raw SQL string from the LLM.

        Returns:
            Cleaned SQL string (stripped of trailing semicolons/whitespace).

        Raises:
            SQLValidationError: If any safety check fails.
        """
        if not sql or not sql.strip():
            raise SQLValidationError("Empty SQL received from LLM")

        # Detect the LLM's explicit unsafe signal anywhere in the text
        if "UNSAFE_REQUEST" in sql.upper():
            raise SQLValidationError(
                "The AI determined this request cannot be answered safely or is too ambiguous.",
                detail="Try rephrasing your question to be more specific. Only read-only questions are supported.",
            )

        cleaned = self._clean(sql)

        self._check_allowed_start(cleaned)
        self._check_forbidden_keywords(cleaned)
        self._check_multi_statement(cleaned)
        self._check_length(cleaned)

        logger.debug("SQL validation passed (%d chars)", len(cleaned))
        return cleaned


    @staticmethod
    def _clean(sql: str) -> str:
        """Strip markdown fences, think blocks, leading/trailing whitespace, and trailing semicolons."""
        # 1. Remove <think> blocks (even unclosed ones) first, as they contain reasoning, not final code.
        sql = re.sub(r"<think>.*?(?:</think>|$)", "", sql, flags=re.IGNORECASE | re.DOTALL).strip()
        
        # 2. Extract SQL from all markdown blocks and concatenate them, in case the LLM split the query.
        blocks = re.findall(r"```(?:sql)?\s*(.*?)\s*```", sql, flags=re.IGNORECASE | re.DOTALL)
        if blocks:
            sql = "\n".join(b.strip() for b in blocks)
        else:
            # Fallback: Remove raw fences just in case it didn't close them
            sql = re.sub(r"```(?:sql)?", "", sql, flags=re.IGNORECASE).strip()
            
        # 3. Remove trailing semicolon
        sql = sql.rstrip(";").strip()
        return sql

    @staticmethod
    def _check_allowed_start(sql: str) -> None:
        if not _ALLOWED_START_PATTERN.match(sql):
            raise SQLValidationError(
                "Only SELECT and WITH (CTE) queries are allowed",
                detail=f"Query starts with: '{sql[:30]}...'",
            )

    @staticmethod
    def _check_forbidden_keywords(sql: str) -> None:
        match = _FORBIDDEN_PATTERN.search(sql)
        if match:
            raise SQLValidationError(
                f"Forbidden SQL keyword detected: '{match.group()}'",
                detail="Only read-only SELECT queries are permitted.",
            )

    @staticmethod
    def _check_multi_statement(sql: str) -> None:
        if _MULTI_STATEMENT_PATTERN.search(sql):
            raise SQLValidationError(
                "Multiple SQL statements are not allowed",
                detail="Only a single SELECT statement may be executed.",
            )

    @staticmethod
    def _check_length(sql: str) -> None:
        if len(sql) > 10_000:
            raise SQLValidationError(
                "Generated SQL exceeds maximum allowed length",
                detail=f"Length: {len(sql)} chars (max: 10,000).",
            )


# Module-level singleton
sql_validator = SQLValidator()
