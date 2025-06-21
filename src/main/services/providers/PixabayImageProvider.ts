import type { ImageResult } from "@shared/types";

export class PixabayImageProvider {
  private readonly baseUrl = "https://pixabay.com/api/";

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

  async searchImages(query: string, apiKey?: string): Promise<ImageResult[]> {
    try {
      if (!apiKey) {
        // Return curated images without API key using different approach
        return this.getFallbackImages(query);
      }

      const searchUrl = new URL(this.baseUrl);
      searchUrl.searchParams.set("key", apiKey);
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("image_type", "photo");
      searchUrl.searchParams.set("category", "all");
      searchUrl.searchParams.set("safesearch", "true");
      searchUrl.searchParams.set("per_page", "6");
      searchUrl.searchParams.set("min_width", "200");
      searchUrl.searchParams.set("min_height", "150");

      const response = await this.makeRequest(searchUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "exemplar/1.0.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Pixabay API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (!data.hits || !Array.isArray(data.hits)) {
        throw new Error("No images found or invalid response format");
      }

      const images: ImageResult[] = data.hits.map((item: any) => ({
        url: item.webformatURL || item.largeImageURL,
        thumbnail: item.previewURL,
        title: item.tags || `${query} image`,
        source: "pixabay.com",
      }));

      return images.slice(0, 6);
    } catch (error) {
      console.error("Pixabay image search error:", error);
      return this.getFallbackImages(query);
    }
  }

  private getFallbackImages(query: string): ImageResult[] {
    // Use multiple fallback services for better variety
    const services = [
      "https://source.unsplash.com/400x300/?",
      "https://picsum.photos/400/300?random=",
      "https://loremflickr.com/400/300/",
    ];

    return Array.from({ length: 6 }, (_, i) => {
      const serviceIndex = i % services.length;
      const service = services[serviceIndex];
      const randomParam = Math.floor(Math.random() * 1000);

      return {
        url: `${service}${encodeURIComponent(query)}&${randomParam}`,
        thumbnail: service.includes("unsplash")
          ? `https://source.unsplash.com/200x150/?${encodeURIComponent(query)}&${randomParam}`
          : service.includes("picsum")
            ? `https://picsum.photos/200/150?random=${randomParam}`
            : `https://loremflickr.com/200/150/${encodeURIComponent(query)}?random=${randomParam}`,
        title: `${query} - Image ${i + 1}`,
        source: service.includes("unsplash")
          ? "unsplash.com"
          : service.includes("picsum")
            ? "picsum.photos"
            : "loremflickr.com",
      };
    });
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const searchUrl = new URL(this.baseUrl);
      searchUrl.searchParams.set("key", apiKey);
      searchUrl.searchParams.set("q", "test");
      searchUrl.searchParams.set("per_page", "1");

      const response = await this.makeRequest(searchUrl.toString());
      return response.ok;
    } catch (error) {
      console.error("Pixabay API key validation failed:", error);
      return false;
    }
  }
}
