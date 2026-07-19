import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-[#F3D888] via-gold to-[#B8912B] text-[#050505] shadow-[0_8px_30px_-8px_rgba(212,175,55,.55)] hover:-translate-y-0.5',
  secondary:
    'border border-white/14 text-ink hover:border-white/40 hover:bg-white/5 hover:-translate-y-0.5',
  ghost: 'text-muted hover:text-ink hover:bg-white/5',
  danger: 'border border-danger/30 text-danger-soft hover:bg-danger/10',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-7 py-3.5 text-[0.92rem]',
  lg: 'px-9 py-4 text-base',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[0.02em] transition-all duration-300 disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
