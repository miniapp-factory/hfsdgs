"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const BOARD_SIZE = 4;
const TARGET = 2048;

function createEmptyBoard(): number[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function addRandomTile(board: number[][]): number[][] {
  const empty: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = value;
  return newBoard;
}

function slideAndMerge(row: number[]): { newRow: number[]; merged: boolean } {
  const filtered = row.filter(v => v !== 0);
  const newRow: number[] = [];
  let merged = false;
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      newRow.push(filtered[i] * 2);
      merged = true;
      i++; // skip next
    } else {
      newRow.push(filtered[i]);
    }
  }
  while (newRow.length < BOARD_SIZE) newRow.push(0);
  return { newRow, merged };
}

function moveLeft(board: number[][]): { newBoard: number[][]; merged: boolean } {
  let merged = false;
  const newBoard = board.map(row => {
    const { newRow, merged: rowMerged } = slideAndMerge(row);
    if (rowMerged) merged = true;
    return newRow;
  });
  return { newBoard, merged };
}

function moveRight(board: number[][]): { newBoard: number[][]; merged: boolean } {
  const reversed = board.map(row => [...row].reverse());
  const { newBoard: moved, merged } = moveLeft(reversed);
  const newBoard = moved.map(row => [...row].reverse());
  return { newBoard, merged };
}

function transpose(board: number[][]): number[][] {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function moveUp(board: number[][]): { newBoard: number[][]; merged: boolean } {
  const transposed = transpose(board);
  const { newBoard: moved, merged } = moveLeft(transposed);
  const newBoard = transpose(moved);
  return { newBoard, merged };
}

function moveDown(board: number[][]): { newBoard: number[][]; merged: boolean } {
  const transposed = transpose(board);
  const { newBoard: moved, merged } = moveRight(transposed);
  const newBoard = transpose(moved);
  return { newBoard, merged };
}

function hasMoves(board: number[][]): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < BOARD_SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < BOARD_SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>(createEmptyBoard());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    let b = createEmptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
  }, []);

  const handleMove = (dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    let moveFn;
    switch (dir) {
      case "up":
        moveFn = moveUp;
        break;
      case "down":
        moveFn = moveDown;
        break;
      case "left":
        moveFn = moveLeft;
        break;
      case "right":
        moveFn = moveRight;
        break;
    }
    const { newBoard, merged } = moveFn(board);
    if (!merged) return;
    const added = addRandomTile(newBoard);
    const newScore = added.flat().reduce((s, v) => s + v, 0);
    setBoard(added);
    setScore(newScore);
    if (added.flat().some(v => v >= TARGET)) setWon(true);
    if (!hasMoves(added)) setGameOver(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((v, idx) => (
          <div
            key={idx}
            className={`w-12 h-12 flex items-center justify-center rounded-md text-xl font-bold ${
              v === 0
                ? "bg-muted"
                : v < 8
                ? "bg-primary text-primary-foreground"
                : v < 16
                ? "bg-secondary text-secondary-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            {v !== 0 ? v : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => handleMove("up")}>↑</Button>
        <Button onClick={() => handleMove("left")}>←</Button>
        <Button onClick={() => handleMove("right")}>→</Button>
        <Button onClick={() => handleMove("down")}>↓</Button>
      </div>
      <div className="text-lg">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-semibold">
            {won ? "You won!" : "Game Over"}
          </div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
