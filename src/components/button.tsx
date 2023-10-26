import { cn } from 'utils/cn';

export function Button({
  children,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      className={cn(
        'group mt-4 flex w-full items-center justify-center gap-2 rounded-md ',
        'bg-rose-600 px-5 py-3 text-white transition focus:outline-none focus:ring focus:ring-yellow-400 sm:mt-0 sm:w-auto',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
