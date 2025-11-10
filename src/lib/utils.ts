import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function getYearFromDate(date: string): number {
  return new Date(date).getFullYear();
}

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + "...";
}

export function getRandomColor(): string {
  const colors = [
    "#dc2626", "#d97706", "#65a30d", "#059669", 
    "#0891b2", "#2563eb", "#7c3aed", "#c2410c"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}