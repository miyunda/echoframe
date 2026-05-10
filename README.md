# 🎹 EchoFrame

**Minimalist 1080p Industrial-Grade Music Visualizer**

EchoFrame is a high-performance, purely client-side web application for generating music visualization videos. By leveraging `FFmpeg.wasm`, it handles 1080p @60fps video encoding directly in the browser. No server-side processing is required, ensuring total data privacy and zero infrastructure costs.

---

## ✨ Features

- **⚡️ Industrial Export**: Frame-by-frame rendering technology supporting 1920x1080 @60fps HD video export.
- **🚨 Police-Light Aesthetics**: Automatic stereo channel detection. Left channel (Red) and Right channel (Blue) jump independently for a professional monitoring vibe.
- **🥁 Deterministic Shake**: Stabilized shake effect triggered by bass frequencies. The render logic ensures that the preview and the exported file are identical.
- **🔒 Privacy First**: All processing happens in the user's browser. Your audio and images never leave your device.
- **📜 Bilingual Lyric Sync**: Supports `.lrc` files with dual-language lines using the `|` delimiter (e.g., `[00:00.00]Hello | 你好`). The first part is displayed as the main text, and the second part as the translation.

Demo site：https://ef.miyunda.com

[![Demo video](http://img.youtube.com/vi/EHGs1U2fZGU/0.jpg)](https://youtu.be/EHGs1U2fZGU)

---

## 🛠 Tech Stack

- **Core**: React + Vite
- **Processing**: FFmpeg.wasm (0.12.x Multi-threaded)
- **Styles**: Tailwind CSS
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Development

```bash
# Clone the repository
git clone https://github.com/miyunda/echoframe.git
cd echoframe

# Install dependencies
npm install

# Start development server (with LAN access)
npm run dev -- --host
```

### 🌍 Deployment

Since FFmpeg.wasm requires Cross-Origin Isolation, specific headers must be set in your production environment.

#### Recommended: Cloudflare Pages (Automatic CI/CD)
Cloudflare Pages is the ideal host for EchoFrame.

1.  **Connect Repo**: Connect your GitHub repository to Cloudflare Pages.
2.  **Build Settings**:
    -   **Framework preset**: React(Vite)
    -   **Build command**: `npm run build`
    -   **Build output directory**: `dist`
3.  **Critical Step**: The `public/_headers` file included in this repo is required. Cloudflare will automatically apply these rules to enable SharedArrayBuffer support.

#### Alternative: Caddy (Private/LAN Deployment)
If you wish to host EchoFrame on a local server or private network using Caddy:

**Caddyfile configuration:**

```caddy
:80 {
    reverse_proxy 127.0.0.1:5173

    # Manually inject Cross-Origin Isolation headers
    header {
        Cross-Origin-Embedder-Policy "require-corp"
        Cross-Origin-Opener-Policy "same-origin"
        Access-Control-Allow-Origin "*"
    }
}
```

Run with: `sudo caddy run`

ℹ️ In non-SSL environment, you need to disable some restrictions in your browser. Like `chrome://flags/#unsafely-treat-insecure-origin-as-secure`

---

## ⚠️ Troubleshooting

**Q: Export stuck at 0% or throws an undefined error?**
A: Check the browser console. Ensure `crossOriginIsolated` is `true`. This environment is mandatory for FFmpeg.wasm to initialize multi-threading.

**Q: Mobile export not working?**
A: Some mobile browsers (like WeChat's built-in browser) restrict high-performance memory allocation. Use Safari (iOS) or Chrome (Android) for the best experience.

---

## 🤝 Contributing

EchoFrame is driven by **Vibe Coding**. If you find this tool useful, give it a Star 🌟 or submit a PR for new visual effects!

## ToDo

- [ ] **Ultra-Fast Export**: WebGPU based rendering pipeline for 10x faster export speed.

## 📌 Project Planning

- [Project rules](docs/project-rules.md)
- [Roadmap](docs/roadmap.md)

## 📄 License

This project is licensed under the MIT License.
