import subprocess
import os

try:
    subprocess.run(["git", "add", "src/CustomCursor.jsx", "src/ActivityFeed.jsx"], check=True)
    subprocess.run(["git", "commit", "-m", "🌌 Curator: Add Cursor Telemetry HUD + Reactive ActivityFeed\n\nFeature: Added a real-time cursor coordinate HUD and made the ActivityFeed react to user interactions.\nVisuals: A small, styling numeric tracking HUD follows the cursor. System logs use a distinct accent color for actual user-triggered search/sort actions.\nCode: Modified CustomCursor to include a telemetryRef animated with requestAnimationFrame. Hooked ActivityFeed up to appContext.userActivityLogs."], check=True)
except Exception as e:
    print(e)
