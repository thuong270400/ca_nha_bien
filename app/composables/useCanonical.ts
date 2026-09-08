export function useCanonical(path: string) {
  const origin = useRequestURL().origin
  useHead({
    link: [{ rel: 'canonical', href: new URL(path, origin).toString() }],
  })
}
