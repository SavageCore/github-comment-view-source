import { defineConfig, PluginOption } from 'vite';
import monkey, { cdn } from 'vite-plugin-monkey';
import { version } from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://savagecore.uk/img/userscript_icon.png',
        namespace: 'savagecore.uk',
        match: [
          'https://github.com/*/*/issues/*',
          'https://github.com/*/*/pull/*',
        ],
        "run-at": "document-idle",
        version,
        license: 'Unlicense',
        author: 'SavageCore',
        description: 'A template for userscripts',
        updateURL: 'https://github.com/SavageCore/github-comment-view-source/releases/latest/download/github-comment-view-source.meta.js',
        downloadURL: 'https://github.com/SavageCore/github-comment-view-source/releases/latest/download/github-comment-view-source.user.js',
        supportURL: 'https://github.com/SavageCore/github-comment-view-source/issues',
        homepageURL: 'https://github.com/SavageCore/github-comment-view-source',
        grant: ['GM.setValue', 'GM.getValue'],
      },
      build: {
        externalGlobals: {
          // jszip: cdn.unpkg('JSZip', 'dist/jszip.min.js'),
        },
        metaFileName: true,
      },
    }),
  ],
});
