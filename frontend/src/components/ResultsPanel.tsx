import type { SimulationResult } from "../types";

interface ResultsPanelProps {
	results: SimulationResult | null;
	loading?: boolean;
	presetName?: string;
	compact?: boolean;
}

export function ResultsPanel({
	results,
	loading,
	presetName,
	compact = false,
}: ResultsPanelProps) {
	if (loading) {
		return (
			<div
				className={`results-panel loading ${compact ? "compact" : ""}`}
			>
				<div className="spinner"></div>
				<p>Running simulation...</p>
			</div>
		);
	}

	if (!results) {
		return (
			<div className={`results-panel empty ${compact ? "compact" : ""}`}>
				<p>
					{compact
						? "Run simulation to see probabilities"
						: 'Configure groups and click "Run Simulation" to see predictions'}
				</p>
			</div>
		);
	}

	// Sort champions by count and get probabilities
	// Show top 10 in compact mode, top 15 otherwise
	const sortedChampions = Object.entries(results.champions)
		.sort(([, a], [, b]) => b - a)
		.slice(0, compact ? 10 : 15);

	const maxCount = sortedChampions[0]?.[1] || 1;

	return (
		<div className={`results-panel ${compact ? "compact" : ""}`}>
			<h3 className="results-title">
				Win Probabilities
				{presetName && (
					<span className="preset-badge">{presetName}</span>
				)}
			</h3>
			<p className="sim-info">
				{results.n_sims.toLocaleString()} simulations
			</p>

			<div className="results-chart">
				{sortedChampions.map(([team, count], index) => {
					const probability = (count / results.n_sims) * 100;
					const barWidth = (count / maxCount) * 100;

					return (
						<div key={team} className="chart-row">
							<span className="rank">{index + 1}</span>
							<span className="team-name">{team}</span>
							<div className="bar-container">
								<div
									className="bar"
									style={{ width: `${barWidth}%` }}
								/>
								<span className="percentage">
									{probability.toFixed(1)}%
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
