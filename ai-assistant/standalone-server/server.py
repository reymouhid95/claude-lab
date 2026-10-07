#!/usr/bin/env python3
"""
Standalone Flask Server pour AI Assistant Production Vidéo
Utilise OpenAI Agents SDK + Gemini via LiteLLM
Intègre les presets shots adaptés aux étudiants Swiss Umef
"""

import os
import re
import json
import uuid
import base64
import binascii
import sqlite3
from pathlib import Path
from flask import Flask, request, jsonify, send_file

from agents import Agent, Runner, SQLiteSession, function_tool
from agents.extensions.models.litellm_provider import LitellmModel

# Notes personnelles lisibles par l'agent (Personal OS). SOUL.md reste hors périmètre :
# la voix de l'assistant est celle des instructions par niveau, pas celle du propriétaire.
VAULT_DIR = Path("/home/rey/claude-lab/personal-os/vault")

# === Presets étudiants intégrés (basés sur PromptLens Phase 1) ===

# Presets core (taille de plan, angle, focale, lumière, humeur)
# Inspirés des 20 presets de PromptLens, adaptés pour le contexte étudiant
CORE_STUDENT_PRESETS = [
    {
        "id": "presentation",
        "name": "Présentation",
        "shotSize": "Plan moyen",
        "cameraAngle": "Être",
        "focalLength": "35 mm",
        "lighting": "Lumière clé + remplissage",
        "mood": "Professionnel",
        "generationPrompt":
            "Une scène de présentation vidéo avec un sujet au centre du cadre, lumière clé principale et lumière de remplissage atténuée pour éviter les ombres dures, arrière-plan flou suggérant un environnement de travail ou académique. Idéal pour présenter un projet, un TP ou une idée de startup.",
    },
    {
        "id": "gros-plan-interview",
        "name": "Gros plan interview",
        "shotSize": "Très gros plan",
        "cameraAngle": "Face, hauteur des yeux",
        "focalLength": "85 mm",
        "lighting": "Lumière douce latérale, une source",
        "mood": "Interrogé",
        "generationPrompt":
            "Gros plan d'un visage face caméra, lumière douce venant d'un côté, arrière-plan flou, grain de pellicule léger. Parfait pour des interviews enregistrées, des témoignages d'étudiants ou des présentations de projets de fin d'études.",
    },
    {
        "id": "plan-large-environnement",
        "name": "Plan large environnement",
        "shotSize": "Plan large",
        "cameraAngle": "Face, hauteur poitrine",
        "focalLength": "24 mm",
        "lighting": "Lumière du jour, ombres marquées",
        "mood": "Espace",
        "generationPrompt":
            "Plan large d'un personnage dans un espace vaste (studio, laboratoire, amphi), lumière du jour traversant les fenêtres, ombres géométriques au sol. Utile pour montrer l'espace de travail, les installations de l'école ou le contexte d'apprentissage.",
    },
    {
        "id": "plan-travail",
        "name": "Plan de travail",
        "shotSize": "Plan taille",
        "cameraAngle": "Face, légèrement trois-quarts",
        "focalLength": "50 mm",
        "lighting": "Lumière naturelle diffuse",
        "mood": "Travail",
        "generationPrompt":
            "Plan taille d'un étudiant en train de travailler sur un ordinateur ou des notes, lumière de fenêtre diffuse, arrière-plan de bureau légèrement flou. Idéal pour les tutoriels, les démo de code ou les présentations de résultats de recherche.",
    },
    {
        "id": "shot-atelier",
        "name": "Shot atelier",
        "shotSize": "Plan taille",
        "cameraAngle": "Face, légèrement trois-quarts",
        "focalLength": "50 mm",
        "lighting": "Lumière d'atelier, sources multiples",
        "mood": "Travail",
        "generationPrompt":
            "Plan taille d'un étudiant en train de travailler sur un projet de production vidéo, lumière d'atelier avec plusieurs sources visibles, ambiance lumineuse dynamique. Parfait pour les démonstrations pratiques et les ateliers hands-on.",
    },
]

# Presets par niveau d'étude (personnalisés selon la filière)
LEVEL_PRESETS = {
    "master1": [
        {
            "id": "analyse-cyber",
            "name": "Analyse cybersécurité",
            "shotSize": "Plan moyen",
            "cameraAngle": "Face",
            "focalLength": "50 mm",
            "lighting": "Lumière plate, deux sources",
            "mood": "Analytique",
            "generationPrompt":
                "Plan média d'un étudiant présentant une analyse de vulnérabilité ou un rapport de sécurité informatique, lumière uniforme sans ombres marquées, arrière-plan épuré avec éventuellement un schéma de threat modeling visible. Idéal pour les présentations de mémoires ou de projets de recherche en cybersécurité.",
        },
        {
            "id": "script-recherche",
            "name": "Script recherche",
            "shotSize": "Plan moyen",
            "cameraAngle": "Trois-quarts",
            "focalLength": "35 mm",
            "lighting": "Lumière clé + retour",
            "mood": "Structuré",
            "generationPrompt":
                "Plan média d'un étudiant lisant ou présentant un script de recherche en cybersécurité, éclairage équilibrant permettant de lire des notes sur le côté, arrière-plan modéré. Utile pour les présentations de méthodologie ou de preuve de concept.",
        },
    ],
    "master2": [
        {
            "id": "threat-intel",
            "name": "Threat Intelligence",
            "shotSize": "Plan moyen",
            "cameraAngle": "Face, légèrement surélévée",
            "focalLength": "50 mm",
            "lighting": "Lumière dure latérale, ombres définies",
            "mood": "Expert",
            "generationPrompt":
                "Plan média d'un expert en cybersécurité présentant des résultats de Threat Intelligence, éclairage dramatique avec ombres marquées qui symbolisent le côté 'sombre' du cyberespace, arrière-plan avec icônes de vecteurs d'attaque subtiles. Pour les conférences, présentations de recherche avancée.",
        },
        {
            "id": "zero-trust",
            "name": "Zero-Trust Architecture",
            "shotSize": "Plan moyen",
            "cameraAngle": "Face",
            "focalLength": "35 mm",
            "lighting": "Lumière froide, setup technique",
            "mood": "Technique",
            "generationPrompt":
                "Plan média présentant l'architecture Zero-Trust en cybersécurité, éclairage froid/blanc typique des environnements techniques, arrière-plan avec schémas de réseau, zéro confiance visuelle. Idéal pour les présentations d'architectures de sécurité avancées.",
        },
    ],
    "licence": [
        {
            "id": "storyboard-plan",
            "name": "Plan storyboard",
            "shotSize": "Plan moyen",
            "cameraAngle": "Face",
            "focalLength": "35 mm",
            "lighting": "Lumière naturelle fenêtre",
            "mood": "Créatif",
            "generationPrompt":
                "Plan média d'un étudiant présentant un plan de storyboard pour un court métrage, éclairage naturel doux venant d'une fenêtre, arrière-plan avec des esquisses ou des images de référence collées. Utile pour les présentations de projets créatifs et de scénarios.",
        },
        {
            "id": "montage-preview",
            "name": "Aperçu montage",
            "shotSize": "Plan taille",
            "cameraAngle": "Face",
            "focalLength": "50 mm",
            "lighting": "Lumière de studio constante",
            "mood": "Production",
            "generationPrompt":
                "Plan média d'un étudiant montrant les résultats d'un montage vidéo, éclairage de studio constant sans ombres marquées, arrière-plan avec chronologie de montage visible sur écran. Pour les démo de projets vidéo finalisés.",
        },
    ],
    "alternance": [
        {
            "id": "studio-tournage",
            "name": "Studio tournage",
            "shotSize": "Plan moyen",
            "cameraAngle": "Multi-angle (16mm/35mm)",
            "focalLength": "24-50 mm",
            "lighting": "Trois points lumière + éclairage dynamique",
            "mood": "Production",
            "generationPrompt":
                "Plan média d'un plateau de tournage ATA SUARL avec matériel professionnel, éclairage complet setup trois points lumière, présence caméra et crew visible en arrière-plan. Idéal pour présenter des projets clients réels, des campagnes publicitaires ou des productions de studio.",
        },
        {
            "id": "montage-final",
            "name": "Montage final",
            "shotSize": "Plan montage",
            "cameraAngle": "Monteur vue",
            "focalLength": "35 mm",
            "lighting": "Lumière de monteur",
            "mood": "Post-production",
            "generationPrompt":
                "Plan média montrant un poste de montage vidéo avec logiciel d'édition ouvert, séquences vidéo en cours d'édition, couleur grading en cours, audio mixing visible. Pour présenter les résultats finis de projets de production ATA SUARL.",
        },
    ],
}

# Construction du dictionnaire complet des presets par niveau
ALL_PRESETS = {}
for level in ["master1", "master2", "licence", "alternance"]:
    ALL_PRESETS[level] = CORE_STUDENT_PRESETS + LEVEL_PRESETS.get(level, [])


# Fonctions utilitaires pour les presets
def get_presets_for_level(level):
    """Retourne tous les presets pour un niveau donné."""
    return ALL_PRESETS.get(level, ALL_PRESETS["master1"])


def find_preset_by_id(level, preset_id):
    """Trouve un preset par son ID pour un niveau donné."""
    presets = get_presets_for_level(level)
    for p in presets:
        if p["id"] == preset_id:
            return p
    return None


# === Configuration Gemini via LiteLLM ===
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("⚠️  Attention: GEMINI_API_KEY non définie dans l'environnement")

# Sessions SQLite persistantes par étudiant
sessions = {}


# Instructions par niveau étudiant
LEVEL_INSTRUCTIONS = {
    "master1":
        "Tu es un assistant IA pour un étudiant Master 1 IA & Cybersécurité de Swiss Umef. "
        "Aide en production vidéo et agents IA. Français, 3-6 lignes max, résultat d'abord, "
        "tutoiement. Référence ATA SUARL quand pertinent.",
    "master2":
        "Tu es un assistant IA pour un étudiant Master 2 Cybersécurité de Swiss Umef. "
        "Aide analyse, scripts automation, préparation carrière. Français, 3-6 lignes max, "
        "résultat d'abord, tutoiement.",
    "licence":
        "Tu es un assistant IA pour un étudiant Licence Multimédia de Swiss Umef. "
        "Aide production vidéo, presets shots, storyboard. Français, 3-6 lignes max, "
        "résultat d'abord, tutoiement.",
    "alternance":
        "Tu es un assistant IA pour un étudiant en alternance ATA SUARL. "
        "Formation studio, outils métier, production réelle. Français, 3-6 lignes max, "
        "résultat d'abord, tutoiement."
}


def get_session(student_id, student_level):
    """Récupère ou crée une session SQLite pour cet étudiant."""
    key = f"{student_id}-{student_level}"
    if key not in sessions:
        sessions[key] = SQLiteSession(key, "/home/rey/claude-lab/vault/agent_memory.db")
    return sessions[key]


@function_tool
def search_vault(query: str) -> str:
    """Cherche dans les notes personnelles (vault) : projets, activité ATA SUARL,
    journal d'opérations, profil. À utiliser quand la question porte sur un projet,
    une personne, une décision passée ou l'activité professionnelle. Retourne les
    extraits pertinents, ou une liste des sujets disponibles si rien ne correspond."""
    terms = [t for t in re.split(r"[^0-9a-zà-ÿ]+", query.lower()) if len(t) >= 3]
    if not terms:
        return "Requête trop vague. Reformule avec un nom de projet, de personne ou de sujet."

    hits = []
    for path in VAULT_DIR.rglob("*.md"):
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        low = text.lower()
        score = sum(low.count(t) for t in terms)
        if score == 0:
            continue
        snippets = []
        for para in (p.strip() for p in text.split("\n\n")):
            if len(para) > 20 and any(t in para.lower() for t in terms):
                snippets.append(para[:400])
                if len(snippets) >= 2:
                    break
        hits.append((score, path.relative_to(VAULT_DIR).as_posix(), snippets))

    if not hits:
        available = ", ".join(
            p.relative_to(VAULT_DIR).as_posix() for p in sorted(VAULT_DIR.rglob("*.md"))
        )
        return f"Aucune note pour « {query} ». Notes disponibles : {available}"

    hits.sort(key=lambda h: h[0], reverse=True)
    return "\n\n".join(
        f"[{rel}]\n" + "\n".join(snippets) for _, rel, snippets in hits[:3]
    )


def build_agent(student_level):
    """Construit un Agent avec les bonnes instructions pour le niveau."""
    instructions = (
        LEVEL_INSTRUCTIONS.get(student_level, LEVEL_INSTRUCTIONS["master1"])
        + " Tu peux consulter les notes personnelles avec search_vault : utilise-la pour "
        "répondre sur un projet, une personne ou l'activité passée, et cite la note utilisée. "
        "Hors de ces sujets, réponds directement sans l'appeler."
    )
    model = LitellmModel(model="gemini/gemini-flash-lite-latest")
    return Agent(
        name="Swiss Umef Assistant",
        instructions=instructions,
        model=model,
        tools=[search_vault],
    )


# === Initialisation de la base de données SQLite ===
def init_db():
    """Initialise les tables SQLite nécessaires."""
    conn = sqlite3.connect("/home/rey/claude-lab/vault/agent_memory.db")
    c = conn.cursor()
    c.execute(
        """CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            user_role TEXT,
            message_text TEXT,
            message_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"""
    )
    c.execute(
        """CREATE TABLE IF NOT EXISTS logged_shots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT,
            student_level TEXT,
            preset_id TEXT,
            description_json JSON,
            shot_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"""
    )
    # Journal upgrades: entries come from a preset, a text or an image, and
    # belong to a production.
    existing_columns = {row[1] for row in c.execute("PRAGMA table_info(logged_shots)")}
    for column, declaration in (
        ("source", "TEXT DEFAULT 'preset'"),
        ("production", "TEXT"),
        ("frame_id", "TEXT"),
    ):
        if column not in existing_columns:
            c.execute(f"ALTER TABLE logged_shots ADD COLUMN {column} {declaration}")
    conn.commit()
    conn.close()


init_db()


# === Configuration Flask ===
app = Flask(__name__)


# === Endpoints API ===

@app.route("/api/chat", methods=["POST"])
def chat():
    """Endpoint principal: reçoit un message et retourne la réponse de l'agent."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON corporel manquant"}), 400

        message = data.get("message", "")
        student_level = data.get("student_level", "master1")
        student_id = data.get("student_id", "demo-student")

        if not message:
            return jsonify({"error": "Champ 'message' requis"}), 400

        # Obtenir/sélectionner la session
        session = get_session(student_id, student_level)

        # Construire l'agent
        agent = build_agent(student_level)

        # Exécuter l'agent avec la mémoire de session
        import asyncio

        try:
            asyncio.get_running_loop()
            result = Runner.run(agent, message, session=session)
            response_text = result.final_output
        except RuntimeError:
            result = Runner.run_sync(agent, message, session=session)
            response_text = result.final_output

        # Sauvegarder l'interaction en DB SQLite
        try:
            conn = sqlite3.connect("/home/rey/claude-lab/vault/agent_memory.db")
            c = conn.cursor()
            c.execute(
                "INSERT INTO conversations (session_id, user_role, message_text, message_type) VALUES (?, ?, ?, ?)",
                (f"{student_id}-{student_level}", "user", message, "question"),
            )
            c.execute(
                "INSERT INTO conversations (session_id, user_role, message_text, message_type) VALUES (?, ?, ?, ?)",
                (f"{student_id}-{student_level}", "assistant", response_text, "response"),
            )
            conn.commit()
            conn.close()
        except Exception as db_err:
            print(f"⚠️ Erreur sauvegarde DB: {db_err}")

        return jsonify(
            {
                "response": response_text,
                "session_id": f"{student_id}-{student_level}",
                "student_level": student_level,
                "success": True,
            }
        )

    except Exception as e:
        print(f"❌ Erreur endpoint /api/chat: {e}")
        import traceback
        traceback.print_exc()
        return jsonify(
            {
                "error": "Erreur interne du serveur",
                "details": str(e),
                "success": False,
            }
        ), 500


@app.route("/api/levels", methods=["GET"])
def get_levels():
    """Retourne la liste des niveaux étudiants disponibles."""
    return jsonify(
        {
            "levels": list(LEVEL_INSTRUCTIONS.keys()),
            "descriptions": {
                "master1": "Master 1 IA & Cybersécurité",
                "master2": "Master 2 Cybersécurité",
                "licence": "Licence Multimédia",
                "alternance": "Alternance ATA SUARL",
            },
        }
    )


@app.route("/api/health", methods=["GET"])
def health():
    """Vérification de santé du serveur."""
    return jsonify(
        {
            "status": "ok",
            "gemini_key_present": bool(os.environ.get("GEMINI_API_KEY")),
            "active_sessions": len(sessions),
        }
    )


@app.route("/api/presets", methods=["GET"])
def get_presets():
    """Retourne les presets de shots pour un niveau étudiant."""
    level = request.args.get("level", "master1")
    presets = get_presets_for_level(level)
    return jsonify({"level": level, "presets": presets, "count": len(presets)})


@app.route("/api/preset/<preset_id>", methods=["GET"])
def get_preset(preset_id):
    """Retourne un preset spécifique par son ID."""
    level = request.args.get("level", "master1")
    preset = find_preset_by_id(level, preset_id)
    if preset:
        return jsonify(
            {
                "id": preset["id"],
                "name": preset["name"],
                "shotSize": preset["shotSize"],
                "cameraAngle": preset["cameraAngle"],
                "focalLength": preset["focalLength"],
                "lighting": preset["lighting"],
                "mood": preset["mood"],
                "generationPrompt": preset["generationPrompt"],
            }
        )
    else:
        return jsonify({"error": "Préset non trouvé"}), 404


@app.route("/api/log-shot", methods=["POST"])
def log_shot():
    """Enregistre un shot loggé en SQLite."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON corporel manquant"}), 400

        student_id = data.get("student_id", "demo-student")
        student_level = data.get("student_level", "master1")
        preset_id = data.get("preset_id")
        description = data.get("description", {})
        source = data.get("source", "preset")
        production = data.get("production")
        frame_id = data.get("frame_id")
        if source not in ("preset", "text", "image"):
            source = "preset"

        session_key = f"{student_id}-{student_level}"

        conn = sqlite3.connect("/home/rey/claude-lab/vault/agent_memory.db")
        c = conn.cursor()

        c.execute(
            """CREATE TABLE IF NOT EXISTS logged_shots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT,
                student_level TEXT,
                preset_id TEXT,
                description_json JSON,
                shot_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )"""
        )

        c.execute(
            "INSERT INTO logged_shots (student_id, student_level, preset_id, description_json, source, production, frame_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                student_id,
                student_level,
                preset_id,
                json.dumps(description) if description else None,
                source,
                production,
                frame_id,
            ),
        )
        conn.commit()
        conn.close()

        return jsonify(
            {"success": True, "message": "Shot loggé avec succès", "shot_id": c.lastrowid}
        )
    except Exception as e:
        print(f"⚠️ Erreur log-shot: {e}")
        return jsonify({"error": str(e), "success": False}), 500


@app.route("/api/journal", methods=["GET"])
def journal():
    """Journal des plans de l'étudiant, du plus récent au plus ancien."""
    try:
        student_id = request.args.get("student_id", "demo-student")
        level = request.args.get("level")
        production = request.args.get("production")
        try:
            limit = max(1, min(int(request.args.get("limit", "50")), 200))
        except ValueError:
            limit = 50

        conn = sqlite3.connect("/home/rey/claude-lab/vault/agent_memory.db")
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        sql = (
            "SELECT id, student_level, preset_id, description_json, source, production, "
            "frame_id, shot_timestamp FROM logged_shots WHERE student_id = ?"
        )
        params = [student_id]
        if level:
            sql += " AND student_level = ?"
            params.append(level)
        if production:
            sql += " AND production = ?"
            params.append(production)
        sql += " ORDER BY id DESC LIMIT ?"
        params.append(limit)
        rows = [dict(row) for row in c.execute(sql, params)]
        conn.close()

        for row in rows:
            raw = row.pop("description_json", None)
            try:
                row["description"] = json.loads(raw) if raw else None
            except (TypeError, json.JSONDecodeError):
                row["description"] = None

        return jsonify({"count": len(rows), "entries": rows})
    except Exception as e:
        print(f"⚠️ Erreur journal: {e}")
        return jsonify({"error": str(e), "entries": []}), 500


# === Analyse de plan (contrat repris de PromptLens : SYSTEM_PROMPT + schéma) ===
SHOT_SYSTEM_PROMPT = (
    "You are a cinematography reference analyst for AI video productions. "
    "From the user's shot description or reference image, produce a JSON object with: "
    "shotSize (e.g. gros plan, plan large), cameraAngle, focalLengthMm (a plausible "
    "lens in millimetres), lighting (setup and quality), palette (3 to 6 dominant "
    "hex colors as #RRGGBB), mood, generationPrompt (a self-contained English "
    "prompt that recreates the shot), confidence (0 to 1). "
    "Answer with JSON only, matching the requested schema exactly."
)

HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


def looks_like_description(value):
    """Narrow Gemini's answer at the API boundary before trusting it."""
    if not isinstance(value, dict):
        return False
    palette = value.get("palette")
    return (
        isinstance(value.get("shotSize"), str)
        and isinstance(value.get("cameraAngle"), str)
        and isinstance(value.get("focalLengthMm"), (int, float))
        and not isinstance(value.get("focalLengthMm"), bool)
        and isinstance(value.get("lighting"), str)
        and isinstance(palette, list)
        and 1 <= len(palette) <= 8
        and all(isinstance(c, str) and HEX_COLOR.match(c) for c in palette)
        and isinstance(value.get("mood"), str)
        and isinstance(value.get("generationPrompt"), str)
        and len(value.get("generationPrompt", "")) >= 10
        and isinstance(value.get("confidence"), (int, float))
        and 0 <= value.get("confidence", -1) <= 1
    )


def describe_shot(user_content):
    """Appelle Gemini et renvoie une ShotDescription validée, ou lève ValueError."""
    import litellm

    response = litellm.completion(
        model="gemini/gemini-flash-lite-latest",
        messages=[
            {"role": "system", "content": SHOT_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content or ""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError("Le modèle n'a pas renvoyé de JSON.") from exc
    if not looks_like_description(data):
        raise ValueError("La fiche renvoyée est incomplète. Reformule ou réessaie.")
    return data


FRAMES_DIR = Path("/home/rey/claude-lab/ai-assistant/standalone-server/frames")
MAX_IMAGE_BYTES = 4 * 1024 * 1024


@app.route("/api/analyze-text", methods=["POST"])
def analyze_text():
    """Décrire une prise en texte → fiche de plan exploitable."""
    try:
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        if not text:
            return jsonify({"error": "Texte requis."}), 400
        if len(text) > 2000:
            return jsonify({"error": "2000 caractères maximum."}), 400
        description = describe_shot(f"Analyze this shot description: {text}")
        return jsonify({"success": True, "description": description})
    except ValueError as e:
        return jsonify({"error": str(e), "success": False}), 502
    except Exception as e:
        print(f"⚠️ Erreur analyze-text: {e}")
        return jsonify({"error": "Analyse indisponible pour le moment.", "success": False}), 502


@app.route("/api/analyze-image", methods=["POST"])
def analyze_image():
    """Image de référence → fiche de plan + frame stockée localement."""
    try:
        data = request.get_json(silent=True) or {}
        image_b64 = data.get("imageBase64") or ""
        mime_type = data.get("mimeType") or ""
        if not image_b64:
            return jsonify({"error": "Image requise."}), 400
        if mime_type not in ("image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"):
            return jsonify({"error": "Format non supporté."}), 400

        padded = image_b64 + "=" * (-len(image_b64) % 4)
        try:
            # validate=True: without it b64decode silently drops invalid chars
            # and an empty payload would reach the model.
            content = base64.b64decode(padded, validate=True)
        except (ValueError, binascii.Error):
            return jsonify({"error": "Base64 invalide."}), 400
        if not content:
            return jsonify({"error": "Image vide."}), 400
        if len(content) > MAX_IMAGE_BYTES:
            return jsonify({"error": "Image trop volumineuse : 4 Mo maximum."}), 413

        description = describe_shot(
            [
                {"type": "text", "text": "Analyze the shot shown in this reference image."},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime_type};base64,{image_b64}"},
                },
            ]
        )

        frame_id = f"{uuid.uuid4().hex}.{mime_type.split('/')[1]}"
        FRAMES_DIR.mkdir(parents=True, exist_ok=True)
        (FRAMES_DIR / frame_id).write_bytes(content)

        return jsonify({"success": True, "description": description, "frameId": frame_id})
    except ValueError as e:
        return jsonify({"error": str(e), "success": False}), 502
    except Exception as e:
        print(f"⚠️ Erreur analyze-image: {e}")
        return jsonify({"error": "Analyse indisponible pour le moment.", "success": False}), 502


@app.route("/api/frames/<frame_id>", methods=["GET"])
def get_frame(frame_id):
    """Sert une frame enregistrée (pas de traversée de répertoire)."""
    if not re.fullmatch(r"[0-9a-f]{32}\.[a-z0-9]+", frame_id):
        return jsonify({"error": "Identifiant invalide."}), 400
    path = FRAMES_DIR / frame_id
    if not path.is_file():
        return jsonify({"error": "Frame introuvable."}), 404
    mime = "image/" + frame_id.rsplit(".", 1)[1]
    return send_file(path, mimetype=mime, max_age=86400)


# Point d'entrée
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"🚀 Démarrage serveur standalone sur http://localhost:{port}")
    print(f"🔑 GEMINI_API_KEY: {'présente' if os.environ.get('GEMINI_API_KEY') else 'Absente'}")
    print(f"📚 Niveaux supportés: {list(LEVEL_INSTRUCTIONS.keys())}")
    print(f"🎯 Presets par niveau: { {k: len(v) for k, v in ALL_PRESETS.items()} }")
    app.run(host="0.0.0.0", port=port, debug=False)