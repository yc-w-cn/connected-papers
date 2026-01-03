import type {
  AuthorData,
  DataManifest,
  ExportedData,
  Link,
  Node,
  PaperData,
  Statistics,
  VenueData,
} from '@/types/data';

export interface DataLoaderOptions {
  onProgress?: (
    progress: number,
    currentChunk: string,
    statistics?: Statistics,
  ) => void;
  onError?: (error: Error) => void;
}

export interface LoadResult {
  data: ExportedData;
  totalSize: number;
}

export class DataLoader {
  private manifest: DataManifest | null = null;
  private loadedChunks = new Set<string>();
  private totalChunks = 0;
  private loadedSize = 0;

  async load(options: DataLoaderOptions = {}): Promise<LoadResult> {
    try {
      const { onProgress, onError } = options;

      await this.loadManifest();
      this.totalChunks = this.calculateTotalChunks();

      const statistics = await this.loadStatistics();
      this.updateProgress(0, 'statistics', onProgress, statistics);

      const [nodes, links, authors, papers, venues] = await Promise.all([
        this.loadNetworkNodes(onProgress, statistics),
        this.loadNetworkLinks(onProgress, statistics),
        this.loadAuthors(onProgress, statistics),
        this.loadPapers(onProgress, statistics),
        this.loadVenues(onProgress, statistics),
      ]);

      const data: ExportedData = {
        statistics,
        network: {
          nodes: nodes.flat(),
          links: links.flat(),
        },
        authors: authors.flat(),
        papers: papers.flat(),
        venues: venues.flat(),
      };

      onProgress?.(100, '完成', statistics);

      return {
        data,
        totalSize: this.manifest?.totalSize || 0,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      options.onError?.(err);
      throw err;
    }
  }

  private async loadManifest(): Promise<void> {
    const response = await fetch('/connected-papers/data-manifest.json', {
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new Error('加载 manifest 失败');
    }

    this.manifest = await response.json();
  }

  private calculateTotalChunks(): number {
    if (!this.manifest) return 0;

    return (
      1 +
      this.manifest.chunks.networkNodes.length +
      this.manifest.chunks.networkLinks.length +
      this.manifest.chunks.authors.length +
      this.manifest.chunks.papers.length +
      this.manifest.chunks.venues.length
    );
  }

  private async loadStatistics() {
    if (!this.manifest) throw new Error('Manifest 未加载');

    const response = await fetch(
      `/connected-papers/data-chunks/${this.manifest.chunks.statistics.filename}`,
      {
        cache: 'force-cache',
      },
    );

    if (!response.ok) {
      throw new Error('加载统计数据失败');
    }

    this.loadedChunks.add('statistics');
    this.loadedSize += this.manifest.chunks.statistics.size;

    return response.json();
  }

  private async loadNetworkNodes(
    onProgress?: (
      progress: number,
      currentChunk: string,
      statistics?: Statistics,
    ) => void,
    statistics?: Statistics,
  ): Promise<Node[][]> {
    if (!this.manifest) throw new Error('Manifest 未加载');

    const chunks = this.manifest.chunks.networkNodes;
    const results: Node[][] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const response = await fetch(
        `/connected-papers/data-chunks/${chunk.filename}`,
        {
          cache: 'force-cache',
        },
      );

      if (!response.ok) {
        throw new Error(`加载网络节点分片 ${i} 失败`);
      }

      results.push(await response.json());
      this.loadedChunks.add(chunk.filename);
      this.loadedSize += chunk.size;
      this.updateProgress(
        (this.loadedSize / this.manifest.totalSize) * 100,
        chunk.filename,
        onProgress,
        statistics,
      );
    }

    return results;
  }

  private async loadNetworkLinks(
    onProgress?: (
      progress: number,
      currentChunk: string,
      statistics?: Statistics,
    ) => void,
    statistics?: Statistics,
  ): Promise<Link[][]> {
    if (!this.manifest) throw new Error('Manifest 未加载');

    const chunks = this.manifest.chunks.networkLinks;
    const results: Link[][] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const response = await fetch(
        `/connected-papers/data-chunks/${chunk.filename}`,
        {
          cache: 'force-cache',
        },
      );

      if (!response.ok) {
        throw new Error(`加载网络连接分片 ${i} 失败`);
      }

      results.push(await response.json());
      this.loadedChunks.add(chunk.filename);
      this.loadedSize += chunk.size;
      this.updateProgress(
        (this.loadedSize / this.manifest.totalSize) * 100,
        chunk.filename,
        onProgress,
        statistics,
      );
    }

    return results;
  }

  private async loadAuthors(
    onProgress?: (
      progress: number,
      currentChunk: string,
      statistics?: Statistics,
    ) => void,
    statistics?: Statistics,
  ): Promise<AuthorData[][]> {
    if (!this.manifest) throw new Error('Manifest 未加载');

    const chunks = this.manifest.chunks.authors;
    const results: AuthorData[][] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const response = await fetch(
        `/connected-papers/data-chunks/${chunk.filename}`,
        {
          cache: 'force-cache',
        },
      );

      if (!response.ok) {
        throw new Error(`加载作者数据分片 ${i} 失败`);
      }

      results.push(await response.json());
      this.loadedChunks.add(chunk.filename);
      this.loadedSize += chunk.size;
      this.updateProgress(
        (this.loadedSize / this.manifest.totalSize) * 100,
        chunk.filename,
        onProgress,
        statistics,
      );
    }

    return results;
  }

  private async loadPapers(
    onProgress?: (
      progress: number,
      currentChunk: string,
      statistics?: Statistics,
    ) => void,
    statistics?: Statistics,
  ): Promise<PaperData[][]> {
    if (!this.manifest) throw new Error('Manifest 未加载');

    const chunks = this.manifest.chunks.papers;
    const results: PaperData[][] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const response = await fetch(
        `/connected-papers/data-chunks/${chunk.filename}`,
        {
          cache: 'force-cache',
        },
      );

      if (!response.ok) {
        throw new Error(`加载论文数据分片 ${i} 失败`);
      }

      results.push(await response.json());
      this.loadedChunks.add(chunk.filename);
      this.loadedSize += chunk.size;
      this.updateProgress(
        (this.loadedSize / this.manifest.totalSize) * 100,
        chunk.filename,
        onProgress,
        statistics,
      );
    }

    return results;
  }

  private async loadVenues(
    onProgress?: (
      progress: number,
      currentChunk: string,
      statistics?: Statistics,
    ) => void,
    statistics?: Statistics,
  ): Promise<VenueData[][]> {
    if (!this.manifest) throw new Error('Manifest 未加载');

    const chunks = this.manifest.chunks.venues;
    const results: VenueData[][] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const response = await fetch(
        `/connected-papers/data-chunks/${chunk.filename}`,
        {
          cache: 'force-cache',
        },
      );

      if (!response.ok) {
        throw new Error(`加载期刊数据分片 ${i} 失败`);
      }

      results.push(await response.json());
      this.loadedChunks.add(chunk.filename);
      this.loadedSize += chunk.size;
      this.updateProgress(
        (this.loadedSize / this.manifest.totalSize) * 100,
        chunk.filename,
        onProgress,
        statistics,
      );
    }

    return results;
  }

  private updateProgress(
    progress: number,
    currentChunk: string,
    onProgress?: (
      progress: number,
      currentChunk: string,
      statistics?: Statistics,
    ) => void,
    statistics?: Statistics,
  ) {
    const clampedProgress = Math.min(Math.max(progress, 0), 100);
    onProgress?.(clampedProgress, currentChunk, statistics);
  }
}
