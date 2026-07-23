"""
Schema Extraction Service.
Uses SQLAlchemy inspection to extract tables, columns, types,
primary keys, and foreign keys. Results are cached per session.
"""

from sqlalchemy import Engine, inspect, text
from app.models.responses import ColumnInfo, TableInfo, SchemaInfo
from app.utils.exceptions import SchemaExtractionError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SchemaExtractor:
    """
    Extracts and caches database schema metadata.
    Only schema (never data rows) is read — safe to pass to the LLM.
    """

    def extract(self, engine: Engine, database_name: str, db_type: str) -> SchemaInfo:
        """
        Introspect the database and return a full SchemaInfo object.

        Args:
            engine: Active SQLAlchemy engine.
            database_name: Human-readable name shown in the UI.
            db_type: 'sqlite' | 'postgresql' | 'mysql'

        Returns:
            SchemaInfo containing all tables and their columns.

        Raises:
            SchemaExtractionError: If introspection fails.
        """
        try:
            inspector = inspect(engine)
            table_names = inspector.get_table_names()
            tables: list[TableInfo] = []

            for table_name in table_names:
                columns = self._extract_columns(inspector, table_name)
                row_count = self._safe_row_count(engine, table_name)
                tables.append(TableInfo(
                    name=table_name,
                    columns=columns,
                    row_count=row_count,
                ))

            schema = SchemaInfo(
                database_name=database_name,
                db_type=db_type,
                tables=tables,
                table_count=len(tables),
            )
            logger.info(
                "Schema extracted: %d tables from '%s'",
                len(tables), database_name,
            )
            return schema

        except SchemaExtractionError:
            raise
        except Exception as exc:
            raise SchemaExtractionError(
                "Failed to extract database schema",
                detail=str(exc),
            ) from exc


    def _extract_columns(self, inspector, table_name: str) -> list[ColumnInfo]:
        """Extract column info including PK and FK annotations."""
        raw_columns = inspector.get_columns(table_name)
        pk_cols = set(inspector.get_pk_constraint(table_name).get("constrained_columns", []))
        fk_map = self._build_fk_map(inspector, table_name)

        columns: list[ColumnInfo] = []
        for col in raw_columns:
            col_name = col["name"]
            columns.append(ColumnInfo(
                name=col_name,
                data_type=str(col["type"]),
                nullable=col.get("nullable", True),
                primary_key=col_name in pk_cols,
                foreign_key=fk_map.get(col_name),
            ))
        return columns

    @staticmethod
    def _build_fk_map(inspector, table_name: str) -> dict[str, str]:
        """Return a dict mapping column → 'ref_table.ref_col' for FKs."""
        fk_map: dict[str, str] = {}
        for fk in inspector.get_foreign_keys(table_name):
            for local_col, ref_col in zip(
                fk.get("constrained_columns", []),
                fk.get("referred_columns", []),
            ):
                ref_table = fk.get("referred_table", "")
                fk_map[local_col] = f"{ref_table}.{ref_col}"
        return fk_map

    @staticmethod
    def _safe_row_count(engine: Engine, table_name: str) -> int | None:
        """Return approximate row count for a table, or None on error."""
        try:
            with engine.connect() as conn:
                result = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
                row = result.fetchone()
                return int(row[0]) if row else None
        except Exception:
            return None  # Row count is informational — never fail on it


# Module-level singleton
schema_extractor = SchemaExtractor()
