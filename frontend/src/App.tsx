import { useEffect, useState } from "react";
import { BracketBuilder } from "./components";
import { Team } from "./types";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
	const [teams, setTeams] = useState<Team[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchTeams() {
			try {
				const response = await fetch(`${API_URL}/api/teams`);
				if (!response.ok) {
					throw new Error(
						`Failed to fetch teams: ${response.status}`
					);
				}
				const data = await response.json();
				setTeams(data);
				setError(null);
			} catch (err) {
				console.error("Failed to fetch teams:", err);
				setError(
					"Failed to connect to the server. Please make sure the backend is running."
				);
			} finally {
				setLoading(false);
			}
		}

		fetchTeams();
	}, []);

	if (loading) {
		return (
			<div className="app-loading">
				<div className="spinner"></div>
				<p>Loading teams...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="app-error">
				<h1>Connection Error</h1>
				<p>{error}</p>
				<button onClick={() => window.location.reload()}>Retry</button>
			</div>
		);
	}

	return <BracketBuilder teams={teams} />;
}

export default App;
