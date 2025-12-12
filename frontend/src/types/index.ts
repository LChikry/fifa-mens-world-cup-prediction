export interface Team {
	name: string;
	iso_code: string;
	elo_rating: number;
	flag_url: string;
}

export interface Groups {
	[key: string]: string[];
}

export interface SimulationResult {
	champions: { [team: string]: number };
	finalists: { [team: string]: number };
	semifinalists: { [team: string]: number };
	n_sims: number;
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
