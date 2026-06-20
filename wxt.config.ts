import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@/src': fileURLToPath(new URL('./src', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }),
  manifest: ({ browser }) => ({
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    default_locale: 'en',
    permissions:
      browser === 'firefox'
        ? ['tabs', 'storage', 'bookmarks', 'tabGroups']
        : ['tabs', 'storage', 'bookmarks', 'favicon', 'tabGroups'],
    browser_specific_settings: {
      gecko: {
        id: '{dbd24df2-5a1f-499a-a667-7c1f875d23a1}',
        data_collection_permissions: {
          required: ['none'],
        },
      },
    },
  }),
});
