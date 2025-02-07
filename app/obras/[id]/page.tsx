'use client';

import { useDataItem } from "@/lib/hooks/useDataItem";
import { LoadingPage } from "@/components/loading";
import TabsComponent from "./TabsComponent";

export default function ObraPage({ params }: { params: { id: string } }) {
  const { data: obra, loading, error } = useDataItem("obra", parseInt(params.id));

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!obra) {
    return <div>No se encontró la obra</div>;
  }

  return <TabsComponent obra={obra} />;
}
