export type NodeType = 'author' | 'paper' | 'venue';

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  value?: number;
  citationCount?: number;
}

export interface Link {
  source: string;
  target: string;
  type: 'published' | 'cited' | 'appeared_in';
}

export interface AuthorData {
  id: string;
  name: string;
  affiliation?: string;
}

export interface PaperData {
  id: string;
  arxivId: string;
  title?: string;
  abstract?: string;
  publishedDate?: string;
  citationCount?: number;
  journalRef?: string;
}

export interface VenueData {
  id: string;
  venue?: string;
  volume?: string;
  issue?: string;
  pages?: string;
}

export interface NetworkData {
  nodes: Node[];
  links: Link[];
}

export interface Statistics {
  authorCount: number;
  paperCount: number;
  venueCount: number;
}

export interface ExportedData {
  statistics: Statistics;
  network: NetworkData;
  authors: AuthorData[];
  papers: PaperData[];
  venues: VenueData[];
}
