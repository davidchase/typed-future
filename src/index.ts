type Reject<L> = (error: L) => void
type Resolve<R> = (value: R) => void
type Computation<L, R> = (reject: Reject<L>, resolve: Resolve<R>) => void

class Future<L, R> {
  public static of<R>(value: R): Future<never, R> {
    return new Future((_, resolve) => resolve(value))
  }

  public static reject<L>(reason: L): Future<L, never> {
    return new Future(reject => reject(reason))
  }

  constructor(public fork: Computation<L, R>) {}

  public map<B>(f: (value: R) => B): Future<L, B> {
    return this.chain(x => Future.of(f(x)))
  }

  public bimap<A, B>(f: (reason: L) => A, g: (value: R) => B): Future<A, B> {
    return new Future((reject, resolve) =>
      this.fork(
        (reason: L) => reject(f(reason)),
        (value: R) => resolve(g(value))
      )
    )
  }

  public swap(): Future<R, L> {
    return new Future<R, L>((reject, resolve) =>
      this.fork(reason => resolve(reason), value => reject(value))
    )
  }

  public fold<B>(f: (reason: L) => B, g: (value: R) => B): Future<never, B> {
    return new Future((_, resolve) =>
      this.fork(
        (reason: L) => resolve(f(reason)),
        (value: R) => resolve(g(value))
      )
    )
  }

  public mapRej<B>(f: (reason: L) => B): Future<B, R> {
    return this.bimap(f, x => x)
  }

  public chain<B>(f: (value: R) => Future<L, B>): Future<L, B> {
    return new Future((reject, resolve) =>
      this.fork(
        reason => reject(reason),
        (value: R) => f(value).fork(reject, resolve)
      )
    )
  }

  public ap<A, B>(
    this: Future<L, (value: A) => B>,
    m: Future<L, A>
  ): Future<L, B> {
    return this.chain(f => m.map(f))
  }
}
