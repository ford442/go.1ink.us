// Single Node test entrypoint so CI reports individual cases rather than one
// subprocess result per test file.
import './test-audio-notes.mjs';
import './test-command-registry.mjs';
import './test-ground-station.mjs';
import './test-loadout-codec.mjs';
import './test-loadout-share.mjs';
import './test-performance-mode.mjs';
import './test-project-browser.mjs';
import './test-terminal-parser.mjs';
import './test-transmissions.mjs';
import './test-visual-worker-protocol.mjs';
