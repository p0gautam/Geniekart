import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="container prose">
      <span className="eyebrow">404</span>
      <h1>This page isn’t here.</h1>
      <p>The gift or page may have moved or is not published yet.</p>
      <Link className="button" href="/">
        Back to Geniekart
      </Link>
    </div>
  );
}
