"use client";

import { useEffect, useState } from "react";

interface Element {
  id: number;
  name: string;
  unit: string;
  element_tags: {
    tags: {
      name: string;
    }
  }[];
  prices: {
    price: number;
    valid_from: string;
    valid_to: string | null;
  }[];
}

export default function ElementsPage() {
  const [elements, setElements] = useState<Element[]>([]);

  useEffect(() => {
    fetch("/api/tagsWithElements")
      .then((res) => res.json())
      .then(setElements);
  }, []);

  if (!elements.length) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-4">Elements</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Unit</th>
            <th className="border px-2 py-1">Tags</th>
            <th className="border px-2 py-1">Current Price</th>
            <th className="border px-2 py-1">Valid From</th>
          </tr>
        </thead>
        <tbody>
          {elements.map((element) => (
            <tr key={element.id}>
              <td className="border px-2 py-1">{element.id}</td>
              <td className="border px-2 py-1">{element.name}</td>
              <td className="border px-2 py-1">{element.unit}</td>
              <td className="border px-2 py-1">
                {element.element_tags.map(et => et.tags.name).join(", ")}
              </td>
              <td className="border px-2 py-1">
                {element.prices[0]?.price}
              </td>
              <td className="border px-2 py-1">
                {new Date(element.prices[0]?.valid_from).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}