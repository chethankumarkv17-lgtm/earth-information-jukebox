"""
Core configuration re-export for backward compatibility.
All settings are maintained in app.config.
"""
from app.config import Settings, settings

__all__ = ["Settings", "settings"]
