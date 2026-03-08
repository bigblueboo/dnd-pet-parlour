import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/src/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
  {
    variants: {
      variant: {
        default: 'bg-amber-700 text-amber-50 shadow-sm hover:bg-amber-600',
        secondary: 'border border-stone-800 bg-stone-950 text-stone-200 hover:border-stone-700 hover:bg-stone-900',
        ghost: 'text-stone-300 hover:bg-stone-800 hover:text-stone-100',
        destructive: 'border border-red-900/60 bg-red-950/50 text-red-100 hover:bg-red-950/70',
        outline: 'border border-stone-800 bg-transparent text-stone-300 hover:bg-stone-800 hover:text-stone-100',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
