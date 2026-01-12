-- =============================================
-- ft_transcendence Database Schema
-- Version: 1.0
-- =============================================

-- Users table (extended for all modules)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT,                          -- NULL for OAuth-only users
    avatar_url TEXT DEFAULT '/default-avatar.png',
    
    -- OAuth fields
    oauth_provider TEXT,                         -- 'google', 'github', '42', etc.
    oauth_id TEXT,                               -- Provider's user ID
    
    -- Status
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TEXT,
    
    -- Preferences
    language TEXT DEFAULT 'en' CHECK(language IN ('en', 'tr', 'fr')),
    
    -- GDPR compliance
    is_anonymized BOOLEAN DEFAULT FALSE,
    data_export_requested_at TEXT,
    
    -- Timestamps
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);

-- =============================================
-- Friendships
-- =============================================
CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'blocked')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);

-- =============================================
-- Tournaments
-- =============================================
CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'completed', 'cancelled')),
    max_players INTEGER NOT NULL DEFAULT 8,
    current_round INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    started_at TEXT,
    ended_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);

-- =============================================
-- Tournament Participants
-- =============================================
CREATE TABLE IF NOT EXISTS tournament_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    alias TEXT NOT NULL,                         -- Display name for this tournament
    seed INTEGER,                                -- Seeding position
    final_position INTEGER,                      -- Final ranking (1 = winner)
    is_eliminated BOOLEAN DEFAULT FALSE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tournament_id, user_id),
    UNIQUE(tournament_id, alias)
);

CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);

-- =============================================
-- Matches
-- =============================================
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Players
    player1_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    player2_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    player1_alias TEXT,                          -- For anonymous/tournament play
    player2_alias TEXT,
    
    -- Scores
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Match type
    match_type TEXT NOT NULL DEFAULT 'casual' CHECK(match_type IN ('casual', 'tournament', 'ai', 'local')),
    
    -- Tournament reference
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
    tournament_round INTEGER,
    tournament_match_number INTEGER,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'playing', 'completed', 'cancelled')),
    
    -- Timestamps
    started_at TEXT,
    ended_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- =============================================
-- User Stats (Denormalized for performance)
-- =============================================
CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    best_win_streak INTEGER DEFAULT 0,
    total_points_scored INTEGER DEFAULT 0,
    total_points_conceded INTEGER DEFAULT 0,
    tournaments_played INTEGER DEFAULT 0,
    tournaments_won INTEGER DEFAULT 0,
    total_play_time_seconds INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Sessions (for JWT refresh tokens)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(refresh_token);

-- =============================================
-- Audit Log (for GDPR compliance)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,                        -- 'login', 'logout', 'data_export', 'account_delete', etc.
    details TEXT,                                -- JSON details
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
