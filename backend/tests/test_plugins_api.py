import importlib
import unittest
from pathlib import Path

from backend.app.core.config import settings
from backend.app.db import close_db, init_db
from backend.app.plugins_manager.loader import load_plugins
from backend.app.plugins_manager.registry import PluginRegistry
from backend.app.routers.plugins import list_plugins, toggle_plugin


class PluginApiTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self._original_database_path = settings.DATABASE_PATH
        self._original_plugins_dir = settings.PLUGINS_DIR

        plugins_dir = Path(settings.PLUGINS_DIR)
        if not plugins_dir.is_absolute():
            plugins_dir = Path.cwd() / plugins_dir
        self.plugins_dir = plugins_dir

        settings.DATABASE_PATH = ':memory:'
        settings.PLUGINS_DIR = str(self.plugins_dir)

        await close_db()
        PluginRegistry.get_instance().load_all(load_plugins(str(self.plugins_dir)))

    async def asyncTearDown(self) -> None:
        await close_db()
        settings.DATABASE_PATH = self._original_database_path
        settings.PLUGINS_DIR = self._original_plugins_dir
        PluginRegistry.get_instance().load_all([])

    async def test_plugins_api_includes_shared_dependencies_and_enabled_state(self) -> None:
        await init_db()

        toggle_response = await toggle_plugin('physics-high-school')
        self.assertEqual(
            toggle_response.model_dump(),
            {
                'plugin_id': 'physics-high-school',
                'enabled': True,
            },
        )

        payload = await list_plugins()
        physics_plugin = next(item for item in payload if item.id == 'physics-high-school')

        self.assertTrue(physics_plugin.enabled)
        self.assertEqual(physics_plugin.entry.js, 'dist/index.esm.js')
        self.assertEqual(
            physics_plugin.sharedDependencies,
            ['react', 'react-dom', '@a2ui/react'],
        )

    async def test_plugin_static_bundle_mount_and_file_exist(self) -> None:
        import backend.app.main as main_module

        app = importlib.reload(main_module).app
        plugin_mount = next(route for route in app.routes if getattr(route, 'path', None) == '/plugins')

        self.assertEqual(plugin_mount.path, '/plugins')

        bundle_path = self.plugins_dir / 'physics-high-school' / 'dist' / 'index.esm.js'
        self.assertTrue(bundle_path.exists())
        self.assertIn('from "react"', bundle_path.read_text(encoding='utf-8'))


if __name__ == '__main__':
    unittest.main()
