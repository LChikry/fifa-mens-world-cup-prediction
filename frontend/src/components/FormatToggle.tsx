import type { TournamentFormat } from "../types";

interface FormatToggleProps {
	format: TournamentFormat;
	onChange: (format: TournamentFormat) => void;
	disabled?: boolean;
}

export function FormatToggle({
	format,
	onChange,
	disabled,
}: FormatToggleProps) {
	return (
		<div className="format-toggle">
			<span className="format-label">Tournament Format:</span>
			<div className="toggle-buttons">
				<button
					className={`toggle-btn ${
						format === "32_team" ? "active" : ""
					}`}
					onClick={() => onChange("32_team")}
					disabled={disabled}
				>
					<span className="format-teams">32 Teams</span>
					<span className="format-groups">8 Groups</span>
				</button>
				<button
					className={`toggle-btn ${
						format === "48_team" ? "active" : ""
					}`}
					onClick={() => onChange("48_team")}
					disabled={disabled}
				>
					<span className="format-teams">48 Teams</span>
					<span className="format-groups">12 Groups</span>
				</button>
			</div>
		</div>
	);
}
