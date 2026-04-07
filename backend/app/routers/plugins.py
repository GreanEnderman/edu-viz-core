from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

from backend.app.db import get_db
from backend.app.plugins_manager.registry import PluginRegistry

router = APIRouter()

# 当前系统为单用户，使用固定 user_id
_DEFAULT_USER = "default"


class PluginCapabilitySummary(BaseModel):
    component_id: str
    name: str
    tags: list[str]
    props_schema: dict[str, Any] | None = None


class PluginEntryInfo(BaseModel):
    js: str | None = None


class PluginListItem(BaseModel):
    id: str
    name: str
    version: str
    subject: str
    keywords: list[str]
    entry: PluginEntryInfo
    capabilities: list[PluginCapabilitySummary]
    enabled: bool


class ToggleResponse(BaseModel):
    plugin_id: str
    enabled: bool


async def _get_user_enabled_ids(user_id: str) -> set[str]:
    db = get_db()
    rows = await db.execute_fetchall(
        "SELECT plugin_id FROM plugin_user_settings WHERE user_id = ? AND enabled = 1",
        (user_id,),
    )
    return {dict(row)["plugin_id"] for row in rows}


@router.get("/plugins", response_model=list[PluginListItem])
async def list_plugins() -> list[PluginListItem]:
    registry = PluginRegistry.get_instance()
    enabled_ids = await _get_user_enabled_ids(_DEFAULT_USER)
    result = []
    for plugin in registry.get_all_plugins():
        result.append(PluginListItem(
            id=plugin.id,
            name=plugin.name,
            version=plugin.version,
            subject=plugin.subject,
            keywords=plugin.keywords,
            entry=PluginEntryInfo(js=plugin.entry.js),
            capabilities=[
                PluginCapabilitySummary(
                    component_id=cap.component_id,
                    name=cap.name,
                    tags=cap.tags,
                    props_schema=cap.props_schema,
                )
                for cap in plugin.capabilities
            ],
            enabled=plugin.id in enabled_ids,
        ))
    return result


@router.post("/plugins/{plugin_id}/toggle", response_model=ToggleResponse)
async def toggle_plugin(plugin_id: str) -> ToggleResponse:
    registry = PluginRegistry.get_instance()
    if registry.get_plugin(plugin_id) is None:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_id}' not found")

    db = get_db()
    rows = await db.execute_fetchall(
        "SELECT enabled FROM plugin_user_settings WHERE user_id = ? AND plugin_id = ?",
        (_DEFAULT_USER, plugin_id),
    )
    current = bool(dict(rows[0])["enabled"]) if rows else False
    new_enabled = not current

    await db.execute(
        """INSERT INTO plugin_user_settings (user_id, plugin_id, enabled)
           VALUES (?, ?, ?)
           ON CONFLICT(user_id, plugin_id) DO UPDATE SET enabled = excluded.enabled""",
        (_DEFAULT_USER, plugin_id, 1 if new_enabled else 0),
    )
    await db.commit()
    return ToggleResponse(plugin_id=plugin_id, enabled=new_enabled)
