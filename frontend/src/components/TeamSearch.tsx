import { useState, useMemo } from "react";
import { Team } from "../types";
import { TeamCard } from "./TeamCard";

interface TeamSearchProps {
	teams: Team[];
	assignedTeams: Set<string>;
}

export function TeamSearch({ teams, assignedTeams }: TeamSearchProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredTeams = useMemo(() => {
		const query = searchQuery.toLowerCase();
		return teams
			.filter(
				(team) =>
					!assignedTeams.has(team.name) &&
					team.name.toLowerCase().includes(query)
			)
			.slice(0, 50); // Limit displayed teams for performance
	}, [teams, assignedTeams, searchQuery]);

	const availableCount = teams.length - assignedTeams.size;

	return (
		<div className="team-search">
			<div className="search-header">
				<h2>Available Teams</h2>
				<span className="available-count">{availableCount} teams</span>
			</div>
			<input
				type="text"
				placeholder="Search countries..."
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				className="search-input"
			/>
			<div className="team-list">
				{filteredTeams.length === 0 ? (
					<div className="no-results">
						{searchQuery
							? "No teams match your search"
							: "All teams assigned"}
					</div>
				) : (
					filteredTeams.map((team) => (
						<TeamCard key={team.name} team={team} />
					))
				)}
			</div>
		</div>
	);
}
