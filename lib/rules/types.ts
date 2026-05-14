export type RuleScope = "paragraph" | "document";
export type HighlightKind = "issue" | "improve" | "praise";

export type RuleExample = {
  before: string;
  after?: string;
  note?: string;
};

export type Rule = {
  id: string;
  scope: RuleScope;
  name: string;
  shortDesc: string;
  longDesc: string;
  examples: RuleExample[];
  highlightKind: HighlightKind;
  evalEnabled?: boolean;
};
