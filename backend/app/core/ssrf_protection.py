"""
NASA Earth Information Jukebox — SSRF Protection & External URL Validator
2026 NASA Space Apps Challenge

Protects against Server-Side Request Forgery (SSRF):
- Blocks internal private networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- Blocks localhost / loopback addresses (127.0.0.0/8, ::1)
- Blocks cloud instance metadata services (169.254.169.254, 169.254.0.0/16)
- Blocks dangerous protocols (file://, gopher://, ftp://, dict://)
- Enforces strict domain allowlists for scientific telemetry providers
"""

import socket
import ipaddress
import urllib.parse
from typing import List, Optional, Set


class SSRFSecurityError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


# Approved scientific domain suffixes for Earth observation data
APPROVED_DOMAIN_SUFFIXES: Set[str] = {
    "nasa.gov",
    "earthdata.nasa.gov",
    "copernicus.eu",
    "element84.com",
    "noaa.gov",
    "open-meteo.com",
    "usgs.gov",
    "nsidc.org",
}


def is_ip_allowed(ip_str: str) -> bool:
    """
    Evaluates whether an IP address is a safe, routable public address.
    Strictly forbids loopback, link-local, private RFC 1918, and multicast spaces.
    Handles RFC 6052 NAT64 transition addresses (64:ff9b::/96) by validating the embedded IPv4.
    """
    try:
        ip = ipaddress.ip_address(ip_str)

        # RFC 6052 NAT64 Well-Known Prefix (64:ff9b::/96) translation
        if ip.version == 6 and ip in ipaddress.IPv6Network("64:ff9b::/96"):
            embedded_ipv4 = ipaddress.IPv4Address(ip.packed[-4:])
            return is_ip_allowed(str(embedded_ipv4))

        if ip.is_loopback:
            return False
        if ip.is_private:
            return False
        if ip.is_link_local:
            return False
        if ip.is_reserved:
            return False
        if ip.is_multicast:
            return False
        if ip.is_unspecified:
            return False
        if ip_str == "169.254.169.254":
            return False

        return True
    except ValueError:
        return False


def validate_external_url(url: str, enforce_allowlist: bool = True) -> str:
    """
    Validates an external URL before making outgoing HTTP requests.
    Raises SSRFSecurityError if the URL attempts to contact forbidden hosts or IPs.
    """
    if not url or not isinstance(url, str):
        raise SSRFSecurityError("Missing or invalid URL format.")

    url = url.strip()
    parsed = urllib.parse.urlsplit(url)

    # 1. Scheme Validation
    if parsed.scheme.lower() not in ("http", "https"):
        raise SSRFSecurityError(
            f"Prohibited URL scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted."
        )

    # 2. Hostname extraction
    hostname = parsed.hostname
    if not hostname:
        raise SSRFSecurityError("URL does not contain a valid hostname.")

    hostname_lower = hostname.lower()

    # 3. Direct IP checking
    try:
        # If hostname is a raw IP literal
        ip = ipaddress.ip_address(hostname_lower)
        if not is_ip_allowed(str(ip)):
            raise SSRFSecurityError(
                f"Access to private, loopback, or metadata IP '{hostname}' is strictly prohibited."
            )
        if enforce_allowlist:
            raise SSRFSecurityError("Direct IP connections to external data sources are not permitted.")
    except ValueError:
        # Hostname is a domain name, not an IP literal
        pass

    # 4. Domain allowlist checking
    if enforce_allowlist:
        is_approved = any(
            hostname_lower == domain or hostname_lower.endswith(f".{domain}")
            for domain in APPROVED_DOMAIN_SUFFIXES
        )
        if not is_approved:
            allowed_list = ", ".join(sorted(APPROVED_DOMAIN_SUFFIXES))
            raise SSRFSecurityError(
                f"External host '{hostname}' is not in the approved scientific telemetry registry. "
                f"Approved domains: {allowed_list}."
            )

    # 5. DNS Resolution & Rebinding Check
    try:
        resolved_addresses = socket.getaddrinfo(
            hostname, parsed.port or (443 if parsed.scheme == "https" else 80)
        )
        for family, socktype, proto, canonname, sockaddr in resolved_addresses:
            resolved_ip = sockaddr[0]
            if not is_ip_allowed(resolved_ip):
                raise SSRFSecurityError(
                    f"Host '{hostname}' resolved to private or restricted IP address '{resolved_ip}'."
                )
    except socket.gaierror:
        # If DNS fails to resolve
        raise SSRFSecurityError(f"Unable to resolve host '{hostname}' via DNS.")

    return url
