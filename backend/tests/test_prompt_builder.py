import unittest

from backend.app.orchestrator.prompt_builder import build_system_prompt


class PromptBuilderTests(unittest.TestCase):
    def test_build_system_prompt_uses_host_platform_extension_language(self) -> None:
        prompt = build_system_prompt(
            plugin_capabilities=[
                {
                    'plugin_id': 'physics-high-school',
                    'component_id': 'PhysicsOscillator',
                    'name': 'Physics Oscillator',
                    'tags': ['physics'],
                    'props_schema': {
                        'amplitude': {'type': 'number', 'default': 1, 'min': 0, 'max': 10},
                    },
                    'a2ui_hint': 'Only pass initial properties.',
                    'expresses': ['wave motion'],
                    'educational_use': 'Explore oscillation parameters.',
                    'cannot_express': ['resonance'],
                    'shared_dependencies': ['react', '@a2ui/react'],
                    'runtime_model': 'host-platform-extension',
                }
            ]
        )

        normalized_prompt = prompt.lower()

        self.assertIn('host platform extensions', normalized_prompt)
        self.assertIn(
            'do not describe plugin components as if they own their own app shell',
            normalized_prompt,
        )
        self.assertIn('react', prompt)
        self.assertIn('@a2ui/react', prompt)
        self.assertIn('Only pass initial properties.', prompt)


if __name__ == '__main__':
    unittest.main()
