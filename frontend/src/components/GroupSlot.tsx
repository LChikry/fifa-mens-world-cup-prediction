import { useDroppable } from "@dnd-kit/core";
import type { Team } from "../types";
import { TeamCard } from "./TeamCard";

interface GroupSlotProps {
	groupName: string;
	teams: Team[];
	maxTeams: number;
	onRemoveTeam: (teamName: string) => void;
}

export function GroupSlot({
	groupName,
	teams,
	maxTeams,
	onRemoveTeam,
}: GroupSlotProps) {
	const { isOver, setNodeRef } = useDroppable({
		id: `group-${groupName}`,
		data: { groupName },
	});

	const emptySlots = maxTeams - teams.length;

	return (
		<div
			className={`group-slot ${isOver ? "drop-hover" : ""}`}
			ref={setNodeRef}
		>
			<div className="group-header">
				<h3>Group {groupName}</h3>
				<span className="team-count">
					{teams.length}/{maxTeams}
				</span>
			</div>
			<div className="group-teams">
				{teams.map((team) => (
					<TeamCard
						key={team.name}
						team={team}
						isInGroup={true}
						onRemove={() => onRemoveTeam(team.name)}
					/>
				))}
				{Array.from({ length: emptySlots }).map((_, i) => (
					<div key={`empty-${i}`} className="empty-slot">
						<span>Drop team here</span>
					</div>
				))}
			</div>
		</div>
	);
}
