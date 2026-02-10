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
    gameLeaderboards: {},
    playerScores: {}
  });

  // Lobby minigame state (teacher-controlled)
  const [lobbyMinigame, setLobbyMinigame] = useState('jumper');

  // Demo mode state
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [botIds, setBotIds] = useState([]);

  // Refs for å unngå stale closures i socket handlers
  const roomCodeRef = useRef(roomCode);
  const isHostRef = useRef(isHost);
  const playerNameRef = useRef(playerName);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);

  // Funksjon for å nullstille state (definert før useEffect)
  const doResetGameState = useCallback(() => {
    setRoomCode(null);
    setPlayers([]);
    setIsHost(false);
    setCurrentGame(null);
    setGameState('LOBBY');
    setGameData(null);
    setLobbyData({ totalScore: 0, leaderboard: [], gameLeaderboards: {}, playerScores: {} });
    setLobbyMinigame('jumper');
    setIsDemoActive(false);
    setBotIds([]);
  }, []);

  // Initialize socket connection - kjører kun én gang ved mount
  useEffect(() => {
    const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'https://game-p2u5.onrender.com';

    const newSocket = io(SOCKET_SERVER_URL, {
      // Bruk websocket først - polling som fallback
      transports: ['websocket', 'polling'],
      // Øk timeout for trege cold starts
      timeout: 120000,
      // Gi aldri opp reconnection
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Randomisering for å unngå thundering herd
      randomizationFactor: 0.3,
      forceNew: false,
      autoConnect: true,
      withCredentials: true,
      ackTimeout: 30000,
      // Upgrade til websocket fra polling (gir raskere recovery)
      upgrade: true
    });

    setSocket(newSocket);

    // Track om vi har hatt minst én vellykket tilkobling (for å skille reconnect fra first-connect)
    let hasConnectedBefore = false;
    // Retry-state for player rejoin (når rom gjenskapes av læreren)
    let playerRejoinRetries = 0;
    let playerRejoinTimer = null;
    const MAX_PLAYER_REJOIN_RETRIES = 5;
    const PLAYER_REJOIN_DELAY_MS = 2000;

    // Client-side keep-alive: send tiny ping every 15s to prevent
    // proxy/load-balancer idle-timeout disconnects (Render, Cloudflare, etc.)
    let keepAliveInterval = null;
    const startKeepAlive = () => {
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      keepAliveInterval = setInterval(() => {
        if (newSocket.connected) {
          newSocket.volatile.emit('ping-keepalive');
        }
      }, 15000);
    };

    // Track consecutive websocket failures to temporarily use polling
    let wsFailCount = 0;

    newSocket.on('connect', () => {
      console.log('Connected to socket server, id:', newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setShowWakeUpMessage(false);
      setConnectionError(null);
      setMyPlayerId(newSocket.id);
      wsFailCount = 0;
      startKeepAlive();

      // Auto-rejoin ved reconnect (ikke first-connect)
      if (hasConnectedBefore) {
        const code = roomCodeRef.current;
        if (code) {
          if (isHostRef.current) {
            console.log(`Auto-rejoining room ${code} as host`);
            newSocket.emit('host:rejoin', { roomCode: code });
          } else if (playerNameRef.current) {
            playerRejoinRetries = 0; // Reset retries on new connection
            console.log(`Auto-rejoining room ${code} as player ${playerNameRef.current}`);
            newSocket.emit('player:rejoin', { roomCode: code, playerName: playerNameRef.current });
          }
        }
      }
      hasConnectedBefore = true;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      setIsConnected(false);
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      // Hvis serveren aktivt lukket tilkoblingen, koble til på nytt manuelt
      if (reason === 'io server disconnect') {
        console.log('Server closed connection, reconnecting...');
        newSocket.connect();
      }
    });

    // Manager-events (socket.io v4: reconnect-events er på Manager, ikke Socket)
    newSocket.io.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
      if (attempt === 1) {
        setIsConnecting(true);
      }
    });

    newSocket.io.on('reconnect_failed', () => {
      // Bør ikke skje med Infinity attempts, men håndter det likevel
      console.log('Reconnection paused, retrying...');
      setTimeout(() => newSocket.connect(), 3000);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      wsFailCount++;
      // Etter 3 mislykkede WebSocket-forsøk, prøv polling midlertidig
      if (wsFailCount >= 3 && newSocket.io.opts.transports[0] === 'websocket') {
        console.log('WebSocket failing, temporarily trying polling first...');
        newSocket.io.opts.transports = ['polling', 'websocket'];
      }
      // Gjenopprett WebSocket-prioritet etter vellykket tilkobling (håndteres i connect)
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
    newSocket.on('lobby:created', ({ roomCode: code, gameState: state, lobbyData: lData, lobbyMinigame: mg }) => {
      setRoomCode(code);
      setCurrentGame(null);
      setGameState(state || 'LOBBY_IDLE');
      setIsHost(true);
      setLobbyData(lData || { totalScore: 0, leaderboard: [], gameLeaderboards: {}, playerScores: {} });
      if (mg) setLobbyMinigame(mg);
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
      setLobbyData(lData || { totalScore: 0, leaderboard: [], gameLeaderboards: {}, playerScores: {} });
      if (room.lobbyMinigame) setLobbyMinigame(room.lobbyMinigame);
    });

    newSocket.on('lobby:score-update', ({ totalScore, leaderboard, gameLeaderboards }) => {
      setLobbyData(prev => ({
        ...prev,
        totalScore,
        leaderboard,
        gameLeaderboards: gameLeaderboards || prev.gameLeaderboards
      }));
    });

    newSocket.on('lobby:scores', ({ totalScore, leaderboard, gameLeaderboards, playerScores }) => {
      setLobbyData({ totalScore, leaderboard, gameLeaderboards: gameLeaderboards || {}, playerScores });
    });

    newSocket.on('room:player-joined', ({ room }) => {
      setPlayers(room.players);
      // Bruk functional update for å unngå stale closure
      setRoomCode(prev => prev || room.code);
      setCurrentGame(prev => prev === null ? room.game : prev);
      // Oppdater lobby-minispill fra serveren
      if (room.lobbyMinigame) setLobbyMinigame(room.lobbyMinigame);
      // Oppdater spillernavnet fra serveren (kan ha blitt sanitert eller fått nummer)
      const myPlayer = room.players.find(p => p.id === newSocket.id);
      if (myPlayer) {
        setPlayerName(myPlayer.name);
      }
      setError(null);
    });

    newSocket.on('room:player-left', ({ room }) => {
      setPlayers(room.players);
    });

    newSocket.on('room:join-error', ({ message }) => {
      setError(message);
    });

    // Rejoin failed - room no longer exists on server after reconnect
    // For host: should rarely happen (server auto-recreates room)
    // For player: retry a few times (teacher may be recreating room)
    newSocket.on('room:rejoin-failed', ({ message }) => {
      if (isHostRef.current) {
        // Host rejoin failed even with auto-recreate - give up
        console.warn('Host rejoin failed:', message);
        doResetGameState();
        setError(message || 'Mistet forbindelsen. Opprett et nytt rom.');
      } else if (playerRejoinRetries < MAX_PLAYER_REJOIN_RETRIES) {
        // Player: retry - teacher may be recreating the room
        playerRejoinRetries++;
        console.log(`Player rejoin retry ${playerRejoinRetries}/${MAX_PLAYER_REJOIN_RETRIES}...`);
        if (playerRejoinTimer) clearTimeout(playerRejoinTimer);
        playerRejoinTimer = setTimeout(() => {
          const code = roomCodeRef.current;
          const name = playerNameRef.current;
          if (code && name && newSocket.connected) {
            newSocket.emit('player:rejoin', { roomCode: code, playerName: name });
          } else {
            // Can't retry - give up
            doResetGameState();
            setPlayerName('');
            setError('Mistet forbindelsen til rommet.');
          }
        }, PLAYER_REJOIN_DELAY_MS);
      } else {
        // All retries exhausted
        console.warn('Player rejoin failed after retries:', message);
        if (playerRejoinTimer) clearTimeout(playerRejoinTimer);
        doResetGameState();
        setPlayerName('');
        setError('Mistet forbindelsen til rommet. Be læreren starte på nytt.');
      }
    });

    newSocket.on('room:closed', () => {
      setError('Rommet ble stengt av verten.');
      setRoomCode(null);
      setPlayers([]);
      setIsHost(false);
      setCurrentGame(null);
      setGameState('LOBBY');
      setGameData(null);
      setLobbyData({ totalScore: 0, leaderboard: [], gameLeaderboards: {}, playerScores: {} });
      setIsDemoActive(false);
      setBotIds([]);
    });

    newSocket.on('room:kicked', () => {
      setError('Du ble fjernet fra spillet av læreren.');
      setRoomCode(null);
      setPlayers([]);
      setIsHost(false);
      setCurrentGame(null);
      setGameState('LOBBY');
      setGameData(null);
      setLobbyData({ totalScore: 0, leaderboard: [], gameLeaderboards: {}, playerScores: {} });
      setIsDemoActive(false);
      setBotIds([]);
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

    // Generic handler for game events that include player score updates
    const handlePlayersUpdate = (data) => {
      if (data && data.players && Array.isArray(data.players)) {
        setPlayers(data.players);
      }
    };

    // Listen for events that include player updates
    newSocket.on('game:correct-guess', handlePlayersUpdate);
    newSocket.on('game:wrong-guess', handlePlayersUpdate);
    newSocket.on('game:guess-result', handlePlayersUpdate);
    newSocket.on('game:word-approved', handlePlayersUpdate);
    newSocket.on('game:word-rejected', handlePlayersUpdate);
    newSocket.on('game:round-revealed', handlePlayersUpdate);
    newSocket.on('game:answer-revealed', handlePlayersUpdate);

    newSocket.on('game:ended', ({ room, lobbyData: lData } = {}) => {
      // Avslutt tar alle tilbake til lobby (ikke ut av rommet)
      if (room) {
        setPlayers(room.players || []);
        if (room.lobbyMinigame) setLobbyMinigame(room.lobbyMinigame);
      }
      if (lData) {
        setLobbyData(lData);
      }
      setCurrentGame(null);
      setGameState('LOBBY_IDLE');
      setGameData(null);
      // Behold roomCode og isHost slik at spillere forblir i rommet
    });

    newSocket.on('game:state-sync', ({ room }) => {
      setGameState(room.gameState);
      setCurrentGame(room.game);
      setGameData(room.gameData);
      setPlayers(room.players);
      if (room.lobbyMinigame) setLobbyMinigame(room.lobbyMinigame);
    });

    // Host rejoin success - sync full state after reconnection
    newSocket.on('host:rejoin-success', ({ roomCode: code, room, lobbyData: lData, lobbyMinigame: mg, recreated }) => {
      console.log('Host rejoin success for room', code, recreated ? '(recreated)' : '');
      setRoomCode(code);
      setIsHost(true);
      setMyPlayerId(newSocket.id);
      if (room) {
        setPlayers(room.players || []);
        setGameState(room.gameState || 'LOBBY_IDLE');
        setCurrentGame(room.game || null);
        setGameData(room.gameData || null);
      }
      if (lData) setLobbyData(lData);
      if (mg) setLobbyMinigame(mg);
      setError(null);
    });

    // Demo mode events
    newSocket.on('demo:enabled', ({ botIds: ids }) => {
      setIsDemoActive(true);
      setBotIds(ids || []);
    });

    newSocket.on('demo:disabled', () => {
      setIsDemoActive(false);
      setBotIds([]);
    });

    // Lobby minigame events
    newSocket.on('lobby:minigame-selected', ({ minigame }) => {
      setLobbyMinigame(minigame || 'jumper');
    });

    // Cleanup ved unmount
    return () => {
      if (playerRejoinTimer) clearTimeout(playerRejoinTimer);
      if (keepAliveInterval) clearInterval(keepAliveInterval);
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

  // Keep-alive håndteres nå direkte i socket-oppkoblingen (ping-keepalive)

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

  // Ny: Send lobby-score med spill-ID
  const submitLobbyScore = useCallback((score, gameId) => {
    if (socket) {
      socket.emit('lobby:submit-score', { score, gameId });
    }
  }, [socket]);

  // Ny: Hent lobby-scores
  const getLobbyScores = useCallback(() => {
    if (socket) {
      socket.emit('lobby:get-scores');
    }
  }, [socket]);

  // Lobby minigame action (teacher selects which minigame students play)
  const selectMinigame = useCallback((minigame) => {
    // Optimistisk lokal oppdatering for umiddelbar respons
    setLobbyMinigame(minigame);
    if (socket && isHost) {
      socket.emit('host:select-minigame', { minigame });
    }
  }, [socket, isHost]);

  // Demo mode actions
  const enableDemo = useCallback((count = 5) => {
    if (socket && isHost) {
      socket.emit('host:enable-demo', { count });
    }
  }, [socket, isHost]);

  const disableDemo = useCallback(() => {
    if (socket && isHost) {
      socket.emit('host:disable-demo');
    }
  }, [socket, isHost]);

  // Leave room (for players to go back to start)
  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.emit('player:leave-room');
    }
    doResetGameState();
    setPlayerName('');
    setError(null);
  }, [socket, doResetGameState]);

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

    // Lobby minigame
    lobbyMinigame,
    selectMinigame,

    // Demo mode
    isDemoActive,
    botIds,
    enableDemo,
    disableDemo,

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
    leaveRoom,
    sendPlayerAction,
    submitLobbyScore,
    getLobbyScores,

    // Utility
    getGamePhase,
    resetGameState,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
