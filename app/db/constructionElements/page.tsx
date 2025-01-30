"use client";

import { useEffect, useState } from "react";

interface Element {
  id: number;
  name: string;
  unit: string;
}

export default function ElementsPage() {
  const [elements, setElements] = useState<Element[]>([]);

  useEffect(() => {
    // Call our local route
    fetch("/api/constructionElements")
      .then((res) => res.json())
      .then((data) => {
        setElements(data);
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-4">Elements</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Unit</th>
          </tr>
        </thead>
        <tbody>
          {elements.map((element) => (
            <tr key={element.id}>
              <td className="border px-2 py-1 text-center">{element.id}</td>
              <td className="border px-2 py-1">{element.name}</td>
              <td className="border px-2 py-1">{element.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}