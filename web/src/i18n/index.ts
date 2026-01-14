/**
 * ft_transcendence - Internationalization (i18n)
 */

export type Language = 'en' | 'tr';

interface Translations {
	[key: string]: string | Translations;
}

// English translations
const en: Translations = {
	nav: {
		home: 'Home',
		play: 'Play',
		tournament: 'Tournament',
		dashboard: 'Dashboard',
		profile: 'Profile',
		settings: 'Settings',
		logout: 'Logout',
	},
	auth: {
		login: 'Log In',
		register: 'Register',
		email: 'Email',
		password: 'Password',
		confirmPassword: 'Confirm Password',
		username: 'Username',
		forgotPassword: 'Forgot Password?',
		noAccount: "Don't have an account?",
		hasAccount: 'Already have an account?',
		orContinueWith: 'Or continue with',
		loginWithGoogle: 'Login with Google',
		loginWithGithub: 'Login with GitHub',
		loginWith42: 'Login with 42',
	},
	home: {
		title: 'Welcome to Pong',
		subtitle: 'The ultimate multiplayer Pong experience',
		playNow: 'Play Now',
		joinTournament: 'Join Tournament',
		features: {
			multiplayer: 'Real-time Multiplayer',
			multiplayerDesc: 'Play against friends or strangers from around the world',
			tournaments: 'Tournaments',
			tournamentsDesc: 'Compete in exciting tournaments and climb the leaderboard',
			ai: 'AI Opponent',
			aiDesc: 'Practice against our challenging AI when no one is around',
		},
	},
	game: {
		title: 'Choose Game Mode',
		localPlay: 'Local Play',
		localPlayDesc: 'Play against a friend on the same device',
		onlinePlay: 'Online Play',
		onlinePlayDesc: 'Play against others online',
		aiPlay: 'vs AI',
		aiPlayDesc: 'Play against an AI opponent',
		aiRefreshInfo: 'AI refreshes view every 1 second',
		waiting: 'Waiting for opponent...',
		ready: 'Ready!',
		start: 'Start Game',
		pause: 'Pause',
		resume: 'Resume',
		quit: 'Quit Game',
		victory: 'Victory!',
		defeat: 'Defeat',
		youWin: 'You Win!',
		youLose: 'You Lose!',
		draw: 'Draw',
		score: 'Score',
		playAgain: 'Play Again',
		rematch: 'Rematch',
		backToMenu: 'Back to Menu',
		you: 'YOU',
		player: 'Player',
		opponent: 'OPPONENT',
		red: 'Red',
		navy: 'Navy',
		firstToWins: 'First to {score} wins',
		useArrows: 'Use ↑/↓ or W/S to move your paddle',
		pressSpace: 'Press SPACE or Click to return',
		savingResult: 'Saving result...',
		tournamentMatch: 'Tournament Match',
		matchId: 'Match ID',
		champion: 'CHAMPION',
		roomClosed: 'Room closed. Returning to lobby.',
		opponentDisconnected: 'Opponent disconnected. Returning to lobby.',
		connecting: 'Connecting to match...',
		connected: 'Connected. Joining match...',
		connectionFailed: 'Connection failed',
		opponentJoined: 'Opponent Joined!',
		playingAgainst: 'Playing against:',
		clickReady: 'Click Ready when you\'re prepared to play.',
		imReady: 'I\'m Ready!',
		waitingForOpponent: 'Waiting for opponent...',
		controls: 'Player 1: W/S • Player 2: ↑/↓',
		realTimeMultiplayer: 'Real-time multiplayer',
	},
	tournament: {
		title: 'Tournaments',
		join: 'Join Tournament',
		start: 'Start Tournament',
		startWithPlayers: 'Start Tournament ({count} players)',
		back: '← Back',
		backToTournaments: 'Back to Tournaments',
		participants: 'Participants',
		noParticipants: 'No participants yet',
		bracket: 'Bracket',
		loadingBracket: 'Loading bracket...',
		clickToJoin: 'Click below to join as',
		yourself: 'yourself',
		playMatch: 'Play Match',
		waiting: 'Waiting',
		inProgress: 'In Progress',
		completed: 'Completed',
		pending: 'Pending',
		semi: 'SEMI',
		final: 'FINAL',
		round: 'Round',
		kickParticipant: 'Kick Participant',
		notFound: 'Tournament not found',
		joinError: 'Could not join tournament. It may be full, already started, or you have already joined.',
		startError: 'Could not start tournament. You may not be the creator or there are not enough players.',
		onlyCreatorCanStart: 'Only the creator can start the tournament',
		createTournament: 'Create Tournament',
		tournamentName: 'Tournament Name',
		maxPlayers: 'Max Players',
		create: 'Create',
		noTournaments: 'No tournaments found',
		noTournamentsYet: 'No tournaments yet. Create one to get started!',
		loadingTournaments: 'Loading tournaments...',
		maxPlayersInfo: 'Max {count} players',
		createdOn: 'Created',
		view: 'View',
		activeTournaments: 'Active Tournaments',
		upcoming: 'Upcoming',
	},
	profile: {
		title: 'Profile',
		stats: 'Statistics',
		matchHistory: 'Match History',
		friends: 'Friends',
		wins: 'Wins',
		losses: 'Losses',
		winRate: 'Win Rate',
		totalGames: 'Total Games',
		editProfile: 'Edit Profile',
		changeAvatar: 'Change Avatar',
		addFriend: 'Add Friend',
		online: 'Online',
		offline: 'Offline',
		playing: 'In Game',
		noFriends: 'No friends yet. Play some games to make friends!',
		noMatches: 'No matches played yet. Start playing to see your history!',
		userNotFound: 'User not found',
		goHome: 'Go Home',
		friendRequestPending: 'Request Sent',
		friendRequestSent: 'Friend request sent!',
	},
	settings: {
		title: 'Settings',
		language: 'Language',
		theme: 'Theme',
		notifications: 'Notifications',
		privacy: 'Privacy',
		deleteAccount: 'Delete Account',
		exportData: 'Export My Data',
		anonymize: 'Anonymize Account',
		gameInvitations: 'Game Invitations',
		tournamentUpdates: 'Tournament Updates',
		friendRequests: 'Friend Requests',
		dangerZone: 'Danger Zone',
		dangerZoneWarning: 'Once you delete your account, there is no going back. Please be certain.',
	},
	errors: {
		required: 'This field is required',
		invalidEmail: 'Invalid email address',
		passwordMismatch: 'Passwords do not match',
		minLength: 'Must be at least {min} characters',
		networkError: 'Network error. Please try again.',
		unauthorized: 'Please log in to continue',
		notFound: 'Page not found',
	},
	common: {
		loading: 'Loading...',
		save: 'Save',
		cancel: 'Cancel',
		confirm: 'Confirm',
		delete: 'Delete',
		edit: 'Edit',
		search: 'Search',
		noResults: 'No results found',
		back: 'Back',
	},
	dashboard: {
		title: 'Dashboard',
		players: 'Players',
		matches: 'Matches',
		tournaments: 'Tournaments',
		today: 'Today',
		active: 'Active',
		winRate: 'Win Rate',
		games: 'Games',
		wins: 'Wins',
		losses: 'Losses',
		streak: 'Streak',
		bestStreak: 'Best Streak',
		pointsScored: 'Points Scored',
		tournamentsPlayed: 'Tournaments Played',
		tournamentsWon: 'Tournaments Won',
		recentMatches: 'Recent Matches',
		leaderboard: 'Leaderboard',
		loadingStats: 'Loading stats...',
	},
};

// Turkish translations
const tr: Translations = {
	nav: {
		home: 'Ana Sayfa',
		play: 'Oyna',
		tournament: 'Turnuva',
		dashboard: 'Panel',
		profile: 'Profil',
		settings: 'Ayarlar',
		logout: 'Çıkış Yap',
	},
	auth: {
		login: 'Giriş Yap',
		register: 'Kayıt Ol',
		email: 'E-posta',
		password: 'Şifre',
		confirmPassword: 'Şifre Tekrar',
		username: 'Kullanıcı Adı',
		forgotPassword: 'Şifremi Unuttum?',
		noAccount: 'Hesabınız yok mu?',
		hasAccount: 'Zaten hesabınız var mı?',
		orContinueWith: 'Veya şununla devam et',
		loginWithGoogle: 'Google ile Giriş',
		loginWithGithub: 'GitHub ile Giriş',
		loginWith42: '42 ile Giriş',
	},
	home: {
		title: "Pong'a Hoş Geldiniz",
		subtitle: 'En iyi çok oyunculu Pong deneyimi',
		playNow: 'Şimdi Oyna',
		joinTournament: 'Turnuvaya Katıl',
		features: {
			multiplayer: 'Gerçek Zamanlı Çok Oyunculu',
			multiplayerDesc: 'Dünyanın dört bir yanından arkadaşlarınıza veya yabancılara karşı oynayın',
			tournaments: 'Turnuvalar',
			tournamentsDesc: 'Heyecan verici turnuvalarda yarışın ve liderlik tablosunda yükselin',
			ai: 'Yapay Zeka Rakibi',
			aiDesc: 'Kimse yokken zorlu yapay zekamıza karşı pratik yapın',
		},
	},
	game: {
		title: 'Oyun Modu Seç',
		localPlay: 'Yerel Oyun',
		localPlayDesc: 'Aynı cihazda bir arkadaşınla oyna',
		onlinePlay: 'Çevrimiçi Oyun',
		onlinePlayDesc: 'Çevrimiçi rakiplere karşı oyna',
		aiPlay: 'Yapay Zekaya Karşı',
		aiPlayDesc: 'Yapay zeka rakibe karşı oyna',
		aiRefreshInfo: 'YZ her 1 saniyede güncellenir',
		waiting: 'Rakip bekleniyor...',
		ready: 'Hazır!',
		start: 'Oyunu Başlat',
		pause: 'Duraklat',
		resume: 'Devam Et',
		quit: 'Oyundan Çık',
		victory: 'Zafer!',
		defeat: 'Yenilgi',
		youWin: 'Kazandın!',
		youLose: 'Kaybettin!',
		draw: 'Berabere',
		score: 'Skor',
		playAgain: 'Tekrar Oyna',
		rematch: 'Rövanş',
		backToMenu: 'Menüye Dön',
		you: 'SEN',
		player: 'Oyuncu',
		opponent: 'RAKİP',
		red: 'Kırmızı',
		navy: 'Lacivert',
		firstToWins: 'İlk {score} sayı kazanır',
		useArrows: 'Hareket: ↑/↓ veya W/S',
		pressSpace: 'Dönmek için SPACE veya tıkla',
		savingResult: 'Sonuç kaydediliyor...',
		tournamentMatch: 'Turnuva Maçı',
		matchId: 'Maç ID',
		champion: 'ŞAMPİYON',
		roomClosed: 'Oda kapandı. Lobiye dönülüyor.',
		opponentDisconnected: 'Rakip bağlantısını kaybetti. Lobiye dönülüyor.',
		connecting: 'Maça bağlanılıyor...',
		connected: 'Bağlandı. Maça katılınıyor...',
		connectionFailed: 'Bağlantı başarısız',
		opponentJoined: 'Rakip katıldı!',
		playingAgainst: 'Rakip:',
		clickReady: 'Hazır olduğunuzda Hazır butonuna tıklayın.',
		imReady: 'Hazırım!',
		waitingForOpponent: 'Rakip bekleniyor...',
		controls: 'Oyuncu 1: W/S • Oyuncu 2: ↑/↓',
		realTimeMultiplayer: 'Gerçek zamanlı çok oyunculu',
	},
	tournament: {
		title: 'Turnuvalar',
		join: 'Turnuvaya Katıl',
		start: 'Turnuvayı Başlat',
		startWithPlayers: 'Turnuvayı Başlat ({count} oyuncu)',
		back: '← Geri',
		backToTournaments: 'Turnuvalara Dön',
		participants: 'Katılımcılar',
		noParticipants: 'Henüz katılımcı yok',
		bracket: 'Eşleşmeler',
		loadingBracket: 'Eşleşmeler yükleniyor...',
		clickToJoin: 'Katılmak için tıklayın',
		yourself: 'kendiniz',
		playMatch: 'Maçı Oyna',
		waiting: 'Bekliyor',
		inProgress: 'Devam Ediyor',
		completed: 'Tamamlandı',
		pending: 'Beklemede',
		semi: 'YARI FİNAL',
		final: 'FİNAL',
		round: 'Tur',
		kickParticipant: 'Katılımcıyı Çıkar',
		notFound: 'Turnuva bulunamadı',
		joinError: 'Turnuvaya katılınamadı. Dolu olabilir, başlamış olabilir veya zaten katılmış olabilirsiniz.',
		startError: 'Turnuva başlatılamadı. Oluşturan siz olmayabilirsiniz veya yeterli oyuncu yok.',
		onlyCreatorCanStart: 'Turnuvayı sadece oluşturan başlatabilir',
		createTournament: 'Turnuva Oluştur',
		tournamentName: 'Turnuva Adı',
		maxPlayers: 'Maksimum Oyuncu',
		create: 'Oluştur',
		noTournaments: 'Turnuva bulunamadı',
		noTournamentsYet: 'Henüz turnuva yok. Başlamak için bir tane oluşturun!',
		loadingTournaments: 'Turnuvalar yükleniyor...',
		maxPlayersInfo: 'Maksimum {count} oyuncu',
		createdOn: 'Oluşturulma',
		view: 'Görüntüle',
		activeTournaments: 'Aktif Turnuvalar',
		upcoming: 'Yaklaşan',
	},
	profile: {
		title: 'Profil',
		stats: 'İstatistikler',
		matchHistory: 'Maç Geçmişi',
		friends: 'Arkadaşlar',
		wins: 'Galibiyet',
		losses: 'Mağlubiyet',
		winRate: 'Kazanma Oranı',
		totalGames: 'Toplam Oyun',
		editProfile: 'Profili Düzenle',
		changeAvatar: 'Avatar Değiştir',
		addFriend: 'Arkadaş Ekle',
		online: 'Çevrimiçi',
		offline: 'Çevrimdışı',
		playing: 'Oyunda',
		noFriends: 'Henüz arkadaşın yok. Oyun oynayarak arkadaş edin!',
		noMatches: 'Henüz maç oynamadın. Geçmişini görmek için oynamaya başla!',
		userNotFound: 'Kullanıcı bulunamadı',
		goHome: 'Ana Sayfaya Git',
		friendRequestPending: 'İstek Gönderildi',
		friendRequestSent: 'Arkadaşlık isteği gönderildi!',
	},
	settings: {
		title: 'Ayarlar',
		language: 'Dil',
		theme: 'Tema',
		notifications: 'Bildirimler',
		privacy: 'Gizlilik',
		deleteAccount: 'Hesabı Sil',
		exportData: 'Verilerimi İndir',
		anonymize: 'Hesabı Anonimleştir',
		gameInvitations: 'Oyun Davetleri',
		tournamentUpdates: 'Turnuva Güncellemeleri',
		friendRequests: 'Arkadaşlık İstekleri',
		dangerZone: 'Tehlikeli Bölge',
		dangerZoneWarning: 'Hesabınızı sildikten sonra geri dönüşü yoktur. Lütfen emin olun.',
	},
	errors: {
		required: 'Bu alan zorunludur',
		invalidEmail: 'Geçersiz e-posta adresi',
		passwordMismatch: 'Şifreler eşleşmiyor',
		minLength: 'En az {min} karakter olmalıdır',
		networkError: 'Ağ hatası. Lütfen tekrar deneyin.',
		unauthorized: 'Devam etmek için giriş yapın',
		notFound: 'Sayfa bulunamadı',
	},
	common: {
		loading: 'Yükleniyor...',
		save: 'Kaydet',
		cancel: 'İptal',
		confirm: 'Onayla',
		delete: 'Sil',
		edit: 'Düzenle',
		search: 'Ara',
		noResults: 'Sonuç bulunamadı',
		back: 'Geri',
	},
	dashboard: {
		title: 'Panel',
		players: 'Oyuncular',
		matches: 'Maçlar',
		tournaments: 'Turnuvalar',
		today: 'Bugün',
		active: 'Aktif',
		winRate: 'Kazanma Oranı',
		games: 'Oyunlar',
		wins: 'Galibiyetler',
		losses: 'Mağlubiyetler',
		streak: 'Seri',
		bestStreak: 'En İyi Seri',
		pointsScored: 'Atılan Sayı',
		tournamentsPlayed: 'Oynanan Turnuva',
		tournamentsWon: 'Kazanılan Turnuva',
		recentMatches: 'Son Maçlar',
		leaderboard: 'Liderlik Tablosu',
		loadingStats: 'İstatistikler yükleniyor...',
	},
};

const translations: Record<Language, Translations> = { en, tr };

class I18n {
	private currentLanguage: Language = 'en';
	private listeners: Set<() => void> = new Set();

	constructor() {
		// Load saved language from localStorage
		const saved = localStorage.getItem('language') as Language;
		if (saved && translations[saved]) {
			this.currentLanguage = saved;
		}
	}

	/**
	 * Get current language
	 */
	getLanguage(): Language {
		return this.currentLanguage;
	}

	/**
	 * Set language
	 */
	setLanguage(lang: Language): void {
		if (translations[lang]) {
			this.currentLanguage = lang;
			localStorage.setItem('language', lang);
			document.documentElement.lang = lang;
			this.notifyListeners();
		}
	}

	/**
	 * Translate a key
	 */
	t(key: string, params?: Record<string, string | number>): string {
		const keys = key.split('.');
		let value: string | Translations = translations[this.currentLanguage];

		for (const k of keys) {
			if (typeof value === 'object' && value[k]) {
				value = value[k];
			} else {
				// Fallback to English
				value = translations.en;
				for (const ek of keys) {
					if (typeof value === 'object' && value[ek]) {
						value = value[ek];
					} else {
						return key; // Return key if not found
					}
				}
				break;
			}
		}

		if (typeof value !== 'string') {
			return key;
		}

		// Replace parameters
		if (params) {
			for (const [param, val] of Object.entries(params)) {
				value = value.replace(`{${param}}`, String(val));
			}
		}

		return value;
	}

	/**
	 * Subscribe to language changes
	 */
	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notifyListeners(): void {
		this.listeners.forEach((listener) => listener());
	}

	/**
	 * Get available languages
	 */
	getAvailableLanguages(): { code: Language; name: string }[] {
		return [
			{ code: 'en', name: 'English' },
			{ code: 'tr', name: 'Türkçe' },
		];
	}
}

// Export singleton
export const i18n = new I18n();
export const t = (key: string, params?: Record<string, string | number>) => i18n.t(key, params);
export default i18n;
