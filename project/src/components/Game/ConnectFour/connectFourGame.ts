import { ConnectFourBoard } from './boardCanvas';
import { BoardPiece } from './boardBase';
import { PlayerHuman } from './player';
import { PlayerAi } from './playerAi';
import { getColumnFromCoord, animationFrame } from './utils';
import { GameBase } from './gameBase';

export type ConnectFourCallbacks = {
  onStatus: (text: string) => void;
  onGameOver: (payload: { draw: boolean; message: string }) => void;
};

class GameLocalAi extends GameBase {
  private callbacks: ConnectFourCallbacks;

  constructor(
    players: [PlayerHuman, PlayerAi],
    board: ConnectFourBoard,
    callbacks: ConnectFourCallbacks
  ) {
    super(players, board);
    this.callbacks = callbacks;
  }

  beforeMoveApplied(action: number) {
    void action;
    const currentPlayer = this.players[this.currentPlayerId];
    const side =
      currentPlayer.boardPiece === BoardPiece.PLAYER_1 ? 'красные' : 'синие';
    this.callbacks.onStatus(`Падает фишка (${side})…`);
  }

  waitingForMove() {
    if (!this.isMoveAllowed || this.isGameWon) return;
    const currentPlayer = this.players[this.currentPlayerId];
    if (currentPlayer instanceof PlayerAi) {
      this.callbacks.onStatus('Противник думает…');
    } else {
      this.callbacks.onStatus(
        `${currentPlayer.label}: ваш ход — кликните по столбцу.`
      );
    }
  }

  afterMove() {}

  override announceWinner(winnerBoardPiece: BoardPiece) {
    if (winnerBoardPiece === BoardPiece.EMPTY) return;
    let message: string;
    const draw = winnerBoardPiece === BoardPiece.DRAW;
    if (draw) {
      message = 'Ничья.';
    } else {
      const winnerPlayer = this.players.find(
        (p) => p.boardPiece === winnerBoardPiece
      );
      message = winnerPlayer
        ? `${winnerPlayer.label} победил!`
        : 'Игра окончена.';
    }
    this.callbacks.onStatus('Игра окончена');
    this.callbacks.onGameOver({ draw, message });
  }
}

export type ConnectFourController = {
  end: () => void;
  playAgain: () => Promise<void>;
};

export function initConnectFourVsAi(
  canvas: HTMLCanvasElement,
  callbacks: ConnectFourCallbacks,
  humanLabel = 'Вы'
): ConnectFourController {
  const board = new ConnectFourBoard(canvas);
  const firstPlayer = new PlayerHuman(BoardPiece.PLAYER_1, humanLabel);
  const aiPlayer = new PlayerAi(BoardPiece.PLAYER_2, 'Противник');
  const game = new GameLocalAi([firstPlayer, aiPlayer], board, callbacks);

  void game.start();

  async function handleCanvasClick(event: MouseEvent) {
    if (game.isGameEnded) return;
    if (game.isGameWon) {
      game.reset();
      await animationFrame();
      callbacks.onStatus(
        `${firstPlayer.label}: ваш ход — кликните по столбцу.`
      );
      void game.start();
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const column = getColumnFromCoord({ x, y });
    if (game.currentPlayerId === 0) {
      firstPlayer.doAction(column);
    }
  }

  canvas.addEventListener('click', handleCanvasClick);

  return {
    end: () => {
      game.end();
      canvas.removeEventListener('click', handleCanvasClick);
    },
    playAgain: async () => {
      if (game.isGameEnded) return;
      game.reset();
      await animationFrame();
      callbacks.onStatus(
        `${firstPlayer.label}: ваш ход — кликните по столбцу.`
      );
      void game.start();
    },
  };
}
