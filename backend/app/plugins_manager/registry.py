from typing import Any

from backend.app.models.plugin import PluginManifest


class PluginRegistry:
    _instance: "PluginRegistry | None" = None

    def __init__(self) -> None:
        self._plugins: dict[str, PluginManifest] = {}

    @classmethod
    def get_instance(cls) -> "PluginRegistry":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load_all(self, plugins: list[PluginManifest]) -> None:
        self._plugins = {p.id: p for p in plugins}

    def get_all_plugins(self) -> list[PluginManifest]:
        return list(self._plugins.values())

    def get_plugin(self, plugin_id: str) -> PluginManifest | None:
        return self._plugins.get(plugin_id)

    def get_enabled_capabilities(self, enabled_plugin_ids: list[str]) -> list[dict[str, Any]]:
        capabilities: list[dict[str, Any]] = []
        for plugin_id in enabled_plugin_ids:
            plugin = self._plugins.get(plugin_id)
            if plugin is None:
                continue
            for cap in plugin.capabilities:
                capabilities.append({
                    "plugin_id": plugin.id,
                    "component_id": cap.component_id,
                    "name": cap.name,
                    "tags": cap.tags,
                    "props_schema": cap.props_schema,
                    "a2ui_hint": cap.a2ui_hint,
                    "expresses": cap.expresses,
                    "educational_use": cap.educational_use,
                    "cannot_express": cap.cannot_express,
                    "shared_dependencies": plugin.sharedDependencies,
                    "runtime_model": "host-platform-extension",
                })
        return capabilities
