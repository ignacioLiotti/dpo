import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/utils';

export interface AnimatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const MotionTextarea = motion.textarea;

const AnimatedTextarea = React.forwardRef<HTMLTextAreaElement, AnimatedTextareaProps>(
  (
    {
      error = false,
      className,
      disabled,
      rows,
      style,
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      onDragStart,
      onDrag,
      onDragEnd,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'rounded-md focus:bg-white border-none focus:bg-none placeholder:text-transparent focus:placeholder:text-muted-foreground focus:outline-none focus:outline-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors font-mono';
    let dynamicClasses = '';

    if (error) {
      dynamicClasses =
        'border-red-500 bg-[repeating-linear-gradient(-60deg,#ef4444,#ef4444_1px,transparent_1px,transparent_6px)] border border-solid focus:bg-red-500/10';
    } else if (!props.value) {
      dynamicClasses =
        'bg-[repeating-linear-gradient(-60deg,#dbdbdb,#dbdbdb_1px,transparent_1px,transparent_6px)] ';
    }

    return (
      <MotionTextarea
        ref={ref}
        disabled={disabled}
        rows={rows ?? 3}
        className={cn(baseClasses, dynamicClasses, className)}
        initial={{ backgroundPositionX: '0px', scale: 1 }}
        animate={error
          ? { backgroundPositionX: ['-14px', '0px'], scale: [1, 1.02, 1] }
          : { backgroundPositionX: '0px', scale: 1 }}
        transition={error
          ? { duration: 1, ease: 'easeOut', repeat: 0, repeatType: 'loop' }
          : undefined}
        style={error ? { backgroundRepeat: 'repeat', ...style } : { ...style }}
        aria-invalid={error}
        aria-disabled={disabled}
        {...props}
      />
    );
  }
);
AnimatedTextarea.displayName = 'AnimatedTextarea';

export { AnimatedTextarea };
export default AnimatedTextarea; 