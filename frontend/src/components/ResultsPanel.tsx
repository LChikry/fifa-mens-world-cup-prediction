import { SimulationResult } from "../types";

interface ResultsPanelProps {
	results: SimulationResult | null;
	loading?: boolean;
	presetName?: string;
}

export function ResultsPanel({
	results,
	loading,
	presetName,
}: ResultsPanelProps) {
	if (loading) {
		return (
			<div className="results-panel loading">
				<div className="spinner"></div>
				<p>Running simulation...</p>
			</div>
		);
	}

	if (!results) {
		return (
			<div className="results-panel empty">
				<p>
					Configure groups and click "Run Simulation" to see
					predictions
				</p>
			</div>
		);
	}

	// Sort champions by count and get probabilities
	const sortedChampions = Object.entries(results.champions)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 15);

	const maxCount = sortedChampions[0]?.[1] || 1;

	return (
		<div className="results-panel">
			<h2>
				Championship Probabilities
				{presetName && (
					<span className="preset-badge">{presetName}</span>
				)}
			</h2>
			<p className="sim-info">
				Based on {results.n_sims.toLocaleString()} simulations
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

			{results.finalists && Object.keys(results.finalists).length > 0 && (
				<div className="secondary-results">
					<h3>Most Likely Finalists</h3>
					<div className="finalists-list">
						{Object.entries(results.finalists)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 8)
							.map(([team, count]) => (
								<div key={team} className="finalist-item">
									<span className="team">{team}</span>
									<span className="prob">
										{(
											(count / results.n_sims) *
											100
										).toFixed(1)}
										%
									</span>
								</div>
							))}
					</div>
				</div>
			)}
		</div>
	);
}
