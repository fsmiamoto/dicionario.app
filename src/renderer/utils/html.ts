import { marked } from "marked";

export const extractHTMLFromReactMarkdown = (explanation: string): string => {
  const tempDiv = document.createElement("div");

  tempDiv.className = "prose prose-invert max-w-none";

  tempDiv.innerHTML = marked.parse(explanation) as string;

  return tempDiv.innerHTML;
};

export const extractHTMLFromDOM = (element: HTMLElement): string => {
  return element.innerHTML;
};
