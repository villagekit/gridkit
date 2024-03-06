declare module 'debounceify' {
  type AnyAsyncFn = (...args: Array<any>) => Promise<any>
  type AsyncFn<Args, Result> = (...args: Args) => Promise<Result>
  export default function debounceify<Worker extends AnyAsyncFn, Context>(
    worker: Worker,
    context?: Context,
  ): AsyncFn<Parameters<Worker>, Awaited<ReturnType<Worker>>>
}
