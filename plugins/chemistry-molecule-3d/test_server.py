"""
Local test server for chemistry-molecule-3d plugin backend.

Usage:
  python test_server.py

Then open test.html in browser - it will call this server
for SMILES parsing instead of using hardcoded data.

Endpoints:
  POST /parse   -> { success, atoms, bonds, ... }
  POST /info    -> { success, formula, molecular_weight, ... }
  POST /validate -> { valid, smiles, type }
"""

import sys
import json
import asyncio
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

# Add parent to path so we can import the backend module
sys.path.insert(0, str(Path(__file__).parent))

from backend.service import invoke


class PluginHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self._send_json({"success": False, "error": "Invalid JSON"}, 400)
            return

        # Determine action from URL path
        path = self.path.strip('/')
        if path == 'parse':
            action = 'parse_structure'
        elif path == 'info':
            action = 'get_info'
        elif path == 'validate':
            action = 'validate'
        else:
            self._send_json({"success": False, "error": f"Unknown endpoint: {path}"}, 404)
            return

        result = asyncio.get_event_loop().run_until_complete(invoke(action, payload, {}))
        self._send_json(result, 200 if result.get('success') else 400)

    def do_GET(self):
        if self.path == '/' or self.path == '/health':
            self._send_json({
                "status": "ok",
                "service": "chemistry-molecule-3d plugin backend (test)",
                "xtb_available": False,
            })
        else:
            self._send_json({"error": "Not found"}, 404)

    def _send_json(self, data: dict, status: int = 200):
        response = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(response)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


if __name__ == '__main__':
    port = 8001
    server = HTTPServer(('localhost', port), PluginHandler)
    print(f"Plugin backend test server running at http://localhost:{port}")
    print("Endpoints: POST /parse, POST /info, POST /validate")
    print("Press Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()
