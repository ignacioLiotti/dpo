import CustomTable from "@/components/Table/custom-table"
import { Card } from "@/components/ui/card"
import { Suspense } from "react"

export default async function Page({ searchParams }: { searchParams: Promise<{ obraId: string }> }) {
  const { obraId } = await searchParams
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 bg-muted/70">
      <Card className="min-h-[100vh] flex-1 rounded-xl md:min-h-min p-0">
        <Suspense fallback={<div className="p-4">Loading...</div>}>
          <CustomTable />
        </Suspense>
      </Card>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
    </div>
  );
}
