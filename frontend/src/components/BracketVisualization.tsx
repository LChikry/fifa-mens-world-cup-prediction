import { useMemo } from "react";
import type { Bracket, BracketMatch, Team, TournamentFormat } from "../types";

interface BracketVisualizationProps {
	bracket: Bracket;
	teams: Team[];
	format: TournamentFormat;
}

// ISO codes for flag generation (subset for common teams)
const ISO_CODES: Record<string, string> = {
	Afghanistan: "af",
	Albania: "al",
	Algeria: "dz",
	Argentina: "ar",
	Australia: "au",
	Austria: "at",
	Belgium: "be",
	Bolivia: "bo",
	Brazil: "br",
	Cameroon: "cm",
	Canada: "ca",
	Chile: "cl",
	China: "cn",
	Colombia: "co",
	"Costa Rica": "cr",
	Croatia: "hr",
	"Czech Republic": "cz",
	Denmark: "dk",
	Ecuador: "ec",
	Egypt: "eg",
	England: "gb-eng",
	France: "fr",
	Germany: "de",
	Ghana: "gh",
	Greece: "gr",
	Haiti: "ht",
	Hungary: "hu",
	Iran: "ir",
	Iraq: "iq",
	Ireland: "ie",
	Italy: "it",
	"Ivory Coast": "ci",
	Jamaica: "jm",
	Japan: "jp",
	Jordan: "jo",
	Mexico: "mx",
	Morocco: "ma",
	Netherlands: "nl",
	"New Zealand": "nz",
	Nigeria: "ng",
	Norway: "no",
	Panama: "pa",
	Paraguay: "py",
	Peru: "pe",
	Poland: "pl",
	Portugal: "pt",
	Qatar: "qa",
	Romania: "ro",
	Russia: "ru",
	"Saudi Arabia": "sa",
	Scotland: "gb-sct",
	Senegal: "sn",
	Serbia: "rs",
	"South Africa": "za",
	"South Korea": "kr",
	Spain: "es",
	Sweden: "se",
	Switzerland: "ch",
	Tunisia: "tn",
	Turkey: "tr",
	Ukraine: "ua",
	"United States": "us",
	Uruguay: "uy",
	Uzbekistan: "uz",
	Venezuela: "ve",
	Wales: "gb-wls",
	USA: "us",
	"Korea Republic": "kr",
	Curaçao: "cw",
	"Côte d'Ivoire": "ci",
	"Cabo Verde": "cv",
	"Cape Verde": "cv",
	"DR Congo": "cd",
	"New Caledonia": "nc",
	Suriname: "sr",
};

function getIsoCode(teamName: string): string {
	return ISO_CODES[teamName] || teamName.toLowerCase().slice(0, 2);
}

function getFlagUrl(teamName: string): string {
	const isoCode = getIsoCode(teamName);
	return `https://flagcdn.com/w40/${isoCode}.png`;
}

interface MatchCardProps {
	match: BracketMatch;
	showProbability?: boolean;
}

function MatchCard({ match, showProbability = true }: MatchCardProps) {
	const winProbPercent = Math.round(match.win_prob * 100);

	return (
		<div className="bracket-match">
			<div
				className={`bracket-team ${
					match.winner === match.team_a ? "winner" : "loser"
				}`}
			>
				<img
					src={getFlagUrl(match.team_a)}
					alt={`${match.team_a} flag`}
					className="bracket-flag"
					onError={(e) => {
						(e.target as HTMLImageElement).style.display = "none";
					}}
				/>
				<span className="bracket-team-name">{match.team_a}</span>
				{match.winner === match.team_a && showProbability && (
					<span className="win-prob">{winProbPercent}%</span>
				)}
			</div>
			<div className="match-vs">vs</div>
			<div
				className={`bracket-team ${
					match.winner === match.team_b ? "winner" : "loser"
				}`}
			>
				<img
					src={getFlagUrl(match.team_b)}
					alt={`${match.team_b} flag`}
					className="bracket-flag"
					onError={(e) => {
						(e.target as HTMLImageElement).style.display = "none";
					}}
				/>
				<span className="bracket-team-name">{match.team_b}</span>
				{match.winner === match.team_b && showProbability && (
					<span className="win-prob">{winProbPercent}%</span>
				)}
			</div>
		</div>
	);
}

interface RoundColumnProps {
	title: string;
	matches: BracketMatch[];
}

function RoundColumn({ title, matches }: RoundColumnProps) {
	return (
		<div className="bracket-round">
			<h3 className="round-title">{title}</h3>
			<div className="round-matches">
				{matches.map((match, idx) => (
					<MatchCard key={`${title}-${idx}`} match={match} />
				))}
			</div>
		</div>
	);
}

export function BracketVisualization({
	bracket,
	format,
}: BracketVisualizationProps) {
	const rounds = useMemo(() => {
		const roundsList: { title: string; matches: BracketMatch[] }[] = [];

		// For 48-team format, include Round of 32
		if (format === "48_team" && bracket.round_of_32) {
			roundsList.push({
				title: "Round of 32",
				matches: bracket.round_of_32,
			});
		}

		// Round of 16
		if (bracket.round_of_16) {
			roundsList.push({
				title: "Round of 16",
				matches: bracket.round_of_16,
			});
		}

		// Quarter Finals
		roundsList.push({
			title: "Quarter Finals",
			matches: bracket.quarter_finals,
		});

		// Semi Finals
		roundsList.push({
			title: "Semi Finals",
			matches: bracket.semi_finals,
		});

		// Final
		roundsList.push({
			title: "Final",
			matches: [bracket.final],
		});

		return roundsList;
	}, [bracket, format]);

	return (
		<div className="bracket-visualization">
			<div className="bracket-header">
				<h2>Tournament Bracket Prediction</h2>
				<p className="bracket-subtitle">
					Most likely outcome based on team strengths and historical
					data
				</p>
			</div>

			{/* Champion Display */}
			<div className="champion-display">
				<div className="champion-trophy">🏆</div>
				<div className="champion-info">
					<span className="champion-label">Predicted Champion</span>
					<div className="champion-team">
						<img
							src={getFlagUrl(bracket.champion)}
							alt={`${bracket.champion} flag`}
							className="champion-flag"
							onError={(e) => {
								(e.target as HTMLImageElement).style.display =
									"none";
							}}
						/>
						<span className="champion-name">
							{bracket.champion}
						</span>
					</div>
					<span className="champion-prob">
						Final win probability:{" "}
						{Math.round(bracket.final.win_prob * 100)}%
					</span>
				</div>
			</div>

			{/* Bracket Grid */}
			<div
				className={`bracket-grid bracket-${
					format === "48_team" ? "48" : "32"
				}`}
			>
				{rounds.map((round) => (
					<RoundColumn
						key={round.title}
						title={round.title}
						matches={round.matches}
					/>
				))}
			</div>
		</div>
	);
}
