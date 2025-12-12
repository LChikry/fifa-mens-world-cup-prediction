interface PresetOption {
	id: string;
	name: string;
	format: string;
}

interface PresetSelectorProps {
	onSelect: (presetId: string) => void;
	loading?: boolean;
}

const PRESETS: PresetOption[] = [
	{ id: "wc2022", name: "2022 FIFA World Cup", format: "32_team" },
	{ id: "wc2026", name: "2026 World Cup (Projected)", format: "48_team" },
];

export function PresetSelector({ onSelect, loading }: PresetSelectorProps) {
	return (
		<div className="preset-selector">
			<span className="preset-label">Quick Load:</span>
			<div className="preset-buttons">
				{PRESETS.map((preset) => (
					<button
						key={preset.id}
						className="preset-btn"
						onClick={() => onSelect(preset.id)}
						disabled={loading}
					>
						<span className="preset-name">{preset.name}</span>
						<span className="preset-format">
							{preset.format === "32_team"
								? "32 teams"
								: "48 teams"}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}
