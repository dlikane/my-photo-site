from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import export

app = FastAPI(title="Collage Studio")

# The frontend is deployed on Vercel (static/serverless), but this backend
# only ever runs locally on 127.0.0.1 -- it's the browser on this same
# machine that calls it directly, cross-origin, from the deployed page.
# It's stateless and touches no disk (images arrive as request bytes, nothing
# is stored), but explicit origins are still kept (never "*") since it's the
# only thing standing between "any site this browser visits" and this port.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.dlikane.com",
        "https://dlikane.com",
    ],
    # Vite auto-increments its port when 5173+ are already taken, so pin this
    # to loopback origins on any port rather than hardcoding specific ones.
    allow_origin_regex=r"https://my-photo-site-git-.*-dlikanes-projects\.vercel\.app|https?://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(export.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
