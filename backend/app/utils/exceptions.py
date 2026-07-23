"""
Custom exception classes for the AI SQL Agent backend.
Each exception maps to a specific error scenario with a clear message.
"""


class AgentBaseException(Exception):
    """Base exception for all AI SQL Agent errors."""

    def __init__(self, message: str, detail: str | None = None):
        self.message = message
        self.detail = detail
        super().__init__(message)



class DatabaseConnectionError(AgentBaseException):
    """Raised when a database connection attempt fails."""


class DatabaseExecutionError(AgentBaseException):
    """Raised when query execution fails."""


class QueryTimeoutError(AgentBaseException):
    """Raised when a query exceeds the configured timeout."""


class SessionNotFoundError(AgentBaseException):
    """Raised when the requested session ID does not exist."""


class UnsupportedDatabaseError(AgentBaseException):
    """Raised when an unsupported database type is requested."""



class SchemaExtractionError(AgentBaseException):
    """Raised when schema introspection fails."""



class SQLValidationError(AgentBaseException):
    """Raised when generated SQL fails safety validation."""


class SQLGenerationError(AgentBaseException):
    """Raised when the LLM fails to produce valid SQL."""



class LLMProviderError(AgentBaseException):
    """Raised when the LLM API returns an error."""


class LLMConfigurationError(AgentBaseException):
    """Raised when the LLM provider is not properly configured."""



class FileUploadError(AgentBaseException):
    """Raised when a file upload fails."""
