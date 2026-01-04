import styled from "styled-components";

export const MaxDeckDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: rgba(96, 165, 250, 0.1);
  border: 2px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 80px;

  &:hover {
    background: rgba(96, 165, 250, 0.2);
    border-color: rgba(96, 165, 250, 0.5);
    transform: translateY(-2px);
  }
`;

export const MaxDeckTitle = styled.div`
  font-weight: bold;
  font-size: 0.9rem;
  color: #60a5fa;
  text-align: center;
`;

export const MaxDeckGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  color: #e2e8f0;
`;

export const MaxDeckModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const MaxDeckModalContent = styled.div`
  background: #1e293b;
  border-radius: 12px;
  border: 3px solid #60a5fa;
  padding: 24px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(96, 165, 250, 0.4);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

export const MaxDeckModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(96, 165, 250, 0.3);
  position: relative;

  h2 {
    margin: 0;
    color: #60a5fa;
    font-size: 1.8rem;
  }

  div {
    color: #e2e8f0;
    font-size: 1.2rem;
    font-weight: bold;
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: -8px;
  right: 0;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 2.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: all 0.2s ease;

  &:hover {
    color: #60a5fa;
    transform: scale(1.1);
  }
`;

export const MaxDeckModalCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  overflow-y: auto;
  padding: 8px;
  max-height: calc(90vh - 140px);

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(96, 165, 250, 0.1);
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(96, 165, 250, 0.4);
    border-radius: 5px;

    &:hover {
      background: rgba(96, 165, 250, 0.6);
    }
  }
`;

export const MaxDeckCardWrapper = styled.div<{ canafford: string }>`
  position: relative;
  cursor: ${(props) =>
    props.canafford === "true" ? "pointer" : "not-allowed"};
  transition: all 0.2s ease;
  opacity: ${(props) => (props.canafford === "true" ? "1" : "0.6")};

  &:hover {
    transform: ${(props) =>
      props.canafford === "true" ? "translateY(-4px) scale(1.02)" : "none"};
    filter: ${(props) =>
      props.canafford === "true" ? "brightness(1.1)" : "none"};
  }
`;

export const MaxDeckCardCost = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  padding: 6px 12px;
  border-radius: 50%;
  border: 3px solid #1e293b;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.5);
  z-index: 10;
  min-width: 40px;
  text-align: center;
`;
