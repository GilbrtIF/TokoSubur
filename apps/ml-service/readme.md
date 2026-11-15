
---

# 📄 3. `apps/ml-service/README.md` (AI Service)

```markdown
# Tokosubu - AI & ML Service Setup (Python + FastAPI)

Panduan ini khusus untuk AI Engineer dan Data Scientist. Fokus kita adalah memproses data dengan Python, melatih model, dan menyajikannya via API.

## 🛠️ Langkah 1: Inisialisasi Virtual Environment
Sangat penting untuk menggunakan *Virtual Environment* agar library Python tidak bentrok dengan sistem Windows.
Buka terminal di dalam folder `apps/ml-service`:

```bash
# Membuat virtual environment bernama 'venv'
python -m venv venv

# Mengaktifkan venv (WAJIB DILAKUKAN SETIAP KALI BUKA TERMINAL BARU)
venv\Scripts\activate
(Pastikan ada tulisan (venv) di sebelah kiri prompt terminalmu).

📦 Langkah 2: Instalasi Packages yang Dibutuhkan
Jalankan perintah ini saat (venv) sudah aktif:

bash
# 1. Core API Service
# - fastapi: Framework web untuk menyajikan model ke aplikasi
# - uvicorn: Server ASGI untuk menjalankan FastAPI
# - pydantic: Validasi data request/response
# - python-dotenv: Membaca file .env
pip install fastapi uvicorn pydantic python-dotenv

# 2. Data Science & Machine Learning
# - pandas: Manipulasi data tabel (Excel/CSV)
# - numpy: Komputasi matematika
# - scikit-learn: Untuk model RandomForestRegressor
pip install pandas numpy scikit-learn

# 3. (Opsional untuk AI Agent / LLM)
# - google-generativeai: SDK untuk memanggil API Gemini
pip install google-generativeai

# 4. (Opsional jika jadi menggunakan N-HiTS)
# pip install neuralforecast
Simpan daftar library ke requirements.txt agar anggota lain bisa menginstall dengan mudah:

bash
pip freeze > requirements.txt
🔑 Langkah 3: Konfigurasi Environment (.env)
Buat file .env di dalam folder apps/ml-service/:

env
MODEL_DIR=artifacts
LOG_LEVEL=info

# API Keys untuk AI Agent
GEMINI_API_KEY=isi_api_key_gemini_kamu
🚀 Langkah 4: Jalankan Aplikasi
bash
uvicorn app.main:app --reload --port 8000
Buka http://localhost:8000/docs di browser. Kamu akan melihat Swagger UI (dokumentasi API otomatis yang dibuat oleh FastAPI).

📂 Struktur Folder
text
app/
├── api/            # Endpoint routing (predict.py, chat.py)
├── services/       # Logika AI (llm_service.py, prediction_service.py)
├── models/         # Skema Pydantic untuk validasi request/response
├── evaluation/     # Script DS untuk evaluasi model (MAE, RMSE)
├── artifacts/      # Tempat menyimpan model .pkl / .joblib (JANGAN DI-COMMIT)
└── main.py         # Entry point FastAPI
notebooks/          # Tempat eksperimen Jupyter Notebook DS