import json
import logging
from pathlib import Path

from pydantic import ValidationError

from backend.app.models.plugin import PluginManifest

logger = logging.getLogger(__name__)


def load_plugins(plugins_dir: str) -> list[PluginManifest]:
    """Scan plugins_dir, parse each manifest.json, return valid plugins."""
    root = Path(plugins_dir)
    if not root.exists():
        logger.warning("PLUGINS_DIR '%s' does not exist, no plugins loaded", plugins_dir)
        return []

    plugins: list[PluginManifest] = []
    for subdir in sorted(root.iterdir()):
        if not subdir.is_dir():
            continue
        # skip template and hidden directories
        if subdir.name.startswith("_") or subdir.name.startswith("."):
            continue
        manifest_path = subdir / "manifest.json"
        if not manifest_path.exists():
            logger.warning("No manifest.json in '%s', skipping", subdir)
            continue
        try:
            data = json.loads(manifest_path.read_text(encoding="utf-8"))
            plugin = PluginManifest.model_validate(data)
            plugins.append(plugin)
            logger.info("Loaded plugin '%s' (%s)", plugin.id, plugin.name)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.warning("Invalid manifest in '%s', skipping: %s", subdir, e)

    return plugins
