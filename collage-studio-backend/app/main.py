from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import browse, collages, export, settings

app = FastAPI(title="Collage Studio")

# The frontend is deployed on Vercel (static/serverless), but this backend
# only ever runs locally on 127.0.0.1 -- it's the browser on this same
# machine that calls it directly, cross-origin, from the deployed page.
# Explicit origins only (never "*"): this server has real local filesystem
# access, so a wildcard would let any site the user visits in their browser
# call it too.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://www.dlikane.com",
        "https://dlikane.com",
    ],
    allow_origin_regex=r"https://my-photo-site-git-.*-dlikanes-projects\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(browse.router)
app.include_router(collages.router)
app.include_router(export.router)
app.include_router(settings.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
