"""Test plugin backend for invoke functionality."""


async def invoke(action: str, payload: dict, context: dict) -> dict:
    """Simple test invoke function."""
    if action == "echo":
        return {
            "success": True,
            "message": "Echo test",
            "payload": payload,
            "context": context,
        }

    if action == "add":
        a = payload.get("a", 0)
        b = payload.get("b", 0)
        return {
            "success": True,
            "result": a + b,
        }

    return {
        "success": False,
        "error": f"Unknown action: {action}",
    }
