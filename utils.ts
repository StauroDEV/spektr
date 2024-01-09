export const hasOptions = (args: string[]) =>
  args.find((arg) =>
    (arg.startsWith(`--`) || arg.startsWith(`-`)) && arg !== '--' && arg !== '-'
  )
