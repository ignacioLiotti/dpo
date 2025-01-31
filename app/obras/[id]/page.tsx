'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import TabsComponent from './TabsComponent';

function ObraPage() {
  const pathname = usePathname();
  const id = pathname.split('/').pop(); // Extract the ID from the pathname
  const [obra, setObra] = useState(null);

  useEffect(() => {
    if (id) {
      // Fetch the obra data
      fetch(`/api/obras/${id}`)
        .then((response) => response.json())
        .then((data) => setObra(data))
        .catch((error) => console.error('Error fetching obra:', error));
    }
  }, [id]);

  if (!obra) {
    return <div>Loading...</div>;
  }

  console.log(obra);

  return (
    <div className="flex flex-col bg-muted/70 h-full gap-16 px-11 py-14">
      <TabsComponent
        obra={obra} />
    </div>
  );
}

export default ObraPage;
