import { useState } from "react";

interface MethodologyPanelProps {
	isOpen: boolean;
	onClose: () => void;
}

interface AccordionItemProps {
	title: string;
	icon: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}

function AccordionItem({ title, icon, children, defaultOpen = false }: AccordionItemProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className={`accordion-item ${isOpen ? "open" : ""}`}>
			<button
				className="accordion-header"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
			>
				<span className="accordion-icon">{icon}</span>
				<span className="accordion-title">{title}</span>
				<span className={`accordion-chevron ${isOpen ? "rotated" : ""}`}>
					▾
				</span>
			</button>
			<div className={`accordion-content ${isOpen ? "expanded" : ""}`}>
				<div className="accordion-body">{children}</div>
			</div>
		</div>
	);
}

export function MethodologyPanel({ isOpen, onClose }: MethodologyPanelProps) {
	if (!isOpen) return null;

	return (
		<div className="methodology-overlay" onClick={onClose}>
			<div
				className="methodology-panel"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="methodology-header">
					<h2>How It Works</h2>
					<p className="methodology-subtitle">
						Machine Learning-Powered World Cup Predictions
					</p>
					<button
						className="methodology-close"
						onClick={onClose}
						aria-label="Close"
					>
						×
					</button>
				</header>

				<div className="methodology-content">
					<AccordionItem
						title="Data Sources"
						icon="📊"
						defaultOpen={true}
					>
						<div className="data-sources">
							<div className="data-card">
								<h4>International Match Results</h4>
								<p className="data-meta">2010 – Present</p>
								<p>
									14,000+ international football matches including
									World Cups, continental championships, and
									qualifiers. Each match provides goals, venue,
									and tournament context.
								</p>
							</div>
							<div className="data-card">
								<h4>EA Sports FC Player Ratings</h4>
								<p className="data-meta">FIFA 15–24</p>
								<p>
									Comprehensive player statistics from EA Sports
									FC (formerly FIFA). We aggregate the top 14
									players per national team, analyzing overall
									rating, pace, shooting, passing, and defensive
									attributes.
								</p>
							</div>
							<div className="data-card">
								<h4>FIFA World Rankings</h4>
								<p className="data-meta">Official Rankings</p>
								<p>
									FIFA's official country rankings provide
									additional context, though our custom Elo system
									proves more predictive for match outcomes.
								</p>
							</div>
						</div>
					</AccordionItem>

					<AccordionItem title="ML Prediction Pipeline" icon="🧠">
						<div className="pipeline-section">
							<div className="pipeline-intro">
								<p>
									Our prediction system uses a three-stage pipeline
									that predicts <strong>goals, not outcomes</strong>.
									This approach captures more information—a 5-0 win
									is fundamentally different from a 1-0 win.
								</p>
							</div>

							<div className="pipeline-steps">
								<div className="pipeline-step">
									<div className="step-number">1</div>
									<div className="step-content">
										<h4>Dual XGBoost Regression</h4>
										<p>
											Two separate gradient boosting models predict
											expected goals for home and away teams. Each
											model uses 2,000 trees with early stopping,
											learning rate of 0.01, and max depth of 4 to
											prevent overfitting.
										</p>
										<div className="tech-badge-group">
											<span className="tech-badge">XGBoost 2.0</span>
											<span className="tech-badge">GPU Accelerated</span>
										</div>
									</div>
								</div>

								<div className="pipeline-step">
									<div className="step-number">2</div>
									<div className="step-content">
										<h4>Poisson Distribution</h4>
										<p>
											The predicted goals become the λ (lambda)
											parameter for a Poisson distribution—the
											mathematically proven model for rare,
											independent events like goal-scoring.
										</p>
										<div className="formula">
											P(k goals) = (λᵏ × e⁻ᵡ) / k!
										</div>
									</div>
								</div>

								<div className="pipeline-step">
									<div className="step-number">3</div>
									<div className="step-content">
										<h4>Monte Carlo Simulation</h4>
										<p>
											We run 10,000+ simulated matches to generate
											robust win/draw/loss probabilities. For
											tournaments, we simulate the entire bracket
											hundreds of times to estimate championship
											odds.
										</p>
										<div className="tech-badge-group">
											<span className="tech-badge">CuPy</span>
											<span className="tech-badge">Vectorized</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</AccordionItem>

					<AccordionItem title="Contextual Features" icon="⚡">
						<div className="features-section">
							<p className="features-intro">
								Accurate predictions rely on rich contextual data.
								Our model uses 30+ features across four categories:
							</p>

							<div className="feature-grid">
								<div className="feature-card">
									<div className="feature-icon">📈</div>
									<h4>Elo Ratings</h4>
									<p>
										Dynamic team strength calculated from 14 years
										of match history. Updated after every game
										using the classic Elo formula (K=32).
									</p>
								</div>

								<div className="feature-card">
									<div className="feature-icon">⚽</div>
									<h4>Squad Quality</h4>
									<p>
										Average ratings of top 14 players, split by
										position group: attackers (ST, CF, LW, RW) and
										defenders (CB, LB, RB, CDM, GK).
									</p>
								</div>

								<div className="feature-card">
									<div className="feature-icon">🔥</div>
									<h4>Recent Form</h4>
									<p>
										Rolling 5-match statistics: goals scored,
										goals conceded, and win rate. Captures current
										momentum and team cohesion.
									</p>
								</div>

								<div className="feature-card">
									<div className="feature-icon">🏟️</div>
									<h4>Match Context</h4>
									<p>
										Tournament importance (World Cup vs. friendly),
										neutral venue flag, and continental competition
										indicators affect playing intensity.
									</p>
								</div>
							</div>
						</div>
					</AccordionItem>

					<AccordionItem title="Tech Stack" icon="🛠️">
						<div className="tech-stack-section">
							<div className="stack-category">
								<h4>Machine Learning</h4>
								<div className="stack-items">
									<div className="stack-item">
										<span className="stack-name">XGBoost</span>
										<span className="stack-desc">
											Gradient boosting for goal prediction
										</span>
									</div>
									<div className="stack-item">
										<span className="stack-name">scikit-learn</span>
										<span className="stack-desc">
											Model evaluation & preprocessing
										</span>
									</div>
									<div className="stack-item">
										<span className="stack-name">CuPy</span>
										<span className="stack-desc">
											GPU-accelerated simulations
										</span>
									</div>
									<div className="stack-item">
										<span className="stack-name">SciPy</span>
										<span className="stack-desc">
											Poisson distribution calculations
										</span>
									</div>
								</div>
							</div>

							<div className="stack-category">
								<h4>Backend</h4>
								<div className="stack-items">
									<div className="stack-item">
										<span className="stack-name">Python 3.11</span>
										<span className="stack-desc">Core runtime</span>
									</div>
									<div className="stack-item">
										<span className="stack-name">FastAPI</span>
										<span className="stack-desc">
											High-performance async API
										</span>
									</div>
									<div className="stack-item">
										<span className="stack-name">Pandas</span>
										<span className="stack-desc">
											Data manipulation & feature engineering
										</span>
									</div>
								</div>
							</div>

							<div className="stack-category">
								<h4>Frontend</h4>
								<div className="stack-items">
									<div className="stack-item">
										<span className="stack-name">React 18</span>
										<span className="stack-desc">UI framework</span>
									</div>
									<div className="stack-item">
										<span className="stack-name">TypeScript</span>
										<span className="stack-desc">Type safety</span>
									</div>
									<div className="stack-item">
										<span className="stack-name">Vite</span>
										<span className="stack-desc">
											Build tooling & dev server
										</span>
									</div>
									<div className="stack-item">
										<span className="stack-name">dnd-kit</span>
										<span className="stack-desc">
											Drag-and-drop interactions
										</span>
									</div>
								</div>
							</div>
						</div>
					</AccordionItem>

					<AccordionItem title="Model Performance" icon="🎯">
						<div className="performance-section">
							<div className="metrics-grid">
								<div className="metric-card">
									<div className="metric-value">~1.3</div>
									<div className="metric-label">Goals RMSE</div>
									<div className="metric-desc">
										Root mean squared error for predicted goals
									</div>
								</div>
								<div className="metric-card">
									<div className="metric-value">~55%</div>
									<div className="metric-label">Outcome Accuracy</div>
									<div className="metric-desc">
										Correct win/draw/loss predictions
									</div>
								</div>
								<div className="metric-card">
									<div className="metric-value">30+</div>
									<div className="metric-label">Features</div>
									<div className="metric-desc">
										Contextual signals per match
									</div>
								</div>
								<div className="metric-card">
									<div className="metric-value">150+</div>
									<div className="metric-label">Countries</div>
									<div className="metric-desc">
										Teams with full data coverage
									</div>
								</div>
							</div>

							<div className="validation-note">
								<h4>2022 World Cup Validation</h4>
								<p>
									The model correctly identified Argentina as a top
									contender and accurately predicted several group
									stage outcomes. Tournament simulation showed
									Argentina with ~15% championship probability—among
									the highest of all teams.
								</p>
							</div>
						</div>
					</AccordionItem>
				</div>

				<footer className="methodology-footer">
					<p>
						Built with data from 2010–2024. Model trained on pre-2022
						matches, validated on 2022 World Cup.
					</p>
				</footer>
			</div>
		</div>
	);
}

