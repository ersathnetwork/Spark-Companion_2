// Helper to push project files to GitHub and trigger the Capacitor Android APK build for Coucou Dynamic Island

export interface PushProgressCallback {
  (step: string, percentage: number): void;
}

export interface PushOptions {
  token: string;
  repoName: string; // e.g. "Coucou-Android" or "user/Coucou-Android"
  isPrivate?: boolean;
  onProgress?: PushProgressCallback;
}

export async function pushProjectToGitHub(options: PushOptions): Promise<{ repoUrl: string; actionsUrl: string }> {
  const { token, repoName, isPrivate = false, onProgress = () => {} } = options;
  const cleanToken = token.trim();

  if (!cleanToken) {
    throw new Error('GitHub Personal Access Token is required.');
  }

  const headers = {
    Authorization: `Bearer ${cleanToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  onProgress('Authenticating with GitHub...', 10);

  // 1. Get authenticated user
  const userRes = await fetch('https://api.github.com/user', { headers });
  if (!userRes.ok) {
    const err = await userRes.json().catch(() => ({}));
    throw new Error(`GitHub Authentication failed: ${err.message || userRes.statusText}. Ensure token has 'repo' permissions.`);
  }
  const userData = await userRes.json();
  const username = userData.login;

  let owner = username;
  let repo = repoName.trim();
  if (repo.includes('/')) {
    const parts = repo.split('/');
    owner = parts[0];
    repo = parts[1];
  }

  onProgress(`Checking repository ${owner}/${repo}...`, 25);

  // 2. Check if repo exists, create if not
  let repoData: any = null;
  const repoCheckRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (repoCheckRes.ok) {
    repoData = await repoCheckRes.json();
  } else if (repoCheckRes.status === 404) {
    onProgress(`Creating repository ${repo}...`, 35);
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: repo,
        description: 'Coucou Android: Notch Dynamic Island companion for AI coding agents with Fingerprint approvals',
        private: isPrivate,
        auto_init: true,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(`Failed to create repository: ${err.message || createRes.statusText}`);
    }
    repoData = await createRes.json();
    await new Promise((r) => setTimeout(r, 1500));
  } else {
    throw new Error(`Failed to access repository: ${repoCheckRes.statusText}`);
  }

  const defaultBranch = repoData.default_branch || 'main';

  onProgress('Preparing Coucou Android project files...', 50);

  const filesToCommit: Record<string, string> = {
    'package.json': JSON.stringify(
      {
        name: 'coucou-android-dynamic-island',
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite --port=3000 --host=0.0.0.0',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          '@google/genai': '^2.4.0',
          '@tailwindcss/vite': '^4.3.3',
          '@vitejs/plugin-react': '^6.1.1',
          'lucide-react': '^0.546.0',
          react: '^19.0.1',
          'react-dom': '^19.0.1',
          vite: '^8.3.0',
          motion: '^12.23.24',
        },
        devDependencies: {
          '@types/node': '^22.14.0',
          '@types/react': '^19.3.0',
          '@types/react-dom': '^19.3.0',
          tailwindcss: '^4.3.3',
          typescript: '^7.0.2',
        },
      },
      null,
      2
    ),

    'vite.config.ts': `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
  };
});
`,

    '.github/workflows/build-apk.yml': `name: Build Android APK (Coucou Dynamic Island)

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build Coucou Android APK with Capacitor
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build Web Application
        run: npm run build

      - name: Set up Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Set up Android SDK
        uses: android-actions/setup-android@v3

      - name: Add Capacitor Android Platform
        run: |
          npm install @capacitor/core @capacitor/cli @capacitor/android --save
          npx cap init "Coucou Android" "com.coucou.companion" --web-dir "dist"
          npx cap add android
          npx cap sync android

      - name: Build Debug APK with Gradle
        working-directory: android
        run: |
          chmod +x gradlew
          ./gradlew assembleDebug --stacktrace --no-daemon

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Coucou-Android-Dynamic-Island-APK
          path: android/app/build/outputs/apk/debug/*.apk
          retention-days: 14
`,

    'README.md': `# Coucou: Android Notch Dynamic Island Companion
A friendly companion living in your Android phone's punch-hole notch and Dynamic Island that keeps an eye on your AI coding agents: **Claude Code, Cursor, Codex, Gemini CLI, Antigravity**, and more.

## Features
- **Android Center Punch-Hole / Notch Dynamic Island**: Pill expands with spring physics.
- **Biometric Fingerprint Approvals**: Confirm dangerous shell commands or file changes right from the notch with simulated Android fingerprint scanner.
- **Agent Monitor**: Live step ticker and progress counts.
- **Gemini AI Voice & Chat (« OK Coucou »)**.
- **Automated Cloud APK Build via GitHub Actions**.

## How to Build the Android APK
1. This repository includes \`.github/workflows/build-apk.yml\` configured with Capacitor.
2. Every push automatically runs the GitHub Actions workflow on \`ubuntu-latest\`.
3. Go to the **Actions** tab in this GitHub repository.
4. Click on the latest workflow run and download **Coucou-Android-Dynamic-Island-APK**.
5. Install \`app-debug.apk\` on your Android device!
`,
  };

  const fileEntries = Object.entries(filesToCommit);
  let completed = 0;

  for (const [filePath, content] of fileEntries) {
    completed++;
    const percent = 50 + Math.floor((completed / fileEntries.length) * 45);
    onProgress(`Uploading ${filePath} (${completed}/${fileEntries.length})...`, percent);

    let existingSha: string | undefined;
    const existingRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${defaultBranch}`,
      { headers }
    );
    if (existingRes.ok) {
      const data = await existingRes.json();
      existingSha = data.sha;
    }

    const base64Content = btoa(unescape(encodeURIComponent(content)));

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Deploy Coucou Android Dynamic Island: ${filePath}`,
        content: base64Content,
        branch: defaultBranch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      console.warn(`Failed to commit ${filePath}:`, err);
    }
  }

  onProgress('Pushed successfully! Triggering GitHub Actions APK build...', 100);

  const repoUrl = `https://github.com/${owner}/${repo}`;
  const actionsUrl = `https://github.com/${owner}/${repo}/actions`;

  return { repoUrl, actionsUrl };
}
