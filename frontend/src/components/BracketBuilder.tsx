import { useState, useCallback, useMemo } from "react";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type {
	Team,
	Groups,
	TournamentFormat,
	SimulationResult,
	Preset,
} from "../types";
import { TeamCard } from "./TeamCard";
import { GroupSlot } from "./GroupSlot";
import { TeamSearch } from "./TeamSearch";
import { FormatToggle } from "./FormatToggle";
import { PresetSelector } from "./PresetSelector";
import { ResultsPanel } from "./ResultsPanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface BracketBuilderProps {
	teams: Team[];
}

function createEmptyGroups(format: TournamentFormat): Groups {
	const numGroups = format === "32_team" ? 8 : 12;
	const groups: Groups = {};
	for (let i = 0; i < numGroups; i++) {
		groups[String.fromCharCode(65 + i)] = [];
	}
	return groups;
}

export function BracketBuilder({ teams }: BracketBuilderProps) {
	const [format, setFormat] = useState<TournamentFormat>("32_team");
	const [groups, setGroups] = useState<Groups>(createEmptyGroups("32_team"));
	const [results, setResults] = useState<SimulationResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [presetName, setPresetName] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		})
	);

	// Get all assigned team names
	const assignedTeams = useMemo(() => {
		const assigned = new Set<string>();
		Object.values(groups).forEach((groupTeams) => {
			groupTeams.forEach((teamName) => assigned.add(teamName));
		});
		return assigned;
	}, [groups]);

	// Get Team object by name
	const getTeamByName = useCallback(
		(name: string): Team | undefined => {
			return teams.find((t) => t.name === name);
		},
		[teams]
	);

	// Handle format change
	const handleFormatChange = useCallback((newFormat: TournamentFormat) => {
		setFormat(newFormat);
		setGroups(createEmptyGroups(newFormat));
		setResults(null);
		setPresetName(null);
	}, []);

	// Handle drag start
	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	}, []);

	// Handle drag end
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			setActiveId(null);
			const { active, over } = event;

			if (!over) return;

			const teamName = active.id as string;
			const targetId = over.id as string;

			// Check if dropping on a group
			if (targetId.startsWith("group-")) {
				const groupName = targetId.replace("group-", "");

				// Remove from any existing group first
				const newGroups = { ...groups };
				Object.keys(newGroups).forEach((g) => {
					newGroups[g] = newGroups[g].filter((t) => t !== teamName);
				});

				// Add to new group if not full
				if (newGroups[groupName].length < 4) {
					newGroups[groupName] = [...newGroups[groupName], teamName];
					setGroups(newGroups);
					setPresetName(null); // Clear preset name when manually editing
				}
			}
		},
		[groups]
	);

	// Remove team from group
	const handleRemoveTeam = useCallback(
		(groupName: string, teamName: string) => {
			setGroups((prev) => ({
				...prev,
				[groupName]: prev[groupName].filter((t) => t !== teamName),
			}));
			setPresetName(null);
		},
		[]
	);

	// Load preset
	const handleLoadPreset = useCallback(async (presetId: string) => {
		setLoading(true);
		try {
			const response = await fetch(`${API_URL}/api/presets/${presetId}`);
			if (!response.ok) throw new Error("Failed to load preset");

			const preset: Preset = await response.json();

			// Update format
			const newFormat = preset.format as TournamentFormat;
			setFormat(newFormat);

			// Update groups
			setGroups(preset.groups);
			setPresetName(preset.name);

			// If preset has pre-computed results, show them
			if (preset.champions) {
				setResults({
					champions: preset.champions,
					finalists: preset.finalists || {},
					semifinalists: preset.semifinalists || {},
					n_sims: preset.metadata?.n_sims || 1000,
				});
			} else {
				setResults(null);
			}
		} catch (error) {
			console.error("Failed to load preset:", error);
			alert("Failed to load preset. Make sure the backend is running.");
		} finally {
			setLoading(false);
		}
	}, []);

	// Run simulation
	const handleRunSimulation = useCallback(async () => {
		// Validate all groups are complete
		const requiredTeams = 4;
		const incompleteGroups = Object.entries(groups)
			.filter(([, teams]) => teams.length !== requiredTeams)
			.map(([name]) => name);

		if (incompleteGroups.length > 0) {
			alert(
				`Please fill all groups with 4 teams. Incomplete groups: ${incompleteGroups.join(
					", "
				)}`
			);
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`${API_URL}/api/simulate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					groups,
					format,
					n_sims: 200, // Reasonable default for web
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.detail || "Simulation failed");
			}

			const result: SimulationResult = await response.json();
			setResults(result);
			setPresetName(null);
		} catch (error) {
			console.error("Simulation failed:", error);
			alert(
				`Simulation failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		} finally {
			setLoading(false);
		}
	}, [groups, format]);

	// Clear all groups
	const handleClearAll = useCallback(() => {
		setGroups(createEmptyGroups(format));
		setResults(null);
		setPresetName(null);
	}, [format]);

	// Get active team for drag overlay
	const activeTeam = activeId ? getTeamByName(activeId) : null;

	// Convert group team names to Team objects
	const getGroupTeams = useCallback(
		(groupTeamNames: string[]): Team[] => {
			return groupTeamNames
				.map((name) => getTeamByName(name))
				.filter((t): t is Team => t !== undefined);
		},
		[getTeamByName]
	);

	const numGroups = format === "32_team" ? 8 : 12;

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="bracket-builder">
				<header className="builder-header">
					<h1>World Cup Bracket Predictor</h1>
					<div className="header-controls">
						<FormatToggle
							format={format}
							onChange={handleFormatChange}
							disabled={loading}
						/>
						<PresetSelector
							onSelect={handleLoadPreset}
							loading={loading}
						/>
					</div>
				</header>

				<div className="builder-content">
					<aside className="teams-sidebar">
						<TeamSearch
							teams={teams}
							assignedTeams={assignedTeams}
						/>
					</aside>

					<main className="groups-area">
						<div className="groups-header">
							<h2>Tournament Groups</h2>
							<div className="groups-actions">
								<button
									className="btn btn-secondary"
									onClick={handleClearAll}
									disabled={loading}
								>
									Clear All
								</button>
								<button
									className="btn btn-primary"
									onClick={handleRunSimulation}
									disabled={
										loading ||
										assignedTeams.size !== numGroups * 4
									}
								>
									{loading ? "Running..." : "Run Simulation"}
								</button>
							</div>
						</div>

						{/* Loading and Results shown above groups */}
						{loading && (
							<div className="simulation-loading">
								<div className="spinner"></div>
								<p>Running simulation...</p>
							</div>
						)}

						{!loading && results && (
							<div className="simulation-results">
								<ResultsPanel
									results={results}
									loading={false}
									presetName={presetName || undefined}
								/>
							</div>
						)}

						<div className={`groups-grid groups-${numGroups}`}>
							{Object.entries(groups).map(
								([groupName, teamNames]) => (
									<GroupSlot
										key={groupName}
										groupName={groupName}
										teams={getGroupTeams(teamNames)}
										maxTeams={4}
										onRemoveTeam={(teamName) =>
											handleRemoveTeam(
												groupName,
												teamName
											)
										}
									/>
								)
							)}
						</div>
					</main>
				</div>
			</div>

			<DragOverlay>
				{activeTeam && <TeamCard team={activeTeam} isDragging />}
			</DragOverlay>
		</DndContext>
	);
}
