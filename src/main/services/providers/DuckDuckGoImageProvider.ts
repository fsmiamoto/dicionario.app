import type { ImageResult, PaginationOptions } from "@shared/types";

export class DuckDuckGoImageProvider {
  private readonly baseUrl = "https://api.duckduckgo.com/";
  private readonly userAgent = "exemplar/1.0.0";

  private async makeRequest(url: string, options: any = {}): Promise<any> {
    // Try to use built-in fetch (Node.js 18+)
    if (typeof globalThis.fetch !== "undefined") {
      const response = await globalThis.fetch(url, options);
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        json: () => response.json(),
        text: () => response.text(),
      };
    }

    // Fallback to Node.js http/https modules
    const { default: https } = await import("https");
    const { default: http } = await import("http");
    const { URL } = await import("url");

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === "https:" ? https : http;

      const req = client.request(
        url,
        {
          method: options.method || "GET",
          headers: options.headers || {},
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            resolve({
              ok: res.statusCode! >= 200 && res.statusCode! < 300,
              status: res.statusCode,
              statusText: res.statusMessage,
              json: () => Promise.resolve(JSON.parse(data)),
              text: () => Promise.resolve(data),
            });
          });
        },
      );

      req.on("error", reject);
      req.end();
    });
  }

  async searchImages(
    query: string,
    safeSearch: boolean = true,
    pagination?: PaginationOptions,
  ): Promise<ImageResult[]> {
    try {
      const searchUrl = new URL(this.baseUrl);
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("format", "json");
      searchUrl.searchParams.set("t", "exemplar");
      searchUrl.searchParams.set("no_html", "1");
      searchUrl.searchParams.set("skip_disambig", "1");

      if (safeSearch) {
        searchUrl.searchParams.set("safe_search", "strict");
      }

      const response = await this.makeRequest(searchUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `DuckDuckGo API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as any;

      // DuckDuckGo's instant answer API doesn't directly provide images in the main response
      // We need to use their image search which requires a different approach
      // For now, let's implement a basic image search using their search results

      // Alternative approach: Use DuckDuckGo's image search endpoint
      return await this.searchImagesAlternative(query, safeSearch, pagination);
    } catch (error) {
      console.error("DuckDuckGo image search error:", error);
      throw error;
    }
  }

  private async searchImagesAlternative(
    query: string,
    safeSearch: boolean,
    pagination?: PaginationOptions,
  ): Promise<ImageResult[]> {
    try {
      // DuckDuckGo doesn't have a public image API, but we can use their search endpoint
      // with a different approach to get image data

      // Use DuckDuckGo's search with specific parameters for images
      const { page = 1, perPage = 6 } = pagination || {};
      const startIndex = (page - 1) * perPage;

      const searchUrl = new URL("https://duckduckgo.com/i.js");
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("o", "json");
      searchUrl.searchParams.set("p", safeSearch ? "1" : "-1");
      searchUrl.searchParams.set("s", startIndex.toString());
      searchUrl.searchParams.set("u", "bing");
      searchUrl.searchParams.set("f", ",,,");
      searchUrl.searchParams.set("l", "us-en");

      const response = await this.makeRequest(searchUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
          Referer: "https://duckduckgo.com/",
        },
      });

      if (!response.ok) {
        console.warn("DuckDuckGo image search failed, using Unsplash fallback");
        return this.getUnsplashImages(query, pagination);
      }

      const data = await response.json();

      // Parse DuckDuckGo response format
      if (data && data.results && Array.isArray(data.results)) {
        const images: ImageResult[] = data.results
          .slice(0, perPage)
          .map((item: any, index: number) => ({
            url:
              item.image ||
              `https://source.unsplash.com/400x300/?${encodeURIComponent(query)}&${index}`,
            thumbnail:
              item.thumbnail ||
              `https://source.unsplash.com/200x150/?${encodeURIComponent(query)}&${index}`,
            title: item.title || `${query} image ${index + 1}`,
            source: this.extractDomain(item.url || "duckduckgo.com"),
          }));

        return images;
      }

      // Fallback to Unsplash if DuckDuckGo format is unexpected
      return this.getUnsplashImages(query, pagination);
    } catch (error) {
      console.error("DuckDuckGo image search error:", error);
      return this.getUnsplashImages(query, pagination);
    }
  }

  private getUnsplashImages(
    query: string,
    pagination?: PaginationOptions,
  ): ImageResult[] {
    // Fallback to Unsplash images
    const { page = 1, perPage = 6 } = pagination || {};
    const startIndex = (page - 1) * perPage;

    return Array.from({ length: perPage }, (_, i) => ({
      url: `https://source.unsplash.com/400x300/?${encodeURIComponent(query)}&${startIndex + i}`,
      thumbnail: `https://source.unsplash.com/200x150/?${encodeURIComponent(query)}&${startIndex + i}`,
      title: `${query} - Image ${startIndex + i + 1}`,
      source: "unsplash.com (fallback)",
    }));
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch {
      return "unknown";
    }
  }

  // Method to validate if the service is available
  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest(this.baseUrl, {
        method: "HEAD",
      });
      return response.ok;
    } catch (error) {
      console.error("DuckDuckGo service availability check failed:", error);
      return false;
    }
  }
}
