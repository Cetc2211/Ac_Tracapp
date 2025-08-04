
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getPartialLabel = (partial: string | null): string => {
  switch (partial) {
    case '1':
      return 'Primer Parcial';
    case '2':
      return 'Segundo Parcial';
    case '3':
      return 'Tercer Parcial';
    default:
      return '';
  }
};
