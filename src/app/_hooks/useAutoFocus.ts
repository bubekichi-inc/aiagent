import { useEffect, useRef, RefObject } from 'react'

/**
 * 要素に自動的にフォーカスを当てるカスタムフック
 * @param shouldFocus フォーカスを当てるかどうかのフラグ（デフォルトはtrue）
 * @param dependencies フォーカスを再適用するための依存配列（デフォルトは空配列）
 * @returns フォーカスを当てる要素への参照
 */
export function useAutoFocus<T extends HTMLElement>(
  shouldFocus: boolean = true,
  dependencies: any[] = [],
): RefObject<T> {
  const elementRef = useRef<T>(null)

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus()
    }
  }, [shouldFocus, ...dependencies])

  return elementRef as RefObject<T>
}
