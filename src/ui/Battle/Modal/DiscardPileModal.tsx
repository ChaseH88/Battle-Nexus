import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  closeDiscardPileModal,
  openCardDetailModal,
} from "../../../store/uiSlice";
import { Card } from "../Card/Card";
import {
  StyledDialog,
  StyledDialogTitle,
  StyledDialogContent,
  CardsGrid,
  CardWrapper,
  EmptyState,
} from "./DiscardPileModal.styled";

export const DiscardPileModal = () => {
  const dispatch = useAppDispatch();
  const { isOpen, discardPile, playerIndex, playerName } = useAppSelector(
    (state) => state.ui.discardPileModal,
  );

  const handleClose = () => {
    dispatch(closeDiscardPileModal());
  };

  const handleCardClick = (card: any) => {
    dispatch(
      openCardDetailModal({
        card,
        activeEffects: [],
        playerIndex,
      }),
    );
  };

  return (
    <StyledDialog open={isOpen} onClose={handleClose} maxWidth="lg">
      <StyledDialogTitle>
        {playerName}'s Discard Pile ({discardPile.length})
      </StyledDialogTitle>
      <StyledDialogContent>
        {discardPile.length === 0 ? (
          <EmptyState>No cards in discard pile</EmptyState>
        ) : (
          <CardsGrid>
            {discardPile.map((card, index) => (
              <CardWrapper
                key={`${card.id}-${index}`}
                onClick={() => handleCardClick(card)}
              >
                <Card
                  card={card}
                  isSelected={false}
                  showFaceDown={false}
                  canActivate={false}
                  playerIndex={playerIndex}
                  activeEffects={[]}
                />
              </CardWrapper>
            ))}
          </CardsGrid>
        )}
      </StyledDialogContent>
    </StyledDialog>
  );
};
