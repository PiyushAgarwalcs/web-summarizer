# 🤖 Web Summarizer - AI Chrome Extension

A privacy-focused Chrome extension that uses locally-hosted AI (Qwen3) to instantly summarize web pages. No cloud APIs, no data sharing - everything runs on your machine.

<img width="1919" height="807" alt="image" src="https://github.com/user-attachments/assets/f65e605e-1e67-44ea-aed4-e55ecb5293d9" />

## ✨ Features

- 🔒 **100% Privacy** - All processing happens locally
- ⚡ **Real-time Streaming** - Watch summaries generate live
- 🎯 **Smart AI** - Powered by Qwen3 1.7B via Ollama
- 🚀 **Fast** - Summaries in 3-5 seconds
- 💾 **Lightweight** - Only 1.4GB model size

## 📋 Prerequisites

- Python 3.10+
- Google Chrome
- [Ollama](https://ollama.ai/download)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/web-summarizer.git
cd web-summarizer
```

### 2. Install Ollama & Pull Model
```bash
# Install Ollama from https://ollama.ai/download
# Then pull the model:
ollama pull qwen3:1.7b
```

### 3. Setup Backend
```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/Scripts/activate  # Windows Git Bash
# OR: venv\Scripts\activate.bat  # Windows CMD
# OR: source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app:app --host 0.0.0.0 --port 7864
```

### 4. Install Chrome Extension
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension` folder
5. Extension icon appears in toolbar ✅

### 5. Use It!
1. Visit any webpage
2. Click the extension icon
3. Click "Summarize This Page"
4. Get instant AI summary! 🎉

## 📁 Project Structure
```
web-summarizer/
├── backend/
│   ├── app.py              # FastAPI server
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Optional Docker setup
└── extension/
    ├── manifest.json       # Extension config
    ├── popup.html          # UI interface
    ├── popup.js            # Frontend logic
    ├── content.js          # Content extraction
    ├── background.js       # Background worker
    └── icon.png            # Extension icon
```

## 🔧 Troubleshooting

**Backend won't start:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Verify model is installed
ollama list
```

**Content too long error:**
- Normal! Content is automatically truncated
- Or use larger model: `ollama pull qwen3:8b`

**Extension not working:**
- Ensure backend is running on port 7864
- Check `chrome://extensions/` for errors
- Reload the extension after changes

## ⚙️ Configuration

Change model in `backend/app.py`:
```python
bot = Assistant(
    llm={
        "model": "qwen3:1.7b",  # Options: qwen3:0.6b, qwen3:4b, qwen3:8b
        # ...
    }
)
```

## 🎯 Tech Stack

- **Backend:** Python, FastAPI, Qwen-Agent
- **AI Model:** Qwen3 1.7B (via Ollama)
- **Frontend:** JavaScript, Chrome Extensions API
- **Deployment:** Local inference, no cloud required

## 📊 Performance

| Metric | Value |
|--------|-------|
| Model Size | 1.4 GB |
| Processing Time | 3-7 seconds |
| Context Limit | ~3,500 tokens |
| RAM Usage | 2-4 GB |

## 📝 License

MIT License - feel free to use and modify!

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) - Local LLM deployment
- [Qwen Team](https://github.com/QwenLM/Qwen) - Open-source language models
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework

---

**Made with ❤️ | Star ⭐ if you find this useful!**
