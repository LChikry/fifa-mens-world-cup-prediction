"""
World Cup Match Predictor - Ported from wc_xgboost.ipynb

This module loads trained XGBoost models and provides match prediction
and tournament simulation functions.
"""

import json
import os
from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from scipy.stats import poisson

from iso_codes import get_iso_code, get_flag_url

# Paths
BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "model_artifacts"
SIMULATIONS_PATH = BASE_DIR / "simulations"


class WorldCupPredictor:
    """Handles model loading and match/tournament predictions."""
    
    def __init__(self):
        self.model_home = None
        self.model_away = None
        self.elo_ratings = {}
        self.player_aggregates = None
        self.recent_form = {}
        self.feature_columns = []
        self.teams_metadata = []
        self._loaded = False
    
    def load_models(self):
        """Load all model artifacts."""
        if self._loaded:
            return
        
        # Load XGBoost models
        self.model_home = joblib.load(MODEL_PATH / "model_home_goals.joblib")
        self.model_away = joblib.load(MODEL_PATH / "model_away_goals.joblib")
        
        # Load Elo ratings
        with open(MODEL_PATH / "elo_ratings.json", "r") as f:
            self.elo_ratings = json.load(f)
        
        # Load player aggregates
        self.player_aggregates = pd.read_csv(MODEL_PATH / "player_aggregates.csv")
        
        # Load recent form
        with open(MODEL_PATH / "recent_form.json", "r") as f:
            self.recent_form = json.load(f)
        
        # Load feature columns
        with open(MODEL_PATH / "feature_columns.json", "r") as f:
            self.feature_columns = json.load(f)
        
        # Load or generate teams metadata
        teams_metadata_path = MODEL_PATH / "teams_metadata.json"
        if teams_metadata_path.exists():
            with open(teams_metadata_path, "r") as f:
                self.teams_metadata = json.load(f)
        else:
            self.teams_metadata = self._generate_teams_metadata()
        
        self._loaded = True
        print(f"Loaded models. {len(self.teams_metadata)} teams available.")
    
    def _generate_teams_metadata(self) -> List[dict]:
        """Generate teams metadata dynamically from loaded data."""
        player_countries = set(
            self.player_aggregates[self.player_aggregates['fifa_version'] == 24]['country'].unique()
        )
        available_teams = [t for t in self.elo_ratings.keys() if t in player_countries]
        
        teams_data = []
        for team in available_teams:
            teams_data.append({
                'name': team,
                'iso_code': get_iso_code(team),
                'elo_rating': round(self.elo_ratings[team], 1),
                'flag_url': get_flag_url(team)
            })
        
        teams_data.sort(key=lambda x: x['elo_rating'], reverse=True)
        return teams_data
    
    def get_teams(self) -> List[dict]:
        """Get list of all available teams with metadata."""
        self.load_models()
        return self.teams_metadata
    
    def get_player_stats(self, country: str) -> Optional[pd.Series]:
        """Get player aggregate stats for a country (FIFA 24)."""
        country_data = self.player_aggregates[
            (self.player_aggregates['country'] == country) &
            (self.player_aggregates['fifa_version'] == 24)
        ]
        if len(country_data) == 0:
            return None
        return country_data.iloc[0]
    
    def predict_match(
        self,
        home_team: str,
        away_team: str,
        is_neutral: bool = True,
        is_world_cup: bool = True,
        n_sims: int = 10000
    ) -> Optional[dict]:
        """
        Predict a match between two teams with full probability distribution.
        
        Returns dict with:
        - home_win_prob, draw_prob, away_win_prob
        - expected_home_goals, expected_away_goals
        """
        self.load_models()
        
        # Get player data
        home_players = self.get_player_stats(home_team)
        away_players = self.get_player_stats(away_team)
        
        if home_players is None or away_players is None:
            return None
        
        # Get Elo ratings
        home_elo = self.elo_ratings.get(home_team, 1500)
        away_elo = self.elo_ratings.get(away_team, 1500)
        
        # Get form data
        home_form = self.recent_form.get(home_team, {'avg_scored': 1.5, 'avg_conceded': 1.5, 'win_rate': 0.33})
        away_form = self.recent_form.get(away_team, {'avg_scored': 1.5, 'avg_conceded': 1.5, 'win_rate': 0.33})
        
        # Build feature vector
        features = pd.DataFrame([{
            'home_elo': home_elo,
            'away_elo': away_elo,
            'elo_diff': home_elo - away_elo,
            'home_avg_overall': home_players['avg_overall'],
            'home_max_overall': home_players['max_overall'],
            'home_avg_attack': home_players['avg_attack_overall'],
            'home_avg_defense': home_players['avg_defense_overall'],
            'home_avg_pace': home_players['avg_pace'],
            'home_avg_shooting': home_players['avg_shooting'],
            'home_avg_passing': home_players['avg_passing'],
            'away_avg_overall': away_players['avg_overall'],
            'away_max_overall': away_players['max_overall'],
            'away_avg_attack': away_players['avg_attack_overall'],
            'away_avg_defense': away_players['avg_defense_overall'],
            'away_avg_pace': away_players['avg_pace'],
            'away_avg_shooting': away_players['avg_shooting'],
            'away_avg_passing': away_players['avg_passing'],
            'overall_diff': home_players['avg_overall'] - away_players['avg_overall'],
            'attack_diff': home_players['avg_attack_overall'] - away_players['avg_attack_overall'],
            'defense_diff': home_players['avg_defense_overall'] - away_players['avg_defense_overall'],
            'home_form_scored': home_form['avg_scored'],
            'home_form_conceded': home_form['avg_conceded'],
            'home_form_win_rate': home_form['win_rate'],
            'away_form_scored': away_form['avg_scored'],
            'away_form_conceded': away_form['avg_conceded'],
            'away_form_win_rate': away_form['win_rate'],
            'is_neutral': 1 if is_neutral else 0,
            'is_world_cup': 1 if is_world_cup else 0,
            'is_continental': 0,
        }])
        
        # Reorder columns to match training
        features = features[self.feature_columns]
        
        # Predict goals
        home_goals_pred = float(self.model_home.predict(features)[0])
        away_goals_pred = float(self.model_away.predict(features)[0])
        
        # Simulate match using Poisson distribution
        home_lambda = max(0.1, home_goals_pred)
        away_lambda = max(0.1, away_goals_pred)
        
        home_goals = poisson.rvs(mu=home_lambda, size=n_sims)
        away_goals = poisson.rvs(mu=away_lambda, size=n_sims)
        
        home_wins = float((home_goals > away_goals).mean())
        draws = float((home_goals == away_goals).mean())
        away_wins = float((home_goals < away_goals).mean())
        
        return {
            'home_team': home_team,
            'away_team': away_team,
            'home_win_prob': home_wins,
            'draw_prob': draws,
            'away_win_prob': away_wins,
            'expected_home_goals': home_goals_pred,
            'expected_away_goals': away_goals_pred,
        }
    
    def simulate_group_stage(
        self,
        groups: Dict[str, List[str]],
        n_sims: int = 1000
    ) -> Dict[str, List[Tuple[str, dict]]]:
        """
        Simulate group stage matches and return standings.
        
        Returns dict mapping group name to list of (team, stats) tuples sorted by standing.
        """
        self.load_models()
        group_results = {}
        
        for group_name, teams in groups.items():
            standings = {team: {'points': 0, 'gd': 0, 'gf': 0, 'wins': 0} for team in teams}
            
            # Play all group matches (round robin)
            for i, team_a in enumerate(teams):
                for team_b in teams[i+1:]:
                    result = self.predict_match(team_a, team_b, n_sims=n_sims)
                    
                    if result is None:
                        continue
                    
                    # Simulate single match outcome from probabilities
                    rand = np.random.random()
                    if rand < result['home_win_prob']:
                        standings[team_a]['points'] += 3
                        standings[team_a]['wins'] += 1
                        standings[team_a]['gf'] += result['expected_home_goals']
                        standings[team_a]['gd'] += result['expected_home_goals'] - result['expected_away_goals']
                        standings[team_b]['gf'] += result['expected_away_goals']
                        standings[team_b]['gd'] += result['expected_away_goals'] - result['expected_home_goals']
                    elif rand < result['home_win_prob'] + result['draw_prob']:
                        standings[team_a]['points'] += 1
                        standings[team_b]['points'] += 1
                        standings[team_a]['gf'] += result['expected_home_goals']
                        standings[team_b]['gf'] += result['expected_away_goals']
                    else:
                        standings[team_b]['points'] += 3
                        standings[team_b]['wins'] += 1
                        standings[team_b]['gf'] += result['expected_away_goals']
                        standings[team_b]['gd'] += result['expected_away_goals'] - result['expected_home_goals']
                        standings[team_a]['gf'] += result['expected_home_goals']
                        standings[team_a]['gd'] += result['expected_home_goals'] - result['expected_away_goals']
            
            # Sort by points, then goal difference
            sorted_teams = sorted(
                standings.items(),
                key=lambda x: (x[1]['points'], x[1]['gd'], x[1]['gf']),
                reverse=True
            )
            group_results[group_name] = sorted_teams
        
        return group_results
    
    def simulate_knockout_match(self, team_a: str, team_b: str, n_sims: int = 1000) -> str:
        """Simulate a knockout match (no draws allowed). Returns winner."""
        result = self.predict_match(team_a, team_b, n_sims=n_sims)
        
        if result is None:
            # Fallback: use Elo to decide
            return team_a if self.elo_ratings.get(team_a, 1500) > self.elo_ratings.get(team_b, 1500) else team_b
        
        # For knockouts, add half of draw probability to each team
        adj_home_win = result['home_win_prob'] + result['draw_prob'] / 2
        
        if np.random.random() < adj_home_win:
            return team_a
        else:
            return team_b
    
    def _create_32_team_bracket(self, group_results: Dict[str, List[Tuple[str, dict]]]) -> List[Tuple[str, str]]:
        """
        Create Round of 16 bracket for 32-team format following FIFA rules.
        
        Official FIFA Bracket Structure:
        Left Side: 1A vs 2B, 1C vs 2D, 1E vs 2F, 1G vs 2H
        Right Side: 1B vs 2A, 1D vs 2C, 1F vs 2E, 1H vs 2G
        """
        pairs = []
        
        # Left bracket
        pairs.append((group_results['A'][0][0], group_results['B'][1][0]))  # 1A vs 2B
        pairs.append((group_results['C'][0][0], group_results['D'][1][0]))  # 1C vs 2D
        pairs.append((group_results['E'][0][0], group_results['F'][1][0]))  # 1E vs 2F
        pairs.append((group_results['G'][0][0], group_results['H'][1][0]))  # 1G vs 2H
        
        # Right bracket
        pairs.append((group_results['B'][0][0], group_results['A'][1][0]))  # 1B vs 2A
        pairs.append((group_results['D'][0][0], group_results['C'][1][0]))  # 1D vs 2C
        pairs.append((group_results['F'][0][0], group_results['E'][1][0]))  # 1F vs 2E
        pairs.append((group_results['H'][0][0], group_results['G'][1][0]))  # 1H vs 2G
        
        return pairs
    
    def _create_48_team_bracket(
        self, 
        group_results: Dict[str, List[Tuple[str, dict]]], 
        best_third_place: List[Tuple[str, int, int, str]]
    ) -> List[Tuple[str, str]]:
        """
        Create Round of 32 bracket for 48-team format following FIFA rules.
        
        Structure: 12 Group Winners + 12 Runners-up + 8 Best 3rd Place = 32 teams
        """
        # Extract group winners and runners-up
        winners = {group: standings[0][0] for group, standings in group_results.items()}
        runners_up = {group: standings[1][0] for group, standings in group_results.items()}
        
        # Get best 8 third-place teams
        third_place_teams = [t[0] for t in best_third_place[:8]]
        
        # Track used teams
        used_teams = set()
        pairs = []
        third_idx = 0
        
        # Match 1-4: Winners A-D vs Runners-up (prefer cross-group matchups)
        for i, group in enumerate(['A', 'B', 'C', 'D']):
            opponent_group = ['B', 'A', 'D', 'C'][i]
            if runners_up[opponent_group] not in used_teams:
                pairs.append((winners[group], runners_up[opponent_group]))
                used_teams.add(winners[group])
                used_teams.add(runners_up[opponent_group])
            elif third_idx < len(third_place_teams):
                pairs.append((winners[group], third_place_teams[third_idx]))
                used_teams.add(winners[group])
                used_teams.add(third_place_teams[third_idx])
                third_idx += 1
        
        # Match 5-8: Winners E-H vs Runners-up or 3rd Place
        for i, group in enumerate(['E', 'F', 'G', 'H']):
            opponent_group = ['F', 'E', 'H', 'G'][i]
            if runners_up[opponent_group] not in used_teams:
                pairs.append((winners[group], runners_up[opponent_group]))
                used_teams.add(winners[group])
                used_teams.add(runners_up[opponent_group])
            elif third_idx < len(third_place_teams):
                pairs.append((winners[group], third_place_teams[third_idx]))
                used_teams.add(winners[group])
                used_teams.add(third_place_teams[third_idx])
                third_idx += 1
        
        # Match 9-12: Winners I-L vs Runners-up
        pairs.append((winners['I'], runners_up['J']))
        pairs.append((winners['J'], runners_up['I']))
        pairs.append((winners['K'], runners_up['L']))
        pairs.append((winners['L'], runners_up['K']))
        used_teams.update([winners['I'], winners['J'], winners['K'], winners['L'],
                          runners_up['I'], runners_up['J'], runners_up['K'], runners_up['L']])
        
        # Match 13-16: Remaining Runners-up and 3rd Place teams
        unused_runners = [runners_up[g] for g in sorted(group_results.keys()) 
                         if runners_up[g] not in used_teams]
        unused_third = [t for t in third_place_teams if t not in used_teams]
        
        # Pair remaining teams
        remaining = unused_runners + unused_third
        for i in range(0, len(remaining), 2):
            if i+1 < len(remaining):
                pairs.append((remaining[i], remaining[i+1]))
        
        # Ensure we have exactly 16 pairs for Round of 32
        return pairs[:16]
    
    def simulate_tournament(
        self,
        groups: Dict[str, List[str]],
        tournament_format: str = "32_team",
        n_tournament_sims: int = 100
    ) -> dict:
        """
        Run full tournament simulation multiple times.
        
        Args:
            groups: Dict mapping group name to list of team names
            tournament_format: "32_team" (8 groups) or "48_team" (12 groups)
            n_tournament_sims: Number of tournament simulations to run
        
        Returns dict with:
            - champions: dict of team -> win count
            - finalists: dict of team -> finals appearance count
            - semifinalists: dict of team -> semifinal appearance count
        """
        self.load_models()
        
        use_third_place = tournament_format == "48_team"
        
        champions = Counter()
        finalists = Counter()
        semifinalists = Counter()
        
        for _ in range(n_tournament_sims):
            # Simulate group stage
            group_results = self.simulate_group_stage(groups)
            
            # Determine third-place teams for 48-team format
            third_place = []
            for group_name, standings in group_results.items():
                if use_third_place and len(standings) > 2:
                    third_place.append((
                        standings[2][0],
                        standings[2][1]['points'],
                        standings[2][1]['gd'],
                        group_name
                    ))
            
            # Sort third-place teams for 48-team format
            if use_third_place:
                third_place.sort(key=lambda x: (x[1], x[2]), reverse=True)
            
            # Create bracket pairs following FIFA rules
            if tournament_format == "32_team":
                bracket_pairs = self._create_32_team_bracket(group_results)
            else:  # 48_team
                bracket_pairs = self._create_48_team_bracket(group_results, third_place)
            
            # Simulate Round of 32 (or Round of 16 for 32-team)
            current_round = [
                self.simulate_knockout_match(pair[0], pair[1])
                for pair in bracket_pairs
            ]
            
            # Determine rounds based on format
            if tournament_format == "48_team":
                round_names = ['Round of 32', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Final']
            else:
                round_names = ['Round of 16', 'Quarter Finals', 'Semi Finals', 'Final']
            
            # Start from Round of 16 (or Round of 32 for 48-team)
            round_start_idx = 1 if tournament_format == "48_team" else 0
            
            for round_idx, round_name in enumerate(round_names[round_start_idx:-1], round_start_idx):
                next_round = []
                for i in range(0, len(current_round), 2):
                    if i + 1 < len(current_round):
                        winner = self.simulate_knockout_match(current_round[i], current_round[i+1])
                        next_round.append(winner)
                        
                        if round_name == 'Quarter Finals':
                            semifinalists[winner] += 1
                        if round_name == 'Semi Finals':
                            finalists[winner] += 1
                
                current_round = next_round
            
            # Final
            if len(current_round) >= 2:
                champion = self.simulate_knockout_match(current_round[0], current_round[1])
                champions[champion] += 1
        
        return {
            'champions': dict(champions),
            'finalists': dict(finalists),
            'semifinalists': dict(semifinalists),
            'n_sims': n_tournament_sims
        }
    
    def load_preset(self, preset_name: str) -> Optional[dict]:
        """
        Load a preset tournament configuration and its pre-computed results.
        
        Args:
            preset_name: "wc2022" or "wc2026"
        
        Returns dict with groups and simulation results, or None if not found.
        """
        # Try multiple locations for groups file
        groups_file_options = [
            SIMULATIONS_PATH / f"{preset_name}_groups.json",
            BASE_DIR / f"{preset_name.replace('wc', 'wc')}.json",  # e.g., wc22.json
            BASE_DIR.parent / f"wc{preset_name[-2:]}.json",  # Root level wc22.json
        ]
        
        results_file = SIMULATIONS_PATH / f"{preset_name}_simulation.json"
        
        groups_data = None
        groups = {}
        
        # Try to load groups from various locations
        for groups_file in groups_file_options:
            if groups_file.exists():
                with open(groups_file, "r") as f:
                    data = json.load(f)
                    # Handle both formats: direct groups dict or nested structure
                    if 'groups' in data:
                        groups_data = data
                        groups = data['groups']
                    else:
                        # Direct groups format (e.g., {"Group A": [...], "Group B": [...]})
                        groups = data
                        groups_data = {'groups': groups}
                break
        
        # Also check if groups are in simulation results metadata
        if not groups and results_file.exists():
            with open(results_file, "r") as f:
                sim_data = json.load(f)
                metadata = sim_data.get('metadata', {})
                if 'groups' in metadata:
                    groups = metadata['groups']
                    groups_data = {'groups': groups}
        
        if not groups:
            return None
        
        # Determine format based on group count
        num_groups = len(groups)
        tournament_format = "48_team" if num_groups == 12 else "32_team"
        
        result = {
            'name': groups_data.get('name', f"World Cup {preset_name[-4:]}"),
            'format': groups_data.get('format', tournament_format),
            'groups': groups
        }
        
        # Load pre-computed simulation results if available
        if results_file.exists():
            with open(results_file, "r") as f:
                sim_data = json.load(f)
            result['champions'] = sim_data.get('champions', {})
            result['finalists'] = sim_data.get('finalists', {})
            result['semifinalists'] = sim_data.get('semifinalists', {})
            result['metadata'] = sim_data.get('metadata', {})
        
        return result


# Global predictor instance
predictor = WorldCupPredictor()
