/**
 * ft_transcendence - Internationalization (i18n)
 * Supports multiple languages: English, Turkish, French
 */

export type Language = 'en' | 'tr' | 'fr';

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
		waiting: 'Waiting for opponent...',
		ready: 'Ready!',
		start: 'Start Game',
		pause: 'Pause',
		resume: 'Resume',
		quit: 'Quit Game',
		victory: 'Victory!',
		defeat: 'Defeat',
		draw: 'Draw',
		score: 'Score',
		playAgain: 'Play Again',
		rematch: 'Rematch',
		backToMenu: 'Back to Menu',
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
		waiting: 'Rakip bekleniyor...',
		ready: 'Hazır!',
		start: 'Oyunu Başlat',
		pause: 'Duraklat',
		resume: 'Devam Et',
		quit: 'Oyundan Çık',
		victory: 'Zafer!',
		defeat: 'Yenilgi',
		draw: 'Berabere',
		score: 'Skor',
		playAgain: 'Tekrar Oyna',
		rematch: 'Rövanş',
		backToMenu: 'Menüye Dön',
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
	},
};

// French translations
const fr: Translations = {
	nav: {
		home: 'Accueil',
		play: 'Jouer',
		tournament: 'Tournoi',
		dashboard: 'Tableau de bord',
		profile: 'Profil',
		settings: 'Paramètres',
		logout: 'Déconnexion',
	},
	auth: {
		login: 'Connexion',
		register: "S'inscrire",
		email: 'Email',
		password: 'Mot de passe',
		confirmPassword: 'Confirmer le mot de passe',
		username: "Nom d'utilisateur",
		forgotPassword: 'Mot de passe oublié?',
		noAccount: "Vous n'avez pas de compte?",
		hasAccount: 'Vous avez déjà un compte?',
		orContinueWith: 'Ou continuer avec',
		loginWithGoogle: 'Connexion avec Google',
		loginWithGithub: 'Connexion avec GitHub',
		loginWith42: 'Connexion avec 42',
	},
	home: {
		title: 'Bienvenue à Pong',
		subtitle: "L'expérience Pong multijoueur ultime",
		playNow: 'Jouer Maintenant',
		joinTournament: 'Rejoindre un Tournoi',
		features: {
			multiplayer: 'Multijoueur en Temps Réel',
			multiplayerDesc: 'Jouez contre des amis ou des inconnus du monde entier',
			tournaments: 'Tournois',
			tournamentsDesc: 'Participez à des tournois passionnants et grimpez au classement',
			ai: 'Adversaire IA',
			aiDesc: "Entraînez-vous contre notre IA difficile quand personne n'est là",
		},
	},
	game: {
		waiting: "En attente d'un adversaire...",
		ready: 'Prêt!',
		start: 'Commencer la Partie',
		pause: 'Pause',
		resume: 'Reprendre',
		quit: 'Quitter la Partie',
		victory: 'Victoire!',
		defeat: 'Défaite',
		draw: 'Égalité',
		score: 'Score',
		playAgain: 'Rejouer',
		rematch: 'Revanche',
		backToMenu: 'Retour au Menu',
	},
	profile: {
		title: 'Profil',
		stats: 'Statistiques',
		matchHistory: 'Historique des Matchs',
		friends: 'Amis',
		wins: 'Victoires',
		losses: 'Défaites',
		winRate: 'Taux de Victoire',
		totalGames: 'Total des Parties',
		editProfile: 'Modifier le Profil',
		changeAvatar: "Changer l'Avatar",
		addFriend: 'Ajouter un Ami',
		online: 'En ligne',
		offline: 'Hors ligne',
		playing: 'En Jeu',
	},
	settings: {
		title: 'Paramètres',
		language: 'Langue',
		theme: 'Thème',
		notifications: 'Notifications',
		privacy: 'Confidentialité',
		deleteAccount: 'Supprimer le Compte',
		exportData: 'Exporter Mes Données',
		anonymize: 'Anonymiser le Compte',
	},
	errors: {
		required: 'Ce champ est obligatoire',
		invalidEmail: 'Adresse email invalide',
		passwordMismatch: 'Les mots de passe ne correspondent pas',
		minLength: 'Doit contenir au moins {min} caractères',
		networkError: 'Erreur réseau. Veuillez réessayer.',
		unauthorized: 'Veuillez vous connecter pour continuer',
		notFound: 'Page non trouvée',
	},
	common: {
		loading: 'Chargement...',
		save: 'Enregistrer',
		cancel: 'Annuler',
		confirm: 'Confirmer',
		delete: 'Supprimer',
		edit: 'Modifier',
		search: 'Rechercher',
		noResults: 'Aucun résultat trouvé',
	},
};

const translations: Record<Language, Translations> = { en, tr, fr };

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
			{ code: 'fr', name: 'Français' },
		];
	}
}

// Export singleton
export const i18n = new I18n();
export const t = (key: string, params?: Record<string, string | number>) => i18n.t(key, params);
export default i18n;
