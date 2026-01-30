// game/src/contexts/GameContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const GameContext = createContext(null);

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  // Connection state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [showWakeUpMessage, setShowWakeUpMessage] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Room state
  const [roomCode, setRoomCode] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [error, setError] = useState(null);

  // Game state
  const [currentGame, setCurrentGame] = useState(null); // 'gjett-bildet', 'slange', 'tallkamp', 'quiz', 'tidslinje', 'ja-eller-nei'
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, PLAYING, GAME_OVER
  const [gameData, setGameData] = useState(null); // Game-specific data

  // Initialize socket connection
  useEffect(() => {
    // Alltid bruk Render-serveren
    const SOCKET_SERVER_URL = 'https://game-p2u5.onrender.com';

    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
      setIsConnecting(false);
      setShowWakeUpMessage(false);
      setConnectionError(null);
      setMyPlayerId(newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError('Prøver å koble til serveren...');
      setIsConnected(false);
    });

    // Room events
    newSocket.on('room:created', ({ roomCode: code, game }) => {
      setRoomCode(code);
      setCurrentGame(game);
      setIsHost(true);
      setError(null);
    });

    newSocket.on('room:player-joined', ({ room, playerId, playerName: name }) => {
      setPlayers(room.players);
      if (!roomCode) {
        setRoomCode(room.code);
        setCurrentGame(room.game);
      }
      setError(null);
    });

    newSocket.on('room:player-left', ({ room }) => {
      setPlayers(room.players);
    });

    newSocket.on('room:join-error', ({ message }) => {
      setError(message);
    });

    newSocket.on('room:closed', () => {
      setError('Rommet ble stengt av verten.');
      resetGameState();
    });

    newSocket.on('room:kicked', () => {
      setError('Du ble fjernet fra spillet av læreren.');
      resetGameState();
    });

    // Game events
    newSocket.on('game:started', ({ room, gameData: data }) => {
      setGameState('PLAYING');
      setGameData(data);
      setPlayers(room.players);
    });

    newSocket.on('game:state-update', ({ gameData: data, players: updatedPlayers }) => {
      setGameData(data);
      if (updatedPlayers) setPlayers(updatedPlayers);
    });

    newSocket.on('game:ended', ({ room, results }) => {
      // Avslutt tar alle tilbake til startsiden
      setRoomCode(null);
      setPlayers([]);
      setIsHost(false);
      setCurrentGame(null);
      setGameState('LOBBY');
      setGameData(null);
    });

    newSocket.on('game:state-sync', ({ room }) => {
      setGameState(room.gameState);
      setCurrentGame(room.game);
      setGameData(room.gameData);
      setPlayers(room.players);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Server wake-up timer
  useEffect(() => {
    let timer;
    if (isConnecting && !isConnected) {
      timer = setTimeout(() => setShowWakeUpMessage(true), 5000);
    } else {
      setShowWakeUpMessage(false);
    }
    return () => clearTimeout(timer);
  }, [isConnecting, isConnected]);

  const resetGameState = () => {
    setRoomCode(null);
    setPlayers([]);
    setIsHost(false);
    setCurrentGame(null);
    setGameState('LOBBY');
    setGameData(null);
  };

  // Host actions
  const createRoom = useCallback((game) => {
    if (socket) {
      socket.emit('host:create-room', { game });
    }
  }, [socket]);

  const startGame = useCallback((config = {}) => {
    if (socket && isHost) {
      socket.emit('host:start-game', config);
    }
  }, [socket, isHost]);

  const endGame = useCallback(() => {
    if (socket && isHost) {
      socket.emit('host:end-game');
    }
  }, [socket, isHost]);

  const kickPlayer = useCallback((playerId) => {
    if (socket && isHost) {
      socket.emit('host:kick-player', { playerId });
    }
  }, [socket, isHost]);

const sendGameAction = useCallback((action, data = {}) => {
  if (socket && isHost) {
    // Vi sender action og data som to separate felt i ett objekt
    socket.emit('host:game-action', { action, data });
  }
}, [socket, isHost]);

  // Player actions
  const joinRoom = useCallback(({ playerName: name, roomCode: code }) => {
    if (socket) {
      setPlayerName(name);
      socket.emit('player:join-room', { roomCode: code, playerName: name });
    }
  }, [socket]);

const sendPlayerAction = useCallback((action, data = {}) => {
  if (socket && !isHost) {
    // Samme her for spiller-handlinger
    socket.emit('player:game-action', { action, data });
  }
}, [socket, isHost]);

  // Retry connection
  const retryConnection = useCallback(() => {
    if (socket) {
      setIsConnecting(true);
      setShowWakeUpMessage(false);
      setConnectionError(null);
      socket.connect();
    }
  }, [socket]);

  // Utility
  const getGamePhase = () => {
    if (gameState === 'PLAYING') {
      return isHost ? 'HOST_GAME' : 'PLAYER_GAME';
    }
    if (gameState === 'GAME_OVER') {
      return 'GAME_OVER';
    }
    if (roomCode && isHost) {
      return 'HOST_LOBBY';
    }
    if (roomCode && !isHost) {
      return 'PLAYER_LOBBY';
    }
    return 'INITIAL_SETUP';
  };

  const value = {
    // Connection
    socket,
    isConnected,
    isConnecting,
    showWakeUpMessage,
    connectionError,
    retryConnection,

    // Room
    roomCode,
    players,
    isHost,
    playerName,
    myPlayerId,
    error,
    setError,

    // Game state
    currentGame,
    gameState,
    gameData,
    setGameData,

    // Host actions
    createRoom,
    startGame,
    endGame,
    kickPlayer,
    sendGameAction,

    // Player actions
    joinRoom,
    sendPlayerAction,

    // Utility
    getGamePhase,
    resetGameState,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
