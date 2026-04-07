import json

# A2UI v0.8 message types are top-level keys, not a "type" field
A2UI_MESSAGE_KEYS = {"surfaceUpdate", "dataModelUpdate", "beginRendering", "deleteSurface"}


def surface_update(surface_id: str, components: list[dict]) -> dict:
    """Build a surfaceUpdate message (A2UI v0.8 format)."""
    return {"surfaceUpdate": {"surfaceId": surface_id, "components": components}}


def data_model_update(surface_id: str, contents: list[dict]) -> dict:
    """Build a dataModelUpdate message (A2UI v0.8 format).

    contents is a list of {key, valueString|valueNumber|valueBoolean} dicts.
    """
    return {"dataModelUpdate": {"surfaceId": surface_id, "contents": contents}}


def begin_rendering(surface_id: str, root: str) -> dict:
    """Build a beginRendering message (A2UI v0.8 format).

    root is the component ID to use as the root of the render tree.
    """
    return {"beginRendering": {"surfaceId": surface_id, "root": root}}


def to_sse_event(msg: dict) -> str:
    """Wrap an A2UI message as an SSE event for the frontend."""
    line = json.dumps(msg, ensure_ascii=False, separators=(",", ":"))
    payload = json.dumps({"type": "a2ui", "line": line}, ensure_ascii=False)
    return f"data: {payload}\n\n"


def is_a2ui_line(text: str) -> bool:
    """Return True if text is a JSON object with an A2UI v0.8 top-level key."""
    stripped = text.strip()
    if not stripped.startswith("{"):
        return False
    try:
        obj = json.loads(stripped)
        if not isinstance(obj, dict):
            return False
        # A2UI v0.8: message type is a top-level key, not a "type" field
        return any(key in A2UI_MESSAGE_KEYS for key in obj)
    except (json.JSONDecodeError, ValueError):
        return False


def parse_a2ui_line(text: str) -> dict:
    """Parse a raw A2UI JSON line (already in v0.8 format)."""
    return json.loads(text.strip())
