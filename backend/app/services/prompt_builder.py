"""
Prompt Builder Service.
Constructs structured system + user prompts for SQL generation.
Safety instructions are embedded in every prompt — never hardcoded
in business logic; always built through this module.
"""

from app.models.responses import SchemaInfo
from app.utils.logger import get_logger

logger = get_logger(__name__)

_SAFETY_RULES = """
STRICT SAFETY RULES (MUST FOLLOW):
1. Generate ONLY a single SELECT SQL query. Nothing else.
2. NEVER generate: UPDATE, DELETE, INSERT, DROP, ALTER, TRUNCATE, CREATE, MERGE, EXEC, or EXECUTE statements.
3. NEVER generate stored procedure calls.
4. NEVER generate multiple SQL statements (no semicolons separating statements).
5. Do NOT include any explanation, markdown, or code fences — output raw SQL only.
6. If the question inherently requires modifying data (INSERT/UPDATE/DELETE), respond with EXACTLY the word UNSAFE_REQUEST. For read-only questions that are slightly ambiguous, make a reasonable assumption and write the SELECT query anyway.
""".strip()

_SYSTEM_PROMPT_TEMPLATE = """You are an expert SQL query generator for a {db_type} database.
Your sole task is to convert natural language questions into accurate, efficient, read-only SQL queries.

{safety_rules}

DATABASE SCHEMA:
{schema_text}

GUIDELINES:
- **Analyze Intent**: Before writing SQL, carefully analyze the user's question to determine the required tables, joins, and filters.
- **Native Syntax**: Use proper SQL syntax natively supported by {db_type}. Do NOT use advanced window functions (e.g. PERCENTILE_CONT) if they are not natively supported in {db_type} (like SQLITE).
- **Schema Strictness**: ONLY query tables that are explicitly listed in the DATABASE SCHEMA above. Do NOT query internal system tables (like sqlite_master or information_schema) unless they are in the schema.
- **Strict Aliasing**: Use clear table aliases in JOINs (e.g. `FROM users AS u`). You MUST verify which table owns which column. Do NOT select a column from Table A if it actually belongs to Table B.
- **No Hallucination**: Double check your table aliases! ONLY select columns that actually exist in the table schema provided above. Do NOT hallucinate columns.
- **Fuzzy Matching**: When searching for text/names, ALWAYS use case-insensitive LIKE (e.g. `LOWER(col) LIKE '%text%'`). Do NEVER hallucinate exact IDs or reference codes unless provided by the user.
- **Best Practices**: Use CTEs (WITH clauses) for complex multi-step queries to maintain readability. Select * when asking for a specific entity, otherwise select only the relevant explicit columns. Apply LIMIT clauses when the question implies a bounded result set.
"""


class PromptBuilder:
    """
    Builds system and user prompts for the SQL generation LLM call.
    Decoupled from both the LLM provider and query execution logic.
    """

    def build(self, schema: SchemaInfo, question: str) -> tuple[str, str]:
        """
        Construct a (system_prompt, user_prompt) tuple.

        Args:
            schema: Extracted schema metadata for the connected database.
            question: The user's natural language question.

        Returns:
            (system_prompt, user_prompt) ready for the LLM.
        """
        schema_text = self._schema_to_text(schema)
        system_prompt = _SYSTEM_PROMPT_TEMPLATE.format(
            db_type=schema.db_type.upper(),
            safety_rules=_SAFETY_RULES,
            schema_text=schema_text,
        )
        user_prompt = f"Question: {question}\n\nSQL Query:"
        logger.debug(
            "Prompt built — schema_tables=%d question_len=%d",
            len(schema.tables), len(question),
        )
        return system_prompt, user_prompt


    @staticmethod
    def _schema_to_text(schema: SchemaInfo) -> str:
        """
        Convert schema metadata to a compact DDL-like text representation
        that LLMs understand well.
        """
        lines: list[str] = [
            f"Database: {schema.database_name} ({schema.db_type.upper()})",
            "",
        ]
        for table in schema.tables:
            lines.append(f"TABLE: {table.name}")
            if table.row_count is not None:
                lines.append(f"  (approx. {table.row_count:,} rows)")
            for col in table.columns:
                parts = [f"  - {col.name}: {col.data_type}"]
                if col.primary_key:
                    parts.append("[PK]")
                if col.foreign_key:
                    parts.append(f"[FK → {col.foreign_key}]")
                if not col.nullable:
                    parts.append("NOT NULL")
                lines.append(" ".join(parts))
            lines.append("")
        return "\n".join(lines)


# Module-level singleton
prompt_builder = PromptBuilder()
