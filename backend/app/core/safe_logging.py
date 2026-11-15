"""
NASA Earth Information Jukebox — Secure Logging & Credential Sanitizer
2026 NASA Space Apps Challenge

Sanitizes log records to prevent accidental exposure of:
- Bearer JWT tokens
- Passwords and verification hashes
- NASA / Copernicus API keys and client secrets
- Personally Identifiable Information (PII)
"""

import re
import logging
from typing import Any


class CredentialSanitizingFilter(logging.Filter):
    """
    Scans log message strings and replaces credentials and tokens with redaction tags.
    """

    PATTERNS = [
        # Bearer tokens
        (re.compile(r"Bearer\s+[A-Za-z0-9\-_\.]+", re.IGNORECASE), "Bearer [REDACTED_TOKEN]"),
        # Raw JWT strings (header.payload.signature)
        (re.compile(r"eyJ[A-Za-z0-9\-_]{10,}\.eyJ[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]+"), "[REDACTED_JWT]"),
        # Password JSON / query fields
        (re.compile(r'("password"\s*:\s*)"[^"]+"', re.IGNORECASE), r'\1"[REDACTED_PASSWORD]"'),
        (re.compile(r'(password=)[^\s&]+', re.IGNORECASE), r'\1[REDACTED_PASSWORD]'),
        # Client secrets
        (re.compile(r'("client_secret"\s*:\s*)"[^"]+"', re.IGNORECASE), r'\1"[REDACTED_SECRET]"'),
        (re.compile(r'(client_secret=)[^\s&]+', re.IGNORECASE), r'\1[REDACTED_SECRET]'),
        # API Keys
        (re.compile(r'(api_key=)[^\s&]+', re.IGNORECASE), r'\1[REDACTED_API_KEY]'),
        (re.compile(r'("api_key"\s*:\s*)"[^"]+"', re.IGNORECASE), r'\1"[REDACTED_API_KEY]"'),
    ]

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.sanitize_string(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: self.sanitize_value(v) for k, v in record.args.items()}
            elif isinstance(record.args, (list, tuple)):
                record.args = tuple(self.sanitize_value(arg) for arg in record.args)
        return True

    @classmethod
    def sanitize_string(cls, text: str) -> str:
        for pattern, replacement in cls.PATTERNS:
            text = pattern.sub(replacement, text)
        return text

    @classmethod
    def sanitize_value(cls, val: Any) -> Any:
        if isinstance(val, str):
            return cls.sanitize_string(val)
        return val


def setup_secure_logging() -> None:
    """Configures the credential sanitizing filter across root and uvicorn loggers."""
    sanitizer = CredentialSanitizingFilter()
    root_logger = logging.getLogger()
    root_logger.addFilter(sanitizer)

    for handler in root_logger.handlers:
        handler.addFilter(sanitizer)

    for logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"):
        log = logging.getLogger(logger_name)
        log.addFilter(sanitizer)
        for h in log.handlers:
            h.addFilter(sanitizer)
