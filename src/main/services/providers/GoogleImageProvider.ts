import type { ImageResult, PaginationOptions } from "@shared/types";

export class GoogleImageProvider {
  private readonly baseUrl = "https://www.googleapis.com/customsearch/v1";

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
    apiKey: string,
    searchEngineId: string,
    safeSearch: boolean = true,
    pagination?: PaginationOptions,
  ): Promise<ImageResult[]> {
    try {
      if (!apiKey || !searchEngineId) {
        throw new Error(
          "Google Custom Search API key and Search Engine ID are required",
        );
      }

      // Skip credential validation to avoid double API calls

      // Use the most minimal parameters possible
      const { page = 1, perPage = 6 } = pagination || {};
      const start = (page - 1) * perPage + 1; // Google uses 1-based indexing

      const searchParams = new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: query,
        searchType: "image",
        num: perPage.toString(),
        start: start.toString(),
      });

      // Only add safe search if explicitly enabled
      if (safeSearch) {
        searchParams.set("safe", "active");
      }

      const searchUrl = `${this.baseUrl}?${searchParams.toString()}`;
      console.log(
        "Google Custom Search URL:",
        searchUrl.replace(apiKey, "[API_KEY_HIDDEN]"),
      );

      const response = await this.makeRequest(searchUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google Custom Search API Error Details:", {
          status: response.status,
          statusText: response.statusText,
          query: query,
          errorResponse: errorText,
        });

        // If it's a 400 error, try without safe search
        if (response.status === 400 && safeSearch) {
          console.log("Retrying without safe search parameter...");
          return this.searchImages(
            query,
            apiKey,
            searchEngineId,
            false,
            pagination,
          );
        }

        throw new Error(
          `Google Custom Search API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data = (await response.json()) as any;

      if (!data.items || !Array.isArray(data.items)) {
        console.warn("No images found in Google Custom Search response:", data);
        throw new Error("No images found or invalid response format");
      }

      const images: ImageResult[] = data.items.map((item: any) => ({
        url: item.link,
        thumbnail: item.image?.thumbnailLink || item.link,
        title: item.title || `${query} image`,
        source: this.extractDomain(item.displayLink || item.link),
      }));

      return images.slice(0, perPage); // Return requested number of images
    } catch (error) {
      console.error("Google Custom Search image search error:", error);
      throw error;
    }
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch {
      return "unknown";
    }
  }

  async validateCredentials(
    apiKey: string,
    searchEngineId: string,
  ): Promise<boolean> {
    try {
      // Test with the most minimal request possible
      const searchParams = new URLSearchParams({
        key: apiKey,
        cx: searchEngineId,
        q: "test",
        num: "1",
      });

      const searchUrl = `${this.baseUrl}?${searchParams.toString()}`;
      console.log("Validating Google Custom Search credentials...");

      const response = await this.makeRequest(searchUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Credential validation failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        return false;
      }

      const data = await response.json();
      console.log("Credentials validated successfully");
      return true;
    } catch (error) {
      console.error(
        "Google Custom Search credentials validation failed:",
        error,
      );
      return false;
    }
  }

  async getQuotaInfo(
    apiKey: string,
  ): Promise<{ used: number; limit: number } | null> {
    // Google Custom Search API doesn't provide quota info directly
    // This would need to be tracked separately or estimated
    // For now, return null to indicate quota info is not available
    return null;
  }
}
