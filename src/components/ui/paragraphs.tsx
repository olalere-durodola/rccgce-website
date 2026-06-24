/**
 * Renders newline-separated plain text as a sequence of <p> elements,
 * dropping blank lines. Shared by the sermon / event / ministry detail pages
 * so the split/filter/map paragraph block lives in one place.
 */
export function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((para, i) => (
          <p key={i}>{para}</p>
        ))}
    </>
  );
}
