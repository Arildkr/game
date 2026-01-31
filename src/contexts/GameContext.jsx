// game/src/contexts/GameContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY_IDLE, LOBBY_GAME_SELECTED, LOBBY, PLAYING, GAME_OVER
  const [gameData, setGameData] = useState(null); // Game-specific data

  // Lobby state
  const [lobbyData, setLobbyData] = useState({
    totalScore: 0,
    leaderboard: [],
    playerScores: {}
  });

  // Ref for å unngå stale closures i socket handlers
  const roomCodeRef = useRef(roomCode);
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  // Funksjon for å nullstille state (definert før useEffect)
  const doResetGameState = useCallback(() => {
    setRoomCode(null);
    setPlayers([]);
    setIsHost(false);
    setCurrentGame(null);
    setGameState('LOBBY');
    setGameData(null);
    setLobbyData({ totalScore: 0, leaderboard: [], playerScores: {} });
  }, []);

  // Initialize socket connection - kjører kun én gang ved mount
  useEffect(() => {
    // Alltid bruk Render-serveren
    const SOCKET_SERVER_URL = 'https://game-p2u5.onrender.com';

    const newSocket = io(SOCKET_SERVER_URL, {
      // Bruk polling først for bedre kompatibilitet med Render cold starts
      transports: ['polling', 'websocket'],
      // Øk timeout for trege cold starts
      timeout: 45000,
      // Reduser aggressiv reconnection
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      // Ikke koble fra ved feil - la socket.io håndtere det
      forceNew: false,
      // Unngå at gamle sockets henger igjen
      autoConnect: true
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

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      setIsConnected(false);
      // Hvis serveren stengte forbindelsen, ikke sett isConnecting til true
      if (reason === 'io server disconnect') {
        // Serveren disconnected oss - prøv å koble til på nytt
        newSocket.connect();
      }
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
      setIsConnecting(true);
    });

    newSocket.on('reconnect', () => {
      console.log('Reconnected to socket server');
      setIsConnecting(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnectionError('Prøver å koble til serveren...');
      setIsConnected(false);
    });

    // Room events
    newSocket.on('room:created', ({ roomCode: code, game, gameState: state }) => {
      setRoomCode(code);
      setCurrentGame(game);
      setGameState(state || 'LOBBY');
      setIsHost(true);
      setError(null);
    });

    // Lobby events
    newSocket.on('lobby:created', ({ roomCode: code, gameState: state, lobbyData: lData }) => {
      setRoomCode(code);
      setCurrentGame(null);
      setGameState(state || 'LOBBY_IDLE');
      setIsHost(true);
      setLobbyData(lData || { totalScore: 0, leaderboard: [], playerScores: {} });
      setError(null);
    });

    newSocket.on('lobby:game-selected', ({ game, gameState: state, room }) => {
      setCurrentGame(game);
      setGameState(state || 'LOBBY_GAME_SELECTED');
      setPlayers(room.players);
    });

    newSocket.on('lobby:returned', ({ room, lobbyData: lData }) => {
      setGameState('LOBBY_IDLE');
      setCurrentGame(null);
      setGameData(null);
      setPlayers(room.players);
      setLobbyData(lData || { totalScore: 0, leaderboard: [], playerScores: {} });
    });

    newSocket.on('lobby:score-update', ({ totalScore, leaderboard }) => {
      setLobbyData(prev => ({
        ...prev,
        totalScore,
        leaderboard
      }));
    });

    newSocket.on('lobby:scores', ({ totalScore, leaderboard, playerScores }) => {
      setLobbyData({ totalScore, leaderboard, playerScores });
    });

    newSocket.on('room:player-joined', ({ room }) => {
      setPlayers(room.players);
      // Bruk functional update for å unngå stale closure
      setRoomCode(prev => prev || room.code);
      setCurrentGame(prev => prev === null ? room.game : prev);
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
      setRoomCode(null);
      setPlayers([]);
      setIsHost(false);
      setCurrentGame(null);
      setGameState('LOBBY');
      setGameData(null);
      setLobbyData({ totalScore: 0, leaderboard: [], playerScores: {} });
    });

    newSocket.on('room:kicked', () => {
      setError('Du ble fjernet fra spillet av læreren.');
      setRoomCode(null);
      setPlayers([]);
      setIsHost(false);
      setCurrentGame(null);
      setGameState('LOBBY');
      setGameData(null);
      setLobbyData({ totalScore: 0, leaderboard: [], playerScores: {} });
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

    newSocket.on('game:ended', () => {
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

    // Cleanup ved unmount
    return () => {
      newSocket.disconnect();
    };
  }, []); // Tom dependency array - kjører kun én gang

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

  // Heartbeat for å holde Render-serveren våken
  useEffect(() => {
    if (!socket || !isConnected) return;

    const heartbeat = setInterval(() => {
      socket.emit('ping');
    }, 25000);

    return () => clearInterval(heartbeat);
  }, [socket, isConnected]);

  // resetGameState bruker den allerede definerte doResetGameState
  const resetGameState = doResetGameState;

  // Host actions
  const createRoom = useCallback((game) => {
    if (socket) {
      socket.emit('host:create-room', { game });
    }
  }, [socket]);

  // Ny: Opprett lobby uten spill
  const createLobby = useCallback(() => {
    if (socket) {
      socket.emit('host:create-lobby');
    }
  }, [socket]);

  // Ny: Velg spill for lobby
  const selectGame = useCallback((game) => {
    if (socket && isHost) {
      socket.emit('host:select-game', { game });
    }
  }, [socket, isHost]);

  // Ny: Returner til lobby
  const returnToLobby = useCallback(() => {
    if (socket && isHost) {
      socket.emit('host:return-to-lobby');
    }
  }, [socket, isHost]);

  const startGame = useCallback((config = {}) => {
    if (socket && isHost) {
      socket.emit('host:start-game', config);
    }
  }, [socket, isHost]);

  const endGame = useCallback((returnToLobbyAfter = false) => {
    if (socket && isHost) {
      socket.emit('host:end-game', { returnToLobby: returnToLobbyAfter });
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

  // Ny: Send lobby-score
  const submitLobbyScore = useCallback((score) => {
    if (socket) {
      socket.emit('lobby:submit-score', { score });
    }
  }, [socket]);

  // Ny: Hent lobby-scores
  const getLobbyScores = useCallback(() => {
    if (socket) {
      socket.emit('lobby:get-scores');
    }
  }, [socket]);

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
    if (gameState === 'LOBBY_IDLE') {
      return isHost ? 'HOST_LOBBY_IDLE' : 'PLAYER_LOBBY_IDLE';
    }
    if (gameState === 'LOBBY_GAME_SELECTED') {
      return isHost ? 'HOST_LOBBY' : 'PLAYER_LOBBY';
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

    // Lobby state
    lobbyData,
    setLobbyData,

    // Host actions
    createRoom,
    createLobby,
    selectGame,
    returnToLobby,
    startGame,
    endGame,
    kickPlayer,
    sendGameAction,

    // Player actions
    joinRoom,
    sendPlayerAction,
    submitLobbyScore,
    getLobbyScores,

    // Utility
    getGamePhase,
    resetGameState,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
