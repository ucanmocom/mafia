// ─── Roles ────────────────────────────────────────────────────────────────────
const ROLES = {
  MAFIA: 'mafia',
  DOCTOR: 'doctor',
  DETECTIVE: 'detective',
  VILLAGER: 'villager',
};

const ROLE_DESCRIPTIONS = {
  [ROLES.MAFIA]:
    'Jesteś członkiem mafii. W nocy wspólnie z innymi wybieracie jedną osobę do eliminacji. Wygrywasz gdy liczba mafii dorówna pozostałym graczom.',
  [ROLES.DOCTOR]:
    'Jesteś lekarzem. Każdej nocy możesz ochronić jedną osobę przed zabójstwem mafii.',
  [ROLES.DETECTIVE]:
    'Jesteś policjantem. Każdej nocy możesz sprawdzić jedną osobę i dowiedzieć się czy jest mafią.',
  [ROLES.VILLAGER]:
    'Jesteś mieszkańcem. Nie masz specjalnych zdolności, ale możesz wpłynąć na głosowanie w dzień.',
};

// ─── Game phases ──────────────────────────────────────────────────────────────
const PHASES = {
  LOBBY: 'lobby',
  ROLE_REVEAL: 'role_reveal',
  NIGHT: 'night',
  NIGHT_RESULT: 'night_result',
  DAY: 'day',
  VOTING: 'voting',
  VOTE_SUMMARY: 'vote_summary',
  VOTE_RESULT: 'vote_result',
  GAME_OVER: 'game_over',
};

// ─── WebSocket event names ────────────────────────────────────────────────────
const EVENTS = {
  // Client → Server
  CREATE_ROOM:    'create_room',
  JOIN_ROOM:      'join_room',
  REJOIN:         'rejoin',
  UPDATE_SETTINGS:'update_settings',
  START_GAME:     'start_game',
  RESET_TO_LOBBY: 'reset_to_lobby',
  NIGHT_ACTION:   'night_action',
  VOTE:           'vote',
  KICK_PLAYER:    'kick_player',
  SKIP_DAY:       'skip_day',
  CHAT_MESSAGE:   'chat_message',
  LEAVE_ROOM:     'leave_room',

  // Server → Client
  ROOM_UPDATE:       'room_update',
  ROLE_ASSIGNED:     'role_assigned',
  PHASE_CHANGE:      'phase_change',
  NIGHT_RESULT:      'night_result',
  VOTE_ACK:          'vote_ack',
  VOTE_UPDATE:       'vote_update',
  SKIP_DAY_UPDATE:   'skip_day_update',
  VOTE_SUMMARY:      'vote_summary',
  PLAYER_ELIMINATED: 'player_eliminated',
  GAME_OVER:         'game_over',
  ERROR:             'error',
  RECONNECTED:       'reconnected',
  CHAT_RECEIVED:     'chat_received',
  MAFIA_RANDOM_KILL:  'mafia_random_kill',
};

// ─── Timers (ms) ──────────────────────────────────────────────────────────────
const TIMERS = {
  ROLE_REVEAL_DURATION: 10_000,   // 10s na przeczytanie roli
  NIGHT_ACTION_TIMEOUT: 60_000,   // 60s na wykonanie akcji nocnej
  DAY_DURATION:         120_000,  // 2min dyskusja
  VOTING_DURATION:      60_000,   // 60s głosowanie
  VOTE_RESULT_DURATION: 5_000,    // 5s pokazanie wyniku głosowania
  NIGHT_RESULT_DURATION: 5_000,   // 5s pokazanie wyniku nocy
  AFK_SKIP_TIMEOUT:     30_000,   // 30s zanim AFK zostanie pominięty
  ROOM_MAX_AGE_MS:      2 * 60 * 60 * 1000, // 2h – usuwane przy starcie
};

module.exports = { ROLES, ROLE_DESCRIPTIONS, PHASES, EVENTS, TIMERS };
