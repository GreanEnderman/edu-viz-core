from typing import Any

from pydantic import BaseModel


class PluginEntry(BaseModel):
    js: str
    vector_db: str | None = None


class Capability(BaseModel):
    component_id: str
    name: str
    tags: list[str]
    props_schema: dict[str, Any]
    a2ui_hint: str
    expresses: list[str]
    educational_use: str
    cannot_express: list[str]


class PluginManifest(BaseModel):
    id: str
    version: str
    subject: str
    name: str
    keywords: list[str]
    entry: PluginEntry
    capabilities: list[Capability]
