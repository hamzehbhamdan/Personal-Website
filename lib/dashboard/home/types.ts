// The app_state "home" document — lightweight, Home-local data.
export interface HomeQuote {
  text: string;
  author?: string;
}

export interface HomeIntention {
  id: string;
  text: string;
  done: boolean;
  date: string; // "YYYY-MM-DD" local — the day this intention belongs to
}

export interface HomeSettings {
  showQuotes: boolean;
  greetingName?: string;
}

export interface HomeState {
  version: number;
  dailyIntentions: HomeIntention[];
  quotes: HomeQuote[];
  settings: HomeSettings;
}
