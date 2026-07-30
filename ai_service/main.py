import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from upscaler import RealESRGANEngine

app = FastAPI(
    title="Real-ESRGAN Python AI Super-Resolution Microservice",
    description="High-performance Python FastAPI service for AI image upscaling",
    version="1.0.0"
)

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load AI Model ONCE at startup into memory
ai_engine = RealESRGANEngine(default_model="realesrgan-x4plus")

class UpscaleRequest(BaseModel):
    input_path: str
    output_path: str
    scale: Optional[int] = 4
    model_name: Optional[str] = "realesrgan-x4plus"

@app.get("/")
def read_root():
    return {
        "service": "Real-ESRGAN AI Super-Resolution Microservice",
        "status": "online",
        "model_loaded": ai_engine.is_loaded,
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "model_ready": ai_engine.is_loaded}

@app.post("/upscale")
def process_upscale(req: UpscaleRequest):
    """
    HTTP REST API Endpoint for Worker microservice to request Real-ESRGAN upscaling
    """
    if not os.path.exists(req.input_path):
        raise HTTPException(status_code=404, detail=f"Input file path does not exist: {req.input_path}")

    try:
        result = ai_engine.upscale_image(
            input_path=req.input_path,
            output_path=req.output_path,
            scale=req.scale or 4
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
