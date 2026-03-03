# 桥 BrandCultureBridge

> **An editorial-grade transcreation workbench for globalizing Chinese brands. 中国品牌出海文案本土化生成器。**

CultureBridge is a specialized AI-powered workspace designed to help Chinese brands adapt their messaging for international markets. It moves beyond literal translation, focusing instead on **cultural transcreation** and **resonance auditing** to ensure brand identity survives and thrives overseas.

Designed with a bespoke **"Paper, Ink & Motion"** aesthetic, BrandCultureBridge feels less like a traditional SaaS tool and more like an editor-in-chief's desk at a high-end publication.

## ✨ Features

* **Two Core Modes:**
  * **Transcreate (Adapt):** Input Chinese source material (copy, poetry, brand slogans) and generate native, platform-specific English copy tailored to specific global demographics.
  * **Audit (Evaluate):** Paste existing localized copy and receive a rigorous "Cultural Resonance Index" score, highlighting strengths, critical issues, and a master rewrite.
* **Cultural Retention Matrix:** A precision slider allowing strategists to balance between "Absolute Localization" (erasing all foreign markers) and "Cultural Purity" (preserving the original Eastern flavor).
* **Linguistic Architecture Mapping:** Every transcreated output includes a strategic breakdown of why specific Chinese idioms or cultural concepts were preserved, adapted, or replaced.
* **Iterative Refinement Loop:** Don't like the first draft? Give the AI editorial directions (e.g., *"Make it sound more poetic,"* or *"Keep the Chinese proverb untranslated"*) and watch it iterate seamlessly.
* **High-End Editorial UI:** * Typography-first design utilizing `Playfair Display`, `Noto Serif SC`, and `DM Mono`.
  * Ambient, breathing background blobs that create a sense of physical space.
  * Smooth, staggered entrance animations and mechanical hover states.

## 🚀 Getting Started

To run CultureBridge locally on your machine, follow these steps:

### Prerequisites

* [Node.js](https://nodejs.org/) (v20.19+ or v22.12+ recommended)
* A free [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/culture-bridge.git](https://github.com/yourusername/culture-bridge.git)
   cd culture-bridge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the API Key:**
   Open `src/App.jsx` and locate line `115` (or search for `apiKey`). Insert your Gemini API key:
   ```javascript
   // Add your real API key inside the quotes
   const apiKey = "AIzaSyYourGeminiKeyHere..."; 
   ```
   *Note: If you plan to make this repository public, ensure you do not commit your real API key. Consider migrating the key to a `.env` file (`VITE_GEMINI_API_KEY`) for production use.*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:xxxx`.

## 🛠️ Tech Stack

* **Framework:** React (via Vite)
* **Styling:** Pure CSS (Custom properties, CSS Grid/Flexbox, Keyframe animations)
* **AI Brain:** Google Gemini API (Structured JSON generation)
* **Typography:** Google Fonts (Playfair Display, Noto Serif SC, DM Mono)

## 🎨 Design Philosophy

CultureBridge was built rejecting the standard "Silicon Valley SaaS" aesthetic. It embraces:

1. **Paper & Ink:** `#EFECE6` backgrounds paired with pure `#0A0A0A` text.
2. **Breathing Whitespace:** Generous padding and margins to let the copy breathe.
3. **The Big Reveal:** Outputs are treated like magazine pull-quotes, establishing immediate visual authority.

---
*CultureBridge © 2026 · Paper, Ink & Motion by Yihan w/ Google Gemini*
