# 启动后端
python -m uvicorn backend.app.main:app --reload --port 8000
# 启动前端
cd frontend
npm run dev