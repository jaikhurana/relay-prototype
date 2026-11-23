import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Avatars are optional files in public/avatars. We only reference the ones that exist,
// so a missing file never triggers a 404 (or a console error). Restart dev after adding one.
const avatarIds = ['jai', 'sam', 'priya'];
const presentAvatars = avatarIds.filter((id) =>
  existsSync(resolve(__dirname, 'public/avatars', `${id}.svg`)),
);

export default defineConfig({
  plugins: [react()],
  define: {
    __AVATARS__: JSON.stringify(presentAvatars),
  },
});
