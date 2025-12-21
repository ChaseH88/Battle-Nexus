import {
  AIControlsContainer,
  SkillSelector,
  SkillLabel,
  StyledSlider,
  SkillLabels,
} from "./styled";

interface AIControlsProps {
  aiSkillLevel: number;
  onSkillChange: (level: number) => void;
}

export const AIControls = ({
  aiSkillLevel,
  onSkillChange,
}: AIControlsProps) => (
  <AIControlsContainer>
    <SkillSelector>
      <SkillLabel>AI Skill Level: {aiSkillLevel}</SkillLabel>
      <StyledSlider
        min={1}
        max={10}
        value={aiSkillLevel}
        onChange={(_, value) => onSkillChange(value as number)}
      />
      <SkillLabels>
        <span>Beginner</span>
        <span>Intermediate</span>
        <span>Expert</span>
      </SkillLabels>
    </SkillSelector>
  </AIControlsContainer>
);
