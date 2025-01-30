import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="bg-gray-100 p-4">
        <ul className="flex space-x-4">
          <li>
            <Link href="/db/proyectistas">
              Proyectistas
            </Link>
          </li>
          <li>
            <Link href="/db/obras">
              Obras
            </Link>
          </li>
          <li>
            <Link href="/db/empresas">
              Empresas
            </Link>
          </li>
          <li>
            <Link href="/db/inspectores">
              Inspectores
            </Link>
          </li>
        </ul>
      </nav>
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}