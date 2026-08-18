#!/usr/bin/env python3
"""One-shot OAuth consent flow → calendar-scoped refresh token for the site.

- client_id:   gog credentials.json (460636063171-...)
- client_secret: macOS keychain (service "gogcli")
- scopes:      calendar (free/busy) + calendar.events (create bookings)

Output: refresh token printed to stdout; also appended to the env files
listed in ENV_TARGETS as GOG_CALENDAR_REFRESH_TOKEN.
"""
import json
import os
import secrets
import subprocess
import sys
import threading
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

CLIENT_ID_PATH = os.path.expanduser(
    "~/Library/Application Support/gogcli/credentials.json"
)
REDIRECT_PORT = 53811
REDIRECT_URI = f"http://127.0.0.1:{REDIRECT_PORT}/oauth2/callback"
SCOPES = [
    "openid",
    "email",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
]
ENV_TARGETS = [
    os.path.expanduser("~/.n8n/mp.env"),
    os.path.expanduser("~/profit-pulse-alley/.env.production"),
]


def get_client_secret() -> str:
    out = subprocess.run(
        ["security", "find-generic-password", "-s", "gogcli", "-w"],
        capture_output=True,
        text=True,
        check=True,
    )
    return out.stdout.strip()


def exchange(code: str, client_id: str, client_secret: str) -> dict:
    body = urllib.parse.urlencode(
        {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        }
    ).encode()
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token", data=body, method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def main() -> int:
    creds = json.load(open(CLIENT_ID_PATH))
    client_id = creds["client_id"]
    client_secret = get_client_secret()

    state = secrets.token_urlsafe(16)
    captured = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):  # noqa: N802
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            if qs.get("state", [""])[0] != state:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"state mismatch")
                return
            captured["code"] = qs.get("code", [None])[0]
            captured["error"] = qs.get("error", [None])[0]
            self.send_response(200)
            self.end_headers()
            self.wfile.write(
                b"<html><body><h2>Authorization received. "
                b"You can close this tab.</h2></body></html>"
            )
            threading.Thread(target=self.server.shutdown, daemon=True).start()

        def log_message(self, *args):  # silence
            pass

    server = HTTPServer(("127.0.0.1", REDIRECT_PORT), Handler)
    params = {
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state,
    }
    url = "https://accounts.google.com/o/oauth2/auth?" + urllib.parse.urlencode(params)
    print("OPEN THIS URL AND ALLOW ACCESS:", flush=True)
    print(url, flush=True)
    webbrowser.open(url)

    server.timeout = 300
    server.handle_request()  # blocks until callback + shutdown
    if not captured.get("code"):
        print("NO CODE — error:", captured.get("error"), file=sys.stderr)
        return 1

    tokens = exchange(captured["code"], client_id, client_secret)
    refresh = tokens.get("refresh_token")
    if not refresh:
        print("NO REFRESH TOKEN in response — keys:", list(tokens.keys()), file=sys.stderr)
        return 1

    print("REFRESH_TOKEN=" + refresh, flush=True)
    for path in ENV_TARGETS:
        try:
            existing = open(path).read() if os.path.exists(path) else ""
            lines = [l for l in existing.splitlines() if not l.startswith("GOG_CALENDAR_REFRESH_TOKEN=")]
            lines.append("GOG_CALENDAR_REFRESH_TOKEN=" + refresh)
            open(path, "w").write("\n".join(lines) + "\n")
            print(f"written -> {path}", file=sys.stderr)
        except Exception as e:  # noqa: BLE001
            print(f"write failed {path}: {e}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
