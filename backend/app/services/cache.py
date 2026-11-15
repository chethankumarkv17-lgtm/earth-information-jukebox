"""
In-Memory Thread-Safe LRU/TTL Cache for Geospatial Imagery & Telemetry
2026 NASA Space Apps Challenge — EARTH JUKEBOX
"""

import time
import threading
from typing import Any, Optional, Dict
from app.core.config import settings


class GeospatialCache:
    def __init__(self, default_ttl: int = settings.CACHE_TTL_SECONDS, max_entries: int = settings.CACHE_MAX_ENTRIES):
        self.default_ttl = default_ttl
        self.max_entries = max_entries
        self._store: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                self._misses += 1
                return None

            now = time.time()
            if now > entry["expires_at"]:
                del self._store[key]
                self._misses += 1
                return None

            # Mark access time for LRU eviction
            entry["last_accessed"] = now
            self._hits += 1
            return entry["value"]

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        with self._lock:
            now = time.time()
            effective_ttl = ttl if ttl is not None else self.default_ttl
            
            # Evict oldest entry if at capacity
            if len(self._store) >= self.max_entries and key not in self._store:
                self._evict_oldest()

            self._store[key] = {
                "value": value,
                "created_at": now,
                "expires_at": now + effective_ttl,
                "last_accessed": now,
            }

    def has(self, key: str) -> bool:
        return self.get(key) is not None

    def delete(self, key: str) -> bool:
        with self._lock:
            if key in self._store:
                del self._store[key]
                return True
            return False

    def clear(self) -> None:
        with self._lock:
            self._store.clear()
            self._hits = 0
            self._misses = 0

    def stats(self) -> Dict[str, Any]:
        with self._lock:
            now = time.time()
            active_count = sum(1 for e in self._store.values() if now <= e["expires_at"])
            total_requests = self._hits + self._misses
            hit_ratio = (self._hits / total_requests) if total_requests > 0 else 0.0

            return {
                "total_entries": len(self._store),
                "active_entries": active_count,
                "max_entries": self.max_entries,
                "hits": self._hits,
                "misses": self._misses,
                "hit_ratio": round(hit_ratio, 4),
            }

    def _evict_oldest(self) -> None:
        if not self._store:
            return
        # Find entry with lowest last_accessed time
        oldest_key = min(self._store.keys(), key=lambda k: self._store[k]["last_accessed"])
        del self._store[oldest_key]


# Global singleton cache instance
geo_cache = GeospatialCache()
