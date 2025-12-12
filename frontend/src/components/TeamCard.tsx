import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Team } from "../types";

interface TeamCardProps {
	team: Team;
	isDragging?: boolean;
	isInGroup?: boolean;
	onRemove?: () => void;
}

export function TeamCard({
	team,
	isDragging,
	isInGroup,
	onRemove,
}: TeamCardProps) {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: team.name,
		data: { team },
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={`team-card ${isInGroup ? "in-group" : ""} ${
				isDragging ? "dragging" : ""
			}`}
		>
			<img
				src={team.flag_url}
				alt={`${team.name} flag`}
				className="team-flag"
				onError={(e) => {
					(
						e.target as HTMLImageElement
					).src = `https://flagcdn.com/w80/${team.iso_code}.png`;
				}}
			/>
			<div className="team-info">
				<span className="team-name">{team.name}</span>
				{!isInGroup && (
					<span className="team-elo">Elo: {team.elo_rating}</span>
				)}
			</div>
			{isInGroup && onRemove && (
				<button
					className="remove-btn"
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					title="Remove from group"
				>
					×
				</button>
			)}
		</div>
	);
}
