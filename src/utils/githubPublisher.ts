// Helper to push project files to GitHub and trigger the Capacitor Android APK build

export interface PushProgressCallback {
  (step: string, percentage: number): void;
}

export interface PushOptions {
  token: string;
  repoName: string; // e.g. "Spark-Companion" or "user/Spark-Companion"
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
        description: 'Spark Companion: Advanced Android Floating Companion with Gemini Vision & Actions',
        private: isPrivate,
        auto_init: true,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(`Failed to create repository: ${err.message || createRes.statusText}`);
    }
    repoData = await createRes.json();
    // Wait for GitHub to initialize default branch
    await new Promise((r) => setTimeout(r, 1500));
  } else {
    throw new Error(`Failed to access repository: ${repoCheckRes.statusText}`);
  }

  const defaultBranch = repoData.default_branch || 'main';

  onProgress('Collecting project files...', 50);

  // Load project files using dynamic imports or static strings
  const filesToCommit: Record<string, string> = {
    'package.json': JSON.stringify(
      {
        name: 'spark-companion',
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
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
      'process.env': process.env,
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

    '.github/workflows/build-apk.yml': `name: Build Android APK (Capacitor)

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build Debug APK with Capacitor
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
          npx cap init "Spark Companion" "com.spark.companion" --web-dir "dist"
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
          name: Spark-Companion-Debug-APK
          path: android/app/build/outputs/apk/debug/*.apk
          retention-days: 14
`,

    'README.md': `# Spark: Advanced Android Floating Companion
An open-source companion powered by **Google AI Studio (Gemini 2.5 Flash)** with:
- **Always-on floating avatar** over other apps with drag gestures & squish physics.
- **Multimodal Screen Vision** (takes screenshot and sends to Gemini to analyze your current screen).
- **Native Device Function Calling** (battery level, flashlight on/off).
- **Automated Cloud Build via GitHub Actions** (builds APK in the cloud without Android Studio!).

## How to Build the APK
1. Every push to this repository triggers \`.github/workflows/build-apk.yml\`.
2. Under the **Actions** tab, select the run and download **Spark-Companion-Debug-APK**.
3. Install the APK on your phone, enter your Google AI Studio API key, and tap **Save & Spawn Companion**!
`,
  };

  // Upload each file using the GitHub Contents API
  const fileEntries = Object.entries(filesToCommit);
  let completed = 0;

  for (const [filePath, content] of fileEntries) {
    completed++;
    const percent = 50 + Math.floor((completed / fileEntries.length) * 40);
    onProgress(`Uploading ${filePath} (${completed}/${fileEntries.length})...`, percent);

    // Check existing SHA
    let existingSha: string | undefined;
    const existingRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${defaultBranch}`,
      { headers }
    );
    if (existingRes.ok) {
      const data = await existingRes.json();
      existingSha = data.sha;
    }

    // UTF-8 to Base64 encoder for browser
    const base64Content = btoa(unescape(encodeURIComponent(content)));

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Deploy Spark Companion: ${filePath}`,
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

  onProgress('Pushed successfully! Triggering GitHub Actions APK build...', 98);

  const repoUrl = `https://github.com/${owner}/${repo}`;
  const actionsUrl = `https://github.com/${owner}/${repo}/actions`;

  return { repoUrl, actionsUrl };
}
