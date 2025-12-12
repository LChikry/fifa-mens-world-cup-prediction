export interface Team {
	name: string;
	iso_code: string;
	elo_rating: number;
	flag_url: string;
}

export interface Groups {
	[key: string]: string[];
}

export interface BracketMatch {
	team_a: string;
	team_b: string;
	winner: string;
	win_prob: number;
}

export interface GroupStanding {
	team: string;
	points: number;
	gd: number;
	gf: number;
}

export interface Bracket {
	round_of_32?: BracketMatch[]; // 48-team only
	round_of_16?: BracketMatch[];
	quarter_finals: BracketMatch[];
	semi_finals: BracketMatch[];
	final: BracketMatch;
	champion: string;
}

export interface SimulationResult {
	champions: { [team: string]: number };
	finalists: { [team: string]: number };
	semifinalists: { [team: string]: number };
	n_sims: number;
	// New bracket data
	group_results?: { [group: string]: GroupStanding[] };
	bracket?: Bracket;
}

export interface Preset {
	name: string;
	format: string;
	groups: Groups;
	champions?: { [team: string]: number };
	finalists?: { [team: string]: number };
	semifinalists?: { [team: string]: number };
	metadata?: {
		n_sims?: number;
		saved_at?: string;
	};
}

export type TournamentFormat = "32_team" | "48_team";
