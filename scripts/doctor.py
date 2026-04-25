#!/usr/bin/env python3
"""
doctor.py — Diagnostic d'environnement local pour Proquiymsa ODT.

Vérifie que tout l'environnement requis est présent et fonctionnel
avant de lancer `pnpm dev`. Ne modifie rien.

Usage :
    pnpm doctor
    # ou directement :
    python3 scripts/doctor.py
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"


# --- helpers ---------------------------------------------------------------

GREEN = "\033[32m"
RED = "\033[31m"
YELLOW = "\033[33m"
BOLD = "\033[1m"
RESET = "\033[0m"


def ok(msg: str) -> None:
    print(f"{GREEN}✓{RESET} {msg}")


def warn(msg: str) -> None:
    print(f"{YELLOW}⚠{RESET} {msg}")


def fail(msg: str) -> None:
    print(f"{RED}✗{RESET} {msg}")


def section(title: str) -> None:
    print(f"\n{BOLD}{title}{RESET}")


def run(cmd: list[str], timeout: int = 5) -> tuple[int, str]:
    try:
        res = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout, check=False
        )
        return res.returncode, (res.stdout + res.stderr).strip()
    except FileNotFoundError:
        return 127, "command not found"
    except subprocess.TimeoutExpired:
        return 124, "timeout"


# --- checks ----------------------------------------------------------------


def check_no_shell_node_env() -> bool:
    """NODE_ENV exporté dans le shell casse `next build` (prerender <Html>)."""
    val = os.environ.get("NODE_ENV")
    if not val:
        ok("Aucun NODE_ENV exporté dans le shell")
        return True
    fail(
        f"NODE_ENV='{val}' est exporté dans ton shell. "
        f"Supprime la ligne `export NODE_ENV=...` de ~/.zshrc puis recharge."
    )
    return False


def check_node() -> bool:
    if shutil.which("node") is None:
        fail("Node n'est pas installé.")
        return False
    code, out = run(["node", "-v"])
    if code == 0:
        ok(f"Node {out}")
        return True
    fail(f"Node : {out}")
    return False


def check_pnpm() -> bool:
    if shutil.which("pnpm") is None:
        fail("pnpm n'est pas installé. → npm install -g pnpm")
        return False
    code, out = run(["pnpm", "-v"])
    if code == 0:
        ok(f"pnpm {out}")
        return True
    fail(f"pnpm : {out}")
    return False


def check_docker() -> bool:
    if shutil.which("docker") is None:
        fail("Docker n'est pas installé.")
        return False
    code, _ = run(["docker", "info"], timeout=10)
    if code != 0:
        fail("Docker daemon ne répond pas. → Lance Docker Desktop.")
        return False
    ok("Docker daemon OK")
    return True


def check_postgres_container() -> bool:
    code, out = run(
        ["docker", "ps", "--filter", "name=proquiymsa_odt_postgres", "--format", "{{.Status}}"]
    )
    if code != 0 or not out:
        fail("Container Postgres non démarré. → docker compose up -d")
        return False
    if "healthy" in out.lower() or "up" in out.lower():
        ok(f"Container Postgres : {out}")
        return True
    warn(f"Container Postgres : {out}")
    return False


def check_port_5432_only_docker() -> bool:
    code, out = run(["lsof", "-nP", "-iTCP:5432", "-sTCP:LISTEN"])
    if code != 0 or not out:
        warn("Personne n'écoute sur 5432. → docker compose up -d")
        return False
    listeners = [line for line in out.splitlines() if "LISTEN" in line]
    other = [
        line
        for line in listeners
        if "docker" not in line.lower() and "com.docke" not in line.lower()
    ]
    if other:
        fail(
            "Un autre Postgres écoute sur 5432 (conflit) :\n  "
            + "\n  ".join(other)
            + "\n  → brew services stop postgresql / postgresql@<n>"
        )
        return False
    ok("Port 5432 : seul Docker écoute")
    return True


def parse_env_file() -> dict[str, str]:
    if not ENV_FILE.exists():
        return {}
    out: dict[str, str] = {}
    for raw in ENV_FILE.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        out[key.strip()] = val.strip().strip('"').strip("'")
    return out


def check_env_file() -> bool:
    if not ENV_FILE.exists():
        fail(".env manquant. → cp .env.example .env")
        return False
    env = parse_env_file()
    missing: list[str] = []
    for key in ("DATABASE_URL", "AUTH_SECRET"):
        if not env.get(key):
            missing.append(key)
    if missing:
        fail(f".env : valeurs manquantes — {', '.join(missing)}")
        if "AUTH_SECRET" in missing:
            print(
                f"    → echo \"AUTH_SECRET=\\\"$(openssl rand -base64 32)\\\"\" >> .env"
            )
        return False
    ok(".env présent et complet (DATABASE_URL, AUTH_SECRET)")
    return True


def check_db_connection() -> bool:
    env = parse_env_file()
    url = env.get("DATABASE_URL")
    if not url:
        return False
    if shutil.which("psql") is None:
        warn("psql non installé — saut du test connexion. (brew install libpq)")
        return True
    code, out = run(["psql", url, "-tAc", "SELECT 1"], timeout=8)
    if code == 0 and "1" in out:
        ok(f"Connexion DB OK ({url})")
        return True
    fail(f"Connexion DB échoue : {out}")
    return False


def check_node_modules() -> bool:
    if not (ROOT / "node_modules").exists():
        warn("node_modules absent. → pnpm install")
        return False
    if not (ROOT / "node_modules" / ".prisma" / "client").exists() and not (
        ROOT / "node_modules" / "@prisma" / "client" / "default.d.ts"
    ).exists():
        warn("Prisma Client non généré. → pnpm prisma generate")
        return False
    ok("node_modules + Prisma Client présents")
    return True


# --- main ------------------------------------------------------------------


def main() -> int:
    section("Outils requis")
    results: list[bool] = [
        check_no_shell_node_env(),
        check_node(),
        check_pnpm(),
        check_docker(),
    ]

    section("Postgres local")
    results.append(check_port_5432_only_docker())
    results.append(check_postgres_container())

    section("Configuration projet")
    results.append(check_env_file())
    results.append(check_node_modules())

    section("Connexion à la base")
    results.append(check_db_connection())

    print()
    if all(results):
        print(f"{GREEN}{BOLD}Environnement OK — tu peux lancer pnpm dev.{RESET}")
        return 0
    failed = sum(1 for r in results if not r)
    print(f"{RED}{BOLD}{failed} check(s) en échec.{RESET}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
