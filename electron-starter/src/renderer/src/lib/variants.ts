import { type VariantProps, cva } from 'class-variance-authority'

/**
 * Button variants using foundation tokens
 * Follows shadcn/ui patterns with Tailwind v4 tokens
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
        'icon-sm': 'h-6 w-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/**
 * Toggle button variants for radio groups and toggle groups
 */
export const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'hover:bg-muted/40 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        outline:
          'border border-border hover:bg-muted/40 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        ghost:
          'hover:bg-accent/50 hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        subtle: 'hover:bg-muted/20',
      },
      size: {
        default: 'h-8 px-3',
        sm: 'h-6 px-2',
        lg: 'h-10 px-4',
        icon: 'h-8 w-8',
        'icon-sm': 'h-6 w-6',
      },
      selected: {
        true: 'bg-primary/10 text-primary hover:bg-primary/20',
        false: 'text-muted-foreground hover:text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      selected: false,
    },
  },
)

/**
 * Input variants using foundation tokens
 */
export const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'h-10',
        sm: 'h-8 text-xs',
        lg: 'h-12',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
export type ToggleVariants = VariantProps<typeof toggleVariants>
export type InputVariants = VariantProps<typeof inputVariants>
