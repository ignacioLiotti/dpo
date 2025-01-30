'use client'
import CustomTable, { ElementRow } from "@/components/Table/custom-table"
import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"

const CACHE_KEY = 'dashboard_data_cache';
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

const fetchMoreData = async (start: number, limit: number = 100): Promise<ElementRow[] | null> => {
  try {
    const res = await fetch(`/api/tagsWithElements?start=${start}&limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error in fetchMoreData:', error);
    return null;
  }
}

interface CustomTableProps {
  fetchedData: ElementRow[];
  onFetchMore: (startIndex: number) => Promise<ElementRow[]>;
}

export default function Page() {
  const [data, setData] = useState<ElementRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to get data from cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);

          // Check if cache is still valid (not expired)
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            setData(cachedData);
            setIsLoading(false);
            return;
          }
        }

        // If no cache or expired, fetch fresh data
        setIsLoading(true);
        const freshData = await fetchMoreData(0, 100);

        if (freshData) {
          // Update state
          setData(freshData);

          // Save to cache with timestamp
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: freshData,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFetchMore = async (startIndex: number) => {
    const newData = await fetchMoreData(startIndex, 100);
    if (newData) {
      // Update cache with new combined data
      const updatedData = [...data, ...newData];
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: updatedData,
        timestamp: Date.now()
      }));
      return newData;
    }
    return [];
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 bg-muted/70">
      <Card className="min-h-[100vh] flex-1 rounded-xl md:min-h-min p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <CustomTable
          />
        )}
      </Card>
      {/* <Card className="min-h-[100vh] flex-1 rounded-xl md:min-h-min p-0" >
            <ExpandableTable />
          </Card> */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
    </div>
  );
}
