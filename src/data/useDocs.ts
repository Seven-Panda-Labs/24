import { onSnapshot, type Query } from 'firebase/firestore'
import { useEffect, useState } from 'react'

/**
 * Subscribes to the query `build` returns and gives its documents, or
 * `undefined` until the first snapshot for `key`. `key` names the query: a new
 * key resubscribes. A `null` key subscribes to nothing and gives `[]`. With
 * `waitForServer`, an empty snapshot from the local cache does not count: on a
 * fresh install it says nothing about what the server has. The listener then
 * also takes metadata-only changes, because when the server confirms that a
 * cached empty result is still empty, nothing but the metadata changes.
 *
 * A listener the server refuses is dead for good, so it resubscribes with
 * backoff. That happens right after creating a workspace: the listen on its
 * calendars can reach the server before the workspace write does, and the
 * membership rule refuses it.
 */
export function useDocs<T>(key: string | null, build: () => Query, waitForServer = false): T[] | undefined {
  const [state, setState] = useState<{ key: string; docs: T[] }>()
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!key) return
    let retry: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = onSnapshot(
      build(),
      { includeMetadataChanges: waitForServer },
      (snapshot) => {
        if (waitForServer && snapshot.empty && snapshot.metadata.fromCache) return
        setState({ key, docs: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T) })
      },
      (error) => {
        console.warn(`Listener ${key} failed, retrying`, error.code)
        retry = setTimeout(() => setAttempt((count) => count + 1), Math.min(30_000, 1000 * 2 ** attempt))
      },
    )
    return () => {
      clearTimeout(retry)
      unsubscribe()
    }
    // `build` is a fresh closure every render; `key` is what identifies the query.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])
  if (!key) return []
  return state?.key === key ? state.docs : undefined
}
