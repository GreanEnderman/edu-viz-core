from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
import importlib
import importlib.util
import sys
from pathlib import Path

from backend.app.db import get_db
from backend.app.plugins_manager.registry import PluginRegistry

router = APIRouter()

# 当前系统为单用户，使用固定 user_id
_DEFAULT_USER = "default"

# 插件模块缓存
_PLUGIN_MODULE_CACHE: dict[str, Any] = {}


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
    sharedDependencies: list[str]
    capabilities: list[PluginCapabilitySummary]
    enabled: bool


class ToggleResponse(BaseModel):
    plugin_id: str
    enabled: bool


class InvokeRequest(BaseModel):
    action: str
    payload: dict[str, Any]


class InvokeResponse(BaseModel):
    success: bool
    data: dict[str, Any] | None = None
    error: str | None = None


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
            sharedDependencies=plugin.sharedDependencies,
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


def _load_plugin_module(python_module: str, plugin_id: str) -> Any:
    """
    动态加载插件 Python 模块，带缓存机制。

    支持带连字符的插件目录名（如 chemistry-molecule-3d）。

    Args:
        python_module: 模块路径，如 "plugins.chemistry_molecule_3d.backend"
        plugin_id: 插件 ID，用于定位实际目录

    Returns:
        加载的模块对象

    Raises:
        ImportError: 模块加载失败
    """
    if python_module in _PLUGIN_MODULE_CACHE:
        return _PLUGIN_MODULE_CACHE[python_module]

    try:
        # 首先尝试标准导入（适用于目录名不含连字符的情况）
        module = importlib.import_module(python_module)
        _PLUGIN_MODULE_CACHE[python_module] = module
        return module
    except ImportError:
        # 如果标准导入失败，尝试从文件路径直接加载
        # 这样可以支持带连字符的目录名
        try:
            # 将模块路径转换为文件路径
            # 例如: plugins.chemistry_molecule_3d.backend -> plugins/chemistry-molecule-3d/backend/__init__.py
            # 例如: plugins.chemistry_molecule_3d.backend.service -> plugins/chemistry-molecule-3d/backend/service.py
            parts = python_module.split(".")
            if len(parts) < 2 or parts[0] != "plugins":
                raise ImportError(f"Invalid plugin module path: {python_module}")

            # 使用 plugin_id 作为实际目录名（第一部分）
            # 剩余部分构建子路径
            project_root = Path(__file__).parent.parent.parent.parent

            # parts[1] 是插件名（可能带下划线），用 plugin_id 替换（可能带连字符）
            # parts[2:] 是子模块路径，如 ["backend"] 或 ["backend", "service"]
            submodule_parts = parts[2:]

            if not submodule_parts:
                raise ImportError(f"Invalid plugin module path: {python_module}")

            # 构建文件路径
            # 如果是包（最后一部分是目录），加载 __init__.py
            # 如果是模块（最后一部分是文件），加载 .py 文件
            module_dir = project_root / "plugins" / plugin_id
            for part in submodule_parts[:-1]:
                module_dir = module_dir / part

            # 尝试两种可能：包（__init__.py）或模块（.py）
            last_part = submodule_parts[-1]
            module_path_pkg = module_dir / last_part / "__init__.py"
            module_path_mod = module_dir / f"{last_part}.py"

            if module_path_pkg.exists():
                module_path = module_path_pkg
            elif module_path_mod.exists():
                module_path = module_path_mod
            else:
                raise ImportError(
                    f"Plugin module file not found: tried {module_path_pkg} and {module_path_mod}"
                )

            # 使用 importlib.util 从文件路径加载模块
            spec = importlib.util.spec_from_file_location(python_module, module_path)
            if spec is None or spec.loader is None:
                raise ImportError(f"Failed to create module spec for {python_module}")

            module = importlib.util.module_from_spec(spec)
            sys.modules[python_module] = module
            spec.loader.exec_module(module)

            _PLUGIN_MODULE_CACHE[python_module] = module
            return module

        except Exception as e:
            raise ImportError(f"Failed to load plugin module '{python_module}': {e}")


@router.post("/plugins/{plugin_id}/invoke", response_model=InvokeResponse)
async def invoke_plugin(plugin_id: str, request: InvokeRequest) -> InvokeResponse:
    """
    统一插件后端调用入口。

    根据 plugin_id 查找插件的 python_module，动态导入并调用其 invoke 函数。

    Args:
        plugin_id: 插件 ID
        request: 包含 action 和 payload 的请求体

    Returns:
        插件后端返回的结果
    """
    # 1. 查找插件
    registry = PluginRegistry.get_instance()
    plugin = registry.get_plugin(plugin_id)

    if plugin is None:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_id}' not found")

    # 2. 检查插件是否有后端模块
    if plugin.entry.python_module is None:
        raise HTTPException(
            status_code=400,
            detail=f"Plugin '{plugin_id}' does not have a backend module"
        )

    # 3. 动态加载模块
    try:
        module = _load_plugin_module(plugin.entry.python_module, plugin_id)
    except ImportError as e:
        import traceback
        error_detail = f"Import error: {str(e)}\n{traceback.format_exc()}"
        print(f"[Plugin Invoke Error] {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

    # 4. 检查模块是否有 invoke 函数
    if not hasattr(module, "invoke"):
        raise HTTPException(
            status_code=500,
            detail=f"Plugin module '{plugin.entry.python_module}' does not have an 'invoke' function"
        )

    # 5. 调用插件后端
    try:
        # 构建 context（可以包含用户信息、会话信息等）
        context = {
            "plugin_id": plugin_id,
            "user_id": _DEFAULT_USER,
        }

        # 调用插件的 invoke 函数
        result = await module.invoke(request.action, request.payload, context)

        # 检查返回结果格式
        if not isinstance(result, dict):
            raise HTTPException(
                status_code=500,
                detail=f"Plugin '{plugin_id}' returned invalid result type: {type(result)}"
            )

        # 如果插件返回包含 success 字段
        if "success" in result:
            if result.get("success"):
                # 成功时，提取除 success 外的其他字段作为 data
                data = {k: v for k, v in result.items() if k != "success"}
                return InvokeResponse(
                    success=True,
                    data=data if data else None,
                    error=None
                )
            else:
                # 失败时，返回错误信息
                return InvokeResponse(
                    success=False,
                    data=None,
                    error=result.get("error", "Unknown error")
                )

        # 否则认为调用成功，将整个结果作为 data
        return InvokeResponse(success=True, data=result)

    except Exception as e:
        # 捕获插件执行过程中的异常
        import traceback
        error_detail = f"Plugin execution error: {str(e)}\n{traceback.format_exc()}"
        print(f"[Plugin Invoke Error] {error_detail}")
        return InvokeResponse(
            success=False,
            error=error_detail
        )
