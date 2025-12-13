"""
World Cup Predictor API

FastAPI backend for the World Cup prediction web application.
"""

from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from predictor import predictor
from iso_codes import get_flag_url

# Create FastAPI app
app = FastAPI(
    title="World Cup Predictor API",
    description="API for predicting World Cup match outcomes and simulating tournaments",
    version="1.0.0"
)

origins = [
    "machine-learning-world-cup-prediction.up.railway.app",
    "http://localhost:5173", # Keep this for local testing
]

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class TeamResponse(BaseModel):
    name: str
    iso_code: str
    elo_rating: float
    flag_url: str


class MatchPredictionRequest(BaseModel):
    home_team: str
    away_team: str
    is_neutral: bool = True
    is_world_cup: bool = True


class MatchPredictionResponse(BaseModel):
    home_team: str
    away_team: str
    home_win_prob: float
    draw_prob: float
    away_win_prob: float
    expected_home_goals: float
    expected_away_goals: float


class SimulationRequest(BaseModel):
    groups: Dict[str, List[str]]
    format: str = "32_team"  # "32_team" or "48_team"
    n_sims: int = 100


class SimulationResponse(BaseModel):
    champions: Dict[str, int]
    finalists: Dict[str, int]
    semifinalists: Dict[str, int]
    n_sims: int


# Bracket-related models
class BracketMatch(BaseModel):
    team_a: str
    team_b: str
    winner: str
    win_prob: float


class GroupStanding(BaseModel):
    team: str
    points: int
    gd: float
    gf: float


class Bracket(BaseModel):
    round_of_32: Optional[List[BracketMatch]] = None  # 48-team only
    round_of_16: Optional[List[BracketMatch]] = None
    quarter_finals: List[BracketMatch]
    semi_finals: List[BracketMatch]
    final: BracketMatch
    champion: str


class BracketSimulationResponse(BaseModel):
    # Monte Carlo results
    champions: Dict[str, int]
    finalists: Dict[str, int]
    semifinalists: Dict[str, int]
    n_sims: int
    # Deterministic bracket prediction
    group_results: Dict[str, List[GroupStanding]]
    bracket: Bracket


class PresetResponse(BaseModel):
    name: str
    format: str
    groups: Dict[str, List[str]]
    champions: Optional[Dict[str, int]] = None
    finalists: Optional[Dict[str, int]] = None
    semifinalists: Optional[Dict[str, int]] = None
    metadata: Optional[dict] = None


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "World Cup Predictor API"}


@app.get("/api/teams", response_model=List[TeamResponse])
async def get_teams():
    """
    Get list of all available teams with metadata.
    
    Returns teams sorted by Elo rating (highest first).
    """
    try:
        teams = predictor.get_teams()
        return [
            TeamResponse(
                name=t['name'],
                iso_code=t['iso_code'],
                elo_rating=t['elo_rating'],
                flag_url=get_flag_url(t['name'])
            )
            for t in teams
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load teams: {str(e)}")


@app.post("/api/predict", response_model=MatchPredictionResponse)
async def predict_match(request: MatchPredictionRequest):
    """
    Predict the outcome of a single match between two teams.
    
    Returns win/draw/loss probabilities and expected goals.
    """
    try:
        result = predictor.predict_match(
            home_team=request.home_team,
            away_team=request.away_team,
            is_neutral=request.is_neutral,
            is_world_cup=request.is_world_cup
        )
        
        if result is None:
            raise HTTPException(
                status_code=404,
                detail=f"Missing data for one or both teams: {request.home_team}, {request.away_team}"
            )
        
        return MatchPredictionResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/api/simulate", response_model=BracketSimulationResponse)
async def simulate_tournament(request: SimulationRequest):
    """
    Run a full tournament simulation with custom groups.
    
    This performs:
    1. Monte Carlo simulation for championship probabilities
    2. Deterministic bracket prediction showing most likely outcomes
    """
    try:
        # Validate format
        if request.format not in ["32_team", "48_team"]:
            raise HTTPException(
                status_code=400,
                detail="Format must be '32_team' or '48_team'"
            )
        
        # Validate group count
        expected_groups = 8 if request.format == "32_team" else 12
        if len(request.groups) != expected_groups:
            raise HTTPException(
                status_code=400,
                detail=f"Expected {expected_groups} groups for {request.format} format, got {len(request.groups)}"
            )
        
        # Validate teams per group
        for group_name, teams in request.groups.items():
            if len(teams) != 4:
                raise HTTPException(
                    status_code=400,
                    detail=f"Group {group_name} must have exactly 4 teams, got {len(teams)}"
                )
        
        # Run Monte Carlo simulation for probabilities
        mc_result = predictor.simulate_tournament(
            groups=request.groups,
            tournament_format=request.format,
            n_tournament_sims=min(request.n_sims, 500)  # Cap at 500 for performance
        )
        
        # Run deterministic simulation for bracket prediction
        bracket_result = predictor.simulate_deterministic_tournament(
            groups=request.groups,
            tournament_format=request.format
        )
        
        # Combine results
        return BracketSimulationResponse(
            champions=mc_result['champions'],
            finalists=mc_result['finalists'],
            semifinalists=mc_result['semifinalists'],
            n_sims=mc_result['n_sims'],
            group_results=bracket_result['group_results'],
            bracket=bracket_result['bracket']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@app.get("/api/presets/{preset_name}", response_model=PresetResponse)
async def get_preset(preset_name: str):
    """
    Get a preset tournament configuration with pre-computed results.
    
    Available presets:
    - wc2022: 2022 FIFA World Cup (32 teams, 8 groups)
    - wc2026: 2026 FIFA World Cup projected (48 teams, 12 groups)
    """
    valid_presets = ["wc2022", "wc2026"]
    if preset_name not in valid_presets:
        raise HTTPException(
            status_code=404,
            detail=f"Preset '{preset_name}' not found. Available presets: {valid_presets}"
        )
    
    try:
        result = predictor.load_preset(preset_name)
        
        if result is None:
            raise HTTPException(
                status_code=404,
                detail=f"Preset '{preset_name}' data files not found"
            )
        
        return PresetResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load preset: {str(e)}")


@app.get("/api/presets")
async def list_presets():
    """List all available presets."""
    return {
        "presets": [
            {"id": "wc2022", "name": "2022 FIFA World Cup", "format": "32_team"},
            {"id": "wc2026", "name": "2026 FIFA World Cup (Projected)", "format": "48_team"},
        ]
    }


# Startup event to preload models
@app.on_event("startup")
async def startup_event():
    """Load models on startup for faster first request."""
    try:
        predictor.load_models()
        print("Models loaded successfully on startup")
    except Exception as e:
        print(f"Warning: Could not preload models: {e}")
        print("Models will be loaded on first request")
