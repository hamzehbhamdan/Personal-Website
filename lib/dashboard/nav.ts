import type { ViewKey } from "@/components/dashboard/ui";

/** A cross-surface navigation + selection intent (⌘K deep-links, search results). */
export type ViewIntent =
  | { view: "people"; kind: "contact"; id: string }
  | { view: "people"; kind: "newContact" }
  | { view: "people"; kind: "settings" }
  | { view: "coach"; kind: "goal"; id: string }
  | { view: "coach"; kind: "task"; id: string }
  | { view: "brain"; kind: "note"; id: string }
  | { view: "brain"; kind: "compose"; draft?: string }
  | { view: "brain"; kind: "chat"; draft?: string };

export type { ViewKey };
