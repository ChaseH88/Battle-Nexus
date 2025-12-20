interface AIControlsProps {
  aiSkillLevel: number;
  onSkillChange: (level: number) => void;
}

export const AIControls = ({
  aiSkillLevel,
  onSkillChange,
}: AIControlsProps) => (
  <div className="ai-controls">
    <div className="skill-selector">
      <label>AI Skill Level: {aiSkillLevel}</label>
      <input
        type="range"
        min="1"
        max="10"
        value={aiSkillLevel}
        onChange={(e) => onSkillChange(parseInt(e.target.value))}
      />
      <div className="skill-labels">
        <span>Beginner</span>
        <span>Intermediate</span>
        <span>Expert</span>
      </div>
    </div>
  </div>
);
