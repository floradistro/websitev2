/**
 * Utility function to conditionally join classNames together
 * Similar to clsx but without external dependency
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
